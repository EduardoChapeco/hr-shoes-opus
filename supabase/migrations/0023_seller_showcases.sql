-- ============================================================================
-- Hr Shoes Commerce — Migration 0023: Seller Showcases
-- ============================================================================

-- Tabela que gerencia a vitrine pública de uma vendedora/afiliada.
-- Ela não tem um inventário separado, ela apenas tem uma URL pública (slug) e recomenda produtos da loja principal.
CREATE TABLE IF NOT EXISTS public.seller_showcases (
  seller_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  description TEXT,
  banner_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_showcases ENABLE ROW LEVEL SECURITY;

-- Público pode ler vitrines ativas
CREATE POLICY "seller_showcases_public_read"
  ON public.seller_showcases FOR SELECT
  USING (is_active = true);

-- A própria vendedora pode editar os dados de exibição de sua vitrine
CREATE POLICY "seller_showcases_self_update"
  ON public.seller_showcases FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE TRIGGER seller_showcases_updated_at
  BEFORE UPDATE ON public.seller_showcases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Adicionando seller_id no carrinho para podermos transpor a comissão no momento do checkout
ALTER TABLE public.carts ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
