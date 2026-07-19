# Livro de Registro de Regressões (Builder Regression Ledger)

Este documento registra as capacidades funcionais do builder e CMS que sofreram regressão, foram simplificadas, deletadas ou permaneceram como stubs/mocks.

---

## Capacidade 1: Inspetor de Propriedades Dinâmico (Content/Design/Layout Inputs)
*   **ID**: `REG-BUILDER-001`
*   **Capacidade**: Renderização automática de formulários no painel direito (Inspector) baseados no manifesto do bloco selecionado.
*   **Requisito Original**: Permitir que a lojista customize textos, imagens, cores e alinhamentos de qualquer bloco.
*   **Artefato que Menciona**: `docs/platform-recovery/02_ROUTE_CAPABILITY_MATRIX.md`, `docs/benchmarks/builder-platform.md`
*   **Commit que Adicionou**: `b3e3473` (na interface antiga `admin.cms.paginas`)
*   **Arquivos Relacionados**: [admin.builder.$documentId.editor.tsx](file:///c:/Users/Excelência Tour SMO/Documents/hr-shoes-opus/src/routes/admin.builder.$documentId.editor.tsx), [builder-registry.ts](file:///c:/Users/Excelência Tour SMO/Documents/hr-shoes-opus/src/lib/builder-registry.ts)
*   **Evidência de que Funcionou**: `git show b3e3473` comprova que `renderDynamicField` gerava inputs reais baseados em `cmsRegistry`.
*   **Estado Atual**: `IMPLEMENTADO, MAS SUBSTITUÍDO` (a UI foi substituída pela rota `admin.builder`, mas o properties panel foi deixado como stub estático sem inputs dinâmicos).
*   **Commit de Regressão**: `ee54fb7`
*   **Motivo Aparente**: Transição incompleta de modelagem de dados flat (`page_sections`) para o motor de nós (`experience_nodes`).
*   **Consumidor Atual**: Editor de Experiências do Administrador.
*   **Fonte Canônica Esperada**: [builder-registry.ts](file:///c:/Users/Excelência Tour SMO/Documents/hr-shoes-opus/src/lib/builder-registry.ts)
*   **Decisão de Recuperação**: Portar e adaptar a função `renderDynamicField` do antigo editor para ler os manifestos de `builderRegistry` no novo properties panel do `admin.builder`.

---

## Capacidade 2: Inserção Dinâmica de Blocos do Catálogo (Library Panel)
*   **ID**: `REG-BUILDER-002`
*   **Capacidade**: Adicionar novos nós visuais (Bento Grid, Carrossel, Stories) à árvore DOM no editor.
*   **Requisito Original**: Permitir montar uma página usando qualquer bloco da biblioteca.
*   **Artefato que Menciona**: `docs/ROADMAP.md` (Fase 3), `docs/product/requirements-ledger.md` (`CMS-004`)
*   **Commit que Adicionou**: `ee54fb7` (parcialmente, criando os manifestos em `builder-registry.ts`)
*   **Arquivos Relacionados**: [admin.builder.$documentId.editor.tsx](file:///c:/Users/Excelência Tour SMO/Documents/hr-shoes-opus/src/routes/admin.builder.$documentId.editor.tsx), [builder-registry.ts](file:///c:/Users/Excelência Tour SMO/Documents/hr-shoes-opus/src/lib/builder-registry.ts)
*   **Evidência de que Funcionou**: Nenhuma evidência de que inserção dinâmica de blocos do novo registry funcionou no editor novo (apenas Seção e Container estão hardcoded).
*   **Estado Atual**: `PLANEJADO, MAS NUNCA IMPLEMENTADO` (para o novo editor); `REMOVIDO` (para o editor antigo, onde os blocos antigos eram listados).
*   **Commit de Regressão**: `ee54fb7`
*   **Motivo Aparente**: Falta de tempo ou foco na simplificação do formulário lateral de inserção.
*   **Consumidor Atual**: Editor de Experiências do Administrador.
*   **Fonte Canônica Esperada**: [builder-registry.ts](file:///c:/Users/Excelência Tour SMO/Documents/hr-shoes-opus/src/lib/builder-registry.ts)
*   **Decisão de Recuperação**: Implementar a listagem dinâmica de blocos a partir do `builderRegistry` com botões funcionais para adicionar nós filhos ao nó selecionado (respeitando as regras `allowedChildTypes` e `allowedParentTypes`).

---

## Capacidade 3: Homepage Dinâmica Editável via Motor de Nós
*   **ID**: `REG-BUILDER-003`
*   **Capacidade**: A página inicial pública `/` renderizar os nós publicados do tipo `storefront` com slug `home`.
*   **Requisito Original**: A página inicial não deve ser estática ou paralela ao CMS, mas sim customizável no editor.
*   **Artefato que Menciona**: `docs/ROADMAP.md` (Fase 3), `docs/platform-recovery/02_ROUTE_CAPABILITY_MATRIX.md`
*   **Commit que Adicionou**: `ee54fb7` (de forma incompleta, deixando a rota `/` pendente)
*   **Arquivos Relacionados**: [_store.index.tsx](file:///c:/Users/Excelência Tour SMO/Documents/hr-shoes-opus/src/routes/_store.index.tsx), [builder.functions.ts](file:///c:/Users/Excelência Tour SMO/Documents/hr-shoes-opus/src/services/builder.functions.ts)
*   **Evidência de que Funcionou**: Nenhuma. A home sempre consumiu `pages`/`page_sections` do CMS antigo ou banners locais fixos do JSX.
*   **Estado Atual**: `REGRESSÃO ARQUITETURAL / IMPLEMENTADO, MAS NÃO CONECTADO`
*   **Commit de Regressão**: `ee54fb7` (por excluir a interface de edição das tabelas antigas sem conectar a home ao novo motor).
*   **Motivo Aparente**: A rota `/` foi mantida intacta para evitar quebrar a vitrine pública de demonstração enquanto as tabelas novas do builder eram criadas.
*   **Consumidor Atual**: Visitantes da loja virtual (`/`).
*   **Fonte Canônica Esperada**: Tabela `experience_documents` com tipo `storefront` e slug `home`.
*   **Decisão de Recuperação**: Refatorar o loader e renderizador de [_store.index.tsx](file:///c:/Users/Excelência Tour SMO/Documents/hr-shoes-opus/src/routes/_store.index.tsx) para buscar a versão publicada da experiência `storefront`/`home` usando `getPublicExperienceDocumentBySlug` e renderizar via `<ExperienceRenderer />`.

---

## Capacidade 4: Data Bindings Reais e Dinâmicos no Inspetor
*   **ID**: `REG-BUILDER-004`
*   **Capacidade**: Vincular propriedades de um nó a resolvers de dados (ex: puxar produtos de uma categoria).
*   **Requisito Original**: Permitir que blocos mostrem dados reais do catálogo sem hardcodes de JSON.
*   **Artefato que Menciona**: `docs/benchmarks/builder-platform.md`
*   **Commit que Adicionou**: `ee54fb7` (criando o resolvedor `builder-resolvers.ts` e hidratação básica em `builder.functions.ts`).
*   **Arquivos Relacionados**: [builder-resolvers.ts](file:///c:/Users/Excelência Tour SMO/Documents/hr-shoes-opus/src/lib/builder-resolvers.ts), [builder.functions.ts](file:///c:/Users/Excelência Tour SMO/Documents/hr-shoes-opus/src/services/builder.functions.ts)
*   **Evidência de que Funcionou**: Hydration SSR comprovada em [builder.functions.ts](file:///c:/Users/Excelência Tour SMO/Documents/hr-shoes-opus/src/services/builder.functions.ts#L203-L218).
*   **Estado Atual**: `IMPLEMENTADO, MAS NÃO CONECTADO` (o backend resolve, mas o editor no admin não tem interface para configurar esses bindings).
*   **Commit de Regressão**: `ee54fb7`
*   **Motivo Aparente**: O properties panel do editor não implementou a aba "Conexão" (que permanece como stub explicativo).
*   **Consumidor Atual**: Editor de Experiências do Administrador.
*   **Fonte Canônica Esperada**: [builder-resolvers.ts](file:///c:/Users/Excelência Tour SMO/Documents/hr-shoes-opus/src/lib/builder-resolvers.ts)
*   **Decisão de Recuperação**: Adicionar na aba de "Conexão" do inspector do editor um seletor funcional para definir a fonte de dados (ex: `latest_products`, `category_products`) e mapear os argumentos no objeto `data_bindings` do nó.

---

## Capacidade 5: Mapeamento de Componentes Órfãos de Mídia e Conteúdo
*   **ID**: `REG-BUILDER-005`
*   **Capacidade**: Utilização de componentes como FAQ, Galeria, Contato e Vídeos no renderizador de nós.
*   **Requisito Original**: Todos os blocos visuais descritos no CMS devem estar integrados e renderizados.
*   **Artefato que Menciona**: `docs/product/requirements-ledger.md` (`CMS-011`, `CMS-012`, `CMS-013`, `CMS-014`)
*   **Commit que Adicionou**: Vários (os arquivos visuais existem na pasta `dynamic-sections`)
*   **Arquivos Relacionados**: [experience-renderer.tsx](file:///c:/Users/Excelência Tour SMO/Documents/hr-shoes-opus/src/components/commerce/experience-renderer.tsx), [builder-registry.ts](file:///c:/Users/Excelência Tour SMO/Documents/hr-shoes-opus/src/lib/builder-registry.ts)
*   **Evidência de que Funcionou**: Existentes como arquivos separados no repositório.
*   **Estado Atual**: `ÓRFÃO` (não constam na `componentMap` do renderizador de nós nem na `builderRegistry`).
*   **Commit de Regressão**: `ee54fb7` (ao criar um novo registry simplificado de 8 blocos).
*   **Motivo Aparente**: Simplificação indevida no novo framework de builder.
*   **Consumidor Atual**: Renderizador de Experiências (`ExperienceRenderer`).
*   **Fonte Canônica Esperada**: [builder-registry.ts](file:///c:/Users/Excelência Tour SMO/Documents/hr-shoes-opus/src/lib/builder-registry.ts)
*   **Decisão de Recuperação**: Registrar os componentes órfãos no `builderRegistry` e adicioná-los no `componentMap` de [experience-renderer.tsx](file:///c:/Users/Excelência Tour SMO/Documents/hr-shoes-opus/src/components/commerce/experience-renderer.tsx) para que possam ser utilizados no ecossistema hierárquico.
