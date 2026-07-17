# 02_ROUTE_CAPABILITY_MATRIX.md — Inventário Completo de Rotas

Data: 2026-07-15T02:40Z

## LEGENDA DE STATUS

- **REAL** = fluxo ponta a ponta comprovado (acessar → preencher → action → persistir → reload → ver resultado)
- **PARCIAL** = UI existe, server function existe, mas integração não comprovada
- **STUB** = rota existe mas é EmptyState estático sem loader nem server function
- **NÃO VERIFICADO** = código aparenta ser funcional, mas nenhum teste de runtime confirma
- **ESTÁTICO** = conteúdo hardcoded, sem dados do banco

---

## ROTAS PÚBLICAS (/_store/*)

| #   | Rota                                | Módulo        | Capacidade            | UI  | Loader                 | Server Fn              | Persistência    | Reload | RLS          | Status         |
| --- | ----------------------------------- | ------------- | --------------------- | --- | ---------------------- | ---------------------- | --------------- | ------ | ------------ | -------------- |
| 1   | `/_store` (index)                   | Home          | Exibir home pública   | ✅  | ✅ `getHomePageData`   | `catalog.functions`    | Leitura         | —      | Pública      | NÃO VERIFICADO |
| 2   | `/_store/catalogo`                  | Catálogo      | Listar produtos       | ✅  | ✅ `getProducts`       | `catalog.functions`    | Leitura         | —      | Pública      | NÃO VERIFICADO |
| 3   | `/_store/produto/$slug`             | Catálogo      | Detalhe + add to cart | ✅  | ✅ `getProductBySlug`  | `product.functions`    | Leitura+Escrita | —      | Pública+Cart | NÃO VERIFICADO |
| 4   | `/_store/categoria/$slug`           | Catálogo      | Listar por categoria  | ✅  | ✅                     | `catalog.functions`    | Leitura         | —      | Pública      | NÃO VERIFICADO |
| 5   | `/_store/buscar`                    | Busca         | Buscar produtos       | ✅  | ✅                     | `catalog.functions`    | Leitura         | —      | Pública      | NÃO VERIFICADO |
| 6   | `/_store/carrinho`                  | Carrinho      | Ver/editar carrinho   | ✅  | ✅ `getCart`           | `cart.functions`       | Leitura+Escrita | —      | Cart         | NÃO VERIFICADO |
| 7   | `/_store/checkout`                  | Checkout      | Finalizar compra      | ✅  | ✅                     | `checkout.functions`   | Escrita         | —      | Cart+Order   | NÃO VERIFICADO |
| 8   | `/_store/cadastro`                  | Auth          | Criar conta           | ✅  | —                      | `auth.functions`       | Escrita         | —      | Auth         | PARCIAL        |
| 9   | `/_store/entrar`                    | Auth          | Login                 | ✅  | —                      | `auth.functions`       | Escrita         | —      | Auth         | PARCIAL        |
| 10  | `/_store/recuperar-senha`           | Auth          | Recuperar senha       | ✅  | —                      | `auth.functions`       | Escrita         | —      | Auth         | NÃO VERIFICADO |
| 11  | `/_store/match-time`                | Match Time    | Swipe de produtos     | ✅  | ✅                     | `match-time.functions` | Escrita         | —      | Pública      | NÃO VERIFICADO |
| 12  | `/_store/vendedora/$slug`           | Vendedora     | Vitrine afiliada      | ✅  | ✅ `getSellerShowcase` | `seller.functions`     | Leitura+Cookie  | —      | Pública      | NÃO VERIFICADO |
| 13  | `/_store/colecao/$slug`             | Coleção       | Listar coleção        | ✅  | ❌                     | —                      | —               | —      | —            | **STUB**       |
| 14  | `/_store/contato`                   | Institucional | Contato               | ✅  | ❌                     | —                      | —               | —      | —            | **STUB**       |
| 15  | `/_store/faq`                       | Institucional | FAQ                   | ✅  | ❌                     | —                      | —               | —      | —            | **STUB**       |
| 16  | `/_store/links`                     | Link in Bio   | Links                 | ✅  | ❌                     | —                      | —               | —      | —            | **STUB**       |
| 17  | `/_store/stories`                   | Stories       | Stories público       | ✅  | ❌                     | —                      | —               | —      | —            | **STUB**       |
| 18  | `/_store/promocoes`                 | Marketing     | Promoções             | ✅  | ❌                     | —                      | —               | —      | —            | **STUB**       |
| 19  | `/_store/perfil-da-loja`            | Institucional | Perfil da loja        | ✅  | ❌                     | —                      | —               | —      | —            | **STUB**       |
| 20  | `/_store/destaques/$slug`           | CMS           | Destaques             | ✅  | ❌                     | —                      | —               | —      | —            | **STUB**       |
| 21  | `/_store/gift-card/$claimToken`     | Gift Card     | Resgate               | ✅  | ❌                     | —                      | —               | —      | —            | **STUB**       |
| 22  | `/_store/paginas/$slug`             | CMS           | Página dinâmica       | ✅  | ✅                     | `cms.functions`        | Leitura         | —      | Pública      | NÃO VERIFICADO |
| 23  | `/_store/politicas/$slug`           | CMS           | Políticas             | ✅  | ✅                     | `cms.functions`        | Leitura         | —      | Pública      | NÃO VERIFICADO |
| 24  | `/_store/privacidade`               | CMS           | Privacidade           | ✅  | ✅                     | `cms.functions`        | Leitura         | —      | Pública      | NÃO VERIFICADO |
| 25  | `/_store/termos`                    | CMS           | Termos de uso         | ✅  | ✅                     | `cms.functions`        | Leitura         | —      | Pública      | NÃO VERIFICADO |
| 26  | `/_store/trocas-e-devolucoes`       | CMS           | Políticas             | ✅  | ✅                     | `cms.functions`        | Leitura         | —      | Pública      | NÃO VERIFICADO |
| 27  | `/_store/pedido/$token/confirmacao` | Pedido        | Confirmação           | ✅  | ✅                     | `order.functions`      | Leitura         | —      | Pública      | NÃO VERIFICADO |

