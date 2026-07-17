MICROFASE: 0A.8

MÓDULO: Carrinho (Cart)

CAPACIDADE: Alterar quantidades dos itens no carrinho de compras do cliente.

COMMIT-BASE: `b257eec`

COMMIT-FINAL: `c7b777e`

### BASELINE

ESTADO ANTERIOR:

- A rota do storefront `_store.carrinho.tsx` realizava a asserção redundante `if (res.status === "error") throw new Error(res.message);` sobre o retorno de `updateCartItemQty`.
- Como a ServerFn `updateCartItemQty` retornava apenas `{ status: "success" }` em caso de sucesso e disparava exceções em caso de falhas, a tipagem estática quebrava no compilador `tsc` (erros TS2367 e TS2339).

### MAPA DO MÓDULO

ROTAS:

- `/_store/carrinho` (`src/routes/_store.carrinho.tsx`): Página de visualização e manipulação do carrinho de compras do usuário final.

UIS:

- Listagem dos itens do carrinho com botões de incremento/decremento e botão de remoção.

GATILHOS:

- Botões de incremento/decremento de quantidade (Plus/Minus): Acionam `updateCartItemQty`.

FORMS:

- Nenhum.

ACTIONS:

- `updateCartItemQty` (POST)

TABELAS:

- `carts`
- `cart_items`

---

### PROBLEMAS ENCONTRADOS

CONTRATOS DIVERGENTES:

- O frontend possuía asserções de erro redundantes no resultado de `updateCartItemQty` incompatíveis com a assinatura do método que lança exceções.

---

### PLANO DA MICROFASE

CORREÇÃO:

1. Refatorada a chamada `updateCartItemQty` na rota do carrinho `src/routes/_store.carrinho.tsx` para remover a checagem redundante, garantindo que o erro dispare o catch correspondente.

---

### TESTES

CONTRATO:

- Validado estaticamente via compilador `tsc`.

RUNTIME:

- BLOQUEADO: RUNTIME NÃO EXECUTADO.
