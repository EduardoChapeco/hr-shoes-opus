import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { ProductCard } from "@/components/commerce/product-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductGridProps {
  node_id: string;
  block_type: string;
  content?: {
    title?: string;
    subtitle?: string;
    collection_slug?: string;
    columns?: 2 | 3 | 4;
  };
  design_tokens?: any;
  data_bindings?: any;
  transientData?: any;
  resolvedData?: any;
}

/**
 * ProductGrid — reads products from server-resolved transient_data.
 * NEVER issues its own network requests. Honest empty state when no products.
 */
export function ProductGrid({ content, design_tokens, transientData, resolvedData }: ProductGridProps) {
  const products: any[] = resolvedData?.products || transientData?.products || [];
  const cols = content?.columns ?? 4;
  const colClass = { 2: "grid-cols-2", 3: "grid-cols-2 md:grid-cols-3", 4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" }[cols] ?? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  return (
    <div
      className={cn("w-full py-12 md:py-24", design_tokens?.className)}
      style={{
        backgroundColor: design_tokens?.backgroundColor,
        color: design_tokens?.textColor,
      }}
    >
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <div className="flex items-end justify-between mb-8 md:mb-12">
          <div>
            {content?.title && (
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-2">
                {content.title}
              </h2>
            )}
            {content?.subtitle && (
              <p className="text-muted-foreground text-sm md:text-lg">
                {content.subtitle}
              </p>
            )}
          </div>
          <Button variant="ghost" className="hidden md:flex gap-2 group" asChild>
            <Link to="/catalogo">
              Ver Todos
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-4 text-muted-foreground border-2 border-dashed border-border rounded-lg">
            <ShoppingBag className="h-10 w-10 opacity-30" />
            <div>
              <p className="font-medium">Nenhum produto disponível</p>
              <p className="text-sm mt-1">Cadastre produtos ativos no painel para que apareçam aqui.</p>
            </div>
          </div>
        ) : (
          <div className={cn("grid gap-4 md:gap-6 lg:gap-8", colClass)}>
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {products.length > 0 && (
          <Button variant="outline" className="w-full mt-8 md:hidden" asChild>
            <Link to="/catalogo">Ver Todos</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
