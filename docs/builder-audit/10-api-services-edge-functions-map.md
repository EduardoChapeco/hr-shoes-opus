# 10 — API, Services & Server Functions Map

> Data: 2026-07-24  
> Projeto: Hr Shoes Commerce  

---

## Mapeamento da Camada BFF Server Functions (`src/services/builder.functions.ts`)

| Server Function Name | HTTP Method | Validador Zod Input | Autorização / Tenant Scope | Descrição / Operação |
|---|---|---|---|---|
| `listExperienceDocuments` | GET | `z.object({ type: z.string().optional() })` | Admin Tenant Scope | Lista documentos do tenant atual |
| `getExperienceDocument` | GET | `z.object({ id: z.string().uuid() })` | Admin Tenant Scope | Retorna o documento e a versão rascunho com nós hidratados |
| `createExperienceDocument` | POST | `z.object({ title, slug, document_type })` | Admin Tenant Scope | Cria novo documento e versão draft inicial |
| `saveBuilderNodes` | POST | `z.object({ documentId, nodes })` | Admin Tenant Scope | Atualiza atomicamente os nós da versão rascunho |
| `publishBuilderVersion` | POST | `z.object({ documentId })` | Admin Tenant Scope | Promove a versão rascunho a `published` e arquiva a anterior |
| `applyHomeTemplate` | POST | `z.object({ documentId, templateId })` | Admin Tenant Scope | Substitui os nós do rascunho pelos nós gerados pela factory do tema |
| `getPublicExperienceDocumentBySlug` | GET | `z.object({ slug, document_type })` | Público / Multi-tenant | Retorna a versão `published` com hidratação dinâmica para a loja pública |
| `listMediaAssets` | GET | N/A | Admin Tenant Scope | Lista arquivos do bucket de mídias da loja |
| `uploadMediaAsset` | POST | `FormData` | Admin Tenant Scope | Salva arquivo no Supabase Storage e registra metadados |