## ROTAS DE CONTA DO CLIENTE (/_store/conta/*)

| #   | Rota                          | Módulo     | Capacidade           | UI  | Loader | Server Fn              | Persistência | Status            |
| --- | ----------------------------- | ---------- | -------------------- | --- | ------ | ---------------------- | ------------ | ----------------- |
| 28  | `/_store/conta` (index)       | Conta      | Dashboard do cliente | ✅  | ✅     | `auth/order.functions` | Leitura      | NÃO VERIFICADO    |
| 29  | `/_store/conta/perfil`        | Conta      | Editar perfil        | ✅  | ✅     | `auth.functions`       | Escrita      | NÃO VERIFICADO    |
| 30  | `/_store/conta/pedidos`       | Pedidos    | Listar pedidos       | ✅  | ✅     | `order.functions`      | Leitura      | NÃO VERIFICADO    |
| 31  | `/_store/conta/pedidos/$id`   | Pedidos    | Detalhe pedido       | ✅  | ✅     | `order.functions`      | Leitura      | NÃO VERIFICADO    |
| 32  | `/_store/conta/enderecos`     | Endereços  | CRUD endereços       | ✅  | ✅     | `customer.functions`   | Escrita      | NÃO VERIFICADO    |
| 33  | `/_store/conta/pagamentos`    | Pagamentos | Métodos pagamento    | ✅  | —      | —                      | —            | **STUB/ESTÁTICO** |
| 34  | `/_store/conta/gift-cards`    | Gift Card  | Resgatar gift card   | ✅  | ✅     | `giftcard.functions`   | Escrita      | NÃO VERIFICADO    |
| 35  | `/_store/conta/creditos`      | Créditos   | Saldo créditos       | ✅  | ❌     | —                      | —            | **STUB**          |
| 36  | `/_store/conta/avaliacoes`    | Avaliações | Minhas avaliações    | ✅  | ✅     | —                      | Leitura?     | NÃO VERIFICADO    |
| 37  | `/_store/conta/trocas`        | Trocas     | Minhas trocas        | ✅  | ✅     | `exchanges.functions`  | Leitura      | NÃO VERIFICADO    |
| 38  | `/_store/conta/conversas/$id` | Chat       | Conversa             | ✅  | ✅     | `chat.functions`       | Escrita      | NÃO VERIFICADO    |

