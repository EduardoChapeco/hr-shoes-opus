# Baseline Report (Microfase G0)

**Data de Geração:** 21 de Julho de 2026
**Commit Atual:** `2d8bcae1e1db184c588004dda2b779b8d39b6acf - fix admin product editor`
**Branch:** `main`

Este documento consolida o estado do projeto exatamente como estava no momento em que a Microfase G0 de preservação foi iniciada.

## 1. Modificações em Aberto (Working Tree)
Foram encontradas massivas modificações não commitadas, resultado de refatorações de arquitetura (remoção do envelope `{status, data}`) via scripts geradores de regex, que quebraram a compilação de diversos consumers e foram abandonadas de forma parcial.

### Modificações (M)
```text
 M src/components/admin/admin-shell.tsx
 M src/components/admin/builder/MediaUploader.tsx
 M src/components/admin/grid-builder-dialog.tsx
 M src/components/admin/product-editor/variant-form-row.tsx
 M src/components/admin/stock-audit-dialog.tsx
 M src/components/commerce/cookie-banner.tsx
 M src/components/commerce/dynamic-sections/hero-carousel.tsx
 M src/components/commerce/dynamic-sections/product-carousel.tsx
 M src/components/commerce/dynamic-sections/product-grid.tsx
 M src/components/commerce/dynamic-sections/trust-badges.tsx
 M src/components/commerce/return-modal.tsx
 M src/components/commerce/review-modal.tsx
 M src/components/ui/image-cropper-dialog.tsx
 M src/lib/builder-registry.ts
 M src/lib/builder-resolvers.ts
 M src/routes/__root.tsx
 M src/routes/_store.carrinho.tsx
 M src/routes/_store.catalogo.tsx
 M src/routes/_store.checkout.tsx
 M src/routes/_store.conta.avaliacoes.tsx
 M src/routes/_store.conta.conversas.$id.tsx
 M src/routes/_store.conta.creditos.tsx
 M src/routes/_store.conta.gift-cards.tsx
 M src/routes/_store.conta.index.tsx
 M src/routes/_store.conta.pedidos.$id.tsx
 M src/routes/_store.conta.pedidos.index.tsx
 M src/routes/_store.conta.trocas.tsx
 M src/routes/_store.gift-card.$claimToken.tsx
 M src/routes/_store.match-time.tsx
 M src/routes/_store.produto.$slug.tsx
 M src/routes/_store.tsx
 M src/routes/admin.avaliacoes.tsx
 M src/routes/admin.builder.$documentId.editor.tsx
 M src/routes/admin.builder.index.tsx
 M src/routes/admin.caixa.index.tsx
 M src/routes/admin.catalogo.categorias.$id.tsx
 M src/routes/admin.catalogo.categorias.index.tsx
 M src/routes/admin.catalogo.categorias.novo.tsx
 M src/routes/admin.catalogo.colecoes.$id.tsx
 M src/routes/admin.catalogo.colecoes.index.tsx
 M src/routes/admin.catalogo.colecoes.novo.tsx
 M src/routes/admin.catalogo.produtos.$id.tsx
 M src/routes/admin.catalogo.produtos.index.tsx
 M src/routes/admin.catalogo.produtos.novo.tsx
 M src/routes/admin.catalogo.tipos.tsx
 M src/routes/admin.clientes.$id.tsx
 M src/routes/admin.clientes.index.tsx
 M src/routes/admin.cms.navegacao.tsx
 M src/routes/admin.cms.tema.tsx
 M src/routes/admin.comprovantes.tsx
 M src/routes/admin.configuracoes.loja.tsx
 M src/routes/admin.configuracoes.pagamentos.tsx
 M src/routes/admin.configuracoes.seo.tsx
 M src/routes/admin.conversas.tsx
 M src/routes/admin.criador.tsx
 M src/routes/admin.equipe.tsx
 M src/routes/admin.estoque.index.tsx
 M src/routes/admin.fretes.cotacoes.tsx
 M src/routes/admin.fretes.index.tsx
 M src/routes/admin.fretes.tabelas.tsx
 M src/routes/admin.integracoes.tsx
 M src/routes/admin.marketing.carrinhos.tsx
 M src/routes/admin.marketing.cupons.tsx
 M src/routes/admin.marketing.feed.tsx
 M src/routes/admin.marketing.notificacoes.tsx
 M src/routes/admin.marketing.seguidores.tsx
 M src/routes/admin.match-time.tsx
 M src/routes/admin.midias.tsx
 M src/routes/admin.pagamentos.tsx
 M src/routes/admin.pedidos.index.tsx
 M src/routes/admin.stories.tsx
 M src/services/admin-catalog.functions.ts
 M src/services/admin-team.functions.ts
 M src/services/audit.functions.ts
 M src/services/auth.functions.ts
 M src/services/builder.functions.ts
 M src/services/cart.functions.ts
 M src/services/catalog.functions.ts
 M src/services/chat.functions.ts
 M src/services/checkout.functions.ts
 M src/services/cms.functions.ts
 M src/services/credits.functions.ts
 M src/services/crm.functions.ts
 M src/services/dashboard.functions.ts
 M src/services/exchanges.functions.ts
 M src/services/giftcard.functions.ts
 M src/services/growth.functions.ts
 M src/services/marketing-engagement.functions.ts
 M src/services/match-time.functions.ts
 M src/services/onboarding.functions.ts
 M src/services/order.functions.ts
 M src/services/payment.functions.ts
 M src/services/product.functions.ts
 M src/services/seller.functions.ts
 M src/services/shipping.functions.ts
 M src/services/social.functions.ts
 M src/services/stock.functions.ts
 M src/services/storage.functions.ts
 M src/services/store.functions.ts
 M src/services/telemetry.functions.ts
 M src/services/upsell.functions.ts
```

### Untracked / Arquivos Locais da IA (??)
```text
?? audit_variants.ts
?? fix_components.ts
?? fix_onboarding.ts
?? fix_tsx.ts
?? refactor_get.ts
?? sanitize_variants.ts
?? scratch/refactor_get.ts
```

## 2. Banco de Dados / Migrations Locais
O supabase local lista 78 migrations aplicadas sincronicamente com o banco remoto (`local` === `remote`), do número `0001` até `0077`, além de um timestamp avulso de hotfix (`20260717115318`).

```text
{"local":"0001","remote":"0001"}
...
{"local":"0077","remote":"0077"}
{"local":"20260717115318","remote":"20260717115318"}
```

## 3. Estado da Compilação (`tsc --noEmit`)
O runtime está fundamentalmente instável. O tsc falha com dezenas de `Property 'data' does not exist on type...` em dezenas de rotas:
- `src/routes/admin.configuracoes.politicas.tsx`
- `src/routes/admin.equipe.tsx`
- `src/routes/admin.estoque.alertas.tsx`
- `src/routes/admin.estoque.movimentos.tsx`
- `src/routes/admin.fretes.cotacoes.tsx`
- `src/routes/admin.fretes.index.tsx`
- ... e mais 150+ linhas de erro.

## Veredito da Preservação
O working tree foi mantido congelado. Nenhuma dessas alterações será revertida (`git reset --hard`) ou confirmada (`git commit`) neste momento. Este é o ponto exato da fratura da refatoração onde a Microfase G0 repousa.
