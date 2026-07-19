# Module Inventory — Hr Shoes Commerce
> Inventário canônico de todos os módulos da plataforma, com status atual e próxima ação de revisão.
> Gerado em: 2026-07-19 | Atualizado a cada microfase concluída.

---

## Índice de Módulos

| Módulo | Código | Domínio | Completude | Próxima Revisão |
|--------|--------|---------|-----------|----------------|
| Identidade & Autenticação | M-01 | AUTH | 75% | **M-01 ATUAL** |
| Catálogo de Produtos | M-02 | CAT | 78% | Após M-01 |
| Inventário e Estoque | M-03 | INV | 74% | Fila |
| Pedidos | M-04 | ORD | 80% | Fila |
| Pagamentos | M-05 | PAY | 81% | Fila |
| Frete e Logística | M-06 | SHP | 57% | Fila |
| Vitrine Pública | M-07 | FRONT | 70% | Fila |
| CMS & Conteúdo | M-08 | CMS | 72% | Fila |
| Marketing & Engajamento | M-09 | MKT | 70% | Fila |
| CRM & Atendimento | M-10 | CRM | 58% | Fila |
| Financeiro & Caixa | M-11 | FIN | 58% | Fila |
| Operação & Infra | M-12 | OPS | 75% | Fila |

---

## M-01 — Identidade & Autenticação

**Código:** M-01 | **Domínio:** AUTH | **Status:** 🔵 Em Revisão

### Capacidades

| Cap | Descrição | Status |
|-----|-----------|--------|
| M-01-C01 | Fluxo completo de login (email + OAuth) | ✅ |
| M-01-C02 | Registro + verificação de email | ✅ |
| M-01-C03 | Recuperação/redefinição de senha | ✅ |
| M-01-C04 | Sessão SSR segura + logout | ✅ |
| M-01-C05 | RBAC com roles granulares | ✅ |
| M-01-C06 | RLS server-side deny-by-default | ✅ |
| M-01-C07 | Onboarding pós-registro (admin) | ✅ |
| M-01-C08 | Merge de carrinho guest→autenticado | ✅ |
| M-01-C09 | Rate limiting / proteção brute-force | 🔴 |
| M-01-C10 | LGPD — exclusão de conta | 🔴 |
| M-01-C11 | Perfil de cliente completo e editável | 🟡 |

### Lacunas Identificadas

1. **AUTH-011** Rate limiting de tentativas de login → risco de segurança P1
2. **AUTH-017** Direito ao esquecimento (LGPD art. 18) → compliance obrigatório
3. **AUTH-020** Página de perfil de cliente muito básica → UX pobre

### Microfases Planejadas

| Microfase | Descrição | Prioridade |
|-----------|-----------|-----------|
| M-01-F1 | Rate limiting de auth + proteção brute-force | P1 |
| M-01-F2 | Exclusão de conta LGPD-compliant | P1 |
| M-01-F3 | Perfil de cliente enriquecido (foto, preferências) | P2 |

---

## M-02 — Catálogo de Produtos

**Código:** M-02 | **Domínio:** CAT | **Status:** ⏳ Fila

### Capacidades

| Cap | Descrição | Status |
|-----|-----------|--------|
| M-02-C01 | CRUD completo de produtos | ✅ |
| M-02-C02 | Tipos de produto com schema versionado | ✅ |
| M-02-C03 | Variantes (SKU/cor/tamanho) | ✅ |
| M-02-C04 | Upload de mídia | ✅ |
| M-02-C05 | Categorias em árvore | ✅ |
| M-02-C06 | Coleções curadas | ✅ |
| M-02-C07 | Atributos filtráveis | ✅ |
| M-02-C08 | SEO por produto | ✅ |
| M-02-C09 | Busca full-text indexada | 🟡 |
| M-02-C10 | Produtos relacionados / cross-sell curado | 🟡 |
| M-02-C11 | Import/export CSV | 🔴 |

---

