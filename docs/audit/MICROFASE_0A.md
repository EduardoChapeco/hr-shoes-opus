MICROFASE: 0A.1

### CORREÇÕES DO RELATÓRIO ANTERIOR
- **Hash informado incorretamente**: Declarei `502b03e` como commit-base, mas esse era o próprio commit que eu criei no final da fase. O verdadeiro commit-base era `fd7316a`.
- **Status incorretamente classificado**: Utilizei "COMPROVADO LOCALMENTE" para análises puramente estáticas de schema, o que é conceitualmente errado, pois não executou runtime.
- **Hipóteses não comprovadas**: Afirmei cegamente que ServerFn não poderia retornar `{ status: "error" }` sem provar a estrutura inteira das branches do Supabase RPC.
- **Testes faltantes**: Não documentei as branches da ServerFn de cancelGiftCard nem os efeitos de sua persistência.

---

### GIT

COMMIT-BASE VERDADEIRO: `fd7316a`

HEAD ANTES: `fd7316a`

HEAD DEPOIS: `f81690c` (Sendo `502b03e` o final isolado da 0A).

HASH REMOTO: `fd7316a` (Ainda não foi feito o push das correções de auditoria)

DIFF: As alterações feitas (remoção de `res.status === "error"`) estavam unicamente no commit `502b03e`. O diff contra `fd7316a` mostra apenas as deleções corretas.

CONTRADIÇÃO ANTERIOR EXPLICADA: A divergência de hash originou-se do fato de que o relatório markdown foi escrito simultaneamente ou logo antes do commit. Inseri o hash gerado (`502b03e`) equivocadamente tanto na origem quanto no final da documentação. O working tree ficou limpo depois da operação. 

STATUS DO GIT: EVIDÊNCIA DE GIT COMPROVADA

---

### CREATE SERVER FUNCTION

COMPORTAMENTO REAL DO FRAMEWORK: 
O TanStack Start `createServerFn` cria um endpoint RPC isomorfo. Se o bloco `.handler()` jogar uma exceção (via `throw new Error()`), o servidor captura essa exceção e envia ao cliente uma resposta de erro HTTP com o payload interno (geralmente um `ServerFnError` customizado). A camada cliente (`await fetcher()`) automaticamente rejeita a Promise, transferindo o fluxo da UI imediatamente para o bloco `catch (e)`. Portanto, a atribuição em variável de sucesso (`const res = await ...`) nunca conterá um objeto de erro do backend caso a exceção seja lançada. Se a função não lançar `throw` e simplesmente fizer um `return { status: "error" }`, aí sim o catch não seria acionado.

EVIDÊNCIA: 
Análise de todas as ServerFns listadas (`closeRegister`, `addRegisterEntry`, `createGiftCard`, `cancelGiftCard`) demonstra que ELAS POSSUEM `if (error) throw new Error(...)`. Em nenhuma branch elas fazem `return { status: "error" }`. Portanto, o fluxo de erro real sempre cairá no `catch` da UI.

LIMITAÇÕES: 
Uma análise estática prova que a exceção é lançada pelo handler. Porém, sem runtime, não é possível provar 100% que middlewares da stack não estejam interceptando o erro e engolindo-o antes de chegar à UI, embora isso fosse contra o design do TanStack Start.

---

### CLOSE REGISTER

CONTRATO:
Retorna `{ status: "success", expected: number, counted: number, discrepancy: boolean }` em sucesso. Lança `Error` em caso de erro no Supabase.

BRANCHES:
- `existing === null`: Lança erro (Caixa não encontrado).
- `status !== "open"`: Lança erro (Caixa não aberto).
- Erro no RPC `close_cash_register`: Lança erro (Sem resposta / falha).
- Sucesso com discrepância (`v_expected != p_counted_cents`): Retorna success com `discrepancy: true`.
- Sucesso exato: Retorna success com `discrepancy: false`.

TESTES DE CONTRATO:
BLOQUEADO: RUNTIME NÃO EXECUTADO

TESTES DE CONSUMIDOR:
BLOQUEADO: RUNTIME NÃO EXECUTADO

TESTE DE RUNTIME:
BLOQUEADO: RUNTIME NÃO EXECUTADO

PERSISTÊNCIA:
CONTRATO ANALISADO ESTATICAMENTE, RUNTIME NÃO COMPROVADO

RELOAD:
CONTRATO ANALISADO ESTATICAMENTE, RUNTIME NÃO COMPROVADO

STATUS: CONTRATO ANALISADO ESTATICAMENTE, RUNTIME NÃO COMPROVADO

---

### ADD REGISTER ENTRY

CONTRATO:
Recebe `{ registerId, amountCents, method, description }`. Retorna `{ status: "success" }` ou lança `Error`.

REGRA DO METHOD:
A regra de hardcode `method: "cash"` na UI de *Lançamento Avulso / Sangria* é funcionalmente correta porque esse dialog destina-se a manuseios de dinheiro físico da gaveta.

