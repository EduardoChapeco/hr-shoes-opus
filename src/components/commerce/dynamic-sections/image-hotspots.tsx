import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShoppingBag, Eye, X } from "lucide-react";
import { ProductCard } from "@/components/commerce/product-card";

interface Hotspot {
  id: string;
  xPercent: number;
  yPercent: number;
  product_slug?: string;
  product_id?: string;
  title?: string;
  price_cents?: number;
}

interface ImageHotspotsProps {
  title?: string;
  subtitle?: string;
  image_url: string;
  mobile_image_url?: string;
  hotspots?: Hotspot[];
  onHotspotClickInEditor?: (hotspot: Hotspot) => void;
  activeHotspotIdInEditor?: string;
}

export function ImageHotspots({
  title = "Shop the Look",
  subtitle = "Clique nos marcadores para ver os produtos",
  image_url,
  mobile_image_url,
  hotspots = [],
  onHotspotClickInEditor,
  activeHotspotIdInEditor,
}: ImageHotspotsProps) {
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);

  const displayImage = mobile_image_url || image_url;

  return (
    <div className="w-full py-12 px-4 md:px-8 max-w-7xl mx-auto">
      {(title || subtitle) && (
        <div className="text-center mb-8">
          {title && <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">{title}</h2>}
          {subtitle && <p className="text-muted-foreground text-base max-w-2xl mx-auto">{subtitle}</p>}
        </div>
      )}

      <div className="relative w-full rounded-2xl overflow-hidden shadow-xl border border-border bg-muted">
        {/* Main Image */}
        <img
          src={displayImage || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1600"}
          alt={title || "Shop the Look"}
          className="w-full h-auto object-cover max-h-[700px]"
        />

        {/* Hotspots */}
        {hotspots.map((spot, index) => {
          const isActive = activeHotspot?.id === spot.id || activeHotspotIdInEditor === spot.id;
          return (
            <button
              key={spot.id || index}
              type="button"
              style={{ left: `${spot.xPercent}%`, top: `${spot.yPercent}%` }}
              onClick={() => {
                if (onHotspotClickInEditor) {
                  onHotspotClickInEditor(spot);
                } else {
                  setActiveHotspot(activeHotspot?.id === spot.id ? null : spot);
                }
              }}
              aria-label={spot.title || `Produto ${index + 1}`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full z-10 transition-transform ${
                isActive ? "scale-125 z-20" : "hover:scale-110"
              }`}
            >
              {/* Outer pulsing ring */}
              <span className="absolute -inset-2 rounded-full bg-primary/40 animate-ping opacity-75" />
              {/* Inner pin */}
              <span className="relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary text-primary-foreground shadow-lg font-bold text-xs md:text-sm border-2 border-background">
                {index + 1}
              </span>
            </button>
          );
        })}

        {/* Floating Mini-Card / Drawer for Active Hotspot */}
        {activeHotspot && !onHotspotClickInEditor && (
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-80 bg-background/95 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-border z-30 transition-all animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Produto em Destaque</span>
              <button
                type="button"
                onClick={() => setActiveHotspot(null)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-foreground text-sm line-clamp-2">{activeHotspot.title || "Produto Selecionado"}</h4>
              {activeHotspot.product_slug ? (
                <Link
                  to="/produto/$slug"
                  params={{ slug: activeHotspot.product_slug }}
                  className="inline-flex items-center justify-center w-full gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg text-sm hover:opacity-90 transition-opacity"
                >
                  <Eye className="w-4 h-4" />
                  Ver Produto
                </Link>
              ) : (
                <Link
                  to="/catalogo"
                  className="inline-flex items-center justify-center w-full gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg text-sm hover:opacity-90 transition-opacity"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Ver Catálogo
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
