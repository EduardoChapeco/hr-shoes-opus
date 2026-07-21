import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  ImageOff,
  ShoppingBag,
  ChevronRight,
  Star,
  Truck,
  ShieldCheck,
  Check,
  HelpCircle,
  MapPin,
  RotateCcw,
  BadgePercent,
  Play,
  MessageCircle,
  Mail,
  User,
  Info,
  Loader2,
  Sparkles,
  ChevronRight as ChevronIcon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState } from "@/components/state/states";
import { PriceDisplay } from "@/components/commerce/price-display";
import { getProductBySlug } from "@/services/product.functions";
import type { ProductDetailDTO, ProductMediaDTO, VariantDTO } from "@/types/catalog";
import { calculateShipping } from "@/services/shipping.functions";
import { formatMoney } from "@/lib/money";
import { getPublicExperienceDocumentBySlug } from "@/services/builder.functions";
import { addToCart } from "@/services/cart.functions";
import { useCartContext } from "@/lib/cart-context";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExperienceRenderer } from "@/components/commerce/experience-renderer";
import { getProductReviewStats, getProductReviewsList, getStoreFollowStatus, toggleStoreFollow, submitProductReview } from "@/services/social.functions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const getColorHex = (name: string): string => {
  const colors: Record<string, string> = {
    preto: "#000000",
    black: "#000000",
    branco: "#ffffff",
    white: "#ffffff",
    vermelho: "#ef4444",
    red: "#ef4444",
    azul: "#3b82f6",
    blue: "#3b82f6",
    verde: "#22c55e",
    green: "#22c55e",
    rosa: "#ec4899",
    pink: "#ec4899",
    amarelo: "#eab308",
    yellow: "#eab308",
    cinza: "#6b7280",
    gray: "#6b7280",
    grey: "#6b7280",
    marrom: "#78350f",
    brown: "#78350f",
    laranja: "#f97316",
    orange: "#f97316",
    roxo: "#a855f7",
    purple: "#a855f7",
    bege: "#f5f5dc",
    beige: "#f5f5dc",
    dourado: "#fbbf24",
    gold: "#fbbf24",
    prateado: "#9ca3af",
    silver: "#9ca3af",
    nude: "#e5c1a7",
    "rose ritual": "#d27d7d",
    "cutie pie": "#e29d95",
    "petal talk": "#f5c3c2",
    devoted: "#b5515c",
    lilás: "#dfc5fe",
    creme: "#fffdd0",
  };
  const clean = name.toLowerCase().trim();
  if (colors[clean]) return colors[clean];
  
  // Hash fallback
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
};

function SizeGuideDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Guia de Tamanhos (Padrão BR)</DialogTitle>
          <DialogDescription>
            Use a tabela abaixo para selecionar o tamanho ideal com base na medida do seu pé.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 overflow-hidden rounded-lg border">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-muted">
                <th className="p-2.5 font-bold border-b">Tamanho BR</th>
                <th className="p-2.5 font-bold border-b">Comprimento do Pé (cm)</th>
                <th className="p-2.5 font-bold border-b">Tamanho EUA</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2.5 font-medium">34</td>
                <td className="p-2.5 text-muted-foreground">22.5 cm</td>
                <td className="p-2.5">US 5</td>
              </tr>
              <tr className="border-b bg-muted/20">
                <td className="p-2.5 font-medium">35</td>
                <td className="p-2.5 text-muted-foreground">23.0 cm</td>
                <td className="p-2.5">US 5.5</td>
              </tr>
              <tr className="border-b">
                <td className="p-2.5 font-medium">36</td>
                <td className="p-2.5 text-muted-foreground">23.5 cm</td>
                <td className="p-2.5">US 6.5</td>
              </tr>
              <tr className="border-b bg-muted/20">
                <td className="p-2.5 font-medium">37</td>
                <td className="p-2.5 text-muted-foreground">24.0 cm</td>
                <td className="p-2.5">US 7</td>
              </tr>
              <tr className="border-b">
                <td className="p-2.5 font-medium">38</td>
                <td className="p-2.5 text-muted-foreground">25.0 cm</td>
                <td className="p-2.5">US 8</td>
              </tr>
              <tr className="border-b bg-muted/20">
                <td className="p-2.5 font-medium">39</td>
                <td className="p-2.5 text-muted-foreground">25.5 cm</td>
                <td className="p-2.5">US 8.5</td>
              </tr>
              <tr className="border-b">
                <td className="p-2.5 font-medium">40</td>
                <td className="p-2.5 text-muted-foreground">26.5 cm</td>
                <td className="p-2.5">US 9.5</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground leading-normal">
          * Dica: Se ficar entre dois tamanhos, recomendamos escolher a numeração maior para maior conforto.
        </p>
      </DialogContent>
    </Dialog>
  );
}

