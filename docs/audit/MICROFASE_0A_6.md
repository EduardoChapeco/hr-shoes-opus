MICROFASE: 0A.6

MÓDULO: Caixa e Comissões

CAPACIDADE: Executar lançamentos manuais no caixa ativo e efetuar o pagamento de comissões.

COMMIT-BASE: `f4b2a87`

COMMIT-FINAL: `93f03c6`

### BASELINE

ESTADO ANTERIOR:
- As rotas `admin.caixa.lancamentos.tsx` e `admin.comissoes.tsx` faziam asserções de erro redundantes no frontend: `if (res.status === "error") throw new Error(res.message);`.
- Como as ServerFns associadas (`addRegisterEntry` e `payCommission`) lançavam exceções em falhas de banco ou negócio e retornavam `{ status: "success" }` síncrono, a tipagem estática quebrava no compilador `tsc` (erros TS2367 e TS2339).

### MAPA DO MÓDULO

ROTAS:
- `/admin/caixa/lancamentos` (`src/routes/admin.caixa.lancamentos.tsx`): Lançamento avulso / reforço de caixa físico.
- `/admin/comissoes` (`src/routes/admin.comissoes.tsx`): Tela de pagamentos de comissões.

UIS:
- Tela com tabela e diálogos para lançamentos no caixa ativo.
- Tabela de vendedores com botão "Pagar" comissão pendente.

ACTIONS:
- `addRegisterEntry` (POST)
- `payCommission` (POST)

TABELAS:
- `cash_register_entries`
- `commissions`

---

### PROBLEMAS ENCONTRADOS

CONTRATOS DIVERGENTES:
- Verificação redundante de `res.status === "error"` no frontend que causava falha na compilação do TypeScript, uma vez que as ServerFns agora lançam `Error` em caso de erro.

---

### PLANO DA MICROFASE

CORREÇÃO:
1. Refatorado `src/routes/admin.caixa.lancamentos.tsx` para eliminar a verificação redundante e preservar a chamada de mutation e rollback visual.
2. Refatorado `src/routes/admin.comissoes.tsx` para eliminar a verificação redundante e permitir a invalidação da rota ao finalizar a action.

---

### TESTES

CONTRATO:
- Validado estaticamente via typecheck.

RUNTIME:
- BLOQUEADO: RUNTIME NÃO EXECUTADO.
