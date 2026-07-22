# Auditoria A5 — Ocultos, Orfaos e Desconectados

> **Data da Revisao:** 21/07/2026
> **Status:** Finalizado (Inventario A5)

## 1. UI sem Banco (Elementos puramente cenograficos)
- Filtros de admin.builder.analytics.tsx.
- Botoes de product-carousel.tsx e product-grid.tsx.

## 2. Banco sem UI (Capacidades de Banco Inacessiveis)
- **Ledger de Gift Cards:** O backend possui tabela e validacao, mas a UI de criacao no admin esta com PhaseGate bloqueado.
- **Fila de Webhooks (outbox_events):** Tabela existe, porem nao ha UI para reprocessamento manual (Dead Letter Queue resolution).
- **Regras de Comissao:** commission_rules existe, mas a UI admin.comissoes.tsx esta bloqueada.

## 3. Rotas Orfas (Sem consumidor)
1. admin_.pedidos.$id.recibo.tsx
2. _store.bio.$slug.tsx
3. _store.match-time.tsx
4. _store.paginas.$slug.tsx
5. _store.redefinir-senha.tsx
6. _store.vendedora.$slug.tsx

## 4. Modulos Escondidos por PhaseGate
A maioria do admin.* possui logica montada mas inatingivel pelo operador devido ao bloqueio intencional de Fase.
