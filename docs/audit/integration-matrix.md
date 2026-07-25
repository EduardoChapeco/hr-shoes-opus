# G8: Integration Matrix (Matriz Canônica de Integrações HR Shoes)

> **Matriz de Integrações com Serviços Terceiros, Gateways e Invalidações**

---

## 1. Status das Integrações Terceiras

| Provedor / Serviço           | Finalidade de Negócio                 | Status Oficial | Variáveis / Credenciais                          | Comportamento sem Credencial                                     |
| :--------------------------- | :------------------------------------ | :------------- | :----------------------------------------------- | :--------------------------------------------------------------- |
| **Supabase Database & Auth** | Persistência SQL e Autenticação JWT.  | `active`       | `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Lança exceção de configuração ausente.                           |
| **Supabase Storage**         | Upload de mídias e assets do Builder. | `active`       | `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Exibe estado desabilitado seguro.                                |
| **Pagar.me Gateway**         | Processamento de PIX e Cartões.       | `unconfigured` | `PAGARME_API_KEY`                                | Fallback para pagamento manual / PIX direto sem simulação falsa. |
| **Melhor Envio / Correios**  | Cotação de frete e etiquetas.         | `unconfigured` | `MELHORENVIO_TOKEN`                              | Utiliza a tabela local de regras `shipping_rules`.               |
| **Google Merchant Feed**     | Exportação de catálogo XML.           | `active`       | N/A (Endpoint `/api/feed.xml`)                   | Retorna XML sintaticamente válido.                               |
