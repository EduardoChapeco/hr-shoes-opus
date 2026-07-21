import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src/routes/_store.produto.$slug.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// FIX 1: JSON-LD — the canonical link block has different format
// Find the closing of head function by looking for 'links' near canonical
const headTarget = `links: [{ rel: "canonical", href: canonical }],
    };
  },`;

if (content.includes(headTarget)) {
  const headReplacement = `links: [{ rel: "canonical", href: canonical }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.title,
            image: product.media.filter((m: any) => m.mediaType === "image").map((m: any) => m.url),
            brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
            sku: product.variants?.[0]?.sku,
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "BRL",
              lowPrice: ((product.variants?.length > 0
                ? Math.min(...product.variants.map((v: any) => v.effectivePriceCents))
                : product.priceCents) / 100).toFixed(2),
              offerCount: product.variants?.length || 1,
              availability: product.variants?.some((v: any) => v.availableQty > 0)
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            },
          }),
        }
      ],
    };
  },`;
  content = content.replace(headTarget, headReplacement);
  console.log("FIX 1 applied: JSON-LD Schema.org");
} else {
  // Try alternate pattern without trailing comma
  const altTarget = `links: [{ rel: "canonical", href: canonical }]\n    };\n  },`;
  if (content.includes(altTarget)) {
    console.log("FIX 1 found alternate pattern");
  } else {
    // Dump what we have around 'canonical'
    const idx = content.indexOf('canonical');
    console.log("FIX 1 context:", JSON.stringify(content.slice(Math.max(0, idx - 50), idx + 200)));
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Done.");
