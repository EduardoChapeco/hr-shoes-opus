# Master Plan — Hr Shoes Commerce

Este documento normaliza o briefing completo do projeto Hr Shoes Commerce em um plano mestre. Ele é a porta de entrada para qualquer pessoa (humana ou agente) que for trabalhar no produto. Os detalhes técnicos aprofundados vivem em documentos irmãos, que são fontes únicas de verdade (single source of truth) para seus respectivos temas:

- `DESIGN.md` — design system, tokens visuais, tipografia, cores, espaçamentos, componentes visuais.
- `AGENTS.md` — regras de comportamento para agentes/IA que editam este repositório.
- `docs/ARCHITECTURE.md` — arquitetura de software, camadas, fluxo de dados, integração com Lovable Cloud/Supabase.
- `DOMAIN_MODEL.md` — entidades de domínio, relacionamentos, invariantes de negócio.
- `ROUTES.md` — registro de rotas públicas, de cliente e de admin, com metadados de fase/permissão.
- `SECURITY.md` — modelo de autenticação, autorização, RLS, segredos, superfícies de ataque.
- `API_CONTRACTS.md` — contratos de funções de servidor/BFF, formatos de entrada/saída, erros.
- `COMPONENT_CATALOG.md` — catálogo de componentes reutilizáveis e seus estados obrigatórios.

Este `MASTER_PLAN.md` não substitui nenhum desses documentos: ele apenas situa o leitor e aponta para onde ir. Em caso de dúvida sobre um tema específico, o documento especializado prevalece; este arquivo deve permanecer consistente com todos eles.

## 1. Visão e objetivo

Hr Shoes Commerce é uma plataforma de ecommerce/CMS/PWA mobile-first para a Hr Shoes, marca de moda/calçados femininos contemporâneos, operando no mercado brasileiro. O objetivo é oferecer uma loja pública rápida e bonita para clientes, e um painel administrativo simples o bastante para uma lojista leiga operar sozinha, sem depender de suporte técnico constante.

O produto é construído como "produto de verdade": nada de protótipos descartáveis, dados fictícios permanentes ou atalhos que quebrem a arquitetura no futuro. Cada tela e cada componente entregues na Fase 0 devem poder evoluir diretamente para as fases seguintes sem retrabalho estrutural.

A plataforma roda sobre TanStack Start + React + TypeScript estrito + Tailwind v4 + shadcn/ui, com persistência e autenticação em Lovable Cloud (Supabase), protegida por Row Level Security (RLS) e acessada exclusivamente por meio de uma camada de serviços/BFF/funções de servidor — nunca diretamente pelos componentes React.

## 2. Usuários-alvo

- **Lojista leiga**: dona/gestora da loja, sem formação técnica, que usa o painel admin no celular na maior parte do tempo. Precisa de fluxos guiados, mensagens claras, e nenhuma jargão técnico exposto.
- **Cliente final**: compradora/comprador que acessa a vitrine pública majoritariamente pelo celular, espera velocidade, clareza de preços em reais, e uma experiência de compra confiável mesmo quando alguns recursos ainda não estão disponíveis.

Ambos os públicos são prioritariamente mobile. Desktop é suportado, mas o desenho começa sempre pelo mobile.

## 3. Princípios centrais

1. **Mobile-first**: toda tela é desenhada primeiro para telas pequenas; o layout desktop é uma expansão, não o ponto de partida.
2. **Arquitetura de produto real**: sem gambiarras. Tipos estritos, camadas bem definidas, nomes de domínio consistentes entre banco, serviços e UI.
3. **Multi-tenant-ready desde o início**: todas as entidades relevantes carregam `organization_id` e `store_id`, mesmo operando hoje com uma única organização e uma única loja. Isso evita migração de dados dolorosa no futuro.
4. **Sem recursos fantasmas**: funcionalidades não implementadas não devem aparecer na interface. Se um botão, menu ou página existe, ele deve ser real e funcional. Proibido usar "Em breve".
5. **Servidor é dono de dinheiro, estoque e pedidos**: cálculos financeiros, de estoque e de pedidos são sempre feitos no servidor (funções de servidor/BFF). O cliente (browser) nunca calcula preço final, frete, desconto ou disponibilidade — apenas exibe o que o servidor retorna.
6. **Sem acesso direto ao Supabase a partir de componentes**: todo componente React consome dados por meio de serviços/funções de servidor. Nenhuma chamada `supabase.from(...)` dentro de componentes de UI.

## 4. Escopo da Fase 0

A Fase 0 é fundação, não funcionalidade de negócio. Entrega:

- Documentação canônica completa (todos os arquivos listados na seção de referências).
- Design system aplicado: tokens de cor, tipografia (Manrope para UI, Fraunces para editorial), espaçamento, elevação.
- Layout e navegação: shell público, shell de cliente autenticado e shell de admin.
- Registro de rotas tipado (`ROUTES.md` + implementação), cobrindo público, cliente e admin, com metadados de fase e permissão.
- Páginas públicas estruturais (home, e páginas institucionais mínimas), com seções reais conectáveis e estados vazios honestos quando não há conteúdo ainda.
- Shell de admin mobile-first, com navegação responsiva (sidebar em desktop, bottom-nav em mobile).
- Biblioteca de componentes reutilizáveis com todos os estados obrigatórios (carregando, vazio, erro, sem permissão, desabilitado, não configurado).
- Nenhum dado fictício de negócio (produtos, pedidos, clientes) — apenas estrutura e estados honestos.

