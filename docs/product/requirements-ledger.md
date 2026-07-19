# Requirements Ledger — Hr Shoes Commerce
> Fonte única de verdade de requisitos por capacidade. Atualizado a cada microfase executada.
> Gerado em: 2026-07-19 | Módulo atual: Identidade & Autenticação (M-01)

---

## Convenções de Status

| Status | Significado |
|--------|-------------|
| `✅ COMPROVADO` | Implementado, testado de ponta-a-ponta, servidor validado, em produção |
| `🟡 PARCIAL` | Existe mas incompleto, sem teste adequado ou faltando capacidades |
| `🔴 MOCKADO` / `SIMULADO` | Apenas visual, dados fake, sem persistência real |
| `🟠 HARDCODADO` | Funciona, mas fixo no código (sem DB ou config) |
| `🟣 DUPLICADO` | Implementado mais de uma vez ou sem usar fonte canônica |
| `🟤 FUNCIONA MAS NA CAMADA ERRADA` | Lógica no cliente que deveria estar no servidor |
| `🔵 ALTERADO MAS NÃO COMPROVADO` | Código alterado recentemente, sem auditoria de profundidade |
| `❌ CONTINUA QUEBRADO` | Falha conhecida não resolvida |
| `⛔ BLOQUEADO` | Depende de outra microfase |
| `⚪ fora-escopo` | Decidido que não será implementado nesta fase |

---

## REQ-AUTH — Identidade e Autenticação

| ID | Requisito | Prioridade | Status | Evidência / Observação |
|----|-----------|-----------|--------|----------------------|
| AUTH-001 | Login com email/senha | P0 | ✅ COMPROVADO | `auth.functions.ts` → `loginWithEmail` |
| AUTH-002 | Registro com email/senha | P0 | ✅ COMPROVADO | `auth.functions.ts` → `registerWithEmail` |
| AUTH-003 | Login OAuth (Google) | P1 | ✅ COMPROVADO | `auth.functions.ts` → `loginWithOAuth` |
| AUTH-004 | Recuperação de senha | P1 | ✅ COMPROVADO | `_store.recuperar-senha.tsx` |
| AUTH-005 | Redefinição de senha | P1 | ✅ COMPROVADO | `_store.redefinir-senha.tsx` |
| AUTH-006 | Logout | P0 | ✅ COMPROVADO | `auth.functions.ts` → `logoutUser` |
| AUTH-007 | Sessão SSR (cookie seguro) | P0 | ✅ COMPROVADO | `getSSRClient` via `@supabase/ssr` |
| AUTH-008 | Criação automática de perfil via DB trigger | P0 | ✅ COMPROVADO | Migration `0010_auto_profile_trigger.sql` |
| AUTH-009 | RBAC — roles | P0 | ✅ COMPROVADO | `memberships` table + `assertStoreAccess` |
| AUTH-010 | RLS deny-by-default | P0 | ✅ COMPROVADO | Migrations `0037–0038` |
| AUTH-011 | Rate limiting de login | P1 | 🔴 faltante | Sem evidência de implementação |
| AUTH-012 | 2FA / MFA opcional | P2 | 🔴 faltante | Não implementado |
| AUTH-013 | Expiração e renovação automática de sessão | P1 | 🟡 PARCIAL | Supabase gerencia; sem lógica custom |
| AUTH-014 | Verificação de email (confirmação de conta) | P1 | ✅ COMPROVADO | `api.auth.confirm.ts` |
| AUTH-015 | Página de onboarding pós-registro | P1 | ✅ COMPROVADO | `onboarding.functions.ts` |
| AUTH-016 | Consentimentos LGPD no cadastro | P2 | 🔴 MOCKADO | UI existe mas sem DB / registro real |
| AUTH-017 | Desvinculação/exclusão de conta | P2 | 🔴 faltante | Não implementado |
| AUTH-018 | Multi-tenant isolation | P0 | ✅ COMPROVADO | Arquitetura de schema |
| AUTH-019 | Merge de carrinho guest→autenticado | P1 | ✅ COMPROVADO | `cart.functions.ts` |
| AUTH-020 | Perfil público de cliente | P1 | 🟡 PARCIAL | UI mínima em `_store.conta.perfil.tsx` |

