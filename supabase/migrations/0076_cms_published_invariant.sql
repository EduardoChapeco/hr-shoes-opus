-- ============================================================================
-- Hr Shoes Commerce — Migration 0076: CMS Published Invariant
-- ============================================================================
-- Cria um trigger para garantir a regra: "Apenas uma página `published` 
-- por vez por rota (slug)". Ao publicar uma página, as demais com o 
-- mesmo slug na mesma loja são arquivadas.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.enforce_single_published_page()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'published' THEN
    -- Despublica (passa para archived) todas as outras páginas da mesma loja com mesmo slug
    UPDATE public.pages
    SET status = 'archived', updated_at = now()
    WHERE store_id = NEW.store_id
      AND slug = NEW.slug
      AND id != NEW.id
      AND status = 'published';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_single_published_page ON public.pages;
CREATE TRIGGER trg_enforce_single_published_page
  BEFORE INSERT OR UPDATE OF status, slug ON public.pages
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_single_published_page();

COMMIT;
