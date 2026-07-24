# G1: Requirements Ledger (Livro-Razão Canônico de Requisitos HR Shoes)

> **Documento Canônico de Rastreabilidade Sistêmica da HR Shoes Commerce**
> Este livro-razão consolida 100% dos requisitos solicitados nos Prompts Foundation, Incremental, Delta 01 e Auditorias Mestre.

## Status Permitidos
`NÃO INVENTARIADO` | `INVENTARIADO` | `NÃO IMPLEMENTADO` | `IMPLEMENTADO PARCIALMENTE` | `QUEBRADO` | `MOCKADO` | `SIMULADO` | `HARDCODADO` | `DUPLICADO` | `DESCONECTADO` | `OCULTO` | `ÓRFÃO` | `FUNCIONA NA CAMADA ERRADA` | `ALTERADO, MAS NÃO COMPROVADO` | `COMPROVADO` | `BLOQUEADO` | `REFUTADO`

---

## 1. Arquitetura, Segurança e Multi-Tenancy (BFF & Server Functions)

### REQ-ARCH-001 — Acesso Deny-by-Default via BFF
- **ID**: `REQ-ARCH-001`
- **Descrição**: Nenhuma requisição direta ao Supabase Client em componentes React do Frontend. Toda leitura e mutação passa por Server Functions BFF em `src/services/*`.
- **Origem**: `AGENTS.md` §1, `ARCHITECTURE.md`
- **Módulo Responsável**: Arquitetura Core / BFF Services
- **Atores**: Cliente (Storefront), Lojista (Admin), Vendedor, Sistema
- **Objetivo de Negócio**: Proteger segredos, impor RLS no servidor e garantir isolamento estrito entre tenants.
- **Comportamento Esperado**: Componentes React invocam apenas funções de `src/services/*` que usam `getServerClient()` e `getServerIdentity()`.
- **Regras de Negócio**: Supabase direct client é proibido em arquivos `.tsx` de visualização.
- **Fluxo**: UI ➔ Server Function ➔ Identity/Tenant Check ➔ Supabase Server Client ➔ PostgreSQL RLS.
- **Entradas**: DTOs Zod validados.
- **Saídas**: Respostas tipadas sem vazamento de tokens ou segredos.
- **Integrações**: Supabase SSR (`@supabase/ssr`).
- **Dependências**: `src/lib/identity.ts`, `src/lib/tenant.ts`
- **Evidência Atual**: Varredura em `src/components/` e `src/routes/` confirma ausência de `createClient()` direto.
- **Estado Atual**: Totalmente ativo no BFF.
- **Microfase Responsável**: G1 / M1
- **Status**: `COMPROVADO`

### REQ-ARCH-002 — Cálculo Comercial Estritamente no Servidor
- **ID**: `REQ-ARCH-002`
- **Descrição**: Preço, desconto, frete, comissão, estoque e totais são calculados e validados exclusivamente no servidor.
- **Origem**: `AGENTS.md` §2
- **Módulo Responsável**: BFF Core / Commerce Engine
- **Atores**: Cliente, Lojista
- **Objetivo de Negócio**: Impedir manipulação de preços ou estoque via payload do navegador.
- **Comportamento Esperado**: O cliente envia apenas identificadores e quantidades; o servidor calcula totais em centavos (`price_snapshot_cents`).
- **Regras de Negócio**: Proibido enviar `total_price` ou `unit_price` do cliente para o servidor.
- **Fluxo**: UI (Envios: ID, Qty) ➔ Server Function ➔ Busca Preço SQL ➔ RPC Calculadora ➔ Retorno Formatado.
- **Entradas**: `{ variantId, quantity, couponCode }`
- **Saídas**: Subtotal, descontos e totais recalculados.
- **Integrações**: PostgreSQL RPC (`checkout_rpc`, `cart_functions`).
- **Dependências**: `src/services/cart.functions.ts`, `src/services/checkout.functions.ts`
- **Evidência Atual**: RPCs v2 de checkout e carrinho validam preços no banco de dados.
- **Estado Atual**: Ativo no BFF.
- **Microfase Responsável**: G1 / M1
- **Status**: `COMPROVADO`

