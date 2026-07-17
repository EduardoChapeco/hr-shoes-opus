MICROFASE: 0A.4

MÓDULO: Configurações Fundamentais da Loja

CAPACIDADE: Visualizar e atualizar políticas e metadados SEO da loja com isolamento de tenant.

COMMIT-BASE: `0863f46`

COMMIT-FINAL: `53eaa60`

### BASELINE

ESTADO ANTERIOR:

- As server functions `getPolicies`, `savePolicies`, `getStoreSeo` e `saveStoreSeo` estavam definidas localmente nos arquivos de rotas `src/routes/admin.configuracoes.politicas.tsx` e `src/routes/admin.configuracoes.seo.tsx`.
- Ambas as consultas usavam `.limit(1).single()` ignorando o tenant `store_id` do perfil do usuário logado.
- Ambas as mutações na UI testavam falsos retornos de erro (`res.status === "error"`).

### MAPA DO MÓDULO

ROTAS:

- `/admin/configuracoes/politicas` (`src/routes/admin.configuracoes.politicas.tsx`): Configurações de políticas (privacidade, termos de uso, devoluções).
- `/admin/configuracoes/seo` (`src/routes/admin.configuracoes.seo.tsx`): Configurações de SEO (título, descrição, palavras-chave).

UIS:

- Painéis de configurações com editores em textarea e formulários.

ACTIONS:

- `getPolicies` (GET)
- `savePolicies` (POST)
- `getStoreSeo` (GET)
- `saveStoreSeo` (POST)

TABELAS:

- `stores`

COLUNAS AFETADAS:

- `policies` (JSON)
- `seo_title` (text)
- `seo_description` (text)
- `seo_keywords` (text)

---

### PROBLEMAS ENCONTRADOS

ERROS SILENCIOSOS / DIVERGÊNCIA DE TENANT:
Leituras e escritas que ignoravam o `store_id` canônico da identidade ativa do staff.

CONTRATOS DIVERGENTES:
Checagem `res.status === "error"` no frontend que gerava erros de compilação do TypeScript, pois as ServerFns agora lançam `Error` em falha.

---

### PLANO DA MICROFASE

CORREÇÃO:

1. Movidas as lógicas de leitura/escrita de Políticas e SEO para o arquivo centralizado de serviços `src/services/store.functions.ts`.
2. Desacoplados os respectivos handlers para permitir testes unitários sem start runtime.
3. Adicionado suporte a testes unitários completos em `src/services/store.test.ts` cobrindo as novas lógicas de negócio.
4. Refatorados os arquivos de rotas `admin.configuracoes.politicas.tsx` e `admin.configuracoes.seo.tsx` para importar os novos serviços, eliminando código duplicado e corrigindo a tipagem dos retornos das promises.

---

### TESTES

CONTRATO:

- Testes unitários no arquivo `src/services/store.test.ts` mockando Supabase e Identity.
- Comando: `npx vitest run src/services/store.test.ts`
- Resultado: 7 testes aprovados.

RUNTIME:

- BLOQUEADO: RUNTIME NÃO EXECUTADO (sem browser).
