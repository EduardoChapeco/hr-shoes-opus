# Tarefas: Auditoria e Refatoração de CRUDS (Fase 0/1)

- `[x]` **1. Refatorar CRUD de Categorias (`admin.catalogo.categorias`)**
  - `[x]` Adicionar menu de ações na listagem (Editar, Excluir, Arquivar).
  - `[x]` Criar arquivo `admin.catalogo.categorias.$id.tsx` para edição completa.
  - `[x]` Implementar server functions (`updateCategory`, `deleteCategory`).
- `[x]` **2. Refatorar CRUD de Coleções (`admin.catalogo.colecoes`)**
  - `[x]` Adicionar menu de ações na listagem (Editar, Excluir, Arquivar).
  - `[x]` Criar arquivo `admin.catalogo.colecoes.$id.tsx` para edição completa.
  - `[x]` Implementar server functions (`updateCollection`, `deleteCollection`).
- `[x]` **3. Refatorar CRUD de Tipos de Produto (`admin.catalogo.tipos`)**
  - `[x]` Adicionar botões de Editar/Excluir.
  - `[x]` Implementar a mecânica de atualização no Modal existente.
  - `[x]` Implementar server functions (`updateProductType`, `deleteProductType`).
- `[ ]` **4. Revisão Geral e Limpeza**
  - `[ ]` Remover mockups em tabelas de `clientes` e `pedidos` (se houver) e focar em EmptyStates ou CRUDS reais.
  - `[ ]` Garantir que todas as páginas não apresentem erros e sigam as regras do Design System.
  - `[ ]` Build check (`npm run build`) e envio para a nuvem.
