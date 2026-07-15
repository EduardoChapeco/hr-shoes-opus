import { createFileRoute, Link } from "@tanstack/react-router";
import { getSellerShowcase } from "@/services/seller.functions";
import { ErrorState, EmptyState } from "@/components/state/states";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/_store/vendedora/$slug")({
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData && loaderData.status === "success" 
          ? `${loaderData.data.title} — Hr Shoes` 
          : "Vitrine — Hr Shoes",
      },
    ],
  }),
  loader: ({ params }) => getSellerShowcase({ data: { slug: params.slug } }),
  component: SellerShowcasePage,
});

function SellerShowcasePage() {
  const result = Route.useLoaderData();

  if (result.status === "not_found") {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-20 md:px-6">
        <EmptyState
          title="Vitrine não encontrada"
          description="Esta vendedora não possui uma vitrine ativa no momento."
          action={
            <Button asChild>
              <Link to="/catalogo">Ir para o catálogo</Link>
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

  const showcase = result.data;

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-12 md:px-6 lg:py-16">
      {/* Seller Header */}
      <div className="mb-12 flex flex-col items-center text-center">
        <div className="mb-6 h-32 w-32 overflow-hidden rounded-full border-4 border-background bg-secondary shadow-lg">
          {showcase.bannerUrl ? (
            <img 
              src={showcase.bannerUrl} 
              alt={showcase.title} 
              className="h-full w-full object-cover" 
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary/10 text-4xl font-bold text-primary">
              {showcase.title.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <h1 className="mb-3 text-3xl font-bold text-foreground sm:text-4xl">
          {showcase.title}
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          {showcase.description || `Bem-vinda(o) à minha vitrine oficial da Hr Shoes! Navegue pelo catálogo e faça suas escolhas.`}
        </p>
        
        <div className="mt-8">
          <Button asChild size="lg" className="rounded-full px-8">
            <Link to="/catalogo">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Ver Produtos Selecionados
            </Link>
          </Button>
        </div>
      </div>

      {/* 
        Aqui no futuro podemos listar as Collections (Coleções de Curadoria) 
        que a vendedora montou, ou apenas injetar o grid geral. 
        Por enquanto, o botão redireciona para o catálogo global, e o cookie de afiliado
        já foi gravado no browser do cliente pelo SSR Loader.
      */}
    </div>
  );
}
