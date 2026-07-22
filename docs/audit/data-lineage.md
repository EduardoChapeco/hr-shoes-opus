# G5: Data Lineage (Linhagem Ponta-a-Ponta dos Dados)

Este documento constrói o rastreamento completo da cadeia de dados da plataforma HR Shoes Commerce, desde o campo da UI até a persistência no banco e propagação para os consumidores dependentes.

---

## 1. Cadeia de Dados: Produto e Variantes

```
[CAMPO UI EDITORA] (admin.catalogo.produtos.$id.tsx)
  │ (Input: price_cents, title, brand, status, attributes)
  ▼
[SCHEMA ZOD] (z.object({ price_cents: z.number().int().min(0), ... }))
  ▼
[BFF SERVER FUNCTION] (updateProduct em admin-catalog.functions.ts)
  │ (Injeta store_id via getServerIdentity())
  ▼
[REPOSITÓRIO / DB] (Supabase Postgres -> tabela `products` e `product_variants`)
  │ (RPC / Insert / Update)
  ▼
[PROPAGAÇÃO VITRINE] (product.functions.ts -> getProductBySlug)
  │ (Exibe o novo preço / variante na página pública /produto/$slug)
  ▼
[PROPAGAÇÃO CARRINHO] (cart.functions.ts -> fetchCartDTO)
  │ (Revalida o preço snapshot com a variante atualizada)
  ▼
[PROPAGAÇÃO CHECKOUT] (checkout.functions.ts -> process_checkout_transaction_v2)
  │ (RPC grava unit_price_cents final no pedido)
```

---

## 2. Cadeia de Dados: Inventário e Disponibilidade

```
[MOVIMENTO DE ESTOQUE] (stock.functions.ts -> adjustStock)
  │ (Input: variant_id, qty, movement_type: 'adjustment' | 'purchase' | 'loss')
  ▼
[SCHEMA ZOD] (StockAdjustSchema)
  ▼
[POSTGRES TRANSACTION] (Tabela `stock_movements`)
  │ (Trigger / RPC atualiza `product_variants.stock_on_hand`)
  ▼
[INVARIANTE DE DOMÍNIO] (available = stock_on_hand - stock_reserved)
  │ (Derivado dinamicamente pelo servidor; NUNCA salvo direto)
  ▼
[RESERVA ATÔMICA] (cart.functions.ts -> reserve_stock_for_cart)
  │ (RPC incrementa `stock_reserved` por 15 minutos ao adicionar ao carrinho)
  ▼
[CHECKOUT COMMIT] (checkout.functions.ts -> process_checkout_transaction_v2)
  │ (Subtrai `stock_on_hand` e decrementa `stock_reserved` atomicamente)
```

---

## 3. Cadeia de Dados: Experiências CMS e Builder

```
[BUILDER WYSIWYG EDITOR] (admin.builder.$documentId.editor.tsx)
  │ (Input: Árvore JSON de blocos com props e estilos)
  ▼
[SCHEMA ZOD] (DocumentUpdateSchema)
  ▼
[BFF SERVER FUNCTION] (builder.functions.ts -> updateExperienceDocument)
  │ (Atualiza coluna `tree` (JSONB) na tabela `experience_documents`)
  ▼
[PROPAGAÇÃO DE VITRINE] (builder.functions.ts -> getPublicExperienceDocumentBySlug)
  │ (Lê o documento publicado por slug e document_type)
  ▼
[RENDERIZADOR CANÔNICO] (src/components/commerce/experience-renderer.tsx)
  │ (Mapeia componentes React nativos: Hero, ProductGrid, TrustBadges, Biolink)
```

---

## 4. Classificação de Cadeias Incompletas (Diagnóstico)

1. **Cadeia de Notificações WhatsApp**: O campo de telefone/opt-in existe na UI do cliente, mas a fila de envio de mensagens no backend não possui provedor configurado. (`CADEIA INCOMPLETA`)
2. **Cadeia de Impressão de Recibo**: A rota `admin_.pedidos.$id.recibo.tsx` renderiza o recibo, mas não busca a transação de caixa correspondente em `cash_movements`. (`CADEIA INCOMPLETA`)
3. **Cadeia de Avaliação de Produto**: O cliente submete a avaliação (`reviews`), mas o painel Admin não possui tela para moderar/aprovar a review pendente, dependendo de alteração direta via banco SQL. (`CADEIA INCOMPLETA`)
