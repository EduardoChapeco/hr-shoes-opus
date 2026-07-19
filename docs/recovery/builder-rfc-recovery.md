# RFC de Recuperação do Builder e Integração da Homepage (Builder Recovery RFC)

**Status**: Proposta  
**Autor**: Antigravity  
**Data**: 2026-07-19  

Este documento especifica a estratégia técnica para recuperar e estabilizar a **Builder Platform**, reativando a edição dinâmica de blocos no painel de administração e unificando a renderização da página inicial pública (`/`) sob o motor de nós canônico (`experience_nodes`).

---

## 1. Arquitetura Canônica Proposta

Adotaremos uma arquitetura de renderização unificada orientada ao motor de nós aninhados (`experience_nodes`), eliminando a orfandade de tabelas e registries:

```mermaid
graph TD
    subgraph Editor (Admin)
        A[admin.builder.editor] -->|Salva Nós| B(BFF: saveBuilderNodes)
        B -->|Persiste| C[(experience_nodes)]
    end
    subgraph Vitrine (Pública)
        D[/_store.index] -->|Carrega home| E(BFF: getPublicExperienceDocumentBySlug)
        F[/_store.paginas.$slug] -->|Carrega slug| E
        E -->|Lê| C
        E -->|Resolve Bindings| G[builder-resolvers.ts]
        G -->|Consome| H[(Catalog/Products)]
        E -->|Retorna Árvore Hidratada| I[ExperienceRenderer]
    end
```

### Componentes de Dados do Framework
1.  **Documento Principal (`experience_documents`)**: Cada loja possui um documento do tipo `storefront` com slug `home` representando a página inicial, além de documentos para páginas institucionais, biolinks e popups.
2.  **Versão Ativa (`experience_versions`)**: O editor manipula uma versão com status `draft`. Ao clicar em "Salvar e Publicar", o status muda para `published`.
3.  **Árvore de Nós (`experience_nodes`)**: Persistida em formato de árvore autolinkada (`parent_id`). Toda a validação de estrutura é feita no BFF antes de salvar.

---

## 2. Capacidades a Recuperar e Reimplementar

### 2.1. Reconstrução do Properties Inspector (Recuperado & Adaptado)
*   **Ação**: Resgatar a lógica do `renderDynamicField` do antigo editor e portá-la para a aba "Conteúdo" do novo painel em [admin.builder.$documentId.editor.tsx](file:///c:/Users/Excelência Tour SMO/Documents/hr-shoes-opus/src/routes/admin.builder.$documentId.editor.tsx).
*   **Mapeamento**: O painel lerá os campos definidos na propriedade `inspector.content` de cada bloco do `builderRegistry` e renderizará inputs apropriados:
    *   `text` / `textarea` -> Componente `<Input />` / `<Textarea />`
    *   `boolean` -> Componente `<Switch />`
    *   `color` -> Seletor de cores
    *   `image` / `video` -> Upload/seletor de URL
    *   `select` -> Componente `<Select />`

### 2.2. Integração da Biblioteca de Blocos do Registry (Reimplementado)
*   **Ação**: Substituir os botões HTML fixos de Seção e Container na aba "Adicionar" do editor por um mapeamento do `builderRegistry`.
*   **Mapeamento**: Filtrar blocos permitidos com base no perfil da experiência e na hierarquia (`allowedParentTypes` e `allowedChildTypes` do nó selecionado).

### 2.3. Unificação da Homepage (`_store.index.tsx`) (Migrar & Consolidar)
*   **Ação**: Alterar a rota pública principal para carregar o documento `storefront`/`home`.
*   **Bootstrap Fallback**: Se o documento `home` não existir no banco, a rota exibirá um estado explicativo no admin permitindo que o lojista o crie a partir de um template básico (bootstrap) com banners e produtos novidades. O JSX estático original deixa de ser o renderizador principal e passa a ser apenas o modelo de bootstrap.

### 2.4. Resgate dos Componentes Órfãos (Portar)
*   **Ação**: Registrar no `builderRegistry` e na `componentMap` do `experience-renderer.tsx` os componentes visuais que estão isolados:
    *   `announcement_bar` -> `<CMSAnnouncementBar />`
    *   `video_section` -> `<VideoSection />`
    *   `gallery_grid` -> `<GalleryGrid />`
    *   `social_grid` -> `<SocialGrid />`
    *   `contact_form` -> `<ContactForm />`

---

## 3. Estratégia de Migração e Compatibilidade

*   **Migração de Dados**: Não há necessidade de alterações estruturais de DDL no banco de dados (as migrations `0048`, `0049` e `0050` já cobrem o necessário).
*   **Compatibilidade**: O carregamento da homepage pública fará um fallback seguro: se não encontrar um registro em `experience_documents` com slug `home` e status ativo, ele gerará automaticamente um rascunho com o layout padrão original para não quebrar a vitrine atual em produção.
*   **Rollback**: Mantemos o suporte à leitura da tabela `pages`/`page_sections` antiga de forma legada como contingência secundária.

---

## 4. Plano de Verificação e Testes

### 4.1. Testes Automatizados (Contrato e Integração)
*   Criar um teste de integração no BFF em `src/services/builder.test.ts` (ou similar) cobrindo:
    *   Criação de documento de storefront home.
    *   Validação de estrutura hierárquica (impedir que uma `section` seja adicionada dentro de um `element`).
    *   Validação do schema Zod no servidor para as propriedades do nó.

### 4.2. Verificação de Runtime (E2E)
*   Acessar o editor administrativo do builder, selecionar a página da home virtual, arrastar um novo banner de carrossel, preencher as propriedades no painel direito, salvar e publicar.
*   Acessar a rota `/` pública e comprovar a renderização exata do novo banner.
