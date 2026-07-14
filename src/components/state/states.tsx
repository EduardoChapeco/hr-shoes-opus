import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Inbox,
  AlertTriangle,
  Lock,
  PlugZap,
  RefreshCw,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Canonical UI states — Hr Shoes Commerce (see DESIGN.md §5).
 * Every data/action surface must be able to render these honestly.
 * None of these perform commercial calculation or fabricate data.
 */

interface StateShellProps {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  tone?: "neutral" | "brand" | "destructive" | "info" | "warning";
}

const toneClasses: Record<NonNullable<StateShellProps["tone"]>, string> = {
  neutral: "bg-muted text-muted-foreground",
  brand: "bg-accent text-accent-foreground",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
  warning: "bg-warning/15 text-warning-foreground",
};

function StateShell({
  icon: Icon,
  title,
  description,
  action,
  className,
  tone = "neutral",
}: StateShellProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-12 text-center",
        className,
      )}
      role="status"
    >
      <span
        className={cn(
          "mb-4 grid size-12 place-items-center rounded-full",
          toneClasses[tone],
        )}
      >
        <Icon className="size-6" aria-hidden />
      </span>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function EmptyState(props: Omit<StateShellProps, "icon" | "tone">) {
  return <StateShell icon={Inbox} tone="neutral" {...props} />;
}

export function ErrorState({
  onRetry,
  title = "Algo deu errado",
  description = "Não foi possível carregar este conteúdo. Tente novamente.",
  ...props
}: Omit<StateShellProps, "icon" | "tone" | "action"> & {
  onRetry?: () => void;
}) {
  return (
    <StateShell
      icon={AlertTriangle}
      tone="destructive"
      title={title}
      description={description}
      action={
        onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="size-4" aria-hidden />
            Tentar novamente
          </Button>
        ) : undefined
      }
      {...props}
    />
  );
}

export function PermissionDenied({
  title = "Acesso restrito",
  description = "Você não tem permissão para ver esta área. Fale com um administrador da loja.",
  ...props
}: Omit<StateShellProps, "icon" | "tone">) {
  return (
    <StateShell
      icon={Lock}
      tone="warning"
      title={title}
      description={description}
      {...props}
    />
  );
}

export function UnconfiguredState({
  title = "Configuração ausente",
  description = "Esta integração ainda não foi conectada. Adicione as credenciais para ativá-la.",
  ...props
}: Omit<StateShellProps, "icon" | "tone">) {
  return (
    <StateShell
      icon={PlugZap}
      tone="info"
      title={title}
      description={description}
      {...props}
    />
  );
}
