# 15 — Duplication and Dead Code Report

> Data: 2026-07-24  
> Projeto: Hr Shoes Commerce  

---

## Relatório de Duplicação e Código Morto

### 1. Auditoria de Componentes e Primitivas Visual
- **Card de Produto (`ProductCard`)**: Confirmado que `ProductCard` (`src/components/commerce/product-card.tsx`) é a fonte única da verdade para exibição de produtos em todas as vitrines (`product_rail`, `product_grid`, `product_carousel`, `image_hotspots`). Nenhuma duplicata de card foi criada.
- **Componentes do Inspector**: `ArrayBuilder`, `MediaUploader` e `ColorPicker` são compartilhados por todas as seções e reutilizados sem duplicação no editor.

### 2. Auditoria de Tabelas e Rotas Legadas
- Tabelas legadas `pages` e `page_sections` (das migrations 0004 e 0070) foram mantidas inalteradas para não quebrar legados antigos, porém nenhuma rota nova do builder consome essas tabelas.
- O builder opera exclusivamente sobre `experience_documents`, `experience_versions` e `experience_nodes`.
