# Roadmap — Hr Shoes Commerce

Este roadmap detalha as seis fases de construção do Hr Shoes Commerce. Cada fase tem escopo, critérios de aceite explícitos, exigências de migração de banco, exigências de teste e um gate de revisão de segurança. Consulte `MASTER_PLAN.md` para a visão geral e `ARCHITECTURE.md`, `DOMAIN_MODEL.md`, `SECURITY.md` para os detalhes técnicos referenciados aqui.

## Regra de ouro

**Nenhuma fase avança para a seguinte sem, simultaneamente:**

1. Critérios de aceite (aceite) cumpridos e verificados;
2. Migrações de banco de dados aplicadas e revisadas;
3. Testes automatizados escritos e passando (unitários, integração, RLS e/ou E2E conforme aplicável à fase);
4. Revisão de segurança concluída (RLS, segredos, superfícies de exposição de dados).

Essa regra é absoluta e não é flexibilizada por prazo ou pressão comercial.

---

## Fase 0 — Fundação (agora)

### Escopo
- Documentação canônica: `MASTER_PLAN.md`, `ROADMAP.md`, `TEST_STRATEGY.md`, `DESIGN.md`, `AGENTS.md`, `docs/ARCHITECTURE.md`, `DOMAIN_MODEL.md`, `ROUTES.md`, `SECURITY.md`, `API_CONTRACTS.md`, `COMPONENT_CATALOG.md`.
- Tokens de design: cores (rosa marca #FF4FB8, canvas quente #F3F1EC, tinta #292729), tipografia (Manrope/Fraunces), espaçamento, elevação, raio.
- Layout e navegação: shell público, shell de cliente, shell de admin.
- Registro de rotas tipado, com metadados de fase, permissão e status ("disponível" / "em breve").
- Páginas públicas estruturais: home com seções reais conectáveis, páginas institucionais mínimas.
- Shell de admin mobile-first: sidebar responsiva (desktop) e bottom-nav (mobile).
- Biblioteca de componentes reutilizáveis com estados completos (carregando, vazio, erro, sem permissão, desabilitado, não configurado).
- Estados vazios verdadeiramente honestos: nenhuma simulação de dado real.

### Aceite
- Todos os 12 critérios listados em `MASTER_PLAN.md`, seção 8, verificados.
- Nenhuma rota do registro aponta para página inexistente; nenhuma duplicidade de caminho.
- Nenhum componente crítico sem cobertura dos estados obrigatórios.

### Migrações
- Nenhuma migração de domínio de negócio nesta fase (não há tabelas de catálogo/pedido/cliente ainda). Caso o Lovable Cloud exija tabelas mínimas de infraestrutura (ex.: configuração de organização/loja), devem ser documentadas em `DOMAIN_MODEL.md` como fundação, não como funcionalidade.

### Testes
- Testes de integridade do registro de rotas (toda rota resolve, sem duplicatas, metadados válidos).
- Testes de renderização de estados dos componentes críticos do catálogo.
- Ver `TEST_STRATEGY.md` para detalhes.

### Revisão de segurança
- Confirmar ausência de chamadas diretas ao Supabase em componentes.
- Confirmar ausência de chaves secretas no bundle do cliente.
- Confirmar que nenhuma tela pública exibe dado fictício de negócio.

---

## Fase 1 — Dados, identidade e catálogo

### Escopo
- Modelagem de banco de dados: organizações, lojas, usuários, papéis (RBAC).
- Autenticação real (Lovable Cloud/Supabase Auth) para admin e, se aplicável, clientes.
- Políticas de RLS para todas as tabelas novas, cobrindo isolamento por `organization_id`/`store_id`.
- Catálogo: produtos, tipos de produto, variantes (tamanho/cor), mídia de produto, categorias, controle de estoque (sempre calculado/validado no servidor).
- CRUD administrativo de catálogo no admin, consumindo apenas a camada de serviços/BFF.

### Aceite
- Uma lojista consegue criar, editar e desativar produtos, variantes, categorias e mídia pelo admin.
- Estoque exibido em qualquer tela reflete exatamente o valor validado no servidor no momento da consulta.
- Nenhuma política de RLS permite acesso cruzado entre organizações/lojas diferentes.
- Usuários sem papel/permissão adequada recebem estado "sem permissão", nunca dado vazado.

### Migrações
- Criação de tabelas: `organizations`, `stores`, `users`/perfis, `roles`/`permissions`, `products`, `product_types`, `product_variants`, `product_media`, `categories`, `stock_movements` (ou equivalente), todas com `organization_id`/`store_id` e políticas de RLS associadas.

### Testes
- Testes de RLS positivos (acesso permitido dentro do próprio tenant) e negativos (acesso negado entre tenants e para papéis sem permissão).
- Testes de contrato das funções de servidor de catálogo.
- Testes de integração de CRUD de catálogo no admin.

### Revisão de segurança
- Auditoria completa de políticas de RLS de todas as tabelas novas.
- Revisão de exposição de campos sensíveis nas respostas das funções de servidor.

---

## Fase 2 — Compra: carrinho, checkout e pagamento

### Escopo
- Carrinho de compras (server-authoritative para preço e disponibilidade).
- Checkout completo.
- Frete: tabela manual, retirada, ou cotação manual (sem integração automática de transportadora ainda).
- Pedido (order) com máquina de estados clara.
- Reserva de estoque durante o processo de compra, com expiração e liberação segura.
- Pagamentos: manual (comprovante) e Pix (fluxo mínimo, sem gateway automatizado complexo nesta fase, salvo definição contrária em `API_CONTRACTS.md`).

### Aceite
- Um cliente consegue adicionar produtos ao carrinho, finalizar um pedido e ver seu status refletir a realidade do servidor.
- Nenhum preço, frete ou desconto é calculado no navegador; todo valor exibido vem de resposta de servidor.
- Reserva de estoque impede overselling comprovadamente (teste de concorrência).
- Estados de pedido documentados e cobertos por testes (criado, aguardando pagamento, pago, cancelado, expirado etc., conforme `DOMAIN_MODEL.md`).

### Migrações
- Criação de tabelas: `carts`, `cart_items`, `orders`, `order_items`, `shipping_options`, `stock_reservations`, `payments`.

### Testes
- Testes de integração do fluxo completo carrinho → checkout → pedido → pagamento.
- Testes de concorrência para reserva de estoque.
- Testes de RLS para pedidos (cliente só vê seus próprios pedidos; admin vê os da própria loja).
- Testes E2E do fluxo de compra mínimo viável.

### Revisão de segurança
- Revisão de todas as rotas de pagamento quanto a exposição de dados sensíveis e validação server-side de valores.
- Revisão de RLS de `orders`/`payments`.

---

## Fase 3 — Conteúdo, presença e confiança

### Escopo
- Construtor de CMS (builder) para páginas/seções da loja.
- Stories.
- Perfil público / link-in-bio.
- Avaliações de produto, FAQ.
- SEO avançado (metadados dinâmicos, sitemap, structured data).
- PWA instalável (manifest, service worker, offline mínimo).

### Aceite
- Uma lojista consegue montar/editar seções de página pelo builder sem intervenção técnica.
- Loja instalável como PWA em dispositivos móveis, com ícone e splash corretos.
- Avaliações e FAQ exibidos apenas quando existem dados reais; caso contrário, estado vazio honesto.

### Migrações
- Criação de tabelas: `pages`, `page_sections`, `stories`, `reviews`, `faqs`, além de tabelas de configuração de SEO por página/produto.

### Testes
- Testes de integração do builder (criação/edição/publicação de seção).
- Testes de acessibilidade nas páginas geradas pelo builder.
- Testes de PWA (lighthouse/manifest válido, service worker registrado).

### Revisão de segurança
- Revisão de sanitização de conteúdo gerado pelo builder (proteção contra XSS).
- Revisão de RLS de avaliações (associação correta a pedidos/clientes reais, quando exigido).

---

## Fase 4 — Operação avançada e retenção

### Escopo
- CRM básico de clientes.
- Chat de atendimento.
- Trocas e devoluções.
- Caixa (controle de caixa/fechamento).
- Comissão de vendedoras.
- Cartões-presente.
- Carnê (parcelamento próprio da loja).

### Aceite
- Fluxo de troca rastreável do pedido original ao novo pedido/reembolso.
- Fechamento de caixa reflete exatamente as transações registradas no período, sem cálculo client-side.
- Comissões calculadas e auditáveis a partir de dados do servidor.

### Migrações
- Criação de tabelas: `customers_crm`, `chat_threads`, `chat_messages`, `exchanges`, `cash_registers`, `cash_register_entries`, `commissions`, `gift_cards`, `installment_plans` (carnê).

### Testes
- Testes de integração para trocas, caixa e comissão.
- Testes de RLS para dados financeiros sensíveis (caixa, comissão).
- Testes de contrato para cálculo de comissão e saldo de cartão-presente.

### Revisão de segurança
- Revisão de controle de acesso por papel (quem pode abrir/fechar caixa, aprovar troca, ver comissão de outra vendedora).
- Auditoria de trilha de auditoria (logs de alteração em dados financeiros).

---

## Fase 5 — Crescimento e integrações externas

### Escopo
- Integrações com Meta (catálogo/anúncios) e Google (Merchant Center/Analytics).
- Integrações de logística (cálculo automático de frete via transportadora).
- Recuperação de carrinho abandonado.
- "Match Time" (funcionalidade de engajamento/promoção, conforme especificação de produto a detalhar em `DOMAIN_MODEL.md`).
- Criador de posts para redes sociais.

### Aceite
- Catálogo sincronizado corretamente com Meta/Google sem duplicidade ou dado divergente do servidor.
- Frete calculado automaticamente reflete cotação real de transportadora, nunca estimativa client-side.
- Fluxo de recuperação de carrinho respeita preferências de contato e LGPD.

### Migrações
- Criação de tabelas/colunas de integração: `integration_credentials` (segredos nunca expostos ao cliente), `abandoned_carts`, `shipping_quotes`, `social_posts`.

### Testes
- Testes de contrato com mocks das integrações externas.
- Testes de RLS para credenciais de integração (acesso restrito a papéis administrativos específicos).
- Testes E2E de recuperação de carrinho.

### Revisão de segurança
- Revisão de armazenamento de credenciais de integrações externas (nunca em texto plano acessível ao cliente).
- Revisão de conformidade com LGPD para dados de clientes usados em recuperação de carrinho e integrações de anúncios.

---

## Visão consolidada das fases

| Fase | Tema | Depende de |
|---|---|---|
| 0 | Fundação: docs, design system, shells, navegação, componentes | — |
| 1 | Dados, identidade, catálogo | Fase 0 |
| 2 | Compra: carrinho, checkout, pagamento | Fase 1 |
| 3 | Conteúdo, presença, confiança | Fase 1 (parcialmente Fase 2 para avaliações ligadas a pedidos) |
| 4 | Operação avançada e retenção | Fase 2 |
| 5 | Crescimento e integrações externas | Fase 3 e Fase 4 |