## M-03 — Inventário e Estoque

**Código:** M-03 | **Domínio:** INV | **Status:** ⏳ Fila

### Capacidades

| Cap | Descrição | Status |
|-----|-----------|--------|
| M-03-C01 | Saldo por variante+location | ✅ |
| M-03-C02 | Movimentos append-only | ✅ |
| M-03-C03 | Reservas com expiração | ✅ |
| M-03-C04 | Alertas de estoque mínimo | ✅ |
| M-03-C05 | Ajuste manual via admin | ✅ |
| M-03-C06 | Histórico filtrado | ✅ |
| M-03-C07 | Transfer entre localizações | 🔴 |
| M-03-C08 | Multi-localização na UI | 🟡 |
| M-03-C09 | Relatório de giro | 🔴 |

---

## M-04 — Pedidos

**Código:** M-04 | **Domínio:** ORD | **Status:** ⏳ Fila

### Capacidades

| Cap | Descrição | Status |
|-----|-----------|--------|
| M-04-C01 | Checkout + criação de pedido | ✅ |
| M-04-C02 | Máquina de estados | ✅ |
| M-04-C03 | Snapshots imutáveis de itens | ✅ |
| M-04-C04 | Histórico de cliente | ✅ |
| M-04-C05 | Detalhe admin | ✅ |
| M-04-C06 | Recibo printável | ✅ |
| M-04-C07 | Token público de acompanhamento | ✅ |
| M-04-C08 | Cancelamento self-service (cliente) | 🟡 |
| M-04-C09 | Fluxo de trocas/devoluções completo | 🟡 |
| M-04-C10 | Notificações transacionais de status | 🟡 |

---

## M-05 — Pagamentos

**Código:** M-05 | **Domínio:** PAY | **Status:** ⏳ Fila

### Capacidades

| Cap | Descrição | Status |
|-----|-----------|--------|
| M-05-C01 | Comprovante manual | ✅ |
| M-05-C02 | PIX via Pagar.me | ✅ |
| M-05-C03 | Cartão de crédito | ✅ |
| M-05-C04 | Parcelamento | ✅ |
| M-05-C05 | Desconto PIX | ✅ |
| M-05-C06 | Webhook Pagar.me | ✅ |
| M-05-C07 | Gift cards | ✅ |
| M-05-C08 | Créditos de loja | ✅ |
| M-05-C09 | Cupons de desconto | ✅ |
| M-05-C10 | Boleto bancário | 🔴 |
| M-05-C11 | Conciliação financeira | 🟡 |

---

## M-06 — Frete e Logística

**Código:** M-06 | **Domínio:** SHP | **Status:** ⏳ Fila

### Capacidades

| Cap | Descrição | Status |
|-----|-----------|--------|
| M-06-C01 | Tabela de frete manual | ✅ |
| M-06-C02 | Retirada em loja | ✅ |
| M-06-C03 | Frete grátis por valor | ✅ |
| M-06-C04 | Cotação manual admin | ✅ |
| M-06-C05 | Melhor Envio / Correios automático | 🔴 |
| M-06-C06 | Rastreamento de encomendas | 🔴 |
| M-06-C07 | Etiquetas de envio | 🔴 |

---

## M-07 — Vitrine Pública

**Código:** M-07 | **Domínio:** FRONT | **Status:** ⏳ Fila

### Capacidades

| Cap | Descrição | Status |
|-----|-----------|--------|
| M-07-C01 | Home com seções dinâmicas | ✅ |
| M-07-C02 | Página de produto rica (cor, tamanho, galeria) | ✅ |
| M-07-C03 | Catálogo com filtros | 🟡 |
| M-07-C04 | Busca | 🟡 |
| M-07-C05 | Stories | ✅ |
| M-07-C06 | Perfil da loja + mapa | ✅ |
| M-07-C07 | Link da bio | ✅ |
| M-07-C08 | Match Time (swipe) | ✅ |
| M-07-C09 | Carrinho + checkout | ✅ |
| M-07-C10 | Área da cliente | ✅ |
| M-07-C11 | PWA instalável | 🔴 |

