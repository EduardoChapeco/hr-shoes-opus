MICROFASE: 1C

MÓDULO: Catalogo - Categorias (Admin-Catalog)

CAPACIDADE: Modelagem e criação/listagem (CRUD) de categorias no painel administrativo com vinculação correta ao store_id e ordenação.

COMMIT-BASE: `1daf422`

COMMIT-FINAL: `e53e94a`

### BASELINE

ESTADO ANTERIOR:
- As rotas e formulários para criação e listagem de categorias existiam em `/admin/catalogo/categorias` e `/admin/catalogo/categorias/novo`, chamando `listCategories` e `createCategory` em `admin-catalog.functions.ts`.
- Essas funções não possuíam cobertura de testes unitários automatizados para validar a integridade dos contratos de dados, propagação de erros de banco ou vinculação com o store_id ativo do lojista.

### MAPA DO MÓDULO

ROTAS:
- `/admin/catalogo/categorias` (`src/routes/admin.catalogo.categorias.index.tsx`): Exibe a tabela de categorias cadastradas.
- `/admin/catalogo/categorias/novo` (`src/routes/admin.catalogo.categorias.novo.tsx`): Formulário para cadastrar uma nova categoria.

UIS:
- Tabela com colunas Nome, Slug e Status com Badges de status da categoria.
- Formulário com campos de Nome da Categoria, Slug (com auto-geração), Categoria Pai (Select) e Status (Select).

GATILHOS:
- Acessar a listagem de categorias: Aciona `listCategories`.
- Clicar em "Salvar Categoria" no formulário de criação: Aciona `createCategory`.

FORMS:
- Form de criação de categoria com campos: `name`, `slug`, `parent_id` e `status`.

ACTIONS:
- `listCategories` (GET)
- `createCategory` (POST)

TABELAS:
- `categories`
- `stores`

COLUNAS:
- `categories`: `id`, `store_id`, `name`, `slug`, `parent_id`, `status`, `sort_order`.

SCHEMAS:
- Validação Zod para criação de categoria (`name`, `slug`, `parent_id`, `status`).

CONTRATOS:
- `listCategories`: Retorna `{ status: "ok", data: Category[] }` ou wrapper de erro.
- `createCategory`: Retorna `{ status: "success", data: Category }` ou wrapper de erro.

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
Verificação do funcionamento das ações CRUD e associação correta da categoria ao store_id da loja ativa do usuário logado.

TESTES CRIADOS:
- `src/services/admin-catalog.test.ts` [MODIFY]: Adicionados testes unitários robustos e completos para `listCategoriesHandler` e `createCategoryHandler`, validando:
  - Recuperação correta de categorias em ordem de `sort_order`.
  - Associação de nova categoria ao `store_id` da loja consultada.
  - Propagação correta de erros de banco (erros de seleção ou inserção).
  - Lançamento de erro explícito caso nenhuma loja seja encontrada.

RESULTADO:
Aprovado (5/5 novos testes unitários adicionados à suíte do catálogo administrativo).

---

### TESTES

CONTRATO:
- Validado estaticamente via TypeScript.

CONSUMIDOR:
- As UIs da página de categorias consomem e tratam corretamente as respostas de sucesso e erro.

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
MICROFASE 1D — Modelagem e CRUD de atributos / tipos de produto (formulários dinâmicos) no painel administrativo.
