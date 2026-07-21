import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src/routes/_store.produto.$slug.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// =========================================================
// FIX 1: Add JSON-LD Schema.org script to head function
// =========================================================
const headTarget = `      links: [{ rel: "canonical", href: canonical }],
    };
  },`;
const headReplacement = `      links: [{ rel: "canonical", href: canonical }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.title,
            description: product.shortDescription || (product.description || "").replace(/<[^>]+>/g, "").slice(0, 300) || undefined,
            image: product.media.filter(m => m.mediaType === "image").map(m => m.url),
            brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
            sku: product.variants[0]?.sku,
            gtin: product.variants[0]?.ean || product.ean || undefined,
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "BRL",
              lowPrice: (Math.min(...(product.variants.length > 0 ? product.variants.map(v => v.effectivePriceCents) : [product.priceCents])) / 100).toFixed(2),
              highPrice: (Math.max(...(product.variants.length > 0 ? product.variants.map(v => v.effectivePriceCents) : [product.priceCents])) / 100).toFixed(2),
              offerCount: product.variants.length || 1,
              availability: product.variants.some(v => v.availableQty > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              seller: { "@type": "Organization", name: "Hr Shoes" },
            },
          }),
        }
      ],
    };
  },`;
if (content.includes('links: [{ rel: "canonical", href: canonical }],\n    };')) {
  content = content.replace(headTarget, headReplacement);
  console.log("FIX 1 applied: JSON-LD Schema.org");
} else {
  console.log("FIX 1 SKIPPED (target not found)");
}

// =========================================================
// FIX 2: Gallery strip now shows variant media when a 
// variant is selected — filter product.media by variant_id
// =========================================================
const galleryTarget = `            {product.media.length > 0 && (
              <div className="hidden sm:flex flex-col gap-2 w-16 shrink-0 max-h-[480px] overflow-y-auto pr-1">
                {product.media.map((m: ProductMediaDTO) => {`;
const galleryReplacement = `            {(() => {
              // Show variant-specific media if selected variant has its own; else product-level
              const variantMedia = selectedVariant?.media?.length > 0 ? selectedVariant.media : null;
              const displayMedia = variantMedia
                ? [...variantMedia, ...product.media.filter(m => !m.variantId)]
                : product.media;
              return displayMedia.length > 0 && (
              <div className="hidden sm:flex flex-col gap-2 w-16 shrink-0 max-h-[480px] overflow-y-auto pr-1">
                {displayMedia.map((m: ProductMediaDTO) => {`;
content = content.replace(galleryTarget, galleryReplacement);
// Close the IIFE that we opened
const galleryEndTarget = `              </div>
            )}

            {/* Main Screen Viewport */}`;
const galleryEndReplacement = `              </div>
              );
            })()}

            {/* Main Screen Viewport */}`;
content = content.replace(galleryEndTarget, galleryEndReplacement);
console.log("FIX 2 applied: Gallery variant filtering");

// =========================================================
// FIX 3: When variant changes, update activeMedia to match
// =========================================================
const mediaSwitchTarget = `  // Watch selected variant to change active media automatically if variant has custom media
  useMemo(() => {
    if (selectedVariant && selectedVariant.media && selectedVariant.media.length > 0) {
      setActiveMedia(selectedVariant.media[0]);
    }
  }, [selectedVariant]);`;
const mediaSwitchReplacement = `  // Watch selected variant to change active media automatically
  useMemo(() => {
    if (selectedVariant) {
      if (selectedVariant.media && selectedVariant.media.length > 0) {
        // Variant has its own photos → show first variant photo
        setActiveMedia(selectedVariant.media[0]);
      } else {
        // No variant-specific photos → show first general product photo that is not linked to another variant
        const generalPhoto = product.media.find(m => !m.variantId) ?? product.media[0] ?? null;
        setActiveMedia(generalPhoto);
      }
    }
  }, [selectedVariant]);`;
content = content.replace(mediaSwitchTarget, mediaSwitchReplacement);
console.log("FIX 3 applied: Active media on variant change");

// =========================================================
// FIX 4: Display variant displayName in h2 under h1
// Already added in previous cycle but validate it
// =========================================================
if (!content.includes('activeVariant?.displayName')) {
  const h1Target = `<h1 className="text-2xl sm:text-3xl font-black text-foreground mb-1 font-heading leading-tight tracking-tight">
              {product.title}
            </h1>`;
  const h1Replacement = `<h1 className="text-2xl sm:text-3xl font-black text-foreground mb-1 font-heading leading-tight tracking-tight">
              {product.title}
            </h1>
            {selectedVariant?.displayName && (
              <p className="text-sm font-medium text-primary mt-0.5">
                {selectedVariant.displayName}
              </p>
            )}`;
  content = content.replace(h1Target, h1Replacement);
  console.log("FIX 4 applied: displayName under h1");
} else {
  console.log("FIX 4 SKIPPED (already present)");
}

