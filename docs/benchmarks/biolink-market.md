# Benchmarks: Mercado de Bio Links (Linktree, Beacons, Stan Store, Taplink)

## Visão Geral
O mercado de ferramentas do tipo "Link in bio" (liderado por Linktree) diversificou-se. Modelos mais voltados ao comércio eletrônico social (como Stan Store, Beacons e Taplink) combinam o portfólio tradicional de links com módulos integrados de checkout rápido (1-click checkout) para produtos, downloads digitais e captura de formulários.

## Integrações Sociais e Interatividade
- **Taplink / Beacons:** Possuem um editor parecido com um "PWA primitivo". Múltiplas subpáginas abertas em modal interno, banners rotativos e formulários de mensagens instântaneas.
- **Stan Store:** Possui um viés puramente transacional. Os botões não redirecionam (reduzindo bounce-rate) - o pop-up de checkout carrega na mesma tela de forma nativa e finaliza o PIX ou Stripe.

## O que fazer melhor na HR Shoes
- **Checkout Sem Atritos:** Os Bio Links das afiliadas e vendedoras HR Shoes terão o módulo Mini-Cart e o Botão "Buy Now" embutidos nativamente. O fluxo de compra (mesmo via link da bio) poderá acoplar o PIX sem sair do domínio.
- **Domínio Único e Sessão Compartilhada:** O Bio Link operará sob o ecossistema TanStack Router da HR Shoes. Isso significa que o visitante que colocar o produto da vitrine da afiliada no carrinho permanecerá "logado" na loja, sem as famosas quebras de sessão (ex.: clicar no Linktree e perder login e carrinho do Safari no WebView do Instagram).
- **Atribuição Indestrutível:** A atribuição da venda (`seller_id`) acontecerá server-side ao processar o evento de visualização do Biolink no backend da Hr Shoes, sobrevivendo a limpezas de cache de front-end.
