# 21 — Implementation Log Report

> Data: 2026-07-24  
> Projeto: Hr Shoes Commerce  

---

## Log Sequencial das Implementações Realizadas

- **Fases 0 a 7**: Implementação da base do builder, tabelas relacionais `experience_documents`, `experience_versions`, `experience_nodes`, BFF server functions em `src/services/builder.functions.ts` e renderizador `ExperienceRenderer`.
- **Delta 01**:
  1. Criação de 4 novas seções canônicas: `image_hotspots`, `routine_steps`, `ingredient_spotlight`, `before_after_slider`.
  2. Expansão de `src/lib/builder-registry.ts` para 27 blocos.
  3. Criação de `src/lib/home-templates-library.ts` com 10 presets visuais de vitrine.
  4. Implementação de `applyHomeTemplate` em `builder.functions.ts`.
  5. Adição da hidratação dinâmica de produtos nos marcadores Hotspot em `hydrateBindings`.
  6. Integração do Modal de Seleção de Temas em `admin.builder.$documentId.editor.tsx`.
  7. Correção de links de rotas TanStack Router (`to="/produto/$slug"` e `to="/catalogo"`).
  8. Validação de compilação sem erros via `tsc --noEmit`.
