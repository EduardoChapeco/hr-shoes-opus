# Builder Baseline Documentation

## 1. Identificação de Análise Forense
*   **Branch de Segurança:** `recovery/investigation-baseline`
*   **Commit Baseline:** `60635f2038ce45aaf7c7789cec2951276991e617`
*   **Data da Investigação:** 2026-07-19
*   **Estado da Working Tree:** Limpa (`nothing to commit, working tree clean`)
*   **Última Migration Local e Remota:** `0064_customer_identities_lgpd.sql`

## 2. Inventário de Arquivos do Motor de Experiências (Page Builder)
Encontramos os seguintes componentes e módulos do builder e renderização:
*   [experience-renderer.tsx](file:///c:/Users/Excelência Tour SMO/Documents/hr-shoes-opus/src/components/commerce/experience-renderer.tsx): Renderizador principal da árvore DOM.
*   [builder-registry.ts](file:///c:/Users/Excelência Tour SMO/Documents/hr-shoes-opus/src/lib/builder-registry.ts): Registro de manifestos de blocos (versão, ícone, content/style schemas, etc.).
*   [builder-resolvers.ts](file:///c:/Users/Excelência Tour SMO/Documents/hr-shoes-opus/src/lib/builder-resolvers.ts): Mecanismo de resolução dinâmico de bindings.
*   [builder-types.ts](file:///c:/Users/Excelência Tour SMO/Documents/hr-shoes-opus/src/lib/builder-types.ts): Tipagens do builder.
*   [cms-registry.ts](file:///c:/Users/Excelência Tour SMO/Documents/hr-shoes-opus/src/lib/cms-registry.ts): Registro de blocos CMS legado (desconectado do editor principal do builder).
*   [admin.builder.$documentId.editor.tsx](file:///c:/Users/Excelência Tour SMO/Documents/hr-shoes-opus/src/routes/admin.builder.$documentId.editor.tsx): Interface administrativa de arrastar/soltar e inspetor.
*   [builder.functions.ts](file:///c:/Users/Excelência Tour SMO/Documents/hr-shoes-opus/src/services/builder.functions.ts): BFF com ações de CRUD de documentos, versões e nós.

## 3. Estado de Migrações do Banco de Dados Relacionadas
*   `0004_cms.sql` / `0014_cms_extended.sql`: Criam as tabelas legadas `pages` e `page_sections`.
*   `0048_builder_platform_core.sql`: Cria as tabelas `experience_documents`, `experience_versions` e `experience_nodes`.
*   `0049_builder_popups_templates.sql`: Suporte a popups de campanhas e templates reutilizáveis.
*   `0050_builder_analytics.sql`: Tabelas e RLS para analíticos do builder.

## 4. Preservação do Comportamento Atual
Nenhuma alteração foi realizada até o presente momento nas funcionalidades, schemas ou rotas, garantindo que o ponto de restauração e reversão em caso de erro permaneça intacto.
