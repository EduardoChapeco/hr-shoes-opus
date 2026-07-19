# Dossier — M-01: Identidade & Autenticação
> Documento de análise profunda do módulo. Gerado: 2026-07-19
> Fase atual: M0 (Inventário completo + criação do dossier)

---

## 1. Escopo do Módulo

O módulo M-01 cobre todas as capacidades relacionadas à identidade de usuários na plataforma:
autenticação, sessão, autorização por papel (RBAC), proteção de dados e jornadas de conta.

**Fronteiras:** Tudo que toca `auth.users`, `profiles`, `memberships`, sessão de cookie, tokens JWT, e controle de acesso por papel.

---

## 2. Arquivos Diretamente Relacionados

### Serviços (BFF / Server Functions)
| Arquivo | Responsabilidade |
|---------|----------------|
| `src/services/auth.functions.ts` | Login, registro, OAuth, logout, perfil, recuperação de senha |
| `src/lib/identity.ts` | `getServerIdentity()`, `assertStoreAccess()` |
| `src/lib/supabase-ssr.server.ts` | `getSSRClient()` para sessão SSR via cookie |
| `src/lib/supabase.ts` | `getServerClient()` para service role |

### Rotas UI
| Arquivo | Rota | Função |
|---------|------|--------|
| `src/routes/_store.entrar.tsx` | `/entrar` | Login |
| `src/routes/_store.cadastro.tsx` | `/cadastro` | Registro |
| `src/routes/_store.recuperar-senha.tsx` | `/recuperar-senha` | Solicitar reset |
| `src/routes/_store.redefinir-senha.tsx` | `/redefinir-senha` | Confirmar reset |
| `src/routes/_store.conta.perfil.tsx` | `/conta/perfil` | Dados pessoais da cliente |
| `src/routes/_store.conta.index.tsx` | `/conta` | Dashboard da conta |
| `src/routes/_store.conta.tsx` | `/conta/*` | Layout de área autenticada |
| `src/routes/api.auth.callback.ts` | `/api/auth/callback` | Callback OAuth |
| `src/routes/api.auth.confirm.ts` | `/api/auth/confirm` | Confirmação de email |

### Banco de Dados
| Migration | O que faz |
|-----------|-----------|
| `0010_auto_profile_trigger.sql` | Trigger que cria `profiles` ao criar `auth.users` |
| `0027_auth_refactor.sql` | Refatoração da tabela de memberships |
| `0030_auth_rls_fix.sql` | Correção de políticas RLS |
| `0035_drop_recursive_policies.sql` | Remove políticas recursivas perigosas |
| `0037_auth_rls_rewrite.sql` | Reescrita completa das RLS de auth |
| `0038_auth_cleanup.sql` | Limpeza e consolidação |

---

## 3. Matriz de Capacidades (Capability Matrix)

| ID | Capacidade | Implementação | Teste | UX | Segurança | Score |
|----|-----------|--------------|-------|----|-----------|----|
| M-01-C01 | Login email/senha | ✅ `signInWithPassword` | ✅ | ✅ | ✅ 429-handling | A |
| M-01-C02 | Registro email | ✅ `signUpWithPassword` | ✅ | ✅ | ✅ | A |
| M-01-C03 | OAuth Google | ✅ `signInWithOAuth` | — | ✅ | ✅ | B+ |
| M-01-C04 | Recuperação de senha | ✅ `resetPasswordForEmail` | — | ✅ | ✅ 429-handling | B+ |
| M-01-C05 | Redefinição de senha | ✅ `updatePasswordForUser` | — | ✅ | ✅ | B+ |
| M-01-C06 | Logout | ✅ `signOut` | — | ✅ | ✅ | A- |
| M-01-C07 | Sessão SSR (cookie) | ✅ `getSSRClient` | — | N/A | ✅ httpOnly | A |
| M-01-C08 | Auto-criação de perfil | ✅ DB trigger | — | N/A | ✅ | A |
| M-01-C09 | RBAC (roles + assertAccess) | ✅ `assertStoreAccess` | ✅ | N/A | ✅ | A |
| M-01-C10 | RLS deny-by-default | ✅ migrations | — | N/A | ✅ | A |
| M-01-C11 | Verificação de email | ✅ `/api/auth/confirm` | — | ✅ | ✅ | B+ |
| M-01-C12 | Onboarding admin | ✅ `onboarding.functions.ts` | ✅ | ✅ | ✅ | B+ |
| M-01-C13 | Merge carrinho guest | ✅ integrado no login | — | N/A | ✅ | B+ |
| M-01-C14 | Perfil de cliente editável | 🟡 apenas nome+phone | — | 🟡 muito básico | 🟡 | C |
| M-01-C15 | Rate limiting / brute-force | 🔴 AUSENTE | — | — | 🔴 risco P1 | F |
| M-01-C16 | LGPD: exclusão de conta | 🔴 AUSENTE | — | — | 🔴 compliance | F |
| M-01-C17 | LGPD: consentimentos DB | 🟡 rota existe, sem DB | — | 🟡 | 🟡 | D |
| M-01-C18 | 2FA/MFA | 🔴 AUSENTE | — | — | 🔴 | D |

