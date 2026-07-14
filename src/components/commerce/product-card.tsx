import { Link } from "@tanstack/react-router";
import { ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { PriceDisplay } from "@/components/commerce/price-display";
import type { ProductCardDTO } from "@/types/catalog";

/**
 * Canonical product card — reads data from a server-authoritative DTO.
 * NO commercial calculation happens here. All prices come pre-computed.
 * See DESIGN.md §8 and docs/COMPONENT_CATALOG.md.
 */
export function ProductCard({
  product,
  className,
}: {
  product: ProductCardDTO;
  className?: string;
}) {
  return (
    <Link
      to="/produto/$slug"
      params={{ slug: product.slug }}
      className={cn("group flex flex-col gap-3 rounded-xl focus-visible:outline-none", className)}
    >
      {/* Image */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-secondary">
        {product.coverUrl ? (
          <img
            src={product.coverUrl}
            alt={product.coverAlt ?? product.title}
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <ImageOff className="size-8" aria-hidden />
          </div>
        )}

        {/* Out of stock overlay */}
        {product.isOutOfStock && (
          <div className="absolute inset-0 flex items-end bg-foreground/30">
            <span className="w-full bg-foreground/80 py-1.5 text-center text-xs font-medium text-background">
              Sem estoque
            </span>
          </div>
        )}

        {/* Discount badge */}
        {product.compareAtCents && product.compareAtCents > product.priceCents && (
          <div className="absolute left-2 top-2 rounded-full bg-destructive px-2 py-0.5 text-[0.65rem] font-semibold text-destructive-foreground">
            {Math.round(
              ((product.compareAtCents - product.priceCents) / product.compareAtCents) * 100,
            )}
            % off
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-1">
        {product.brand ? <p className="eyebrow text-muted-foreground">{product.brand}</p> : null}
        <h3 className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary">
          {product.title}
        </h3>
        <PriceDisplay
          amountCents={product.priceCents}
          compareAtCents={product.compareAtCents}
          size="sm"
        />
      </div>
    </Link>
  );
}
