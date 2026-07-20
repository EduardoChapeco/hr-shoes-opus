-- ============================================================================
-- Hr Shoes Commerce — Migration 0068: Store Followers & Reviews
-- ============================================================================

-- 1. Create store_followers table
CREATE TABLE IF NOT EXISTS public.store_followers (
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (store_id, customer_id)
);

ALTER TABLE public.store_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_followers_public_read"
  ON public.store_followers FOR SELECT
  USING (true);

CREATE POLICY "store_followers_customer_all"
  ON public.store_followers FOR ALL
  USING (customer_id = auth.uid());

CREATE POLICY "store_followers_staff_read"
  ON public.store_followers FOR SELECT
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'seller', 'content')
    )
  );

-- 2. Update reviews default status to 'approved' for immediate visibility
ALTER TABLE public.reviews ALTER COLUMN status SET DEFAULT 'approved';

-- 3. Create function to get average rating for a product
CREATE OR REPLACE FUNCTION public.get_product_review_stats(p_product_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_avg_rating numeric;
  v_total_reviews integer;
BEGIN
  SELECT 
    ROUND(AVG(rating), 1),
    COUNT(*)
  INTO 
    v_avg_rating,
    v_total_reviews
  FROM public.reviews
  WHERE product_id = p_product_id AND status = 'approved';

  RETURN jsonb_build_object(
    'average_rating', COALESCE(v_avg_rating, 0),
    'total_reviews', COALESCE(v_total_reviews, 0)
  );
END;
$$;
