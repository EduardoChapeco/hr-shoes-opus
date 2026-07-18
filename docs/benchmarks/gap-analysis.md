# Mapa de Capacidades (Gap Analysis): HR Shoes Builder Legacy vs Motor Canônico

Este documento traduz todas as pesquisas em uma auditoria visual da evolução da capacidade.

## 1. Topologia e Armazenamento
| Capacidade | O que havia declarado | Realidade Constatada | Motor Proposto (Nova Plataforma) |
| --- | --- | --- | --- |
| **Persistência de Blocos** | Arquitetura Dinâmica JSON | Tabela Plana e String Fixa. | DOM em JSONB (`experience_nodes`) versionado e serializado por árvore hierárquica. |
| **Hierarquia (DOM Tree)** | Layouts Modulares | Um array simples 1D na tabela `page_sections`. | Suporte profundo: Seções -> Containers (Grid/Flex) -> Blocos Visuais. |
| **Versionamento Atômico** | Versionado no CMS | Nenhuma tabela de rascunhos ou publicações (`experience_versions`). | Separação estrita de Draft Mode, Preview Mode e Published Snapshot. |

## 2. Renderer e Consistência (Preview)
| Capacidade | O que havia declarado | Realidade Constatada | Motor Proposto (Nova Plataforma) |
| --- | --- | --- | --- |
| **Motor Único de Preview** | "Semelhante ao Wix" | O editor exibia painéis de input sem rendering realtime preciso à tela final. | Renderizador Recursivo Agnóstico consumindo Schema Zod tipado via TanStack Router. |
| **Data Bindings (Realtime)** | Integrado com Produtos e CRM | Mock Visual e Formulários de Contato hard-coded nas funções `getDashboardData`. | Bloco tipado (ex. `DataBinding: product_collection`) que invoca SSR Data Loaders no Router, provendo dados atualizados sem sobrecarga de rede no cliente. |

## 3. Composição Flexível e Overrides Responsivos
| Capacidade | O que havia declarado | Realidade Constatada | Motor Proposto (Nova Plataforma) |
| --- | --- | --- | --- |
| **Layouts de Celulas / Grids** | Bento Grids e Galerias | Pre-sets hardcoded com layout fixo. | Containers gerando CSS Flex/Grid com overrides responsivos estritos por breakpoint (ex: Mobile `flex-col`, Desktop `grid-cols-3`). |
| **Camadas (Layers Pane)** | Inspector Profissional | Sem painel lateral de camadas DOM. | UI no Editor exibindo a árvore de renderização (Drag & Drop sorting) usando `react-dnd` ou SortableJS tipado. |

## Ação
A reengenharia necessita mover a HR Shoes do estado estático "Array 1D" para o modelo de Editor Baseado em Árvore DOM (Hierarchy Tree Engine), que suporta nativamente o TanStack Router Server Side Rendering.