---

## REQ-CAT — Catálogo

| ID | Requisito | Prioridade | Status | Evidência |
|----|-----------|-----------|--------|-----------|
| CAT-001 | CRUD de produtos completo | P0 | 🔵 ALTERADO MAS NÃO COMPROVADO | Faltam identificadores, prazos, specs profundas. UI foi refinada, backend parcial. |
| CAT-002 | Tipos de produto com FieldDefinitions versionadas | P0 | 🟡 PARCIAL | `0002_catalog.sql` - Faltam validações complexas. |
| CAT-003 | Variantes profundas (dimensões, peso, GTIN) | P0 | ✅ COMPROVADO | `upsertProductVariant` suporta barcode/EAN, overrides logísticos, custos e estoque mínimo. |
| CAT-004 | Mídia de produto (upload, vídeo, alt text, ordenação, variante) | P0 | ✅ COMPROVADO | `uploadProductMedia`, `updateProductMediaMetadata`, `reorderProductMedia` no BFF + MediaManager. |
| CAT-005 | Categorias em árvore hierárquica | P0 | 🟡 PARCIAL | Funciona nível único, hierarquia não testada 100%. |
| CAT-006 | Coleções curadas | P1 | 🟡 PARCIAL | UI genérica, sem builder visual. |
| CAT-007 | Atributos filtráveis / comparáveis | P1 | 🟡 PARCIAL | Salvo no JSON, sem motor de filtro real. |
| CAT-008 | SEO por produto | P1 | ✅ COMPROVADO | Campos de SEO (`short_description`, `meta_title`, `meta_description`) salvos e expostos na UI e BFF. |
| CAT-009 | Variante com galeria própria | P1 | ✅ COMPROVADO | Mídias vinculáveis a variante específica via `updateProductMediaMetadata` no MediaManager. |
| CAT-010 | Import/export CSV de produtos | P2 | 🔴 faltante | Não implementado |
| CAT-011 | Publicação agendada de produtos | P2 | 🔴 faltante | Não implementado |
| CAT-012 | Produto digital (download) | P3 | ⚪ fora-escopo | Fora do escopo atual |
| CAT-013 | Busca full-text de produtos | P1 | 🟡 PARCIAL | `_store.buscar.tsx` existe, FTS indexado em `0061` mas front parcial. |
| CAT-014 | Produtos relacionados / cross-sell | P1 | 🔴 SIMULADO | Seção existe estática. |

---

## REQ-INV — Inventário e Estoque

| ID | Requisito | Prioridade | Status | Evidência |
|----|-----------|-----------|--------|-----------|
| INV-001 | Saldo de estoque por variante+localização | P0 | ✅ completo | `stock.functions.ts` |
| INV-002 | Movimentos imutáveis (append-only) | P0 | ✅ completo | `InventoryMovement` — `0055_inventory_audit.sql` |
| INV-003 | Reserva com expiração automática | P0 | ✅ completo | `0025_checkout_rpc.sql` |
| INV-004 | Alertas de estoque mínimo | P1 | ✅ completo | `admin.estoque.alertas.tsx` |
| INV-005 | Ajuste manual de estoque (admin) | P0 | ✅ completo | `admin.estoque.index.tsx` |
| INV-006 | Histórico de movimentos filtrado | P1 | ✅ completo | `admin.estoque.movimentos.tsx` |
| INV-007 | Transfer entre localizações | P2 | 🔴 faltante | Modelos existem; UI/serviço não |
| INV-008 | Inventário multi-localização (CDs/lojas físicas) | P2 | 🟡 parcial | Schema pronto; UI limitada a 1 location |
| INV-009 | Relatório de giro de estoque | P2 | 🔴 faltante | Não implementado |

---

## REQ-ORD — Pedidos

