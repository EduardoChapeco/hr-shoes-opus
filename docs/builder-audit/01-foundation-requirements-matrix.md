# 01 — Foundation Requirements Matrix

> Data: 2026-07-24  
> Projeto: Hr Shoes Commerce  

---

## Matriz Auditável do Prompt Foundation

| ID | Categoria | Requisito Foundation | Status | Evidência Concreta no Repositório | Teste de Aceite / Validação |
|---|---|---|---|---|---|
| **F-01** | Arquitetura | Estrutura hierárquica baseada em seções, containers e elementos | `FULLY_VALIDATED` | `src/lib/builder-types.ts` (`NodeType = 'section' \| 'container' \| 'element' \| 'composition'`) | Inspeção de nós via `getExperienceDocument` |
| **F-02** | Banco | Suporte a versão draft e versão publicada para publicação atômica | `FULLY_VALIDATED` | `public.experience_versions` (Migration 0048), `saveBuilderNodes` & `publishBuilderVersion` | Testado salvamento de rascunho sem alterar versão pública |
| **F-03** | BFF | Proibição de acesso direto ao Supabase no React frontend | `FULLY_VALIDATED` | `src/services/builder.functions.ts` exporta `createServerFn` para todas as mutações/leituras | Código React importa apenas de `@/services/*` |
| **F-04** | Catálogo | Consulta de preços, estoques e variantes a partir da fonte real de dados | `FULLY_VALIDATED` | `hydrateBindings` em `src/services/builder.functions.ts` busca de `products` e `collections` | Preço retornado em centavos BRL diretamente da DB |
| **F-05** | Editor | Sidepanel schema-driven orientado a grupos (Conteúdo, Design, Layout) | `FULLY_VALIDATED` | `src/routes/admin.builder.$documentId.editor.tsx` lê `blockManifest.inspector` | Formulários dinâmicos atualizam nós sem rerender global |
| **F-06** | Editor | Suporte a upload de mídias integrado à biblioteca de arquivos da loja | `FULLY_VALIDATED` | `MediaUploader.tsx` e `listMediaAssets` em `builder.functions.ts` | Upload seleciona mídias da loja atual |
| **F-07** | Renderizador | Renderização recursiva no storefront público | `FULLY_VALIDATED` | `src/components/commerce/experience-renderer.tsx` renderiza nós com `componentMap` | Vitrine pública em `_store.index.tsx` exibe os componentes |
| **F-08** | Multi-tenant | Isolamento rigoroso por `store_id` em todas as consultas | `FULLY_VALIDATED` | RLS policies em `0048_builder_platform_core.sql` e filtro `eq("store_id", storeId)` em BFF | Validação de autorização em cada server function |
