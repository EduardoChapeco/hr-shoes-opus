# DESIGN.md — Hr Shoes Commerce

> Fonte única de verdade do design system. Segue a especificação aberta
> Google Labs `DESIGN.md`: tokens semânticos em YAML + justificativa humana,
> estados, componentes e regras responsivas. Os valores canônicos vivem em
> `src/styles.css`; este documento explica o "porquê". Componentes consomem
> tokens semânticos — nunca hex/radius/shadow soltos.

## 1. Direção criativa

```yaml
brand: Hr Shoes
tagline: Conforto e Estilo
voice: contemporâneo, feminino, editorial, acolhedor, direto (pt-BR)
mood: minimalista, leve, arejado; foto grande quando existir; muito branco
principles:
  - "Rosa é acento, não tema. Nunca pintar tudo de rosa."
  - "Off-white quente como base; grafite para texto; rosa vivo para ação/destaque."
  - "Hierarquia por tipografia e espaço, não por caixas aninhadas."
  - "A logo é imagem (marca real). Não recriar a palavra como texto."
  - "Evitar aparência genérica de template, gradientes decorativos, glassmorphism,
    cards aninhados e animações gratuitas."
anti_patterns:
  - purple/indigo default gradients
  - fake data, placeholders de produto, imagens externas aleatórias
  - botões sem destino, sucesso simulado de integração
```

## 2. Tokens de cor (semânticos)

Valores reais em `src/styles.css` (`:root` / `.dark`), formato **oklch**.
Mapeados a utilitários Tailwind via `@theme inline`.

```yaml
color_tokens:
  background:
    {
      value: "#F3F1EC (oklch 0.965 0.006 85)",
      role: "canvas quente off-white",
      why: "base calma, editorial, valoriza a foto e o rosa",
    }
  foreground:
    {
      value: "#292729 (oklch 0.27 0.006 20)",
      role: "grafite / ink",
      why: "texto de alto contraste sem preto puro duro",
    }
  primary / brand:
    {
      value: "#FF4FB8 (oklch 0.685 0.222 349)",
      role: "acento de marca, CTA principal",
      why: "rosa vivo da logo; usar com parcimônia",
    }
  primary-foreground: { value: "near-white", role: "texto sobre rosa" }
  brand-soft / accent:
    {
      value: "rosa 8% (oklch 0.93 0.05 349)",
      role: "realce suave, tags, hovers",
      why: "presença da marca sem saturar",
    }
  secondary: { value: "warm gray 0.93", role: "superfícies neutras, chips" }
  muted / muted-foreground: { value: "gray", role: "texto secundário, metadados" }
  card: { value: "quase branco 0.995", role: "elevação sutil sobre o canvas" }
  border / input: { value: "warm gray 0.9", role: "divisórias discretas" }
  ring: { value: "= brand", role: "foco visível de teclado" }
  destructive: { value: "vermelho", role: "erro/exclusão" }
  success: { value: "verde", role: "confirmações, status pago/aprovado" }
  warning: { value: "âmbar", role: "atenção, estoque baixo, pendências" }
  info: { value: "azul", role: "informativo, cotação, em análise" }
rationale: >
  Uma única cor de marca (rosa) reservada a ação e destaque garante que a
  interface pareça premium e não infantil. O canvas quente diferencia de
  templates brancos genéricos. Status usa cores próprias (não o rosa) para
  não competir com o CTA.
contrast:
  rule: "WCAG 2.2 AA — texto normal >= 4.5:1, texto grande/ícones >= 3:1."
  check: "Validar contraste no editor de tema antes de publicar (Fase 3)."
```

## 3. Tipografia

```yaml
fonts:
  ui_sans:
    {
      family: "Manrope",
      weights: [400, 500, 600, 700, 800],
      use: "toda a UI, corpo, labels, dados",
    }
  editorial_serif:
    {
      family: "Fraunces",
      weights: [400, 500, 600],
      italic: true,
      use: "títulos, campanhas, eyebrow editorial",
    }
loading: "Carregadas via <link> no __root.tsx head (nunca @import remoto no CSS)."
scale:
  display:
    { size: "clamp(2rem, 6vw, 4rem)", family: serif, weight: 500, tracking: "-0.02em", line: 1.05 }
  h1: { size: "clamp(1.75rem, 4vw, 2.75rem)", family: serif }
  h2: { size: "clamp(1.4rem, 3vw, 2rem)", family: serif }
  h3: { size: "1.25rem", family: serif }
  body: { size: "1rem", family: sans, line: 1.6 }
  small: { size: "0.875rem", family: sans }
  eyebrow: { transform: uppercase, tracking: "0.16em", weight: 600, size: "0.72rem", family: sans }
rationale: >
  Manrope é uma sans altamente legível e distinta (não Inter/Poppins genéricos).
  Fraunces traz o tom editorial de moda apenas em títulos/campanhas, mantendo a
  leitura de dados e formulários 100% na sans.
```

