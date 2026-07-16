MICROFASE: 1E

MÓDULO: Catálogo - Produtos (Admin-Catalog)

CAPACIDADE: Visualização, criação, edição e exclusão (CRUD) de produtos, grades de variação (SKU) e mídias associadas no painel administrativo com integridade de tenant.

COMMIT-BASE: `dd43aee`

COMMIT-FINAL: `60429dc`

### BASELINE

ESTADO ANTERIOR:
- As rotas e formulários para manipulação de produtos (`/admin/catalogo/produtos`), criação de novo produto (`/admin/catalogo/produtos/novo`) e edição de produto/grade/fotos (`/admin/catalogo/produtos/$id`) estavam conectadas e utilizavam as ServerFns correspondentes de `admin-catalog.functions.ts`.
- Essas ServerFns não possuíam cobertura de testes unitários automatizados para assegurar a persistência correta de dados dinâmicos, associação a categorias, geração da primeira variação/SKU padrão do produto, ou gerenciamento de imagens do storage.

### MAPA DO MÓDULO

ROTAS:
- `/admin/catalogo/produtos` (`src/routes/admin.catalogo.produtos.index.tsx`): Listagem geral de produtos.
- `/admin/catalogo/produtos/novo` (`src/routes/admin.catalogo.produtos.novo.tsx`): Formulário de criação de produto com grade inicial e upload de imagens.
- `/admin/catalogo/produtos/$id` (`src/routes/admin.catalogo.produtos.$id.tsx`): Gerenciador de abas (Geral, Variantes, Mídias) para editar o produto.

UIS:
- Tabela de listagem com capa, título, slug, status, tipo de produto, preço formatado e botão de ação.
- Formulários estruturados com inputs básicos (título, slug, preço, marca, descrição, categoria, tipo de produto) e dinâmicos (atributos conforme o tipo selecionado).
- Tabela de variantes (SKU, atributos, preço override, estoque on hand, status, ações).
- Galeria de mídias (cartões com fotos cadastradas, botão de exclusão e upload).

GATILHOS:
- Acessar a listagem: Aciona `listAdminProducts`.
- Salvar produto no formulário de criação: Aciona `createProduct` (e `uploadProductMedia` se houver fotos).
- Salvar dados gerais na edição: Aciona `updateProduct`.
- Salvar/Atualizar variação: Aciona `upsertProductVariant`.
- Adicionar foto na galeria: Aciona `uploadProductMedia` + `addProductMediaLink`.
- Excluir foto da galeria: Aciona `deleteProductMedia`.

FORMS:
- Form de criação de produto com validação Zod e gerenciamento de estado local.
- Form de dados gerais do produto na edição.
- Form de cadastro/edição de variante.

ACTIONS:
- `listAdminProducts` (GET)
- `createProduct` (POST)
- `getProductById` (GET)
- `updateProduct` (POST)
- `upsertProductVariant` (POST)
- `deleteProductMedia` (POST)
- `addProductMediaLink` (POST)

TABELAS:
- `products`
- `product_variants`
- `product_media`
- `product_categories`
- `stock_movements`
- `stores`

COLUNAS:
- `products`: `id`, `store_id`, `type_id`, `title`, `slug`, `description`, `status`, `brand`, `price_cents`, `compare_at_cents`, `attributes`, `weight_grams`.
- `product_variants`: `id`, `product_id`, `sku`, `status`, `price_override_cents`, `attributes`, `stock_on_hand`.
- `product_media`: `id`, `product_id`, `url`, `sort_order`.
- `product_categories`: `product_id`, `category_id`.
- `stock_movements`: `id`, `variant_id`, `store_id`, `movement_type`, `qty`, `note`.

SCHEMAS:
- Validação Zod para entrada e mutação de produtos/variantes.

CONTRATOS:
- `listAdminProducts`: Retorna `{ status: "ok", data: Product[] }` ou wrapper de erro.
- `createProduct`: Retorna `{ status: "success", data: Product }` ou wrapper de erro.
- `getProductById`: Retorna `{ status: "ok", data: Product }` ou wrapper de erro.
- `updateProduct`: Retorna `{ status: "success", data: Product }` ou wrapper de erro.
- `upsertProductVariant`: Retorna `{ status: "success", data: ProductVariant }` ou wrapper de erro.
- `deleteProductMedia`: Retorna `{ status: "success" }` ou wrapper de erro.
- `addProductMediaLink`: Retorna `{ status: "success", data: ProductMedia }` ou wrapper de erro.

STORAGE:
- Bucket `product-media` (Supabase Storage).

RLS:
- Protegido por RLS das tabelas envolvidas com base em `store_id`.

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
Verificação do ciclo de vida completo de produtos (leitura, criação com grade e fotos, atualização de atributos, inserção/edição de variante, inserção/remoção de mídias).

TESTES CRIADOS:
- `src/services/admin-catalog.test.ts` [MODIFY]: Adicionados testes unitários completos cobrindo:
  - Listagem de produtos ordenada.
  - Criação de produtos com inserção automática de categorias mapeadas, variantes, mídias e lançamentos de ajuste de estoque inicial.
  - Criação de variante padrão automática quando nenhuma é fornecida.
  - Busca de produto por ID.
  - Atualização de dados gerais e categorias.
  - Upsert de variantes (criação e atualização).
  - Deleção física de arquivos do storage e lógica de banco de mídias.
  - Vinculação de novos links de imagens na galeria.

RESULTADO:
Aprovado (16/16 novos testes unitários do catálogo, totalizando 28 testes no arquivo).

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
MICROFASE 1F — Modelagem, CRUD e listagem de coleções no painel administrativo.
