# Matriz de Lacunas e Expansão do Builder (Feature Gap Matrix)

> Data: 2026-07-24  
> Projeto: Hr Shoes Commerce  

---

## Matriz Comparativa de Capacidades

| Feature Desejada | Já Existe | Parcial | Ausente | Reutilização Prevista | Alteração Necessária | Banco | UI Editor | Storefront | Testes |
|---|---|---|---|---|---|---|---|---|---|
| **Biblioteca de Templates / Presets para Home** | | **X** | | Presets básicos em `builder.functions.ts` | Criar biblioteca expansível com 11 presets profissionais (Fashion Editorial, Botanical Beauty, Minimalist, High Conversion, etc.) | Nenhuma nova tabela (usa `experience_versions`) | Adicionar seletor visual de presets na onboarding/editor | Renderizador de presets | Unit + E2E |
| **Hotspots de Produto em Imagem (Shop The Look)** | | | **X** | Componentes de modal/drawer e card de produto | Criar novo bloco `image_hotspots` com coordenadas percentuais X/Y, mini-card flutuante e editor visual de marcadores | Nenhuma (salva em `content.hotspots` JSONB) | Inspector com coordenador de hotspots | Componente `ImageHotspots` com tooltip/card | Unit + Visual |
| **Quick View / Mini Drawer de Produto** | | **X** | | `slide-out-cart.tsx`, `product-card.tsx` | Criar `QuickViewModal` acessível acionado por vitrines, hotspots e grids | Nenhuma | Botão quick view em cards | Drawer/Modal acessível com variante selector real | E2E |
| **Banners Mosaico Avançados & Grid Layouts** | | **X** | | `bento-grid.tsx`, `mosaic-banners.tsx` | Adicionar suporte a layouts assimétricos configuráveis via preset | Nenhuma | Seletor de layout no inspector | Renderizador de mosaico responsivo | Visual |
| **Hero Editorial & Split Banners** | | **X** | | `hero-carousel.tsx`, `split-banner.tsx` | Adicionar focal point, overlay opacity, vídeo ambiente e CTA duplo | Nenhuma | Inspector de mídia e focal point | Suporte a vídeo e overlay | Visual |
| **Seções de Beleba & Moda (Rotinas, Ingredientes, Before/After)** | | | **X** | `info-cards.tsx`, `timeline-history.tsx` | Criar blocos `routine_steps`, `ingredient_spotlight` e `before_after_slider` | Nenhuma | Inspeção de etapas e comparação | Sliders interativos acessíveis | Unit + Visual |
| **PDPs & Coleções Configuráveis** | | **X** | | `_store.produto.$slug.tsx` | Permitir composição de PDP e Coleções via seções de `experience_nodes` | Nenhuma (`document_type = 'product_template'`) | Editor de template de PDP | Dynamic Page Renderer | E2E |
| **Color Schemes & Overrides Responsivos** | | **X** | | `design_tokens` e `responsive_overrides` em `ExperienceNode` | Suporte completo a cascata: global → seção → breakpoint (sm/md/lg) | Nenhuma | Controls por breakpoint no sidepanel | Utility classes responsivas | Unit |

---

## Resumo da Estratégia de Implementação

1. **Sem Alterações Disruptivas no Banco**: Todas as novas seções, blocos e templates utilizam o modelo flexível e tipado de `experience_documents`, `experience_versions` e `experience_nodes` com validação Zod.
2. **Integração Vertical Completa**: Todo bloco novo terá Manifest Zod em `builder-registry.ts` → Componente React em `dynamic-sections` → Suporte no Inspector em `editor.tsx` → Suporte no `experience-renderer.tsx`.
