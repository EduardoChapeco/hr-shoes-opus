# G4: Error & Logging Audit

Este documento rege como a plataforma reage a erros, que hoje são massivamente engolidos pelas UIs.

## O Que Encontramos no Passado
- `try { return data } catch { return [] }`
- Servidor caindo silenciosamente no BFF, entregando um array vazio. O React UI renderiza uma tabela vazia com "Nenhum registro encontrado". Isso é desastroso porque apaga evidências de erros de sistema para Lojistas (acham que deletaram o banco).

## Como Deve Ser:

| Status Code | Categoria | Ação na UI React |
| --- | --- | --- |
| `200` | Sucesso | Renderiza Dados |
| `401` | Unauthorized | Redirect para Login (Logout Server-Side) |
| `403` | RLS Blocked / Tenant Errado | Renderiza componente `<Forbidden />` com ícone de erro. |
| `404` | Not Found | Renderiza `<NotFound />` sem engolir erro. |
| `500` | Database Error / Crash | Suspense / ErrorBoundary captura e exibe `<TechnicalError />` na tela, para que o lojista não confunda falha com "Sem Registros". |

A refatoração recém implementada na camada `BFF/Server Functions` visava justamente remover a "blindagem" `{status, data}` para permitir o throw nativo de erros. O problema reside nos componentes que ainda não estão encapsulados em `ErrorBoundaries` no React Router e no Tanstack Query.