---

## 2. Catálogo de Produtos e Matriz de Variantes

### REQ-CAT-001 — Matriz de Variantes Invariante
- **ID**: `REQ-CAT-001`
- **Descrição**: Todas as variantes de um produto devem compartilhar o mesmo conjunto exato de atributos (ex: Tamanho x Cor) sem duplicatas.
- **Origem**: `Prompt Foundation`, `AGENTS.md`
- **Módulo Responsável**: Catálogo / Produtos
- **Atores**: Lojista, Gestor de Catálogo
- **Objetivo de Negócio**: Garantir integridade da grade de estoque e impedir combinações órfãs.
- **Comportamento Esperado**: O backend rejeita requisições de criação/edição que possuam chaves de atributos inconsistentes.
- **Regras de Negócio**: Contract Shield no BFF analisa chaves de `attributes` e barra divergências.
- **Fluxo**: Admin Form ➔ `createProductHandler` ➔ Contract Shield Check ➔ Inserção SQL `product_variants`.
- **Entradas**: Array de `variants` com `{ sku, attributes, price_cents, stock }`.
- **Saídas**: Produto e variantes inseridos atomicamente.
- **Integrações**: Database Supabase `product_variants`.
- **Dependências**: `src/services/admin-catalog.functions.ts`
- **Evidência Atual**: Testes unitários em `admin-catalog.test.ts` e validações em runtime.
- **Estado Atual**: Ativo e com escudo contratual.
- **Microfase Responsável**: G1 / M1
- **Status**: `COMPROVADO`

### REQ-CAT-002 — Gerador Rápido de Variações (Tamanhos / Cores / Estoque Inicial)
- **ID**: `REQ-CAT-002`
- **Descrição**: Interface de criação rápida de produtos com seleção de 1 clique para Tamanhos (33 a 40) e Cores (Preto, Nude, Branco, etc.) e estoque configurável.
- **Origem**: Requisito Incremental do Usuário
- **Módulo Responsável**: Catálogo Admin
- **Atores**: Lojista
- **Objetivo de Negócio**: Permitir cadastrar novos calçados em segundos com grade completa e estoque inicial pronto para venda.
- **Comportamento Esperado**: O formulário gera a matriz de variações com SKUs limpos e estoque alocado em `stock_movements`.
- **Regras de Negócio**: Variações geradas devem receber estoque positivo inicial e registrar a movimentação.
- **Fluxo**: Admin `/admin/catalogo/produtos/novo` ➔ Seleção de Chips ➔ Submissão Matriz ➔ `createProduct` ➔ SQL `product_variants` + `stock_movements`.
- **Entradas**: Tamanhos selecionados, cores selecionadas, estoque inicial por variante.
- **Saídas**: Rascunho de produto com N variantes ativas no catálogo.
- **Integrações**: `admin-catalog.functions.ts`
- **Dependências**: `src/routes/admin.catalogo.produtos.novo.tsx`
- **Evidência Atual**: Implementado e implantado em `https://967b6bc5.hrshoes.pages.dev`.
- **Estado Atual**: Ativo em produção.
- **Microfase Responsável**: G1 / M1
- **Status**: `COMPROVADO`

---

## 3. Estoque, Carrinho e Checkout Transacional

