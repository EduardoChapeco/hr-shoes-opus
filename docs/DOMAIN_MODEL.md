# Modelo de Domínio — Hr Shoes Commerce

Documento canônico de entidades, relações, invariantes e máquinas de estado. Fase 0.

Convenções gerais: identificadores internos são UUID; dinheiro é inteiro em centavos + `currency`; datas são ISO UTC persistidas, exibidas em `America/Sao_Paulo`; toda tabela carrega `organization_id` (e `store_id` quando aplicável) para isolamento multi-tenant; toda tabela sensível possui RLS deny-by-default.

## 1. Organização, lojas, locais e usuários

```text
Organization (1) ──< Store (N) ──< Location (N)
Organization (1) ──< Membership (N) >── User (N)
Store (1) ──< Membership (N)   [membership pode ser escopada por store]
```

- **Organization**: entidade raiz de tenant. `id (uuid)`, `name`, `document (CNPJ, opcional)`, timestamps.
- **Store**: canal de venda dentro da organização (pode haver mais de uma loja/marca). `organization_id`, `slug` único por organização.
- **Location**: ponto físico/logístico (loja física, CD, ponto de retirada). Usada por inventário e por frete "retirada".
- **User**: identidade de autenticação (Supabase Auth). Não guarda papel diretamente.
- **Membership**: vínculo `user_id` + `organization_id` (+ opcional `store_id`) + `role`.
  - Roles: `owner`, `admin`, `manager`, `seller`, `stock`, `finance`, `content`, `support`, `customer`.
  - Invariante: um usuário pode ter múltiplos memberships (uma por organização/loja), mas nunca dois memberships ativos duplicados para o mesmo escopo.
  - `customer` é o papel padrão de um usuário final comprador e não concede acesso administrativo.

## 2. Catálogo

```text
ProductType (versionado) ──< ProductTypeVersion ──< FieldDefinition
        │
        ▼
     Product ──< ProductOption ──< ProductOptionValue
        │
        ▼
   ProductVariant (SKU único) ──< VariantMedia
        │
Category (árvore, parent_id) >──< ProductCategory >──< Product
Collection >──< ProductCollection >──< Product
```

### 2.1 ProductType e FieldDefinition (schema de atributos versionado)

- **ProductType**: define um "tipo" de produto (ex.: Tênis, Bolsa, Acessório). Possui versões; cada `Product` referencia uma `product_type_version_id` fixa no momento da criação/edição, garantindo que alterações futuras do tipo não reescrevam produtos existentes silenciosamente.
- **ProductTypeVersion**: snapshot imutável do schema de atributos (equivalente a um JSON Schema). Uma nova versão é criada a cada alteração estrutural; versões antigas nunca são editadas, apenas superadas.
- **FieldDefinition**: campo do tipo, com:
  - `kind`: `text | rich_text | number | measure | boolean | date | select_single | select_multi | color | size | reference | file`
  - flags: `required`, `filterable`, `comparable`, `displayable`
  - `unit` (para `measure`), `options` (para `select_*`/`color`/`size`), `reference_target` (para `reference`).
- Invariante: um FieldDefinition marcado `required` não pode ser removido de uma versão publicada; apenas descontinuado em nova versão.

### 2.2 Product, Option e Variant

- **Product**: núcleo genérico — nome, descrição, `product_type_version_id`, status (`draft | active | archived`), SEO, atributos preenchidos conforme `FieldDefinition`.
- **ProductOption / ProductOptionValue**: eixos de variação (ex.: Cor, Tamanho) e seus valores possíveis.
- **ProductVariant**: combinação concreta de valores de opção.
  - `id (uuid)`, `sku` único globalmente (por organização), `barcode` opcional, `price_override_cents` (nulo = usa preço base do produto), `cost_cents`, `weight_grams`, `dimensions`, `status (active | inactive)`.
  - Invariante: `sku` é único e imutável após criação; não é reaproveitado mesmo após arquivamento (evita colisão com históricos de pedido).

### 2.3 Categoria, coleção e mídia

- **Category**: árvore via `parent_id`, `ordering`, imagem, campos de SEO. Invariante: sem ciclos (validado no serviço antes de persistir `parent_id`).
- **Collection**: agrupamento não hierárquico e não exclusivo de produtos (curadoria, campanhas).
- **MediaAsset**: ver seção 8 (mídia).

## 3. Inventário

```text
ProductVariant (1) ──< InventoryLevel (N, por Location) 
InventoryLevel: available = on_hand - reserved (derivado)
ProductVariant + Location ──< InventoryMovement (append-only)
```

