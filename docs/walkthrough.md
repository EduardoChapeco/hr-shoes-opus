# Hr Shoes Commerce — Auditoria Forense e Estabilização

Este documento resume as investigações, refatorações e os procedimentos de deploy completo executados no projeto **hr-shoes-opus**.

---

## 1. Correções do Design System e Limpeza de Hardcodes

- **Badge.tsx**: Introduzidas variantes semânticas (`info`, `success`, `warning`) baseadas em oklch e tokens CSS de `:root` / `.dark`.
- **Eliminação de Hardcodes de Cor**: Subsituídos todos os overrides manuais `bg-green-600`, `bg-blue-600` e `bg-slate-600` nos arquivos `admin.caixa.tsx`, `admin.caixa.turnos.tsx`, `admin.marketing.gift-cards.tsx`, `admin.comissoes.tsx`, `_store.conta.pagamentos.tsx` e `admin.trocas.tsx` pelas novas variantes semânticas da Badge.
- **Escala Tipográfica**: Adicionados os utilitários de escala `@utility text-badge` (0.6rem), `text-meta` (0.72rem) e `text-nav` (0.68rem) no `styles.css`. Migrados todos os hardcodes tipográficos (`text-[0.6rem]`, `text-[0.68rem]`, `text-[10px]`) para estes tokens.

---

## 2. Reconciliação de Contratos e Tipagens

- **Formatador Monetário**: Removidos os helpers locais inline que faziam divisões e formatações inseguras (`price_cents / 100` com `toLocaleString` manual) em `_store.carrinho.tsx`, `_store.checkout.entrega.tsx`, `_store.pedido.$publicToken.confirmacao.tsx` e `admin.catalogo.produtos.tsx`. Todos agora consomem o `formatMoney` centralizado de `src/lib/money.ts` que lida com centavos inteiros de forma segura.
- **Tipagem DTO**: Extraído o contrato inline de produto no painel de administração e criada a interface tipada `AdminProductRow` em `src/types/catalog.ts` para tipar estritamente o retorno de `listAdminProducts`.

---

## 3. Sincronização de Navegação e Rotas

- **Navegação Canônica**: Extirpada a duplicação do array `NAV` em `admin-shell.tsx`. As definições do menu agora são extraídas diretamente da fonte única de verdade em `src/lib/routes.ts` via constantes `ADMIN_SIDEBAR_NAV` e `ADMIN_BOTTOM_NAV`.
- **Mapeador de Ícones**: Criado um mapeador dinâmico de ícones Lucide no shell do painel para manter `routes.ts` 100% livre de imports e acoplamentos do React.

---

## 4. Banco de Dados e Cadastro do Primeiro Admin

- **Migration 0010**: Criado o arquivo de migração `supabase/migrations/0010_auto_profile_trigger.sql`.
- **Trigger de Autocadastro**: Desenvolvido um trigger de PostgreSQL (`handle_new_user`) ativado após a inserção em `auth.users`. Ele cria automaticamente a entrada em `public.profiles`.
- **Primeiro Usuário Administrador**: A função verifica se é o primeiro usuário a se registrar na plataforma. Em caso afirmativo, atribui o papel de `owner` (administrador geral) e cria a organização e a loja padrão (`Hr Shoes`) de forma automatizada para evitar erros de inicialização de persistência.
- **Supabase Deploy**: Sincronizadas as 10 migrações locais com o banco de dados remoto da Supabase (`hfgnageqkeryxsnwobjc`) de forma bem-sucedida via Supabase CLI.

---

## 5. Deploy de Produção (Cloudflare Pages)

- **Vite/Nitro Build**: Compilado com a variável de ambiente `NITRO_PRESET=cloudflare-pages`, gerando os ativos e o arquivo `_worker.js` dentro de `dist/`.
- **Pages Project**: Criado o projeto Pages `eduardochapeco-hr-shoes-opus` na Cloudflare.
- **Deploy Wrangler**: Efetuado o deploy completo na infraestrutura da Cloudflare Pages:
  👉 **https://eduardochapeco-hr-shoes-opus.pages.dev**

---

## 6. Sincronização Git

- **.gitignore**: Adicionado o arquivo `.env` para garantir que credenciais locais de banco de dados e APIs nunca sejam commitadas.
- **Commit & Push**: Alterações integradas à branch `main` e enviadas para o repositório remoto.

---

## 7. Microfase 3H — CRM, Ficha/Carnê e Pagamento/Comprovantes Reais

- **Chave PIX e Instruções Dinâmicas**: Adicionados campos `pix_key` e `payment_instructions` na tabela `stores` (Migration 0044). Atualizados os formulários em `/admin/configuracoes/pagamentos` para persistência no banco e retirados todos os hardcodes da tela de detalhes de pedido do cliente (`/_store/conta/pedidos/$id`).
- **Upload de Comprovantes Real**: Implementado o upload binário via Base64 para o bucket privado `receipts` na Supabase Storage, atualizando a URL de recebimento (`payments.receipt_url`) e marcando o status como `pending_review`.
- **Validação de Contrato**: Corrigidos bugs nos nomes de campos na listagem de itens do pedido (`total_price_cents` -> `total_cents` e `quantity` -> `qty`) para bater exatamente com o schema do banco.
- **Substituição de Confirm/Prompt Dialogs**: Removidos os prompts nativos do navegador (`confirm`, `prompt`) e instalados diálogos baseados em Radix/shadcn em `/admin/comprovantes` e `/admin/configuracoes/pagamentos` para manter fidelidade visual e consistência na plataforma.
- **Deploy**: Deploy atualizado em produção no Cloudflare Pages:
  👉 **https://bd2c7d5b.hrshoes.pages.dev**

