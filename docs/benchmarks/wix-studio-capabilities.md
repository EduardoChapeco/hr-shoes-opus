# Benchmarks: Wix Studio (Editor Avançado)

## Visão Geral
O Wix Studio é o novo flagship da Wix voltado para agências, operando como um meio-termo entre o tradicional drag-and-drop desestruturado do Wix padrão e a complexidade do Webflow. O maior atrativo é a abstração amigável de CSS Grid flexível e responsividade guiada por AI.

## Árvore de Camadas (Layers) e Elementos
- O sistema trabalha no modelo: **Section > Container (Layout Flex ou Grid) > Elements**.
- A Sidebar de Layers permite arrastar visualmente e reordenar nós na árvore, garantindo estruturação DOM limpa.
- **Inspector Direita:** Segmentado em Design (Cor, tipografia, borda), Layout (Flexbox, espaçamento) e Animações.

## Breakpoints Inerentes e Cascata (Herança)
- Alterações estruturais (mudança da cor ou do texto) na versão Desktop cascateiam para Tablet e Mobile.
- Modificações específicas de tamanho ou layout no Mobile criam um "override", mas não duplicam o conteúdo na árvore, mantendo um único nó de dados.

## O que fazer melhor na HR Shoes
- Para a HR Shoes, não necessitaremos da total complexidade de Web Design para o lojista médio (como controle granular de Viewport Units `vw`/`vh` e animações de scroll avançadas em cada pixel). Em vez disso, focaremos em **Padrões de Layout Rígidos (Presets de Sections e Grids)** que aceitam customização semântica.
- **Separação de Conteúdo e Responsividade:** A HR Shoes registrará configurações exclusivas de mobile e desktop num mesmo schema (`responsiveOverrides`), de forma tipada, ao invés de classes CSS injetadas (dificultando a leitura no frontend e quebrando em caso de mudança de tema).