- **InventoryMovement** (imutável, append-only): `type ∈ { purchase, sale, reserve, release, return, exchange_in, exchange_out, adjustment, transfer, damage }`, `quantity`, `variant_id`, `location_id` (+ `location_id_destination` para `transfer`), `reference` (pedido/documento), `created_at`, `created_by`.
- **InventoryLevel**: saldo materializado por `(variant_id, location_id)`: `on_hand`, `reserved`. **Nunca editado diretamente** — todo saldo é recalculado/atualizado exclusivamente como efeito de um `InventoryMovement` gravado na mesma transação.
- **Reservation**: reserva de estoque com `expires_at`; ao expirar sem confirmação, um job libera a quantidade via movimento `release`.
- Invariante central: `available = on_hand - reserved` é sempre derivado, nunca uma coluna independente editável.

## 4. Pedidos (Order) — snapshots e máquina de estados

- Um `Order` congela, no momento da criação/confirmação, **snapshots imutáveis** de: produto/variante (nome, SKU, atributos exibidos), preço unitário praticado, descontos aplicados, endereço de entrega, método e valor de frete cotado. Alterações futuras no catálogo não afetam pedidos já criados.
- `OrderItem` guarda o snapshot por linha; nunca faz join "ao vivo" com o catálogo para exibir um pedido histórico.
- Totais (`subtotal_cents`, `discount_cents`, `shipping_cents`, `total_cents`) são sempre recomputados no servidor a cada transição relevante, nunca confiando em total enviado pelo cliente.

```text
                         ┌─────────┐
                         │  draft  │
                         └────┬────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
  ┌───────────────────────────┐   ┌───────────────────────┐
  │ awaiting_shipping_quote    │   │ awaiting_payment       │
  └────────────┬───────────────┘   └───────────┬────────────┘
               └──────────────┬─────────────────┘
                               ▼
                         ┌───────────┐
                         │   paid     │◄─────────────┐ (retry)
                         └─────┬──────┘               │
                               ▼                      │
                        ┌─────────────┐        ┌──────┴───────┐
                        │ processing  │        │ payment_failed│
                        └──────┬──────┘        └───────────────┘
               ┌───────────────┴────────────────┐
               ▼                                 ▼
     ┌───────────────────┐             ┌───────────────┐
     │ ready_for_pickup    │             │   shipped     │
     └──────────┬──────────┘             └───────┬───────┘
                └───────────────┬─────────────────┘
                                 ▼
                          ┌────────────┐
                          │ delivered  │
                          └─────┬──────┘
                                ▼
                          ┌────────────┐
                          │ completed  │
                          └────────────┘

  Transições transversais autorizadas a partir de estados não terminais:
    * → cancelled     (antes de shipped/delivered, conforme política de role)
    delivered/completed → returned
    returned → refunded
```

- Invariante: toda transição é validada por uma tabela de transições autorizadas por estado de origem/destino e por role; transições fora da tabela são rejeitadas com erro `conflict`.
- Invariante: `cancelled`, `refunded` liberam reservas/estoque associado via `InventoryMovement` (`release`/`return`), nunca por edição direta de saldo.
- Estados terminais: `completed`, `cancelled`, `refunded`. `returned` é intermediário até virar `refunded` (ou reposição via troca).

## 5. Frete (Shipping)

- **Pickup**: retirada em `Location`, sem cálculo de frete monetário.
- **Manual table**: tabela de faixas (CEP/região/peso) mantida pela loja.
- **Manual quote**: cotação manual registrada por um operador, com `expires_at` e snapshot do valor cotado; se expirar antes da confirmação do pedido, exige nova cotação.
- **Provider adapters** (futuro): interface comum para integração com transportadoras/serviços de cotação automática; enquanto não configurado, o `integration_connections.status` permanece `unconfigured` e a opção não é oferecida ao cliente (nunca simular sucesso).

## 6. Pagamentos

```text
PaymentProvider (interface) → { MercadoPagoAdapter | AsaasAdapter | StripeAdapter }

Order (1) ──< Payment (N, tentativas de pagamento agregadas)
Payment (1) ──< PaymentAttempt (N)
Webhook recebido → deduplicado por provider_event_id → atualiza Payment/Order
```

- **Payment**: intenção/registro de cobrança vinculado a um `Order`, com `status` (`pending | authorized | paid | failed | refunded | cancelled`) e `provider`, `provider_payment_id` em campo próprio (nunca reaproveitando `id` interno).
- **PaymentAttempt**: cada tentativa (inclusive falhas) é registrada de forma append-only para auditoria e conciliação.
- **Webhook**: eventos recebidos de provedores são deduplicados por `provider_event_id`; reprocessar o mesmo evento é no-op idempotente.
- **Comprovante manual (proof)**: upload de comprovante com `status ∈ { pending_review, accepted, rejected }`, revisado por role `finance`.
- **Carnê** (carteira de parcelamento interno): `CarneSchedule` ──< `CarneInstallment` ──< `CarneReceipt`. Parcelas em atraso (`overdue`) são calculadas a partir de `due_date` vs. data atual, nunca por flag editável manualmente.
- **Crédito de cliente / Gift card**: saldo é sempre derivado de um ledger append-only (`CreditLedgerEntry` / `GiftCardLedgerEntry`); resgate de gift card é uma operação atômica única (um mesmo código não pode ser resgatado em paralelo além do saldo disponível — controle via transação com bloqueio/checagem de saldo antes do commit). Código do gift card é armazenado como hash; o token entregue ao portador é opaco e não reversível para o hash.

