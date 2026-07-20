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
              <div key={index} className="relative min-w-0 flex-full shrink-0 grow-0 basis-full bg-[#222]">
                {/* Background Image (Static to dictate height naturally without cropping) */}
                {bg_url ? (
                  <picture className="block w-full">
                    <source media="(max-width: 640px)" srcSet={mobile_bg_url} />
                    <img
                      src={bg_url}
                      alt={title || "Banner"}
                      loading={index === 0 ? "eager" : "lazy"}
                      className="block w-full h-auto object-cover"
                    />
                  </picture>
                ) : (
                  <div className="w-full aspect-[21/9] bg-gradient-to-tr from-[#1a1a2e] to-[#16213e] flex flex-col items-center justify-center border-2 border-dashed border-white/10 p-4">
                    <span className="text-white/60 text-sm font-semibold tracking-wide uppercase mb-1">Banner Principal</span>
                    <span className="text-white/30 text-xs">Arraste/selecione uma imagem ou cole uma URL no painel à direita</span>
                  </div>
                )}
                
                {/* Subtle overlay for text readability */}
                <div className="absolute inset-0 bg-black/30 pointer-events-none" />

                {/* Content Overlay */}
                <div className="absolute inset-0 z-10 mx-auto flex w-full max-w-screen-xl flex-col items-start justify-center px-6 py-8 @@md:px-12 pointer-events-none">
                  {title && (
                    <h2 className="text-editorial text-4xl text-white @@sm:text-5xl @@lg:text-6xl drop-shadow-md max-w-2xl pointer-events-auto">
                      {title}
                    </h2>
                  )}
                  {button_link && button_text && (
                    <div className="mt-4 @@md:mt-8 pointer-events-auto">
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
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/20 p-2 text-white backdrop-blur hover:bg-black/40 z-20 hidden @@md:block transition-all"
            aria-label="Anterior"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/20 p-2 text-white backdrop-blur hover:bg-black/40 z-20 hidden @@md:block transition-all"
            aria-label="Próximo"
          >
            <ChevronRight className="size-6" />
          </button>
        </>
      )}
    </section>
  );
}
