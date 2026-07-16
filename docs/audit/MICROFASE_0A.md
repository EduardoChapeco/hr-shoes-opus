MICROFASE: 0A

ESCOPO: `admin.caixa.index.tsx`, `closeRegister`, `addRegisterEntry`, `admin.marketing.gift-cards.tsx`, `createGiftCard`

COMMIT-BASE: Atual do working tree (após correções de import SSR)

ARQUIVOS ANALISADOS:
- `src/routes/admin.caixa.index.tsx`
- `src/services/cash.functions.ts`
- `src/routes/admin.marketing.gift-cards.tsx`
- `src/services/giftcard.functions.ts`
- `supabase/migrations/0034_cash_transactional_close.sql`

CONSUMIDORES LOCALIZADOS:
- `closeRegister`: `handleClose` em `admin.caixa.index.tsx`
- `addRegisterEntry`: `handleEntry` em `admin.caixa.index.tsx`
- `createGiftCard`: `handleCreate` em `admin.marketing.gift-cards.tsx`

DECLARAÇÕES ANTERIORES AUDITADAS:
- "As três regressões foram corrigidas." (Parcialmente verdade, o wrapper `.data` não estava mais lá, mas sobrou o falso tratamento de erro).
- "Não existem falhas silenciosas detectáveis." (Falso: Havia um bloqueio de exceção silencioso porque o frontend presumia `res.status === "error"`, enquanto `createServerFn` joga `Error`. O catch global estava capturando mas o dead code permanecia).

---

### CLOSE REGISTER

CONTRATO REAL:
O RPC `close_cash_register` retorna um objeto JSON e o ServerFn entrega:
`{ status: "success", expected: number, counted: number, discrepancy: boolean }`
Erros no RPC são lançados (`throw new Error`), acionando a rejeição do TanStack Start.

CONTRATO ESPERADO PELA UI:
A UI não estava mais usando `res.data.discrepancy` (isso já havia sido limpo), porém tentava tratar:
`if (res.status === "error") throw new Error(res.message);`

DIVERGÊNCIA:
O ServerFn nunca retorna `{ status: "error", message: string }`. Quando há falha, ele simplesmente joga um `Error` e o cliente entra no `catch`. A verificação `if (res.status === "error")` era morta/inválida.

REPRODUÇÃO:
NÃO REPRODUZIDO. (Ambiente sem browser em runtime com cookie ativo).

TESTE CRIADO:
BLOQUEADO: RUNTIME NÃO EXECUTADO (A execução manual do fluxo no frontend não foi acionada, as falhas foram encontradas por auditoria de contrato).

CORREÇÃO:
Removido o tratamento fantasma `if (res.status === "error")` de `handleClose` e `handleOpen` no arquivo `admin.caixa.index.tsx`.

RESULTADO:
A UI agora recebe os valores diretos `res.discrepancy` e delega os erros para o bloco `catch` corretamente capturado pelo TanStack.

RELOAD:
NÃO TESTADO.

STATUS: ALTERADO, MAS NÃO TESTADO

---

### ADD REGISTER ENTRY

SCHEMA REAL:
A ServerFn espera `{ registerId: string, amountCents: number, method: enum, description: string }`.

PAYLOAD DA UI:
O payload da form UI gera: `{ amount: string, type: "income" | "expense", description: string }`.

CAMPOS DESCARTADOS:
O campo `type` é um alias funcional usado apenas para inferir o sinal matemático de `amountCents` (+ ou -). A ServerFn recebe o valor correto.
O campo `entryType` apontado pelo baseline do Claude **não existe mais no payload de envio atual**.
O campo `method` é enviado hardcoded como `"cash"`.

DIVERGÊNCIA:
Zero. A lógica da UI abstrai perfeitamente a entrada de dinheiro físico no caixa, convertendo "income/expense" em positivo/negativo e forçando "cash" (já que sangria e fundo de troco são físicos).

CONSUMIDORES:
`handleEntry` em `admin.caixa.index.tsx`.

TESTE:
BLOQUEADO: RUNTIME NÃO EXECUTADO.

CORREÇÃO:
Nenhuma mudança adicional requerida. A regressão de `entryType` documentada pelo baseline de auditoria já não se encontrava no código.

STATUS: COMPROVADO LOCALMENTE (Análise estática dos schemas comprova equivalência)

---

### CREATE GIFT CARD

CONTRATO REAL:
O ServerFn retorna `{ status: "success", code: string }`. Erros são jogados.

CONTRATO ESPERADO PELA UI:
A UI estava chamando `res.code`, o que é correto (a quebra apontada pelo baseline `res.data?.code` já não estava presente). Porém, continha também a checagem fantasma de erro.

DIVERGÊNCIA:
`if (res.status === "error") throw new Error(res.message);` assumindo um formato de resposta errôneo.

REPRODUÇÃO:
NÃO REPRODUZIDO.

TESTE CRIADO:
BLOQUEADO: RUNTIME NÃO EXECUTADO.

CORREÇÃO:
Removida a verificação fantasma. O bloco `try...catch` agora manipula as rejeições nativas do RPC.

CÓDIGO PERSISTIDO:
NÃO TESTADO EM RUNTIME.

CÓDIGO EXIBIDO:
NÃO TESTADO EM RUNTIME.

RELOAD:
NÃO TESTADO.

STATUS: ALTERADO, MAS NÃO TESTADO

---

REGRESSÕES NOVAS ENCONTRADAS:
Nenhuma regressão nova encontrada nesta microfase.

CÓDIGO MORTO ENCONTRADO:
As validações `if (res.status === "error") throw new Error(res.message);` eram código morto / falsas proteções, pois em caso de erro as ServerFns disparam `catch` e não atingem essa linha.

DOCUMENTAÇÃO ATUALIZADA:
Nenhuma matriz alterada, registro focado na execução atual.

CAMINHOS DOS ARTIFACTS NO REPOSITÓRIO:
- `docs/audit/MICROFASE_0A.md`

TESTES EXECUTADOS:
Análise Estática, reconciliação de contrato UI -> Zod -> Supabase RPC.

TESTES NÃO EXECUTADOS:
Fluxos end-to-end em runtime, click-to-database.

COMMIT:
A ser feito na próxima etapa caso autorizado. Working tree limpo (exceto pelas 2 modificações mencionadas).

EVIDÊNCIAS CONTRÁRIAS:
Parte do que foi reportado no `PREVIOUS_PROMPT_COMPLIANCE_BASELINE.md` como quebras (ex: `res.data.discrepancy`, `entryType`) parece já não existir no branch principal, o que significa que o código foi mutado pós-baseline ou o baseline referenciou um commit paralelo/antigo.

STATUS FINAL DA MICROFASE:
MICROFASE 0A ALTERADA, MAS NÃO COMPROVADA
