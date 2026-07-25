# Linha do Tempo e Análise de Artefatos do Builder

Este documento mapeia cronologicamente a evolução do construtor de páginas (Builder e CMS), revalidando planos, walkthroughs, migrations e commits para documentar como ocorreu a transição e a regressão funcional do módulo.

---

## 1. Linha do Tempo de Artefatos e Commits do Builder

### Artefato 1: Migration `0004_cms.sql`

- **Data**: ~14/07/2026
- **Commit**: Primitivo do repositório
- **Fase**: Fase 3 (CMS/Conteúdo) conforme `ROADMAP.md`.
- **Requisitos Prometidos**: Persistência de páginas estáticas e seções simples de forma horizontal (flat).
- **Arquivos Criados**: `supabase/migrations/0004_cms.sql` (tabelas `pages` e `page_sections` com check constraint rígido limitando tipos a `hero`, `text`, `product_grid`, `image`, `spacer`).
- **Testes Prometidos**: Teste de leitura pública das seções.
- **Resultado Declarado**: CMS funcional para seções estáticas da home.
- **Evidências Reais**: Tabelas criadas no banco de dados.
- **Divergência entre Plano e Implementação**: A constraint rígida de tipos impedia que novas seções fossem cadastradas no frontend sem migrations de banco adicionais.

---

### Artefato 2: Commit `b3e3473` (CMS Pages Evolution & Visual Builder)

- **Data**: 16/07/2026
- **Commit**: `b3e3473030666653a5ab9ec3673c52c5dccf34e5`
- **Fase**: Fase 3
- **Requisitos Prometidos**: Interface administrativa visual para gerenciamento de seções (CMS Builder flat) com inputs de propriedades dinâmicas baseados em metadados.
- **Arquivos Criados/Alterados**:
  - Criado: `src/routes/admin.cms.paginas.$id.editor.tsx` (Editor visual com split screen e formulários dinâmicos via `renderDynamicField` e `cmsRegistry`).
  - Alterado: `src/services/cms.functions.ts`
- **Testes Prometidos**: Teste básico de mutations no BFF.
- **Resultado Declarado**: Lojista consegue criar e ordenar seções visualmente no admin.
- **Evidências Reais**: Código recuperável via `git show b3e3473` (comprovado que o formulário dinâmico lia o `cmsRegistry` e preenchia campos reais de texto, cor, enum, boolean, etc.).
- **Divergência entre Plano e Implementação**: O editor trabalhava de forma estritamente "flat" (uma lista plana de seções), sem suporte a contêineres aninhados (estrutura de DOM complexa).

---

### Artefato 3: Commit `ee54fb7` (Migração para o Motor de Nós / Builder Platform)

- **Data**: 18/07/2026
- **Commit**: `ee54fb74a0dc3fda9fd98fe1a58ea74431309f94`
- **Fase**: Transição estrutural (CMS Builder para Builder Platform)
- **Requisitos Prometidos**: Plataforma de builder avançada no estilo "Wix Studio", suportando uma árvore DOM hierárquica (nós, filhos, sections, containers, layouts e data-bindings).
- **Arquivos Criados/Deletados**:
  - **DELETADOS**: `src/routes/admin.cms.paginas.$id.editor.tsx`, `src/routes/admin.cms.paginas.index.tsx` e `src/routes/admin.cms.paginas.novo.tsx`.
  - **CRIADOS**: `src/routes/admin.builder.$documentId.editor.tsx`, `src/lib/builder-registry.ts`, `src/components/commerce/experience-renderer.tsx`, `src/services/builder.functions.ts`.
  - **SQL CRIADO**: `supabase/migrations/0048_builder_platform_core.sql` (tabelas `experience_documents`, `experience_versions`, `experience_nodes`).
- **Testes Prometidos**: Telemetria e publicação de rascunhos.
- **Resultado Declarado**: Transição canônica completada para o motor de nós.
- **Evidências Reais**: As tabelas foram criadas e a estrutura de rendering hierárquico existe, mas a interface administrativa foi reduzida drasticamente e o painel de propriedades dinâmica foi substituído por um placeholder explicativo fixo.
- **Divergência entre Plano e Implementação**:
  1.  **Regressão de Interface**: A interface do properties panel perdeu os inputs dinâmicos do `cmsRegistry` e não implementou os novos inputs para o `builderRegistry`.
  2.  **Órfãos do Storefront**: A rota pública principal `/` (`_store.index.tsx`) **NÃO** foi migrada para ler os nós hierárquicos, permanecendo acoplada às tabelas planas do CMS antigo (`pages`/`page_sections`) ou caindo em fallbacks estáticos.
  3.  **Biblioteca Inoperante**: O editor administrativo não possui a lista de blocos funcionais do `builderRegistry` no menu de inserção de blocos (apenas Seção e Container de forma estática).

---

### Artefato 4: `docs/product/requirements-ledger.md`

- **Data**: 19/07/2026 (frequentemente atualizado)
- **Fase**: Auditoria
- **Requisitos Prometidos**: Centralização de requisitos funcionais da plataforma com status de runtime real.
- **Resultado Declarado**: Controle rigoroso e transparente sobre stubs e mocks.
- **Evidências Reais**: Documento existe e foi auditado na sessão atual.
- **Divergência entre Plano e Implementação**: O status de `CMS-004` (Builder de páginas) estava rotulado como `parcial` e `CMS-011` como `parcial`, ocultando que a interface administrativa havia perdido completamente sua capacidade operacional real de customização de blocos e que a homepage estava desconectada.

---

## 2. Matriz de Divergências Arquiteturais (Plano vs. Realidade)

| Componente                             | Prometido em Planos/Walkthroughs                                                  | Estado Real no Código Atual                                                                     | Severidade            |
| -------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------- |
| **Painel de Propriedades (Inspector)** | Edição dinâmica de textos, imagens, links e cores baseados no manifesto do bloco. | Apenas um texto fixo placeholder ("Campos dinâmicos do schema seriam renderizados aqui").       | **Crítica**           |
| **Biblioteca de Blocos**               | Dezenas de blocos (Bento, Carrossel, Countdown, Stories) inseríveis.              | Apenas botões estáticos de Seção e Container no menu de inserção.                               | **Crítica**           |
| **Página Inicial (`/`)**               | Editável pelo motor unificado do builder.                                         | Carrega dados de slug "home" da tabela CMS antiga (`pages`), caindo em fallbacks fixos do JSX.  | **Crítica**           |
| **Segurança no Servidor**              | Validação atômica de nós, filhos e propriedades no backend.                       | BFF `saveBuilderNodes` aceita array `any[]` sem validação de tipos de blocos ou herança de nós. | **Média (Segurança)** |
