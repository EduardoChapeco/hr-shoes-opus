# Auditoria Forense — Estado Atual das Rotas (`docs/audit/current-state.md`)

Este documento mapeia o estado real de todas as rotas públicas, de cliente e administrativas registradas no sistema, identificando seu respectivo nível de prontidão em runtime e dependências.

## 1. Rotas Públicas e de Cliente (`PUBLIC_ROUTES` & `CUSTOMER_ROUTES`)

| Rota | Objetivo | Componente e BFF | Status de Runtime | Observações |
| --- | --- | --- | --- | --- |
| `/` | Home / Vitrine | `_store.index.tsx` | **PARCIAL** | Renderiza a estrutura da loja, mas os banners dependem de dados do CMS. |
| `/produto/:slug` | Página de Detalhes | `_store.produto.$slug.tsx` | **EVIDÊNCIA** | Modelo híbrido implementado. Buy box nativa funcional, área inferior renderizada pelo Builder. |
| `/catalogo` | Catálogo de Produtos | `_store.catalogo.tsx` | **HIPÓTESE** | Listagem de produtos filtrados do Supabase, sem paginação ainda. |
| `/categoria/:slug` | Filtro por Categoria | `_store.categoria.$slug.tsx` | **HIPÓTESE** | Sem validação rigorosa de categoria inexistente. |
| `/colecao/:slug` | Filtro por Coleção | `_store.colecao.$slug.tsx` | **HIPÓTESE** | Puxa dados do banco, mas layout não testado em mobile. |
| `/buscar` | Busca de Produtos | `_store.buscar.tsx` | **NÃO VERIFICADO** | Realiza busca simples. |
| `/promocoes` | Promoções Ativas | `_store.promocoes.tsx` | **NÃO VERIFICADO** | Depende de cupons ativos no banco. |
| `/stories` | Visualização de Stories | `_store.stories.tsx` | **MOCKADO** | Stories ainda carregados de arrays estáticos/sem persistência dinâmica. |
| `/faq` | Perguntas Frequentes | `_store.faq.tsx` | **HIPÓTESE** | Renderiza accordion com dados preexistentes. |
| `/contato` | Formulário Fale Conosco | `_store.contato.tsx` | **ARQUITETURALMENTE FRÁGIL** | Envia dados, mas CRM de leads não valida autorizações no servidor. |
| `/carrinho` | Itens no Carrinho | `_store.carrinho.tsx` | **SIMULADO** | Persistência local/cookie sem verificação de estoque autoritativa no servidor em tempo real. |
| `/checkout` | Conclusão de Compra | `_store.checkout.tsx` | **ARQUITETURALMENTE FRÁGIL** | Múltiplas etapas de checkout manual sem integração real de gateways de pagamento. |
| `/pedido/:publicToken/confirmacao` | Recibo/Confirmação | `_store.pedido...confirmacao.tsx` | **HIPÓTESE** | Depende do token de pedido gerado no checkout. |
| `/entrar` / `/cadastro` | Autenticação Cliente | `_store.entrar.tsx` | **PARCIAL** | Usa Supabase Auth, mas sem RLS rígida aplicada às clientes ainda. |
| `/conta/pedidos` | Histórico da Cliente | `_store.conta.pedidos.index.tsx` | **HIPÓTESE** | Exibe lista de pedidos, sem RLS de cliente verificada sob ataque. |
| `/conta/conversas/:id` | Suporte em Tempo Real | `_store.conta.conversas.$id.tsx` | **COMPROVADO** | Usa Realtime do Supabase client-side para exibição das mensagens. |

---

## 2. Rotas Administrativas (`ADMIN_ROUTES`)

