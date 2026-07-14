import type { ComponentProps } from "react";

import logoAsset from "@/assets/hr-shoes-logo.jpg.asset.json";
import { cn } from "@/lib/utils";

/**
 * Brand logo — the real Hr Shoes mark (an image, per DESIGN.md).
 * Do not recreate the wordmark as text.
 */
export function Logo({
  className,
  ...props
}: Omit<ComponentProps<"img">, "src" | "alt">) {
  return (
    <img
      src={logoAsset.url}
      alt="Hr Shoes — Conforto e Estilo"
      className={cn("h-8 w-auto select-none object-contain", className)}
      width={160}
      height={40}
      {...props}
    />
  );
}
