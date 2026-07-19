-- Migration 0062_product_logistics_identity.sql
-- Adiciona colunas profundas de domínio (logística, SEO e identificadores) à tabela de produtos.

-- 1. Identidade e Metadados
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS short_description text,
ADD COLUMN IF NOT EXISTS manufacturer text,
ADD COLUMN IF NOT EXISTS ean varchar(14),
ADD COLUMN IF NOT EXISTS meta_title text,
ADD COLUMN IF NOT EXISTS meta_description text;

-- 2. Logística e Dimensões
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_physical boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS weight_kg numeric(10,3),
ADD COLUMN IF NOT EXISTS width_cm numeric(10,2),
ADD COLUMN IF NOT EXISTS height_cm numeric(10,2),
ADD COLUMN IF NOT EXISTS length_cm numeric(10,2),
ADD COLUMN IF NOT EXISTS preparation_time_days integer DEFAULT 0;

-- 3. Melhorar índices para EAN e fabricante caso a loja cresça muito
CREATE INDEX IF NOT EXISTS idx_products_ean ON public.products(store_id, ean) WHERE ean IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_manufacturer ON public.products(store_id, manufacturer) WHERE manufacturer IS NOT NULL;

-- As colunas foram adicionadas diretamente à tabela canônica de produtos.
-- Notas sobre Variantes: Para um e-commerce avançado, dimensões e pesos também precisam existir 
-- por variante. No entanto, o padrão de domínio costuma usar o Produto como fallback.
-- Nesta mesma etapa, vamos garantir que a tabela product_variants também possua peso/dimensão.

ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS ean varchar(14),
ADD COLUMN IF NOT EXISTS weight_kg numeric(10,3),
ADD COLUMN IF NOT EXISTS width_cm numeric(10,2),
ADD COLUMN IF NOT EXISTS height_cm numeric(10,2),
ADD COLUMN IF NOT EXISTS length_cm numeric(10,2);
