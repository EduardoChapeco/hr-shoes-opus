# Builder Execution Ledger
_Criado: 2026-07-20 | Fase atual: B1 — Congelado para revisão_

---

## MAPA DE REQUISITOS

| Requisito | Página | Microfase | Arquivo | Tabela | Status |
|---|---|---|---|---|---|
| Homepage editável | `/` | B3→B4 | `_store.index.tsx` | `experience_documents` | **PENDENTE** |
| Perfil público editável | `/perfil-da-loja` | B5 | `_store.perfil-da-loja.tsx` | `experience_documents` | **REMOVIDO PREMATURAMENTE** |
| Landing pages | `/paginas/:slug` | B5 | `_store.paginas.$slug.tsx` | `experience_documents` | **COMPILOU, NÃO COMPROVADO** |
| Biolinks (Builder) | `/bio/:slug` | B6 | `_store.bio.$slug.tsx` | `experience_documents` | **COMPILOU, NÃO COMPROVADO** |
| Vitrines de vendedoras | `/vendedora/:slug` | B5 | `_store.vendedora.$slug.tsx` | `experience_documents` | **COMPILOU, NÃO COMPROVADO** |
| Templates seed (homepage) | Builder UI | B3 | `builder.functions.ts` | `experience_nodes` | **ALTERADO, NÃO COMPROVADO** |
| Preview real = página pública | Builder editor | B3 | editor + renderer | — | **PENDENTE** |
| Renderer canônico único | todos | B2 | `experience-renderer.tsx` | — | **PARCIAL** |
| Data bindings server-side | todos blocos | B2→B7 | renderer | — | **MOCKADO** |
| Publicação + versões | Builder editor | B4 | `builder.functions.ts` | `experience_versions` | **PENDENTE** |
| Rollback de versão | Builder editor | B4 | builder | `experience_versions` | **PENDENTE** |
| Produtos reais na seção | `/` | B3→B4 | `product-carousel.tsx` | `products` | **PARCIAL (client-side)** |
| Mídia real na galeria | todos | B7 | `gallery-grid.tsx` | `media` | **PENDENTE** |
| Formulários reais | todos | B7 | `contact-form.tsx` | — | **PENDENTE** |
| Analytics reais | todos blocos | B7 | `analytics-provider.tsx` | — | **PENDENTE** |
| Remoção de mocks | todos | B8 | vários | — | **PENDENTE** |
| Remoção legado perfil | `/perfil-da-loja` | B5 (depois de paridade) | legado | — | **REMOVIDO SEM PARIDADE** |
| Migração biolink | `/links`, `/bio/:slug` | B6 | `admin.link-da-bio.tsx` | — | **REMOVIDO SEM MIGRAÇÃO** |

---

## AUDITORIA DOS BLOCOS

| Bloco | Registro | Renderer | Schema | Salva BD | Reload | Preview | Pub. | Dados reais | Loading state | Empty state | Error state | RLS | Status Final |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `hero_carousel` | ✅ | ✅ | ✅ | ? | ? | ? | ? | ❌ (content.banners manual) | ? | ? | ? | ? | **PARCIAL** |
| `product_carousel` | ✅ | ✅ | ✅ | ? | ? | ? | ? | ⚠️ client-side useQuery | ✅ | ✅ | ❌ | ❌ | **PARCIAL** |
| `product_grid` | ✅ | ✅ | ✅ | ? | ? | ? | ? | ⚠️ client-side useQuery | ✅ | ✅ | ❌ | ❌ | **PARCIAL** |
| `split_banner` | ✅ | ✅ | ✅ | ? | ? | ? | ? | ❌ (conteúdo manual) | ? | ? | ? | ? | **PARCIAL** |
| `rich_text` | ✅ | ✅ | ✅ | ? | ? | ? | ? | N/A (editorial) | N/A | N/A | ❌ | N/A | **PARCIAL** |
| `testimonial_carousel` | ✅ | ✅ | ✅ | ? | ? | ? | ? | ⚠️ client-side useQuery | ? | ? | ❌ | ❌ | **PARCIAL** |
| `timeline_history` | ✅ | ✅ | ✅ | ? | ? | ? | ? | ❌ (items manual) | ? | ? | ? | ? | **PARCIAL** |
| `bento_grid` | ✅ | ✅ | ✅ | ? | ? | ? | ? | ❌ (items manual) | ? | ? | ? | ? | **PARCIAL** |
| `countdown_timer` | ✅ | ✅ | ✅ | ? | ? | ? | ? | ❌ (target_date manual) | N/A | ✅ | ? | N/A | **PARCIAL** |
| `trust_badges` | ✅ | ✅ | ✅ | ? | ? | ? | ? | ❌ (items manual) | ? | ? | ? | ? | **PARCIAL** |
| `stories_ring` | ✅ | ✅ | ✅ | ? | ? | ? | ? | ❌ (stories manual) | ? | ? | ? | ? | **PARCIAL** |

**Legenda:** ✅ = comprovado | ⚠️ = presente mas com ressalvas | ❌ = ausente | ? = não verificado em runtime

> **IMPORTANTE:** NENHUM bloco tem todas as colunas marcadas como ✅. Nenhum bloco pode ser classificado como "COMPROVADO". Todos são **PARCIAL** no mínimo.

---

## MATRIZ DE ROTAS — ESTADO ATUAL

| Rota | Estado | Dados usados | Builder Doc | Seed | Renderer | Migração | Cutover | Legado removido |
|---|---|---|---|---|---|---|---|---|
| `/` | dinâmico (Builder) | experience_documents | slug=home | homepage_classic (NOVO) | ExperienceRenderer | feita | ✅ | N/A |
| `/perfil-da-loja` | **REMOVIDO SEM PARIDADE** | experience_documents | slug=institucional | — | ExperienceRenderer | ❌ não feita | ❌ prematuro | ⚠️ apagado sem prova |
| `/paginas/:slug` | dinâmico (Builder) | experience_documents | qualquer storefront | — | ExperienceRenderer | — | — | — |
| `/bio/:slug` | dinâmico (Builder) NOVO | experience_documents | document_type=biolink | biolink_classic | ExperienceRenderer | — | — | — |
| `/links` | **APAGADO** | — | — | — | — | ❌ não migrado | ❌ prematuro | ✅ removido |
| `/vendedora/:slug` | dinâmico (Builder) | experience_documents | document_type=seller_showcase | — | ExperienceRenderer | — | — | — |
| `/catalogo` | fixo (estático) | catalog.functions | — | — | — | B5 futura | não | não |

