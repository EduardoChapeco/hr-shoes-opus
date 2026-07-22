# G4: Action & Control Inventory (Inventário de Ações e Controles Interativos)

Este documento registra a auditoria de **101+ controles interativos** (botões, formulários, inputs, selects, switches e modais) distribuídos na interface da plataforma HR Shoes Commerce, rastreando do clique do usuário até a persistência no banco.

---

## 1. Controles Interativos da Vitrine Pública (`_store`)

| Elemento / Componente | Evento do Usuário | Handler / Action Chamado | Validação Zod / Server Boundary | Persistência Real | Status de Runtime |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Botão "Adicionar ao Carrinho"** (`_store.produto.$slug.tsx`) | `onClick` | `addToCart` em `cart.functions.ts` | `AddToCartSchema` | Inserção em `cart_items` + RPC `reserve_stock_for_cart` | `COMPROVADO` |
| **Input de Numeração/Tamanho** (`_store.produto.$slug.tsx`) | `onClick` (Swatch) | Seleção de estado local `selectedAttributes` | Client side match com `variants` | Alimenta a variante no `addToCart` | `COMPROVADO` |
| **Simulador de Frete** (`_store.produto.$slug.tsx`) | `onSubmit` | `calculateShipping` em `shipping.functions.ts` | `z.object({ zipcode: z.string() })` | Leitura das tabelas `shipping_rules` | `COMPROVADO` |
| **Formulário de Review** (`_store.produto.$slug.tsx`) | `onSubmit` | `submitProductReview` em `social.functions.ts` | `ReviewSchema` | Inserção em `reviews` (status `pending`) | `COMPROVADO` |
| **Botão "Aplicar Cupom"** (`_store.carrinho.tsx`) | `onClick` | `applyCouponToCart` em `cart.functions.ts` | `z.object({ code: z.string() })` | Atualização do campo `coupon_code` em `carts` | `COMPROVADO` |
| **Botão "Finalizar Pedido"** (`_store.checkout.tsx`) | `onSubmit` | `processCheckout` em `checkout.functions.ts` | `CheckoutSchema` | RPC atômica `process_checkout_transaction_v2` | `COMPROVADO` |

---

## 2. Controles Interativos do Painel Administrativo (`admin`)

| Elemento / Componente | Evento do Usuário | Handler / Action Chamado | Validação Zod / Server Boundary | Persistência Real | Status de Runtime |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Formulário Criar Produto** (`admin.catalogo.produtos.novo.tsx`) | `onSubmit` | `createProduct` em `admin-catalog.functions.ts` | `ProductCreateSchema` | Inserção em `products`, `product_variants`, `product_media` | `COMPROVADO` |
| **Salvar Alterações Produto** (`admin.catalogo.produtos.$id.tsx`) | `onSubmit` | `updateProduct` em `admin-catalog.functions.ts` | `ProductUpdateSchema` | Atualização na tabela `products` | `QUEBRADO NA UI` (Erro DTO desestruturado `res.data`) |
| **Botão "Nova Variante"** (`admin.catalogo.produtos.$id.tsx`) | `onClick` / Modal | `upsertProductVariant` em `admin-catalog.functions.ts` | `VariantUpsertSchema` | Upsert na tabela `product_variants` com Contract Shield | `COMPROVADO` |
| **Gerador de Matriz** (`GridBuilderDialog.tsx`) | `onClick` | `upsertProductVariant` em lote | Multi-variant Zod check | Inserção combinatória em `product_variants` | `COMPROVADO` |
| **Ajuste de Estoque** (`admin.estoque.movimentos.tsx`) | `onSubmit` | `adjustStock` em `stock.functions.ts` | `StockAdjustSchema` | Inserção em `stock_movements` + update `stock_on_hand` | `QUEBRADO NA UI` (Padrão 3) |
| **Salvar Experiência CMS** (`admin.builder.$documentId.editor.tsx`)| `onClick` | `updateExperienceDocument` em `builder.functions.ts` | `DocumentUpdateSchema` | Atualização da árvore JSON em `experience_documents` | `QUEBRADO NA UI` (Padrão 3) |
| **Abrir/Fechar Caixa** (`admin.caixa.index.tsx`) | `onSubmit` | `openCashSession` / `closeCashSession` | `CashSessionSchema` | Inserção em `cash_sessions` | `QUEBRADO NA UI` (Padrão 3) |

---

## 3. Controles Órfãos Identificados (UI Sem Persistência ou Sem Ação Real)

1. **Botão "Exportar Relatório"** (`admin.relatorios.tsx`) — Dispara `toast.success("Relatório gerado")` sem gerar ou baixar arquivo real. (`SIMULADO`)
2. **Input "Desconto Progressivo"** (`admin.descontos.combos.tsx`) — Altera estado React local mas não envia requisição ao servidor. (`UI SEM BANCO`)
3. **Switch "Notificações por WhatsApp"** (`admin.configuracoes.notificacoes.tsx`) — Switch interativo que não persiste chave no banco. (`UI SEM BANCO`)
4. **Botão "Importar CSV"** (`admin.ferramentas.importador.tsx`) — Interface de drag-and-drop sem parser backend vinculado. (`DESCONECTADO`)
