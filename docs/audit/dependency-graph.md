# G6: Dependency Graph & Event Flow (Grafo de Dependências e Eventos)

Este documento mapeia o acoplamento entre os serviços do BFF, as rotas do TanStack Router, os eventos do banco PostgreSQL e a invalidação de cache na plataforma HR Shoes Commerce.

---

## 1. Mapeamento de Dependências entre Serviços

```
                     ┌────────────────────────┐
                     │   identity.ts (BFF)    │
                     └───────────┬────────────┘
                                 │
           ┌─────────────────────┼─────────────────────┐
           ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ admin-catalog.fn │  │  cart.functions │  │checkout.functions│
└────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
         │                     │                     │
         ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ stock.functions  │  │shipping.functions│  │promotions.functions
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## 2. Invalidações de Cache Exigidas por Mutação (TanStack Query)

| Operação de Mutação | Serviço BFF Chamado | Chaves de Cache Afetadas (Query Keys) | Efeito Esperado na UI |
| :--- | :--- | :--- | :--- |
| **Atualizar Produto** | `updateProduct` | `["products"]`, `["product", id]`, `["catalog"]` | Atualiza a tabela do Admin e a PDP pública. |
| **Ajustar Estoque** | `adjustStock` | `["stock"]`, `["product", id]`, `["cart"]` | Atualiza o saldo disponível e recalcula itens do carrinho. |
| **Adicionar ao Carrinho**| `addToCart` | `["cart"]`, `["cartCount"]` | Abre o Drawer do Carrinho e atualiza o badge do Header. |
| **Aplicar Cupom** | `applyCouponToCart` | `["cart"]` | Recalcula descontos e subtotal do carrinho. |
| **Processar Checkout** | `processCheckout` | `["cart"]`, `["orders"]`, `["stock"]` | Limpa o carrinho ativo e redireciona para a confirmação. |
| **Salvar Builder** | `updateExperienceDocument` | `["builder", slug]`, `["publicExperience"]` | Atualiza o preview e a renderização da vitrine. |

---

## 3. Disparadores e Funções Atômicas no PostgreSQL (RPCs)

1. `process_checkout_transaction_v2`:
   - **Dependências**: `carts`, `cart_items`, `products`, `product_variants`, `orders`, `order_items`, `stock_movements`, `coupons`, `gift_cards`.
   - **Invariante**: Se o estoque for insuficiente para qualquer item ou o cupom tiver sido esgotado, a transação inteira dá `ROLLBACK`.
2. `reserve_stock_for_cart`:
   - **Dependências**: `product_variants`, `cart_item_reservations`.
   - **Invariante**: Impede que dois clientes adicionem ao carrinho o último item em estoque simultaneamente.
3. `release_stock_for_cart_item`:
   - **Dependências**: `cart_item_reservations`, `product_variants`.
   - **Invariante**: Decrementa `stock_reserved` ao remover item do carrinho ou expirar o tempo limite.
