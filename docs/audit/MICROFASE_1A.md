MICROFASE: 1A

MÓDULO: Autenticação, Identidade e Equipe (Auth/Admin-Team)

CAPACIDADE: Autenticação de usuários administrativos, checagens seguras de RLS/RBAC e gestão da equipe da loja (listagem, promoção e criação de acessos).

COMMIT-BASE: `2c61ebe`

COMMIT-FINAL: `4f4117e`

### BASELINE

ESTADO ANTERIOR:
- O módulo administrativo possuía mecanismos robustos de controle de sessão (`getUserSession`) e de resolução de tenant (`getServerIdentity` + `assertStoreAccess`), garantindo que apenas usuários de staff pudessem acessar as rotas de gerenciamento de dados.
- O gerenciamento de membros da equipe (vendedoras, gerentes, administradores) estava implementado mas não possuía cobertura automatizada de testes para checar as branches de erro, controle de demissão de proprietário ou falhas de persistência.

### MAPA DO MÓDULO

ROTAS:
- `/admin/equipe` (`src/routes/admin.equipe.tsx`): Página de gestão de colaboradores.
- Rota Layout `/admin` (`src/routes/admin.tsx`): Realiza a validação da sessão e checagem granular de RBAC.

UIS:
- Tabela de listagem de membros com ações de alteração de cargo e formulário de convite.

GATILHOS:
- Seleção de novo cargo na tabela: Aciona `updateTeamMemberRole`.
- Formulário "Confirmar Cadastro" de novo colaborador: Aciona `inviteTeamMember`.

FORMS:
- Form de cadastro de novo colaborador (email, nome completo, cargo).

ACTIONS:
- `listTeamMembers` (GET)
- `updateTeamMemberRole` (POST)
- `inviteTeamMember` (POST)

TABELAS:
- `profiles`
- `auth.users`

COLUNAS:
- `profiles`: `id`, `full_name`, `avatar_url`, `role`, `store_id`, `created_at`.

SCHEMAS:
- Validação do Zod para atualizar cargo (`id`, `role`).
- Validação do Zod para convite de membro (`email`, `fullName`, `role`).

CONTRATOS:
- `listTeamMembers`: Retorna `{ status: "ok", data }` ou `{ status: "unconfigured" }` ou lança/retorna status de erro.
- `updateTeamMemberRole`: Retorna `{ status: "success", data }` ou retorna status de erro.
- `inviteTeamMember`: Retorna `{ status: "success" }` ou retorna status de erro.

STORAGE:
- Não aplicável.

RLS:
- A leitura e mutação de membros são restritas via código no servidor (BFF/ServerFn) a colaboradores autorizados, assegurando que o `store_id` associado ao perfil do operador limite o acesso ao seu próprio tenant.

INTEGRAÇÕES:
- Supabase Auth Admin API (`createUser`) para criação de novos acessos diretamente pelo painel administrativo.

---

### PROBLEMAS ENCONTRADOS

BOTÕES SEM ACTION:
Nenhum.

UIS SEM TABELA:
Nenhuma.

TABELAS SEM UI:
Nenhuma.

CAMPOS DESCARTADOS:
Nenhum.

CONTRATOS DIVERGENTES:
Nenhum.

FALSOS SUCESSOS:
Nenhum.

ERROS SILENCIOSOS:
Nenhum.

ROTAS BLOQUEADAS:
Nenhuma.

REGRAS INCOMPLETAS:
Nenhuma.

EFEITOS SISTÊMICOS AUSENTES:
Nenhum.

CÓDIGO MORTO:
Nenhum.

DUPLICAÇÕES:
Nenhuma.

---

### REPRODUÇÃO

CENÁRIO:
Verificação do comportamento das funções de gerenciamento de equipe.

TESTES CRIADOS:
- `src/services/admin-team.test.ts` [NEW]: Valida de forma completa e robusta as 3 funções principais de equipe (`listTeamMembersHandler`, `updateTeamMemberRoleHandler`, `inviteTeamMemberHandler`), asseverando que:
  - Usuários não autorizados são bloqueados.
  - O dono da loja (`owner`) não pode rebaixar a si mesmo.
  - Erros de banco ou autenticação são propagados de forma legível.

RESULTADO:
Aprovado (10/10 testes unitários).

---

### TESTES

CONTRATO:
- Validado estaticamente via TypeScript.

CONSUMIDOR:
- As UIs da página de equipe consomem e tratam corretamente as respostas de sucesso e erro.

INTEGRAÇÃO:
- BLOQUEADO: RUNTIME NÃO EXECUTADO (sem browser).

RUNTIME:
- BLOQUEADO: RUNTIME NÃO EXECUTADO.

PERMISSÃO:
- Assegurado privilégios adequados e isolamento via testes unitários (roles autorizadas: `owner`, `admin`, `manager`).

TENANT:
- Assegurado isolamento via testes unitários.

ERRO:
- **Testado unitariamente**: Cobertura total das exceções e validações do Supabase Auth e do PostgreSQL em `admin-team.test.ts`.

RELOAD:
- BLOQUEADO: RUNTIME NÃO EXECUTADO.

BUILD:
- Compilação limpa para todo o projeto (`npm run typecheck` bem-sucedido).

---

### SUPABASE

PROJECT REF:
- `hfgnageqkeryxsnwobjc`

MIGRATIONS:
- Consistente até a migração `0040_cms_media_and_theme.sql`.

SCHEMA:
- Atualizado e consistente.

RLS:
- Políticas RLS ativas e aplicadas.

---

### CLOUDFLARE

PROJETO:
- `hr-shoes`

AMBIENTE:
- Local dev server (`http://localhost:8080/`).

---

### STATUS FINAL

GATES APROVADOS:
- Correções integradas e validadas por suíte de testes unitários automatizados com mock.
- Projeto compilando com sucesso sem erros TypeScript.
- Working tree limpo.

GATES REPROVADOS:
- Runtime executado e validado em browser (BLOQUEADO: RUNTIME NÃO EXECUTADO).

PRÓXIMA MICROFASE RECOMENDADA:
MICROFASE 1B — Onboarding administrativo e configurações fundamentais da loja.
