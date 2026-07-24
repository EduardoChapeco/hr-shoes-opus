# Audit e Inventário do Estado Atual — CMS & Builder Engine

> Data: 2026-07-24  
> Projeto: Hr Shoes Commerce  
> Status: Fase 0 — Concluída  

---

## 1. Arquitetura Geral do Editor / Builder

O sistema possui duas camadas históricas coexistentes no banco de dados e nos serviços:

1. **Camada Legada (`pages` e `page_sections`)**:
   - Tabelas: `public.pages` e `public.page_sections`.
   - Modelo flat: `page_id` → lista simples de seções com `section_type`, `sort_order` e JSON `content`.
   - Utilizada em instâncias de seed antigas (`0070_cms_home_seed.sql`) e em `src/services/cms.functions.ts`.

2. **Camada Canônica (`experience_documents`, `experience_versions`, `experience_nodes`)**:
   - Tabelas (Migration `0048_builder_platform_core.sql`):
     - `experience_documents`: Representa o documento mestre (`storefront`, `biolink`, `pwa`, `campaign`, `seller_showcase`).
     - `experience_versions`: Controle atômico de versões (`draft`, `published`, `archived`), habilitando autosave e publicação sem impacto direto no storefront público.
     - `experience_nodes`: Árvore DOM relacional hierárquica (nós auto-referenciados por `parent_id`), divididos por `node_type` (`section`, `container`, `element`, `composition`) e `block_type`.
   - Tipagem: `src/lib/builder-types.ts`.
   - Registrador Tipado: `src/lib/builder-registry.ts`.
   - Servidor BFF: `src/services/builder.functions.ts`.
   - Interface de Edição: `src/routes/admin.builder.$documentId.editor.tsx`.
   - Renderizador Público/Storefront: `src/components/commerce/experience-renderer.tsx`.

---

## 2. Inventário de Arquivos e Componentes

| Arquivo / Diretório | Responsabilidade | Status | Evidência / Diagnóstico |
|---|---|---|---|
| `src/lib/builder-types.ts` | Definição de interfaces TypeScript (`ExperienceDocument`, `ExperienceNode`, `BlockManifest`, `InspectorField`) | **Reutilizar & Estender** | Define a base tipada da árvore DOM e dos campos de inspeção do sidepanel. |
| `src/lib/builder-registry.ts` | Registry canônico de todos os blocos suportados (`hero_carousel`, `bento_grid`, `product_rail`, `stories_ring`, etc.) | **Reutilizar & Estender** | Contém a definição de 18+ blocos com schemas Zod e definições de inspetor. |
| `src/lib/cms-templates.ts` & `templates-default.ts` | Mapeamento de presets estáticos de templates de páginas | **Refatorar & Unificar** | Atualmente existem definições paralelas de templates em `cms-templates.ts` e `builder.functions.ts`. Devem ser consolidadas na nova Biblioteca Canônica de Templates. |
| `src/services/builder.functions.ts` | BFF / Server Functions (TanStack Start) para CRUD de documentos, nodes e hidratação de bindings | **Reutilizar & Estender** | Hidrata `data_bindings` reais (`store_profile`, `product_collection`, `latest_products`, `dynamic_reviews`) sem duplicar catálogo no JSON. |
| `src/routes/admin.builder.$documentId.editor.tsx` | Painel visual do editor de páginas (Tree View, Preview responsivo, Sidepanel de propriedades, Drag-and-Drop) | **Reutilizar & Estender** | Editor totalmente funcional com navegação visual por iframe/preview, inspeção dinâmica via schema e salvamento em rascunho. |
| `src/components/commerce/experience-renderer.tsx` | Renderizador dinâmico de nós no storefront público | **Reutilizar & Estender** | Renderiza recursivamente nós da árvore DOM `experience_nodes`, associando aos componentes visuais de `dynamic-sections`. |
| `src/components/commerce/dynamic-sections/*` | Biblioteca de 23 componentes React visuais (`hero-carousel`, `bento-grid`, `mosaic-banners`, etc.) | **Reutilizar & Expandir** | Componentes estilizados com Tailwind v4. Necessitam de suporte a hotspots, variantes adicionais, PDP configurável e filtros. |

---

## 3. Modelo de Banco de Dados Vigente

- `public.experience_documents`: Multi-tenant via `store_id`, com `slug`, `title`, `document_type` e `seo_metadata`.
- `public.experience_versions`: FK para `document_id`, com `version_number`, `status` e `created_at`.
- `public.experience_nodes`: FK para `version_id` e auto-FK `parent_id`, contendo colunas separadas `content`, `design_tokens`, `layout_rules`, `responsive_overrides`, `data_bindings`, `action_bindings`.

---

## 4. Avaliação de Riscos e Compatibilidade

1. **Risco de Duplicação de Templates**: Existência de presets legados no schema de `pages` versus `experience_documents`.
   - *Mitigação*: Concentrar 100% da biblioteca de presets no motor de `experience_documents`/`experience_nodes`, mantendo compatibilidade de hidratação.
2. **Risco de Hydration Mismatch**: Renderização SSR x Client-side no TanStack Start em blocos dinâmicos como `countdown_timer` e `product_rail`.
   - *Mitigação*: Utilizar `transient_data` resolvido exclusivamente via BFF no servidor em `builder.functions.ts`.
