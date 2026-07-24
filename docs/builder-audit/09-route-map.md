# 09 — Route Map

> Data: 2026-07-24  
> Projeto: Hr Shoes Commerce  

---

## Mapeamento Completo de Rotas do Builder / CMS

| Rota / Path TanStack Router | File Location | Loader / Action | Nível de Acesso | Propósito |
|---|---|---|---|---|
| `/admin/builder` | `src/routes/admin.builder.index.tsx` | `listExperienceDocuments` | Admin Authenticated | Lista de documentos CMS (storefront, biolink, etc.) |
| `/admin/builder/$documentId/editor` | `src/routes/admin.builder.$documentId.editor.tsx` | `getExperienceDocument` | Admin Authenticated | Editor visual drag-and-drop com sidepanel e temas |
| `/` | `src/routes/_store.index.tsx` | `getPublicExperienceDocumentBySlug({ slug: 'home' })` | Público | Vitrine dinâmica principal renderizada via `ExperienceRenderer` |
| `/produto/$slug` | `src/routes/_store.produto.$slug.tsx` | `getProductBySlug` + PDP template document | Público | Página de detalhes do produto com template dinâmico |
| `/paginas/$slug` | `src/routes/_store.paginas.$slug.tsx` | `getPublicExperienceDocumentBySlug({ slug })` | Público | Páginas institucionais customizadas no builder |
| `/bio/$slug` | `src/routes/_store.bio.$slug.tsx` | `getPublicExperienceDocumentBySlug({ slug, document_type: 'biolink' })` | Público | Páginas de link na bio para mídias sociais |
| `/vendedora/$slug` | `src/routes/_store.vendedora.$slug.tsx` | `getPublicExperienceDocumentBySlug({ slug, document_type: 'seller_showcase' })` | Público | Vitrine personalizada de vendedora/afiliada |

### Verificação de Links e Router Links
Todas as rotas públicas utilizam caminhos limpos (`to="/produto/$slug"`, `to="/catalogo"`), sem vazamento de prefixos internos da estrutura de pastas `_store`.
