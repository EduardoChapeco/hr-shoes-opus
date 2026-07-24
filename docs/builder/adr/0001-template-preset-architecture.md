# ADR 0001: Arquitetura da Biblioteca de Presets e Templates

## Status
Aprovado

## Contexto
O lojista necessita de temas/templates prontos ao iniciar a loja ou durante a personalização da vitrine principal (home), permitindo trocar a página inteira por um preset pré-configurado sem ter que criar cada seção do zero. O sistema precisa garantir que o aplicar de um template não sobrescreva os dados reais do catálogo nem crie registros em tabelas paralelas.

## Decisão
1. **Modelagem de Presets como Estrutura de Nós Canônica**:
   - Cada template da biblioteca é definido como uma função geradora pura que retorna uma árvore de nós `ExperienceNode` com identificadores únicos gerados no momento da aplicação.
   - Os templates não contêm IDs fixos de produtos ou coleções, utilizando apenas referências genéricas como `data_bindings: { source: "latest_products" }` ou `data_bindings: { source: "dynamic_reviews" }`.

2. **Aplicação Atômica de Templates**:
   - Ao selecionar um template na onboarding ou no editor visual, o sistema gera uma nova versão `draft` em `public.experience_versions` associada ao `experience_documents` da Home (`slug = 'home'`).
   - Os nós antigos da versão draft anterior são substituídos atomicamente pela nova árvore de nós do template.
   - A versão `published` pública da loja permanece inalterada até que o lojista clique explicitamente em "Publicar".

3. **Troca e Personalização 100% Editáveis**:
   - Após aplicar um template, todos os nós, cores, mídias e textos continuam 100% editáveis no sidepanel de propriedades e reordenáveis via drag-and-drop.

## Consequências
- Preservação da integridade multi-tenant: os presets usam os dados reais da loja cadastrada (`stores`, `products`, `reviews`).
- Rollback seguro: o lojista pode alternar entre rascunhos ou voltar para a versão publicada a qualquer momento.
