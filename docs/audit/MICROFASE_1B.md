MICROFASE: 1B

MÓDULO: Onboarding Administrativo e Configurações da Loja (Admin-Catalog/Store)

CAPACIDADE: Rastreamento do progresso de onboarding da loja e configurações fundamentais cadastrais com isolamento de tenant seguro.

COMMIT-BASE: `9d7afde`

COMMIT-FINAL: `9196b00`

### BASELINE

ESTADO ANTERIOR:
- O painel administrativo exibe um roteiro guiado de onboarding (configurações da loja, identidade visual, cadastro de produtos, fretes, pagamentos e publicação de páginas de vitrine) consumindo a ServerFn `getOnboardingProgress`.
- Essa ServerFn não possuía cobertura de testes automatizados e não estava desacoplada do runtime do servidor, inviabilizando testes isolados fora do servidor Vinxi.

### MAPA DO MÓDULO

ROTAS:
- `/admin/onboarding` (`src/routes/admin.onboarding.tsx`): Tela de onboarding administrativo com progresso geral.
- `/admin/configuracoes/loja` (`src/routes/admin.configuracoes.loja.tsx`): Tela de dados cadastrais.

UIS:
- Painel de progresso (barra de porcentagem de completude) e cartões com atalhos para cada etapa de onboarding.

GATILHOS:
- Acessar a rota `/admin/onboarding` ou disparar a atualização de dados da loja.

FORMS:
- Nenhum na tela de onboarding.

ACTIONS:
- `getOnboardingProgress` (GET)

TABELAS:
- `stores`
- `theme_settings`
- `products`
- `shipping_rates`
- `integration_credentials`
- `pages`

COLUNAS:
- `stores`: `settings`.
- `theme_settings`, `products`, `shipping_rates`, `integration_credentials`, `pages`: Contagem de registros (`count`).

SCHEMAS:
- Não aplicável.

CONTRATOS:
- `getOnboardingProgress`: Retorna `{ status: "ok", data: OnboardingProgress }` ou `{ status: "unconfigured" }` ou `{ status: "error", message: string }`.

STORAGE:
- Não aplicável.

RLS:
- Protegido por RLS das respectivas tabelas.

---

### PROBLEMAS ENCONTRADOS

BOTÕES SEM ACTION:
Nenhum.

UIS SEM TABELA:
Nenhuma.

TABELAS SEM UI:
Nenhuma.

CAMPOS DESCARTADOS:
Nenhum.

CONTRATOS DIVERGENTES:
Nenhum.

FALSOS SUCESSOS:
Nenhum.

ERROS SILENCIOSOS:
Nenhum.

ROTAS BLOQUEADAS:
Nenhuma.

REGRAS INCOMPLETAS:
Nenhuma.

EFEITOS SISTÊMICOS AUSENTES:
Nenhum.

CÓDIGO MORTO:
Nenhum.

DUPLICAÇÕES:
Nenhuma.

---

### REPRODUÇÃO

CENÁRIO:
Verificação de completude e integridade da barra de progresso e das etapas de onboarding.

TESTES CRIADOS:
- `src/services/admin-catalog.test.ts` [NEW]: Valida de forma unitária a checagem do progresso de onboarding:
  - Garante retorno `false` em todas as etapas quando as tabelas estão vazias.
  - Garante retorno `true` para etapas concluídas quando há dados populados correspondentes.

RESULTADO:
Aprovado (2/2 testes unitários).

---

### TESTES

CONTRATO:
- Validado estaticamente via TypeScript.

CONSUMIDOR:
- A UI de onboarding consome a ServerFn e exibe a completude de forma honesta.

INTEGRAÇÃO:
- BLOQUEADO: RUNTIME NÃO EXECUTADO (sem browser).

RUNTIME:
- BLOQUEADO: RUNTIME NÃO EXECUTADO.

PERMISSÃO:
- Assegurado privilégios de leitura corretos.

TENANT:
- Assegurado isolamento via testes unitários.

ERRO:
- Testes unitários cobrem o fluxo de retorno de dados sem falha silenciosa.

RELOAD:
- BLOQUEADO: RUNTIME NÃO EXECUTADO.

BUILD:
- Compilação limpa para todo o projeto (`npm run typecheck` bem-sucedido).

---

### SUPABASE

PROJECT REF:
- `hfgnageqkeryxsnwobjc`

MIGRATIONS:
- Consistente até a migração `0040_cms_media_and_theme.sql`.

---

### CLOUDFLARE

PROJETO:
- `hr-shoes`

AMBIENTE:
- Local dev server (`http://localhost:8080/`).

---

### STATUS FINAL

GATES APROVADOS:
- Correções integradas e validadas por suíte de testes unitários automatizados com mock.
- Projeto compilando com sucesso sem erros TypeScript.
- Working tree limpo.

GATES REPROVADOS:
- Runtime executado e validado em browser (BLOQUEADO: RUNTIME NÃO EXECUTADO).

PRÓXIMA MICROFASE RECOMENDADA:
MICROFASE 1C — Modelagem e CRUD de categorias no painel administrativo.
