# Dossier — M-02: Catálogo de Produtos
> Documento de análise profunda do módulo. Gerado: 2026-07-19
> Fase atual: M0 (Inventário completo + criação do dossier)

---

## 1. Escopo do Módulo

O módulo M-02 cobre todas as capacidades relacionadas a produtos na plataforma:
catálogo, busca, filtros, categorias, coleções, variantes, mídia e cross-sell.

**Fronteiras:** Tabelas `products`, `product_variants`, `product_media`, `categories`, `collections`, `product_categories`, `product_collections`. Inclui serviços de leitura pública (`catalog.functions.ts`) e de escrita admin (`admin-catalog.functions.ts`).

---

## 2. Arquivos Diretamente Relacionados

### Serviços (BFF)
| Arquivo | Responsabilidade |
|---------|----------------|
| `src/services/catalog.functions.ts` | Leitura pública: listagem, busca, PDP, coleções, promoções |
| `src/services/admin-catalog.functions.ts` | CRUD admin: criar/editar produto, variantes, mídia, categorias |
| `src/services/product.functions.ts` | `getProductBySlug` — PDP consumer |

### Rotas UI — Vitrine
| Arquivo | Rota | Status |
|---------|------|--------|
| `_store.catalogo.tsx` | `/catalogo` | ✅ existe — sem filtros reais |
| `_store.buscar.tsx` | `/buscar` | 🟡 funciona via `.ilike("name")` — sem FTS |
| `_store.produto.$slug.tsx` | `/produto/:slug` | ✅ completo — media, variantes, frete, avaliações |
| `_store.categoria.$slug.tsx` | `/categoria/:slug` | 🟡 rota existe — passa `categorySlug` para `listPublishedProducts` |
| `_store.colecao.$slug.tsx` | `/colecao/:slug` | 🟡 rota existe mas estruturalmente básica |

### Rotas UI — Admin
| Arquivo | Rota | Status |
|---------|------|--------|
| `admin.catalogo.produtos.index.tsx` | `/admin/catalogo/produtos` | ✅ lista com busca |
| `admin.catalogo.produtos.novo.tsx` | `/admin/catalogo/produtos/novo` | ✅ formulário completo |
| `admin.catalogo.produtos.$id.tsx` | `/admin/catalogo/produtos/:id` | ✅ editor avançado |
| `admin.catalogo.categorias.index.tsx` | `/admin/catalogo/categorias` | ✅ gerenciamento |
| `admin.catalogo.colecoes.index.tsx` | `/admin/catalogo/colecoes` | ✅ gerenciamento |
| `admin.catalogo.atributos.tsx` | `/admin/catalogo/atributos` | ✅ FieldDefinitions |
| `admin.catalogo.tipos.tsx` | `/admin/catalogo/tipos` | ✅ ProductTypes |

---

## 3. Matriz de Capacidades (Capability Matrix)

| ID | Capacidade | Backend | UI Admin | UI Vitrine | Busca | Score |
|----|-----------|---------|----------|-----------|-------|-------|
| M-02-C01 | CRUD de produto (criar/editar/arquivar) | ✅ | ✅ | — | — | A |
| M-02-C02 | Tipos de produto + FieldDefs versionadas | ✅ | ✅ | — | — | A |
| M-02-C03 | Variantes (SKU, atributos, preço override) | ✅ | ✅ | ✅ | — | A |
| M-02-C04 | Mídia de produto + variante (upload) | ✅ | ✅ | ✅ | — | A |
| M-02-C05 | Categorias em árvore hierárquica | ✅ | ✅ | 🟡 sem filtro lateral | — | B |
| M-02-C06 | Coleções curadas | ✅ | ✅ | 🟡 rota básica | — | B |
| M-02-C07 | Atributos filtráveis + comparáveis | ✅ | ✅ | 🔴 sem filtro na vitrine | — | D |
| M-02-C08 | SEO por produto (seo_title, seo_desc) | ✅ | ✅ | 🟡 sem head dinâmico real | — | C |
| M-02-C09 | PDP (página de detalhe de produto) | ✅ | — | ✅ | — | A |
| M-02-C10 | Listagem paginada (cursor-based) | ✅ | ✅ | 🟡 sem load-more UI | — | C |
| M-02-C11 | Busca full-text | 🟡 `.ilike` básico (sem trigram) | — | 🟡 funcional | — | C |
| M-02-C12 | Filtro por categoria no catálogo | ✅ backend | — | 🔴 sem UI de filtros | — | D |
| M-02-C13 | Ordenação (preço asc/desc, novos) | 🟡 backend aceita param | — | 🟡 select decorativo | — | C |
| M-02-C14 | Produtos relacionados / cross-sell | 🔴 sem serviço | — | 🟡 seção existe no PDP | — | D |
| M-02-C15 | Produtos em promoção (compare_at) | ✅ `getPromotionalProducts` | ✅ | ✅ badge de % | — | A |
| M-02-C16 | Stock badge em tempo real no card | ✅ | — | ✅ | — | A |
| M-02-C17 | Import/export CSV | 🔴 | 🔴 | — | — | F |
| M-02-C18 | Publicação agendada | 🔴 | 🔴 | — | — | F |
| M-02-C19 | SEO head dinâmico (title/og:image por produto) | 🟡 sem implementação real | — | 🟡 | — | D |
| M-02-C20 | Galeria swipeable mobile no PDP | ✅ strip vertical | — | 🟡 sem swipe touch | — | C |

