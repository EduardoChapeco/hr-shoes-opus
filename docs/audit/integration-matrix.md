# G6: Integration Matrix (Matriz de Integrações Externas)

Este documento registra o status de todas as integrações com serviços terceiros e gateways de pagamento/logística na plataforma HR Shoes Commerce, conforme exigido pelas diretrizes da arquitetura (`unconfigured | testing | active | error`).

---

## Matriz Canônica de Integrações

| Provedor / Serviço | Finalidade de Negócio | Status Oficial | Variáveis de Ambiente Necessárias | Comportamento quando Ausente (`unconfigured`) |
| :--- | :--- | :--- | :--- | :--- |
| **Supabase Database & Auth** | Banco de dados relacional e gestão de identidades/JWT. | `active` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Lança `SupabaseUnconfiguredError` e exibe `UnconfiguredState`. |
| **Supabase Storage** | Armazenamento de imagens de produtos, banners e mídias. | `active` | `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Componentes de upload exibem estado desabilitado com aviso. |
| **Pagar.me Gateway** | Processamento de PIX, Cartão de Crédito e Boleto. | `unconfigured` | `PAGARME_API_KEY`, `PAGARME_ENCRYPTION_KEY` | Opcional no checkout; checkout fallback para modo manual / PIX direto. Nunca simula sucesso falso. |
| **Correios / Melhorenvio**| Cotação de frete por CEP em tempo real e geração de etiquetas. | `unconfigured` | `MELHORENVIO_TOKEN`, `CORREIOS_USER` | Simulador usa a tabela local de regras de frete (`shipping_rules`). |
| **Meta Pixel / TikTok** | Rastreamento de conversões e eventos de e-commerce. | `unconfigured` | `VITE_META_PIXEL_ID`, `VITE_TIKTOK_PIXEL_ID` | Scripts não são injetados no HTML; sem erros de runtime no console. |
| **WhatsApp API (Z-API)** | Disparo de notificações de pedido (criado, pago, enviado). | `unconfigured` | `ZAPI_INSTANCE_ID`, `ZAPI_TOKEN` | Disparos são ignorados silenciosamente sem travar a transação de checkout. |
