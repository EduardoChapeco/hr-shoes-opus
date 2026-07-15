# 00 CURRENT TRUTH

## Estado Real
- **Branch Atual:** `main`
- **Banco Conectado:** Supabase (Local/Online)
- **Migrations Aplicadas:** 0001 a 0027 (0027 Auth Refactor é a mais recente).
- **Ambiente:** Node.js / TanStack Start + React 19 + TypeScript Strict.

## Módulos Reais (Comprovados Verticalmente)
- **Autenticação (Auth / OAuth):** Refatorado na Fase 1 (Migration 0027). Trigger e SSR atuando corretamente, callback OAuth e redefinição de senha operantes e protegidos.

## Módulos Parciais (Cenográficos ou Desconectados)
- **Catálogo:** As tabelas existem, consultas acontecem. Mas a UI de listagem administrativa está parcialmente preenchida com mocks em componentes (`admin.catalogo.produtos`).
- **CMS / Tema:** Páginas e componentes foram criados, mas há dependências não verificadas de persistência (Páginas estáticas, textos mockados em toolbars, e radius fixos não vinculados ao banco de temas de forma contínua).
- **Estoque:** Permite leitura e listagem. Mas **transações** e bloqueios durante o Checkout não operam em nível atômico. (Venda sem reserva possível).
- **Checkout / Financeiro:** A migration 0025 criou RPC atômico para o pedido, mas a integração do Pagar.me via webhook não existe. Há stubs. Botões de "Pagar via PIX" são manuais.

## Módulos Ocultados / Inexistentes
- **Multi-Tenant Administrativo:** Sem interface para gerenciar mais de uma Organização.
- **Webhooks:** Inexistentes. A API de checkout tem a promessa de notificação, mas não possui a recepção canônica.

## Principais Riscos Encontrados
- **Venda de produto esgotado:** Race condition no checkout.
- **Formulários vazios (Stubs):** Encontrados +70 casos de placeholders soltos, TODOs, e mockups no frontend administrativo que sugerem que as funções não estão conectadas a uma tabela (ex: cupons, marketing, feed, integrações com correios, gift-cards vazios).
- **Pagamento fantasma:** Como os webhooks não operam, os pedidos podem ser concluídos no banco de dados sem que o dinheiro tenha entrado, operando puramente via confiança no fluxo de caixa manual.

## Divergências entre Documentação e Runtime
- `MASTER_PLAN.md` promete pagamentos split (Pagar.me), e estoque estrito, mas o runtime atual roda com botões HTML que contornam essas restrições.
