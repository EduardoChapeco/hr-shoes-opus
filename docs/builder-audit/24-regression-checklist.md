# 24 — Regression Checklist Report

> Data: 2026-07-24  
> Projeto: Hr Shoes Commerce  

---

## Checklist de Testes de Regressão

- [x] **Navegação do Editor**: Carregamento da rota `/admin/builder/$documentId/editor`.
- [x] **Abertura do Sidepanel**: Seleção de nós do canvas abre o inspetor sem crash de React.
- [x] **Troca de Temas**: Invocação do modal de seleção de temas aplica o preset e atualiza a árvore de nós locais.
- [x] **Salvamento de Draft**: Botão "Salvar Rascunho" atualiza o banco sem alterar a rota pública `/`.
- [x] **Publicação Atômica**: Botão "Publicar" promove o draft para `published` e invalida o cache.
- [x] **Renderização no Storefront**: Rota `/` lê a versão publicada via `getPublicExperienceDocumentBySlug` e exibe os blocos.
- [x] **Hidratação BFF**: Preços e produtos reais de `products` são inseridos sem hardcode.
- [x] **Typecheck**: Execução de `tsc --noEmit` encerra com 0 erros.
