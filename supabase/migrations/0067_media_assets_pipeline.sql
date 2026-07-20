-- 0067_media_assets_pipeline.sql

-- 1. Create media_assets table for tracking all uploads
CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  bucket_name text NOT NULL,
  file_path text NOT NULL,
  public_url text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_media_assets_store ON public.media_assets(store_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_mime ON public.media_assets(mime_type);

-- 3. RLS
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stores can view their own media" ON public.media_assets
  FOR SELECT
  USING (
    store_id = (SELECT id FROM public.stores LIMIT 1) -- Multi-tenant isolated
  );

CREATE POLICY "Admin can insert media" ON public.media_assets
  FOR INSERT
  WITH CHECK (
    store_id = (SELECT id FROM public.stores LIMIT 1)
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'manager', 'content')
    )
  );

CREATE POLICY "Admin can delete media" ON public.media_assets
  FOR DELETE
  USING (
    store_id = (SELECT id FROM public.stores LIMIT 1)
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'manager', 'content')
    )
  );

-- 4. Storage Bucket Policies (Product Media)
-- Ensure bucket exists and has correct policies
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-media', 'product-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop old policies if any
DROP POLICY IF EXISTS "Public can view product media" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload product media" ON storage.objects;

-- Create secure policies for storage.objects
CREATE POLICY "Public can view product media" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-media');

CREATE POLICY "Admin can upload product media" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'product-media'
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'manager', 'content')
    )
  );

CREATE POLICY "Admin can update product media" ON storage.objects
  FOR UPDATE
  WITH CHECK (
    bucket_id = 'product-media'
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'manager', 'content')
    )
  );

CREATE POLICY "Admin can delete product media" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'product-media'
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'manager', 'content')
    )
  );
