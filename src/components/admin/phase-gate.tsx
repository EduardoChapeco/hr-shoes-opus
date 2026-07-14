import { Rocket } from "lucide-react";

import type { Phase } from "@/types/domain";
import { Badge } from "@/components/ui/badge";

/**
 * PhaseGate / "Em breve" — ADMIN ONLY (see AGENTS.md rule 5).
 * Renders an honest "planned for Phase X" state for functionality not yet
 * built. NEVER used on the public storefront and never simulates success.
 */

const PHASE_LABELS: Record<Phase, string> = {
  0: "Fase 0 — Fundação",
  1: "Fase 1 — Catálogo e estoque",
  2: "Fase 2 — Carrinho, checkout e pagamentos",
  3: "Fase 3 — CMS, stories, perfil e SEO/PWA",
  4: "Fase 4 — CRM, caixa, comissões e créditos",
  5: "Fase 5 — Integrações, recuperação e Match Time",
};

export function PhaseGate({
  phase,
  title,
  description,
}: {
  phase: Phase;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <span className="mb-4 grid size-12 place-items-center rounded-full bg-accent text-accent-foreground">
        <Rocket className="size-6" aria-hidden />
      </span>
      <Badge variant="secondary" className="mb-3">
        Em breve
      </Badge>
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {description ??
          "Esta área está planejada e ainda não foi construída. Nenhum dado é simulado aqui."}
      </p>
      <p className="eyebrow mt-5 text-muted-foreground">{PHASE_LABELS[phase]}</p>
    </div>
  );
}

/** Canonical alias (see COMPONENT_CATALOG.md). */
export const PlannedFeature = PhaseGate;
