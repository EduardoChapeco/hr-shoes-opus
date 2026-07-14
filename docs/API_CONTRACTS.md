# Contratos de API — Hr Shoes Commerce (v1)

Contratos versionados da camada BFF/server-function (`createServerFn` e rotas sob `src/routes/api`). Consumidos exclusivamente pela camada de serviços de domínio (`/services`), nunca diretamente por componentes React.

Convenções globais:

- Todos os contratos abaixo pertencem à versão **v1**; mudanças incompatíveis exigem `v2` publicada em paralelo.
- Todo valor monetário é `{ amount_cents: number (integer), currency: "BRL" }`. Nunca ponto flutuante.
- Toda data é ISO 8601 UTC (`created_at`, `updated_at`, `expires_at`, etc.); conversão para `America/Sao_Paulo` é responsabilidade exclusiva da apresentação.
- Toda resposta é envolvida em um envelope padrão de sucesso/erro (seção 1).
- Respostas nunca incluem segredos (tokens de provedor, chaves de API, hashes de senha/código) nem PII além do estritamente necessário ao caso de uso do chamador autenticado.
- Toda operação mutável de caráter financeiro, de estoque ou de pedido **exige** `idempotency_key` (string, UUID recomendado) no corpo da requisição; repetir a mesma chave com o mesmo payload retorna o resultado original sem reexecutar efeitos colaterais; reutilizar a chave com payload divergente retorna erro `idempotency_key_conflict`.
- Marcação de status de implementação:
  - **[Fase 0 — contrato apenas]**: schema definido e congelado, sem implementação funcional ainda.
  - **[Implementação inicial]**: previsto para implementação já no curto prazo pós-Fase 0.

## 1. Envelope de resposta

```ts
type ApiSuccess<T> = {
  ok: true;
  data: T;
  correlation_id: string;
};

type ApiError = {
  ok: false;
  error: {
    code: ErrorCode;
    message: string; // mensagem segura para exibição, sem detalhes internos
    details?: Record<string, unknown>; // apenas dados não sensíveis (ex.: campo inválido)
  };
  correlation_id: string;
};
```

## 2. Catálogo de códigos de erro

```ts
type ErrorCode =
  | "validation_error" // payload não conforme ao schema zod
  | "unauthorized" // sessão ausente/inválida
  | "forbidden" // sessão válida sem permissão para o recurso/ação
  | "not_found" // recurso inexistente ou fora do tenant do chamador
  | "conflict" // ex.: transição de estado não autorizada, versão desatualizada
  | "idempotency_key_missing" // operação mutável sensível sem idempotency_key
  | "idempotency_key_conflict" // mesma chave, payload divergente
  | "rate_limited" // limite de requisições excedido
  | "unconfigured_integration" // integration_connections.status = unconfigured
  | "integration_error" // provedor externo retornou erro (status = error)
  | "insufficient_stock" // reserva/baixa de estoque não pôde ser satisfeita
  | "insufficient_balance" // crédito/gift card sem saldo suficiente
  | "expired_quote" // cotação de frete/preço expirada
  | "payment_declined" // pagamento recusado pelo provedor
  | "internal_error"; // falha inesperada, sem detalhes internos expostos
```

Toda função de servidor mapeia exceções internas para um destes códigos antes de responder; nenhum stack trace ou mensagem de driver/banco é repassado ao cliente.

## 3. Catálogo — leitura pública

### 3.1 Listar produtos — `[Fase 0 — contrato apenas]`

`GET/POST /api/v1/catalog/products`

```ts
type ListProductsRequest = {
  store_id: string; // uuid
  category_slug?: string;
  collection_slug?: string;
  filters?: Record<string, string | string[]>; // por FieldDefinition filterable
  sort?: "relevance" | "price_asc" | "price_desc" | "newest";
  page?: number; // default 1
  page_size?: number; // default 24, máx 60
};

type ProductListItemDTO = {
  id: string;
  slug: string;
  name: string;
  cover_media_url: string; // URL assinada/publica processada, nunca original privado
  price: { amount_cents: number; currency: "BRL" };
  compare_at_price?: { amount_cents: number; currency: "BRL" };
  in_stock: boolean;
};

type ListProductsResponse = {
  items: ProductListItemDTO[];
  page: number;
  page_size: number;
  total_count: number;
};
```

### 3.2 Obter produto por slug — `[Fase 0 — contrato apenas]`

`GET /api/v1/catalog/products/:slug`

```ts
type GetProductBySlugRequest = { store_id: string; slug: string };

type ProductDetailDTO = {
  id: string;
  slug: string;
  name: string;
  description_html: string;
  attributes: { key: string; label: string; value: string | number | boolean }[]; // apenas displayable
  options: { key: string; label: string; values: string[] }[];
  variants: {
    id: string;
    sku: string;
    option_values: Record<string, string>;
    price: { amount_cents: number; currency: "BRL" };
    available: boolean;
  }[];
  media: { url: string; alt: string; is_cover: boolean }[];
  categories: { slug: string; name: string }[];
};
```

