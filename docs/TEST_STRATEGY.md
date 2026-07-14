# Estratégia de Testes — Hr Shoes Commerce

Este documento define como o Hr Shoes Commerce é testado em cada camada e em cada fase do roadmap (`ROADMAP.md`). O objetivo é garantir confiabilidade em um sistema que lida com dinheiro, estoque e dados de clientes reais, sem depender de verificação manual como rede de segurança principal.

## 1. Princípios de teste

- Testes existem para proteger invariantes de negócio (dinheiro, estoque, permissões), não apenas para cobrir linhas de código.
- Nenhuma funcionalidade que toque dinheiro, estoque ou pedidos é considerada pronta sem teste automatizado correspondente.
- Testes de RLS são obrigatórios para toda tabela nova a partir da Fase 1: sempre um caso positivo (acesso permitido dentro do tenant/papel correto) e um caso negativo (acesso negado fora do tenant/papel).
- Acessibilidade não é opcional: componentes e páginas visadas ao público seguem WCAG 2.2 nível AA.
- Testes de UI validam comportamento e estado, não detalhes de implementação (evitar acoplamento a estrutura interna de componentes).

## 2. Camadas de teste

### 2.1 Testes unitários
Cobrem funções puras e lógica isolada: formatação de moeda (centavos → BRL), conversão de datas (UTC → America/Sao_Paulo), utilitários do registro de rotas, funções de validação de formulário, helpers de domínio.

### 2.2 Testes de integração
Cobrem a composição entre componentes de UI e a camada de serviços/BFF (com serviços mockados ou com um ambiente de teste do Lovable Cloud), validando fluxos como: navegação entre shells, carregamento de dados em uma tela, submissão de formulário completo.

### 2.3 Testes de contrato
Cobrem as funções de servidor/BFF e suas interfaces de entrada/saída conforme documentado em `API_CONTRACTS.md`. Garantem que uma mudança em uma função de servidor não quebre silenciosamente o formato esperado pela UI, e que erros sejam retornados em formato previsível.

### 2.4 Testes end-to-end (E2E)
Cobrem jornadas completas do usuário real, do navegador à persistência: por exemplo, do login da lojista até a publicação de um produto (Fase 1), ou do carrinho ao pedido pago (Fase 2). Rodam contra um ambiente próximo do real, minimizando mocks.

### 2.5 Testes de RLS (positivos e negativos)
A partir da Fase 1, toda tabela protegida por RLS tem testes específicos:
- **Positivo**: um usuário autenticado com o papel/tenant correto consegue ler/escrever exatamente o que deveria.
- **Negativo**: um usuário de outro tenant, sem autenticação, ou sem o papel exigido, é bloqueado — e o bloqueio é verificado tanto para leitura quanto para escrita.

Esses testes rodam preferencialmente contra o banco real (ou uma réplica de teste), não apenas contra mocks, pois RLS é uma garantia de banco de dados.

### 2.6 Testes de acessibilidade (WCAG 2.2 AA)
- Verificação automatizada (ex.: axe-core integrado aos testes de componente/E2E) para contraste de cor, rótulos de formulário, ordem de foco, uso de landmarks e atributos ARIA.
- Verificação manual pontual em fluxos críticos (checkout, navegação por teclado no admin) antes de cada fase ser considerada concluída.
- Componentes do catálogo (`COMPONENT_CATALOG.md`) devem declarar e testar seu comportamento de foco e leitura por leitor de tela nos estados de carregando, vazio e erro.

## 3. O que a Fase 0 testa, no mínimo

A Fase 0 não tem lógica de negócio para testar, mas tem fundações estruturais que já podem e devem ser verificadas automaticamente:

### 3.1 Integridade do registro de rotas
- Toda rota registrada em `ROUTES.md`/implementação resolve para um componente de página existente (nenhuma rota "fantasma").
- Não existem caminhos (`path`) duplicados no registro.
- Todo registro de rota possui metadados válidos: fase (`0` a `5`), permissão exigida (ou `public`), e status (`disponivel` ou `em_breve`).
- Rotas marcadas como `em_breve` não estão presentes na navegação pública, apenas, quando fizer sentido, como item desabilitado/informativo no admin.
- Não há duas rotas com o mesmo nome lógico apontando para componentes diferentes.

