import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, UnconfiguredState, ErrorState } from "@/components/state/states";
import { ProductCard } from "@/components/commerce/product-card";
import type { ProductListResult } from "@/types/catalog";

function ProductSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-[4/5] rounded-xl" />
      <Skeleton className="h-3 w-3/4 rounded" />
      <Skeleton className="h-3 w-1/2 rounded" />
    </div>
  );
}

export function ProductGrid({
  isLoading,
  result,
}: {
  isLoading?: boolean;
  result: ProductListResult;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (result.status === "unconfigured") {
    return <UnconfiguredState title="Catálogo não disponível" description={result.reason} />;
  }

  if (result.status === "error") {
    return <ErrorState description={result.message} />;
  }

  if (result.status === "empty" || !result.data || result.data.length === 0) {
    return (
      <EmptyState
        title="Nenhum produto publicado ainda"
        description="Assim que a loja publicar os primeiros produtos, eles aparecerão aqui."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {result.data.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
