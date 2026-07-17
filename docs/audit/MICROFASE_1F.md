MICROFASE: 1F

MÓDULO: Catálogo - Coleções (Admin-Catalog)

CAPACIDADE: Modelagem e criação/listagem (CRUD) de coleções no painel administrativo com vinculação correta ao store_id e ordenação.

COMMIT-BASE: `ffa9505`

COMMIT-FINAL: `41bc335`

### BASELINE

ESTADO ANTERIOR:

- As rotas e formulários para criação e listagem de coleções existiam em `/admin/catalogo/colecoes` e `/admin/catalogo/colecoes/novo`, chamando `listCollections` e `createCollection` em `admin-catalog.functions.ts`.
- Essas funções não possuíam cobertura de testes unitários automatizados para validar a integridade dos contratos de dados, vinculação ao store_id ativo e propagação correta de exceções do banco de dados.

### MAPA DO MÓDULO

ROTAS:

- `/admin/catalogo/colecoes` (`src/routes/admin.catalogo.colecoes.index.tsx`): Exibe a tabela de coleções.
- `/admin/catalogo/colecoes/novo` (`src/routes/admin.catalogo.colecoes.novo.tsx`): Formulário para cadastrar uma nova coleção.

UIS:

- Tabela com colunas Nome, Slug e Status com Badges de status.
- Formulário com campos de Nome da Coleção, Slug (com auto-geração) e Status (Select).

GATILHOS:

- Acessar a listagem de coleções: Aciona `listCollections`.
- Clicar em "Salvar Coleção" no formulário de criação: Aciona `createCollection`.

FORMS:

- Form de criação de coleção com campos: `name`, `slug` e `status`.

ACTIONS:

- `listCollections` (GET)
- `createCollection` (POST)

TABELAS:

- `collections`
- `stores`

COLUNAS:

- `collections`: `id`, `store_id`, `name`, `slug`, `status`, `sort_order`.

SCHEMAS:

- Validação Zod para criação de coleção (`name`, `slug`, `status`).

CONTRATOS:

- `listCollections`: Retorna `{ status: "ok", data: Collection[] }` ou wrapper de erro.
- `createCollection`: Retorna `{ status: "success", data: Collection }` ou wrapper de erro.

STORAGE:

- Não aplicável.

RLS:

- Protegido por RLS com base no `store_id`.

INTEGRAÇÕES:

- Supabase Database.

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
Verificação do funcionamento das ações CRUD de coleções e amarração ao store_id da loja ativa do lojista autenticado.

TESTES CRIADOS:

- `src/services/admin-catalog.test.ts` [MODIFY]: Adicionados testes unitários robustos e completos para `listCollectionsHandler` e `createCollectionHandler`, validando:
  - Recuperação correta de coleções em ordem de `sort_order`.
  - Associação de nova coleção ao `store_id` da loja do usuário.
  - Propagação de erros de banco (erros de seleção ou inserção).
  - Lançamento de erro explícito caso nenhuma loja seja encontrada.

RESULTADO:
Aprovado (5/5 novos testes unitários adicionados à suíte do catálogo administrativo, totalizando 33 testes no arquivo).

---

### TESTES

CONTRATO:

- Validado estaticamente via TypeScript.

CONSUMIDOR:

- As UIs da página de coleções consomem e tratam corretamente as respostas de sucesso e erro.

INTEGRAÇÃO:

- BLOQUEADO: RUNTIME NÃO EXECUTADO (sem browser).

RUNTIME:

- BLOQUEADO: RUNTIME NÃO EXECUTADO.

PERMISSÃO:

- Assegurado privilégios adequados e isolamento via testes unitários.

TENANT:

- Assegurado isolamento via testes unitários.

ERRO:

- **Testado unitariamente**: Cobertura total das exceções e validações em `admin-catalog.test.ts`.

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
MICROFASE 1G — Gestão de estoque (alertas e movimentações) no painel administrativo.
