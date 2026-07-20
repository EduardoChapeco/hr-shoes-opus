import { Link } from "@tanstack/react-router";
import { ImageOff, ShoppingBag } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { PriceDisplay } from "@/components/commerce/price-display";
import type { ProductCardDTO } from "@/types/catalog";
import { Button } from "@/components/ui/button";

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
  const isNew =
    product.publishedAt &&
    (new Date().getTime() - new Date(product.publishedAt).getTime()) / (1000 * 3600 * 24) <= 7;

  return (
    <Link
      to="/produto/$slug"
      params={{ slug: product.slug }}
      className={cn("group flex flex-col gap-3 rounded-xl focus-visible:outline-none", className)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-secondary">
        {product.coverUrl ? (
          <>
            <img
              src={product.coverUrl}
              alt={product.coverAlt ?? product.title}
              loading="lazy"
              decoding="async"
              className={cn(
                "absolute inset-0 size-full object-cover transition-opacity duration-500",
                product.hoverUrl ? "group-hover:opacity-0" : "group-hover:scale-[1.03]"
              )}
            />
            {product.hoverUrl && (
              <img
                src={product.hoverUrl}
                alt={product.coverAlt ?? product.title}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:scale-[1.03]"
              />
            )}
          </>
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <ImageOff className="size-8" aria-hidden />
          </div>
        )}

        {/* Quick Add Overlay (Desktop only) */}
        {!product.isOutOfStock && (
          <div className="absolute inset-x-2 bottom-2 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hidden @md:block">
            <div className="w-full rounded-lg bg-background/90 text-foreground shadow-sm backdrop-blur py-2 text-center text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-colors">
              Ver Opções
            </div>
          </div>
        )}

        {/* Mobile quick-add bag icon */}
        {!product.isOutOfStock && (
          <div className="absolute bottom-2 right-2 rounded-full bg-background/90 p-2 shadow-sm backdrop-blur @md:hidden">
            <ShoppingBag className="size-4 text-foreground" aria-hidden />
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

        {/* Badges container */}
        <div className="absolute left-2 top-2 flex flex-col gap-1.5 items-start">
          {product.compareAtCents && product.compareAtCents > product.priceCents && (
            <div className="rounded-full bg-destructive px-2 py-0.5 text-[0.65rem] font-bold tracking-wide text-destructive-foreground">
              {Math.round(
                ((product.compareAtCents - product.priceCents) / product.compareAtCents) * 100,
              )}
              % OFF
            </div>
          )}
          {isNew && (
            <div className="rounded-full bg-primary px-2 py-0.5 text-[0.65rem] font-bold tracking-wide text-primary-foreground">
              NOVO
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="space-y-1">
        {product.brand ? <p className="eyebrow text-muted-foreground">{product.brand}</p> : null}
        <h3 className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary transition-colors">
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
