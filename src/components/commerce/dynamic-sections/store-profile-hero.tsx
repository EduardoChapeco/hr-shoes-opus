import { cn } from "@/lib/utils";
import { Store } from "lucide-react";

interface StoreHeroData {
  name?: string;
  slug?: string;
  description?: string;
  logo_url?: string;
  cover_url?: string;
}

interface StoreProfileHeroProps {
  content?: {
    show_description?: boolean;
    show_logo?: boolean;
    show_cover?: boolean;
    layout?: "centered" | "left" | "instagram";
  };
  design_tokens?: {
    backgroundColor?: string;
    textColor?: string;
    className?: string;
  };
  transient_data?: {
    store_hero?: StoreHeroData;
  };
}

export function StoreProfileHero({ content, design_tokens, transient_data }: StoreProfileHeroProps) {
  const store = transient_data?.store_hero;
  const layout = content?.layout ?? "centered";
  const showLogo = content?.show_logo !== false;
  const showCover = content?.show_cover !== false;
  const showDescription = content?.show_description !== false;

  if (!store) {
    return (
      <div className="w-full h-48 flex items-center justify-center bg-muted/50 text-muted-foreground text-sm">
        <Store className="mr-2 h-5 w-5" />
        Perfil não configurado
      </div>
    );
  }

  return (
    <div
      className={cn("w-full overflow-hidden", design_tokens?.className)}
      style={{
        backgroundColor: design_tokens?.backgroundColor,
        color: design_tokens?.textColor,
      }}
    >
      {/* Cover */}
      {showCover && (
        <div className="relative h-40 md:h-56 w-full bg-muted">
          {store.cover_url ? (
            <img
              src={store.cover_url}
              alt={`Capa de ${store.name}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        </div>
      )}

      {/* Profile info */}
      <div
        className={cn(
          "mx-auto max-w-2xl px-4 md:px-6 pb-8",
          showCover ? "-mt-12 relative z-10" : "pt-10",
          layout === "centered" && "flex flex-col items-center text-center",
          layout === "left" && "flex flex-col items-start",
          layout === "instagram" && "flex flex-col items-center text-center"
        )}
      >
        {showLogo && (
          <div
            className={cn(
              "mb-4",
              layout === "centered" || layout === "instagram" ? "mx-auto" : ""
            )}
          >
            {store.logo_url ? (
              <img
                src={store.logo_url}
                alt={store.name}
                className="size-24 rounded-full object-cover border-4 border-background shadow-md bg-background"
              />
            ) : (
              <div className="size-24 rounded-full bg-background border-4 border-background shadow-md flex items-center justify-center text-primary">
                <Store className="h-10 w-10" />
              </div>
            )}
          </div>
        )}

        <div>
          <h1 className="text-2xl font-bold leading-tight">{store.name}</h1>
          {store.slug && (
            <p className="text-sm text-muted-foreground mt-0.5">@{store.slug}</p>
          )}
          {showDescription && store.description && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-sm">
              {store.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
