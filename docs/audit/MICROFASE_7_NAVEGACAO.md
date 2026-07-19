# Auditoria de Microfase — Navegação & Shell (`admin-shell.tsx`)

## FASE 1 — BASELINE DO CICLO

### GIT
- **Branch**: `main`
- **HEAD Commit**: `5dfd80edfcd44c67b58e9eeaafa71a1876e51486` (feat(upsell): implement upsell engine db, services and checkout offers page for microphase 7)
- **Hash Remoto**: `5dfd80edfcd44c67b58e9eeaafa71a1876e51486`
- **Working Tree**: Clean (`nothing to commit, working tree clean`)
- **Arquivos Alterados**: Nenhum
- **Arquivos Não Rastreados**: Nenhum
- **Commits desde o último ciclo**: 1 commit (`feat(upsell): implement upsell engine db...`)

### AMBIENTE
- **Local**: `c:\Users\Excelência Tour SMO\Documents\hr-shoes-opus`
- **Preview / Produção**: `https://eduardochapeco-hr-shoes-opus.pages.dev`
- **Project Ref Supabase**: `hfgnageqkeryxsnwobjc`
- **Projeto Cloudflare**: `hrshoes` (Pages build output dir: `dist`)
- **Migrations Locais/Remotas**: Pushed até `0058_upsell_rules.sql` via Supabase CLI.

### DOCUMENTAÇÃO EXISTENTE
- **Audit Files**: `docs/audit/MICROFASE_3A_CAIXA.md`, `docs/audit/current-state.md`
- **Riscos Restantes**: TypeScript typecheck com erros preexistentes em `src/routes/api.auth.callback.ts` e `src/routes/api.auth.confirm.ts`.

---

## FASE 2 — ESCOLHA DA MICROFASE

- **Módulo**: Navegação / Shell Administrativo (`AdminShell`)
- **Capacidade**: Alternador de contexto ("Voltar aos Módulos" / subpáginas), botões de ação contextuais coerentes e navegação completa por subpáginas no Mobile.
- **Rotas**: N/A (Modificação no Shell global que envolve todas as rotas `/admin/*`)
- **Actions**: N/A (UI layout logic only)
- **Tabelas**: N/A
- **Risco**: Baixo (apenas layout e navegação do lado do cliente)
- **Motivo da Prioridade**: Resolver o maior bloqueador de usabilidade apontado pelo usuário, onde o botão "Voltar aos Módulos" deixava o menu travado (sem carregar as subpáginas ao clicar no mesmo módulo) e o mobile não permitia acessar subpáginas de forma alguma.
- **Dependências**: Nenhuma.

---

## FASE 3 — MAPA COMPLETO DO MÓDULO (Navegação & Shell)

### Objetivo funcional
O `AdminShell` organiza as rotas administrativas em "Módulos" principais (Visão Geral, Catálogo, Vendas, Relacionamento, Conteúdo & Vitrine, Operação). Ao clicar em um módulo, o painel deve exibir as respectivas subpáginas (ex: no módulo Catálogo, mostra Produtos, Atributos Globais, etc.). 
O botão contextual superior deve adaptar-se: se o usuário está em uma listagem, oferece ação de criar novo registro (ex: "Novo Produto"); se está em uma página de detalhe/edição/criação, deve funcionar como botão de "Voltar para Lista".

### Storyboard
1. **Desktop / Clique em Módulo**:
   - Usuário clica em "Voltar aos Módulos". `viewMode` muda para `"modules"`.
   - Usuário clica no mesmo módulo atual. A rota não muda, mas a sidebar com `onClick` força `viewMode` a voltar para `"subpages"`, destravando a listagem de subpáginas.
2. **Mobile / Acesso a Subpáginas**:
   - Usuário mobile abre o Sheet lateral.
   - O Sheet detecta `viewMode === "subpages"` e renderiza a listagem de subpáginas do módulo ativo (com botão "← Módulos" para retornar aos principais).
   - Se `viewMode === "modules"`, lista os módulos principais e, ao tocar em um deles, navega para a rota e chaveia para `"subpages"`.
3. **Botão Contextual**:
   - Usuário abre `/admin/catalogo/produtos/novo`. O botão superior contextual detecta que não está na lista base e renderiza "← Voltar para Lista" com link para `/admin/catalogo/produtos` e ícone `ChevronLeft`.

---

## FASE 11 — PLANO DE IMPLEMENTAÇÃO

### Causa raiz dos bugs
1. **Sidebar travando em Módulos**: O `viewMode` só voltava a `"subpages"` através de um `useEffect` ouvindo a mudança de `pathname`. Ao clicar no módulo ativo, o `pathname` não sofria alteração, fazendo com que o `useEffect` não rodasse e a sidebar continuasse em `"modules"` permanentemente.
2. **Navegação Mobile quebrada**: O Sheet de navegação no mobile renderizava apenas a listagem estática de `MODULES` principais, sem nenhuma lógica de alternar para subpáginas ou respeitar o `viewMode` ativo do painel.
3. **Ações redundantes na barra superior**: O helper `getContextualAction` sempre retornava a ação de criação (ex: "Novo Produto" apontando para `/admin/catalogo/produtos/novo`) mesmo quando o usuário já estava dentro da rota `/admin/catalogo/produtos/novo`.

### Correções
1. Adicionar `onClick={() => setViewMode("subpages")}` aos links de módulos (desktop e mobile).
2. Sincronizar o menu lateral mobile (Sheet) para renderizar a mesma alternância de subpáginas + botão "← Módulos" do desktop.
3. Refatorar o `getContextualAction(pathname)` para identificar rotas de criação/detalhes e retornar um botão de retorno à lista pai correspondente.
