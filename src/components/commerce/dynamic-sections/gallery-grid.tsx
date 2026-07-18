import { ZoomIn } from "lucide-react";

interface GalleryGridProps {
  content: {
    title?: string;
    columns?: "2" | "3" | "4";
    gap?: number;
    images?: Array<{
      image_url: string;
      link?: string;
      caption?: string;
    }>;
  };
}

export function GalleryGrid({ content }: GalleryGridProps) {
  const images = content.images || [];
  const columns = content.columns || "3";
  const gap = content.gap !== undefined ? content.gap : 16;

  const getColClass = () => {
    switch (columns) {
      case "2":
        return "grid-cols-1 sm:grid-cols-2";
      case "4":
        return "grid-cols-1 sm:grid-cols-2 md:grid-cols-4";
      case "3":
      default:
        return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3";
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-8 space-y-6">
      {content.title && (
        <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight">
          {content.title}
        </h2>
      )}

      {images.length === 0 ? (
        <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
          Nenhuma imagem cadastrada na galeria.
        </div>
      ) : (
        <div
          className={`grid ${getColClass()}`}
          style={{ gap: `${gap}px` }}
        >
          {images.map((img, idx) => {
            const Wrapper = img.link ? "a" : "div";
            const wrapperProps = img.link ? { href: img.link } : {};

            return (
              <Wrapper
                key={idx}
                {...wrapperProps}
                className="relative group aspect-square rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center cursor-pointer shadow-xs hover:shadow-md transition-all duration-300"
              >
                <img
                  src={img.image_url}
                  alt={img.caption || ""}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Hover overlay with caption/zoom */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 text-center text-white">
                  <ZoomIn className="size-6 mb-2 scale-75 group-hover:scale-100 transition-transform duration-300" />
                  {img.caption && (
                    <p className="text-xs font-semibold leading-relaxed line-clamp-3">
                      {img.caption}
                    </p>
                  )}
                </div>
              </Wrapper>
            );
          })}
        </div>
      )}
    </section>
  );
}
