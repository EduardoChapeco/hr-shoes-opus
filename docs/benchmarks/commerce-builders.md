# Benchmarks: Commerce Builders (Shopify, Webflow E-commerce)

## Visão Geral
Diferentemente dos editores institucionais e visuais, criadores focados em E-Commerce (Shopify Theme Editor 2.0, Hydrogen/Oxygen, Shogun, PageFly) tratam o catálogo, estoque e as informações de variantes do produto como as autoridades primordiais. O frontend existe estritamente para apresentar, filtrar e adicionar produtos ao carrinho com alta conversão.

## Elementos de Conversão (Action Binding)
- As seções são "ligadas" nativamente a lógicas transacionais: um `ProductBlock` em PageFly puxa automaticamente título, imagem e galeria.
- **Dynamic Sources:** Conexões com metafields (dados não padronizados adicionados aos produtos) que renderizam guias de tamanhos, manuais, informações de cuidado sem hard-coding visual.

## O que fazer melhor na HR Shoes
- **Abandono do JSON Mockado:** O Builder atual tentava fingir a construção do preço através de texto livre. No motor canônico da HR Shoes, todo bloco com propriedade tipada como `DataBindingSource` (ex. `type: "product_reference"`) resolverá seu estado internamente no servidor (SSR), renderizando o componente react `<PriceDisplay cents={fetchedCents} />`.
- **Preços e Estoques Server-Side:** Em campanhas de alto pico e Black Friday, o estoque é volátil. Os nós não cacheiam o valor do produto na tabela do builder (`experience_nodes`). O Builder armazena a *Referência* da campanha, garantindo veracidade do inventário do Supabase.
