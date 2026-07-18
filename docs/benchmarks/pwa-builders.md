# Benchmarks: PWA Builders e Ferramentas Nativas

## Visão Geral
Progressive Web Apps (PWAs) visam reduzir o atrito das App Stores entregando experiências instaláveis e capacidades nativas (Push, Caches, Modos Offline) diretamente a partir de um navegador móvel. 
Builders como Bubble, FlutterFlow ou AppGyver focam em criar APPs com lógica profunda de negócios e estados locais complexos (State Management, Actions). Em paralelo, CMSs tradicionais simplesmente injetam um Service Worker genérico num site comum para passar na auditoria do Lighthouse.

## Componentes Chave da Experiência
- **App Shell e Navegação:** A navegação inferior (Bottom Tab Bar) é crucial para a usabilidade com aparência de "aplicativo", juntamente com Top Headers com botões de retorno claros, ao invés da árvore de navegação web (hamburgers).
- **Service Workers Inteligentes:** Diferenciação entre assets vitais da interface (cacheados em Cache-First) e conteúdo comercial (Preços, Estoque — validados Network-First).
- **Instalação Sem Atritos:** Prompts visuais customizados para instruir o usuário iOS a realizar a ação de "Adicionar à Tela de Início".

## O que fazer melhor na HR Shoes
- A HR Shoes deve renderizar exatamente a mesma árvore de `experience_nodes` do Storefront ou Vitrine, mas envelopada num `AppShell` nativo com roteamento do TanStack Router interceptado.
- Os templates PWA focarão estritamente no Commerce: Visualização de Catálogo Off-line (em um limite seguro de 50 produtos vitrine em IndexedDB), Sincronização de Carrinho e Status de Pedidos via Push Notifications e WebSockets (Realtime Supabase).
- Operações de Check-out e Pagamento falharão de forma graciosa sem internet (desabilitando Botão "Comprar" se a conexão `navigator.onLine` cair).