### 3.3 Listar categorias / coleções — `[Fase 0 — contrato apenas]`

`GET /api/v1/catalog/categories`, `GET /api/v1/catalog/collections`

```ts
type CategoryDTO = {
  slug: string;
  name: string;
  parent_slug: string | null;
  ordering: number;
  image_url?: string;
};

type CollectionDTO = {
  slug: string;
  name: string;
  banner_url?: string;
};
```

## 4. Carrinho e checkout

### 4.1 Recalcular/obter carrinho — `[Fase 0 — contrato apenas]`

`POST /api/v1/cart/sync`

```ts
type CartLineInput = { variant_id: string; quantity: number };

type SyncCartRequest = {
  store_id: string;
  cart_id?: string; // ausente = cria novo
  lines: CartLineInput[];
  coupon_code?: string;
};

type CartLineDTO = {
  variant_id: string;
  quantity: number;
  unit_price: { amount_cents: number; currency: "BRL" };
  line_total: { amount_cents: number; currency: "BRL" };
  available: boolean; // reavaliado no servidor
};

type CartDTO = {
  cart_id: string;
  lines: CartLineDTO[];
  subtotal: { amount_cents: number; currency: "BRL" };
  discount: { amount_cents: number; currency: "BRL" };
  total: { amount_cents: number; currency: "BRL" }; // sempre recomputado no servidor
  coupon_applied?: { code: string; description: string };
};
```

Nota: preço, disponibilidade e desconto nunca são aceitos do cliente — apenas `variant_id` e `quantity` são entrada; todo o resto é recomputado.

### 4.2 Criar pedido a partir do carrinho — `[Implementação inicial]` — requer `idempotency_key`

`POST /api/v1/checkout/orders`

```ts
type CreateOrderRequest = {
  idempotency_key: string;
  store_id: string;
  cart_id: string;
  shipping_address_id: string;
  shipping_method: { type: "pickup" | "manual_table" | "manual_quote"; quote_id?: string };
};

type OrderDTO = {
  order_id: string;
  status: OrderStatus; // ver seção 5
  totals: {
    subtotal: { amount_cents: number; currency: "BRL" };
    discount: { amount_cents: number; currency: "BRL" };
    shipping: { amount_cents: number; currency: "BRL" };
    total: { amount_cents: number; currency: "BRL" };
  };
  created_at: string; // ISO UTC
};
```

## 5. Pedidos

```ts
type OrderStatus =
  | "draft"
  | "awaiting_shipping_quote"
  | "awaiting_payment"
  | "paid"
  | "processing"
  | "ready_for_pickup"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled"
  | "payment_failed"
  | "returned"
  | "refunded";
```

### 5.1 Obter pedido — `[Implementação inicial]`

`GET /api/v1/orders/:order_id`

Retorna `OrderDTO` completo com snapshot de itens, endereço e histórico de transições (`status_history: { status: OrderStatus; at: string }[]`).

### 5.2 Transicionar pedido — `[Implementação inicial]` — requer `idempotency_key`

`POST /api/v1/orders/:order_id/transition`

```ts
type TransitionOrderRequest = {
  idempotency_key: string;
  to_status: OrderStatus;
  reason?: string; // obrigatório para cancelled/returned/refunded
};
```

Erros possíveis específicos: `conflict` (transição não autorizada a partir do estado atual ou para o role do chamador), `insufficient_stock` (se a transição exigir reconfirmação de reserva).

## 6. Frete

### 6.1 Cotar frete — `[Fase 0 — contrato apenas]`

`POST /api/v1/shipping/quote`

```ts
type ShippingQuoteRequest = {
  store_id: string;
  cart_id: string;
  destination_zip: string;
};

type ShippingQuoteOptionDTO = {
  quote_id: string;
  type: "pickup" | "manual_table" | "manual_quote" | "provider";
  label: string;
  price: { amount_cents: number; currency: "BRL" };
  eta_days_min?: number;
  eta_days_max?: number;
  expires_at: string; // ISO UTC — cotações manuais/provider expiram
};

type ShippingQuoteResponse = { options: ShippingQuoteOptionDTO[] };
```

Se nenhum provider de frete automático estiver `active` em `integration_connections`, apenas opções `pickup`/`manual_table`/`manual_quote` são retornadas; nunca se simula uma cotação de provider não configurado (erro `unconfigured_integration` se solicitado explicitamente).

## 7. Pagamentos

