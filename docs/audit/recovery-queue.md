# G11: Recovery Queue (Fila Canônica de Recuperação Priorizada HR Shoes)

> **Fila Priorizada de Manutenção e Refatoração Estrutural por Risco Operacional**

---

## 1. Critérios de Priorização
1. **Segurança & RLS / Multi-Tenancy**
2. **Perda de Dados & Financeiro / Caixa**
3. **Estoque & Motor Transacional**
4. **Checkout & Processamento de Pedidos**
5. **Correção de Interfaces & UX**
6. **Integrações Terceiras & Webhooks**

---

## 2. Fila Canônica Priorizada

| Prioridade | Domínio / Módulo | Componente / Arquivo | Diagnóstico / Problema | Ação Recomendada | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **P0-1** | **CRM Pipeline** | `src/services/crm.functions.ts` | Funil de vendas e qualificação de leads com UI parcial. | Finalizar painel visual Kanban no Admin. | `PARCIAL` |
| **P0-2** | **Chat Realtime** | `chat_messages` | Tabela relacional pronta, mas atalho visual no storefront inativo. | Ativar widget de atendimento ao vivo no e-commerce. | `PARCIAL` |
| **P1-1** | **Gift Cards** | `src/services/promotions.functions.ts` | Resgate de gift cards no checkout funcional, mas emissão manual de gift card no Admin parcial. | Conectar form de emissão rápida de vales-presente. | `PARCIAL` |
| **P1-2** | **DRE Financeiro** | `admin.financeiro.index.tsx` | Dashboard financeiro com visualização parcial de lançamentos de caixa. | Agregar movimentações de vendas e despesas em DRE consolidado. | `PARCIAL` |
| **P2-1** | **Lista de Desejos**| `_store.desejos.tsx` | Lista de desejos salva localmente no localStorage. | Vincular persistência na tabela SQL `customer_wishlists`. | `PARCIAL` |
