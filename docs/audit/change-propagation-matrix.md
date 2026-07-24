# G8: Change Propagation Matrix (Matriz de Propagação HR Shoes)

> **Matriz de Sincronização, Invalidação de Cache e Propagação de Mutações**

---

## 1. Mapeamento de Eventos e Propagações

| Evento Produtor | Origem da Mutação | Consumidores Afetados | Estratégia de Invalidação / Sincronização |
| :--- | :--- | :--- | :--- |
| **Produto Atualizado** | Admin `/admin/catalogo/produtos/$id` | Catálogo, Vitrine, Builder, Carrinho, Buscas | `router.invalidate()` + `queryClient.invalidateQueries(["products"])` + `hydrateBindings` no Builder. |
| **Preço/Estoque Alterado**| Admin `/admin/estoque` ou PDV | PDP, Vitrine, Carrinho, Reserva Checkout | Revalidação dinâmica no BFF + RPC `reserve_stock_for_cart` no checkout. |
| **Item no Carrinho Add** | Storefront PDP / Vitrine | CartDrawer, Header Cart Badge, Checkout | `setCartData(updatedCart)` + `router.invalidate()`. |
| **Tema Aplicado** | Admin `/admin/builder/.../editor` | Canvas Editor, Home Pública | Inserção em `experience_versions` + `queryClient.invalidateQueries(["experience"])`. |
| **Pedido Criado** | Storefront Checkout | Admin Pedidos, Estoque, CRM Clientes | Subtração atômica em `product_variants` + `queryClient.invalidateQueries(["orders"])`. |
