-- ============================================================================
-- Hr Shoes Commerce — Migration 0019: Cart Shipping & Coupons
-- ============================================================================

-- Add coupon and shipping fields to the carts table.
ALTER TABLE public.carts
  ADD COLUMN coupon_code VARCHAR(50),
  ADD COLUMN discount_cents INTEGER NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  ADD COLUMN shipping_cents INTEGER NOT NULL DEFAULT 0 CHECK (shipping_cents >= 0),
  ADD COLUMN shipping_zipcode VARCHAR(20),
  ADD COLUMN shipping_method TEXT; -- To store selected rate
