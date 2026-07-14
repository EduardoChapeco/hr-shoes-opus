-- ============================================================================
-- Hr Shoes Commerce — Migration 0017: Growth & Integrations
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE public.coupon_discount_type AS ENUM (
  'percentage',
  'fixed_amount',
  'free_shipping'
);

CREATE TYPE public.integration_provider AS ENUM (
  'meta_pixel',
  'google_analytics',
  'melhor_envio',
  'nuvemshop',
  'webhook'
);

-- ---------------------------------------------------------------------------
-- coupons
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupons (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  code             VARCHAR(50) NOT NULL,
  discount_type    public.coupon_discount_type NOT NULL,
  discount_value   NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  is_active        BOOLEAN NOT NULL DEFAULT true,
  
  -- Limits & Eligibility
  min_order_cents  INTEGER,
  max_uses         INTEGER,
  uses_count       INTEGER NOT NULL DEFAULT 0,
  starts_at        TIMESTAMPTZ,
  expires_at       TIMESTAMPTZ,
  
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(store_id, code)
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Customers can only read active, non-expired coupons (to apply in cart)
CREATE POLICY "coupons_public_read"
  ON public.coupons FOR SELECT
  USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR uses_count < max_uses)
  );

-- Staff can manage all coupons
CREATE POLICY "coupons_staff_all"
  ON public.coupons FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'finance')
    )
  );

-- ---------------------------------------------------------------------------
-- shipping_zones
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipping_zones (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name             VARCHAR(100) NOT NULL,
  regions          JSONB NOT NULL DEFAULT '[]', -- List of states/zipcode ranges
  is_active        BOOLEAN NOT NULL DEFAULT true,
  
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shipping_zones_public_read"
  ON public.shipping_zones FOR SELECT
  USING (is_active = true);

CREATE POLICY "shipping_zones_staff_all"
  ON public.shipping_zones FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

-- ---------------------------------------------------------------------------
-- shipping_rates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipping_rates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id          UUID NOT NULL REFERENCES public.shipping_zones(id) ON DELETE CASCADE,
  name             VARCHAR(100) NOT NULL,
  price_cents      INTEGER NOT NULL CHECK (price_cents >= 0),
  min_order_cents  INTEGER,
  max_order_cents  INTEGER,
  estimated_days   INTEGER,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shipping_rates_public_read"
  ON public.shipping_rates FOR SELECT
  USING (is_active = true);

CREATE POLICY "shipping_rates_staff_all"
  ON public.shipping_rates FOR ALL
  USING (
    zone_id IN (
      SELECT id FROM public.shipping_zones WHERE store_id IN (
        SELECT store_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager')
      )
    )
  );

-- ---------------------------------------------------------------------------
-- integration_credentials
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.integration_credentials (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  provider         public.integration_provider NOT NULL,
  credentials      JSONB NOT NULL, -- Encrypted or sensitive tokens
  is_active        BOOLEAN NOT NULL DEFAULT true,
  
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(store_id, provider)
);

ALTER TABLE public.integration_credentials ENABLE ROW LEVEL SECURITY;

-- ONLY Server/Edge can read credentials directly, or Owners. 
-- Customers MUST NOT read this table.
CREATE POLICY "integrations_owner_all"
  ON public.integration_credentials FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );


-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
CREATE TRIGGER coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER shipping_zones_updated_at
  BEFORE UPDATE ON public.shipping_zones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER shipping_rates_updated_at
  BEFORE UPDATE ON public.shipping_rates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER integrations_updated_at
  BEFORE UPDATE ON public.integration_credentials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
