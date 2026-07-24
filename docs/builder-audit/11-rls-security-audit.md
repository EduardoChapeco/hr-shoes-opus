# 11 — RLS & Security Audit Report

> Data: 2026-07-24  
> Projeto: Hr Shoes Commerce  

---

## Auditoria de Segurança e RLS (Row Level Security)

### 1. Políticas RLS de Banco de Dados (`0048_builder_platform_core.sql`)
- **RLS Deny-by-Default**: Ativado em `experience_documents`, `experience_versions` e `experience_nodes`.
- **Politicas de Leitura Pública**: Permitem `SELECT` em `experience_documents` ativas e `experience_versions` com `status = 'published'` para renderização do storefront.
- **Políticas de Mutação de Admin**: Exigem que o `store_id` do usuário autenticado corresponda ao `store_id` do documento (`store_id = current_setting('app.current_store_id')` ou via RLS em nível de tenant).

### 2. Camada de Aplicação (BFF Protection)
- Nenhuma chave `service_role` ou credencial administrativa vaza para o bundle do React frontend.
- O cliente React comunica-se unicamente através de funções de servidor (`createServerFn`).
- Tentativas de acessar documentos de outras lojas via URL ou ID direto são bloqueadas na consulta do BFF com validação de `store_id`.

### 3. Validação de Mídias
- Uploads salvos em buckets Supabase Storage isolados por pasta de tenant (`store_id/year/month/filename`).
