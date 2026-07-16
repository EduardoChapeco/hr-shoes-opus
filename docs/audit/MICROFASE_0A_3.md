MICROFASE: 0A.3

MÓDULO: Configurações Fundamentais da Loja

CAPACIDADE: Visualizar e atualizar dados cadastrais da loja com isolamento de tenant.

COMMIT-BASE: `502b03e` (on branch `audit-0a-2`)

### BASELINE

ESTADO ANTERIOR:
As server functions `getStoreSettings` e `saveStoreSettings` estavam declaradas localmente no arquivo de rotas `src/routes/admin.configuracoes.loja.tsx`.
- `getStoreSettings` buscava os dados da loja via `.limit(1).single()`, ignorando completamente o tenant (`store_id`) do perfil do usuário autenticado. Isso gerava um vazamento potencial em ambiente multi-tenant.
- `saveStoreSettings` continha lógica de tratamento de retorno fantasma (`if (res.status === "error") throw new Error(...)`).

### MAPA DO MÓDULO

ROTAS:
- `/admin/configuracoes/loja` (`src/routes/admin.configuracoes.loja.tsx`): Rota administrativa de configuração de dados da loja.

UIS:
- Tela com formulários estruturados por fieldsets (Informações Gerais, Contato, Endereço).

ACTIONS:
- `getStoreSettings` (GET): Carrega os dados cadastrais da loja atual do usuário.
- `saveStoreSettings` (POST): Salva as alterações enviadas pela UI.

TABELAS:
- `stores`: Tabela que armazena os dados cadastrais da loja.

SCHEMAS:
- Zod schema `saveStoreSettingsSchema` validando os campos de inputs.

CONTRATOS:
- `getStoreSettings`: Retorna `{ status: "ok", data: Store }` ou lança exceção.
- `saveStoreSettings`: Retorna `{ status: "success" }` ou lança exceção.

---

### PROBLEMAS ENCONTRADOS

CONTRATOS DIVERGENTES:
A ServerFn de salvamento retornava `{ status: "error", message }` no bloco `catch`, mas a UI estava tratando erro de promise rejeitada ao mesmo tempo em que buscava por `status === "error"` no retorno de sucesso.

ERROS SILENCIOSOS:
O loader de configurações da loja (`getStoreSettings`) utilizava `.limit(1).single()` sem filtrar pelo `store_id` do usuário logado.

---

### PLANO DA MICROFASE

CAUSA RAIZ:
Server functions declaradas diretamente no arquivo de rotas com brecha de isolamento e padrão de erro inconsistente.

CORREÇÃO:
1. Criado `src/services/store.functions.ts` [NEW] para isolar e centralizar a lógica.
2. Desacoplados os handlers da infraestrutura do TanStack Start (`getStoreSettingsHandler` e `saveStoreSettingsHandler`) para viabilizar testes unitários em Node sem AsyncLocalStorage.
3. Garantido filtro estrito por `identity.store_id` em ambas as funções.
4. Criado `src/services/store.test.ts` [NEW] contendo testes automatizados da lógica de negócio.
5. Ajustado `src/routes/admin.configuracoes.loja.tsx` [MODIFY] para consumir as novas funções e tratar exceções de forma canônica.

---

### TESTES

CONTRATO:
- Testes unitários rodando sob Vitest cobrindo sucesso e erro do loader e mutator.
- Comando: `npx vitest run src/services/store.test.ts`
- Resultado: 4 testes aprovados.

RUNTIME:
- BLOQUEADO: RUNTIME NÃO EXECUTADO (sem browser).

---

### GIT

COMMIT FINAL: A ser gerado nesta itação.

WORKING TREE:
- `src/services/store.functions.ts` [NEW]
- `src/services/store.test.ts` [NEW]
- `src/routes/admin.configuracoes.loja.tsx` [MODIFY]
- `docs/audit/MICROFASE_0A_3.md` [NEW]
