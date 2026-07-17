# 03_DATABASE_SCHEMA_AUDIT.md — Auditoria de Banco de Dados e Migrations

Data: 2026-07-15T02:47Z

## ESTADO DO BANCO DE DADOS REMOTO (Supabase)

Auditoria confirmou: **Banco está "limpo"**. Todas as tabelas existem (0001 a 0023 aplicadas), mas estão vazias.

| Domínio          | Tabelas                                                            | Registros | Status                 |
| ---------------- | ------------------------------------------------------------------ | --------- | ---------------------- |
| **Core**         | `organizations`, `stores`                                          | 1         | Seed aplicado via 0022 |
| **Auth**         | `auth.users`, `profiles`                                           | 0         | Sem usuários           |
| **Catálogo**     | `products`, `product_variants`, `categories`, `collections`        | 0         | Vazio                  |
| **Cart & Order** | `carts`, `cart_items`, `orders`, `order_items`                     | 0         | Vazio                  |
| **Pagamentos**   | `coupons`, `gift_cards`, `cash_registers`, `cash_shifts`           | 0         | Vazio                  |
| **Estoque**      | `stock_reservations`, `stock_movements` (via RPC)                  | 0         | Vazio                  |
| **CMS & Growth** | `pages`, `page_versions`, `stories`, `reviews`, `seller_showcases` | 0         | Vazio                  |

## PROBLEMAS ESTRUTURAIS IDENTIFICADOS

### 1. Divergência de Multi-tenant vs Single-tenant

O schema foi desenhado fortemente como multi-tenant (`organization_id` e `store_id` em quase todas as tabelas).
**Porém**, o negócio é **single-tenant** (loja única da Hr Shoes com vendedores/afiliados).
**Consequência**: Complexidade inútil de RLS. Toda query precisa filtrar por `store_id` desnecessariamente. A migration 0022 fez um seed de "loja única", mas a dívida técnica na estrutura continua.

### 2. Trigger `handle_new_user` Falhando

A tentativa de cadastro de um usuário de teste falhou na criação do `profile`.

- **Causa provável**: Embora a migration 0022 (ou 0010) crie a trigger e a função, pode haver um problema de permissão ou a migration 0022 não foi aplicada corretamente no `auth.users` trigger no Supabase Cloud.
- **Evidência**: Quando tentamos chamar `admin.auth.admin.createUser`, o `auth.users` foi inserido, mas o `profiles` não foi gerado, e nenhum log de erro de trigger foi emitido visivelmente, ou a trigger falhou silenciosamente. (Supabase cloud auth rate limit também atrapalhou testes pelo cliente).

### 3. Integrações de Banco não Testadas

- A RPC `adjust_stock` (migration 0011) gerencia ledger atômico de estoque, mas NUNCA foi testada num ciclo completo de checkout.
- RLS dependendo de `store_id` nunca foi posta à prova negativa em runtime real.

## CONCLUSÃO DA AUDITORIA

O banco foi construído de forma teórica. Existe um "esqueleto", mas os músculos e nervos (triggers, RLS, regras atômicas) nunca correram sangue (dados reais em fluxo contínuo).

O maior bloqueador atual é o **Auth** (o profile não sendo criado e Rate Limits ocultando falhas).
A maior dívida arquitetural é a **sobra do Multi-tenant**.
