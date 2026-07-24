# 13 — Demo & Template Architecture Report

> Data: 2026-07-24  
> Projeto: Hr Shoes Commerce  

---

## Arquitetura de Previews de Temas e Dados Fictícios Isolados

1. **Isolamento Estrito no Frontend**: Os presets em `src/lib/home-templates-library.ts` utilizam referências genéricas como `product_slug: "scarpin-couro-nude"` e categorias padrão apenas para demonstração inicial visual.
2. **Hidratação Substitutiva ao Aplicar o Tema**: Ao aplicar o tema em uma loja real via `applyHomeTemplate`:
   - Os nós do preset substituem a árvore rascunho do documento.
   - Na primeira renderização (pública ou editor), a função `hydrateBindings` substitui os dados genéricos pelos produtos e coleções **reais** cadastrados na tabela `products` da loja do lojista (`store_id`).
   - Se a loja não possuir produtos cadastrados, o componente exibe o componente canônico de `EmptyState` ("Nenhum produto encontrado nesta coleção"), conforme exigido no `AGENTS.md`.
3. **Impossibilidade de Contaminação Comercial**: Nenhum produto fictício é inserido no banco de dados da loja (`products`, `inventory`, `orders`).
