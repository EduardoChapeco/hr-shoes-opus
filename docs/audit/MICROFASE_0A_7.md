MICROFASE: 0A.7

MÓDULO: Clientes e Trocas (CRM/Exchanges)

CAPACIDADE: Visualizar listagem de clientes, detalhar CRM/LTV e processar solicitações de trocas e devoluções.

COMMIT-BASE: `adb628e`

COMMIT-FINAL: `b2f749c`

### BASELINE

ESTADO ANTERIOR:

- A rota `admin.clientes.index.tsx` assumia erroneamente que `listCustomers()` retornava um envelope com `{ status, data }`, quando na verdade retornava diretamente a lista de clientes, causando erros TS2339 no build.
- As rotas `admin.clientes.$id.tsx` e `admin.pedidos.trocas.tsx` faziam a asserção redundante `if (res.status === "error") throw new Error(res.message);` sobre retornos de mutations que apenas retornavam `{ status: "success" }` ou disparavam exceções (erros TS2367 e TS2339).

### MAPA DO MÓDULO

ROTAS:

- `/admin/clientes` (`src/routes/admin.clientes.index.tsx`): Lista de clientes e estatísticas rápidas.
- `/admin/clientes/$id` (`src/routes/admin.clientes.$id.tsx`): 360 do cliente (CRM, LTV e histórico).
- `/admin/pedidos/trocas` (`src/routes/admin.pedidos.trocas.tsx`): Gerenciamento de trocas.

UIS:

- Tabelas de listagem, painéis de CRM para edição de notas e tags.

ACTIONS:

- `listCustomers` (GET)
- `updateCustomerCrm` (POST)
- `listExchanges` (GET)
- `updateExchangeStatus` (POST)

TABELAS:

- `profiles`
- `customers_crm`
- `orders`
- `exchanges`

---

### PROBLEMAS ENCONTRADOS

CONTRATOS DIVERGENTES:

- O frontend possuía asserções de erro e desempacotamento redundante de status/data incompatíveis com as ServerFns declaradas.

---

### PLANO DA MICROFASE

CORREÇÃO:

1. Refatorado o loader da listagem de clientes em `src/routes/admin.clientes.index.tsx` para retornar a lista diretamente sem wrappers incorretos.
2. Refatorada a mutation de CRM em `src/routes/admin.clientes.$id.tsx` para remover o check de status inexistente.
3. Refatorada a mutation de atualização de trocas em `src/routes/admin.pedidos.trocas.tsx` para remover o check de status inexistente.

---

### TESTES

CONTRATO:

- Validado estaticamente via compilador `tsc`.

RUNTIME:

- BLOQUEADO: RUNTIME NÃO EXECUTADO.
