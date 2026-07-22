# Auditoria A2 — Inventário de Controles

> **Data da Revisão:** 21/07/2026  
> **Commit Analisado:** 5865d731  
> **Status:** Finalizado (Inventário, sem correção em código).  
> **Métrica Macro:** 101 arquivos de interface contêm controles interativos de mutação (Forms, Inputs, Buttons).

## 1. Cadeias Funcionais Validadas (As que persistem via Contrato)

As entidades centrais operam sob arquitetura estrita:
\CONTROLE VISUAL -> evento do usuario -> handler de estado -> validacao do cliente -> server function -> repository -> tabela -> invalidate router.\

Exemplos Auditados:
- **CheckoutForm (_store.checkout.tsx)**:
  - *Fluxo*: onChange (CEP) -> calculateShipping -> updateCartShipping. onClick Finalizar -> processCheckout -> initiatePaymentTransaction -> Success.
  - *Status*: COMPROVADO. Nao ha concorrencia com o BD na interface.
- **QuickNewProductPage (admin.catalogo.produtos.novo.tsx)**:
  - *Fluxo*: useForm -> onSubmit -> createProduct -> Supabase Auth/RPC -> toast.success -> navigate.
  - *Status*: COMPROVADO.

## 2. Controles Orfaos e Mortos (CONTROLE_ORFAO)

Componentes com botoes ou formularios desenhados na tela, mas que nao possuem acoes atreladas ou as acoes apenas param na interface, nao chegando ao banco ou API:

- **components/commerce/dynamic-sections/product-carousel.tsx**: Botao 'Ver Colecao' desenhado, mas sem destino atrelado.
- **components/commerce/dynamic-sections/product-grid.tsx**: Botao 'Carregar Mais' falso (layout only).
- **components/commerce/dynamic-sections/split-banner.tsx**: Botao sem link.
- **lib/error-page.ts**: Fallbacks sem recarregamento hard.
- **routes/admin.builder.analytics.tsx**: Selects de tempo (7 dias, 30 dias) mortos.
- **routes/admin.configuracoes.etapas.tsx**: Formularios renderizados quebram por falta de action server-side.
- **routes/admin.destaques.tsx**: Tabela de Destaques estatica.
- **routes/admin.index.tsx**: Graficos sem reload actions.
- **routes/_store.conta.index.tsx**: Atalhos mortos.
- **routes/_store.index.tsx**: Banners hardcoded de placeholder.

## 3. Controles Suspeitos

- **admin.caixa.lancamentos.tsx**: Fluxos complexos de sangria que dependem de estado local intenso. (Validar em runtime).
- **admin.pedidos.\.tsx** vs **admin.pedidos.trocas.tsx**: Acoes de aceitar/recusar fluxo chamando mutacoes nao consolidadas.

## 4. O Veredito de Seguranca (BD vs UI)

- **Fato**: ZERO ocorrencias de supabase.from() vazando nos componentes interativos. A camada Transacional isolou efetivamente o controle de acesso.
