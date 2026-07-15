import { Link } from "@tanstack/react-router";
import { ImageOff } from "lucide-react";

export function MosaicBanners({ content }: { content: Record<string, unknown> }) {
  const banners = (Array.isArray(content.banners) ? content.banners : []) as any[];

  if (banners.length === 0) return null;

  return (
    <section className="mx-auto max-w-screen-xl px-4 py-8 md:px-6">
      <div className={`grid gap-4 ${banners.length === 1 ? "grid-cols-1" : banners.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
        {banners.slice(0, 3).map((banner, index) => {
          const title = String(banner.title || "");
          const bg_url = String(banner.image_url || "");
          const link = String(banner.link || "");

          const inner = (
            <div className="group relative aspect-[4/5] md:aspect-square overflow-hidden rounded-2xl bg-muted transition-transform hover:opacity-95">
              {bg_url ? (
                <img
                  src={bg_url}
                  alt={title || `Banner ${index + 1}`}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="flex size-full flex-col items-center justify-center gap-3 text-muted-foreground">
                  <ImageOff className="size-10" aria-hidden />
                </div>
              )}
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-80" />
              {/* Content */}
              {title && (
                <div className="absolute bottom-0 left-0 p-6 md:p-8">
                  <h3 className="text-2xl font-semibold text-white drop-shadow-sm">{title}</h3>
                </div>
              )}
            </div>
          );

          if (link) {
            return (
              <Link key={index} to={link as never} className="block">
                {inner}
              </Link>
            );
          }

          return <div key={index}>{inner}</div>;
        })}
      </div>
    </section>
  );
}
