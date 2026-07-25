-- Fix orders_shipping_method_check constraint to support 'manual_table' and 'provider'
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_shipping_method_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_shipping_method_check
  CHECK (shipping_method IN ('pickup', 'delivery', 'manual_table', 'provider', 'manual_quote'));
