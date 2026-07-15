# 00_CURRENT_TRUTH.md — Estado Real da Plataforma Hr Shoes Commerce

Data: 2026-07-15T02:39Z
Branch: `main`
Commit: `c70d354`
Banco: Supabase remoto `hfgnageqkeryxsnwobjc.supabase.co`
Ambiente: Cloudflare Pages (`eduardochapeco-hr-shoes-opus.pages.dev`)
Migrations: 0001 a 0023 (23 arquivos SQL — status de aplicação no banco remoto: NÃO VERIFICADO para 0022 e 0023)

---

## MÓDULOS REAIS (fluxo parcial ou total confirmado no código)

| # | Módulo | Status Real |
|---|--------|-------------|
| 1 | Auth (Cadastro/Login/Logout) | PARCIAL — signup e signin chamam Supabase SSR; trigger cria profile; mergeGuestCart refatorado mas NUNCA COMPROVADO em runtime |
| 2 | Catálogo Público (listagem/detalhe) | PARCIAL — loader chama `getProducts`/`getProductBySlug` com server functions reais; depende de produtos existirem no banco |
| 3 | Carrinho (add/remove/update qty/coupon) | PARCIAL — server functions existem com lógica real de estoque; depende de tabelas `carts`, `cart_items`, `stock_reservations` existirem |
| 4 | Checkout | PARCIAL — UI grande mas cálculo de total é feito no server; depende de `createOrder` real |
| 5 | Admin Catálogo (CRUD produtos) | PARCIAL — server functions `createProduct`, `updateProduct`, `deleteProduct` existem; UI de criar/editar produtos existe |
| 6 | Gift Cards (admin criar/listar/cancelar) | PARCIAL — server functions existem; UI existe; RLS criada em migration 0008 |
| 7 | Fretes (admin criar zonas/tabelas) | PARCIAL — server functions existem; UI de criação de tabelas e zonas existe |
| 8 | Cupons (admin criar) | PARCIAL — server function de aplicar cupom existe em cart; UI admin existe |

## MÓDULOS ESTÁTICOS / STUB (rota existe, mas NÃO HÁ server function, NÃO HÁ persistência, NÃO HÁ dados reais)

| # | Rota | Arquivo | Bytes | Status Real |
|---|------|---------|-------|-------------|
| 1 | `/_store/colecao/$slug` | `_store.colecao.$slug.tsx` | 730 | STUB — EmptyState estático, sem loader, sem server function |
| 2 | `/_store/contato` | `_store.contato.tsx` | 817 | STUB — EmptyState estático |
| 3 | `/_store/faq` | `_store.faq.tsx` | 794 | STUB — EmptyState estático |
| 4 | `/_store/links` | `_store.links.tsx` | 725 | STUB — EmptyState estático |
| 5 | `/_store/stories` | `_store.stories.tsx` | 736 | STUB — EmptyState estático |
| 6 | `/_store/promocoes` | `_store.promocoes.tsx` | 744 | STUB — EmptyState estático |
| 7 | `/_store/perfil-da-loja` | `_store.perfil-da-loja.tsx` | 766 | STUB — EmptyState estático |
| 8 | `/_store/destaques/$slug` | `_store.destaques.$slug.tsx` | 717 | STUB — EmptyState estático |
| 9 | `/_store/gift-card/$claimToken` | `_store.gift-card.$claimToken.tsx` | 768 | STUB — EmptyState estático, texto "próxima fase" |
| 10 | `/_store/conta/creditos` | `_store.conta.creditos.tsx` | 535 | STUB — EmptyState estático |

## MÓDULOS ADMIN NÃO VERIFICADOS (UI grande, server functions existem, mas fluxo ponta a ponta NUNCA COMPROVADO)