## 4. Espaço, raio, elevação

```yaml
radius:
  { base: "0.75rem", scale: "sm..4xl derivado", why: "cantos macios, contemporâneos, sem exageros" }
spacing: { unit: "4px base (Tailwind)", rhythm: "seções generosas; respiro > densidade na vitrine" }
elevation:
  philosophy: "sombras suaves e curtas; luz difusa; nunca sombra dura de template"
  tokens: [shadow-xs, shadow-sm, shadow-md, shadow-lg, shadow-brand]
grid:
  container: "fluido, max-w-screen-xl; gutters responsivos"
  product_grid: "2 col mobile, 3 col md, 4 col lg"
```

## 5. Estados obrigatórios (todo componente de dado/ação)

```yaml
required_states:
  loading: "skeleton sem layout shift; nunca spinner solto em bloco grande"
  empty: "estado vazio honesto (sem produtos falsos); texto + ação quando fizer sentido"
  error: "mensagem clara + ação de retry; nunca tela branca"
  permission: "bloqueio de acesso claro (sem vazar dados)"
  disabled: "affordance visível e acessível"
  unconfigured: "integração sem credencial -> 'configuração ausente', nunca sucesso simulado"
  coming_soon: "somente no painel: 'Planejado para a Fase X'; nunca na vitrine pública"
success: "confirmações discretas via toast/inline"
```

## 6. Acessibilidade (WCAG 2.2 AA)

```yaml
a11y:
  touch_target: ">= 44x44px em todos os alvos interativos"
  focus: "foco visível (ring = brand) em todo elemento focável"
  keyboard: "navegação e ativação completas por teclado"
  reduced_motion: "respeitar prefers-reduced-motion (global no CSS)"
  labels: "todo input com label; ícones com aria-label"
  errors: "mensagens de erro associadas ao campo, texto claro em pt-BR"
  landmarks: "header/nav/main/footer semânticos; um único h1 por página"
  safe_area: "respeitar env(safe-area-inset-*) em barras fixas"
```

## 7. Layout responsivo

```yaml
responsive:
  approach: "mobile-first; excelente também em desktop"
  public_nav:
    mobile: "header enxuto + sticky bottom nav (>=44px alvos, pb-safe)"
    desktop: "header com navegação horizontal; sem bottom nav"
  admin_shell:
    mobile: "topbar + sticky bottom nav com ações principais"
    desktop: "sidebar recolhível + conteúdo arejado"
  invariants:
    - "sem sobreposição, corte de texto ou scroll horizontal involuntário"
    - "conteúdo nunca escondido atrás de barras fixas (usar padding/safe-area)"
    - "linhas com texto + widget usam grid + min-w-0 + shrink-0 (ver responsive rules)"
```

## 8. Componentes canônicos

Ver `docs/COMPONENT_CATALOG.md` para o catálogo completo com estados.
Resumo de camadas:

```yaml
component_layers:
  ui: "primitivos shadcn adaptados por variantes (src/components/ui)"
  commerce: "vitrine: ProductCard, PriceDisplay, SectionRenderer, ... (src/components/commerce)"
  admin: "painel: AdminShell, DataTable, PhaseGate, ... (src/components/admin)"
  state: "EmptyState, ErrorState, LoadingState, PermissionGate, UnconfiguredState, ComingSoon"
rules:
  - "Nenhum componente faz cálculo comercial (preço/desconto/frete/estoque) no cliente."
  - "PriceDisplay apenas formata cents+BRL vindos do servidor."
  - "Cores/raio/sombra sempre via token; nunca className com hex/bg-white/text-black."
```

## 9. Regras de consumo dos tokens

- Novas cores: adicionar em `:root` **e** `.dark`, registrar em `@theme inline`.
- Preferir tokens semânticos (`bg-primary`, `text-muted-foreground`) a tokens
  brutos (`bg-brand`) — brutos só quando o semântico não expressa a intenção.
- Variantes de componente (cva) para estilos recorrentes, nunca overrides ad hoc.
