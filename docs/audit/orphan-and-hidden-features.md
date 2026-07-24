# G9: Orphan & Hidden Features (Inventário de Recursos Órfãos, Ocultos e Mocks)

> **Mapeamento Canônico de Recursos Ocultos, Código Morto, Mocks e Duplicações**

---

## 1. Classificação de Itens Rastreados

| Recurso / Elemento | Tipo de Problema | Causa Identificada | Plano de Ação |
| :--- | :--- | :--- | :--- |
| **`admin.relatorios.tsx`** | `PARCIAL` | Métricas parciais de vendas. | Conectar agregadores DRE em `finance.functions.ts`. |
| **`_store.desejos.tsx`** | `PARCIAL` | Lista de desejos salva localmente no browser. | Vincular persistência em tabela `customer_wishlists`. |
| **`api.feed.xml.ts`** | `OCULTO` | Rota funcional de feed Google Merchant ausente do menu admin. | Adicionar atalho nas configurações de marketing do Admin. |
| **`chat_messages`** | `BANCO SEM UI COMPLETA` | Tabela relacional e realtime para chat prontas. | Finalizar widget de chat ao vivo no storefront. |
