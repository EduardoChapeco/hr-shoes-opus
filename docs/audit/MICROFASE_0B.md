MICROFASE: 0B

ESCOPO: `_store.conta.enderecos.tsx`, `_store.conta.perfil.tsx`, `updateProfile`, `addCustomerAddress`, `deleteCustomerAddress`, `setDefaultAddress`.

COMMIT-BASE: Atual do working tree (após Microfase 0A)

ARQUIVOS ANALISADOS:
- `src/routes/_store.conta.enderecos.tsx`
- `src/routes/_store.conta.perfil.tsx`
- `src/services/auth.functions.ts`
- `src/services/customer.functions.ts`

CONSUMIDORES LOCALIZADOS:
- `updateProfile`: `handleSubmit` em `_store.conta.perfil.tsx`
- `addCustomerAddress`: `handleSubmit` em `_store.conta.enderecos.tsx`
- `deleteCustomerAddress`: `handleDelete` em `_store.conta.enderecos.tsx`
- `setDefaultAddress`: `handleSetDefault` em `_store.conta.enderecos.tsx`

DECLARAÇÕES ANTERIORES AUDITADAS:
- **"Falsos sucessos restantes nas funções de perfil e endereço devido a await sem verificação de retorno na UI"**: Refutado parcialmente. A acusação de falso sucesso da UI não confere, pois `createServerFn` faz o throw de erros internamente quando a Promise do handler rejeita. A UI estava capturando a exceção corretamente. No entanto, as ServerFns correspondentes continham **silenciamento de falhas de banco de dados** (esquecimento do `throwOnError`), gerando o falso sucesso real na origem do back-end.

---

### UPDATE PROFILE (Perfil)

CONTRATO REAL:
A `updateProfile` atualiza os dados na tabela de autenticação (`supabase.auth.updateUser`) e, logo em seguida, realiza um `.update()` na tabela canônica `profiles` usando os mesmos dados. O erro do Auth era verificado, mas o erro do banco de dados era completamente ignorado.

CONTRATO ESPERADO PELA UI:
A UI executa `try { await updateProfile(); toast.success() } catch (e) { toast.error() }`. Portanto, ela espera que a Promise apenas resolva caso ambas atualizações (auth e banco) sejam bem-sucedidas.

DIVERGÊNCIA:
Se o update na tabela `profiles` falhasse (devido a RLS, triggers ou tipo de dado), a função ServerFn ignorava a falha (`const { error }` nunca era desestruturado ou validado) e retornava `{ status: "success" }` de forma silenciosa e falsa.

REPRODUÇÃO:
NÃO REPRODUZIDO.

TESTE CRIADO:
BLOQUEADO: RUNTIME NÃO EXECUTADO.

CORREÇÃO:
Em `src/services/auth.functions.ts`: adicionada a checagem `const { error: dbError } = await supabase.from("profiles").update(...)` seguida de `if (dbError) throw new Error(dbError.message)`.

RESULTADO:
Qualquer falha de persistência na entidade de banco `profiles` agora abortará o sucesso e cairá no `catch` nativo do TanStack, acionando o toast de erro na UI.

RELOAD:
NÃO TESTADO.

STATUS: ALTERADO, MAS NÃO TESTADO

---

### ADDRESSES (Endereços)

CONTRATO REAL:
As ServerFns `addCustomerAddress` e `deleteCustomerAddress` estavam corretas: operavam a tabela e possuíam as checagens estritas `if (error) throw new Error(error.message)`. Portanto, elas NUNCA retornavam sucesso cego. No entanto, `setDefaultAddress` fazia um update de desmarcação (unset `is_default=false` em todos os outros endereços do usuário) sem verificar o erro, seguido do update do endereço alvo (`is_default=true`) que verificava erro.

CONTRATO ESPERADO PELA UI:
Idêntico ao do perfil. O Frontend usa blocos `try/catch` e espera erro cascateado se a operação lógica de banco não for completada perfeitamente.

DIVERGÊNCIA:
A primeira query de `setDefaultAddress` podia falhar silenciosamente (ex: erro de rede temporal), enquanto a segunda passava, causando um estado de banco inconsistente com múltiplos endereços como "Padrão" (is_default=true simultâneo).

CONSUMIDORES:
`_store.conta.enderecos.tsx`

TESTE:
BLOQUEADO: RUNTIME NÃO EXECUTADO.

CORREÇÃO:
Em `src/services/customer.functions.ts`: Adicionada verificação rigorosa `const { error: unsetError }` na query de reset de flag default.

STATUS: ALTERADO, MAS NÃO TESTADO

---

REGRESSÕES NOVAS ENCONTRADAS:
Nenhuma regressão nova encontrada nesta microfase. 

CÓDIGO MORTO ENCONTRADO:
Não aplicável para este escopo.

DOCUMENTAÇÃO ATUALIZADA:
Nenhuma matriz alterada, registro focado na execução atual.

CAMINHOS DOS ARTIFACTS NO REPOSITÓRIO:
- `docs/audit/MICROFASE_0B.md`

TESTES EXECUTADOS:
0 (Reconciliação estática de retornos do Supabase Postgrest-JS).

TESTES NÃO EXECUTADOS:
Testes reais e end-to-end (`RUNTIME NÃO EXECUTADO`).

COMMIT:
A ser feito. Working tree com duas correções essenciais.

EVIDÊNCIAS CONTRÁRIAS:
O relatório de baseline do Claude mirou corretamente a existência do sintoma (os usuários experimentavam Falsos Sucessos), mas apontou erroneamente o "fato gerador" na UI. A UI estava correta sob o prisma isomorfo. A origem orgânica do erro silencioso era o descaso com as reações estritas das ServerFns na hora de transacionar o Supabase.

STATUS FINAL DA MICROFASE:
MICROFASE 0B ALTERADA, MAS NÃO COMPROVADA
