# Auditoria Forense — Falhas Silenciosas (`docs/audit/silent-failures.md`)

Este documento mapeia os pontos críticos do sistema onde falhas de conexão, banco de dados ou autenticação são silenciosamente engolidas por blocos `try/catch` inadequados ou fallbacks sem logs.

## 1. Tratamento Genérico em Loaders
- **Páginas de Storefront e BioLinks**:
  - **Arquivo**: `src/routes/_store.paginas.$slug.tsx` e `_store.vendedora.$slug.tsx`.
  - **Código**:
    ```tsx
    const res = await getPublicExperienceDocumentBySlug({ data: { slug: params.slug, document_type: "storefront" } })
      .catch(() => ({ status: "error", data: null }));
    ```
  - **Impacto**: Se o banco Supabase cair ou se houver estouro de memória, o catch engole a exceção e retorna um objeto `{ status: "error", data: null }`. A UI então renderiza uma mensagem de erro genérica sem informar o código do erro ou registrar o log técnico.

## 2. Inserção de Eventos no Analytics
- **Telemetria do Builder**:
  - **Arquivo**: `src/services/telemetry.functions.ts`, Linha 39-41.
  - **Código**:
    ```tsx
    if (error) {
      console.error("Failed to track builder event", error);
    }
    ```
  - **Impacto**: A falha na persistência do analytics é apenas registrada com `console.error` no servidor e a função retorna `{ status: "ok" }` com sucesso visual para o cliente. Embora o analytics não deva travar a navegação do usuário (falha aceitável), não há alertas estruturados ou métricas de erro associadas a essas rejeições silenciosas de escrita no Supabase.

## 3. Gestão de Caixa e Lançamentos
- **Sangria de Gaveta**:
  - **Arquivo**: `src/routes/admin.caixa.index.tsx`
  - **Código**: Lançamentos manuais disparados via modal que ativam toasts de sucesso temporários sem certificar se o RPC executou a transação ACID correspondente de forma isolada e se o saldo do caixa foi atualizado na tela do usuário instantaneamente (ou se necessita de recarga manual).
