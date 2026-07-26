# G6: Contract Audit (Auditoria Canônica de Contratos Zod & DTOs HR Shoes)

> **Auditoria Completa de Contratos, Schemas Zod, Entradas e Saídas do BFF**

---

## 1. Mapeamento de Contratos por Módulo

| Módulo         | Nome do Schema Zod / DTO  | Input Validado                                         | Retorno do BFF                    | Status do Contrato |
| :------------- | :------------------------ | :----------------------------------------------------- | :-------------------------------- | :----------------- |
| **Catálogo**   | `ProductCreateSchema`     | `{ title, slug, price_cents, category_ids, variants }` | `ProductDTO`                      | `COMPROVADO` (Matriz sincronizada via batchUpsertVariantMatrixHandler integrado) |
| **Catálogo**   | `ProductUpdateSchema`     | `{ id, title, price_cents, attributes, variants }`     | `ProductDTO`                      | `COMPROVADO` (A ignorância de variants foi mitigada, garantindo atualização atômica da matriz) |
| **Carrinho**   | `AddToCartSchema`         | `{ variantId?, productId?, quantity, sellerId? }`      | `{ status, cart, session_token }` | `COMPROVADO` (Estoque resolvido via stock_on_hand e pg_advisory_xact_lock) |
| **Carrinho**   | `UpdateCartQtySchema`     | `{ variantId, delta }`                                 | `CartDTO`                         | `COMPROVADO` (Estoque resolvido via stock_on_hand e pg_advisory_xact_lock) |
| **Checkout**   | `CheckoutSchema`          | `{ items, shippingAddress, paymentMethod }`            | `{ orderId, status }`             | `COMPROVADO` (Processamento atômico, Mock do Gateway erradicado, Pagar.me V5 real) |
| **Estoque**    | `StockAdjustSchema`       | `{ variantId, qty, type, note }`                       | `StockMovementDTO`                | `COMPROVADO`       |
| **Builder**    | `ApplyHomeTemplateSchema` | `{ templateId }`                                       | `ExperienceDocumentDTO`           | `COMPROVADO` (Vazamento corrigido, valida RLS do tenant via db) |
| **Builder**    | `DocumentUpdateSchema`    | `{ documentId, tree }`                                 | `ExperienceDocumentDTO`           | `COMPROVADO` (Vazamento corrigido, nós atrelados à versão validada) |
| **Avaliações** | `ReviewSubmitSchema`      | `{ productId, rating, comment, title }`                | `ReviewDTO`                       | `COMPROVADO`       |
| **Caixa**      | `CashSessionSchema`       | `{ initialBalanceCents, notes }`                       | `CashSessionDTO`                  | `COMPROVADO`       |

---

## 2. Invariantes de Contrato Garantidos

1. **Campos Financeiros**: Sempre expressos em inteiros (`price_cents`, `cost_cents`, `discount_cents`). Proibido `float`.
2. **UUID Security**: Validação com `z.string().uuid()` para todas as chaves primárias e estrangeiras.
3. **Strict Attributes Shield**: Matriz de variantes deve possuir exatamente o mesmo conjunto de chaves de atributos (`Contract Shield`).
4. **Tratamento de Exceções Nativo**: Lançamento de erros nativos `throw new Error(...)` no BFF sem envelopar mensagens de erro em objetos vazios.