**Legenda de Score:** A=excelente · B=bom · C=aceitável · D=inadequado · F=ausente/crítico

---

## 4. Lacunas Críticas (Causa Raiz)

### Lacuna #1 — Rate Limiting Ausente (M-01-C15)
**Causa raiz:** Supabase por si só retorna 429 em casos extremos (>50 tentativas), mas sem proteção personalizada por IP ou por usuário que permita configurar thresholds menores.
**Risco:** Conta de qualquer cliente pode sofrer ataque de brute-force de senha sem alertar o sistema.
**Mitigação possível:** Middleware no TanStack Start intercepta chamadas a `signInWithPassword` e aplica rate limiting por IP usando um contador em memória / Redis edge.

### Lacuna #2 — Direito ao Esquecimento LGPD (M-01-C16)
**Causa raiz:** Nunca foi implementado. A rota `/conta/privacidade` existe mas não tem nenhuma funcionalidade real de exclusão.
**Risco:** Não-conformidade com LGPD Art. 18 (direito à eliminação de dados). Exposição legal real.
**Ação necessária:** Server function `deleteMyAccount()` que: (1) anonimiza dados pessoais em `profiles`, (2) mantém dados financeiros conforme exigência fiscal, (3) revoga sessão.

### Lacuna #3 — Perfil de Cliente Muito Básico (M-01-C14)
**Causa raiz:** `updateProfile` só aceita `fullName` e `phone`. O schema `profiles` pode suportar mais campos (avatar, CPF, data de nascimento, preferências) mas nunca foram expostos.
**Impacto:** UX pobre; clientes não conseguem completar cadastro de forma que uma lojista de moda espera.

---

## 5. Jornadas do Usuário Mapeadas

### J1 — Cliente se cadastra pela primeira vez
1. `/cadastro` → `signUpWithPassword` → email de confirmação
2. Clic no link → `/api/auth/confirm` → redirect para `/conta` 
3. Área da conta carrega com boas-vindas
4. **Gap:** Sem onboarding guiado para completar perfil

### J2 — Cliente faz login
1. `/entrar` → `signInWithPassword` → merge de carrinho → `/conta`
2. **Gap:** Sem feedback sobre sessões ativas em outros dispositivos

### J3 — Cliente esquece a senha
1. `/recuperar-senha` → `resetPasswordForEmail` → email enviado
2. Link no email → `/redefinir-senha` → `updatePasswordForUser`
3. ✅ Completo

### J4 — Lojista faz login no admin
1. `/entrar` → `signInWithPassword` → verifica `role` → `/admin`
2. **Gap:** Sem 2FA para conta de lojista (risco elevado de comprometimento)

---

## 6. Próximas Microfases Priorizadas

| # | Microfase | Capacidades Atendidas | Estimativa | Prioridade |
|---|-----------|----------------------|-----------|-----------|
| **M-01-F1** | **Rate limiting de login** | M-01-C15 | 1 sessão | **P1 — CRÍTICO** |
| M-01-F2 | Exclusão de conta LGPD | M-01-C16 + M-01-C17 | 1 sessão | P1 — compliance |
| M-01-F3 | Perfil de cliente enriquecido | M-01-C14 | 1 sessão | P2 |
| M-01-F4 | Indicador de segurança (força de senha visual) | M-01-C02 | 0.5 sessão | P2 |

---

## 7. Gate M0 — Aceite

- [x] Dossier criado com matriz de capacidades completa
- [x] Lacunas identificadas com causa raiz documentada
- [x] Jornadas mapeadas com gaps explícitos
- [x] Microfases priorizadas e sequenciadas
- [ ] **Aguardando aprovação do usuário para executar M-01-F1**