---

## M-08 — CMS & Conteúdo

**Código:** M-08 | **Domínio:** CMS | **Status:** ⏳ Fila

### Capacidades

| Cap | Descrição | Status |
|-----|-----------|--------|
| M-08-C01 | Builder de páginas | 🟡 |
| M-08-C02 | Editor de tema | ✅ |
| M-08-C03 | Navegação customizável | ✅ |
| M-08-C04 | Destaques / banners | ✅ |
| M-08-C05 | Stories admin | ✅ |
| M-08-C06 | Feed de conteúdo | 🟡 |
| M-08-C07 | Páginas estáticas com slug livre | 🟡 |
| M-08-C08 | Biblioteca de mídia | ✅ |
| M-08-C09 | Vídeos embed | 🔴 |

---

## M-09 — Marketing & Engajamento

**Código:** M-09 | **Domínio:** MKT | **Status:** ⏳ Fila

### Capacidades

| Cap | Descrição | Status |
|-----|-----------|--------|
| M-09-C01 | Cupons | ✅ |
| M-09-C02 | Recuperação de carrinho | ✅ |
| M-09-C03 | Gift cards | ✅ |
| M-09-C04 | Upsell no checkout | ✅ |
| M-09-C05 | Comissões | ✅ |
| M-09-C06 | Avaliações de produtos | ✅ |
| M-09-C07 | Notificações push/email | 🟡 |
| M-09-C08 | Vitrine de vendedora | 🟡 |
| M-09-C09 | Integrações Meta/Google | 🟡 |
| M-09-C10 | Relatórios de crescimento | 🟡 |
| M-09-C11 | Criador de posts | 🟡 |
| M-09-C12 | Programa de fidelidade | 🔴 |

---

## M-10 — CRM & Atendimento

**Código:** M-10 | **Domínio:** CRM | **Status:** ⏳ Fila

### Capacidades

| Cap | Descrição | Status |
|-----|-----------|--------|
| M-10-C01 | Lista de clientes filtrada | ✅ |
| M-10-C02 | Ficha 360° da cliente | ✅ |
| M-10-C03 | Chat realtime | ✅ |
| M-10-C04 | Pipeline de leads (kanban) | 🟡 |
| M-10-C05 | Notas e histórico | 🟡 |
| M-10-C06 | Exportação de base | 🔴 |

---

## M-11 — Financeiro & Caixa

**Código:** M-11 | **Domínio:** FIN | **Status:** ⏳ Fila

### Capacidades

| Cap | Descrição | Status |
|-----|-----------|--------|
| M-11-C01 | Caixa PDV (abertura/fechamento) | ✅ |
| M-11-C02 | Lançamentos manuais | ✅ |
| M-11-C03 | Dashboard financeiro | 🟡 |
| M-11-C04 | Extrato de comissões | ✅ |
| M-11-C05 | Relatório NF / fiscal | 🔴 |
| M-11-C06 | Exportação contábil | 🔴 |

---

## M-12 — Operação & Infra

**Código:** M-12 | **Domínio:** OPS | **Status:** ⏳ Fila

### Capacidades

| Cap | Descrição | Status |
|-----|-----------|--------|
| M-12-C01 | Dashboard KPIs | ✅ |
| M-12-C02 | Gestão de equipe | ✅ |
| M-12-C03 | Log de auditoria (visualizador) | 🟡 |
| M-12-C04 | Configurações LGPD | ✅ |
| M-12-C05 | Etapas de pedido configuráveis | ✅ |
| M-12-C06 | Integrações externas | ✅ |
| M-12-C07 | Sitemap automático | ✅ |
| M-12-C08 | Biblioteca de mídia | ✅ |
| M-12-C09 | PWA (manifest + SW) | 🔴 |
| M-12-C10 | Telemetria | 🟡 |