**Legenda:** A=excelente · B=bom · C=aceitável · D=inadequado · F=ausente

---

## 4. Lacunas Críticas (Causa Raiz)

### Lacuna #1 — Filtros no Catálogo Ausentes (M-02-C07, M-02-C12, M-02-C13)
**Causa raiz:** O backend de `listPublishedProducts` já aceita `categorySlug` como parâmetro, mas a UI do catálogo (`_store.catalogo.tsx`) não renderiza nenhum painel de filtros — o `<Sheet>` de filtros existe mas está vazio. O sort select é decorativo (sem `useNavigate`).

**Impacto:** A cliente não consegue filtrar por categoria, faixa de preço ou ordenar os produtos na vitrine. Isso prejudica diretamente a conversão.

**Solução:** Conectar o sort select ao URL search param; criar sidebar de categorias com checkboxes; passar filtros para o loader via `validateSearch`.

### Lacuna #2 — Busca sem Full-Text Search (M-02-C11)
**Causa raiz:** `searchProducts` usa `.ilike("name", ...)` que faz uma pesquisa LIKE em apenas um campo (`name`). Não indexa `title`, `description`, `brand`, nem usa `pg_trgm`.

**Impacto:** Buscar por "rosa" não encontra produtos com cor rosa; busca por "36" não encontra tamanho 36. Resultados imprecisos.

**Solução:** Adicionar índice GIN trigram no Postgres e buscar em múltiplos campos com OR.

### Lacuna #3 — SEO Dinâmico por Produto Ausente (M-02-C19)
**Causa raiz:** O `head()` da rota `_store.produto.$slug.tsx` retorna um título fixo `"Hr Shoes — Produto"` em vez de usar o nome real do produto. Sem `og:image`, `og:description`, ou `canonical`.

**Impacto:** Todos os produtos compartilham o mesmo title no Google/redes sociais. Zero diferenciação para SEO.

### Lacuna #4 — Produtos Relacionados Sem Serviço (M-02-C14)
**Causa raiz:** A seção de cross-sell existe no PDP mas não tem nenhum serviço conectado — sem dados reais.

---

## 5. Jornadas Mapeadas

### J1 — Cliente navega pelo catálogo e filtra por categoria
1. `/catalogo` → lista produtos → **GAP**: sem filtros laterais → cliente não encontra o que quer
2. Workaround atual: clicar no menu de categoria → `/categoria/:slug` → lista filtrada

### J2 — Cliente busca por produto
1. `/buscar` → digita "bota" → retorna resultados → ✅ funciona
2. `/buscar` → digita "36" ou "rosa" → 0 resultados → ❌ LIKE não encontra atributos

### J3 — Cliente visualiza produto e compara opções
1. `/produto/:slug` → galeria de mídia → seletor de cor/tamanho → CTA → frete → avaliações
2. ✅ Completo — sem swipe touch em mobile e sem produtos relacionados ao final

---

## 6. Microfases Priorizadas

| # | Microfase | Capacidades | Estimativa | Prioridade |
|---|-----------|-------------|-----------|-----------|
| **M-02-F1** | **Filtros reais no catálogo** (sort + categoria + preço) | M-02-C07, C12, C13 | 1 sessão | **P1 — conversão direta** |
| **M-02-F2** | **SEO dinâmico por produto** (head title + og:image + canonical) | M-02-C19, C08 | 0.5 sessão | **P1 — visibilidade orgânica** |
| **M-02-F3** | **Busca melhorada** (multi-campo + trigram migration) | M-02-C11 | 0.5 sessão | P1 |
| M-02-F4 | Produtos relacionados (serviço + seção PDP) | M-02-C14 | 1 sessão | P2 |
| M-02-F5 | Galeria swipeable mobile (Embla) | M-02-C20 | 0.5 sessão | P2 |

---

## 7. Gate M0 — Aceite

- [x] Dossier criado com matriz de capacidades completa
- [x] 4 lacunas identificadas com causa raiz
- [x] 3 jornadas mapeadas com gaps explícitos
- [x] 5 microfases priorizadas
- [ ] Executar M-02-F1, F2, F3 (agrupadas por coesão)
