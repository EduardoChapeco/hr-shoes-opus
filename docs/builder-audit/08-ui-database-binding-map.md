# 08 — UI & Database Binding Map

> Data: 2026-07-24  
> Projeto: Hr Shoes Commerce  

---

## Mapeamento de Correspondência UI ↔ Banco ↔ BFF

| Campo Visual no Sidepanel | Schema Zod / Path JSONB | Função BFF Resolver | Tabela de Origem | Comportamento no Server / Hydration |
|---|---|---|---|---|
| **Coleção de Produtos** | `data_bindings.collection_slug` | `hydrateBindings` | `collections` & `products` | Resolve os 12 últimos produtos ativos da coleção e injeta em `transient_data.products` |
| **Produtos Recentes / Mais Vendidos** | `data_bindings.type = 'latest_products'` | `hydrateBindings` | `products` & `product_media` | Busca produtos com status `published` e ordena por `created_at` |
| **Depoimentos de Clientes** | `data_bindings.type = 'dynamic_reviews'` | `hydrateBindings` | `reviews` & `profiles` | Busca avaliações com status `approved` e injeta autores reais e fotos |
| **Marcadores de Hotspots** | `content.hotspots[].product_slug` | `hydrateBindings` | `products` | Consulta por slug e injeta `price_cents` real e `product_id` |
| **Perfil Hero / Contato / Horários** | `data_bindings.source = 'store_profile'` | `hydrateStoreProfileForNode` | `stores` | Calcula status aberto/fechado em tempo real e lê endereço e telefones |
