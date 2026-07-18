import { Link } from "@tanstack/react-router";
import { ChevronRight, ImageOff, ChevronLeft } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useBuilderClickTracking } from "../analytics-provider";

export function HeroCarousel({ content, node_id, block_type }: { content: Record<string, unknown>; node_id?: string; block_type?: string }) {
  const autoPlay = content.autoPlay !== false;
  const interval = Number(content.interval || 5) * 1000;
  const banners = (Array.isArray(content.banners) ? content.banners : []) as any[];
  const trackClick = useBuilderClickTracking(node_id || "", block_type || "");

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!autoPlay || !emblaApi) return;
    const autoplayInterval = setInterval(() => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext();
      } else {
        emblaApi.scrollTo(0);
      }
    }, interval);
    return () => clearInterval(autoplayInterval);
  }, [autoPlay, interval, emblaApi]);

  if (banners.length === 0) {
    return (
      <section className="relative overflow-hidden bg-secondary">
        <div className="flex aspect-[21/9] w-full flex-col items-center justify-center gap-3 text-muted-foreground border-y border-border">
          <ImageOff className="size-10" aria-hidden />
          <p>Nenhum banner configurado</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-secondary">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {banners.map((banner, index) => {
            const title = String(banner.title || "");
            const bg_url = String(banner.image_url || "");
            const mobile_bg_url = String(banner.mobile_image_url || bg_url);
            const button_text = String(banner.button_text || "");
            const button_link = String(banner.link || "");

            return (
              <div key={index} className="relative min-w-0 flex-full shrink-0 grow-0 basis-full">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                  <picture>
                    <source media="(max-width: 640px)" srcSet={mobile_bg_url} />
                    <img
                      src={bg_url}
                      alt={title || "Banner"}
                      loading={index === 0 ? "eager" : "lazy"}
                      className="size-full object-cover"
                    />
                  </picture>
                  {/* Subtle overlay for text readability */}
                  <div className="absolute inset-0 bg-black/30" />
                </div>

                {/* Content */}
                <div className="relative z-10 mx-auto flex min-h-[400px] max-w-screen-xl flex-col items-start justify-center px-4 py-16 md:min-h-[500px] md:px-6">
                  {title && (
                    <h2 className="text-editorial text-4xl text-white sm:text-5xl lg:text-6xl drop-shadow-md max-w-2xl">
                      {title}
                    </h2>
                  )}
                  {button_link && button_text && (
                    <div className="mt-8">
                      <Button size="lg" className="bg-white text-black hover:bg-white/90" asChild>
                        <Link 
                          to={button_link as never}
                          onClick={() => trackClick({ index, title, link: button_link })}
                        >
                          {button_text}
                          <ChevronRight className="size-4" aria-hidden />
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {banners.length > 1 && (
        <>
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2 z-20">
            {banners.map((_, index) => (
              <button
                key={index}
                className={`size-2.5 rounded-full transition-colors ${
                  index === selectedIndex ? "bg-white" : "bg-white/40"
                }`}
                onClick={() => emblaApi?.scrollTo(index)}
                aria-label={`Ir para banner ${index + 1}`}
              />
            ))}
          </div>
          <button
            onClick={scrollPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/20 p-2 text-white backdrop-blur hover:bg-black/40 z-20 hidden md:block transition-all"
            aria-label="Anterior"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/20 p-2 text-white backdrop-blur hover:bg-black/40 z-20 hidden md:block transition-all"
            aria-label="Próximo"
          >
            <ChevronRight className="size-6" />
          </button>
        </>
      )}
    </section>
  );
}
