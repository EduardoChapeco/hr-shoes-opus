# G6: Change Propagation Matrix (Matriz de Propagação de Alterações em 8 Camadas)

Este documento define o checklist obrigatório que deve ser verificado em todas as **8 camadas do sistema** sempre que uma tabela, coluna, schema Zod, contrato ou regra de negócio for alterada na HR Shoes Commerce.

---

## As 8 Camadas da Matriz de Propagação

```
[1. BANCO DE DADOS] ──> [2. CONTRATOS/ZOD] ──> [3. SERVIDOR (BFF)] ──> [4. ADMIN (UI)]
                                                                              │
[8. TESTES/SUÍTE]  <── [7. SEGURANÇA/RLS] <── [6. INTEGRAÇÃO/CACHE] <── [5. VITRINE (CLIENTE)]
```

---

## Checklist por Entidade de Domínio

### 1. Entidade: Produto (`products` & `product_variants`)
- [ ] **1. Banco**: Migration SQL com FKs, índices e constraints de preço/estoque não-negativo.
- [ ] **2. Contratos**: Schemas Zod (`ProductCreateSchema`, `ProductUpdateSchema`, `VariantDTO`) em `src/types/catalog.ts`.
- [ ] **3. Servidor (BFF)**: Functions em `admin-catalog.functions.ts` e `product.functions.ts` usando `getServerIdentity()`.
- [ ] **4. Admin (UI)**: Tabela de produtos, formulário de cadastro `novo.tsx`, editor `$id.tsx` e modal de variantes.
- [ ] **5. Vitrine (Cliente)**: Vitrine `/catalogo`, busca, PDP `/produto/$slug`, seções dinâmicas da Home.
- [ ] **6. Integração/Cache**: Invalidação das Query Keys `["products"]`, `["product", id]`, `["catalog"]`.
- [ ] **7. Segurança/RLS**: Policy de RLS restrita por `store_id` (staff para mutação, anon para leitura de publicados).
- [ ] **8. Testes**: Suíte unitária em `admin-catalog.test.ts` e `product.test.ts` sem mocks fictícios.

### 2. Entidade: Carrinho & Item de Carrinho (`carts` & `cart_items`)
- [ ] **1. Banco**: Tabela de carrinhos com FK para `customers` ou `session_token`.
- [ ] **2. Contratos**: DTO `CartDTO` com subtotal, frete, desconto, total e `isOutOfStock`.
- [ ] **3. Servidor (BFF)**: `addToCart`, `removeFromCart`, `updateCartItemQty`, `applyCouponToCart` em `cart.functions.ts`.
- [ ] **4. Admin (UI)**: Painel de pedidos e visualização de carrinhos abandonados.
- [ ] **5. Vitrine (Cliente)**: Drawer do carrinho, contador no Header, página de checkout `/checkout`.
- [ ] **6. Integração/Cache**: Invalidação imediata de `["cart"]` e sincronização do cookie `hr_shoes_guest_session`.
- [ ] **7. Segurança/RLS**: Anti-hijacking verificando o token do cliente/guest no servidor.
- [ ] **8. Testes**: Testes de reserva atômica de estoque em `cart.test.ts`.

### 3. Entidade: Experiência CMS (`experience_documents`)
- [ ] **1. Banco**: Tabela `experience_documents` com coluna `tree` (JSONB) e tipo `document_type`.
- [ ] **2. Contratos**: Types de blocos (`HeroProps`, `ProductGridProps`, `BiolinkProps`) em `src/types/builder.ts`.
- [ ] **3. Servidor (BFF)**: Functions em `builder.functions.ts` com publicação atômica.
- [ ] **4. Admin (UI)**: Editor WYSIWYG em `admin.builder.$documentId.editor.tsx`.
- [ ] **5. Vitrine (Cliente)**: Renderizador canônico `ExperienceRenderer` em `src/components/commerce/`.
- [ ] **6. Integração/Cache**: Invalidação de `["builder", slug]` ao publicar nova versão.
- [ ] **7. Segurança/RLS**: Leitura pública para documentos marcados como `status: 'published'`.
- [ ] **8. Testes**: Validação de renderização de blocos nulos/desconhecidos sem quebra.
