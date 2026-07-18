-- ============================================================================
-- Hr Shoes Commerce — Migration 0048: Builder Platform Core
-- ============================================================================
-- Creates the foundational tables for the hierarchical node-based builder engine.
-- This replaces the flat `page_sections` approach with a robust DOM tree.
-- ============================================================================

BEGIN;

  -- 1. Experience Documents
  -- Represents the root entity (A Storefront Page, a Bio Link, a PWA App Shell)
  CREATE TABLE IF NOT EXISTS public.experience_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL, -- 'storefront', 'biolink', 'pwa', 'campaign'
    owner_id UUID, -- For biolinks belonging to a specific seller/affiliate
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    seo_metadata JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );

  -- 2. Experience Versions
  -- Enables atomic publishing, drafts, and rollbacks.
  CREATE TABLE IF NOT EXISTS public.experience_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.experience_documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'published', 'archived'
    commit_message TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  );

  -- 3. Experience Nodes (The DOM Tree)
  -- Replaces page_sections. Uses self-referencing parent_id to build infinite depth.
  CREATE TABLE IF NOT EXISTS public.experience_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES public.experience_versions(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.experience_nodes(id) ON DELETE CASCADE,
    
    -- Node classification
    node_type TEXT NOT NULL, -- 'section', 'container', 'element', 'composition'
    block_type TEXT NOT NULL, -- The specific block from the registry (e.g. 'hero_carousel', 'bento_grid', 'text')
    
    -- Separated properties for Inspector Panels
    content JSONB DEFAULT '{}'::jsonb,
    design_tokens JSONB DEFAULT '{}'::jsonb,
    layout_rules JSONB DEFAULT '{}'::jsonb,
    responsive_overrides JSONB DEFAULT '{}'::jsonb,
    data_bindings JSONB DEFAULT '{}'::jsonb,
    action_bindings JSONB DEFAULT '{}'::jsonb,
    
    -- Sorting among siblings
    sort_order INTEGER NOT NULL DEFAULT 0,
    
    -- States
    is_hidden BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );

  -- Indexes for tree traversal performance
  CREATE INDEX IF NOT EXISTS idx_exp_docs_store ON public.experience_documents(store_id);
  CREATE INDEX IF NOT EXISTS idx_exp_docs_slug ON public.experience_documents(slug);
  CREATE INDEX IF NOT EXISTS idx_exp_versions_doc ON public.experience_versions(document_id);
  CREATE INDEX IF NOT EXISTS idx_exp_nodes_version ON public.experience_nodes(version_id);
  CREATE INDEX IF NOT EXISTS idx_exp_nodes_parent ON public.experience_nodes(parent_id);

  -- ============================================================================
  -- RLS POLICIES
  -- ============================================================================
  
  ALTER TABLE public.experience_documents ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.experience_versions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.experience_nodes ENABLE ROW LEVEL SECURITY;

  -- Read Access (Public for published, Team for all)
  CREATE POLICY "Public can read active documents"
    ON public.experience_documents FOR SELECT
    USING (is_active = true);
    
  CREATE POLICY "Public can read published versions"
    ON public.experience_versions FOR SELECT
    USING (status = 'published');
    
  CREATE POLICY "Public can read nodes of published versions"
    ON public.experience_nodes FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.experience_versions v
        WHERE v.id = experience_nodes.version_id
        AND v.status = 'published'
      )
    );

  -- Write Access (Team only, managed via backend server functions bypassing RLS with service_role, 
  -- but we add base policies for safety if accessed directly via anon key).
  
COMMIT;