| Rota | Objetivo | Componente e BFF | Status de Runtime | Observações |
| --- | --- | --- | --- | --- |
| `/admin` | Visão Geral / Dashboard | `admin.index.tsx` | **PARCIAL** | Exibe KPIs agregados baseados na tabela de vendas, sem drilldown. |
| `/admin/onboarding` | Primeiros Passos | `admin.onboarding.tsx` | **NENHUMA IMPLEMENTAÇÃO** | Apenas um shell de checklist estático. |
| `/admin/catalogo/produtos` | Lista de Produtos | `admin.catalogo.produtos.index.tsx` | **PARCIAL** | Listagem funcional, sem filtros avançados ou ações em lote estáveis. |
| `/admin/catalogo/produtos/novo` | Criação de Produto | `admin.catalogo.produtos.novo.tsx` | **HIPÓTESE** | Valida com Zod no BFF, mas imagens salvam no storage com client-side direto. |
| `/admin/catalogo/produtos/:id` | Edição de Produto | `admin.catalogo.produtos.$id.tsx` | **HIPÓTESE** | Carrega dados e salva modificações. |
| `/admin/catalogo/atributos` | Definição de Atributos | `admin.catalogo.atributos.tsx` | **HIPÓTESE** | Gerencia tamanho, cor, etc. |
| `/admin/catalogo/tipos` | Schemas de Produto | `admin.catalogo.tipos.tsx` | **NÃO VERIFICADO** | Atribui atributos aos schemas. |
| `/admin/catalogo/categorias` | Árvore de Categorias | `admin.catalogo.categorias.index.tsx` | **NÃO VERIFICADO** | Gestão de categorias. |
| `/admin/catalogo/colecoes` | Coleções Curadas | `admin.catalogo.colecoes.index.tsx` | **NÃO VERIFICADO** | Gestão de coleções. |
| `/admin/midias` | Biblioteca de Mídia | `admin.midias.tsx` | **VULNERÁVEL** | Instancia SDK do Supabase no cliente com chaves públicas para upload direto (Bypass de BFF). |
| `/admin/estoque` | Saldo de Estoque | `admin.estoque.index.tsx` | **PARCIAL** | Exibe saldo, mas os ajustes manuais não possuem logs de auditoria detalhados. |
| `/admin/estoque/movimentos` | Histórico do Estoque | `admin.estoque.movimentos.tsx` | **HIPÓTESE** | Mostra histórico de movimentações. |
| `/admin/pedidos` | Listagem de Vendas | `admin.pedidos.index.tsx` | **PARCIAL** | Exibe Kanban, mas as transições de status não usam máquinas de estado rígidas. |
| `/admin/fretes/tabelas` | Zonas de Frete | `admin.fretes.tabelas.tsx` | **COMPROVADO** | Centraliza listagem, exclusão e edição de prefixos de CEP e taxas. |
| `/admin/caixa` | Controle de Turno/Caixa | `admin.caixa.index.tsx` | **PARCIAL** | Fluxo de abertura e fechamento via RPC implementado, mas sem conciliação de PDV real. |
| `/admin/caixa/turnos` | Histórico de Caixas | `admin.caixa.turnos.tsx` | **NÃO VERIFICADO** | Listagem simples de turnos fechados. |
| `/admin/caixa/lancamentos` | Entradas/Saídas de Gaveta | `admin.caixa.lancamentos.tsx` | **NÃO VERIFICADO** | Listagem de entradas e saídas avulsas. |
| `/admin/builder` | Lista de Experiências | `admin.builder.index.tsx` | **COMPROVADO** | Gestão de storefronts, biolinks e campanhas. Conectado ao botão "Ver Métricas". |
| `/admin/builder/analytics` | Painel de Telemetria | `admin.builder.analytics.tsx` | **ALTERADO, MAS AINDA NÃO COMPROVADO** | Rota de telemetria baseada em Recharts criada e typecheck aprovado. Sem massa de dados real em produção. |
| `/admin/builder/:documentId/editor` | Editor de Nós | `admin.builder.$documentId.editor.tsx` | **PARCIAL** | Permite alterar a árvore DOM de componentes, mas sem histórico de drafts completo. |
| `/admin/equipe` | Gestão de Colaboradores | `admin.equipe.tsx` | **COMPROVADO** | Testes unitários de permissões e listagem cobrem branches de erro com sucesso. |
| `/admin/marketing/cupons` | Cupons e Promoções | `admin.marketing.cupons.tsx` | **HIPÓTESE** | Criação de cupons para desconto. |
| `/admin/marketing/gift-cards` | Gestão de Gift Cards | `admin.marketing.gift-cards.tsx` | **HIPÓTESE** | Criação e cancelamento com server boundary. |
| `/admin/suporte` / `/admin/conversas` | Chat Admin | `admin.conversas.tsx` | **PARCIAL** | Responder conversas de suporte em tempo real. |
