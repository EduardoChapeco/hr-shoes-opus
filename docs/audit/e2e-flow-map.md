# G7: E2E Flow Map (Mapeamento dos 8 Fluxos Verticais HR Shoes)

> **Mapeamento de Fluxos Ponta a Ponta Rastreando do Cadastro à Entrega**

---

## 1. Fluxo Vertical de Produto & Catalogo
```
Admin Form (/admin/catalogo/produtos/novo)
  ➔ BFF createProduct (valida Contract Shield)
  ➔ PostgreSQL insert (products, product_variants, stock_movements)
  ➔ Dynamic Binding (hydrateBindings no BFF Builder)
  ➔ Storefront Home / PDP (/produto/$slug)
  ➔ Cliente visualiza preço em BRL e seleciona cor/tamanho
```

## 2. Fluxo Vertical de Carrinho & Reserva de Estoque
```
Cliente clica em "Adicionar ao Carrinho"
  ➔ BFF addToCart (resolve variante)
  ➔ RPC PostgreSQL reserve_stock_for_cart (stock_reserved + 1, expira em 15min)
  ➔ Reconciliação DTO no CartProvider
  ➔ Abertura automática do SlideOutCart
  ➔ Persistência de cookie hr_shoes_guest_session / customer_id
```

## 3. Fluxo Vertical de Checkout & Transação
```
Cliente clica em "Finalizar Compra" (/checkout)
  ➔ BFF processCheckout
  ➔ RPC PostgreSQL process_checkout_transaction_v2
  ➔ Validação de cupom + cotação de frete + travamento de estoque
  ➔ Inserção atômica em orders e order_items
  ➔ Redirecionamento para confirmação /pedido/$token
```

## 4. Fluxo Vertical do Builder & Temas de Vitrine
```
Lojista seleciona preset no Editor Visual
  ➔ BFF applyHomeTemplate
  ➔ Gravação atômica da árvore de seções em experience_versions
  ➔ Re-renderização do Canvas com ExperienceRenderer
  ➔ Publicação do documento
  ➔ Rota pública _store.index.tsx serve novo layout com hidratação dinâmica
```

## 5. Fluxo Vertical de Caixa & Operação PDV
```
Vendedora acessa /admin/caixa
  ➔ Abertura de Sessão de Caixa (openCashSession)
  ➔ Venda presencial ou sangria (cash_movements)
  ➔ Atualização em tempo real do saldo em caixa
  ➔ Fechamento de caixa com conferência de valores
```

## 6. Fluxo Vertical de Avaliações & Prova Social
```
Cliente acessa PDP e preenche formulário de avaliação
  ➔ BFF submitProductReview
  ➔ Gravação com status pendente em reviews
  ➔ Moderação no Admin
  ➔ Exibição na média de estrelas e comentários aprovados da PDP
```

## 7. Fluxo Vertical de CRM & Gestão de Clientes
```
Cliente realiza primeira compra ou se cadastra
  ➔ Criação de registro em customers e customer_addresses
  ➔ Registro no funil crm_leads
  ➔ Histórico de compras vinculado ao perfil do cliente no Admin
```

## 8. Fluxo Vertical de Logística & Expedição
```
Pedido é marcado como pago (paid)
  ➔ Criação automática de registro em shipments
  ➔ Impressão de etiqueta e código de rastreamento
  ➔ Transição de estado para enviado (shipped) e notificação do cliente
```
