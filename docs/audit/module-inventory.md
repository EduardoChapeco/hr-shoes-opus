# G3: Module Inventory (Inventário Canônico dos 38 Módulos HR Shoes)

> **Inventário Oficial de Cobertura Sistêmica dos 38 Módulos Funcionais**
> Este documento registra o mapeamento completo dos 38 módulos da plataforma HR Shoes Commerce.

## Classificações Oficiais
`COMPROVADO` | `PARCIAL` | `QUEBRADO` | `MOCKADO` | `SIMULADO` | `HARDCODADO` | `DUPLICADO` | `OCULTO` | `ÓRFÃO` | `DESCONECTADO` | `NÃO IMPLEMENTADO` | `BLOQUEADO`

---

## 1. Núcleo Organizacional e Identidade (4 Módulos)

| Módulo | Objetivo de Negócio | BFF Handler / Server Functions | Tabelas SQL | Status |
| :--- | :--- | :--- | :--- | :--- |
| **01. Auth & SSR Sessions** | Autenticação via Supabase SSR, cookies Lax e guest session token. | `src/lib/supabase-ssr.server.ts` | `auth.users` | `COMPROVADO` |
| **02. Identity & Tenant Rules** | Resolução canônica de `id`, `role`, `store_id`, `organization_id`. | `src/lib/identity.ts`, `src/lib/tenant.ts` | `profiles`, `user_roles` | `COMPROVADO` |
| **03. Configurações da Loja** | Razão social, CNPJ, fuso horário, moedas e parâmetros globais. | `src/services/settings.functions.ts` | `stores`, `store_settings` | `COMPROVADO` |
| **04. Equipe & RBAC** | Gestão de permissões de staff (`owner`, `admin`, `operator`, `seller`). | `src/services/team.functions.ts` | `profiles`, `store_members` | `COMPROVADO` |

---

## 2. Catálogo de Produtos e Grade (5 Módulos)

| Módulo | Objetivo de Negócio | BFF Handler / Server Functions | Tabelas SQL | Status |
| :--- | :--- | :--- | :--- | :--- |
| **05. Tipos Adaptativos (Schemas)** | Definição de fichas técnicas flexíveis em JSON (`field_schema`). | `src/services/admin-catalog.functions.ts` | `product_types` | `COMPROVADO` |
| **06. Gestão de Produtos** | Cadastro e edição de produtos físicos com foto de capa e marcas. | `src/services/admin-catalog.functions.ts` | `products` | `COMPROVADO` |
| **07. Matriz de Variantes & Grade** | Gerador de SKUs por tamanho/cor com validação Contract Shield. | `src/services/admin-catalog.functions.ts` | `product_variants` | `COMPROVADO` |
| **08. Mídia & Focal Point** | Upload, ordenação e vinculação de imagens/vídeos por variante. | `src/services/admin-catalog.functions.ts` | `product_media` | `COMPROVADO` |
| **09. Categorias e Coleções** | Árvore hierárquica de categorias e agrupamentos de vitrine. | `src/services/admin-catalog.functions.ts` | `categories`, `collections` | `COMPROVADO` |

---

## 3. Comercial, Precificação e Promoções (3 Módulos)

| Módulo | Objetivo de Negócio | BFF Handler / Server Functions | Tabelas SQL | Status |
| :--- | :--- | :--- | :--- | :--- |
| **10. Precificação em Cents** | Preço base, comparativo (de/por) e custo em integer cents. | `src/services/admin-catalog.functions.ts` | `products`, `product_variants` | `COMPROVADO` |
| **11. Cupons de Desconto** | Regras de desconto percentual, valor fixo e frete grátis. | `src/services/promotions.functions.ts` | `coupons` | `COMPROVADO` |
| **12. Gift Cards / Vouchers** | Emissão e saldo acumulado de cartões de presente. | `src/services/promotions.functions.ts` | `gift_cards` | `PARCIAL` |

---

## 4. Estoque e Logística (4 Módulos)

| Módulo | Objetivo de Negócio | BFF Handler / Server Functions | Tabelas SQL | Status |
| :--- | :--- | :--- | :--- | :--- |
| **13. Saldos e Disponibilidade** | Derivação de `available = stock_on_hand - stock_reserved`. | `src/services/stock.functions.ts` | `product_variants` | `COMPROVADO` |
| **14. Movimentações de Estoque** | Histórico de entradas, saídas e ajustes manuais. | `src/services/stock.functions.ts` | `stock_movements` | `COMPROVADO` |
| **15. Reservas no Carrinho** | RPC PostgreSQL `reserve_stock_for_cart` com expiração 15min. | `src/services/cart.functions.ts` | `cart_item_reservations` | `COMPROVADO` |
| **16. Alertas de Ruptura** | Painel de aviso de produtos abaixo do estoque mínimo. | `src/services/stock.functions.ts` | `product_variants` | `COMPROVADO` |

---

## 5. Carrinho, Checkout e Vendas (5 Módulos)

