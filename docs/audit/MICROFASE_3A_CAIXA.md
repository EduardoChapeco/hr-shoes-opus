MICROFASE: 3A

MODULO: Caixa

COMO O MODULO FUNCIONA HOJE:

- Existe rota principal em `/admin/caixa`, rotas auxiliares em `/admin/caixa/turnos` e `/admin/caixa/lancamentos`.
- A abertura, fechamento e lancamentos passam por `src/services/cash.functions.ts`.
- O saldo do turno ativo e derivado de `cash_registers.initial_balance_cents` + soma de `cash_register_entries.amount_cents`.
- O fechamento usa o RPC atomico `close_cash_register`.

STORYBOARD ATUAL:

- Operadora entra em Caixa.
- Se nao ha turno, abre caixa com fundo de troco.
- Se ha turno, ve saldo, entradas, saidas, ultimos movimentos e acoes de lancar/fechar.
- Historico fica em Turnos; lancamentos manuais tambem podem ser feitos na rota dedicada.

POR QUE ESTAVA SIMPLES:

- A tela anterior era centrada em formulario/resumo, com pouca leitura operacional.
- O loader dependia de join direto entre `cash_registers.opened_by` e `profiles` por um FK que aponta para `auth.users`, criando risco real de Error Boundary.
- O erro de carregamento virava boundary generica em vez de estado explicito.
- Parsing monetario estava duplicado entre telas e uma rota usava `parseFloat`, fraco para formato BRL.

O QUE ESTA FALTANDO:

- PDV completo ainda nao existe.
- Vendas, Pix, cartao, carnê, gift card e comissoes ainda precisam registrar entradas por fluxos dedicados.
- Historico de turnos ainda nao agrega entradas/saidas por turno fechado.
- Impressao/recibo de caixa ainda nao foi implementado.

ROTAS EXISTENTES:

- `/admin/caixa`
- `/admin/caixa/turnos`
- `/admin/caixa/lancamentos`

ROTAS OCULTAS OU NAO CONECTADAS:

- As rotas `/admin/caixa/turnos` e `/admin/caixa/lancamentos` existem e nao ficam como itens diretos da sidebar; foram conectadas por acoes dentro da tela principal.

TABELAS:

- `cash_registers`
- `cash_register_entries`

ACTIONS:

- `getActiveRegister`
- `openRegister`
- `closeRegister`
- `addRegisterEntry`
- `listRegisterHistory`
- RPC `close_cash_register`

BOTOES:

- Abrir caixa: conectado a `openRegister`.
- Lancamento avulso: conectado a `addRegisterEntry`.
- Fechar caixa: conectado a `closeRegister`.
- Turnos e Lancamentos: navegam para rotas reais existentes.

INTEGRACOES:

- Supabase Database via Server Functions.
- Nenhuma credencial externa simulada.

NIVEL ATUAL:

- Operacional basico estabilizado.

NIVEL ALVO:

- Caixa profissional integrado ao PDV, pagamentos, pedidos, comissoes e relatorios financeiros.

STORYBOARD DESEJADO:

- Caixa deve ser centro de turno: abrir, registrar movimentos, receber entradas vindas do PDV/pagamentos, auditar diferencas, fechar e alimentar dashboard financeiro.

PLANO DE EVOLUCAO:

- Microfase atual: estabilizar loader, erro explicito, resumo operacional e parsing monetario canonico.
- Proxima microfase: decidir e iniciar PDV ou integrar entradas de pagamentos reais ao Caixa.

CORRECOES:

- Removido join fragil `profiles!cash_registers_opened_by_fkey`.
- `profiles` agora e buscado separadamente pelos IDs de `opened_by`/`closed_by`.
- Erros do Supabase agora incluem `error.message` no servidor para revelar causa real.
- A rota principal renderiza `ErrorState` proprio quando o loader falha.
- Parsing BRL foi centralizado em `parseCurrencyInputToCents`.

REFATORACOES:

- Criado `src/lib/cash.ts` com tipos e helpers de caixa.
- Criado contrato tipado para `ActiveCashRegister`, `CashRegisterEntry` e `CashRegisterHistoryItem`.
- Tela principal reorganizada em metricas, ledger recente e acoes do turno.

CAPACIDADES NOVAS:

- Visualizacao dos ultimos lancamentos do turno ativo.
- Cards de saldo atual, entradas, saidas/sangrias e fundo inicial.
- Acoes de navegacao para Turnos e Lancamentos a partir da tela principal.
- Estado de erro explicito para falha no loader.

CONEXOES ENTRE MODULOS:

- Caixa fica pronto para receber lancamentos vindos de PDV, pagamentos e pedidos por services dedicados.
- O modulo ainda nao calcula comissoes nem baixa estoque; isso pertence a microfase de PDV/pedidos.

FONTES CANONICAS:

- Dinheiro continua como integer cents.
- Formatação usa `src/lib/money.ts`.
- Datas usam `src/lib/datetime.ts`.
- Rotas continuam no registry canonico.
- Regras financeiras continuam server-side.

