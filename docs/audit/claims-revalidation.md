# Auditoria Forense — Revalidação de Alegações (`docs/audit/claims-revalidation.md`)

Este documento confronta alegações de funcionalidades dadas como "concluídas" ou "seguras" com a realidade prática do código e testes automatizados.

## 1. Módulo: Caixa e Controle de Fluxo Comercial
- **Alegação Anterior**: O fechamento de caixa e a agregação monetária estão perfeitamente implementados e integrados às transações contábeis.
- **Evidência Favorável**: O RPC `close_cash_register` (migration `0034`) realiza fechamento no lado do servidor. Os testes de parsing BRL em `src/lib/cash.test.ts` passam com sucesso.
- **Evidência Contrária**: Não existe PDV funcional implementado. A venda efetuada no cliente ou caixa físico não possui integração real com estoque, pedidos ou comissões de vendedoras. O Caixa opera de forma "isolada", registrando apenas aberturas e fechamentos manuais.
- **Status**: **ARQUITETURALMENTE FRÁGIL / SISTEMICAMENTE INCOMPLETO**

## 2. Módulo: Builder Platform e DOM Tree
- **Alegação Anterior**: Transição canônica realizada. Rotas públicas migradas de switch/case rígido para `ExperienceRenderer` com hidratação dinâmica no BFF.
- **Evidência Favorável**: Rotas `_store.paginas.$slug.tsx` e `_store.vendedora.$slug.tsx` foram refatoradas para consumir `ExperienceRenderer`. A hidratação de bindings foi inserida em `builder.functions.ts`.
- **Evidência Contrária**: Não há testes automatizados simulando a resolução de árvore DOM recursiva quebrada ou sob concorrência. Não há testes de RLS cobrindo se um usuário administrador de outra organização consegue alterar `experience_nodes`.
- **Status**: **PARCIAL**

## 3. Módulo: Fretes, Zonas e Taxas
- **Alegação Anterior**: Gerenciamento de zonas de frete completo com validação de CEP e eliminação de rotas duplicadas.
- **Evidência Favorável**: A rota `/admin/fretes` redireciona para `/admin/fretes/tabelas`. A suíte de testes `src/services/shipping.test.ts` possui 9 testes aprovados de cotação e exclusão em cascata.
- **Evidência Contrária**: O simulador de cotação de frete público na página de produto não realiza conexões com transportadoras reais (Melhor Envio/Correios). O cálculo depende apenas do banco local de taxas fixas (`shipping_rates`).
- **Status**: **FUNCIONA MAS NA CAMADA ERRADA** (Cálculo estático local sem contingência de APIs externas).

## 4. Módulo: Gestão de Equipe e RBAC/RLS
- **Alegação Anterior**: Checagens de cargo e promoção de colaboradores cobertos de forma estrita contra ataques.
- **Evidência Favorável**: Testes unitários em `src/services/admin-team.test.ts` cobrem proteção contra auto-rebaixamento do `owner` e propagação de erros.
- **Evidência Contrária**: A RLS da tabela `profiles` não impede que um usuário com cargo menor execute ações privilegiadas se o endpoint server function (BFF) estiver vulnerável a desvios (Spoofing). O BFF depende de checagem do context user metadata, que precisa ser exaustivamente validado em runtime.
- **Status**: **COMPROVADO** (Para a camada unitária/BFF, segurança robusta verificada).
