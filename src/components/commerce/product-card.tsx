import { Link } from "@tanstack/react-router";
import { ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { PriceDisplay } from "@/components/commerce/price-display";

/**
 * Read-only DTO the storefront consumes from the services layer.
 * Prices are integer cents computed server-side.
 */
export interface ProductCardDTO {
  slug: string;
  title: string;
  brand?: string | null;
  priceCents: number;
  compareAtCents?: number | null;
  coverUrl?: string | null;
  coverAlt?: string | null;
}

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
      className={cn(
        "group flex flex-col gap-3 rounded-xl focus-visible:outline-none",
        className,
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-secondary">
        {product.coverUrl ? (
          <img
            src={product.coverUrl}
            alt={product.coverAlt ?? product.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <ImageOff className="size-8" aria-hidden />
          </div>
        )}
      </div>
      <div className="space-y-1">
        {product.brand ? (
          <p className="eyebrow text-muted-foreground">{product.brand}</p>
        ) : null}
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
