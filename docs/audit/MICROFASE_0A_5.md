MICROFASE: 0A.5

MÓDULO: Configurações Fundamentais da Loja

CAPACIDADE: Visualizar log de auditoria e perfil público da loja com RLS e isolamento de tenant.

COMMIT-BASE: `5d90eaf`

### BASELINE

ESTADO ANTERIOR:

- As server functions `getAuditLog` (em `admin.configuracoes.auditoria.tsx`), `getPublicProfile` e `savePublicProfile` (em `admin.perfil-publico.tsx`) estavam definidas localmente nos arquivos de rotas.
- Ambas usavam `.limit(1)` ignorando a restrição de tenant `store_id` do perfil do usuário ativo.
- Havia falsas verificações `res.status === "error"` no frontend que quebravam a tipagem e o build do TypeScript.

### MAPA DO MÓDULO

ROTAS:

- `/admin/configuracoes/auditoria` (`src/routes/admin.configuracoes.auditoria.tsx`): Log de auditoria administrativa.
- `/admin/perfil-publico` (`src/routes/admin.perfil-publico.tsx`): Informações exibidas publicamente na vitrine.

UIS:

- Tela com tabela para renderizar logs de atividades.
- Formulário para editar detalhes como horários de funcionamento, descrição, telefone de atendimento e endereço físico da loja.

ACTIONS:

- `getAuditLog` (GET)
- `getPublicProfile` (GET)
- `savePublicProfile` (POST)

TABELAS:

- `audit_log`
- `stores`

COLUNAS AFETADAS:

- `stores`: `name`, `description`, `phone`, `address`, `business_hours`, `logo_url`.
- `audit_log`: `id`, `action`, `table_name`, `record_id`, `changed_by`, `created_at`, `metadata`.

---

### PROBLEMAS ENCONTRADOS

DIVERGÊNCIA DE TENANT:
Consultas globais e atualizações que não utilizavam `identity.store_id` como âncora rígida.

CONTRATOS DIVERGENTES:
Checks de status redundantes na UI que geravam erros de compilação no typecheck.

---

### PLANO DA MICROFASE

CORREÇÃO:

1. Criado `src/services/audit.functions.ts` [NEW] para isolar a server function de auditoria.
2. Atualizado `src/services/store.functions.ts` [MODIFY] para incluir as lógicas de perfil público.
3. Desacoplados os handlers para permitir testes unitários em Node.
4. Adicionados arquivos de testes unitários `src/services/audit.test.ts` [NEW] e novos casos de testes em `src/services/store.test.ts` [MODIFY].
5. Refatorados `admin.configuracoes.auditoria.tsx` e `admin.perfil-publico.tsx` [MODIFY] para importar os novos serviços, eliminando imports inadequados do Supabase e corrigindo tipagem.

---

### TESTES

CONTRATO:

- Testes unitários rodando sob Vitest simulando Supabase e Identity.
- Comando: `npm run test`
- Resultado: 31 testes passados (incluindo todas as lógicas de auditoria e perfil público).

RUNTIME:

- BLOQUEADO: RUNTIME NÃO EXECUTADO.
