# 05 — Block Registry Inventory

> Data: 2026-07-24  
> Projeto: Hr Shoes Commerce  

---

## Estrutura de Blocos e Subitens dos Componentes

| Bloco Pai | Subitens / Arrays Suportados | Edição via ArrayBuilder | Suporte Drag & Drop | Suporte Binding Catálogo |
|---|---|---|---|---|
| `hero_banner` | Botões primário/secundário, imagem de fundo | Sim | N/A | Não |
| `product_grid` / `product_rail` | Lista dinâmica de produtos | N/A (Dynamic Binding) | Sim | **Sim (Coleção / Mais Vendidos)** |
| `categories_grid` | Items de categoria (imagem, título, slug) | Sim | Sim | **Sim (Coleções ativas)** |
| `brand_features` | Items de benefício (ícone, título, descrição) | Sim | Sim | Não |
| `testimonial_carousel` | Items de depoimento (autor, texto, foto, avaliação) | Sim | Sim | **Sim (`dynamic_reviews`)** |
| `faq_accordion` | Items de FAQ (pergunta, resposta) | Sim | Sim | Não |
| `image_gallery` / `bento_grid` | Cards de imagens e links | Sim | Sim | Não |
| `image_hotspots` | Marcadores (x_pct, y_pct, title, product_slug) | Sim | Sim | **Sim (`products` por slug)** |
| `routine_steps` | Passos numerados (step, title, text, product_slug) | Sim | Sim | **Sim (`products` por slug)** |
| `ingredient_spotlight` | Cards de matérias-primas (name, benefit, badge, image) | Sim | Sim | Não |
| `before_after_slider` | Comparador (before_image, after_image, labels) | Sim | N/A | Não |

### Validação do Editor de Subitens
Todos os subitens em formato de array declaram `arrayFields` em `builder-registry.ts` e são renderizados interativamente via `ArrayBuilder` em `src/components/admin/builder/ArrayBuilder.tsx`.
