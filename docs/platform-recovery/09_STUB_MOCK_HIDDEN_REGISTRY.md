# 09 STUB, MOCK, HIDDEN REGISTRY

Este documento inventaria todas as representações estáticas e cenográficas (Stubs e Mocks) espalhadas pela plataforma, exigindo correção recursiva.

| Arquivo | Símbolo | Tipo | Capacidade Afetada | Impacto | Correção | Fase | Status |
|---|---|---|---|---|---|---|---|
| `src/services/payment.functions.ts` | `ensure it's called by an authenticated user for demo` | Fake / Demo | Gateway de Pagamento | Pagamentos não são validados na raiz, abrindo brecha. | Ligar com Provider Webhook. | FASE 2 | PENDENTE |
| `src/routes/admin.stories.tsx` | `placeholder="https://..."` / `Input link_url` | Stub UI | Módulo de Stories CMS | Interface desenhada, mas sem tabela associada aos clicks. | Criar tabela e UI Action | FASE X | PENDENTE |
| `src/routes/admin.perfil-publico.tsx` | Formulários visuais de perfil | Mock Placeholder | Perfil da loja pública | As informações preenchidas não alteram a vitrine. | Ligar mutations reais. | FASE X | PENDENTE |
| `src/routes/admin.onboarding.tsx` | Checklist fake | Stub estático | Onboarding Financeiro | O admin marca "feito" mas o backend não confere chaves. | Ligar ao `system_flags`. | FASE X | PENDENTE |
| `src/routes/admin.marketing.gift-cards.tsx` | Forms de Giftcard | Stub UI | Geração de cupons e créditos | A tela de UX está montada mas a ligação de gerar códigos com cripto real falta na view. | Ação RPC | FASE X | PENDENTE |
| `src/routes/admin.fretes.tabelas.tsx` | Preenchimentos mockados | Simulação | Cotação Correios/Transportadoras | Permite ao Admin fingir que cadastrou cep sem engine de frete conectada ao Carrinho real. | Engine de Cálculo | FASE 2 | PENDENTE |
| `src/routes/admin.estoque.tsx` | `Alertas de Estoque` | Stub UI | Triggers de Reabastecimento | Mostra tela bonita, mas não há Job monitorando e emitindo notificações via WS. | Filas/Cron Jobs | FASE 3 | PENDENTE |
| `src/routes/admin.configuracoes.seo.tsx` | SEO Mockup | Stub | CMS Global | Metadados salvos na UI não refletem nas headers SSR do cliente. | Middleware Header | FASE X | PENDENTE |
| `src/routes/admin.integracoes.tsx` | Form `Token de Acesso` | Stub | Gateway Third-party | Promete integração ERP/Correios mas salva num json/variável morta sem worker rodando. | Worker / Cron | FASE X | PENDENTE |
