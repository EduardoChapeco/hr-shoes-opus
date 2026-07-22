# G3: Module Inventory (Inventário Canônico de Módulos)

Este documento registra os 40+ módulos da plataforma HR Shoes Commerce, especificando seu objetivo de negócio, responsável de dados, autoridade de servidor, rotas associadas e status de runtime.

## Classificações de Status
`COMPROVADO` | `PARCIAL` | `QUEBRADO` | `MOCKADO` | `SIMULADO` | `HARDCODADO` | `DUPLICADO` | `OCULTO` | `ÓRFÃO` | `DESCONECTADO` | `NÃO IMPLEMENTADO` | `BLOQUEADO`

---

## 1. Núcleo Organizacional e Identidade

| Módulo | Objetivo de Negócio | BFF Handler / Server Functions | Tabelas SQL | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Auth & Auth SSR** | Autenticação de clientes e staff via Supabase SSR / Cookie. | `src/lib/supabase-ssr.server.ts` | `auth.users` | `COMPROVADO` |
| **Identity & Access** | Resolução canônica de `id`, `role`, `store_id`, `organization_id`. | `src/lib/identity.ts` | `profiles`, `user_roles` | `COMPROVADO` |
| **Configurações da Loja** | Dados cadastrais, moeda, fuso horário, logo, termos e SEO da loja. | `settings.functions.ts` | `stores`, `store_settings` | `PARCIAL` |
| **Equipe e RBAC** | Gestão de colaboradores da loja e atribuição de permissões. | `team.functions.ts` | `profiles`, `store_members` | `QUEBRADO NA UI` |

---

## 2. Catálogo e Produtos

| Módulo | Objetivo de Negócio | BFF Handler / Server Functions | Tabelas SQL | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Tipos Adaptativos** | Definição de formulários dinâmicos por categoria de produto. | `admin-catalog.functions.ts` | `product_types` | `COMPROVADO` |
| **Gestão de Produtos** | CRUD completo de produtos, marcas, fabricantes, EAN e SEO. | `admin-catalog.functions.ts` | `products` | `QUEBRADO NA UI` |
| **Matriz de Variantes** | Gerador e manipulador de SKUs por cor, tamanho e atributos. | `admin-catalog.functions.ts` | `product_variants` | `COMPROVADO` |
| **Galeria de Mídias** | Ordenação de mídias, vídeos, thumbnails e ponto focal. | `admin-catalog.functions.ts` | `product_media` | `PARCIAL` |
| **Categorias e Coleções** | Árvore hierárquica de categorias e agrupamentos de coleção. | `admin-catalog.functions.ts` | `categories`, `collections` | `COMPROVADO` |

---

## 3. Comercial, Precificação e Promoções

| Módulo | Objetivo de Negócio | BFF Handler / Server Functions | Tabelas SQL | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Precificação e Margens** | Gestão de preços de venda, comparativos (de/por) e custo. | `admin-catalog.functions.ts` | `products`, `product_variants` | `COMPROVADO` |
| **Cupons de Desconto** | Cupons percentuais, fixos e frete grátis com limite de uso. | `promotions.functions.ts` | `coupons` | `COMPROVADO` |
| **Gift Cards / Vouchers** | Emissão e resgate de vales-presente com saldo acumulado. | `promotions.functions.ts` | `gift_cards` | `PARCIAL` |

---

## 4. Estoque e Inventário

| Módulo | Objetivo de Negócio | BFF Handler / Server Functions | Tabelas SQL | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Saldos e Disponibilidade**| Cálculo de `available = stock_on_hand - stock_reserved`. | `stock.functions.ts` | `product_variants` | `COMPROVADO` |
| **Movimentações de Estoque**| Ledger de entradas, saídas, ajustes e devoluções. | `stock.functions.ts` | `stock_movements` | `QUEBRADO NA UI` |
| **Reservas no Carrinho** | Bloqueio temporário de saldo por 15 min via RPC PostgreSQL. | `cart.functions.ts` | `cart_item_reservations` | `COMPROVADO` |
| **Alertas de Estoque Baixo**| Notificações de ruptura iminente por variante. | `stock.functions.ts` | `product_variants` | `QUEBRADO NA UI` |

---

## 5. Carrinho, Checkout e Vendas

| Módulo | Objetivo de Negócio | BFF Handler / Server Functions | Tabelas SQL | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Carrinho Ativo (DTO)** | Gestão de itens, sessão de guest e cliente autenticado. | `cart.functions.ts` | `carts`, `cart_items` | `COMPROVADO` |
| **Calculadora de Frete** | Cotação de frete por CEP com múltiplos provedores/tabela. | `shipping.functions.ts` | `shipping_rules` | `COMPROVADO` |
| **Checkout Transacional** | Processamento atômico de pedido via RPC PostgreSQL. | `checkout.functions.ts` | `orders`, `order_items` | `COMPROVADO` |
| **Gestão de Pedidos** | Acompanhamento do fluxo operacional do pedido. | `orders.functions.ts` | `orders`, `order_status_history`| `COMPROVADO` |
| **Fulfillment & Separação** | Fluxo de picking, packing, emissão de nota e envio. | `fulfillment.functions.ts` | `shipments`, `orders` | `PARCIAL` |

---

## 6. Operação, Caixa e Financeiro

| Módulo | Objetivo de Negócio | BFF Handler / Server Functions | Tabelas SQL | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Caixa e PDV** | Abertura, fechamento, suprimento e sangria de caixa físico. | `cash.functions.ts` | `cash_sessions`, `cash_movements`| `PARCIAL` |
| **Lançamentos Financeiros** | Registro de entradas, saídas e conciliação bancária. | `finance.functions.ts` | `financial_transactions` | `PARCIAL` |

---

## 7. Clientes, Social e Atribuição

| Módulo | Objetivo de Negócio | BFF Handler / Server Functions | Tabelas SQL | Status |
| :--- | :--- | :--- | :--- | :--- |
| **CRM e Clientes** | Cadastro de clientes, endereços e histórico de compras. | `customers.functions.ts` | `customers`, `customer_addresses`| `COMPROVADO` |
| **Avaliações de Produtos** | Submissão e moderação de reviews e notas de estrelas. | `social.functions.ts` | `reviews` | `COMPROVADO` |
| **Vendedores e Afiliados** | Links de indicação, cupons de vendedor e comissões. | `affiliates.functions.ts` | `affiliates`, `commissions` | `PARCIAL` |

---

## 8. CMS, Builder e Experiências Públicas

| Módulo | Objetivo de Negócio | BFF Handler / Server Functions | Tabelas SQL | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Editor de Experiências** | Construtor WYSIWYG de páginas, secções e componentes. | `builder.functions.ts` | `experience_documents` | `COMPROVADO` |
| **Renderizador Dinâmico** | `ExperienceRenderer` para exibir árvores de blocos na loja. | `builder.functions.ts` | `experience_documents` | `COMPROVADO` |
| **Perfil Público / Biolink**| Página pública de links e vitrine da vendedora/loja. | `builder.functions.ts` | `experience_documents` | `PARCIAL` |
