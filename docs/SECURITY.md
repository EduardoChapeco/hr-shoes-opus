# Segurança — Hr Shoes Commerce

Status: Fase 0 (fundação). Este documento é a referência canônica de modelo de ameaças e controles de segurança para a plataforma Hr Shoes (ecommerce/CMS/PWA mobile-first, multi-tenant).

## 1. Princípios gerais

- Deny-by-default em todas as camadas: RLS, RBAC, rotas, uploads, integrações.
- Nenhum acesso do frontend ao Supabase diretamente; tudo passa por services/BFF/server functions.
- UUID nunca é prova de autorização; toda operação revalida organization_id/store_id e papel no servidor.
- Multi-tenancy obrigatória via organization_id/store_id em toda tabela de negócio.
- Dinheiro sempre em centavos inteiros + BRL; nenhum cálculo comercial confiável no cliente, servidor recalcula sempre.

## 2. Modelo de ameaças

Atores: anônimo malicioso, cliente elevando privilégio, colaborador excedendo escopo, ataques a upload, replay/forjamento de webhooks, vazamento de segredos, enumeração, força bruta, comprometimento de conta admin.
Superfícies críticas: autenticação, checkout/pagamento, uploads, webhooks, APIs admin/CMS, exportação de dados pessoais, auditoria.

## 3. RBAC

Papéis: owner, admin, manager, seller, stock, finance, content, support, customer — cada um com escopo de permissão descrito e sempre validado no servidor, nunca só na UI. Papéis são escopados por organização; elevação de privilégio exige owner e é auditada.

## 4. RLS deny-by-default

Toda tabela exposta tem RLS habilitado, sem policy = sem acesso. Policies por organization_id/store_id + papel. INSERT/UPDATE validam que valores gravados pertencem ao tenant do usuário. Tabela de auditoria é insert-only. Testes de RLS positivos e negativos obrigatórios em CI, cobrindo cada papel dentro e fora do tenant.

## 5. Service role e segredos

Service role só server-side, nunca no bundle. Segredos em vault/env server-side, nunca versionados, nunca em logs (redaction automática). Rotação sem downtime.

## 6. Uploads

Allowlist estrita, validação por magic bytes/MIME real, limites de tamanho/dimensão/duração, nomes gerados pelo servidor, bucket isolado por finalidade, sem execução, scan antivírus com quarentena, privado durante upload, acesso só via signed URLs de curta duração.

## 7. Hardening HTTP

CSP restritiva, HTTPS/HSTS, headers de segurança padrão, CSRF adequado à arquitetura de server functions, rate limiting em endpoints sensíveis, proteção contra enumeração, lockout progressivo e controles de risco, validação/sanitização de entrada e saída.

## 8. LGPD

Inventário de dados, base legal e minimização, consentimento por finalidade e versão (termos, privacidade, cookies, trocas/devoluções, compartilhamento, envio/frete) com registro auditável de aceite, reaceite em nova versão, direitos do titular (exportação, correção, exclusão/anonimização), canal de privacidade, fluxo de resposta a incidentes, retenção definida por finalidade.

## 9. Logs e auditoria

Logs nunca contêm tokens, senhas, PAN/CVV, comprovantes ou PII desnecessária; redaction automática. Auditoria append-only: ator, ação, entidade, before/after redigido, request_id, IP/UA quando permitido, timestamp. Painel de auditoria restrito a owner/admin, somente leitura.

## 10. Idempotência e webhooks

Operações críticas idempotentes. Webhooks validados por assinatura, janela de timestamp anti-replay, deduplicação via inbox, processamento assíncrono. Confirmação de pagamento nunca vem de redirecionamento de navegador isolado, só de evento/consulta server-side.

## 11. Pagamentos

PAN/CVV nunca armazenados; tokenização via SDK do gateway no cliente. Comprovantes tratados como upload sensível, acesso restrito a finance/owner/admin com auditoria.

## 12. Backups

Backups automáticos regulares, restauração testada periodicamente, migrações versionadas e auditáveis.

## 13. Fase 0

RLS desde o primeiro schema, nenhuma confiança em dado de cliente para tenant/papel/preço, telas estruturais com PhaseGate não expõem endpoints reais.