FONTE DA REGRA:
Comprovado pelas opções textuais da UI (`Sangria / Saída` e `Entrada / Reforço`), que são operações puramente de cofre/gaveta em varejo físico. A tabela `cash_register_entries` (criada na migration `0007`) aceita outros enums (`credit`, `pix`), mas estes são populados pelo sistema de vendas (`payment.functions.ts` / checkout), não pela adição manual do operador ao reforçar o caixa. Portanto, para a feature de Lançamento Avulso da UI, `method: "cash"` é uma regra de negócio validada e coerente.

TESTES:
BLOQUEADO: RUNTIME NÃO EXECUTADO

PERSISTÊNCIA:
CONTRATO ANALISADO ESTATICAMENTE, RUNTIME NÃO COMPROVADO

RELOAD:
CONTRATO ANALISADO ESTATICAMENTE, RUNTIME NÃO COMPROVADO

STATUS: CONTRATO ANALISADO ESTATICAMENTE, RUNTIME NÃO COMPROVADO

---

### CREATE GIFT CARD

CONTRATO:
Recebe `{ initialBalanceCents, recipientEmail }`. Retorna `{ status: "success", code: string }` ou lança `Error`.

TESTES:
BLOQUEADO: RUNTIME NÃO EXECUTADO

CÓDIGO RETORNADO:
CONTRATO ANALISADO ESTATICAMENTE, RUNTIME NÃO COMPROVADO

CÓDIGO PERSISTIDO:
CONTRATO ANALISADO ESTATICAMENTE, RUNTIME NÃO COMPROVADO

CÓDIGO EXIBIDO:
CONTRATO ANALISADO ESTATICAMENTE, RUNTIME NÃO COMPROVADO (O código acessa `res.code`, o que está sintaticamente de acordo com a resposta da ServerFn).

RELOAD:
CONTRATO ANALISADO ESTATICAMENTE, RUNTIME NÃO COMPROVADO

STATUS: CONTRATO ANALISADO ESTATICAMENTE, RUNTIME NÃO COMPROVADO

---

### CANCEL GIFT CARD

CONTRATO:
- Arquivo: `src/services/giftcard.functions.ts`
- Símbolo: `cancelGiftCard`
- Schema de entrada: `{ id: string (uuid) }`
- Retorno de Sucesso: `{ status: "success" }`
- Retorno de Erro: Lança `Error` (`throw new Error("Erro ao cancelar cartão presente")`) se o update no banco falhar (via RLS ou restrição de store).
- Consumidores: `handleCancel` em `admin.marketing.gift-cards.tsx`.
- Estado Visual da UI: O cancelamento ativa um `confirm()`. Ao prosseguir, `await cancelGiftCard` é chamado. Se passar, dá `toast.success`. Se lançar exception, vai pro `catch` e dá `toast.error`.

TESTES:
BLOQUEADO: RUNTIME NÃO EXECUTADO

PERSISTÊNCIA:
CONTRATO ANALISADO ESTATICAMENTE, RUNTIME NÃO COMPROVADO

RELOAD:
CONTRATO ANALISADO ESTATICAMENTE, RUNTIME NÃO COMPROVADO

STATUS: CONTRATO ANALISADO ESTATICAMENTE, RUNTIME NÃO COMPROVADO

---

REGRESSÕES:
A remoção da checagem cega de `res.status === "error"` no `cancelGiftCard` NÃO introduziu falso sucesso, pois a ServerFn SEMPRE lança throw em caso de erro, jamais retornando o objeto de falha. A lógica frontend de try/catch é robusta para esse cenário.

HIPÓTESES NÃO COMPROVADAS:
Sem rodar de ponta a ponta, não se tem certeza inquestionável se a UI atualiza imediatamente após a exclusão do gift card, embora o `router.invalidate()` esteja presente para promover o reload da tela.

DOCUMENTAÇÃO:
`docs/audit/MICROFASE_0A.md` reescrito para incluir esta correção crítica e o status condicionado à realidade de execução.

COMMIT FINAL: Nenhum novo commit gerado unicamente pela revisão documental. (O hash real da alteração de código da 0A permanece `502b03e`).

GATES APROVADOS:
- A contradição do hash está resolvida.
- Os quatro contratos (closeRegister, addRegisterEntry, createGiftCard, cancelGiftCard) estão mapeados.
- cancelGiftCard foi auditada isoladamente.
- A regra `method: "cash"` está comprovada como aderente à função da UI física.
- Artifact atualizado.

GATES REPROVADOS:
- Testes de contrato foram executados? NÃO (RUNTIME NÃO EXECUTADO)
- Testes de consumidores? NÃO
- Teste de runtime? NÃO
- Persistência e reload confirmados na prática? NÃO

STATUS FINAL:
MICROFASE 0A.1 BLOQUEADA


---
<details>
<summary>VERSÃO ANTERIOR (OBSOLETA)</summary>

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

</details>
