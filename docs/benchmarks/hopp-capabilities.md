# Benchmarks: Hopp by Wix

## Visão Geral
Hopp é um serviço criado pela Wix especificamente voltado para a criação de motores de Bio Links interativos e ferramentas de promoção unificadas. Ele foca menos na construção arbitrária de uma página web completa e mais na estruturação otimizada para dispositivos móveis (mobile-first).

## Estrutura do Editor e UI
- **Páginas vs. Links:** O conteúdo é primariamente vertical e organizado em links ou painéis em formato de cards interativos.
- **Blocos Focados:** O Inspector é simplificado (sem CSS Grid e customizações de código bruto). Ele usa presets: Card de Contato, Formulários de Inscrição, Redes Sociais.
- **Pesquisa Embutida:** Um bloco central de Busca universal atravessa todo o link in bio, agregando de fato o inventário.

## Analytics Integrado
- Relatórios centralizados nas taxas de clique (CTR) por cada widget, permitindo que a atribuição de vendas e geração de tráfego seja mensurada precisamente por "Bento Box" (cada célula).
- Suporte a retargeting transparente (Pixels globais do tenant importados silenciosamente).

## O que fazer melhor na HR Shoes
- **Unificar Fontes de Dados:** No Hopp, integrações externas (produtos ou posts) dependem de APIs públicas ou scrape; no caso da HR Shoes, o catálogo (tabela `products`) rodará na mesma base de dados. As buscas nos Biolinks das Vendedoras poderão sugerir resultados da tabela sem dependência externa, mostrando estoque e preços atualizados no mesmo segundo.
- O Bio Link da HR Shoes compartilhará componentes do Storefront, mantendo assim uma unidade visual da marca, algo que o Hopp tem dificuldade por ter design agnóstico.