| # | Rota Admin | Bytes | Server Function | Status |
|---|------------|-------|-----------------|--------|
| 1 | `admin.caixa.tsx` | 13988 | `cash.functions.ts` | NÃO VERIFICADO |
| 2 | `admin.caixa.lancamentos.tsx` | 7812 | `cash.functions.ts` | NÃO VERIFICADO |
| 3 | `admin.caixa.turnos.tsx` | 3130 | `cash.functions.ts` | NÃO VERIFICADO |
| 4 | `admin.estoque.tsx` | 5960 | `stock.functions.ts` | NÃO VERIFICADO |
| 5 | `admin.estoque.movimentos.tsx` | 4085 | `stock.functions.ts` | NÃO VERIFICADO |
| 6 | `admin.estoque.alertas.tsx` | 4871 | `stock.functions.ts` | NÃO VERIFICADO |
| 7 | `admin.pedidos.tsx` | 4425 | `order.functions.ts` | NÃO VERIFICADO |
| 8 | `admin.pedidos.$id.tsx` | 4836 | `order.functions.ts` | NÃO VERIFICADO |
| 9 | `admin.pedidos.trocas.tsx` | 5445 | `exchanges.functions.ts` | NÃO VERIFICADO |
| 10 | `admin.comprovantes.tsx` | 4699 | `payment.functions.ts` | NÃO VERIFICADO |
| 11 | `admin.pagamentos.tsx` | 3777 | `payment.functions.ts` | NÃO VERIFICADO |
| 12 | `admin.comissoes.tsx` | 3441 | `commission.functions.ts` | NÃO VERIFICADO |
| 13 | `admin.clientes.tsx` | 3842 | `customer.functions.ts` | NÃO VERIFICADO |
| 14 | `admin.clientes.$id.tsx` | 6018 | `customer.functions.ts` | NÃO VERIFICADO |
| 15 | `admin.equipe.tsx` | 4583 | `admin-team.functions.ts` | NÃO VERIFICADO |
| 16 | `admin.conversas.tsx` | 7194 | `chat.functions.ts` | NÃO VERIFICADO |
| 17 | `admin.avaliacoes.tsx` | 5182 | — | NÃO VERIFICADO |
| 18 | `admin.trocas.tsx` | 4916 | `exchanges.functions.ts` | NÃO VERIFICADO |
| 19 | `admin.cms.paginas.tsx` | 2962 | `cms.functions.ts` | NÃO VERIFICADO |
| 20 | `admin.cms.paginas.novo.tsx` | 5100 | `cms.functions.ts` | NÃO VERIFICADO |
| 21 | `admin.cms.paginas.$id.editor.tsx` | 8694 | `cms.functions.ts` | NÃO VERIFICADO |
| 22 | `admin.cms.navegacao.tsx` | 5052 | `cms.functions.ts` | NÃO VERIFICADO |
| 23 | `admin.cms.tema.tsx` | 6637 | `cms.functions.ts` | NÃO VERIFICADO |
| 24 | `admin.stories.tsx` | 6283 | `growth.functions.ts` | NÃO VERIFICADO |
| 25 | `admin.perfil-publico.tsx` | 6996 | `growth.functions.ts` | NÃO VERIFICADO |
| 26 | `admin.link-da-bio.tsx` | 5494 | `growth.functions.ts` | NÃO VERIFICADO |
| 27 | `admin.criador.tsx` | 5768 | — | NÃO VERIFICADO |
| 28 | `admin.destaques.tsx` | 4507 | — | NÃO VERIFICADO |
| 29 | `admin.integracoes.tsx` | 6293 | — | NÃO VERIFICADO |
| 30 | `admin.marketing.carrinhos.tsx` | 4934 | — | NÃO VERIFICADO |
| 31 | `admin.marketing.cupons.tsx` | 6692 | — | NÃO VERIFICADO |
| 32 | `admin.marketing.feed.tsx` | 5845 | — | NÃO VERIFICADO |
| 33 | `admin.marketing.notificacoes.tsx` | 5566 | — | NÃO VERIFICADO |
| 34 | `admin.match-time.tsx` | 2840 | `match-time.functions.ts` | NÃO VERIFICADO |
| 35 | `admin.midias.tsx` | 6326 | — | NÃO VERIFICADO |
| 36 | `admin.relatorios.tsx` | 5052 | — | NÃO VERIFICADO |
| 37 | `admin.suporte.tsx` | 3867 | — | NÃO VERIFICADO |
| 38 | `admin.configuracoes.loja.tsx` | 8503 | — | NÃO VERIFICADO |
| 39 | `admin.configuracoes.seo.tsx` | 5782 | — | NÃO VERIFICADO |
| 40 | `admin.configuracoes.auditoria.tsx` | 4437 | — | NÃO VERIFICADO |
| 41 | `admin.configuracoes.lgpd.tsx` | 4052 | — | NÃO VERIFICADO |
| 42 | `admin.configuracoes.politicas.tsx` | 5054 | — | NÃO VERIFICADO |

## CONTAGEM TOTAL

| Métrica | Total |
|---------|-------|
| Arquivos de rota (.tsx) | 100 |
| Rotas STUB (EmptyState sem dados) | 10 |
| Rotas NÃO VERIFICADAS (UI com server functions, mas sem comprovação) | 42+ |
| Rotas REAL E COMPROVADO | 0 |
| Server functions (arquivos) | 24 |
| Migrations SQL | 23 |
| Migrations aplicadas e verificadas no banco remoto | NÃO VERIFICADO |

## PRINCIPAIS RISCOS

1. **NENHUMA funcionalidade foi comprovada em runtime de ponta a ponta.** Nenhuma rota pode ser classificada como REAL E COMPROVADO.
2. **Cadastro/Login nunca funcionou de forma comprovada em produção** (erro 429 de rate limit durante testes locais, trigger 0022/0023 ainda não aplicadas no banco remoto).
3. **10 rotas públicas são STUBS puros** — EmptyState sem loader, sem server function, sem dados reais.
4. **42+ rotas admin possuem UI volumosa mas nenhuma foi testada contra o banco real.**
5. **Migrations 0022 e 0023 (seed de loja única e seller_showcases) ainda não foram aplicadas no banco remoto.**
6. **RLS: NENHUMA policy foi testada com teste negativo (tenant B tenta ler dados de tenant A).**
7. **O modelo de domínio documenta multi-tenant (organizations/stores), mas o produto é single-tenant conforme definido pelo usuário.** Há divergência entre documentação e realidade.
8. **Não existe nenhum teste automatizado de integração.** Apenas 2 testes unitários (`money.test.ts`, `routes.test.ts`).
