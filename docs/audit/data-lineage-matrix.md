# G6: Data Lineage Matrix (Linhagem de Dados Ponta-a-Ponta HR Shoes)

> **Matriz de Linhagem da Cadeia UI ↔ Form ↔ Schema Zod ↔ BFF ↔ Postgres SQL ↔ Consumers**

---

## 1. Cadeia de Dados: Produto e Variantes

```
[CAMPO UI EDITORA] (admin.catalogo.produtos.$id.tsx / novo.tsx)
  │ (Input: price_cents, title, brand, status, attributes, variants)
  ▼
[SCHEMA ZOD] (ProductCreateSchema / ProductUpdateSchema)
  ▼
[BFF SERVER FUNCTION] (admin-catalog.functions.ts -> createProduct / updateProduct)
  │ (Injeta store_id via getServerIdentity() e valida Contract Shield)
  ▼
[POSTGRES DB] (Supabase Postgres -> tabelas `products`, `product_variants`, `stock_movements`)
  │ (Insert / Update atômico)
  ▼
[PROPAGAÇÃO VITRINE] (catalog.functions.ts / product.functions.ts -> getProductBySlug)
  │ (Exibe o novo preço / variantes na página pública /produto/$slug)
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

## 3. Cadeia de Dados: Temas e Experiências CMS

```
[BUILDER WYSIWYG / TEMPLATES] (admin.builder.$documentId.editor.tsx / home-templates-library.ts)
  │ (Input: Árvore JSON de blocos + Preset ID)
  ▼
[SCHEMA ZOD] (DocumentUpdateSchema / ApplyHomeTemplateSchema)
  ▼
[BFF SERVER FUNCTION] (builder.functions.ts -> applyHomeTemplate / updateExperienceDocument)
  │ (Atualiza coluna `tree` (JSONB) e grava `experience_versions`)
  ▼
[HIDRATAÇÃO DINÂMICA BFF] (builder.functions.ts -> hydrateBindings)
  │ (Resolve produtos reais, preços em centavos e dados de loja em tempo real)
  ▼
[RENDERIZADOR CANÔNICO] (src/components/commerce/experience-renderer.tsx)
  │ (Mapeia componentes React nativos: Hero, ProductGrid, ImageHotspots, RoutineSteps, Biolink)
```

---

## 4. Matriz de Auditoria de Linhagens

| Entidade / Campo | UI Form | Schema Zod | BFF Handler | Tabela SQL | Storefront Consumer | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `product_price` | `price_cents` | `z.number().int()` | `admin-catalog` | `products.price_cents` | `PriceDisplay` / PDP | `COMPROVADO` |
| `variant_grid` | `selectedSizes/Colors`| Matrix Zod | `admin-catalog` | `product_variants` | PDP Swatches | `COMPROVADO` |
| `cart_reservation`| `handleAddToCart` | `AddToCartSchema` | `cart.functions` | `stock_reservations` | `CartDrawer` | `COMPROVADO` |
| `checkout_order` | `CheckoutForm` | `CheckoutSchema` | `checkout.functions`| `orders` / `order_items`| Order Confirmation | `COMPROVADO` |
