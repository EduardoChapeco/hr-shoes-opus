import { useState } from "react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Brand logo — renders the store image logo if a valid src URL is provided.
 * If src is missing or fails to load, gracefully falls back to elegant text logo
 * instead of rendering a broken image icon.
 */
export function Logo({ src, className, ...props }: Omit<ComponentProps<"img">, "alt">) {
  const [hasError, setHasError] = useState(false);

  if (src && !hasError) {
    return (
      <img
        src={src}
        alt="Hr Shoes — Conforto e Estilo"
        className={cn("h-8 w-auto select-none object-contain", className)}
        onError={() => setHasError(true)}
        width={160}
        height={40}
        {...props}
      />
    );
  }

  return (
    <span className={cn("font-bold text-lg tracking-tight text-foreground select-none flex items-center gap-2", className)}>
      Hr Shoes
    </span>
  );
}

/** Canonical alias (see COMPONENT_CATALOG.md). */
export const BrandLogo = Logo;
