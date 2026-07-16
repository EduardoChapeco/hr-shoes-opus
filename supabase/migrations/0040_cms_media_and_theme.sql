-- ============================================================================
-- Hr Shoes Commerce — Migration 0040: CMS Media and Theme enhancements
-- ============================================================================

-- 1. Add logo and favicon to theme_settings
ALTER TABLE public.theme_settings ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.theme_settings ADD COLUMN IF NOT EXISTS favicon_url TEXT;

-- 2. Create cms-media bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('cms-media', 'cms-media', true)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS for cms-media
-- Public read access
CREATE POLICY "cms_media_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cms-media');

-- Staff insert access
CREATE POLICY "cms_media_staff_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'cms-media' AND 
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('owner', 'admin', 'manager'))
  );

-- Staff update access
CREATE POLICY "cms_media_staff_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'cms-media' AND 
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('owner', 'admin', 'manager'))
  );

-- Staff delete access
CREATE POLICY "cms_media_staff_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'cms-media' AND 
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('owner', 'admin', 'manager'))
  );
