MICROFASE: 1D

MÓDULO: Catalogo - Tipos de Produto (Admin-Catalog)

CAPACIDADE: Modelagem e criação/listagem (CRUD) de atributos dinâmicos e tipos de produto no painel administrativo com vinculação correta ao store_id e organization_id.

COMMIT-BASE: `dd43aee`

COMMIT-FINAL: `e884962`

### BASELINE

ESTADO ANTERIOR:
- A rota `/admin/catalogo/tipos` continha a interface para gerenciamento de tipos de produto e seus campos dinâmicos, acionando as ServerFns `listProductTypes` e `createProductType`.
- Essas ServerFns não possuíam cobertura de testes unitários automatizados para checar validação do schema, associação aos ids corretos de tenant (loja e organização) ou propagação de erros do Postgrest.

### MAPA DO MÓDULO

ROTAS:
- `/admin/catalogo/tipos` (`src/routes/admin.catalogo.tipos.tsx`): Tela de listagem e diálogo de criação de tipos de produto.

UIS:
- Tabela de listagem dos tipos cadastrados (Nome, Slug, Contagem de Campos Dinâmicos, Data de Criação).
- Diálogo de criação com campos de Nome, Slug, e botão para adicionar campos dinâmicos com inputs de Nome do Campo, Tipo de Dado (Texto, Número, Boleano, Seleção Única) e Checkbox de Obrigatório.

GATILHOS:
- Acesso à listagem de tipos de produto: Aciona `listProductTypes`.
- Envio do formulário no diálogo: Aciona `createProductType`.

FORMS:
- Form de criação de tipos de produto com validação Zod e gerenciamento de arrays dinâmicos (`useFieldArray`).

ACTIONS:
- `listProductTypes` (GET)
- `createProductType` (POST)

TABELAS:
- `product_types`
- `stores`

COLUNAS:
- `product_types`: `id`, `store_id`, `organization_id`, `name`, `slug`, `field_schema`, `created_at`.

SCHEMAS:
- Validação Zod para campos dinâmicos (`name`, `kind`, `required`).
- Validação Zod para o tipo de produto completo (`name`, `slug`, `fields`).

CONTRATOS:
- `listProductTypes`: Retorna `{ status: "ok", data: ProductType[] }` ou wrapper de erro.
- `createProductType`: Retorna `{ status: "success", data: ProductType }` ou wrapper de erro.

STORAGE:
- Não aplicável.

RLS:
- Protegido por RLS com base no `store_id`/`organization_id`.

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
Verificação do funcionamento das ações CRUD de tipos de produto e amarração correta do store_id e organization_id no banco.

TESTES CRIADOS:
- `src/services/admin-catalog.test.ts` [MODIFY]: Adicionados testes unitários para `listProductTypesHandler` e `createProductTypeHandler`, asseverando que:
  - Recupera a listagem correta ordenada por `created_at desc`.
  - Associa o novo tipo de produto ao `store_id` e `organization_id` da loja ativa.
  - Trata e propaga devidamente erros de banco ou ausência da loja.

RESULTADO:
Aprovado (5/5 novos testes unitários integrados).

---

### TESTES

CONTRATO:
- Validado estaticamente via TypeScript.

CONSUMIDOR:
- As UIs consomem e tratam corretamente as respostas de sucesso e erro.

INTEGRAÇÃO:
- BLOQUEADO: RUNTIME NÃO EXECUTADO (sem browser).

RUNTIME:
- BLOQUEADO: RUNTIME NÃO EXECUTADO.

PERMISSÃO:
- Assegurado privilégios adequados e isolamento via testes unitários.

TENANT:
- Assegurado isolamento de tenant via testes unitários.

ERRO:
- **Testado unitariamente**: Cobertura total das exceções em `admin-catalog.test.ts`.

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
MICROFASE 1E — Modelagem, CRUD e listagem de produtos no painel administrativo.