| Módulo | Objetivo de Negócio | BFF Handler / Server Functions | Tabelas SQL | Status |
| :--- | :--- | :--- | :--- | :--- |
| **17. Carrinho de Compras (DTO)** | Resolução por `variantId` ou `productId` e abertura de gaveta. | `src/services/cart.functions.ts` | `carts`, `cart_items` | `COMPROVADO` |
| **18. Calculadora de Frete** | Cotação de CEP com regras nacionais e prazos em dias úteis. | `src/services/shipping.functions.ts` | `shipping_rules` | `COMPROVADO` |
| **19. Checkout Transacional v2** | RPC atômica `process_checkout_transaction_v2` em transação única. | `src/services/checkout.functions.ts` | `orders`, `order_items` | `COMPROVADO` |
| **20. Gestão de Pedidos** | Fluxo de acompanhamento e transição rígida de estados de pedido. | `src/services/order.functions.ts` | `orders`, `order_status_history` | `COMPROVADO` |
| **21. Fulfillment & Envio** | Separação, nota fiscal, código de rastreio e etiquetas. | `src/services/fulfillment.functions.ts` | `shipments`, `orders` | `PARCIAL` |

---

## 6. Operação, Caixa e Financeiro (3 Módulos)

| Módulo | Objetivo de Negócio | BFF Handler / Server Functions | Tabelas SQL | Status |
| :--- | :--- | :--- | :--- | :--- |
| **22. Caixa & PDV** | Abertura, suprimento, sangria e fechamento de caixa diário. | `src/services/cash.functions.ts` | `cash_sessions`, `cash_movements` | `COMPROVADO` |
| **23. Lançamentos Financeiros** | DRE simplificado, receitas, despesas e relatórios de vendas. | `src/services/finance.functions.ts` | `financial_transactions` | `PARCIAL` |
| **24. Métodos de Pagamento** | Configurações de gateway (PIX, Cartão, Boleto) e parcelamento. | `src/services/payment.functions.ts` | `payment_settings` | `COMPROVADO` |

---

## 7. Clientes, CRM e Afiliados (4 Módulos)

| Módulo | Objetivo de Negócio | BFF Handler / Server Functions | Tabelas SQL | Status |
| :--- | :--- | :--- | :--- | :--- |
| **25. CRM & Clientes** | Cadastro de clientes, histórico de compras e endereços. | `src/services/crm.functions.ts` | `customers`, `customer_addresses` | `COMPROVADO` |
| **26. Pipeline de Vendas** | Funil de atendimento e gestão de leads. | `src/services/crm.functions.ts` | `crm_leads`, `crm_pipelines` | `PARCIAL` |
| **27. Avaliações & Reviews** | Avaliação de produtos por estrelas e comentários moderados. | `src/services/social.functions.ts` | `reviews` | `COMPROVADO` |
| **28. Atribuição & Afiliados** | Cookies de vendedora, comissão por vendas e saldo a pagar. | `src/services/affiliates.functions.ts` | `affiliates`, `commissions` | `PARCIAL` |

---

## 8. Builder, CMS e Vitrines Públicas (5 Módulos)

| Módulo | Objetivo de Negócio | BFF Handler / Server Functions | Tabelas SQL | Status |
| :--- | :--- | :--- | :--- | :--- |
| **29. Editor Visual Builder** | Construtor WYSIWYG de vitrines com drag & drop e inspectores. | `src/services/builder.functions.ts` | `experience_documents` | `COMPROVADO` |
| **30. Temas de Vitrine (10 Presets)**| Biblioteca `HOME_TEMPLATES_LIBRARY` de temas pré-configurados. | `src/services/builder.functions.ts` | `experience_versions` | `COMPROVADO` |
| **31. Renderizador Canônico** | `ExperienceRenderer` para Home, PDP, Categoria e Biolinks. | `src/components/commerce/experience-renderer.tsx` | `experience_documents` | `COMPROVADO` |
| **32. Hidratação Dinâmica BFF** | `hydrateBindings` no BFF para resolver preços/produtos reais. | `src/services/builder.functions.ts` | `products`, `product_variants` | `COMPROVADO` |
| **33. Publicação Atômica & Rollback**| Alternância de versão rascunho ➔ publicada via PostgreSQL constraint. | `src/services/builder.functions.ts` | `experience_documents` | `COMPROVADO` |

---

## 9. Integrações e Infraestrutura (5 Módulos)

| Módulo | Objetivo de Negócio | BFF Handler / Server Functions | Tabelas SQL | Status |
| :--- | :--- | :--- | :--- | :--- |
| **34. Storage & Buckets RLS** | Buckets para fotos de produtos, logos e mídias de avaliações. | `@supabase/ssr` Storage API | `storage.buckets`, `storage.objects` | `COMPROVADO` |
| **35. SEO & OpenGraph** | Meta tags dinâmicas, title, description e schema org. | `src/lib/seo.ts` | `stores`, `products` | `COMPROVADO` |
| **36. Chat Realtime** | Atendimento em tempo real entre cliente e vendedor. | Supabase Realtime Channels | `chat_messages` | `PARCIAL` |
| **37. Google Merchant Integration** | Feed XML/JSON de produtos para Google Shopping. | `src/services/integration.functions.ts` | `products` | `PARCIAL` |
| **38. Logística & Rastreio** | Integração com Correios/Melhor Envio para cálculo e rastreio. | `src/services/shipping.functions.ts` | `shipping_rules` | `COMPROVADO` |
