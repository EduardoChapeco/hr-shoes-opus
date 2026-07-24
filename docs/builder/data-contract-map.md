# Mapeamento de Contratos de Dados (Data Contract Map)

> Data: 2026-07-24  
> Projeto: Hr Shoes Commerce  

---

## Mapeamento de Propriedades e Destino de Persistência

| Controle no Sidepanel | Tipo TS | Schema Zod | Coluna / Path JSONB em `experience_nodes` | Validação / Constraint | Default | Responsivo | Renderizador / Consumidor |
|---|---|---|---|---|---|---|---|
| **Banners (Array)** | `Array<BannerItem>` | `z.array(BannerSchema)` | `content.banners` | Array de objetos com `image_url` válida | `[]` | Não (`mobile_image_url`) | `HeroCarousel` |
| **Hotspots (Array)** | `Array<HotspotItem>` | `z.array(HotspotSchema)` | `content.hotspots` | `xPercent` e `yPercent` entre 0 e 100, `productId` UUID | `[]` | Sim (`hideOnMobile`) | `ImageHotspots` |
| **Coleção Vinculada** | `string` (slug) | `z.string().optional()` | `data_bindings.collection_slug` | Deve corresponder a uma coleção ativa | `undefined` | Não | `ProductRail`, `ProductGrid` |
| **Fonte Dinâmica** | `string` | `z.enum([...])` | `data_bindings.source` | `'store_profile' \| 'latest_products' \| 'dynamic_reviews' \| 'product_collection'` | `'latest_products'` | Não | `hydrateBindings` (BFF) |
| **Variantes de Card** | `string` | `z.enum(["classic", "minimal", "editorial", "compact"])` | `content.card_variant` | Valor de enum | `'classic'` | Não | `ProductCard` |
| **Overlays e Cores** | `string` | `z.string()` (Hex/CSS) | `design_tokens.backgroundColor` | Hex de 6/8 dígitos | `'transparent'` | Não | Wrapper da seção |
| **Visibilidade** | `boolean` | `z.boolean()` | `is_hidden` | Boolean | `false` | Sim (via `responsive_overrides`) | `ExperienceRenderer` |
| **Target Date (Countdown)** | `string` (ISO) | `z.string().datetime()` | `content.target_date` | Data ISO UTC | `Date.now() + 24h` | Não | `CountdownTimer` |
| **Rotina / Steps** | `Array<StepItem>` | `z.array(StepSchema)` | `content.steps` | Titulo, descrição, produto opcional | `[]` | Não | `RoutineSteps` |
| **Before / After** | `Object` | `z.object({...})` | `content.before_after` | Imagens `before` e `after` com labels | `{}` | Não | `BeforeAfterSlider` |

---

## Invariantes de Dados

1. **Sem Redundância do Catálogo**: Preço, estoque, título real e mídia de produtos nunca são armazenados permanentemente no JSON de `content`. O JSON guarda a referência (`productId` ou `collection_slug`), e o servidor BFF em `builder.functions.ts` resolve os dados atualizados via `hydrateBindings`.
2. **Coordenadas Relativas**: Hotspots armazenam coordenadas percentuais `xPercent` e `yPercent` (0.00 a 100.00%), garantindo idêntico posicionamento em telas de qualquer resolução.
