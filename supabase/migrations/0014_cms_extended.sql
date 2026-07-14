-- ============================================================================
-- Hr Shoes Commerce — Migration 0014: CMS Extended (Theme, Menus)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- theme_settings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.theme_settings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  -- Colors
  primary_color    TEXT NOT NULL DEFAULT '#FF4FB8' CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  background_color TEXT NOT NULL DEFAULT '#F3F1EC' CHECK (background_color ~ '^#[0-9A-Fa-f]{6}$'),
  text_color       TEXT NOT NULL DEFAULT '#292729' CHECK (text_color ~ '^#[0-9A-Fa-f]{6}$'),
  -- Typography
  font_heading     TEXT NOT NULL DEFAULT 'Fraunces',
  font_body        TEXT NOT NULL DEFAULT 'Manrope',
  -- Layout
  border_radius    TEXT NOT NULL DEFAULT '0.5rem',
  
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id)
);

ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "theme_settings_public_read"
  ON public.theme_settings FOR SELECT
  USING (true);

CREATE POLICY "theme_settings_staff_write"
  ON public.theme_settings FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'content')
    )
  );

-- ---------------------------------------------------------------------------
-- navigation_menus
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.navigation_menus (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  handle           TEXT NOT NULL CHECK (handle ~ '^[a-z0-9-]+$'),
  name             TEXT NOT NULL,
  -- JSON structure for menu items (links, hierarchy)
  items            JSONB NOT NULL DEFAULT '[]',
  
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, handle)
);

ALTER TABLE public.navigation_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "navigation_menus_public_read"
  ON public.navigation_menus FOR SELECT
  USING (true);

CREATE POLICY "navigation_menus_staff_write"
  ON public.navigation_menus FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'content')
    )
  );

-- Triggers
CREATE TRIGGER theme_settings_updated_at
  BEFORE UPDATE ON public.theme_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER navigation_menus_updated_at
  BEFORE UPDATE ON public.navigation_menus
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
