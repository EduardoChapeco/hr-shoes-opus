# G3: Storage Map

Mapeamento de Buckets no Supabase Storage:

1. **`product-media`**
   - **Finalidade:** Fotos, vídeos e anexos referentes a produtos e suas variantes.
   - **MIME suportado:** imagens (`jpeg`, `png`, `webp`), vídeos (`mp4`).
   - **Restrição:** Público para leitura. Escrita limitada a lojistas da própria loja.
   - **Policy Requerida:** RLS (`store_id`) para escrita. Leitura pública via URL.

2. **`store-assets`**
   - **Finalidade:** Logotipos, avatares do perfil da loja.
   - **MIME:** imagens.
   - **Restrição:** Público para leitura.

3. **`builder-assets`**
   - **Finalidade:** Imagens avulsas inseridas via Editor CMS (drag-and-drop).
   - **MIME:** imagens.
   - **Restrição:** Vinculado ao template e loja. Leitura pública.

**Atenção em Auditoria:** O fluxo do `MediaUploader` não deve nunca retornar ou usar URLs assinadas (`signedUrls`) temporárias para assets de acesso contínuo. Tudo aqui é público e servido via CDN/Public URL.
