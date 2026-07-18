# Auditoria Forense — Hardcodes (`docs/audit/hardcodes.md`)

Este documento lista tokens, credenciais, segredos e caminhos estáticos ("hardcodes") mapeados no código-fonte do projeto.

## 1. Tokens de Design System Hardcoded
- **Valores Arbitrários em Componentes**: Algumas classes do Tailwind v4 herdadas do layout legado ainda utilizam cores diretas (`bg-white`, `text-black`) ou margens arbitrárias, contornando a folha de estilos centralizada `src/styles.css` e as diretrizes do `DESIGN.md`.
- **Preços e Descontos**: Embora o servidor seja a autoridade, em certos formulários do admin de promoções e cupons, as regras de validação client-side usam limites máximos arbitrários de desconto.

## 2. Instanciação Incorreta de SDKs no Cliente (Bypass de Segurança)
- **Instanciação Manual do Supabase Client**:
  - **Arquivo**: `src/routes/admin.midias.tsx`, Linha 93-97.
  - **Código**:
    ```tsx
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
    );
    ```
  - **Motivo**: Bypass do provedor centralizado `getBrowserClient()`. Expõe variáveis públicas do cliente diretamente em fluxo operacional sem passar pelo BFF ou usar url assinada do storage.

## 3. Slugs e IDs Estáticos de Testes
- **Visual Builder e Experiências**:
  - **Arquivo**: `src/routes/_store.produto.$slug.tsx`, Linha 24.
  - **Código**:
    ```tsx
    getPublicExperienceDocumentBySlug({ data: { slug: "default-product-template", document_type: "product_template" } })
    ```
  - **Motivo**: Utiliza o slug fixo `"default-product-template"` como padrão global para a página de produto híbrida. Caso esse registro não exista no banco, a query falha e a página exibe apenas a Buy Box nativa (fallback aceitável, mas o slug é fixado em código).
- **Vendedora Afiliada Padrão**:
  - Em certos fluxos de comissão ou checkout assistido, se a vendedora ativa não é encontrada nos cookies, o sistema utiliza o ID da organização principal ou do administrador padrão em vez de negar o fluxo ou exigir escolha explícita.
