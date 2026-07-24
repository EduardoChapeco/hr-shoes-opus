# G10: Storage & RLS Matrix (Matriz Canônica de Storage e Segurança RLS)

> **Matriz Oficial de Buckets, RLS Supabase e Políticas de Isolamento Multi-Tenant**

---

## 1. Buckets do Supabase Storage

| Nome do Bucket | Acesso | MIME Permitidos | Max Size | Entidade Vinculada | Políticas RLS Aplicadas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `product-media` | Público | `image/*`, `video/mp4` | 10 MB | `product_media.url` | Leitura pública; escrita restrita a staff autenticado. |
| `store-assets` | Público | `image/*`, `image/svg+xml` | 5 MB | `stores.logo_url` | Leitura pública; escrita restrita a owner/admin da loja. |
| `builder-assets`| Público | `image/*`, `video/mp4` | 10 MB | `experience_documents.tree` | Leitura pública; escrita restrita a content/admin. |
| `review-media` | Público | `image/*` | 5 MB | `reviews.media_urls` | Leitura pública anon; escrita restrita a clientes com pedido. |
| `receipts` | Privado | `application/pdf`, `image/*` | 5 MB | `orders.receipt_url` | Leitura/Escrita por Signed URL com expiração 15min. |

---

## 2. Matriz de Row Level Security (RLS) por Tabela

| Tabela PostgreSQL | Leitura Anon | Inserção Staff | Atualização Staff | Exclusão Staff | Isolamento Tenant |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `products` | Apenas `published` | Sim (`store_id`) | Sim (`store_id`) | Sim (`store_id`) | Estrito por `store_id` |
| `product_variants` | Active variants | Sim | Sim | Sim | Herdado de `products` |
| `carts` / `cart_items` | Privado por sessão | Sim | Sim | Sim | Por `customer_id`/`session_token` |
| `orders` / `order_items`| Por `public_token` | Sim (via RPC) | Sim (Staff) | Negado | Estrito por `store_id` |
| `experience_documents` | Published version | Sim (`content`) | Sim (`content`) | Sim (`content`) | Estrito por `store_id` |
