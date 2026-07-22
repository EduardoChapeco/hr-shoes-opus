# G1: Requirements Ledger (Livro-Razão de Requisitos)

Este documento consolida todos os requisitos de negócio e arquiteturais solicitados pelo usuário para a plataforma HR Shoes Commerce, mapeando seu estado atual de atendimento sistêmico.

## Status Permitidos
`COMPROVADO` | `PARCIAL` | `QUEBRADO` | `MOCKADO` | `SIMULADO` | `HARDCODADO` | `DUPLICADO` | `OCULTO` | `ÓRFÃO` | `DESCONECTADO` | `NÃO IMPLEMENTADO` | `BLOQUEADO`

---

## 1. Arquitetura e Segurança BFF

| Requisito | Descrição Canônica | Fonte Única de Verdade | Status Atual | Evidências / Problemas Ocultos |
| :--- | :--- | :--- | :--- | :--- |
| **BFF Deny-by-Default** | Nenhuma chamada direta ao Supabase client dentro de componentes UI. Data fetching exclusivo por `src/services/*.functions.ts`. | `AGENTS.md`, `ARCHITECTURE.md` | **COMPROVADO** | Auditado em A2. Zero vazamento de Supabase direct client na UI. |
| **Cálculo Comercial no Servidor** | Preço, desconto, frete, comissão, estoque e totais são calculados/validados no servidor. Cliente apenas exibe. | `AGENTS.md` | **COMPROVADO** | BFF e RPCs v2 garantem revalidação de preços e saldos no server side. |
| **Dinheiro em Integer Cents** | Dinheiro sempre em integer cents + currency `BRL`. Nunca float. Formatação via `src/lib/money.ts`. | `AGENTS.md`, `src/lib/money.ts` | **COMPROVADO** | Tipagem estrita de `_cents` em DTOs e tabelas SQL. |
| **Identidade Canonical SSR** | `getServerIdentity()` em `src/lib/identity.ts` resolve `id`, `role`, `store_id` e `organization_id` via cookies do cliente. | `src/lib/identity.ts` | **PARCIAL** | SSR Client resolve cookies via `@supabase/ssr`, mas faltava padronização em rotas de admin legadas. |

---

## 2. Gestão de Catálogo e Produtos

| Requisito | Descrição Canônica | Fonte Única de Verdade | Status Atual | Evidências / Problemas Ocultos |
| :--- | :--- | :--- | :--- | :--- |
| **Tipos Adaptativos de Produto** | Cadastro flexível de tipos com campos customizados em JSON (`field_schema`). | `admin-catalog.functions.ts` | **COMPROVADO** | DB e BFF suportam `product_types`. UI permite criar/editar tipos. |
| **Matriz de Variantes Invariante** | Todas as variantes de um produto devem compartilhar o mesmo conjunto exato de atributos sem duplicatas. | `admin-catalog.functions.ts` | **COMPROVADO** | Contract Shield implementado e testado no backend. |
| **Editor Duplo de Produto** | Workspace com preview WYSIWYG ao vivo e formulário comercial no admin (`/admin/catalogo/produtos/$id`). | `admin.catalogo.produtos.$id.tsx` | **QUEBRADO** | Quebra por Padrão 3 (mismatched DTO return `.data`). |
| **Galeria e Focal Point** | Upload de mídias com ordem de exibição e ponto focal por variante. | `product_media` table | **PARCIAL** | Tabela e backend prontos; upload inline na tela `novo.tsx` estava ausente. |

---

## 3. Estoque, Carrinho e Checkout

| Requisito | Descrição Canônica | Fonte Únia de Verdade | Status Atual | Evidências / Problemas Ocultos |
| :--- | :--- | :--- | :--- | :--- |
| **Disponibilidade Derivada** | `available = stock_on_hand - stock_reserved`. Nunca editado diretamente — atualizado por `stock_movements`. | `DOMAIN_MODEL.md` | **COMPROVADO** | DTOs e RPCs derivam a disponibilidade sem mutação direta de `available`. |
| **Reserva Atômica no Carrinho** | RPC `reserve_stock_for_cart` tranca estoque por 15 minutos ao adicionar ao carrinho. | `cart.functions.ts` | **COMPROVADO** | RPC PostgreSQL `reserve_stock_for_cart` implementada em migration 0025/0026. |
| **Checkout Transacional RPC v2** | `process_checkout_transaction_v2` processa pedido, cupons, gift cards, baixa de estoque e fechamento do carrinho numa única TX. | `checkout.functions.ts` | **COMPROVADO** | RPC atômica idempotente testada e funcional. |
| **Fusão de Carrinhos (Guest -> Customer)** | Ao fazer login, o carrinho anônimo (`session_token`) deve ser fundido com o carrinho ativo do cliente. | `cart-helpers.ts` | **COMPROVADO** | `mergeGuestCartLogic` executa a mesclagem dos cart_items. |

---

## 4. CMS, Builder e Experiências Públicas

| Requisito | Descrição Canônica | Fonte Única de Verdade | Status Atual | Evidências / Problemas Ocultos |
| :--- | :--- | :--- | :--- | :--- |
| **Renderização Unificada de Experiências** | `ExperienceRenderer` em `src/components/commerce/` renderiza árvores do Builder na Home, PDP, Categoria e Biolinks. | `builder.functions.ts` | **COMPROVADO** | Renderizador canônico compartilhado por todas as rotas públicas. |
| **Templates Padrão da Loja** | Suporte a `document_type`: `home`, `product_template`, `category_template`, `biolink`. | `experience_documents` table | **COMPROVADO** | Migration `0070_cms_home_seed.sql` provê o seed padrão. |
| **Perfil Público / Biolink** | Rota pública `/p/$handle` exibindo marcas, produtos e redes sociais do seller/store. | `_store.p.$handle.tsx` | **PARCIAL** | Rota funcional, mas falta sincronia em tempo real com novos cadastros. |

---

## 5. Operação, Caixa, Financeiro e Fulfillment

| Requisito | Descrição Canônica | Fonte Única de Verdade | Status Atual | Evidências / Problemas Ocultos |
| :--- | :--- | :--- | :--- | :--- |
| **Máquina de Estados de Pedidos** | Transições rígidas de pedido: `pending_payment` -> `paid` -> `preparing` -> `shipped` -> `delivered`. | `DOMAIN_MODEL.md` | **COMPROVADO** | DB constraints e RPCs impedem saltos de estado inválidos. |
| **Caixa e PDV** | Abertura, sangria, suprimento e fechamento de caixa operacional. | `cash_sessions` table | **PARCIAL** | Backend funcional em `MICROFASE_3A_CAIXA`, mas UI do Admin continha desestruturação `.data` quebrada. |
| **Comissões e Atribuição** | Vínculo de seller_id/affiliate_id em pedidos com cálculo de percentual de comissão. | `affiliates` / `orders` | **PARCIAL** | Tabela e cookie de atribuição presentes; dashboard de afiliados é UI visual parcial. |
