# Auditoria Delta 01 — Inventário de Evolução do Builder / CMS

> Data: 2026-07-24  
> Projeto: Hr Shoes Commerce  
> Diretriz Inviolável: **Proibido duplicar qualquer implementação existente.**

---

## 1. Classificação do Inventário Atual (Delta 01)

| Elemento / Subsistema | Status | Evidência no Código / Banco | Diretriz de Execução |
|---|---|---|---|
| **Arquitetura de Nós DOM Hierárquicos** | **EXISTE** | `public.experience_nodes` (Migration 0048), `src/lib/builder-types.ts` (`ExperienceNode`) | **Reutilizar 100%**. Manter estrutura de `parent_id`, `node_type` e `block_type`. |
| **Sistema de Versionamento e Rascunho** | **EXISTE** | `public.experience_versions` (Migration 0048), `saveBuilderNodes`, `publishBuilderVersion` em `builder.functions.ts` | **Reutilizar 100%**. Permite editar rascunhos sem impacto na loja pública até a publicação atômica. |
| **Registrador Canônico de Blocos (`builderRegistry`)** | **EXISTE & ESTENDIDO** | `src/lib/builder-registry.ts` com 27 manifestos Zod e inspetores | **Pode ser estendido**. Qualquer novo bloco ou propriedade deve ser registrado via schema Zod neste arquivo único. |
| **Biblioteca de Temas de Vitrine** | **EXISTE & ESTENDIDO** | `src/lib/home-templates-library.ts` (10 presets) & `applyHomeTemplate` em `builder.functions.ts` | **Reutilizar & Estender**. Novas variações de temas entram como presets tipados nesta biblioteca, sem tabelas novas. |
| **Hidratação de Fontes Dinâmicas (BFF)** | **EXISTE** | `hydrateBindings` em `builder.functions.ts` (`store_profile`, `latest_products`, `product_collection`, `dynamic_reviews`) | **Pode ser estendido**. Conecta o catálogo real da loja sem duplicar dados no JSON do bloco. |
| **Card de Produto Canônico (`ProductCard`)** | **EXISTE** | `src/components/commerce/product-card.tsx` | **Pode virar variante**. Proibido recriar cards em seções novas. Usar variantes (`classic`, `minimal`, `editorial`, `compact`). |
| **Hotspots de Produto (Shop The Look)** | **EXISTE** | `image_hotspots` em `builder-registry.ts` & `image-hotspots.tsx` | **Reutilizar & Estender**. Suporta coordenadas percentuais X/Y e mini-card flutuante com links semânticos. |
| **Passos da Rotina (`routine_steps`)** | **EXISTE** | `routine_steps` em `builder-registry.ts` & `routine-steps.tsx` | **Reutilizar & Estender**. Sequência numerada associável a produtos. |
| **Destaque de Ingredientes (`ingredient_spotlight`)** | **EXISTE** | `ingredient_spotlight` em `builder-registry.ts` & `ingredient-spotlight.tsx` | **Reutilizar & Estender**. Cards de ativos/materiais. |
| **Comparador Antes/Depois (`before_after_slider`)** | **EXISTE** | `before_after_slider` em `builder-registry.ts` & `before-after-slider.tsx` | **Reutilizar & Estender**. Slider arrastável interativo. |
| **Sistema de Preview Responsivo** | **EXISTE** | `admin.builder.$documentId.editor.tsx` com alternância Desktop / Mobile | **Reutilizar 100%**. |
| **Tabelas Legadas (`pages` e `page_sections`)** | **OBSOLETO** | Migrations 0004 e 0070 | **Não utilizar para novas rotas do builder**. Manter apenas para legado se necessário. |

---

## 2. Invariantes de Reutilização Integrada

1. **Camada BFF Protegida**: Nenhuma consulta direta ao Supabase no frontend. Toda hidratação de bindings passa por `src/services/builder.functions.ts`.
2. **Sem Redundância no Banco**: Nenhuma nova tabela será criada. Todas as expansões usam o documento `experience_documents` e os nós `experience_nodes`.
3. **Padrão de Variantes**: Ajustes de estilo ou layout em botões, headings, grids ou cards devem ser resolvidos por props/variantes nos componentes de `src/components/commerce/dynamic-sections/`.