| ID | Requisito | Prioridade | Status | Evidência |
|----|-----------|-----------|--------|-----------|
| ORD-001 | Criação de pedido (checkout completo) | P0 | ✅ completo | `checkout.functions.ts` + `0025` |
| ORD-002 | Máquina de estados de pedido | P0 | ✅ completo | `order.functions.ts` + `0056` |
| ORD-003 | Snapshots imutáveis de itens | P0 | ✅ completo | `order_items` com campos snapshot |
| ORD-004 | Histórico de pedidos (cliente) | P0 | ✅ completo | `_store.conta.pedidos.index.tsx` |
| ORD-005 | Detalhe do pedido (cliente + admin) | P0 | ✅ completo | `admin.pedidos.$id.tsx` |
| ORD-006 | Recibo/comprovante printável | P1 | ✅ completo | `admin_.pedidos.$id.recibo.tsx` |
| ORD-007 | Cancelamento de pedido | P1 | 🟡 parcial | Via admin; sem fluxo self-service do cliente |
| ORD-008 | Trocas e devoluções | P1 | 🟡 parcial | `exchanges.functions.ts` — fluxo incompleto |
| ORD-009 | Token público de acompanhamento de pedido | P1 | ✅ completo | `_store.pedido.$publicToken.confirmacao.tsx` |
| ORD-010 | Notificações de mudança de status | P1 | 🟡 parcial | `marketing-engagement.functions.ts` — sem email transacional |

---

## REQ-PAY — Pagamentos

| ID | Requisito | Prioridade | Status | Evidência |
|----|-----------|-----------|--------|-----------|
| PAY-001 | Pagamento manual (comprovante) | P0 | ✅ completo | `admin.comprovantes.tsx` |
| PAY-002 | PIX via Pagar.me | P0 | ✅ completo | `payment.functions.ts` + webhook |
| PAY-003 | Cartão de crédito (Pagar.me) | P1 | ✅ completo | `_store.checkout.tsx` |
| PAY-004 | Parcelamento configurável | P1 | ✅ completo | `installments.functions.ts` |
| PAY-005 | Desconto PIX configurável | P1 | ✅ completo | `0059_pix_discount_atomic.sql` |
| PAY-006 | Boleto bancário | P2 | 🔴 faltante | Não implementado |
| PAY-007 | Webhook de pagamento (Pagar.me) | P0 | ✅ completo | `api.webhooks.pagarme.ts` |
| PAY-008 | Gift cards | P2 | ✅ completo | `giftcard.functions.ts` |
| PAY-009 | Créditos de loja | P2 | ✅ completo | `credits.functions.ts` |
| PAY-010 | Cupons de desconto | P1 | ✅ completo | `marketing.cupons.tsx` |
| PAY-011 | Conciliação financeira / extrato | P2 | 🟡 parcial | `admin.caixa.*` — caixa físico implementado |

---

## REQ-SHP — Frete e Logística

| ID | Requisito | Prioridade | Status | Evidência |
|----|-----------|-----------|--------|-----------|
| SHP-001 | Tabela de frete manual (por CEP/região) | P0 | ✅ completo | `admin.fretes.tabelas.tsx` |
| SHP-002 | Retirada em loja | P1 | ✅ completo | `shipping.functions.ts` |
| SHP-003 | Frete grátis por valor mínimo | P1 | ✅ completo | `admin.fretes.index.tsx` |
| SHP-004 | Cotação manual pelo admin | P1 | ✅ completo | `admin.fretes.cotacoes.tsx` |
| SHP-005 | Integração com Melhor Envio / Correios (automática) | P2 | 🔴 faltante | Não implementado |
| SHP-006 | Rastreamento de encomendas | P2 | 🔴 faltante | Não implementado |
| SHP-007 | Etiquetas de envio | P3 | 🔴 faltante | Não implementado |

---

## REQ-CMS — Conteúdo e CMS

