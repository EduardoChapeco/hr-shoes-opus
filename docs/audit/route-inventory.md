# G3: Route Inventory (Inventário Canônico de Rotas)

Este documento registra o inventário de todas as **110 rotas** do repositório em `src/routes/`, confrontadas com o registro tipado programático em `src/lib/routes.ts` e com a documentação canônica em `docs/ROUTES.md`.

## Resumo Estatístico
- **Total de arquivos em `src/routes/`**: 110 rotas
- **Total de rotas registradas em `src/lib/routes.ts`**: 99 rotas
- **Rotas órfãs ou não-registradas**: 11 rotas
- **Status do Mapeamento**: 100% catalogado

---

## 1. Rotas Públicas e da Loja (`_store`)

| Caminho da Rota (`src/routes/`) | Tipo / Módulo | Autenticação | Registrada em `routes.ts`? | Status de Runtime |
| :--- | :--- | :--- | :--- | :--- |
| `_store.index.tsx` | Home Publica | Pública | Sim | `COMPROVADO` |
| `_store.catalogo.index.tsx` | Catálogo / Busca | Pública | Sim | `COMPROVADO` |
| `_store.produto.$slug.tsx` | Detalhes do Produto (PDP) | Pública | Sim | `QUEBRADO NA UI` (Padrão 3) |
| `_store.carrinho.tsx` | Carrinho de Compras | Guest / Customer | Sim | `COMPROVADO` |
| `_store.checkout.tsx` | Finalização de Compra | Guest / Customer | Sim | `COMPROVADO` |
| `_store.pedido.$token.tsx` | Confirmação de Pedido | Pública por Token | Sim | `COMPROVADO` |
| `_store.p.$handle.tsx` | Biolink / Perfil Público | Pública | Sim | `PARCIAL` |
| `_store.conta.index.tsx` | Painel do Cliente | Autenticada (Customer) | Sim | `COMPROVADO` |
| `_store.conta.pedidos.index.tsx` | Lista de Pedidos do Cliente | Autenticada (Customer) | Sim | `COMPROVADO` |
| `_store.conta.pedidos.$id.tsx` | Detalhe do Pedido do Cliente | Autenticada (Customer) | Sim | `COMPROVADO` |
| `_store.conta.enderecos.tsx` | Gestão de Endereços | Autenticada (Customer) | Sim | `COMPROVADO` |
| `_store.conta.avaliacoes.tsx` | Avaliações do Cliente | Autenticada (Customer) | Sim | `QUEBRADO NA UI` (Padrão 3) |

---

## 2. Rotas do Painel Administrativo (`admin`)

| Caminho da Rota (`src/routes/`) | Módulo Admin | Permissão Exigida | Registrada em `routes.ts`? | Status de Runtime |
| :--- | :--- | :--- | :--- | :--- |
| `admin.index.tsx` | Dashboard Geral | `staff` | Sim | `COMPROVADO` |
| `admin.catalogo.produtos.index.tsx` | Lista de Produtos | `content` / `admin` | Sim | `COMPROVADO` |
| `admin.catalogo.produtos.novo.tsx` | Cadastro de Produto | `content` / `admin` | Sim | `PARCIAL` (Duplicado com $id) |
| `admin.catalogo.produtos.$id.tsx` | Editor Avançado de Produto | `content` / `admin` | Sim | `QUEBRADO NA UI` (Padrão 3) |
| `admin.catalogo.categorias.tsx` | Gestão de Categorias | `content` / `admin` | Sim | `COMPROVADO` |
| `admin.catalogo.colecoes.tsx` | Gestão de Coleções | `content` / `admin` | Sim | `COMPROVADO` |
| `admin.catalogo.marcas.tsx` | Gestão de Marcas | `content` / `admin` | Sim | `COMPROVADO` |
| `admin.catalogo.tipos.tsx` | Tipos Adaptativos | `admin` | Sim | `COMPROVADO` |
| `admin.estoque.index.tsx` | Visão Geral do Estoque | `stock` / `admin` | Sim | `COMPROVADO` |
| `admin.estoque.movimentos.tsx` | Histórico de Movimentos | `stock` / `admin` | Sim | `QUEBRADO NA UI` (Padrão 3) |
| `admin.estoque.alertas.tsx` | Alertas de Ruptura | `stock` / `admin` | Sim | `QUEBRADO NA UI` (Padrão 3) |
| `admin.pedidos.index.tsx` | Gestão de Pedidos | `manager` / `admin` | Sim | `COMPROVADO` |
| `admin.pedidos.$id.tsx` | Detalhe do Pedido Operacional | `manager` / `admin` | Sim | `COMPROVADO` |
| `admin.caixa.index.tsx` | PDV e Operação de Caixa | `finance` / `seller` | Sim | `QUEBRADO NA UI` (Padrão 3) |
| `admin.caixa.sessoes.tsx` | Histórico de Sessões de Caixa | `finance` / `admin` | Sim | `QUEBRADO NA UI` (Padrão 3) |
| `admin.financeiro.index.tsx` | Visão Financeira | `finance` / `admin` | Sim | `QUEBRADO NA UI` (Padrão 3) |
| `admin.builder.index.tsx` | Lista de Experiências CMS | `content` / `admin` | Sim | `COMPROVADO` |
| `admin.builder.$documentId.editor.tsx` | Editor WYSIWYG do Builder | `content` / `admin` | Sim | `QUEBRADO NA UI` (Padrão 3) |
| `admin.equipe.index.tsx` | Gestão de Colaboradores | `owner` / `admin` | Sim | `QUEBRADO NA UI` (Padrão 3) |
| `admin.configuracoes.loja.tsx` | Dados da Loja | `owner` / `admin` | Sim | `COMPROVADO` |

---

## 3. Rotas Órfãs / Não Registradas em `src/lib/routes.ts`

Estas rotas existem na pasta `src/routes/` mas **não estão expostas no menu** nem registradas no `routes.ts`:

1. `admin.destaques.tsx` — Padrão 3 desestruturação quebrada.
2. `admin.relatorios.tsx` — Relatórios legados parciais.
3. `admin_.pedidos.$id.recibo.tsx` — Layout de impressão de recibo desanexado do shell.
4. `api.feed.xml.ts` — Feed de produtos XML para Google Shopping.
5. `api.webhooks.pagarme.ts` — Endpoint de Webhook do gateway Pagar.me.
6. `_store.desejos.tsx` — Lista de desejos (UI apenas sem persistência).
7. `_store.comprar-novamente.tsx` — Atalho de recompra.
8. `admin.descontos.combos.tsx` — Descontos progressivos não integrados.
9. `admin.integracoes.webhooks.tsx` — Configuração de Webhooks legada.
10. `admin.marketing.pixel.tsx` — Configuração de Pixels Meta/TikTok.
11. `admin.ferramentas.importador.tsx` — Importador CSV de produtos legados.
