# 02 — Incremental Requirements Matrix (Delta 01)

> Data: 2026-07-24  
> Projeto: Hr Shoes Commerce  

---

## Matriz Auditável do Prompt Incremental Delta 01

| ID | Categoria | Requisito Incremental | Status | Evidência Concreta no Repositório | Teste de Aceite / Validação |
|---|---|---|---|---|---|
| **I-01** | Presets | Biblioteca com 10 temas prontos para vitrine (Home) | `FULLY_VALIDATED` | `src/lib/home-templates-library.ts` (`HOME_TEMPLATES_LIBRARY`) | Escolha de tema no modal aplica o preset no draft |
| **I-02** | Presets | Aplicação atômica de tema mantendo a vitrine 100% editável | `FULLY_VALIDATED` | `applyHomeTemplate` em `src/services/builder.functions.ts` | Substitui nós no draft e permite reordenar/editar no sidepanel |
| **I-03** | Seção | Hotspots de produto em imagem (Shop The Look) com coordenadas percentuais X/Y | `FULLY_VALIDATED` | `image_hotspots` em `builder-registry.ts` & `image-hotspots.tsx` | Marcadores posicionados em % e exibindo mini card |
| **I-04** | Seção | Passos da rotina (`routine_steps`) com ligação a produtos do catálogo | `FULLY_VALIDATED` | `routine_steps` em `builder-registry.ts` & `routine-steps.tsx` | Passos numerados com links semânticos `/produto/$slug` |
| **I-05** | Seção | Destaque de ingredientes e materiais (`ingredient_spotlight`) | `FULLY_VALIDATED` | `ingredient_spotlight` em `builder-registry.ts` & `ingredient-spotlight.tsx` | Cards explicativos com badges de benefícios |
| **I-06** | Seção | Comparador de imagens Antes/Depois (`before_after_slider`) | `FULLY_VALIDATED` | `before_after_slider` em `builder-registry.ts` & `before-after-slider.tsx` | Slider arrastável com suporte a mouse/touch |
| **I-07** | BFF | Hidratação de preços e mídias de produtos nos marcadores Hotspot | `FULLY_VALIDATED` | `hydrateBindings` em `builder.functions.ts` enriquece hotspots com dados de `products` | Preço em centavos resolvido na consulta do servidor |
| **I-08** | UI Editor | Modal visual de seleção de temas no editor da vitrine | `FULLY_VALIDATED` | `isTemplateModalOpen` em `admin.builder.$documentId.editor.tsx` | Botão "Trocar Template" abre modal com previews e filtros |
