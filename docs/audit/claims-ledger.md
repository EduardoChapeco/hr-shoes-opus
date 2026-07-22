# G2: Claims Ledger (Auditoria de Alegações)

Este documento destrincha todas as alegações de conclusão feitas historicamente na plataforma HR Shoes Commerce, revalidando-as de forma adversarial contra a execução real em runtime.

## Classificações Oficiais
`COMPROVADO` | `PARCIAL` | `QUEBRADO` | `MOCKADO` | `SIMULADO` | `HARDCODADO` | `DUPLICADO` | `OCULTO` | `ÓRFÃO` | `DESCONECTADO` | `NÃO IMPLEMENTADO` | `BLOQUEADO`

---

### Alegação 1: "Editor de Produtos Finalizado"
- **Prometido:** Editor capaz de criar e editar produtos com matriz de variantes, mídias e preview ao vivo no mesmo layout.
- **Implementado:** `admin.catalogo.produtos.$id.tsx` e `admin.catalogo.produtos.novo.tsx`.
- **Diagnóstico em Runtime:** O formulário funciona no backend, mas continha desestruturação `.data` quebrada (`res.data` em vez de `res`), impedindo o carregamento dos dados ao abrir a rota `/admin/catalogo/produtos/$id`. O código de criação e edição estava duplicado entre `novo.tsx` e `$id.tsx`.
- **Classificação:** `PARCIAL` / `DUPLICADO` / `QUEBRADO NA UI`

### Alegação 2: "Remoção dos Envelopes {status, data} no BFF"
- **Prometido:** Refatoração de toda a camada BFF para que nenhuma Query usasse envelopes `{ status, data }`, retornando o DTO direto e lançando erros nativamente.
- **Implementado:** Refatoração em massa dos arquivos `*.functions.ts`.
- **Diagnóstico em Runtime:** As UIs dos componentes e loaders das rotas continuaram checando `res.data` e `res.status`. Isso gerou um descompasso de propagação (Padrão 3) em mais de 100 rotas do TanStack Router, fazendo com que telas fiquem em branco ou estourem erros de destruturação de `undefined`.
- **Classificação:** `QUEBRADO` / `ALTERADO, MAS NÃO COMPROVADO`

### Alegação 3: "Upload de Mídia 100% Funcional"
- **Prometido:** Upload inline de imagens e vídeos com suporte a crop e focal point vinculado ao bucket Supabase Storage.
- **Implementado:** Componente `ImageUpload` e `ImageCropperDialog`.
- **Diagnóstico em Runtime:** O uploader visual funciona no cliente, mas a rota `novo.tsx` não vinculava mídias por variante no ato do primeiro salvamento. Dependia de salvar o produto e depois abrir a tela de edição `$id.tsx`.
- **Classificação:** `PARCIAL` / `DESCONECTADO NO CADASTRO INICIAL`

### Alegação 4: "Builder e Renderização Dinâmica Inteiramente Sincronizados"
- **Prometido:** O Builder e as páginas públicas usam a mesma árvore canônica de blocos via `ExperienceRenderer`.
- **Implementado:** `ExperienceRenderer` em `src/components/commerce/experience-renderer.tsx` e `builder.functions.ts`.
- **Diagnóstico em Runtime:** A estrutura de renderização é idêntica e canônica. Porém, dados dinâmicos de produtos inseridos nos blocos do Builder (ex: destaques da Home) guardam cópia de snapshot no JSON da experiência em vez de resolver dinamicamente no catálogo por ID, causando desalinhamento quando o Admin altera o preço do produto no catálogo.
- **Classificação:** `PARCIAL` / `AÇÃO SEM PROPAGAÇÃO`

### Alegação 5: "Estoque Sincronizado e Idempotente no Carrinho"
- **Prometido:** Reserva atômica de estoque ao adicionar ao carrinho (`reserve_stock_for_cart`) e trava por 15 minutos.
- **Implementado:** Migrations RPC `0025` e `0026`, chamadas em `cart.functions.ts`.
- **Diagnóstico em Runtime:** A reserva atômica no Postgres funciona perfeitamente no backend. Porém, quando um item com estoque zerado no Admin tenta ser adicionado pelo cliente, a exceção é tratada na UI por um toast simples, mas a listagem de alertas no Admin (`admin.estoque.alertas.tsx`) estava ilegível devido ao erro de DTO desestruturado (`res.data`).
- **Classificação:** `COMPROVADO NO BANCO` / `QUEBRADO NA UI DE ADMIN`

### Alegação 6: "Suíte de 134 Testes Unitários Passando"
- **Prometido:** Todos os 134 testes do Vitest passando com 100% de sucesso.
- **Implementado:** Arquivos `src/services/*.test.ts`.
- **Diagnóstico em Runtime:** Os testes passam porque utilizam mocks abrangentes de `getServerClient` e Supabase. Porém, em runtime real com SSR via TanStack Start, os cookies da requisição podem ser perdidos se a chamada não passar pelo `getSSRClient()`, mascarando problemas de autenticação de sessão do usuário.
- **Classificação:** `MOCKADO` / `ALTERADO, MAS NÃO COMPROVADO EM SSR REAL`
