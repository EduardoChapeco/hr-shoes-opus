# Dossier — M-08: Carrinho e Checkout
> Documento de análise profunda do módulo. Gerado: 2026-07-19
> Fase atual: M0 (Inventário)

---

## 1. Escopo do Módulo

O módulo M-08 gerencia toda a jornada de finalização de compra, desde a adição de produtos 
até a criação do pedido atômico. Envolve a persistência do carrinho, cálculos dinâmicos 
(frete, descontos, acréscimos) e o motor transacional de checkout.

**Fronteiras:** Tabelas `carts`, `cart_items`, `coupons`, `orders`, `order_items`, `payments`. 
Serviços: `cart.functions.ts`, `checkout.functions.ts`, `shipping.functions.ts`, `payment.functions.ts`.

---

## 2. Arquivos Diretamente Relacionados

### Serviços (BFF)
| Arquivo | Responsabilidade |
|---------|----------------|
| `cart.functions.ts` | CRUD do carrinho, associar à sessão ou usuário logado |
| `checkout.functions.ts` | Endpoint atômico de fechamento de pedido (`processCheckout`) |
| `shipping.functions.ts` | Integração viaCEP, transportadoras e tabelas manuais |
| `payment.functions.ts` | Opções de pagamento e parcelamento baseadas em config |
| `cart-helpers.ts` | Helpers de identidade (Guest vs Auth) |

### Banco de Dados (Supabase)
| Artefato | Responsabilidade |
|----------|----------------|
| `process_checkout_transaction_v2` | RPC atômico de checkout (Migration 0025) que move estoque e cria pedido na mesma transação |

### Rotas UI
| Arquivo | Rota | Status |
|---------|------|--------|
| `_store.carrinho.tsx` | `/carrinho` | ✅ Completo, mas básico em UI/UX |
| `_store.checkout.tsx` | `/checkout` | ✅ Completo (multi-step em uma página) |

---

## 3. Matriz de Capacidades (Capability Matrix)

| ID | Capacidade | Backend | UI | Score |
|----|-----------|---------|----|-------|
| M-08-C01 | Sessão de carrinho anônima (Guest) vs Logada | ✅ | ✅ | A |
| M-08-C02 | Mesclagem de carrinho ao fazer login | ✅ | — | B |
| M-08-C03 | Adição/remoção/alteração de quantidade | ✅ | ✅ | B |
| M-08-C04 | Cálculo de frete no carrinho | ✅ | ✅ | B |
| M-08-C05 | Aplicação de cupom de desconto | ✅ | ✅ | B |
| M-08-C06 | Checkout atômico (evitar overselling) | ✅ | ✅ | A |
| M-08-C07 | Suporte a múltiplas formas de pagamento | ✅ | ✅ | A |
| M-08-C08 | Cálculo de parcelamento com/sem juros | ✅ | ✅ | A |
| M-08-C09 | **Side Cart flutuante (Mini-cart global)** | 🔴 | 🔴 | F |
| M-08-C10 | **Ofertas de Cross-sell no carrinho (Compre junto)** | 🔴 | 🔴 | F |
| M-08-C11 | **Recálculo dinâmico de cupom se qty mudar** | 🟡 Falho | 🔴 | D |
| M-08-C12 | Persistência de Contexto UI (Context API global) | 🔴 | 🔴 | F |

---

## 4. Lacunas Críticas (Causa Raiz)

### Lacuna #1 — Ausência de um Side Cart (Mini-cart) Global (M-08-C09, C12)
**Causa raiz:** O sistema não possui um contexto React (`cart-context.tsx`) para gerenciar o estado global do carrinho, forçando navegação de página cheia para `/carrinho` sempre que o cliente interage com a sacola.
**Impacto:** Quebra drástica de UX de e-commerce premium. O usuário perde o contexto da vitrine/catálogo.
**Solução:** Criar `CartProvider`, conectar as server functions, e criar o componente `SlideOutCart`.

### Lacuna #2 — Falta de Inteligência de Cross-sell no Carrinho (M-08-C10)
**Causa raiz:** Nenhuma regra para sugerir "produtos relacionados" quando a sacola abre. 
**Impacto:** Perda de AOV (Average Order Value).
**Solução:** Injetar 2 ou 3 produtos dinâmicos recomendados no footer do mini-cart.

### Lacuna #3 — Cupom de desconto quebra em alterações de carrinho (M-08-C11)
**Causa raiz:** Se um cupom de 10% é aplicado, `discount_cents` é salvo no DB. Se o cliente remove um item, o `discount_cents` no DB não é atualizado até o checkout RPC bater (o que impede a visualização do novo desconto na UI).
**Impacto:** Desalinhamento visual entre subtotais da UI e fechamento real.
**Solução:** O `getCart` deve recomputar ou pelo menos o endpoint de update qty deve re-aplicar a validação do cupom.

---

## 5. Microfases Priorizadas

| # | Microfase | Capacidades | Estimativa | Prioridade |
|---|-----------|-------------|-----------|-----------|
| **M-08-F1** | **Global Cart Context & Slide-out Cart** | C09, C12 | 1.5 sessão | **P1** |
| **M-08-F2** | **Refatoração Dinâmica de Totais do Carrinho** (Cupom auto-recalc) | C11 | 0.5 sessão | **P1** |
| **M-08-F3** | **Cross-sell Dinâmico no Side Cart** | C10 | 1 sessão | P2 |

---

## 6. Gate M0 — Aceite

- [x] Dossier criado com matriz de capacidades.
- [x] 3 lacunas identificadas com causa raiz.
- [ ] Executar M-08-F1 e M-08-F2.
