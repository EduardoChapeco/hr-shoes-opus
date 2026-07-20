import fs from 'fs';

let content = fs.readFileSync('scratch/old_perfil.tsx', 'utf-8');

// 1. Adicionar import
content = content.replace(
  'import { getPublicStoreProfile } from "@/services/catalog.functions";',
  'import { getPublicStoreProfile } from "@/services/catalog.functions";\nimport { getPublicExperienceDocumentBySlug } from "@/services/builder.functions";\nimport { ExperienceRenderer } from "@/components/commerce/experience-renderer";'
);

// 2. Modificar loader
const loaderCode = `
  loader: async () => {
    const [profile, session, docReq] = await Promise.all([
      getPublicStoreProfile(),
      getUserSession().catch(() => null),
      getPublicExperienceDocumentBySlug({ 
        data: { slug: "institucional", document_type: "storefront" } 
      }).catch(() => null)
    ]);
    return { profile, session, builderDoc: docReq?.status === "success" ? docReq.data : null };
  },
`;
content = content.replace(/loader:\s*async\s*\(\)\s*=>\s*\{[\s\S]*?return\s*\{\s*profile,\s*session\s*\};\s*\},/, loaderCode);

// 3. Modificar StorePerfil function parameters
content = content.replace(
  'const { profile: res, session } = Route.useLoaderData() as any;',
  'const { profile: res, session, builderDoc } = Route.useLoaderData() as any;'
);

content = content.replace(
  'return <PerfilView store={store} session={session} />;',
  'return <PerfilView store={store} session={session} builderDoc={builderDoc} />;'
);

// 4. Modificar PerfilView parameters
content = content.replace(
  'function PerfilView({ store, session }: { store: any; session: any }) {',
  'function PerfilView({ store, session, builderDoc }: { store: any; session: any; builderDoc?: any }) {'
);

// 5. Inserir o renderizador do builder antes do footer sections loop
const customSectionMap = `{profileSections.map((sec: any, idx: number) => (
            <div key={idx} className="mb-12">`;

const builderRender = `
            {/* NOVO: Injeção do Builder Document (Página Institucional) */}
            {builderDoc && builderDoc.tree && builderDoc.tree.length > 0 ? (
              <div className="mb-12 rounded-3xl overflow-hidden bg-background shadow-sm border border-border/50">
                <ExperienceRenderer nodes={builderDoc.tree} />
              </div>
            ) : null}
            
            {/* LEGADO: Custom Sections (Será descontinuado) */}
            {profileSections.map((sec: any, idx: number) => (
              <div key={idx} className="mb-12">`;

content = content.replace(customSectionMap, builderRender);

fs.writeFileSync('src/routes/_store.perfil-da-loja.tsx', content);
console.log('Merge realizado com sucesso!');
