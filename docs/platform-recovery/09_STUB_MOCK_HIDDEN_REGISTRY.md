# 09_STUB_MOCK_HIDDEN_REGISTRY.md — Registro de Stubs, Mocks e Capacidades Ocultadas

Data: 2026-07-15T02:41Z

## ROTAS STUB (EmptyState sem dados, sem loader, sem server function)

| # | Arquivo | Rota | Tipo | Capacidade afetada | Impacto | Status |
|---|---------|------|------|-------------------|---------|--------|
| 1 | `_store.colecao.$slug.tsx` | `/colecao/$slug` | STUB | Exibir coleção de produtos | Cliente não vê coleções | NÃO IMPLEMENTADO |
| 2 | `_store.contato.tsx` | `/contato` | STUB | Exibir canais de contato | Cliente não encontra contato | NÃO IMPLEMENTADO |
| 3 | `_store.faq.tsx` | `/faq` | STUB | Exibir perguntas frequentes | Sem FAQ | NÃO IMPLEMENTADO |
| 4 | `_store.links.tsx` | `/links` | STUB | Link in bio público | Sem link in bio | NÃO IMPLEMENTADO |
| 5 | `_store.stories.tsx` | `/stories` | STUB | Stories público | Sem stories | NÃO IMPLEMENTADO |
| 6 | `_store.promocoes.tsx` | `/promocoes` | STUB | Listar promoções | Sem promoções | NÃO IMPLEMENTADO |
| 7 | `_store.perfil-da-loja.tsx` | `/perfil-da-loja` | STUB | Perfil da loja | Sem perfil | NÃO IMPLEMENTADO |
| 8 | `_store.destaques.$slug.tsx` | `/destaques/$slug` | STUB | Destaque CMS | Sem destaques | NÃO IMPLEMENTADO |
| 9 | `_store.gift-card.$claimToken.tsx` | `/gift-card/$claimToken` | STUB | Resgate gift card público | Texto "próxima fase" | NÃO IMPLEMENTADO |
| 10 | `_store.conta.creditos.tsx` | `/conta/creditos` | STUB | Saldo de créditos | Sem créditos | NÃO IMPLEMENTADO |

## TEXTOS PROBLEMÁTICOS ENCONTRADOS

| Arquivo | Linha | Texto | Tipo |
|---------|-------|-------|------|
| `_store.gift-card.$claimToken.tsx` | 22 | "O resgate de gift cards será ativado em uma próxima fase." | **PRÓXIMA FASE** — viola regra |
| `_store.contato.tsx` | 22 | "A loja poderá publicar aqui..." | **FUTURO CONDICIONAL** |
| `_store.faq.tsx` | 22 | "A loja poderá publicar aqui..." | **FUTURO CONDICIONAL** |
| `_store.links.tsx` | 18 | "A loja poderá configurar..." | **FUTURO CONDICIONAL** |
| `_store.perfil-da-loja.tsx` | 18 | "A loja poderá publicar aqui..." | **FUTURO CONDICIONAL** |
| `_store.destaques.$slug.tsx` | 18 | "Os destaques permanentes serão publicados pela loja." | **FUTURO CONDICIONAL** |
| `_store.colecao.$slug.tsx` | 18 | "Os produtos desta coleção aparecerão aqui quando publicados." | **FUTURO CONDICIONAL** |
| `_store.vendedora.$slug.tsx` | 85 | "Aqui no futuro podemos listar as Collections..." | **COMENTÁRIO TODO** |
| `sitemap[.]xml.ts` | 6 | "TODO: replace with the project URL..." | **TODO** |

## HARDCODES DE DOMÍNIO ENCONTRADOS (amostra inicial)

| Arquivo | Tipo | Valor | Classificação |
|---------|------|-------|---------------|
| `0022_seed_default_tenant.sql` | SQL | `'Hr Shoes Organization'`, `'hr-shoes-org'`, `'Hr Shoes'`, `'hr-shoes'` | Constante de domínio — aceitável como seed |
| `_store.index.tsx` | TSX | Texto hardcoded de home | Conteúdo editável — deveria vir do CMS |
| `session.ts` | TS | `60 * 60 * 24 * 30` (30 dias cookie) | Constante técnica — aceitável |
| `session.ts` | TS | `"hr_shoes_guest_session"`, `"hr_shoes_seller_ref"` | Constante técnica — aceitável |