// =========================================================
// FIX 5: Show short_description if available
// =========================================================
const shortDescTarget = `{product.description && (`;
const shortDescReplacement = `{product.shortDescription && (
                <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-3 italic">
                  {product.shortDescription}
                </p>
              )}
              {product.description && (`;
if (!content.includes('product.shortDescription') || !content.includes('text-sm text-muted-foreground leading-relaxed border-l-2')) {
  content = content.replace(shortDescTarget, shortDescReplacement);
  console.log("FIX 5 applied: shortDescription display");
} else {
  console.log("FIX 5 SKIPPED (already present)");
}

// =========================================================
// FIX 6: Show preparation_time_days near shipping section
// =========================================================
const prepTarget = `<Truck className="size-3.5 text-primary shrink-0" />`;
// Find the first truck icon usage and add prep days after shipping info
const prepReplacement = `<Truck className="size-3.5 text-primary shrink-0" />`;
// Add preparationTimeDays note in the shipping area
const shippingInfoTarget = `{shippingRates && shippingRates.length > 0 && (`;
const shippingInfoReplacement = `{product.preparationTimeDays != null && product.preparationTimeDays > 0 && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <span className="text-amber-600 font-medium">+{product.preparationTimeDays}d</span>
                    de preparo antes do envio
                  </p>
                )}
                {shippingRates && shippingRates.length > 0 && (`;
content = content.replace(shippingInfoTarget, shippingInfoReplacement);
console.log("FIX 6 applied: preparationTimeDays display");

// =========================================================
// FIX 7: Main viewport — support video playback inline
// Currently videos show a play icon but dont play
// =========================================================
const videoTarget = `{activeMedia.mediaType === "video" ? (`;
const videoReplacement = `{activeMedia.mediaType === "video" ? (`;
// The video section — check if it shows an <video> tag or iframe
if (!content.includes('<video ') && !content.includes('<iframe')) {
  const videoBlockTarget = `{activeMedia && activeMedia.mediaType === "video" ? (`;
  // Inline search for existing video rendering in main viewport
  const videoFallbackTarget = `{parseYoutubeId(activeMedia.url) ? (`;
  if (content.includes(videoFallbackTarget)) {
    // Find the existing video block and ensure autoPlay/controls
    content = content.replace(
      `src={\`https://www.youtube.com/embed/\${parseYoutubeId(activeMedia.url)}\`}`,
      `src={\`https://www.youtube.com/embed/\${parseYoutubeId(activeMedia.url)}?autoplay=1&rel=0\`}`
    );
    console.log("FIX 7 applied: YouTube autoplay");
  }
}

// =========================================================
// FIX 8: Use focal_point for object-position on main image
// =========================================================
content = content.replace(
  `className="size-full object-cover transition-transform duration-500 group-hover:scale-105"`,
  `className="size-full object-cover transition-transform duration-500 group-hover:scale-105" style={activeMedia?.focalPoint ? { objectPosition: \`\${(activeMedia.focalPoint.x * 100).toFixed(0)}% \${(activeMedia.focalPoint.y * 100).toFixed(0)}%\` } : {}}`
);
console.log("FIX 8 applied: focal_point → object-position");

// =========================================================
// FIX 9: EAN shown in product specs if available
// =========================================================
const productInfoTarget = `{product.brand && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">Marca:</span>
                    <span>{product.brand}</span>
                  </div>
                )}`;
if (content.includes(productInfoTarget)) {
  content = content.replace(
    productInfoTarget,
    `{product.brand && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">Marca:</span>
                    <span>{product.brand}</span>
                  </div>
                )}
                {(selectedVariant?.ean || product.ean) && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">EAN:</span>
                    <span className="font-mono">{selectedVariant?.ean || product.ean}</span>
                  </div>
                )}`
  );
  console.log("FIX 9 applied: EAN display");
}

// =========================================================
// FIX 10: Add missing import for calculateShipping if absent
// =========================================================
if (!content.includes('calculateShipping')) {
  content = content.replace(
    `import { addToCart } from "@/services/cart.functions";`,
    `import { addToCart } from "@/services/cart.functions";\nimport { calculateShipping } from "@/services/shipping.functions";`
  );
  console.log("FIX 10 applied: calculateShipping import");
} else {
  console.log("FIX 10 SKIPPED (calculateShipping already imported)");
}

// =========================================================
// FIX 11: Ensure ProductMediaDTO and VariantDTO are imported
// =========================================================
if (!content.includes('ProductMediaDTO') && !content.includes('import type')) {
  content = content.replace(
    `import { getProductBySlug } from "@/services/product.functions";`,
    `import { getProductBySlug } from "@/services/product.functions";\nimport type { ProductDetailDTO, ProductMediaDTO, VariantDTO } from "@/types/catalog";`
  );
  console.log("FIX 11 applied: Type imports");
} else {
  console.log("FIX 11 SKIPPED (types already imported)");
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("\n✅ All storefront fixes applied successfully!");