### 3.2 Componentes críticos
Para os componentes definidos como críticos em `COMPONENT_CATALOG.md` (ex.: cartão de produto, lista/tabela administrativa, estado vazio genérico, navegação admin, shell público), os testes mínimos da Fase 0 verificam:
- O componente renderiza corretamente no estado padrão.
- O componente renderiza corretamente no estado de carregamento (loading), sem quebrar layout.
- O componente renderiza corretamente no estado vazio, exibindo uma mensagem honesta e nunca dado fictício.
- O componente renderiza corretamente no estado de erro, com mensagem compreensível para a lojista/cliente.
- Quando aplicável, o componente renderiza corretamente no estado "sem permissão" e no estado "desabilitado"/"não configurado".

### 3.3 Navegação e shells
- Testes garantem que os três shells (público, cliente, admin) renderizam sem erro e contêm a navegação esperada.
- Testes garantem que a navegação do admin alterna corretamente entre sidebar (desktop) e bottom-nav (mobile) conforme breakpoint.

## 4. Ferramentas de teste

Alinhadas ao stack Lovable (TanStack Start + React + TypeScript + Tailwind v4 + shadcn/ui):

- **Vitest**: executor de testes unitários e de integração, compatível com o ambiente Vite/TanStack Start.
- **@testing-library/react**: testes de componente orientados a comportamento e acessibilidade (consultas por papel/label, não por detalhes de implementação).
- **@testing-library/user-event**: simulação realista de interação do usuário (clique, digitação, navegação por teclado).
- **axe-core (via jest-axe ou equivalente compatível com Vitest)**: verificação automatizada de acessibilidade em testes de componente.
- **Playwright**: testes end-to-end reais em navegador, incluindo fluxos completos e verificação de PWA a partir da Fase 3.
- **Testes de RLS**: executados via scripts que autenticam como diferentes papéis/tenants contra o ambiente de teste do Supabase/Lovable Cloud e verificam respostas permitidas/negadas.
- **TypeScript estrito + ESLint**: primeira linha de defesa, executados no pipeline de verificação antes de qualquer teste de comportamento.

Todos os testes automatizados devem poder rodar em CI sem intervenção manual, e um teste que falhe bloqueia o avanço de fase, conforme a regra de ouro em `ROADMAP.md`.

## 5. Camadas de teste futuras por fase

- **Fase 1**: testes de RLS completos para catálogo e identidade; testes de contrato para funções de servidor de catálogo; testes de integração de CRUD administrativo.
- **Fase 2**: testes de concorrência para reserva de estoque; testes E2E do fluxo de compra; testes de contrato para cálculo de frete/checkout; testes de RLS para pedidos e pagamentos.
- **Fase 3**: testes de acessibilidade ampliados para páginas geradas pelo builder; testes de sanitização de conteúdo (XSS); testes de PWA (manifest, service worker, funcionamento offline mínimo); testes de SEO (metadados renderizados corretamente).
- **Fase 4**: testes de integração para trocas, caixa e comissão; testes de RLS para dados financeiros sensíveis; testes de auditoria (toda alteração financeira gera registro rastreável).
- **Fase 5**: testes de contrato com mocks de integrações externas (Meta, Google, logística); testes E2E de recuperação de carrinho; testes de conformidade LGPD para uso de dados de clientes em integrações externas.

## 6. Critério de qualidade mínimo para considerar uma fase testada

Uma fase não é considerada testada apenas por ter testes escritos: os testes precisam:
1. Rodar de forma determinística (sem flakiness tolerada silenciosamente).
2. Cobrir explicitamente os critérios de aceite listados para a fase em `ROADMAP.md`.
3. Incluir pelo menos um caso negativo para cada regra de segurança/permissão relevante à fase.
4. Estar documentados o suficiente para que outra pessoa entenda o que está sendo verificado sem ler linha a linha o código de produção.
