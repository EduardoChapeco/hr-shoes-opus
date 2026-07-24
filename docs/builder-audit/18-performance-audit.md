# 18 — Performance Audit Report

> Data: 2026-07-24  
> Projeto: Hr Shoes Commerce  

---

## Auditoria de Performance e Otimização de Consultas

1. **Resolução de Dados em Lote (Evitação de N+1)**:
   - `hydrateBindings` executa apenas 1 consulta por tipo de binding para a página inteira.
   - Para marcadores Hotspots, extrai todos os `product_slug`s em um único array e executa `.in("slug", slugs)` em uma única chamada SQL.
2. **Imagens Otimizadas**:
   - `ProductCard` e `MediaUploader` utilizam tags `<img>` otimizadas com `loading="lazy"` para seções abaixo da dobra.
3. **Draft Updates Sem Full Re-render**:
   - O editor React altera apenas os nós locais em memória e envia atualizações via `saveBuilderNodes` sem forçar o recarregamento da página inteira.
