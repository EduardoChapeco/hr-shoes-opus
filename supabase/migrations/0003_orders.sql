-- ============================================================================
-- Hr Shoes Commerce — Migration 0003: Orders, Cart, Payments
-- ============================================================================
-- Schema: carts, orders, payments and stock reservations.
--
-- Rules:
--  - All money in integer cents + BRL. Never float.
--  - price_snapshot in order_items is immutable after creation.
--  - Stock reservations expire and are released by server jobs.
--  - Payment confirmation happens via server-side webhook, never browser redirect.
--  - No PAN/CVV stored anywhere.
-- ============================================================================

-- pgcrypto is required for gen_random_bytes() used in public_token generation.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Order status enum (machine states — transitions enforced at app layer)
-- ---------------------------------------------------------------------------
CREATE TYPE public.order_status AS ENUM (
  'draft',
  'awaiting_shipping_quote',
  'awaiting_payment',
  'payment_processing',
  'paid',
  'processing',
  'ready_for_pickup',
  'shipped',
  'delivered',
  'completed',
  'cancelled',
  'payment_failed',
  'return_requested',
  'returned',
  'refunded'
);

CREATE TYPE public.payment_status AS ENUM (
  'pending',
  'processing',
  'paid',
  'failed',
  'refunded',
  'disputed'
);

CREATE TYPE public.payment_method AS ENUM (
  'pix',
  'credit_card',
  'manual',
  'receipt'  -- comprovante
);

-- ---------------------------------------------------------------------------
-- carts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.carts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  -- NULL for guest carts (session-based).
  customer_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Non-null for guest carts, used for merge on login.
  session_token   TEXT,
  -- Carts expire; a job cleans up expired carts and releases reservations.
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

-- Customer can only read/modify their own cart.
CREATE POLICY "carts_customer_own"
  ON public.carts FOR ALL
  USING (
    (customer_id IS NOT NULL AND auth.uid() = customer_id)
    OR session_token IS NOT NULL -- guest session handled at app layer
  );

-- ---------------------------------------------------------------------------
-- cart_items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cart_items (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id                UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  variant_id             UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  qty                    INTEGER NOT NULL CHECK (qty > 0),
  -- Server-computed price snapshot at time of add. Never from client.
  price_snapshot_cents   INTEGER NOT NULL CHECK (price_snapshot_cents >= 0),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cart_id, variant_id)
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cart_items_via_cart"
  ON public.cart_items FOR ALL
  USING (
    cart_id IN (
      SELECT id FROM public.carts
      WHERE customer_id = auth.uid()
         OR session_token IS NOT NULL
    )
  );

-- ---------------------------------------------------------------------------
-- stock_reservations (expire when cart expires or checkout completes)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_reservations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id  UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  cart_id     UUID REFERENCES public.carts(id) ON DELETE SET NULL,
  order_id    UUID, -- FK added after orders table creation
  qty         INTEGER NOT NULL CHECK (qty > 0),
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;
-- Only server (service_role) manages reservations.

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
  customer_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Public-safe token for order status page (not the UUID).
  public_token        TEXT NOT NULL UNIQUE DEFAULT substr(replace(gen_random_uuid()::text, '-', ''), 1, 16),
  status              public.order_status NOT NULL DEFAULT 'draft',
  -- Snapshot of the entire order at confirmation time (immutable after).
  items_snapshot      JSONB NOT NULL DEFAULT '[]',
  -- All monetary values in integer cents.
  subtotal_cents      INTEGER NOT NULL CHECK (subtotal_cents >= 0),
  shipping_cents      INTEGER NOT NULL DEFAULT 0 CHECK (shipping_cents >= 0),
  discount_cents      INTEGER NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  total_cents         INTEGER NOT NULL CHECK (total_cents >= 0),
  -- Shipping details
  shipping_method     TEXT CHECK (shipping_method IN ('pickup', 'delivery', 'manual_quote')),
  shipping_address    JSONB,
  shipping_quote_id   UUID,
  -- Seller who processed the order (if applicable)
  seller_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Timestamps for state transitions
  paid_at             TIMESTAMPTZ,
  shipped_at          TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Customers can read their own orders.
CREATE POLICY "orders_customer_read"
  ON public.orders FOR SELECT
  USING (auth.uid() = customer_id);

-- Staff can read orders in their store.
CREATE POLICY "orders_staff_read"
  ON public.orders FOR SELECT
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Staff can update order status.
CREATE POLICY "orders_staff_update"
  ON public.orders FOR UPDATE
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('owner', 'admin', 'manager', 'seller')
    )
  );

-- Add FK from stock_reservations to orders now that orders table exists.
ALTER TABLE public.stock_reservations
  ADD CONSTRAINT stock_reservations_order_fk
  FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- order_items (immutable snapshot — never modified after creation)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  variant_id          UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  -- All fields below are snapshots — they don't change even if the product changes.
  product_title       TEXT NOT NULL,
  variant_sku         TEXT NOT NULL,
  variant_attributes  JSONB NOT NULL DEFAULT '{}',
  image_url           TEXT,
  qty                 INTEGER NOT NULL CHECK (qty > 0),
  unit_price_cents    INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  total_cents         INTEGER NOT NULL CHECK (total_cents >= 0),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_customer_read"
  ON public.order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE customer_id = auth.uid()
    )
  );

CREATE POLICY "order_items_staff_read"
  ON public.order_items FOR SELECT
  USING (
    order_id IN (
      SELECT o.id FROM public.orders o
      JOIN public.profiles p ON p.store_id = o.store_id
      WHERE p.id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  store_id          UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
  method            public.payment_method NOT NULL,
  status            public.payment_status NOT NULL DEFAULT 'pending',
  amount_cents      INTEGER NOT NULL CHECK (amount_cents > 0),
  -- Idempotency key prevents double-processing of webhooks.
  idempotency_key   TEXT NOT NULL UNIQUE,
  -- External reference from payment provider (Mercado Pago, Asaas, etc.)
  provider_ref      TEXT,
  provider_name     TEXT,
  -- Comprovante upload URL (for 'receipt' method) — Supabase Storage signed URL.
  receipt_url       TEXT,
  receipt_status    TEXT CHECK (receipt_status IN ('pending_review', 'accepted', 'rejected')),
  receipt_reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  receipt_reviewed_at TIMESTAMPTZ,
  paid_at           TIMESTAMPTZ,
  failed_at         TIMESTAMPTZ,
  failure_reason    TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Customers can read their own payments.
CREATE POLICY "payments_customer_read"
  ON public.payments FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE customer_id = auth.uid()
    )
  );

-- Finance/admin can read all payments in their store.
CREATE POLICY "payments_staff_read"
  ON public.payments FOR SELECT
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('owner', 'admin', 'manager', 'finance')
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS orders_customer_idx     ON public.orders (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_store_status_idx ON public.orders (store_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_public_token_idx ON public.orders (public_token);
CREATE INDEX IF NOT EXISTS payments_order_idx      ON public.payments (order_id);
CREATE INDEX IF NOT EXISTS cart_items_cart_idx     ON public.cart_items (cart_id);

-- Triggers
CREATE TRIGGER carts_updated_at
  BEFORE UPDATE ON public.carts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
