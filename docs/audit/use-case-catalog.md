# G7: Use-Case Catalog (Catálogo de Casos de Uso HR Shoes)

> **Catálogo Canônico dos Casos de Uso Ponta a Ponta da HR Shoes Commerce**

---

## 1. Casos de Uso do Catálogo e Produtos

### UC-PRODUCT-001 — Criar Produto com Matriz Rápida de Tamanho e Cor
- **Ator**: Administrador, Gerente de Catálogo
- **Pré-condições**: Usuário autenticado com role `staff`/`admin` e loja ativa.
- **Entrada**: Título "Tênis Runner Pro", Preço Base "299,90", Tamanhos `35, 36, 37, 38`, Cores `Preto, Nude`, Estoque Inicial `10`.
- **Fluxo Principal**:
  1. O lojista acessa `/admin/catalogo/produtos/novo`.
  2. Preenche nome do produto e preço.
  3. Clica nos chips de tamanhos e cores no card de Variações Rápidas.
  4. Define o estoque inicial (10 un/variação).
  5. Clica em "Salvar & Continuar".
  6. O BFF `createProduct` valida a matriz (8 variações geradas).
  7. Insere produto em `products`, 8 variantes em `product_variants` e 8 lançamentos iniciais em `stock_movements`.
  8. O lojista é redirecionado para `/admin/catalogo/produtos/$id`.
- **Efeitos Colaterais**: Produto disponível imediatamente no catálogo e na vitrine pública.

---

## 2. Casos de Uso do Carrinho e Checkout

### UC-CART-001 — Adicionar ao Carrinho e Reservar Estoque
- **Ator**: Cliente (Guest ou Autenticado)
- **Pré-condições**: Produto ativo na loja com pelo menos 1 variante com saldo `available > 0`.
- **Entrada**: `productId` ou `variantId`, `quantity: 1`.
- **Fluxo Principal**:
  1. O cliente acessa `/produto/$slug` na loja pública.
  2. Seleciona a numeração desejada ou usa a seleção padrão.
  3. Clica em "Adicionar ao Carrinho".
  4. O BFF `addToCart` resolve a variante e invoca a RPC PostgreSQL `reserve_stock_for_cart`.
  5. O banco trava o estoque por 15 minutos e insere o item na tabela `cart_items`.
  6. A UI recebe o `CartDTO` atualizado e abre automaticamente o carrinho lateral (`SlideOutCart`).
- **Efeitos Colaterais**: Contador de carrinho na barra superior atualiza em tempo real.

---

## 3. Casos de Uso do Builder e Temas

### UC-BUILDER-001 — Selecionar e Aplicar Tema da Vitrine
- **Ator**: Lojista, Designer da Loja
- **Pré-condições**: Rascunho da experiência Home ativo em `experience_documents`.
- **Entrada**: Seleção do preset `pipeline-minimal` no modal de temas.
- **Fluxo Principal**:
  1. O lojista abre o editor em `/admin/builder/$documentId/editor`.
  2. Clica no botão "Trocar Template (Temas)".
  3. Visualiza os 10 presets da biblioteca `HOME_TEMPLATES_LIBRARY`.
  4. Clica em "Aplicar Tema".
  5. O BFF `applyHomeTemplate` grava a nova árvore de nodes e gera uma versão em `experience_versions`.
  6. O Canvas do Editor recarrega com a nova vitrine.
- **Efeitos Colaterais**: A vitrine pública exibe o novo tema assim que for publicado.
