# ADR 0002: Versionamento e Schema Canônico das Seções

## Status
Aprovado

## Contexto
Conforme novas seções (como `image_hotspots`, `routine_steps`, `ingredient_spotlight`, `before_after_slider`) são adicionadas ao builder, páginas já salvas no banco com schemas anteriores precisam continuar funcionando sem erros de hidratação ou renderização.

## Decisão
1. **Versionamento Estrito por Bloco**:
   - Todo manifesto de bloco registrado em `builderRegistry` possui um campo `version` (ex: `"1.0.0"` ou `"2.0.0"`).
   - O schema Zod de cada bloco valida retrocompativelmente os campos `content`, `design_tokens`, `layout_rules` e `data_bindings`.

2. **Sanitização e Fallback Graceful no Servidor**:
   - Na função de hidratação BFF (`builder.functions.ts`), caso um nó do banco possua campos ausentes ou obsoletos, o validador atribui os valores padrão definidos no `defaultProps` do manifesto sem corromper ou deletar o nó.

3. **Reutilização do ProductCard Canônico**:
   - Nenhuma nova seção de vitrine implementará um card de produto customizado do zero. Todas as vitrines (`product_rail`, `product_grid`, `product_carousel`, `image_hotspots`) compartilham a mesma primitiva `ProductCard` de `src/components/commerce/product-card.tsx`.

## Consequências
- Zero quebras em páginas salvas anteriormente.
- Manutenibilidade centralizada dos cards de produtos e das seções visuais.
