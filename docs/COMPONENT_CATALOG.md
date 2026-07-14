# COMPONENT_CATALOG.md — Hr Shoes Commerce

> Componentes canônicos e seus estados obrigatórios. Fonte de verdade de UI
> junto de `DESIGN.md`. Todo componente de dado/ação implementa: **loading,
> empty, error, permission, disabled, unconfigured** (ver `DESIGN.md` §5), além
> de default/success quando aplicável. Nenhum componente faz cálculo comercial
> no cliente.

## Camadas
- `src/components/ui` — primitivos shadcn (adaptados por variantes/tokens).
- `src/components/commerce` — vitrine pública.
- `src/components/admin` — painel.
- `src/components/state` — estados reutilizáveis.

## Estados (src/components/state)
| Componente | Uso | Estados que representa |
|---|---|---|
| `EmptyState` | Sem dados (honesto, sem fake) | empty |
| `ErrorState` | Falha de carga + retry | error |
| `PermissionState` (alias de `PermissionDenied`) | Sem autorização | permission |
| `UnconfiguredState` | Integração sem credencial | unconfigured |
| `LoadingState` | Indicador central com `role="status"` | loading |
| `ProductCardSkeleton` / `ProductGridSkeleton` / `LinesSkeleton` | Carregamento sem layout shift | loading |
| `StatusBadge` | Pílula de status por token (`unconfigured/testing/active/error/planned`) | status |
| `SectionFrame` | Wrapper de seção com eyebrow/título/ação | — |
| `PlannedFeature` / `PhaseGate` (admin) | Funcionalidade não construída | "Planejado para a Fase X" (somente painel) |

## Vitrine (src/components/commerce)
| Componente | Descrição | Notas de estado |
|---|---|---|
| `BrandLogo` / `Logo` | Marca real Hr Shoes (imagem) | — |
| `PublicHeader` | Cabeçalho + menu mobile (Sheet) | navegação sempre válida (derivada do registry) |
| `MobileBottomNav` / `BottomNav` | Navegação inferior sticky (mobile) | alvos >= 44px, `pb-safe` |
| `PublicFooter` | Rodapé com colunas | links reais |
| `PageHeader` | Título/eyebrow/ações | responsivo (grid + min-w-0) |
| `ProductCard` | Card de produto (DTO server-side) | loading via skeleton; sem cálculo local |
| `PriceDisplay` | Formata cents+BRL do servidor | apenas formatação, nunca cálculo |

## Painel (src/components/admin)
| Componente | Descrição | Notas |
|---|---|---|
| `AdminShell` | Sidebar recolhível (desktop) + topbar + bottom nav (mobile) | responsivo, safe-area |
| `PlannedFeature` / `PhaseGate` | Estado honesto de fase | nunca na vitrine |

## Acessibilidade (todos)
- Alvos interativos >= 44x44px; foco visível (ring = brand); navegação por teclado.
- Ícones decorativos com `aria-hidden`; ícones de ação com `aria-label`.
- Respeita `prefers-reduced-motion`; contraste WCAG 2.2 AA.

## Regra de dados
- Componentes nunca acessam Supabase diretamente nem calculam preço/desconto/
  frete/estoque. Consomem DTOs da camada de serviços (`src/services`).