## 5. Fases Sequenciais

Estes itens são desenvolvidos nas fases posteriores (ver `ROADMAP.md`):

- Banco de dados de domínio completo, autenticação real de usuários finais, RBAC e políticas de RLS de catálogo (Fase 1).
- Carrinho, checkout, frete, pedido, reserva de estoque e pagamentos (Fase 2).
- Construtor de CMS, stories, perfil público/link-in-bio, avaliações, FAQ, SEO avançado e PWA instalável (Fase 3).
- CRM, chat, trocas, caixa, comissão, cartões-presente, carnê (Fase 4).
- Integrações com Meta/Google, logística, recuperação de carrinho, Match Time, criador de posts (Fase 5).

Nenhum desses itens deve ganhar UI até estar 100% implementado no backend.

## 6. Decisões-chave e tradeoffs

- **Camada de serviços obrigatória**: adiciona uma indireção extra em troca de segurança, testabilidade e possibilidade de trocar de provedor de dados sem reescrever a UI.
- **Multi-tenant-ready desde o dia um**: custo inicial de modelagem um pouco maior, mas evita migração de esquema arriscada quando a Hr Shoes decidir operar mais de uma loja/organização.
- **Dinheiro sempre em centavos inteiros (BRL)**: elimina erros de ponto flutuante; toda formatação para exibição acontece na borda de apresentação, nunca no armazenamento ou no cálculo.
- **Datas em ISO UTC no armazenamento, exibidas em America/Sao_Paulo**: evita ambiguidade de fuso horário; a conversão de exibição é responsabilidade da camada de apresentação.
- **Proibição de 'Em breve'**: prioriza a entrega contínua. Módulos só entram em produção quando estiverem utilizáveis de ponta a ponta.
- **Sem cálculo financeiro/estoque no cliente**: sacrifica alguma responsividade percebida (pode exigir round-trip ao servidor) em troca de integridade de dados e segurança.

## 7. Glossário

- **Organização (organization)**: entidade jurídica/comercial dona de uma ou mais lojas. Hoje existe apenas uma.
- **Loja (store)**: unidade de venda dentro de uma organização, com seu próprio catálogo e configuração. Hoje existe apenas uma.
- **Lojista**: usuária administradora que opera a loja pelo painel admin.
- **Cliente**: usuária final que compra na vitrine pública.
- **BFF (Backend for Frontend)**: camada de funções de servidor que medeia todo acesso a dados, aplicando regras de negócio e segurança antes de expor dados à UI.
- **RLS (Row Level Security)**: mecanismo do Postgres/Supabase que restringe linhas visíveis/editáveis por política, por linha, no próprio banco.
- **Estado vazio honesto**: estado de UI que comunica claramente a ausência de dados reais, sem preencher com dados fictícios ou "de mentira".
- **Fase**: bloco de escopo do roadmap (Fase 0 a Fase 5), cada uma com critérios de aceite próprios (ver `ROADMAP.md`).
- **Registro de rotas (route registry)**: fonte única de verdade tipada sobre todas as rotas existentes, sua fase, permissão exigida e status.

## 8. Critérios de aceite da Fase 0

A Fase 0 é considerada concluída somente quando todos os itens abaixo forem verdadeiros:

1. O logo da Hr Shoes aparece corretamente em todos os contextos de shell (público, cliente, admin), em tamanhos e fundos variados, sem distorção.
2. Nenhuma referência de projeto, mockup ou material de briefing foi transformada em conteúdo real da loja (nenhum produto, preço ou texto fictício vazou para a vitrine).
3. A home pública está refinada em mobile e desktop, com seções reais e conectáveis (estrutura pronta para receber dados reais nas fases seguintes) e estados vazios honestos onde ainda não há conteúdo.
4. A navegação pública, de cliente e de admin não contém links quebrados; toda rota do registro resolve para uma página existente.
5. O shell de admin é mobile-first, com sidebar responsiva em desktop e bottom-nav em mobile, sem sobreposição ou quebra de layout.
6. Todos os documentos canônicos listados na seção de referências existem, estão preenchidos e não se contradizem entre si.
7. Os componentes reutilizáveis do catálogo implementam, quando aplicável, os estados: carregando, vazio, erro, sem permissão, desabilitado e não configurado.
8. Nenhum cálculo comercial (preço, frete, desconto, estoque) é feito no cliente.
9. Nenhuma chave secreta é exposta no código-fonte do cliente ou em variáveis públicas.
10. Nenhum componente React chama tabelas do Supabase diretamente; todo acesso passa pela camada de serviços/BFF.
11. TypeScript, lint e build passam sem erros.
12. Existem testes mínimos automatizados cobrindo a integridade do registro de rotas e o comportamento dos componentes críticos (ver `TEST_STRATEGY.md`).

## 9. Como este documento se relaciona com os demais

Este `MASTER_PLAN.md` é o ponto de partida narrativo. Para trabalho técnico específico, consulte sempre o documento especializado correspondente listado na introdução. Alterações de escopo de fase devem ser refletidas em `ROADMAP.md`; alterações de estratégia de teste, em `TEST_STRATEGY.md`; e qualquer mudança neste documento que afete outro deve ser propagada para manter consistência entre todos.
