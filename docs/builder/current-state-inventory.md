# Audit e Inventário do Estado Atual — CMS & Builder Engine

> Data: 2026-07-25  
> Projeto: Hr Shoes Commerce  
> Status: Fase 0 — Pós-Auditoria Profunda (Sessão 2)

---

## 1. Arquitetura Geral do Editor / Builder

O sistema opera **exclusivamente** sobre a camada canônica `experience_documents → experience_versions → experience_nodes`. A camada legada (`pages`, `page_sections`) está desativada.

### Fluxo de dados canônico

```
Supabase DB (experience_nodes)
    ↓ hydrateBindings (builder.functions.ts / servidor)
    ↓ [resolvedData injetado por nó: products, reviews, store_profile]
ExperienceRenderer (experience-renderer.tsx)
    ↓ spread de content + storeData/resolvedProducts/resolvedReviews
Componente React (dynamic-sections/*.tsx)
    ↓ props flat + dados dinâmicos
```

---

## 2. Correções Aplicadas na Auditoria de 2026-07-25

### A — ExperienceRenderer: Contrato de Props

**Problema**: O renderer passava `content={obj}` mas todos os 27 componentes esperam props flat.  
**Solução**: `ExperienceRenderer` agora faz `{...content}` (spread) ao chamar o componente. Introduzidas três novas props canônicas:

- `resolvedProducts: any[]` — para blocos de produto
- `resolvedReviews: any[]` — para blocos de avaliações
- `storeData: StoreHeroData | StoreHoursData | StoreContactData` — para blocos de perfil da loja

### B — Bindings Canonicalizados

**Problema**: Registry usava `source:`, editor usava `type:`, BFF aceitava ambos mas não canonicalizava.  
**Solução**: Todos os `defaultProps.data_bindings` no registry migrados para `type:`.

| Bloco                | Antes                            | Depois                         |
| -------------------- | -------------------------------- | ------------------------------ |
| `product_carousel`   | `{ source: "dynamic_products" }` | `{ type: "dynamic_products" }` |
| `product_grid`       | `{ source: "dynamic_products" }` | `{ type: "dynamic_products" }` |
| `store_profile_hero` | `{ source: "store_profile" }`    | `{ type: "store_profile" }`    |
| `store_hours`        | `{ source: "store_profile" }`    | `{ type: "store_profile" }`    |
| `store_contact`      | `{ source: "store_profile" }`    | `{ type: "store_profile" }`    |

### C — BFF: Correções de Segurança e Integridade

**Problema 1**: `isOutOfStock: false` hardcoded — produtos sem estoque apareciam disponíveis.  
**Solução**: Query inclui `variants:product_variants(stock_quantity)` e calcula `totalStock <= 0`.

**Problema 2**: `dynamic_reviews` sem filtro `store_id` — multi-tenant leak.  
**Solução**: `.eq("store_id", store_id)` adicionado à query de reviews.

**Problema 3**: Reviews manuais (`reviewer_name`) ignoradas.  
**Solução**: `reviewer_name` incluído no SELECT, com prioridade sobre `profiles.full_name`.

### D — social_grid: Alinhamento Schema/Inspector

**Problema**: `contentSchema` usava `handle`/`images`, inspector usava `username`/`posts`.  
**Solução**: contentSchema e defaultProps atualizados para `username`/`posts`.

### E — Componentes: Estado Vazio Honesto

**Problema**: `before-after-slider.tsx` e `image-hotspots.tsx` tinham fallbacks hardcoded do Unsplash.  
**Solução**: Fallbacks removidos. Ambos exibem estado vazio canônico quando imagens não configuradas.

### F — Editor: Categoria de Mídia Interativa

**Problema**: `before_after_slider`, `image_hotspots`, `routine_steps`, `ingredient_spotlight` invisíveis no painel.  
**Solução**: Categoria `"Mídia Interativa"` adicionada a `BLOCK_CATEGORIES` no `builder-left-panel.tsx`.

### G — Componentes de Perfil: Props Canônicas

Todos os três componentes de store profile atualizados:

- `StoreProfileHero`: aceita `storeData?: StoreHeroData` + props flat
- `StoreHours`: aceita `storeData?: StoreHoursData` + props flat
- `StoreContact`: aceita `storeData?: StoreContactData` + props flat

---

## 3. Inventário de Arquivos e Componentes (Atualizado)

| Arquivo / Diretório                                   | Responsabilidade                                                                | Status          | Evidência                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------- |
| `src/lib/builder-types.ts`                            | Interfaces TypeScript (`ExperienceDocument`, `ExperienceNode`, `BlockManifest`) | **Canônico**    | Base tipada imutável                                          |
| `src/lib/builder-registry.ts`                         | Registry de 27 blocos com schemas Zod e inspector fields                        | **Atualizado**  | Bindings canonicalizados (`type`), social_grid alinhado       |
| `src/services/builder.functions.ts`                   | BFF / Server Functions para CRUD e hydration                                    | **Atualizado**  | isOutOfStock real, store_id em reviews, reviewer_name         |
| `src/components/commerce/experience-renderer.tsx`     | Renderizador recursivo com spread de content                                    | **Reescrito**   | Props canônicas: resolvedProducts, resolvedReviews, storeData |
| `src/components/commerce/dynamic-sections/*`          | 27 componentes React de vitrine                                                 | **Atualizados** | Props flat via spread; store profile com storeData            |
| `src/components/admin/builder/builder-left-panel.tsx` | Painel esquerdo do editor                                                       | **Atualizado**  | Categoria "Mídia Interativa" com 4 blocos                     |

---

## 4. Blocos por Categoria (Estado Pós-Auditoria)

| Categoria                   | Blocos                                                                           | Visível no Editor |
| --------------------------- | -------------------------------------------------------------------------------- | ----------------- |
| Hero & Banners              | hero_carousel, split_banner, announcement_bar, mosaic_banners                    | ✅                |
| Produtos                    | product_carousel, product_grid, product_rail                                     | ✅                |
| Conteúdo                    | rich_text, info_cards, bento_grid, gallery_grid, video_section, timeline_history | ✅                |
| Social & Comunidade         | testimonial_carousel, stories_ring, social_grid                                  | ✅                |
| Conversão                   | countdown_timer, trust_badges, faq_accordion, contact_form                       | ✅                |
| Perfil da Loja              | store_profile_hero, store_hours, store_contact                                   | ✅                |
| **Mídia Interativa** (novo) | before_after_slider, image_hotspots, routine_steps, ingredient_spotlight         | ✅                |

---

## 5. Invariantes de Segurança Ativos

1. **Sem acesso direto ao Supabase em componentes React** — todos os dados passam por `builder.functions.ts`
2. **Nenhum cálculo comercial no cliente** — preços, estoque e totais calculados/validados no servidor
3. **Sem dados fictícios** — empty states honestos em todos os blocos; fallbacks Unsplash removidos
4. **Multi-tenant seguro** — reviews filtradas por `store_id`; produtos filtrados por `store_id`
5. **TypeScript strict** — zero erros após auditoria (verificado com `tsc --noEmit`)
