# Análise de Causa Raiz da Regressão do Builder (Root Cause Analysis)

Este documento identifica de forma transparente e rigorosa os fatores técnicos e processuais que levaram à regressão funcional e simplificação do construtor de páginas (Builder Platform & CMS).

---

## 1. Mapeamento de Causa Raiz

### Qual era o melhor estado conhecido?
*   **Editor Visual CMS**: No commit `b3e3473` (16/07/2026), a rota `src/routes/admin.cms.paginas.$id.editor.tsx` possuía um gerador de campos dinâmicos funcional (`renderDynamicField`) baseado no `cmsRegistry` (11 blocos de conteúdo com inputs estritos).
*   **Modelo de Banco**: No commit `ee54fb7` (18/07/2026), a introdução do schema hierárquico `experience_nodes` (Migration `0048`) representou a melhoria arquitetural necessária para suportar layouts aninhados de forma profunda, superando o modelo flat antigo.

### Qual alteração iniciou a regressão?
*   O commit `ee54fb7` (18/07/2026), intitulado *"feat(catalog): implement match time offers and inventory audit tools (Microfase 5 & 6)"*. 

### Quais commits simplificaram o builder?
*   O próprio commit `ee54fb7`, que deletou a interface de edição funcional antiga do CMS sem implementar os formulários e bibliotecas de blocos dinâmicos no novo editor de experiências.

### Quais arquivos foram substituídos ou deletados?
*   **Deletados**:
    *   `src/routes/admin.cms.paginas.$id.editor.tsx` (Editor antigo com `renderDynamicField`)
    *   `src/routes/admin.cms.paginas.index.tsx` (Listagem antiga de páginas)
    *   `src/routes/admin.cms.paginas.novo.tsx` (Criação de páginas antiga)
*   **Substituídos por**:
    *   `src/routes/admin.builder.$documentId.editor.tsx` (Editor novo com inputs mockados no properties panel)
    *   `src/routes/admin.builder.index.tsx` (Listagem nova de experiências)

### Quais registros e blocos desapareceram ou ficaram órfãos?
*   O `cmsRegistry` de `src/lib/cms-registry.ts` foi descontinuado do editor administrativo.
*   **Componentes Órfãos**: Os arquivos `announcement-bar.tsx`, `contact-form.tsx`, `gallery-grid.tsx`, `info-cards.tsx`, `social-grid.tsx` e `video-section.tsx` ficaram órfãos na pasta `src/components/commerce/dynamic-sections` por não serem mapeados no `builderRegistry` nem no `componentMap` do renderizador de nós.

### Quais dados deixaram de ser lidos e qual rota usa template fixo?
*   A rota da página principal `/` ([_store.index.tsx](file:///c:/Users/Excelência Tour SMO/Documents/hr-shoes-opus/src/routes/_store.index.tsx)) continuou lendo as tabelas do banco antigo (`pages` e `page_sections`) e, caso estas estivessem vazias, cai em um template fixo em JSX que lê propriedades estáticas do `storeConfig`. Ela ignora completamente a nova tabela `experience_nodes` do builder.

### Por que o editor atual não mostra todos os blocos?
*   Porque o painel lateral de camadas/adição de blocos foi simplificado com botões HTML fixos apenas para "Seção" e "Container", em vez de mapear a constante `builderRegistry`.

---

## 2. Diagnóstico Processual (Por que aconteceu?)

1.  **Tratamento de Typecheck como Comprovação de Runtime**:
    Como as novas rotas do `admin.builder` compilavam sem erros de tipagem no TypeScript (`npm run build` passava com sucesso), assumiu-se que o fluxo estava completo. Não houve testes automatizados de persistência para as novas tabelas hierárquicas.
2.  **Pressa na Transição de Módulos (Escopo Concorrente)**:
    A transição do CMS plano para a nova plataforma de builder foi misturada no mesmo commit com implementações de Catálogo e ferramentas de auditoria de estoque. O escopo do editor visual do builder foi reduzido para stubs temporários visando compilar rápido e liberar o deploy.
3.  **Falha nos Gates de Revisão**:
    As regras invioláveis de `AGENTS.md` (como "Proibido mocks ou placeholders em produção" e "Componentes implementam estados de erro/vazio honestos") falharam em acusar oproperties panel contendo apenas o texto explicativo estático.

---

## 3. Ações para Prevenção e Blindagem Futura

*   **Testes de Contrato no CI**: Criar testes que garantam que todo bloco do `builderRegistry` possua um respectivo mapeamento de renderizador React e schema de validação.
*   **Testes E2E de Edição**: Implementar um teste básico de Cypress ou Playwright que simule: criar documento -> adicionar bloco -> alterar propriedade -> salvar -> recarregar -> validar na home pública.
*   **Sincronização Obrigatória**: A rota `/` deve ser travada para carregar e renderizar os nós do builder hierárquico, eliminando a dependência do CMS legado.
