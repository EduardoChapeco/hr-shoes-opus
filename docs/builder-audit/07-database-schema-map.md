# 07 — Database Schema Map

> Data: 2026-07-24  
> Projeto: Hr Shoes Commerce  

---

## Mapeamento de Tabelas e Constraints (Migration `0048_builder_platform_core.sql`)

### 1. `public.experience_documents`
- `id`: `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `store_id`: `uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE`
- `title`: `text NOT NULL`
- `slug`: `text NOT NULL`
- `document_type`: `text NOT NULL CHECK (document_type IN ('storefront', 'biolink', 'pwa', 'campaign', 'seller_showcase', 'product_template', 'campaign_popup'))`
- `is_active`: `boolean DEFAULT true`
- `created_at`, `updated_at`: `timestamptz DEFAULT now()`
- **Unique Constraint**: `UNIQUE (store_id, slug, document_type)`

### 2. `public.experience_versions`
- `id`: `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `document_id`: `uuid NOT NULL REFERENCES public.experience_documents(id) ON DELETE CASCADE`
- `version_number`: `integer NOT NULL`
- `status`: `text NOT NULL CHECK (status IN ('draft', 'published', 'archived'))`
- `published_at`: `timestamptz NULL`
- `created_at`: `timestamptz DEFAULT now()`

### 3. `public.experience_nodes`
- `id`: `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `version_id`: `uuid NOT NULL REFERENCES public.experience_versions(id) ON DELETE CASCADE`
- `parent_id`: `uuid NULL REFERENCES public.experience_nodes(id) ON DELETE CASCADE`
- `node_type`: `text NOT NULL CHECK (node_type IN ('section', 'container', 'element', 'composition'))`
- `block_type`: `text NOT NULL`
- `sort_order`: `integer NOT NULL DEFAULT 0`
- `content`: `jsonb NOT NULL DEFAULT '{}'::jsonb`
- `design_tokens`: `jsonb NOT NULL DEFAULT '{}'::jsonb`
- `layout_rules`: `jsonb NOT NULL DEFAULT '{}'::jsonb`
- `data_bindings`: `jsonb NOT NULL DEFAULT '{}'::jsonb`
- `responsive_overrides`: `jsonb NOT NULL DEFAULT '{}'::jsonb`
- `created_at`, `updated_at`: `timestamptz DEFAULT now()`

### Status de Integridade
Integridade referencial mantida com `ON DELETE CASCADE`. O multi-tenancy é isolado estritamente por `store_id`.
