# 17 — Responsive & Accessibility Audit Report

> Data: 2026-07-24  
> Projeto: Hr Shoes Commerce  

---

## Auditoria de Responsividade e Acessibilidade (WCAG 2.2 AA)

1. **Alvos de Toque (Touch Targets >= 44px)**: Botões primários, botões de ação e marcadores de hotspots possuem área de toque calculada superior a 44x44px.
2. **Navegação por Teclado e Foco**: Modais, accordions e marcadores de hotspot em `image-hotspots.tsx` respondem às teclas `Tab`, `Enter`, `Space` e `Escape`.
3. **HTML Semântico**: Cada página no storefront possui uma única tag `<h1>`, seguida por hierarquia de `<h2>` e `<h3>` em seções secundárias.
4. **Layout Fluid e Adaptativo**: Grids usam Tailwind v4 `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` sem overflow horizontal em dispositivos móveis (360px a 1920px).
