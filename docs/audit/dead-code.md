# Auditoria Forense — Código Morto (`docs/audit/dead-code.md`)

Este documento lista rotas, componentes, funções e arquivos remanescentes que não possuem consumidores ou referências ativas no projeto.

## 1. Arquivos de Rotas Legados e Órfãos
- **Rota `admin.onboarding.tsx`**: Rota presente no sidebar de navegação geral, mas sem fluxo funcional. O conteúdo é um checklist de onboarding mockado.
- **Destaques e Páginas de Suporte Estáticas**: Rotas do CMS antigo (`_store.faq.tsx`, `_store.faq.tsx`, `_store.trocas-e-devolucoes.tsx`) que foram migradas ou deveriam ser substituídas de ponta a ponta pelo motor de renderização da Builder Platform (`ExperienceRenderer`), mas cujos arquivos estáticos ainda existem em disco e podem causar conflitos de rota no TanStack Router.

## 2. Componentes e Funções Sem Consumo
- **Switch Case Legado de Seções**: O antigo renderizador flat do CMS que consumia `page_sections` foi removido das rotas principais, mas ainda existem arquivos de utilidades em `src/components/commerce/dynamic-sections/` que não foram plenamente catalogados no `builder-registry.ts` ou mapeados no component map.
- **`old_routes.ts`**: Arquivo na raiz do projeto contendo rotas legadas comentadas ou duplicadas. Deve ser arquivado ou removido para evitar que o builder/IDE o interprete indevidamente.
- **Middlewares de Testes Temporários**: Funções de testes em lote e arquivos no diretório `scratch/` que não são referenciados no bundle de produção.
