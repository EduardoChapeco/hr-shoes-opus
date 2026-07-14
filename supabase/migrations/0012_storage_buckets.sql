-- Migration: 0012_storage_buckets.sql
-- Description: Cria o bucket de mídia de produtos e as políticas RLS para leitura pública e escrita restrita.

-- Cria o bucket se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-media', 'product-media', true)
ON CONFLICT (id) DO NOTHING;

-- Política de leitura pública (qualquer um pode visualizar imagens)
CREATE POLICY "Leitura pública de mídia de produtos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'product-media');

-- Política de inserção (apenas admin pode fazer upload)
CREATE POLICY "Upload permitido para gerentes e admins" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'product-media' AND 
  auth.role() = 'authenticated' AND
  (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'manager')
    )
  )
);

-- Política de atualização
CREATE POLICY "Atualização permitida para gerentes e admins" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'product-media' AND 
  auth.role() = 'authenticated' AND
  (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'manager')
    )
  )
);

-- Política de deleção
CREATE POLICY "Deleção permitida para gerentes e admins" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'product-media' AND 
  auth.role() = 'authenticated' AND
  (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'manager')
    )
  )
);
