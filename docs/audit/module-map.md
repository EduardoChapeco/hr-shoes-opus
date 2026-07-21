# G3: Mapas e Gráficos do Sistema (Module Map)

## Mapeamento de Domínios
- **Catálogo:** `products`, `product_variants`, `product_categories`, `product_media`. (Server: `catalog.functions.ts`)
- **Estoque:** Movimentos imutáveis e reservas no checkout. (Server: `stock.functions.ts`)
- **Configurações/Loja:** `stores`, `shipping_rates`, `tax_settings`, Onboarding status. (Server: `onboarding.functions.ts`, `store.functions.ts`)
- **Media/Storage:** Buckets (`product-media`, `builder-assets`, etc.).
- **CMS/Builder:** Seções dinâmicas, CMS Navigation e UI. (Server: `builder.functions.ts`, `cms.functions.ts`)

*(Nota: Este é o mapa macro, as ramificações detalhadas ficarão catalogadas de acordo com as especificações exigidas na M-3)*
