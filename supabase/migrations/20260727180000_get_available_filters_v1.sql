-- 20260727180000_get_available_filters_v1.sql
-- Extrai facetas (Tamanho, Cor, Material, etc) e seus valores únicos
-- apenas de produtos publicados e com estoque em variações ativas.

CREATE OR REPLACE FUNCTION public.get_available_filters_v1(store_id_param uuid)
RETURNS TABLE (
  attribute_name text,
  attribute_values text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    key AS attribute_name, 
    array_agg(DISTINCT value) AS attribute_values
  FROM public.products p
  JOIN public.product_variants pv ON p.id = pv.product_id
  CROSS JOIN jsonb_each_text(pv.attributes)
  WHERE p.store_id = store_id_param
    AND p.status = 'published'
    AND pv.status = 'active'
    AND pv.stock_on_hand > 0
  GROUP BY key
  ORDER BY key;
END;
$$;