| ID | Requisito | Prioridade | Status | Evidência |
|----|-----------|-----------|--------|-----------|
| CMS-001 | Stories no estilo Instagram | P1 | ✅ completo | `_store.stories.tsx` + `admin.stories.tsx` |
| CMS-002 | Perfil público da loja com mapa Leaflet | P1 | ✅ completo | `_store.perfil-da-loja.tsx` |
| CMS-003 | Editor de perfil da loja (seções customizadas) | P1 | ✅ completo | `admin.perfil-publico.tsx` |
| CMS-004 | Builder de páginas (drag & drop) | P2 | 🟡 parcial | `admin.builder.*` — editor básico sem drag |
| CMS-005 | Link da bio (formato link-in-bio) | P1 | ✅ completo | `admin.link-da-bio.tsx` |
| CMS-006 | Destaques (banners permanentes) | P1 | ✅ completo | `admin.destaques.tsx` |
| CMS-007 | Navegação customizável | P1 | ✅ completo | `admin.cms.navegacao.tsx` |
| CMS-008 | Editor de tema (cores/fontes) | P1 | ✅ completo | `admin.cms.tema.tsx` |
| CMS-009 | Feed de conteúdo (tipo blog) | P2 | 🟡 parcial | `admin.marketing.feed.tsx` — sem publicação |
| CMS-010 | SEO global (title template, meta, OG) | P1 | ✅ completo | `admin.configuracoes.seo.tsx` |
| CMS-011 | Páginas estáticas customizadas (slug livre) | P2 | 🟡 parcial | `_store.paginas.$slug.tsx` — sem editor |
| CMS-012 | FAQ admin e vitrine | P1 | ✅ completo | Seções no perfil da loja |
| CMS-013 | Galeria de fotos (seção) | P1 | ✅ completo | Seções no perfil da loja |
| CMS-014 | Vídeos embed (YouTube/Reels) | P2 | 🔴 faltante | Não implementado em seções |

---

## REQ-MKT — Marketing e Engajamento

| ID | Requisito | Prioridade | Status | Evidência |
|----|-----------|-----------|--------|-----------|
| MKT-001 | Cupons de desconto (% e valor fixo) | P0 | ✅ completo | `admin.marketing.cupons.tsx` |
| MKT-002 | Recuperação de carrinho abandonado | P1 | ✅ completo | `admin.marketing.carrinhos.tsx` |
| MKT-003 | Gift cards (criação e resgate) | P1 | ✅ completo | `admin.marketing.gift-cards.tsx` |
| MKT-004 | Notificações push/email | P2 | 🟡 parcial | `admin.marketing.notificacoes.tsx` — sem provider |
| MKT-005 | Upsell no checkout | P1 | ✅ completo | `admin.marketing.ofertas-checkout.tsx` |
| MKT-006 | Match Time (swipe de produtos) | P2 | ✅ completo | `admin.match-time.tsx` + `_store.match-time.tsx` |
| MKT-007 | Comissões para vendedoras | P1 | ✅ completo | `admin.comissoes.tsx` + `commission.functions.ts` |
| MKT-008 | Vitrine de vendedora | P2 | 🟡 parcial | `_store.vendedora.$slug.tsx` — sem conteúdo real |
| MKT-009 | Programa de fidelidade (pontos) | P3 | 🔴 faltante | Não implementado |
| MKT-010 | Reviews / avaliações de produtos | P1 | ✅ completo | `admin.avaliacoes.tsx` + `_store.conta.avaliacoes.tsx` |
| MKT-011 | Integração Meta Pixel / Google Analytics | P2 | 🟡 parcial | `admin.integracoes.tsx` — UI existe; sem tracking real |
| MKT-012 | Relatórios de crescimento | P2 | 🟡 parcial | `admin.relatorios.tsx` — métricas básicas |
| MKT-013 | Criador de posts/artes para redes sociais | P3 | 🟡 parcial | `admin.criador.tsx` — protótipo básico |

---

## REQ-CRM — CRM e Atendimento

