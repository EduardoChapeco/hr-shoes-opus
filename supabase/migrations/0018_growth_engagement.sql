-- ============================================================================
-- Hr Shoes Commerce — Migration 0018: Growth Engagement & Carts
-- ============================================================================

-- ---------------------------------------------------------------------------
-- abandoned_carts_log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.abandoned_carts_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  cart_id          UUID REFERENCES public.carts(id) ON DELETE SET NULL,
  customer_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_email      VARCHAR(255),
  guest_phone      VARCHAR(50),
  total_cents      INTEGER NOT NULL DEFAULT 0,
  items_snapshot   JSONB NOT NULL DEFAULT '[]',
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'recovered', 'lost', 'contacted')),
  
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.abandoned_carts_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "abandoned_carts_staff_all"
  ON public.abandoned_carts_log FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'seller')
    )
  );

-- ---------------------------------------------------------------------------
-- match_time_campaigns
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.match_time_campaigns (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name             VARCHAR(100) NOT NULL,
  prize_description TEXT NOT NULL,
  coupon_code      VARCHAR(50), -- Link to a coupon
  starts_at        TIMESTAMPTZ NOT NULL,
  ends_at          TIMESTAMPTZ NOT NULL,
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'finished')),
  
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.match_time_campaigns ENABLE ROW LEVEL SECURITY;

-- Public can see active campaigns
CREATE POLICY "match_time_public_read"
  ON public.match_time_campaigns FOR SELECT
  USING (status = 'active');

CREATE POLICY "match_time_staff_all"
  ON public.match_time_campaigns FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'content')
    )
  );

-- ---------------------------------------------------------------------------
-- social_posts_assets
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.social_posts_assets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  platform         VARCHAR(50) NOT NULL, -- instagram, facebook, tiktok
  content_text     TEXT NOT NULL,
  image_url        TEXT,
  is_published     BOOLEAN NOT NULL DEFAULT false,
  
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.social_posts_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_posts_staff_all"
  ON public.social_posts_assets FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'content')
    )
  );


-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
CREATE TRIGGER abandoned_carts_updated_at
  BEFORE UPDATE ON public.abandoned_carts_log
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER match_time_updated_at
  BEFORE UPDATE ON public.match_time_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER social_posts_updated_at
  BEFORE UPDATE ON public.social_posts_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
