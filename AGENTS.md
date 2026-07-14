# AGENTS.md — Regras de implementação (Hr Shoes Commerce)

> Regras vinculantes para qualquer pessoa/agente que edite este projeto.
> Nenhuma regra crítica pode existir só no chat. As fontes únicas de verdade
> estão listadas abaixo; em caso de conflito, o documento vence o chat.

## Fontes únicas de verdade

| Assunto | Documento |
| --- | --- |
| Tokens de design, tipografia, estados, responsivo | `DESIGN.md` + `src/styles.css` |
| Plano, escopo, fora de escopo, critérios | `docs/MASTER_PLAN.md` |
| Fases e aceite | `docs/ROADMAP.md` |
| Camadas, cache, filas, observabilidade | `docs/ARCHITECTURE.md` |
| Entidades, invariantes, máquinas de estado | `docs/DOMAIN_MODEL.md` |
| Rotas, permissão, fase | `docs/ROUTES.md` + `src/lib/routes.ts` |
| Segurança, RBAC/RLS, LGPD, uploads, webhooks | `docs/SECURITY.md` |
| Contratos de API/serviços | `docs/API_CONTRACTS.md` |
| Componentes canônicos e estados | `docs/COMPONENT_CATALOG.md` |
| Testes | `docs/TEST_STRATEGY.md` |

O registro tipado de rotas em `src/lib/routes.ts` é a fonte de verdade
programática de navegação e deve espelhar `docs/ROUTES.md`.

## Stack

- TanStack Start + React 19, TypeScript **strict**, Tailwind v4, shadcn/ui.
- Roteamento file-based em `src/routes/`. Data fetching centralizado
  (TanStack Query) — nunca `useEffect + fetch` para carga inicial.
- Estrutura de pastas obrigatória:
  - `src/components/ui` — primitivos shadcn
  - `src/components/commerce` — componentes de vitrine
  - `src/components/admin` — componentes de painel
  - `src/components/state` — estados (empty/error/loading/permission/...)
  - `src/features/*` — features por domínio
  - `src/routes/*` — rotas
  - `src/lib/*` — utilidades, registry de rotas, formatação
  - `src/services/*` — domain services tipados (BFF/server functions)
  - `src/types/*` — tipos de domínio e DTOs
- Nada de `App.tsx` monolítico; nada de `src/pages/`.

## Regras invioláveis

1. **Sem acesso direto ao Supabase em componentes React.** Toda leitura/mutação
   de domínio passa por `src/services/*` (server functions / BFF). Supabase é
   persistência + Auth, protegido por RLS deny-by-default — nunca atalho de
   segurança.
2. **Nenhum cálculo comercial no cliente.** Preço, desconto, frete, comissão,
   estoque e totais são sempre calculados/validados no servidor. O cliente só
   exibe valores retornados.
3. **Dinheiro = integer cents + currency `BRL`.** Nunca float. Formatação via
   `src/lib/money.ts`.
4. **Datas** ISO UTC no armazenamento; exibição em `America/Sao_Paulo` via
   `src/lib/datetime.ts`.
5. **Sem dados fictícios.** Nada de mock APIs, produtos inventados, imagens
   externas aleatórias, fallbacks falsos ou botões sem destino. Funcionalidade
   não construída aparece como "Em breve / Planejado para a Fase X" **somente
   no painel** — nunca simulada como concluída na vitrine.
6. **Integrações** têm status `unconfigured | testing | active | error`. Sem
   credencial => "configuração ausente"; nunca simular sucesso.
7. **Tokens de design** só em `src/styles.css`/`DESIGN.md`. Proibido hex,
   `bg-white`, `text-black`, radius/shadow arbitrários em componentes.
8. **Idempotência e transação** em toda operação financeira/estoque/pedido
   (contratos definidos agora, implementação nas fases seguintes).
9. **Segredos** nunca no bundle/logs. Service role só no servidor.
10. **UUID não substitui autorização.** RBAC no servidor sempre.

## Convenções de código

- `TypeScript strict`; sem `any` implícito; DTOs distintos das entidades.
- Validação compartilhada por schema (`zod`).
- Rotas futuras existem no registry tipado e nos docs, mas **não renderizam
  telas falsas**; no painel abrem `PhaseGate` ("Planejado para a Fase X").
- Componentes de dado/ação implementam: loading, empty, error, permission,
  disabled, unconfigured (ver `DESIGN.md` §5).
- Acessibilidade WCAG 2.2 AA (ver `DESIGN.md` §6). Alvos >= 44px.

## Fase atual

**Fase 0** — fundação: docs canônicos, tokens, layout, navegação, registry de
rotas, páginas públicas estruturais, shell do painel, componentes e estados
vazios verdadeiros. Não avançar de fase sem critérios de aceite, migração,
testes e revisão de segurança (ver `docs/ROADMAP.md`).