## ROTAS ADMIN (/admin/*)

| #   | Rota                             | Módulo         | Server Fn                        | Status         |
| --- | -------------------------------- | -------------- | -------------------------------- | -------------- |
| 39  | `admin.index`                    | Dashboard      | —                                | NÃO VERIFICADO |
| 40  | `admin.onboarding`               | Onboarding     | —                                | NÃO VERIFICADO |
| 41  | `admin.catalogo.produtos`        | Catálogo       | `admin-catalog.functions`        | NÃO VERIFICADO |
| 42  | `admin.catalogo.produtos.novo`   | Catálogo       | `admin-catalog.functions`        | NÃO VERIFICADO |
| 43  | `admin.catalogo.produtos.$id`    | Catálogo       | `admin-catalog.functions`        | NÃO VERIFICADO |
| 44  | `admin.catalogo.categorias`      | Catálogo       | `admin-catalog.functions`        | NÃO VERIFICADO |
| 45  | `admin.catalogo.categorias.novo` | Catálogo       | `admin-catalog.functions`        | NÃO VERIFICADO |
| 46  | `admin.catalogo.colecoes`        | Catálogo       | `admin-catalog.functions`        | NÃO VERIFICADO |
| 47  | `admin.catalogo.colecoes.novo`   | Catálogo       | `admin-catalog.functions`        | NÃO VERIFICADO |
| 48  | `admin.catalogo.tipos`           | Catálogo       | `admin-catalog.functions`        | NÃO VERIFICADO |
| 49  | `admin.catalogo.atributos`       | Catálogo       | `admin-catalog.functions`        | NÃO VERIFICADO |
| 50  | `admin.estoque`                  | Estoque        | `stock.functions`                | NÃO VERIFICADO |
| 51  | `admin.estoque.movimentos`       | Estoque        | `stock.functions`                | NÃO VERIFICADO |
| 52  | `admin.estoque.alertas`          | Estoque        | `stock.functions`                | NÃO VERIFICADO |
| 53  | `admin.pedidos`                  | Pedidos        | `order.functions`                | NÃO VERIFICADO |
| 54  | `admin.pedidos.$id`              | Pedidos        | `order.functions`                | NÃO VERIFICADO |
| 55  | `admin.pedidos.trocas`           | Trocas         | `exchanges.functions`            | NÃO VERIFICADO |
| 56  | `admin.trocas`                   | Trocas         | `exchanges.functions`            | NÃO VERIFICADO |
| 57  | `admin.caixa`                    | Caixa          | `cash.functions`                 | NÃO VERIFICADO |
| 58  | `admin.caixa.lancamentos`        | Caixa          | `cash.functions`                 | NÃO VERIFICADO |
| 59  | `admin.caixa.turnos`             | Caixa          | `cash.functions`                 | NÃO VERIFICADO |
| 60  | `admin.comprovantes`             | Pagamentos     | `payment.functions`              | NÃO VERIFICADO |
| 61  | `admin.pagamentos`               | Pagamentos     | `payment.functions`              | NÃO VERIFICADO |
| 62  | `admin.comissoes`                | Comissões      | `commission.functions`           | NÃO VERIFICADO |
| 63  | `admin.clientes`                 | Clientes       | `customer.functions`             | NÃO VERIFICADO |
| 64  | `admin.clientes.$id`             | Clientes       | `customer.functions`             | NÃO VERIFICADO |
| 65  | `admin.equipe`                   | Equipe         | `admin-team.functions`           | NÃO VERIFICADO |
| 66  | `admin.conversas`                | Chat           | `chat.functions`                 | NÃO VERIFICADO |
| 67  | `admin.avaliacoes`               | Avaliações     | —                                | NÃO VERIFICADO |
| 68  | `admin.fretes`                   | Fretes         | `shipping.functions`             | NÃO VERIFICADO |
| 69  | `admin.fretes.tabelas`           | Fretes         | `shipping.functions`             | NÃO VERIFICADO |
| 70  | `admin.fretes.cotacoes`          | Fretes         | `shipping.functions`             | NÃO VERIFICADO |
| 71  | `admin.marketing.gift-cards`     | Gift Cards     | `giftcard.functions`             | NÃO VERIFICADO |
| 72  | `admin.marketing.cupons`         | Cupons         | —                                | NÃO VERIFICADO |
| 73  | `admin.marketing.carrinhos`      | Cart Recovery  | —                                | NÃO VERIFICADO |
| 74  | `admin.marketing.feed`           | Feed Social    | `marketing-engagement.functions` | NÃO VERIFICADO |
| 75  | `admin.marketing.notificacoes`   | Notificações   | `marketing-engagement.functions` | NÃO VERIFICADO |
| 76  | `admin.match-time`               | Match Time     | `match-time.functions`           | NÃO VERIFICADO |
| 77  | `admin.midias`                   | Mídias         | —                                | NÃO VERIFICADO |
| 78  | `admin.stories`                  | Stories        | `growth.functions`               | NÃO VERIFICADO |
| 79  | `admin.perfil-publico`           | Perfil Público | `growth.functions`               | NÃO VERIFICADO |
| 80  | `admin.link-da-bio`              | Link in Bio    | `growth.functions`               | NÃO VERIFICADO |
| 81  | `admin.criador`                  | Criador Posts  | —                                | NÃO VERIFICADO |
| 82  | `admin.destaques`                | Destaques      | —                                | NÃO VERIFICADO |
| 83  | `admin.integracoes`              | Integrações    | —                                | NÃO VERIFICADO |
| 84  | `admin.cms.paginas`              | CMS            | `cms.functions`                  | NÃO VERIFICADO |
| 85  | `admin.cms.paginas.novo`         | CMS            | `cms.functions`                  | NÃO VERIFICADO |
| 86  | `admin.cms.paginas.$id.editor`   | CMS            | `cms.functions`                  | NÃO VERIFICADO |
| 87  | `admin.cms.navegacao`            | CMS            | `cms.functions`                  | NÃO VERIFICADO |
| 88  | `admin.cms.tema`                 | CMS            | `cms.functions`                  | NÃO VERIFICADO |
| 89  | `admin.configuracoes.loja`       | Config         | —                                | NÃO VERIFICADO |
| 90  | `admin.configuracoes.seo`        | Config         | —                                | NÃO VERIFICADO |
| 91  | `admin.configuracoes.auditoria`  | Config         | —                                | NÃO VERIFICADO |
| 92  | `admin.configuracoes.lgpd`       | Config         | —                                | NÃO VERIFICADO |
| 93  | `admin.configuracoes.politicas`  | Config         | —                                | NÃO VERIFICADO |
| 94  | `admin.relatorios`               | Relatórios     | —                                | NÃO VERIFICADO |
| 95  | `admin.suporte`                  | Suporte        | —                                | NÃO VERIFICADO |

## RESUMO

| Status            | Contagem                |
| ----------------- | ----------------------- |
| REAL E COMPROVADO | **0**                   |
| PARCIAL           | 2 (auth cadastro/login) |
| NÃO VERIFICADO    | 82+                     |
| STUB              | 11                      |
| ESTÁTICO          | 1                       |
| TOTAL de rotas    | ~96                     |