DESIGN SYSTEM:

- Sem dados ficticios.
- Sem sucesso simulado.
- Estados empty/error reais.
- UI usa tokens e componentes existentes.

TESTES:

- Criado `src/lib/cash.test.ts`.
- `npx.cmd vitest run src/lib/cash.test.ts`: aprovado, 2 testes.
- Primeiro teste falhou ao revelar parsing incorreto de `R$ 1.250,05`; helper corrigido e suite passou.
- `npm.cmd run typecheck`: bloqueado por erro preexistente em `src/routes/_store.match-time.tsx(43,22)`, arquivo ja alterado antes desta microfase.

RUNTIME:

- Runtime visual completo nao comprovado com login/sessao.
- A compilacao TypeScript global nao ficou limpa por causa de `match-time`, fora do escopo e ja sujo no inicio.

GIT:

- Working tree ja iniciou sujo em:
  - `src/routes/_store.match-time.tsx`
  - `src/routes/admin.match-time.tsx`
  - `src/services/match-time.functions.ts`
- Esta microfase alterou apenas Caixa, helpers e documento de auditoria.

PROBLEMAS RESTANTES:

- Corrigir `match-time` para liberar typecheck global.
- Validar runtime logado do Caixa.
- Agregar entradas/saidas no historico de turnos fechados.
- Definir microfase PDV sem misturar com fechamento de caixa.

PROXIMA MICROFASE:

- PDV: auditar existencia real de rota/modulo, decidir rota canonica e conectar fluxo minimo de venda assistida ao Caixa sem calculo financeiro no cliente.

STATUS FINAL:
MICROFASE ALTERADA, MAS NAO COMPROVADA

## Inventario de maturidade dos modulos atuais

| Modulo            | Rotas/codigo localizados                           | Maturidade      | Observacao                                                              |
| ----------------- | -------------------------------------------------- | --------------- | ----------------------------------------------------------------------- |
| Visao Geral       | `/admin`                                           | Inicial         | Dashboard ainda simples, sem loader canonico de indicadores.            |
| Onboarding        | `/admin/onboarding`                                | Inicial         | Continua rota de sidebar; deve migrar para Configuracoes.               |
| Produtos          | `/admin/catalogo/produtos`, novo, detalhe          | Parcial         | Existe modulo, mas ainda precisa acoes profissionais e editor avancado. |
| Categorias        | `/admin/catalogo/categorias`, novo                 | Parcial         | Existe rota, nao esta na sidebar direta.                                |
| Marcas            | Nao localizado como rota propria                   | Baixo           | Pode estar ausente ou fundido no catalogo.                              |
| Variantes         | `catalogo/atributos`, tipos, migration variants    | Parcial         | Base existe, gestao canonica ainda incompleta.                          |
| Estoque           | `/admin/estoque`, movimentos, alertas              | Parcial         | Existe modulo operacional inicial.                                      |
| PDV               | Nao localizado como rota propria                   | Baixo           | Caixa existe, mas PDV completo nao.                                     |
| Pedidos           | `/admin/pedidos`, detalhe, recibo                  | Parcial         | Existe modulo e recibo, precisa filas/operacao.                         |
| Separacao e Envio | Nao localizado como modulo proprio                 | Baixo           | Deve ser decisao dentro de Pedidos ou modulo dedicado.                  |
| Pagamentos        | `/admin/pagamentos`, comprovantes                  | Parcial         | Existe, depende de conciliacao e caixa.                                 |
| Clientes          | `/admin/clientes`, detalhe                         | Parcial         | Existe base de CRM, precisa ficha 360 completa.                         |
| CRM               | `crm.functions.ts`, clientes                       | Parcial         | Funcionalidade espalhada, sem maturidade 360 comprovada.                |
| Conversas         | `/admin/conversas`, `chat.functions.ts`            | Parcial/Risco   | Prompt aponta falha; precisa auditoria propria.                         |
| Caixa             | `/admin/caixa`, turnos, lancamentos                | Parcial         | Microfase estabilizou loader e UX operacional basica.                   |
| CMS               | `/admin/cms/paginas`, editor, navegacao, tema      | Parcial         | Existe registry/renderers, builder ainda simples.                       |
| Visual Builder    | `/admin/cms/paginas/:id/editor`                    | Inicial/Parcial | Precisa evoluir para layout de tres areas.                              |
| Perfil da Loja    | `/admin/perfil-publico`, publico `/perfil-da-loja` | Parcial         | Existe, precisa usar CMS/renderers em profundidade.                     |
| Link da Bio       | `/admin/link-da-bio`, publico `/links`             | Parcial         | Existe rota e migration stories/bio.                                    |
| Stories           | `/admin/stories`, publico `/stories`               | Parcial         | Existe, maturidade operacional nao auditada.                            |
| Configuracoes     | loja, pagamentos, politicas, lgpd, auditoria, seo  | Parcial         | Muitas rotas existem, sidebar mostra apenas Loja como entrada.          |
