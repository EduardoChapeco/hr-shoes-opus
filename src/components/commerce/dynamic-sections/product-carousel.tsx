import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { ProductCard } from "@/components/commerce/product-card";
import { useQuery } from "@tanstack/react-query";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductCarouselProps {
  node_id: string;
  block_type: string;
  content?: {
    title?: string;
    subtitle?: string;
    collection_slug?: string;
  };
  design_tokens?: any;
  data_bindings?: any;
  transientData?: any;
  // resolvedData is injected by ExperienceRenderer from node.transient_data
  resolvedData?: any;
  isEditing?: boolean;
}

/**
 * ProductCarousel — reads products from server-resolved transient_data.
 * NEVER issues its own network requests. If transient_data is absent,
 * shows an honest empty state. No mock data, no fallback lists.
 */
import { listPublishedProducts, getProductsByCollection } from "@/services/catalog.functions";
import { Loader2 } from "lucide-react";

export function ProductCarousel({ content, design_tokens, data_bindings, transientData, resolvedData, isEditing }: ProductCarouselProps) {
  // Support both object wrapped products and direct products array
  const products: any[] = resolvedData?.products || (Array.isArray(resolvedData) ? resolvedData : null) || transientData?.products || [];

  const bindingType = data_bindings?.type || data_bindings?.source;
  const collectionSlug = data_bindings?.collection_slug || content?.collection_slug;

  const isCollection = bindingType === "product_collection" && collectionSlug;
  const isLatest = bindingType === "latest_products" || bindingType === "dynamic_products" || (!bindingType && products.length === 0);

  const shouldFetchClient = !!isEditing && products.length === 0;

  const { data: clientCollectionProducts, isLoading: isCollectionLoading } = useQuery({
    queryKey: ["editorCollectionProducts", collectionSlug],
    queryFn: async () => {
      const res = await getProductsByCollection({ data: { slug: collectionSlug! } });
      return res.status === "ok" ? res.data : [];
    },
    enabled: !!(shouldFetchClient && isCollection)
  });

  const { data: clientLatestProducts, isLoading: isLatestLoading } = useQuery({
    queryKey: ["editorLatestProducts", data_bindings?.limit],
    queryFn: async () => {
      const res = await listPublishedProducts({ data: { limit: data_bindings?.limit || 12 } });
      return res.status === "ok" ? res.data : [];
    },
    enabled: !!(shouldFetchClient && isLatest)
  });

  const isLoading = shouldFetchClient && (isCollectionLoading || isLatestLoading);

  const activeProducts = products.length > 0
    ? products
    : (isCollection ? (clientCollectionProducts || []) : (clientLatestProducts || []));

  return (
    <div
      className={cn("w-full py-12 @@md:py-24 overflow-hidden", design_tokens?.className)}
      style={{
        backgroundColor: design_tokens?.backgroundColor,
        color: design_tokens?.textColor,
      }}
    >
      <div className="mx-auto max-w-[1400px] px-4 @@md:px-8">
        <div className="flex items-end justify-between mb-8 @@md:mb-12">
          <div>
            {content?.title && (
              <h2 className="text-2xl @@md:text-4xl font-bold tracking-tight mb-2">
                {content.title}
              </h2>
            )}
            {content?.subtitle && (
              <p className="text-muted-foreground text-sm @@md:text-lg">
                {content.subtitle}
              </p>
            )}
          </div>
          <Button variant="ghost" className="hidden @@md:flex gap-2 group" asChild>
            <Link to="/catalogo">
              Ver Todos
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-4 text-muted-foreground border-2 border-dashed border-border rounded-lg">
            <Loader2 className="h-10 w-10 animate-spin opacity-50" />
            <div>
              <p className="font-medium">Carregando produtos...</p>
            </div>
          </div>
        ) : activeProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-4 text-muted-foreground border-2 border-dashed border-border rounded-lg">
            <ShoppingBag className="h-10 w-10 opacity-30" />
            <div>
              <p className="font-medium">Nenhum produto disponível</p>
              <p className="text-sm mt-1">Cadastre produtos ativos no painel para que apareçam aqui.</p>
            </div>
          </div>
        ) : (
          <Carousel
            opts={{ align: "start", loop: true }}
            className="w-full relative"
          >
            <CarouselContent className="-ml-2 @@md:-ml-4">
              {activeProducts.map((product: any) => (
                <CarouselItem key={product.id} className="pl-2 @@md:pl-4 basis-4/5 @@md:basis-1/3 @@lg:basis-1/4">
                  <ProductCard product={product} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden @@md:flex -left-6" />
            <CarouselNext className="hidden @@md:flex -right-6" />
          </Carousel>
        )}
      </div>
    </div>
  );
}
