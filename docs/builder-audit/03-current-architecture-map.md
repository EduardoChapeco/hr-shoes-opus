# 03 — Current Architecture Map

> Data: 2026-07-24  
> Projeto: Hr Shoes Commerce  

---

## Mapeamento de Arquitetura Vigente

```
[ Frontend / React 19 + TanStack Start ]
  ├── Client Editor (Admin IDE)
  │    ├── Route: src/routes/admin.builder.$documentId.editor.tsx
  │    ├── Sidepanel Inspector (schema-driven)
  │    ├── ArrayBuilder (Array/Hotspots/Steps editor)
  │    └── Template Selector Modal (home-templates-library.ts)
  │
  ├── Storefront Public Renderer
  │    ├── Route: src/routes/_store.index.tsx (Home)
  │    └── Component: src/components/commerce/experience-renderer.tsx
  │         └── Dynamic Sections (27 registráveis em builder-registry.ts)
  │
[ Server BFF / TanStack Server Functions ]
  ├── File: src/services/builder.functions.ts
  │    ├── getExperienceDocument (Draft load + hydrateBindings)
  │    ├── getPublicExperienceDocumentBySlug (Published load + hydrateBindings)
  │    ├── saveBuilderNodes (Persistence)
  │    ├── publishBuilderVersion (Atomic publish)
  │    ├── applyHomeTemplate (Preset generator)
  │    └── hydrateBindings (Catalog/Store/Review real-data resolution)
  │
[ Database Persistence / Supabase PostgreSQL ]
  ├── Migration 0048_builder_platform_core.sql
  │    ├── Table: public.experience_documents (Multi-tenant via store_id)
  │    ├── Table: public.experience_versions (Draft / Published states)
  │    └── Table: public.experience_nodes (DOM Tree relacional com JSONB properties)
  └── Tables do Catálogo: public.stores, public.products, public.collections, public.reviews
```

### Decisão Arquitetural Confirmada
Nenhum subsistema paralelo ou tabela duplicada foi criado. Todas as mutações e leituras respeitam rigorosamente as 3 tabelas principais da Migration 0048.
