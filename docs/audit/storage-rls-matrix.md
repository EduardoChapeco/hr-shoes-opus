# G7: Storage & RLS Matrix (Matriz de Storage, Buckets e Políticas de Segurança)

Este documento registra o inventário dos buckets do Supabase Storage, suas políticas de Row Level Security (RLS) e as regras de autorização no banco de dados Postgres da plataforma HR Shoes Commerce.

---

## 1. Buckets do Supabase Storage

| Nome do Bucket | Acesso | Tipos MIME Permitidos | Tamanho Máximo | Vínculo de Entidade | Políticas RLS Aplicadas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `products` | Público | `image/jpeg`, `image/png`, `image/webp`, `video/mp4` | 10 MB | `product_media.url` | Leitura pública anon; inserção/exclusão apenas por staff com `store_id`. |
| `store-assets` | Público | `image/jpeg`, `image/png`, `image/svg+xml` | 5 MB | `stores.logo_url`, `stores.banner_url` | Leitura pública anon; upload restrito a `owner` / `admin` da loja. |
| `builder-assets`| Público | `image/jpeg`, `image/png`, `image/webp` | 8 MB | `experience_documents.tree` | Leitura pública anon; upload restrito a perfil `content` / `admin`. |
| `receipts` | Privado | `application/pdf`, `image/jpeg`, `image/png` | 5 MB | `orders.receipt_url` | Leitura e upload restritos ao cliente dono do pedido ou staff autorizado. |

---

## 2. Matriz de Autorização e RLS no PostgreSQL

| Tabela SQL | Leitura Anon | Inserção Staff | Atualização Staff | Exclusão Staff | Isolamento de Tenant |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `products` | Apenas `published` | Sim (`store_id`) | Sim (`store_id`) | Sim (`store_id`) | Obrigatoriamente por `store_id` |
| `product_variants` | Apenas `status: active` | Sim | Sim | Sim | Herdado via `product_id` -> `store_id` |
| `carts` | Privado por sessão/user | Sim | Sim | Sim | Por `customer_id` ou `session_token` |
| `orders` | Apenas via `public_token` | Sim (via RPC Atômica) | Sim | Sim (Staff) | Por `customer_id` / `store_id` |
| `cash_sessions` | Negado (Deny) | Sim (`finance`) | Sim (`finance`) | Negado | Obrigatoriamente por `store_id` |
| `experience_documents` | Apenas `published` | Sim (`content`) | Sim (`content`) | Sim (`content`) | Obrigatoriamente por `store_id` |

---

## 3. Diagnóstico de RLS e Signed URLs

1. **Uploads Inline de Mídia**: O bucket `products` exige validação do tipo MIME e sanitização de nome de arquivo no servidor para evitar sobrescrita de imagens de outros produtos.
2. **Visualização de Recibos Privados**: O bucket `receipts` utiliza **Signed URLs** com validade de 15 minutos para que os recibos de transferência PIX/Boleto não fiquem expostos publicamente na web.
