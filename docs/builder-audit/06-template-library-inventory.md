# 06 — Template Library Inventory

> Data: 2026-07-24  
> Projeto: Hr Shoes Commerce  

---

## Inventário da Biblioteca de Temas de Vitrine (`src/lib/home-templates-library.ts`)

| # | Preset ID | Nome do Tema | Estilo / Nicho | Seções Injetadas pela Factory | Status |
|---|---|---|---|---|---|
| 1 | `fashion_editorial` | High Fashion Editorial | Luxo & Calçados Premium | `hero_banner`, `brand_features`, `bento_grid`, `product_rail`, `image_hotspots`, `newsletter_cta` | `FULLY_VALIDATED` |
| 2 | `beauty_botanical` | Botanical Beauty & Glow | Cosméticos & Cuidados | `hero_banner`, `ingredient_spotlight`, `routine_steps`, `product_grid`, `testimonial_carousel`, `faq_accordion` | `FULLY_VALIDATED` |
| 3 | `high_conversion_landing` | Flash Sale High-Conversion | Oferta / Lançamento | `countdown_timer`, `hero_banner`, `product_rail`, `before_after_slider`, `testimonial_carousel`, `faq_accordion` | `FULLY_VALIDATED` |
| 4 | `streetwear_dark` | Urban Streetwear Dark | Moda Urbana / Dark Mode | `hero_banner`, `categories_grid`, `product_grid`, `image_gallery`, `newsletter_cta` | `FULLY_VALIDATED` |
| 5 | `classic_commerce` | Classic Retail Store | Calçados / Multicategoria | `hero_banner`, `brand_features`, `product_rail`, `promotional_banner`, `product_grid`, `newsletter_cta` | `FULLY_VALIDATED` |
| 6 | `beauty_clinical` | Clinical Dermatology & Skincare | Dermocosméticos | `hero_banner`, `ingredient_spotlight`, `before_after_slider`, `product_grid`, `faq_accordion` | `FULLY_VALIDATED` |
| 7 | `fashion_minimal_monochrome` | Minimal Monochrome | High Fashion Minimalista | `hero_banner`, `bento_grid`, `product_rail`, `image_gallery` | `FULLY_VALIDATED` |
| 8 | `multicategory_marketplace` | Megastore Marketplace | Grandes Catálogos | `hero_banner`, `categories_grid`, `product_rail`, `promotional_banner`, `product_grid`, `faq_accordion` | `FULLY_VALIDATED` |
| 9 | `storytelling_brand` | Sustainable Brand Story | Marcas com Propósito | `hero_banner`, `rich_text`, `routine_steps`, `product_rail`, `testimonial_carousel` | `FULLY_VALIDATED` |
| 10 | `product_launch` | Single Hero Product Launch | Lançamento Exclusivo | `hero_banner`, `before_after_slider`, `image_hotspots`, `testimonial_carousel`, `newsletter_cta` | `FULLY_VALIDATED` |

### Garantia de Não-Duplicação
Todos os 10 presets reutilizam exclusivamente a árvore relacional de nós `experience_nodes` e os componentes canônicos registrados no `builderRegistry`. Nenhuma página hardcoded paralela existe.
