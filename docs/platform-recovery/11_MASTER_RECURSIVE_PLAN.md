# 11 MASTER RECURSIVE PLAN

Plano global por fases para a reconstrução vertical da plataforma. Nenhuma subfase avança se houver itens críticos quebrados ou falsamente concluídos.

## FASE 1: Fundação de Identidade (CONCLUÍDO)

| ID       | Causa raiz                                                   | Escopo                                                        | Dependências   | Severidade | Fase | Status     | Evidência                                                |
| -------- | ------------------------------------------------------------ | ------------------------------------------------------------- | -------------- | ---------- | ---- | ---------- | -------------------------------------------------------- |
| AUTH-001 | Trigger RLS e gambiarras concorrentes em `auth.functions.ts` | Login, SSR, Cadastro, OAuth, Reset Password, Onboarding Admin | Migration 0027 | Crítica    | 1    | COMPROVADO | Fluxo OAuth / Trigger de trava (`system_flags`) testados |

## FASE 2: Transações e Pagamentos (EM ANDAMENTO)

| ID      | Causa raiz                                    | Escopo                                                            | Dependências | Severidade | Fase | Status   | Evidência |
| ------- | --------------------------------------------- | ----------------------------------------------------------------- | ------------ | ---------- | ---- | -------- | --------- |
| PAY-001 | Falso Gateway de Pagamento e Botões Estáticos | Checkout nativo conectado a gateway real com IDEMPOTÊNCIA         | AUTH-001     | Crítica    | 2.1  | PENDENTE | N/A       |
| PAY-002 | Falta do Webhook Receiver                     | `api.webhooks.pagarme` que altera pedidos baseados em hash seguro | PAY-001      | Crítica    | 2.2  | PENDENTE | N/A       |

## FASE 3: Estoque e Confiabilidade Logística

| ID        | Causa raiz                                    | Escopo                                                       | Dependências | Severidade | Fase | Status   | Evidência |
| --------- | --------------------------------------------- | ------------------------------------------------------------ | ------------ | ---------- | ---- | -------- | --------- |
| STOCK-001 | Race conditions e falta de tabela Lock        | Reservas de estoque atômicas no Redis/Postgres com Timeout   | PAY-001      | Crítica    | 3.1  | PENDENTE | N/A       |
| SHIP-001  | Cotação de frete mockada na UI Administrativa | Integração correios/melhor envio com cálculo em runtime real | STOCK-001    | Alta       | 3.2  | PENDENTE | N/A       |

## FASE 4: Multi-Tenant / Franquias

| ID         | Causa raiz                                           | Escopo                                                        | Dependências | Severidade | Fase | Status                        | Evidência              |
| ---------- | ---------------------------------------------------- | ------------------------------------------------------------- | ------------ | ---------- | ---- | ----------------------------- | ---------------------- |
| TENANT-001 | Interfaces inexistentes para organizações adicionais | CRUD de Lojas, Invites de Operadores, Segmentação RLS estrita | AUTH-001     | Média      | 4.1  | PENDENTE DE RECONSTRUÇÃO REAL | Ver `BACKLOG_CANONICO` |
