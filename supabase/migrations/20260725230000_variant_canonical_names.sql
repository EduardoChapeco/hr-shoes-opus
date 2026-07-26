-- Migration: 20260725230000_variant_canonical_names
-- Automates the generation of `display_name` to ensure a Canonical source of truth.

CREATE OR REPLACE FUNCTION public.tf_generate_variant_display_name()
RETURNS TRIGGER AS $$
DECLARE
  v_product_title TEXT;
  v_attr_values TEXT;
BEGIN
  -- Fetch the base product title
  SELECT title INTO v_product_title FROM public.products WHERE id = NEW.product_id;

  -- Extract the values from the JSONB attributes and join them (e.g. "Azul / 39")
  IF NEW.attributes IS NOT NULL AND jsonb_typeof(NEW.attributes) = 'object' THEN
    SELECT string_agg(value, ' / ') INTO v_attr_values
    FROM jsonb_each_text(NEW.attributes);
  END IF;

  -- Combine
  IF v_attr_values IS NOT NULL AND v_attr_values != '' THEN
    NEW.display_name := v_product_title || ' — ' || v_attr_values;
  ELSE
    NEW.display_name := v_product_title;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_variant_display_name ON public.product_variants;

CREATE TRIGGER trigger_generate_variant_display_name
BEFORE INSERT OR UPDATE OF attributes, product_id
ON public.product_variants
FOR EACH ROW
EXECUTE FUNCTION public.tf_generate_variant_display_name();

-- Backfill existing records
UPDATE public.product_variants SET updated_at = now() WHERE display_name IS NULL;