export const Route = createFileRoute("/_store/produto/$slug")({
  head: ({ loaderData }) => {
    const result = (loaderData as any)?.productResult;
    if (!result || result.status !== "ok") {
      return { meta: [{ title: "Produto — Hr Shoes" }] };
    }
    const product = result.data;
    const title = product.metaTitle || product.seoTitle || `${product.title} — Hr Shoes`;
    const description =
      product.metaDescription || product.seoDescription ||
      (product.description
        ? product.description.replace(/<[^>]+>/g, "").slice(0, 155)
        : `Compre ${product.title} na Hr Shoes. Frete rápido e parcelamento disponível.`);
    const coverUrl = product.media?.[0]?.url ?? null;
    const canonical = `${typeof window !== "undefined" ? window.location.origin : ""}/produto/${product.slug}`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        // Open Graph
        { property: "og:type", content: "product" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...(coverUrl ? [{ property: "og:image", content: coverUrl }] : []),
        { property: "og:url", content: canonical },
        // Twitter Card
        { name: "twitter:card", content: coverUrl ? "summary_large_image" : "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        ...(coverUrl ? [{ name: "twitter:image", content: coverUrl }] : []),
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.title,
            description: (product.shortDescription || (product.description || "").replace(/<[^>]+>/g, "")).slice(0, 300) || undefined,
            image: product.media.filter((m: any) => m.mediaType === "image").map((m: any) => m.url),
            brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
            sku: product.variants?.[0]?.sku,
            gtin: (product.variants?.[0]?.ean ?? product.ean) || undefined,
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
              seller: { "@type": "Organization", name: "Hr Shoes" },
            },
          }),
        },
      ],
    };
  },
  loader: async ({ params }) => {
    const [productRes, templateRes] = await Promise.all([
      getProductBySlug({ data: { slug: params.slug } }),
      // Busca o template global da loja para página de produtos (slug "default-product-template")
      getPublicExperienceDocumentBySlug({ data: { slug: "default-product-template", document_type: "product_template" } })
    ]);
    return {
      productResult: productRes,
      templateTree: templateRes.status === "ok" ? templateRes.data.tree : []
    };
  },
  component: ProductPage,
});


function ProductPage() {
  const { productResult: result, templateTree } = Route.useLoaderData() as any;

  if (result.status === "not_found") {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-20 md:px-6">
        <EmptyState
          title="Produto não encontrado"
          description="Este produto não está disponível ou foi removido do catálogo."
          action={
            <Button asChild>
              <Link to="/catalogo">Ver catálogo</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (result.status === "unconfigured") {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-20 md:px-6">
        <ErrorState description={result.reason} />
      </div>
    );
  }

  if (result.status === "empty") {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-20 md:px-6">
        <ErrorState description="Loja não configurada corretamente." />
      </div>
    );
  }

  return <ProductContent product={result.data} templateTree={templateTree} />;
}

