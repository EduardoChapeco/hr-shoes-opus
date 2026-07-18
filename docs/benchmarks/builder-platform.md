# Builder Platform Framework Benchmark

## O que a ferramenta permite criar
A plataforma conceitual para HR Shoes deve permitir não apenas a estruturação de páginas através de blocos estáticos, mas também a construção de experiências interativas, tipadas e orientadas a dados (Data Bindings reais). As ferramentas líderes no mercado (Wix Studio, Shopify Hydrogen, Plasmic e Builder.io) permitem criar instâncias baseadas em um motor único. 

Para a HR Shoes, isto significa unificar:
- **Páginas de comércio (Storefronts)**
- **Perfil público da loja / PWA**
- **Vitrines de Afiliadas e Vendedores**
- **Bio Links (Link in Bio)**

## Organização do Editor & Inspector
- O Canvas opera através de uma Árvore de Elementos (DOM node tree) com hierarquia profunda (Document > Section > Container > Element).
- O Painel Lateral Esquerdo cataloga Layers e Componentes (Primitives, Compositions).
- O Painel Direito (Inspector) trata as propriedades contextuais divididas em: Conteúdo, Design, Layout, Dados e Ações.
- Na HR Shoes, o Inspector deverá abstrair propriedades CSS complexas em seletores seguros (ex: Spacing, Alignment, Flexbox/Grid simplificado).

## Dados e Publicação
- Dados reais: O motor liga componentes visuais a instâncias do catálogo através de Data Bindings (ex: "Buscar últimos 10 produtos de categoria X").
- Histórico: Undo/Redo baseados em versionamento atômico (Command Pattern ou Operational Transformation), não armazenando cópias inteiras do JSON a cada letra digitada.
- Na HR Shoes, as publicações devem ser versionadas em tabelas relacionais (`experience_versions`), mantendo a integridade com os dados comerciais via Supabase.

## Decisões para HR Shoes
1. **Abandonar a estrutura plana de `page_sections`** e adotar uma topologia de árvore serializada (`experience_nodes`).
2. **Implementar Data Bindings tipados** na API do Supabase em vez de puxar tudo via chamadas ad-hoc.
3. **Criar renderizadores agnósticos** (Canonical Renderer) que hidratem os componentes do lado do servidor (SSR/TanStack Start).
