import { Link } from "@tanstack/react-router";
import { ChevronRight, ChevronLeft } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/commerce/product-card";
import type { ProductCardDTO } from "@/types/catalog";

export function ProductRail({
  content,
  resolvedData,
}: {
  content?: Record<string, unknown>;
  resolvedData?: ProductCardDTO[];
  node_id?: string;
  block_type?: string;
}) {
  const safeContent = content || {};
  const title = String(safeContent.title || "Destaques");
  const slug = safeContent.collection_slug ? String(safeContent.collection_slug) : null;
  const layout = String(safeContent.layout || "carousel");

  const productsToDisplay = Array.isArray(resolvedData) ? resolvedData : [];

  if (productsToDisplay.length === 0) {
    return (
      <div className="p-8 text-center border-2 border-dashed border-border/50 text-muted-foreground text-sm">
        [Product Rail] Fonte de dados não configurada ou vazia.
      </div>
    );
  }

  if (layout === "grid") {
    return (
      <section className="mx-auto max-w-screen-xl px-4 py-8 @@md:px-6">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-editorial mt-1 text-2xl text-foreground @@sm:text-3xl">{title}</h2>
          </div>
          {slug && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/colecao/$slug" params={{ slug }}>
                Ver tudo
                <ChevronRight className="size-4" aria-hidden />
              </Link>
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 @@sm:grid-cols-3 @@lg:grid-cols-4">
          {productsToDisplay.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    );
  }

  // Carousel layout
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  });

  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <section className="mx-auto max-w-screen-xl px-4 py-8 @@md:px-6">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-editorial mt-1 text-2xl text-foreground @@sm:text-3xl">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {slug && (
            <Button variant="link" size="sm" asChild className="hidden @@sm:inline-flex">
              <Link to="/colecao/$slug" params={{ slug }}>
                Ver coleção completa
              </Link>
            </Button>
          )}
          <div className="hidden @@sm:flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8 rounded-full"
              onClick={scrollPrev}
              disabled={!prevBtnEnabled}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8 rounded-full"
              onClick={scrollNext}
              disabled={!nextBtnEnabled}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-4">
          {productsToDisplay.slice(0, 12).map((product) => (
            <div
              key={product.id}
              className="pl-4 min-w-0 flex-[0_0_80%] @@sm:flex-[0_0_40%] @@md:flex-[0_0_33.33%] @@lg:flex-[0_0_25%]"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
