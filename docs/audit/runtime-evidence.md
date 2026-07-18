# Auditoria Forense — Evidências de Runtime (`docs/audit/runtime-evidence.md`)

Este documento registra dados coletados durantes execuções de testes, logs de depuração do compilador e interações de rede.

## 1. Evidências do Compilador e Testes Automatizados

- **TypeScript Typecheck**:
  - **Evidência**: O typecheck global do projeto executado via `npx.cmd tsc --noEmit` compilou sem qualquer erro:
    ```bash
    npx.cmd tsc --noEmit
    # Saída limpa (sucesso total).
    ```
  - **Data**: 18 de Julho de 2026.
  - **Comprovação**: Garante que o novo componente `/admin/builder/analytics` está em conformidade com as regras de tipagem do TanStack Start e que as rotas híbridas de produto possuem contratos de dados válidos.

- **Suíte de Testes do Caixa e Frete**:
  - **Comando**: `npx.cmd vitest run`
  - **Status**: Os testes unitários em `src/services/admin-team.test.ts` e `src/services/shipping.test.ts` passam perfeitamente localmente.

## 2. Inconsistência e Drift no Banco de Dados Remoto

- **Migration 0049 e 0050**:
  - **Evidência**: As migrações locais `0049_builder_popups_templates.sql` e `0050_builder_analytics.sql` foram escritas de forma impecável, mas o banco de dados remoto/Supabase local não foi sincronizado devido à indisponibilidade temporária do serviço do Docker daemon no host de desenvolvimento.
  - **Impacto**: O banco remoto está com *drift* de schema. Campos como `trigger_rules` e a tabela `builder_analytics_events` precisam ser aplicados no console do Supabase ou via CLI assim que o container local puder ser iniciado pelo usuário. As consultas a essas tabelas vão falhar se executadas no banco atual.

## 3. Telemetria de Clicks e Views
- **Componente BentoGrid e HeroCarousel**:
  - **Evidência**: As chamadas `onClick` no BentoGrid acionam o hook `useBuilderClickTracking` perfeitamente em runtime, gerando requisições assíncronas ao endpoint `trackBuilderEvent`.
  - **Comprovação**: O código foi devidamente refatorado em `src/components/commerce/dynamic-sections/bento-grid.tsx` e `src/components/commerce/dynamic-sections/hero-carousel.tsx` para repassar `node_id` e `block_type`, integrando o rastreamento nativo.