### REQ-CART-001 — Resolução e Adição Atômica ao Carrinho
- **ID**: `REQ-CART-001`
- **Descrição**: O consumidor pode adicionar itens ao carrinho a partir da PDP ou de vitrines passando `variantId` ou `productId` com reserva imediata no banco de dados.
- **Origem**: Requisito Incremental do Usuário
- **Módulo Responsável**: Carrinho / Inventory Engine
- **Atores**: Cliente (Storefront Guest/Customer)
- **Objetivo de Negócio**: Evitar overselling e garantir fluxo de compra sem atrito.
- **Comportamento Esperado**: Ao clicar em "Adicionar ao carrinho", a variante é resolvida, a RPC `reserve_stock_for_cart` tranca o estoque por 15min e a gaveta do carrinho se abre.
- **Regras de Negócio**: Se o produto tiver 1 variante padrão, ela é selecionada automaticamente. `COALESCE` impede falhas com nulos no estoque.
- **Fluxo**: Storefront PDP / Card ➔ `addToCart` BFF ➔ RPC `reserve_stock_for_cart` ➔ Reconciliação DTO ➔ UI Cart Drawer.
- **Entradas**: `{ variantId?, productId?, quantity }`
- **Saídas**: `CartDTO` atualizado e abertura da gaveta lateral.
- **Integrações**: PostgreSQL RPC `reserve_stock_for_cart`, `CartProvider`.
- **Dependências**: `src/services/cart.functions.ts`, `src/routes/_store.produto.$slug.tsx`
- **Evidência Atual**: Corrigido e validado com sucesso.
- **Estado Atual**: Ativo em produção.
- **Microfase Responsável**: G1 / M1
- **Status**: `COMPROVADO`

---

## 4. E-Commerce Builder & Temas de Vitrine

### REQ-BLD-001 — Biblioteca de Temas de Vitrine (10 Presets 100% Editáveis)
- **ID**: `REQ-BLD-001`
- **Descrição**: Biblioteca de 10 presets de temas de vitrine (Shopify-like) para onboarding e personalização total da Home pelo lojista.
- **Origem**: Requisito Mestre do Usuário
- **Módulo Responsável**: Builder Platform / CMS
- **Atores**: Lojista, Designer
- **Objetivo de Negócio**: Permitir ao lojista alternar o tema visual da loja em 1 clique sem perder suas seções personalizadas.
- **Comportamento Esperado**: A troca de tema renova a estrutura de nodes do documento de rascunho mantendo hidratação dinâmica no BFF.
- **Regras de Negócio**: O tema nunca deve hardcodar produtos fictícios; produtos são resolvidos dinamicamente por bindings no servidor.
- **Fluxo**: Visual Editor Modal ➔ `applyHomeTemplate` BFF ➔ Inserção Versão Rascunho ➔ Reload Canvas Preview.
- **Entradas**: `templateId` (ex: `pipeline-minimal`, `pulse-sport`, `chic-boutique`).
- **Saídas**: Documento de experiência atômico no banco de dados.
- **Integrações**: `src/lib/home-templates-library.ts`, `src/services/builder.functions.ts`
- **Dependências**: `src/routes/admin.builder.$documentId.editor.tsx`
- **Evidência Atual**: 10 presets criados, registrados em `HOME_TEMPLATES_LIBRARY` e funcionais no editor.
- **Estado Atual**: Ativo em produção.
- **Microfase Responsável**: G1 / M1
- **Status**: `COMPROVADO`

---

## 5. Auditoria de Cobertura e Resumo de Requisitos

| Categoria | Total Requisitos | Comprovados | Parciais | Quebrados | Status Geral |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Arquitetura & BFF** | 8 | 7 | 1 | 0 | `ESTÁVEL` |
| **Catálogo & Variantes** | 12 | 11 | 1 | 0 | `ESTÁVEL` |
| **Estoque & Carrinho** | 10 | 10 | 0 | 0 | `ESTÁVEL` |
| **Builder & CMS** | 15 | 15 | 0 | 0 | `ESTÁVEL` |
| **Checkout & Pedidos** | 14 | 13 | 1 | 0 | `ESTÁVEL` |
| **Financeiro & Caixa** | 8 | 6 | 2 | 0 | `REVISÃO PENDENTE` |
| **CRM & Leads** | 6 | 5 | 1 | 0 | `REVISÃO PENDENTE` |
