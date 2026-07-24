# G5: Action & Control Inventory (Inventário Canônico de Controles Interativos)

> **Inventário de Controles, Inputs, Mutações e Persistência**
> Este documento audita os controles interativos (botões, formulários, selects, modais e geradores) rastreando da ação do usuário no browser até o banco de dados Supabase.

## Classificações Oficiais
`COMPROVADO` | `PARCIAL` | `QUEBRADO` | `MOCKADO` | `SIMULADO` | `HARDCODADO` | `DUPLICADO` | `OCULTO` | `ÓRFÃO` | `DESCONECTADO` | `NÃO IMPLEMENTADO` | `BLOQUEADO`

---

## 1. Controles Interativos da Vitrine Pública (`_store`)

| Elemento / Componente | Evento do Usuário | Handler / Action Chamado | Validação Zod / Server Boundary | Persistência Real | Status Runtime |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Botão "Adicionar ao Carrinho"** (`_store.produto.$slug.tsx`) | `onClick` | `addToCart` em `cart.functions.ts` | `AddToCartSchema` | Inserção `cart_items` + RPC `reserve_stock_for_cart` | `COMPROVADO` |
| **Selecionador de Tamanho/Cor** (`_store.produto.$slug.tsx`) | `onClick` (Swatch) | Seleção de estado local `selectedAttributes` | Client side match com `variants` | Alimenta a variante no `addToCart` | `COMPROVADO` |
| **Simulador de Frete** (`_store.produto.$slug.tsx`) | `onSubmit` | `calculateShipping` em `shipping.functions.ts` | `z.object({ zipcode: z.string() })` | Consulta regras da tabela `shipping_rules` | `COMPROVADO` |
| **Formulário de Avaliação** (`_store.produto.$slug.tsx`) | `onSubmit` | `submitProductReview` em `social.functions.ts` | `ReviewSchema` | Inserção em `reviews` (status `pending`) | `COMPROVADO` |
| **Botão "Aplicar Cupom"** (`_store.carrinho.tsx`) | `onClick` | `applyCouponToCart` em `cart.functions.ts` | `z.object({ code: z.string() })` | Atualização do campo `coupon_code` em `carts` | `COMPROVADO` |
| **Botão "Finalizar Pedido"** (`_store.checkout.tsx`) | `onSubmit` | `processCheckout` em `checkout.functions.ts` | `CheckoutSchema` | RPC atômica `process_checkout_transaction_v2` | `COMPROVADO` |

---

## 2. Controles Interativos do Painel Administrativo (`admin`)

| Elemento / Componente | Evento do Usuário | Handler / Action Chamado | Validação Zod / Server Boundary | Persistência Real | Status Runtime |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Formulário Criar Produto** (`admin.catalogo.produtos.novo.tsx`) | `onSubmit` | `createProduct` em `admin-catalog.functions.ts` | `ProductCreateSchema` | Inserção em `products`, `product_variants`, `product_media` | `COMPROVADO` |
| **Gerador Rápido de Grade** (`admin.catalogo.produtos.novo.tsx`) | `onClick` (Chips) | Matriz combinatória de Tamanho/Cor | Validação de chaves de atributos | Inserção em lote em `product_variants` + `stock_movements` | `COMPROVADO` |
| **Salvar Alterações Produto** (`admin.catalogo.produtos.$id.tsx`) | `onSubmit` | `updateProduct` em `admin-catalog.functions.ts` | `ProductUpdateSchema` | Atualização relacional na tabela `products` | `COMPROVADO` |
| **Trocar Tema da Vitrine** (`admin.builder.$documentId.editor.tsx`)| `onClick` | `applyHomeTemplate` em `builder.functions.ts` | `z.object({ templateId: z.string() })` | Gravado em `experience_versions` SQL | `COMPROVADO` |
| **Ajuste de Estoque Manual** (`admin.estoque.movimentos.tsx`) | `onSubmit` | `adjustStock` em `stock.functions.ts` | `StockAdjustSchema` | Inserção em `stock_movements` + update `stock_on_hand` | `COMPROVADO` |
| **Abrir/Fechar Caixa PDV** (`admin.caixa.index.tsx`) | `onSubmit` | `openCashSession` / `closeCashSession` | `CashSessionSchema` | Inserção em `cash_sessions` | `COMPROVADO` |
| **Gestão de Colaboradores** (`admin.equipe.index.tsx`) | `onSubmit` | `inviteTeamMember` em `team.functions.ts` | `TeamInviteSchema` | Inserção em `store_members` | `COMPROVADO` |

---

## 3. Controles Especializados / Auxiliares

1. **Botão "Exportar Relatório"** (`admin.relatorios.tsx`) — Cotação de relatórios e exportação CSV (`PARCIAL`).
2. **Input de Desconto Progressivo** (`admin.marketing.ofertas-checkout.tsx`) — Regras de upsell no checkout (`COMPROVADO`).
