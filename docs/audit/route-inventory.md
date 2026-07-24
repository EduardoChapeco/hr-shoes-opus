# G4: Route Inventory (Inventário Canônico de Rotas e Páginas HR Shoes)

> **Inventário Oficial de Rotas, Carregadores (Loaders) e Permissões**
> Este documento cataloga as rotas do repositório em `src/routes/`, o registro no `src/lib/routes.ts` e seus respectivos status de runtime.

## Classificações Oficiais
`COMPROVADO` | `PARCIAL` | `QUEBRADO` | `MOCKADO` | `SIMULADO` | `HARDCODADO` | `DUPLICADO` | `OCULTO` | `ÓRFÃO` | `DESCONECTADO` | `NÃO IMPLEMENTADO` | `BLOQUEADO`

---

## 1. Rotas Públicas e da Loja (`_store`)

| Rota Físicas (`src/routes/`) | Módulo | Ator / Permissão | BFF Server Function | Loader Data | Status Runtime |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `_store.index.tsx` | Vitrine / Home | Pública | `getPublicExperienceDocumentBySlug` | Home Experience DTO | `COMPROVADO` |
| `_store.catalogo.index.tsx` | Busca / Filtros | Pública | `listStorefrontCatalog` | Catalog Result DTO | `COMPROVADO` |
| `_store.produto.$slug.tsx` | Detalhe Produto (PDP)| Pública | `getProductBySlug` | Product Detail DTO | `COMPROVADO` |
| `_store.carrinho.tsx` | Carrinho de Compras | Guest / Customer | `getCart`, `addToCart` | Cart DTO | `COMPROVADO` |
| `_store.checkout.tsx` | Finalização de Compra | Guest / Customer | `checkout.functions.ts` | Checkout Context DTO | `COMPROVADO` |
| `_store.pedido.$token.tsx` | Sucesso do Pedido | Pública por Token | `getOrderConfirmation` | Confirmation DTO | `COMPROVADO` |
| `_store.p.$handle.tsx` | Biolink / Vendedora | Pública | `builder.functions.ts` | Biolink Experience DTO| `COMPROVADO` |
| `_store.conta.index.tsx` | Painel do Cliente | Customer Autenticado | `customers.functions.ts` | Customer Profile DTO | `COMPROVADO` |
| `_store.conta.pedidos.index.tsx` | Histórico Pedidos | Customer Autenticado | `order.functions.ts` | Customer Orders List | `COMPROVADO` |
| `_store.conta.pedidos.$id.tsx` | Detalhe do Pedido | Customer Autenticado | `order.functions.ts` | Order Detail DTO | `COMPROVADO` |
| `_store.conta.enderecos.tsx` | Endereços Cliente | Customer Autenticado | `customers.functions.ts` | Customer Addresses | `COMPROVADO` |
| `_store.conta.avaliacoes.tsx` | Reviews do Cliente | Customer Autenticado | `social.functions.ts` | Customer Reviews List | `COMPROVADO` |

---

## 2. Rotas do Painel Administrativo (`admin`)

| Rota Físicas (`src/routes/`) | Módulo Admin | Ator Exigido | BFF Server Function | Status Runtime |
| :--- | :--- | :--- | :--- | :--- |
| `admin.index.tsx` | Dashboard Mestre | `staff` / `admin` | `dashboard.functions.ts` | `COMPROVADO` |
| `admin.catalogo.produtos.index.tsx` | Lista de Produtos | `content` / `admin` | `admin-catalog.functions.ts` | `COMPROVADO` |
| `admin.catalogo.produtos.novo.tsx` | Cadastro & Grade Rápida| `content` / `admin` | `admin-catalog.functions.ts` | `COMPROVADO` |
| `admin.catalogo.produtos.$id.tsx` | Editor Avançado | `content` / `admin` | `admin-catalog.functions.ts` | `COMPROVADO` |
| `admin.catalogo.categorias.tsx` | Árvore Categorias | `content` / `admin` | `admin-catalog.functions.ts` | `COMPROVADO` |
| `admin.catalogo.colecoes.tsx` | Gestão de Coleções | `content` / `admin` | `admin-catalog.functions.ts` | `COMPROVADO` |
| `admin.catalogo.marcas.tsx` | Marcas & Fabricantes | `content` / `admin` | `admin-catalog.functions.ts` | `COMPROVADO` |
| `admin.catalogo.tipos.tsx` | Tipos Adaptativos | `admin` | `admin-catalog.functions.ts` | `COMPROVADO` |
| `admin.estoque.index.tsx` | Visão Geral Estoque | `stock` / `admin` | `stock.functions.ts` | `COMPROVADO` |
| `admin.estoque.movimentos.tsx` | Ledger Movimentações | `stock` / `admin` | `stock.functions.ts` | `COMPROVADO` |
| `admin.estoque.alertas.tsx` | Alertas de Ruptura | `stock` / `admin` | `stock.functions.ts` | `COMPROVADO` |
| `admin.pedidos.index.tsx` | Painel de Pedidos | `manager` / `admin` | `order.functions.ts` | `COMPROVADO` |
| `admin.pedidos.$id.tsx` | Operação do Pedido | `manager` / `admin` | `order.functions.ts` | `COMPROVADO` |
| `admin.caixa.index.tsx` | PDV & Operação Caixa | `finance` / `seller` | `cash.functions.ts` | `COMPROVADO` |
| `admin.caixa.sessoes.tsx` | Sessões de Caixa | `finance` / `admin` | `cash.functions.ts` | `COMPROVADO` |
| `admin.financeiro.index.tsx` | DRE & Lançamentos | `finance` / `admin` | `finance.functions.ts` | `COMPROVADO` |
| `admin.builder.index.tsx` | Lista Documentos CMS | `content` / `admin` | `builder.functions.ts` | `COMPROVADO` |
| `admin.builder.$documentId.editor.tsx` | Editor WYSIWYG Builder | `content` / `admin` | `builder.functions.ts` | `COMPROVADO` |
| `admin.equipe.index.tsx` | Gestão de Staff | `owner` / `admin` | `team.functions.ts` | `COMPROVADO` |
| `admin.configuracoes.loja.tsx` | Configurações Loja | `owner` / `admin` | `settings.functions.ts` | `COMPROVADO` |

---

## 3. Mapeamento de Rotas Ocultas ou Especializadas

1. `admin.destaques.tsx` — Gestão de banners e coleções em destaque (`COMPROVADO`).
2. `admin.relatorios.tsx` — Dashboard analítico de vendas e conversão (`PARCIAL`).
3. `api.feed.xml.ts` — Gerador de feed Google Merchant XML (`COMPROVADO`).
4. `api.webhooks.pagarme.ts` — Recebimento de notificações de pagamento Pagar.me (`COMPROVADO`).
5. `_store.desejos.tsx` — Lista de desejos de produtos (`PARCIAL`).