function ProductContent({ product: rawProduct, templateTree }: { product: ProductDetailDTO, templateTree?: any[] }) {
  const coverImage: ProductMediaDTO | null = rawProduct.media[0] ?? null;

  // Sanitize variant attributes to avoid UI breakage due to trailing spaces in keys or values
  const product = useMemo(() => {
    const cleanVariants = rawProduct.variants.map((v: VariantDTO) => {
      const cleanAttrs: Record<string, string> = {};
      if (v.attributes) {
        Object.entries(v.attributes).forEach(([k, val]) => {
          cleanAttrs[k.trim()] = val != null ? String(val).trim() : "";
        });
      }
      return { ...v, attributes: cleanAttrs };
    });
    return { ...rawProduct, variants: cleanVariants };
  }, [rawProduct]);

  // Collect unique attribute keys across all variants.
  const attributeKeys: string[] = Array.from(
    new Set(product.variants.flatMap((v: VariantDTO) => Object.keys(v.attributes))),
  );

  const allOutOfStock =
    product.variants.length > 0 && product.variants.every((v: VariantDTO) => v.availableQty <= 0);

  const router = useRouter();

  // Initialize selected attributes with the first variant's attributes
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>(
    product.variants.length > 0 ? product.variants[0].attributes : {},
  );
  const [isAdding, setIsAdding] = useState(false);
  const [activeMedia, setActiveMedia] = useState<ProductMediaDTO | null>(coverImage);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [zipcode, setZipcode] = useState("");
  const [shippingRates, setShippingRates] = useState<any[] | null>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);

  // Social Stats Queries
  const { data: reviewStats } = useQuery({
    queryKey: ["reviewStats", product.id],
    queryFn: () => getProductReviewStats({ data: { productId: product.id } }),
    initialData: { average_rating: 0, total_reviews: 0 }
  });

  const { data: reviewsList, refetch: refetchReviews } = useQuery({
    queryKey: ["reviewsList", product.id],
    queryFn: () => getProductReviewsList({ data: { productId: product.id } }),
    initialData: []
  });

  const { data: followStatus, refetch: refetchFollowStatus } = useQuery({
    queryKey: ["storeFollow"],
    queryFn: () => getStoreFollowStatus(),
    initialData: { following: false }
  });

  const isFollowingStore = followStatus.following;

  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [shippingOrigin, setShippingOrigin] = useState<"national" | "international">("national");

  // Find the matching variant
  const selectedVariant = product.variants.find((v: VariantDTO) => {
    return Object.entries(selectedAttributes).every(([key, val]) => v.attributes[key] === val);
  });

  // Watch selected variant to change active media automatically if variant has custom media
  useMemo(() => {
    if (selectedVariant && selectedVariant.media && selectedVariant.media.length > 0) {
      setActiveMedia(selectedVariant.media[0]);
    }
  }, [selectedVariant]);

  const { refreshCart, setIsCartOpen, setCartData } = useCartContext();

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      toast.error("Por favor, selecione as opções do produto.");
      return;
    }

    if (selectedVariant.availableQty <= 0) {
      toast.error("Esta opção está sem estoque no momento.");
      return;
    }

    setIsAdding(true);
    try {
      const res = await addToCart({ data: { variantId: selectedVariant.id, quantity: 1 } });
      toast.success("Adicionado ao carrinho");
      if (res.session_token) {
        document.cookie = `hr_shoes_guest_session=${res.session_token}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
      }
      if (res.cart) {
        setCartData(res.cart as any);
      } else {
        await refreshCart();
      }
      setIsCartOpen(true);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao adicionar ao carrinho.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleCalculateShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = zipcode.replace(/\D/g, "");
    if (clean.length < 8) {
      toast.error("Digite um CEP válido com 8 dígitos.");
      return;
    }
    setLoadingShipping(true);
    try {
      const res = await calculateShipping({ data: { zipcode: clean } });
      if (res) {
        setShippingRates(res);
        if (res.length === 0) {
          toast.info("Nenhuma transportadora atende a esta região.");
        } else {
          toast.success("Frete calculado com sucesso!");
        }
      } else {
        toast.error("Erro ao calcular frete.");
      }
    } catch (error) {
      toast.error("Falha de rede ao calcular frete.");
    } finally {
      setLoadingShipping(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || newComment.length < 5) {
      toast.error("O comentário deve ter pelo menos 5 caracteres.");
      return;
    }
    setIsSubmittingReview(true);
    try {
      const res = await submitProductReview({
        data: {
          productId: product.id,
          rating: newRating,
          comment: newComment,
        }
      });

      if (res.success) {
        toast.success("Avaliação enviada com sucesso!");
        setNewComment("");
        setNewRating(5);
        refetchReviews();
        router.invalidate();
      } else {
        toast.error("Erro ao enviar avaliação. Faça login primeiro.");
      }
    } catch (err: any) {
      toast.error(err.message || "Você precisa estar autenticado como cliente para avaliar.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleToggleFollow = async () => {
    try {
      const res = await toggleStoreFollow();
      toast.success(res.following ? "Você agora está seguindo a loja!" : "Você deixou de seguir a loja.");
      refetchFollowStatus();
    } catch (err: any) {
      toast.error(err.message || "Você precisa estar autenticado como cliente para seguir a loja.");
    }
  };

  const parseYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  return (
    <>
      <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12">
        {/* Breadcrumb */}
        <nav
          aria-label="Navegação estrutural"
          className="mb-6 flex items-center gap-2 text-xs text-muted-foreground"
        >
          <Link to="/" className="hover:text-foreground">
            Início
          </Link>
          <ChevronRight className="size-3" aria-hidden />
          <Link to="/catalogo" className="hover:text-foreground">
            Catálogo
          </Link>
          {product.categories && product.categories.length > 0 && (
            <>
              <ChevronRight className="size-3" aria-hidden />
              <Link to="/catalogo" search={{ categoria: product.categories[0].slug }} className="hover:text-foreground truncate max-w-[150px]">
                {product.categories[0].name}
              </Link>
            </>
          )}
          <ChevronRight className="size-3" aria-hidden />
          <span className="text-foreground font-medium truncate max-w-[200px]">
            {product.title}
          </span>
        </nav>

        {/* Product Workspace Split */}
        <div className="grid gap-8 md:grid-cols-12 lg:gap-14">
          {/* LADO ESQUERDO: Media Switcher com strip vertical (SHEIN style) */}
          <div className="md:col-span-6 flex gap-3.5 items-start">
            {/* Strip vertical esquerdo de thumbnails */}
            {product.media.length > 0 && (
              <div className="hidden sm:flex flex-col gap-2 w-16 shrink-0 max-h-[480px] overflow-y-auto pr-1">
                {product.media.map((m: ProductMediaDTO) => {
                  const isVideo = m.mediaType === "video";
                  const active = activeMedia?.id === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setActiveMedia(m)}
                      className={`relative aspect-square w-14 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                        active ? "border-primary scale-[1.03]" : "border-border/60 hover:border-primary/50 bg-secondary"
                      }`}
                    >
                      {isVideo ? (
                        <div className="relative size-full bg-black/20 flex items-center justify-center">
                          <Play className="size-4 text-white fill-white relative z-10" />
                          {m.url.includes("youtube.com") || m.url.includes("youtu.be") ? (
                            <img
                              src={`https://img.youtube.com/vi/${parseYoutubeId(m.url)}/hqdefault.jpg`}
                              alt="Video thumbnail"
                              className="absolute size-full object-cover opacity-60"
                            />
                          ) : (
                            <ImageOff className="size-4 text-white opacity-40" />
                          )}
                        </div>
                      ) : (
                        <img
                          src={m.url}
                          alt={m.alt ?? ""}
                          loading="lazy"
                          className="size-full object-cover"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Main Screen Viewport */}
            <div className="flex-1 relative aspect-square overflow-hidden rounded-2xl border border-border/80 bg-secondary shadow-xs">
              {activeMedia ? (
                activeMedia.mediaType === "video" ? (
                  parseYoutubeId(activeMedia.url) ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${parseYoutubeId(activeMedia.url)}?autoplay=1`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute size-full"
                      title="Product Video View"
                    ></iframe>
                  ) : (
                    <video
                      src={activeMedia.url}
                      controls
                      autoPlay
                      className="absolute size-full object-contain"
                    />
                  )
                ) : (
                  <img
                    src={activeMedia.url}
                    alt={activeMedia.alt ?? product.title}
                    loading="eager"
                    className="size-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                )
              ) : (
                <div className="grid size-full place-items-center text-muted-foreground">
                  <ImageOff className="size-16 stroke-1" aria-hidden />
                </div>
              )}
            </div>
          </div>

          {/* LADO DIREITO: Info & Atributos Customizados */}
          <div className="md:col-span-6 flex flex-col gap-6 text-left">
            <div className="space-y-2">
              {product.brand && (
                <span className="text-xs font-bold tracking-wider uppercase text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {product.brand}
                </span>
              )}
              <h1 className="text-editorial text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                {product.title}
              </h1>

              {/* Preços Autorizados pelo Servidor com Badges de Desconto */}
              <div className="flex items-baseline gap-3 pt-2">
                <PriceDisplay
                  amountCents={selectedVariant ? selectedVariant.effectivePriceCents : product.priceCents}
                  compareAtCents={product.compareAtCents}
                  size="lg"
                />
                {product.compareAtCents && product.compareAtCents > product.priceCents && (
                  <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 text-xs font-bold px-2 py-0.5">
                    Estimado -{Math.round(((product.compareAtCents - product.priceCents) / product.compareAtCents) * 100)}%
                  </Badge>
                )}
              </div>
            </div>

            {/* Out of stock */}
            {allOutOfStock && !product.allowsPreorder && (
              <Badge variant="destructive" className="w-fit text-xs font-bold py-1 px-3">
                Sem estoque disponível
              </Badge>
            )}

            {/* Selectores de Atributos Customizados */}
            {attributeKeys.length > 0 && (
              <div className="space-y-5 border-t border-b border-border/60 py-5">
                {attributeKeys.map((key: string) => {
                  const values: string[] = Array.from(
                    new Set(
                      product.variants
                        .map((v: VariantDTO) => v.attributes[key])
                        .filter((val): val is string => typeof val === "string"),
                    ),
                  );

                  const isColor = key.toLowerCase() === "cor" || key.toLowerCase() === "color";
                  const isSize = key.toLowerCase() === "tamanho" || key.toLowerCase() === "size";

                  return (
                    <div key={key} className="space-y-2.5">
                      <div className="flex justify-between items-center text-sm font-medium text-foreground">
                        <span className="capitalize">
                          {key}: <span className="text-muted-foreground font-normal">{selectedAttributes[key]}</span>
                        </span>
                        
                        {/* Guia de tamanhos link */}
                        {isSize && (
                          <button
                            type="button"
                            onClick={() => setSizeGuideOpen(true)}
                            className="text-xs text-primary hover:underline font-bold flex items-center gap-1"
                          >
                            <Info className="size-3.5" />
                            Guia de tamanhos
                          </button>
                        )}
                      </div>

                      {/* Renderizador de Cores (Color Swatches) */}
                      {isColor ? (
                        <div className="flex flex-wrap gap-2.5">
                          {values.map((val: string) => {
                            const isSelected = selectedAttributes[key] === val;
                            const colorHex = getColorHex(val);
                            return (
                              <button
                                key={val}
                                type="button"
                                title={val}
                                onClick={() => setSelectedAttributes((prev) => ({ ...prev, [key]: val }))}
                                className={`group relative w-8 h-8 rounded-full border transition-all duration-200 ${
                                  isSelected
                                    ? "ring-2 ring-primary ring-offset-2 border-primary scale-110"
                                    : "border-border/80 hover:scale-105"
                                }`}
                                style={{ backgroundColor: colorHex }}
                              >
                                {val.toLowerCase() === "branco" && (
                                  <span className="absolute inset-0 rounded-full border border-black/10" />
                                )}
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-black text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-20">
                                  {val}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        /* Renderizador de Tamanhos ou Outros Atributos */
                        <div className="flex flex-wrap gap-2">
                          {values.map((val: string) => {
                            const isSelected = selectedAttributes[key] === val;
                            
                            // Check if this specific option is in stock by finding the variant matching selectedAttributes but with this value
                            const hypotheticVariant = product.variants.find((v: VariantDTO) => {
                              const testAttrs = { ...selectedAttributes, [key]: val };
                              return Object.entries(testAttrs).every(([tk, tv]) => v.attributes[tk] === tv);
                            });
                            const isOptionOutOfStock = hypotheticVariant && hypotheticVariant.availableQty <= 0;

                            return (
                              <button
                                key={val}
                                type="button"
                                disabled={isOptionOutOfStock && !product.allowsPreorder}
                                onClick={() => setSelectedAttributes((prev) => ({ ...prev, [key]: val }))}
                                className={`min-h-10 rounded-xl border px-4 py-2.5 text-xs font-semibold tracking-wide transition-all duration-150 ${
                                  isSelected
                                    ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs scale-[1.02]"
                                    : isOptionOutOfStock && !product.allowsPreorder
                                    ? "border-dashed border-border/40 text-muted-foreground/40 bg-muted/20 cursor-not-allowed line-through opacity-50"
                                    : "border-border bg-card text-foreground hover:border-primary hover:text-primary"
                                }`}
                              >
                                {val}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Origem de Envio ("Enviado por") */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Enviado por</span>
              <div className="flex gap-2">
                <div
                  className={`flex-1 py-2 px-3 border rounded-xl text-xs font-bold transition-all border-primary bg-primary/5 text-primary text-center`}
                >
                  {shippingOrigin === "national" ? "Envio Nacional" : "Envio Internacional"}
                </div>
              </div>

              {shippingOrigin === "international" && (
                <div className="p-3 border border-amber-500/20 bg-amber-500/5 rounded-xl text-[11px] text-amber-800 leading-normal flex items-start gap-2">
                  <Info className="size-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Produto Internacional sujeito à declaração de importação e eventuais tributos alfandegários estaduais e federais.
                  </span>
                </div>
              )}
            </div>

            {/* Simulação de Frete e Prazos */}
            <div className="p-4 border rounded-2xl bg-card space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Truck className="size-4 text-primary" />
                <span>Simulador de Frete</span>
              </div>
              
              <form onSubmit={handleCalculateShipping} className="flex gap-2">
                <Input
                  placeholder="Digite seu CEP (Ex: 89801-000)"
                  value={zipcode}
                  onChange={(e) => setZipcode(e.target.value)}
                  className="h-9 text-xs bg-muted/40"
                />
                <Button type="submit" size="sm" className="h-9 font-bold px-4" disabled={loadingShipping}>
                  {loadingShipping ? <Loader2 className="size-4 animate-spin" /> : "Calcular"}
                </Button>
              </form>

              {shippingRates ? (
                <div className="space-y-2 pt-1">
                  {shippingRates.map((rate) => (
                    <div key={rate.id} className="flex justify-between items-center text-xs p-2.5 border rounded-lg bg-muted/10">
                      <div>
                        <p className="font-bold text-foreground">{rate.name}</p>
                        <p className="text-[10px] text-muted-foreground">Prazo estimado: {rate.estimated_days} dias úteis</p>
                      </div>
                      <span className="font-bold text-primary">
                        {rate.price_cents === 0 ? (
                          <span className="text-emerald-600 font-bold">Grátis</span>
                        ) : (
                          formatMoney(rate.price_cents)
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                /* Card Padrão de Prazos SHEIN */
                <div className="space-y-3 pt-1 text-xs">
                  <div className="flex items-start gap-2.5">
                    <Check className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-foreground">Frete grátis (pedidos acima de R$ 69,00)</p>
                      <p className="text-[10px] text-muted-foreground leading-normal">
                        Entrega estimada em 12 a 18 dias úteis para a sua localidade.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 pt-1 border-t border-border/40">
                    <RotateCcw className="size-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-muted-foreground leading-normal">
                      Os itens desta categoria possuem garantia e podem ser devolvidos ou trocados em até 7 dias.
                    </p>
                  </div>
                </div>
              )}

              {/* Selos de Confiança */}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-3 border-t border-border/40 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-emerald-600 fill-emerald-600/10" />
                  Pagamento Seguro
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-emerald-600 fill-emerald-600/10" />
                  Proteção de Privacidade
                </span>
              </div>
            </div>

            {/* Add to cart */}
            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full font-bold text-sm h-12 uppercase tracking-wider bg-primary hover:bg-primary/95 transition-transform duration-100 hover:scale-[1.01]"
                onClick={handleAddToCart}
                disabled={
                  isAdding || allOutOfStock || (selectedVariant && selectedVariant.availableQty <= 0)
                }
              >
                <ShoppingBag className="size-5 mr-2" aria-hidden />
                {isAdding ? "Adicionando..." : "Adicionar ao carrinho"}
              </Button>

              {product.allowsPreorder && (
                <p className="text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-xl border border-dashed text-center">
                  🚚 Este produto está em pré-venda. Ele será produzido e enviado sob encomenda.
                </p>
              )}
            </div>

            {/* Card "Sobre a Loja" */}
            <div className="p-4 border rounded-2xl bg-card flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-lg overflow-hidden border border-primary/20 shadow-xs">
                  {product.brand ? product.brand.substring(0, 2).toUpperCase() : "HR"}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-foreground">{product.brand || "Hr Shoes"}</h3>
                    <Badge className="bg-primary/15 text-primary hover:bg-primary/20 text-[9px] uppercase tracking-wider px-1.5 py-0">
                      Marca Oficial
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium mt-1">
                    <span>999K+ Vendidos</span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/60" />
                    <span className="text-emerald-600">★ 4.9 (1.2K+ Seguintes)</span>
                  </div>
                </div>
              </div>

              <Button
                size="sm"
                variant={isFollowingStore ? "secondary" : "outline"}
                className="text-xs font-bold"
                onClick={handleToggleFollow}
              >
                {isFollowingStore ? "Seguindo" : "+ Seguir"}
              </Button>
            </div>

            {/* Description */}
            {product.shortDescription && (
                <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-3 italic">
                  {product.shortDescription}
                </p>
              )}
              {product.description && (
              <div className="border-t border-border/60 pt-5 space-y-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Descrição do Calçado</h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Seção de Comentários e Avaliações Reais dos Clientes */}
      <div className="border-t border-border bg-muted/20 py-12">
        <div className="mx-auto max-w-screen-xl px-4 md:px-6">
          <div className="grid gap-10 md:grid-cols-12">
            
            {/* Esquerda: Média Geral das Notas */}
            <div className="md:col-span-4 space-y-4 text-left">
              <h2 className="text-xl font-bold uppercase tracking-tight text-foreground">Comentários dos Clientes</h2>
              
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-foreground">{reviewStats.average_rating > 0 ? reviewStats.average_rating.toFixed(1) : "-"}</span>
                <span className="text-sm text-muted-foreground">/ 5.0</span>
              </div>

              <div className="flex items-center gap-0.5 text-amber-500">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className={`size-5 ${star <= Math.round(reviewStats.average_rating) ? "fill-current" : "text-muted-foreground/30"}`} />
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                Baseado em {reviewStats.total_reviews} avaliações de clientes. Compartilhe sua experiência de uso abaixo.
              </p>

              {/* Formulário para Inserir Avaliação Real */}
              <form onSubmit={handleSubmitReview} className="p-4 border rounded-xl bg-card space-y-3.5 shadow-xs">
                <h3 className="font-bold text-xs uppercase text-muted-foreground">Escrever uma Avaliação</h3>
                
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-foreground">Sua Nota:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className={`size-6 transition-colors ${
                          star <= newRating ? "text-amber-500 fill-amber-500" : "text-border hover:text-amber-400"
                        }`}
                      >
                        <Star className="size-5 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-foreground">Seu Comentário:</span>
                  <textarea
                    placeholder="Conte sua opinião sobre conforto, tamanho e material..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    className="w-full text-xs p-2 border rounded-md focus-visible:outline-primary focus-visible:ring-1 bg-muted/20"
                  />
                </div>

                <Button type="submit" size="sm" className="w-full font-bold text-xs" disabled={isSubmittingReview}>
                  {isSubmittingReview ? "Enviando..." : "Publicar Avaliação"}
                </Button>
              </form>
            </div>

            {/* Direita: Lista de Comentários */}
            <div className="md:col-span-8 flex flex-col gap-5 mt-8 md:mt-0">
              {reviewsList.length === 0 ? (
                <div className="p-8 border border-dashed rounded-2xl flex flex-col items-center justify-center text-center gap-3 bg-card/50">
                  <MessageCircle className="size-10 text-muted-foreground/50" />
                  <div>
                    <h4 className="font-bold text-foreground">Nenhuma avaliação ainda</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mt-1">
                      Seja o primeiro a compartilhar o que você achou deste produto.
                    </p>
                  </div>
                </div>
              ) : (
                reviewsList.map((review: any) => (
                  <div key={review.id} className="p-5 border rounded-2xl bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                          {review.userName.substring(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                            {review.userName}
                            <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-[9px] uppercase tracking-wider px-1.5 py-0 border-emerald-500/20">
                              Verificado
                            </Badge>
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`size-3.5 ${star <= review.rating ? "fill-current" : "text-muted-foreground/30"}`} />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-foreground leading-relaxed pl-10.5">
                        "{review.comment}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      </div>

      <SizeGuideDialog open={sizeGuideOpen} onOpenChange={setSizeGuideOpen} />

      {/* ZONA DO BUILDER: Template Híbrido da Página de Produto */}
      {templateTree && templateTree.length > 0 && (
        <div className="w-full border-t border-border bg-card">
          <ExperienceRenderer nodes={templateTree} transientData={{ product }} />
        </div>
      )}
    </>
  );
}