Invariante geral de pagamentos/créditos/caixa: **nenhum saldo é editado diretamente; todo saldo é resultado de agregação sobre um ledger append-only.**

## 7. CMS

```text
Page ──< PageVersion ──< SectionInstance
Page + Channel → no máximo 1 PageVersion com status = published
NavigationMenu, ThemeSettings: versionados por loja
```

- **Page**: entidade estável (slug, tipo). **PageVersion**: conteúdo versionado e imutável após publicação (nova edição gera nova versão em rascunho).
- Invariante: **exatamente uma versão publicada por página e por canal** em um dado instante; publicar uma nova versão despublica atomicamente a anterior na mesma transação.
- **SectionInstance**: blocos de conteúdo ordenados dentro de uma versão.
- **NavigationMenu**, **ThemeSettings**: configuração de loja, também versionados para permitir rollback.

## 8. Mídia

- **MediaAsset**: arquivo original preservado sempre; durante upload permanece privado (sem URL pública) até validação real de MIME e processamento assíncrono.
- Derivativos gerados de forma assíncrona: variantes WebP/AVIF em múltiplos tamanhos, com ponto focal (`focal_point_x/y`) para recorte responsivo.
- Acesso a arquivos privados apenas via URL assinada com expiração curta.
- Invariante: o arquivo original nunca é sobrescrito pelos derivativos; falha de processamento não expõe o asset como pronto.

## 9. Histórias, perfil público, avaliações, chat

- **Story**: conteúdo efêmero/vitrine, vinculado a `Store`.
- **PublicProfile/Portfolio**: página pública de vendedor/loja.
- **Review**: `status ∈ { pending, approved, rejected }`; `verified_purchase` calculado a partir de existência de `Order` `completed` do autor para o produto, nunca autodeclarado.
- **ChatThread**/`ChatMessage`: conversa entre `customer` e `support`/`seller`, com participantes e histórico imutável de mensagens.

## 10. Caixa (cash management)

```text
CashRegister (equipamento/ponto) ──< CashShift (abertura/fechamento) ──< CashEntry (append-only)
CashShift ──< Settlement (fechamento consolidado)
```

- **CashEntry**: append-only (entradas/saídas de caixa vinculadas ou não a um pedido).
- **CashShift**: turno de caixa com `opened_at`/`closed_at`, saldo inicial e saldo apurado ao fechar (comparado ao saldo esperado calculado a partir dos `CashEntry`, nunca editado manualmente sem gerar um `CashEntry` de ajuste auditável).
- **Settlement**: consolidação de um ou mais turnos para fins financeiros/contábeis.

## 11. Comissões

- **CommissionRule**: versionada; cálculo de comissão de venda é sempre feito **no servidor** no momento da confirmação do pedido, usando a versão da regra vigente naquele momento (snapshot na comissão gerada).
- **Commission**: gerada por pedido/vendedor; em caso de cancelamento/devolução do pedido associado, gera **estorno (reversal)** como novo lançamento, nunca edição/exclusão da comissão original.

## 12. Cupons

- **Coupon**: código, tipo (percentual/valor fixo/frete grátis), regras de elegibilidade, limites de uso (total e por cliente), validade.
- Validação e aplicação de cupom sempre recalculada no servidor no momento do checkout; nunca confiar em desconto calculado no cliente.

## 13. LGPD — consentimentos

- **Consent**: registrado por `(user_id, purpose, policy_version)`, com timestamp e forma de coleta. Novo texto de política gera nova `policy_version`; consentimentos antigos permanecem imutáveis como histórico, novo consentimento é solicitado explicitamente.

## 14. Auditoria e outbox (transversais)

- **AuditLog**: append-only, registra ator, ação, entidade afetada, timestamp, `correlation_id`; nunca editável ou removível por rotina de aplicação.
- **OutboxEvent**: append-only, com `status (pending | delivered | dead_letter)`, tentativas e próxima janela de retry (backoff exponencial).

## 15. Invariantes gerais (resumo)

1. Nenhum saldo (estoque, crédito, gift card, caixa) é editado diretamente — sempre derivado de um ledger append-only.
2. Snapshots de pedido (preço, produto, endereço, frete) são imutáveis após criação da linha.
3. Toda transição de estado de pedido é validada contra tabela de transições autorizadas.
4. No máximo uma versão de página publicada por página/canal a qualquer momento.
5. SKU de variante é único e nunca reaproveitado.
6. Webhooks são idempotentes via `provider_event_id`.
7. Toda entidade sensível carrega `organization_id`/`store_id` para isolamento multi-tenant.
