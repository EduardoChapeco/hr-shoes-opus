-- Migration 0078: Product Options Schema
-- Adiciona suporte para opções flexíveis em produtos (estilo Shopify)

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.products.options IS 'Flexible product options (e.g., Color, Size) for generating variants.';

-- Script de Migração de Dados (Backfill)
-- Este bloco PL/pgSQL percorre todos os produtos existentes,
-- lê as chaves e valores únicos dos atributos das variantes filhas,
-- e popula a coluna "options" do produto pai automaticamente.
DO $$
DECLARE
    prod RECORD;
    inferred_options JSONB;
BEGIN
    FOR prod IN
        SELECT p.id,
               jsonb_agg(v.attributes) FILTER (WHERE v.attributes IS NOT NULL) AS all_attributes
        FROM public.products p
        LEFT JOIN public.product_variants v ON v.product_id = p.id
        GROUP BY p.id
    LOOP
        IF prod.all_attributes IS NOT NULL AND jsonb_array_length(prod.all_attributes) > 0 THEN
            -- Agrega as chaves distintas e valores distintos em JSONB via SQL dinâmico e subqueries.
            -- Para simplicidade e robustez, usamos uma query que converte a lista de objetos em key-value pairs,
            -- agrupa por key e extrai os values únicos.
            WITH kv AS (
                SELECT key, value#>>'{}' AS val
                FROM jsonb_array_elements(prod.all_attributes) AS arr(elem),
                     jsonb_each(arr.elem)
            ),
            grouped AS (
                SELECT key AS name,
                       jsonb_agg(DISTINCT val) AS values
                FROM kv
                WHERE val IS NOT NULL AND val <> ''
                GROUP BY key
            )
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object('name', name, 'values', values)
            ), '[]'::jsonb)
            INTO inferred_options
            FROM grouped;

            -- Atualiza o produto com as opções inferidas
            UPDATE public.products
            SET options = inferred_options
            WHERE id = prod.id;
        END IF;
    END LOOP;
END $$;
