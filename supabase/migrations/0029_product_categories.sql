-- ============================================================================
-- Hr Shoes Commerce — Migration 0029: Product Categories Mapping
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.product_categories (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, category_id)
);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_categories_public_read"
  ON public.product_categories FOR SELECT
  USING (
    product_id IN (SELECT id FROM public.products WHERE status = 'published')
  );

CREATE POLICY "product_categories_staff_write"
  ON public.product_categories FOR ALL
  USING (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.profiles pr ON pr.store_id = p.store_id
      WHERE pr.id = auth.uid()
        AND pr.role IN ('owner', 'admin', 'manager', 'content')
    )
  );