### 7.1 Criar intenção de pagamento — `[Fase 0 — contrato apenas]` — requer `idempotency_key`

`POST /api/v1/payments/intents`

```ts
type CreatePaymentIntentRequest = {
  idempotency_key: string;
  order_id: string;
  provider:
    | "mercado_pago"
    | "asaas"
    | "stripe"
    | "manual_proof"
    | "carne"
    | "gift_card"
    | "customer_credit";
  return_url?: string;
};

type PaymentIntentDTO = {
  payment_id: string;
  status: "pending" | "authorized" | "paid" | "failed";
  provider: string;
  checkout_url?: string; // quando aplicável (redirecionamento a provedor)
  pix_qr_code?: string; // quando aplicável, nunca dados sensíveis de cartão
};
```

Restrição explícita: **jamais** trafegam dados brutos de cartão (PAN, CVV) por este contrato; tokenização ocorre no provedor via SDK client-side dedicado, o BFF só recebe token/opaque reference do provedor.

### 7.2 Webhook de pagamento (entrada) — `[Fase 0 — contrato apenas]`

`POST /api/v1/payments/webhooks/:provider`

```ts
type PaymentWebhookPayload = {
  provider_event_id: string; // usado para deduplicação
  provider_payment_id: string;
  event_type: string;
  raw_payload: Record<string, unknown>; // armazenado para auditoria, nunca reexposto integralmente por API pública
};
```

Resposta sempre `200 OK` com envelope `ApiSuccess<{ processed: boolean; deduplicated: boolean }>` após persistência do evento, mesmo em caso de erro de negócio subsequente (para evitar reentrega agressiva do provedor); erros de negócio são tratados de forma assíncrona via outbox/worker.

### 7.3 Upload de comprovante manual — `[Fase 0 — contrato apenas]`

`POST /api/v1/payments/:payment_id/proof`

```ts
type SubmitProofRequest = { media_asset_id: string };
type ProofDTO = { proof_id: string; status: "pending_review" | "accepted" | "rejected" };
```

## 8. Mídia — upload via URL assinada

### 8.1 Solicitar URL de upload — `[Implementação inicial]`

`POST /api/v1/media/upload-url`

```ts
type RequestUploadUrlRequest = {
  store_id: string;
  intended_use: "product_media" | "review_media" | "chat_attachment" | "payment_proof" | "avatar";
  content_type: string; // MIME declarado pelo cliente, revalidado no servidor pelo conteúdo real
  size_bytes: number;
};

type UploadUrlDTO = {
  media_asset_id: string; // criado em estado "uploading", privado
  signed_upload_url: string;
  expires_at: string; // ISO UTC
};
```

### 8.2 Confirmar upload / consultar status de processamento — `[Implementação inicial]`

`GET /api/v1/media/:media_asset_id`

```ts
type MediaAssetDTO = {
  media_asset_id: string;
  status: "uploading" | "processing" | "ready" | "rejected";
  original_url?: string; // signed URL, apenas para papéis autorizados
  derivatives?: { format: "webp" | "avif"; width: number; url: string }[];
  focal_point?: { x: number; y: number };
};
```

`status: rejected` ocorre quando a validação real de MIME falha; o motivo não é exposto em detalhe ao cliente final (log interno apenas).

## 9. Regras transversais de idempotência

Endpoints que **exigem** `idempotency_key` (lista não exaustiva, cobre toda mutação financeira/estoque/pedido):

- `POST /api/v1/checkout/orders`
- `POST /api/v1/orders/:order_id/transition`
- `POST /api/v1/payments/intents`
- `POST /api/v1/inventory/movements` (Fase 0 — contrato apenas)
- `POST /api/v1/gift-cards/:code/redeem` (Fase 0 — contrato apenas)
- `POST /api/v1/credits/:customer_id/adjust` (Fase 0 — contrato apenas)
- `POST /api/v1/cash-shifts/:shift_id/entries` (Fase 0 — contrato apenas)

Comportamento: chave ausente nesses endpoints retorna `idempotency_key_missing` antes de qualquer processamento; a chave é armazenada com hash do payload por um período mínimo de retenção operacional para permitir deduplicação segura de reentregas de rede.

## 10. Exposição de dados sensíveis — política

- Nenhum contrato retorna: senha/hash, segredos/tokens de integração, código completo de gift card (apenas últimos dígitos/máscara), dados de cartão, `raw_payload` de webhook para consumidores externos ao domínio de pagamentos.
- Endereços e documentos pessoais só são retornados ao próprio titular (`customer`) ou a roles com permissão explícita (`admin`, `finance`, `support` conforme caso), nunca em listagens públicas de catálogo/CMS.
- Todo campo de dinheiro segue o formato `{ amount_cents: integer, currency: "BRL" }` em 100% dos contratos desta especificação.
