# Dossier — M-07: Vitrine Pública
> Gerado: 2026-07-19 | Fase atual: M0 (Inventário)

---

## 1. Escopo do Módulo

M-07 cobre tudo o que o cliente vê antes de acessar uma página de produto específica: 
homepage, header global, footer global, barra de anúncios, SEO global, newsletter e 
a experiência geral de "primeira impressão" da vitrine.

---

## 2. Matriz de Capacidades

| ID | Capacidade | Backend | UI | Score |
|----|-----------|---------|-----|-------|
| M-07-C01 | Homepage com CMS dinâmico (sections) | ✅ | ✅ | A |
| M-07-C02 | Hero Carousel com banners | ✅ | ✅ | A |
| M-07-C03 | Product Rail (curated collection) | ✅ | ✅ | A |
| M-07-C04 | Category Rail (scroll horizontal) | ✅ | ✅ | A |
| M-07-C05 | Benefits section | ✅ | ✅ | B |
| M-07-C06 | Announcement Bar | ✅ | ✅ | B |
| M-07-C07 | SEO global da homepage (og:image da loja) | 🟡 estático | ✅ parcial | C |
| M-07-C08 | Header sticky com cart badge | ✅ | ✅ | A |
| M-07-C09 | Footer com links dinâmicos | ✅ | ✅ | B |
| M-07-C10 | Header: search bar expandível (quick search) | 🔴 | 🔴 | F |
| M-07-C11 | ProductCard: quick-add ao carrinho (hover) | 🔴 | 🔴 | F |
| M-07-C12 | ProductCard: wishlist/favoritar | 🔴 | 🔴 | F |
| M-07-C13 | ProductCard: segunda imagem no hover | 🔴 | 🔴 | F |
| M-07-C14 | Homepage: contagem regressiva de promoção | ✅ | 🟡 sem integração | C |
| M-07-C15 | SEO structured data (JSON-LD: Organization, WebSite) | 🔴 | 🔴 | F |
| M-07-C16 | Newsletter capture (footer ou popup) | 🟡 opt-in no perfil | 🔴 sem captura | D |
| M-07-C17 | Bottom nav mobile | ✅ | ✅ | A |
| M-07-C18 | Back-to-top button | 🔴 | 🔴 | F |
| M-07-C19 | ProductCard: badge "Novo" (published < 7 dias) | 🔴 | 🔴 | F |
| M-07-C20 | Canonical / hreflang SEO global | 🔴 | 🔴 | F |

---

## 3. Lacunas Críticas

### Lacuna #1 — ProductCard sem segunda imagem no hover e sem quick-add
**Causa raiz:** `product-card.tsx` só renderiza uma imagem e não tem CTA inline. A jornada de compra exige 1 clique a mais (ir para PDP) antes de adicionar ao carrinho.

**Impacto:** Conversão menor no catálogo. Padrão de mercado e-commerce (Shein, Zara, etc.) é hover com 2a imagem + botão flutuante.

### Lacuna #2 — JSON-LD Structured Data ausente
**Causa raiz:** Nenhuma rota injeta `<script type="application/ld+json">`. Google usa Organization + WebSite para rich results no search (caixa de busca de site, logo, sitelinks).

### Lacuna #3 — Quick search no header ausente
**Causa raiz:** O header tem apenas um link de ícone para `/buscar`. Um overlay de busca rápida com resultados em tempo real seria muito mais eficaz na conversão.

### Lacuna #4 — Badge "Novo" e hover de segunda imagem
**Causa raiz:** `ProductCardDTO` não expõe `publishedAt`. O card não tem estado de hover com imagem alternativa.

---

## 4. Microfases Priorizadas

| # | Microfase | Capacidades | Prioridade |
|---|-----------|-------------|-----------|
| **M-07-F1** | **ProductCard premium** (2a imagem hover + badge Novo + quick-add) | C11, C13, C19 | **P1** |
| **M-07-F2** | **JSON-LD Structured Data** (Organization + WebSite + SearchAction) | C15, C20 | **P1** |
| **M-07-F3** | **Header: busca inline expandível** | C10 | P2 |
| M-07-F4 | SEO global og:image dinâmico da loja | C07 | P2 |

---

## 5. Gate M0 — Aceite

- [x] Matriz de capacidades (20 items)
- [x] 4 lacunas com causa raiz
- [ ] Executar M-07-F1, F2, F3
