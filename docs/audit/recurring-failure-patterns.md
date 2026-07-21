# G4: Recurring Failure Patterns

Durante a evolução do sistema Hr Shoes, alguns comportamentos nocivos se repetiram silenciosamente.

## Padrão 1: Correção Míope no Client-Side via Casts ou Types
**Como se manifestou:** Quando um retorno do BFF não encaixava no componente UI, era mais rápido silenciar o TS no componente alterando o fallback para `[]` ou mascarando o tipo, em vez de arrumar a estrutura de dados raiz no servidor.
**Exemplo Real:** Em rotas como `admin.estoque.alertas.tsx`, os desenvolvedores mascaravam o erro de TS quando `{ status, message, data }` mudou para `[]`.

## Padrão 2: Sucesso Falso ("Toasts" sem validação)
**Como se manifestou:** Um formulário enviava uma Server Action, o componente já disparava um "Toast de Sucesso" e limpava o form, assumindo sucesso imediato, mas se a action falhasse por validação Zod ou RLS, a UI engolia o erro e o usuário acreditava ter salvo.
**Exemplo Real:** Formulários de cadastro rápido ou configurações isoladas sofreram dessa otimização excessivamente confiante.

## Padrão 3: Falta de Propagação (UI vs API)
**Como se manifestou:** Modificamos massivamente todos os arquivos `*.functions.ts` usando regex (`refactor_get.ts`) para arrancar `return { status: "ok", data }` transformando em `return data`. Isso atualizou a API, MAS falhou em atualizar os `route loaders` que liam essa API.
**Exemplo Real:** Mais de 50 rotas em `src/routes/` esperavam que o hook retornasse `.data`. Ao invés de propagar a refatoração, o sistema quebrou em runtime.

## Padrão 4: Duplicação Canônica em Interfaces Críticas
**Como se manifestou:** Criação de dois arquivos grandes e separados (`novo.tsx` vs `$id.tsx`) para o Produto. Consequência: todo avanço adicionado ao Módulo Produto (como upload inline) só funcionou em 1 dos arquivos.
**Exemplo Real:** A foto da variante não podia ser criada no momento do cadastro inicial porque o `novo.tsx` não evoluiu em sincronia.

## Padrão 5: Falhas Silenciosas em Componentes Dependentes
**Como se manifestou:** Componentes clientes que faziam destruturação perigosa: `const { data: lista } = await getLista();`. Quando `getLista()` lança um erro ou não retorna `data`, a interface estoura `Cannot destructure property 'data'`.
**Exemplo Real:** O compilador aponta dezenas de `Property 'data' does not exist on type...` neste exato momento nas telas de Admin (Equipe, Estoque, Cupons).
