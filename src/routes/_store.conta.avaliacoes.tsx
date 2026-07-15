import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getServerClient } from "@/lib/supabase";
import { getSSRClient } from "@/lib/supabase-ssr";
import { EmptyState } from "@/components/state/states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

// ---------------------------------------------------------------------------
// Server function
// ---------------------------------------------------------------------------

const listCustomerReviews = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const ssrClient = getSSRClient();
    const {
      data: { user },
    } = await ssrClient.auth.getUser();
    if (!user) throw new Error("Não autorizado");

    const db = getServerClient();
    const { data, error } = await db
      .from("reviews")
      .select("id, rating, comment, status, created_at, products!reviews_product_id_fkey(name, slug)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return {
      status: "ok" as const,
      data: (data || []).map((r: any) => ({
        id: r.id as string,
        rating: r.rating as number,
        comment: r.comment as string | null,
        status: r.status as string,
        createdAt: r.created_at as string,
        productName: r.products?.name as string | null,
        productSlug: r.products?.slug as string | null,
      })),
    };
  } catch (e: any) {
    return { status: "error" as const, message: e.message || "Erro ao buscar avaliações." };
  }
});

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/_store/conta/avaliacoes")({
  head: () => ({ meta: [{ title: "Minhas Avaliações — Hr Shoes" }] }),
  loader: async () => {
    const res = await listCustomerReviews();
    if (res.status === "error") throw new Error(res.message);
    return res.data;
  },
  component: Page,
});

const STATUS_LABELS: Record<string, string> = {
  pending: "Em análise",
  approved: "Publicada",
  rejected: "Recusada",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} de 5 estrelas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-4 ${i < rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
          aria-hidden
        />
      ))}
    </div>
  );
}

function Page() {
  const reviews = Route.useLoaderData();

  return (
    <section>
      <h2 className="text-editorial text-2xl text-foreground mb-6">Minhas Avaliações</h2>

      {reviews.length === 0 ? (
        <EmptyState
          title="Nenhuma avaliação"
          description="Você ainda não avaliou nenhum produto. Após receber um pedido, você poderá deixar sua opinião."
          action={
            <Button asChild>
              <Link to="/catalogo">Explorar produtos</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  {review.productSlug ? (
                    <Link
                      to="/produto/$slug"
                      params={{ slug: review.productSlug }}
                      className="text-sm font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {review.productName}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium text-foreground">{review.productName}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(review.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANTS[review.status] ?? "secondary"}>
                  {STATUS_LABELS[review.status] ?? review.status}
                </Badge>
              </div>
              <StarRating rating={review.rating} />
              {review.comment && (
                <p className="mt-3 text-sm text-muted-foreground">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
