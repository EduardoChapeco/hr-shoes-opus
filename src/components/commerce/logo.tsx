import type { ComponentProps } from "react";

import logoAsset from "@/assets/hr-shoes-logo.jpg.asset.json";
import { cn } from "@/lib/utils";

/**
 * Brand logo — the real Hr Shoes mark (an image, per DESIGN.md).
 * Uses a dynamic src if provided, otherwise falls back to the default asset.
 */
export function Logo({ src, className, ...props }: Omit<ComponentProps<"img">, "alt">) {
  return (
    <img
      src={src || logoAsset.url}
      alt="Hr Shoes — Conforto e Estilo"
      className={cn("h-8 w-auto select-none object-contain", className)}
      width={160}
      height={40}
      {...props}
    />
  );
}

/** Canonical alias (see COMPONENT_CATALOG.md). */
export const BrandLogo = Logo;