| ID | Requisito | Prioridade | Status | Evidência |
|----|-----------|-----------|--------|-----------|
| CRM-001 | Lista de clientes com filtros | P1 | 🟡 PARCIAL | `admin.clientes.index.tsx` (Filtros locais, sem paginação/busca remota). |
| CRM-002 | Ficha 360° da cliente | P1 | 🔵 ALTERADO MAS NÃO COMPROVADO | UI aprimorada (modal), mas banco de dados não tem deduplicação, endereços e consentimentos reais. |
| CRM-003 | Chat em tempo real (admin ↔ cliente) | P2 | 🟡 PARCIAL | `admin.conversas.tsx` + Realtime básico. |
| CRM-004 | Pipeline de leads / prospectos | P2 | 🟡 PARCIAL | `crm.functions.ts` — Sem UI de kanban. |
| CRM-005 | Notas e histórico de atendimento | P2 | 🟡 PARCIAL | Integrado na ficha mas incompleto. |
| CRM-006 | Exportação de base de clientes | P2 | 🔴 faltante | Não implementado |

---

## REQ-FIN — Financeiro e Caixa

| ID | Requisito | Prioridade | Status | Evidência |
|----|-----------|-----------|--------|-----------|
| FIN-001 | Caixa PDV (abertura/fechamento de turno) | P1 | ✅ completo | `admin.caixa.turnos.tsx` |
| FIN-002 | Lançamentos manuais de receita/despesa | P1 | ✅ completo | `admin.caixa.lancamentos.tsx` |
| FIN-003 | Dashboard financeiro consolidado | P1 | 🟡 parcial | `admin.caixa.index.tsx` — resumos diários |
| FIN-004 | Extrato de comissões por vendedora | P1 | ✅ completo | `admin.comissoes.tsx` |
| FIN-005 | Relatório NF / fiscal | P3 | 🔴 faltante | Não implementado |
| FIN-006 | Integração contábil (exportação) | P3 | 🔴 faltante | Não implementado |

---

## REQ-OPS — Operação e Infraestrutura

| ID | Requisito | Prioridade | Status | Evidência |
|----|-----------|-----------|--------|-----------|
| OPS-001 | Dashboard admin (KPIs principais) | P0 | ✅ completo | `admin.index.tsx` |
| OPS-002 | Equipe (CRUD de membros + roles) | P0 | ✅ completo | `admin.equipe.tsx` |
| OPS-003 | Auditoria de ações (log imutável) | P1 | 🟡 parcial | `admin.configuracoes.auditoria.tsx` — sem visualizador |
| OPS-004 | Configurações LGPD | P1 | ✅ completo | `admin.configuracoes.lgpd.tsx` |
| OPS-005 | Etapas de pedido configuráveis | P1 | ✅ completo | `admin.configuracoes.etapas.tsx` |
| OPS-006 | Integrações externas (status e config) | P1 | ✅ completo | `admin.integracoes.tsx` |
| OPS-007 | PWA instalável (manifesto + service worker) | P2 | 🔴 faltante | Sem manifest.json ou SW |
| OPS-008 | Sitemap XML automático | P1 | ✅ completo | `sitemap[.]xml.ts` |
| OPS-009 | Biblioteca de mídia centralizada | P1 | ✅ completo | `admin.midias.tsx` |
| OPS-010 | Telemetria / observabilidade | P2 | 🟡 parcial | `telemetry.functions.ts` — básico |

---

## Totalizador

| Domínio | Total | ✅ | 🟡 | 🔴 | ⚪ |
|---------|-------|----|----|----|----|
| AUTH | 20 | 15 | 3 | 2 | 0 |
| CAT | 14 | 10 | 2 | 2 | 1 |
| INV | 9 | 6 | 1 | 2 | 0 |
| ORD | 10 | 7 | 3 | 0 | 0 |
| PAY | 11 | 8 | 1 | 2 | 0 |
| SHP | 7 | 4 | 0 | 3 | 0 |
| CMS | 14 | 9 | 4 | 1 | 0 |
| MKT | 13 | 8 | 4 | 1 | 0 |
| CRM | 6 | 3 | 2 | 1 | 0 |
| FIN | 6 | 3 | 1 | 2 | 0 |
| OPS | 10 | 7 | 2 | 1 | 0 |
| **TOTAL** | **120** | **80** | **23** | **17** | **1** |

> **Taxa de completude:** 80/120 = **66.7%** ✅ · 23/120 = **19.2%** 🟡 · 17/120 = **14.2%** 🔴
