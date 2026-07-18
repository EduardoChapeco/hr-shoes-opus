import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ImageOff, ShoppingBag, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState } from "@/components/state/states";
import { PriceDisplay } from "@/components/commerce/price-display";
import { getProductBySlug } from "@/services/product.functions";
import { addToCart } from "@/services/cart.functions";
import { getPublicExperienceDocumentBySlug } from "@/services/builder.functions";
import type { ProductDetailDTO, ProductMediaDTO, VariantDTO } from "@/types/catalog";
import { toast } from "sonner";
import { useState } from "react";
import { ExperienceRenderer } from "@/components/commerce/experience-renderer";

export const Route = createFileRoute("/_store/produto/$slug")({
  head: () => ({
    meta: [{ title: "Hr Shoes — Produto" }],
  }),
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

  if (result.status === "error") {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-20 md:px-6">
        <ErrorState description={result.message} />
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

function ProductContent({ product, templateTree }: { product: ProductDetailDTO, templateTree?: any[] }) {
  const coverImage: ProductMediaDTO | null = product.media[0] ?? null;

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

  // Find the matching variant
  const selectedVariant = product.variants.find((v: VariantDTO) => {
    return Object.entries(selectedAttributes).every(([key, val]) => v.attributes[key] === val);
  });

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
      await addToCart({ data: { variantId: selectedVariant.id, quantity: 1 } });
      toast.success("Adicionado ao carrinho");
      router.invalidate();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao adicionar ao carrinho.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12">
        {/* Breadcrumb */}
        <nav
          aria-label="Navegação estrutural"
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Link to="/" className="hover:text-foreground">
            Início
          </Link>
          <ChevronRight className="size-3" aria-hidden />
          <Link to="/catalogo" className="hover:text-foreground">
            Catálogo
          </Link>
          <ChevronRight className="size-3" aria-hidden />
          <span className="text-foreground">{product.title}</span>
        </nav>

        <div className="grid gap-10 md:grid-cols-2 lg:gap-16">
          {/* Media */}
          <div className="space-y-3">
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-secondary">
              {coverImage ? (
                <img
                  src={coverImage.url}
                  alt={coverImage.alt ?? product.title}
                  loading="eager"
                  className="size-full object-cover"
                />
              ) : (
                <div className="grid size-full place-items-center text-muted-foreground">
                  <ImageOff className="size-12" aria-hidden />
                </div>
              )}
            </div>
            {/* Thumbnail strip */}
            {product.media.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.media.slice(0, 6).map((m: ProductMediaDTO) => (
                  <div
                    key={m.id}
                    className="aspect-square w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary"
                  >
                    <img
                      src={m.url}
                      alt={m.alt ?? ""}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-5">
            {product.brand && <p className="eyebrow text-muted-foreground">{product.brand}</p>}
            <h1 className="text-editorial text-2xl text-foreground sm:text-3xl">{product.title}</h1>

            {/* Price — server-authoritative, only formatted here */}
            <PriceDisplay
              amountCents={product.priceCents}
              compareAtCents={product.compareAtCents}
              size="lg"
            />

            {/* Out of stock */}
            {allOutOfStock && !product.allowsPreorder && (
              <Badge variant="secondary">Sem estoque disponível</Badge>
            )}

            {/* Variant attribute selectors */}
            {attributeKeys.length > 0 && (
              <div className="space-y-4">
                {attributeKeys.map((key: string) => {
                  const values: string[] = Array.from(
                    new Set(
                      product.variants
                        .map((v: VariantDTO) => v.attributes[key])
                        .filter((val): val is string => typeof val === "string"),
                    ),
                  );
                  return (
                    <div key={key}>
                      <p className="mb-2 text-sm font-medium capitalize text-foreground">{key}</p>
                      <div className="flex flex-wrap gap-2">
                        {values.map((val: string) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setSelectedAttributes((prev) => ({ ...prev, [key]: val }))}
                            className={`min-h-10 rounded-lg border px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                              selectedAttributes[key] === val
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card text-foreground hover:border-primary hover:text-primary"
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add to cart */}
            <Button
              size="lg"
              className="w-full"
              onClick={handleAddToCart}
              disabled={
                isAdding || allOutOfStock || (selectedVariant && selectedVariant.availableQty <= 0)
              }
            >
              <ShoppingBag className="size-5 mr-2" aria-hidden />
              {isAdding ? "Adicionando..." : "Adicionar ao carrinho"}
            </Button>

            {product.allowsPreorder && (
              <p className="text-xs text-muted-foreground">
                Este produto está disponível para encomenda.
              </p>
            )}

            {/* Description */}
            {product.description && (
              <div className="border-t border-border pt-5">
                <h2 className="mb-3 text-sm font-semibold text-foreground">Descrição</h2>
                <p className="text-sm text-muted-foreground">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ZONA DO BUILDER: Template Híbrido da Página de Produto */}
      {templateTree && templateTree.length > 0 && (
        <div className="w-full border-t border-border bg-card">
          <ExperienceRenderer nodes={templateTree} transientData={{ product }} />
        </div>
      )}
    </>
  );
}
