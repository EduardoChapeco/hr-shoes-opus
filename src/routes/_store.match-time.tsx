import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  startMatchTimeSession,
  getNextProductsForSwipe,
  recordSwipe,
  getCustomerAffinityRecommendations,
} from "@/services/match-time.functions";
import { Button } from "@/components/ui/button";
import { X, Heart, Sparkles, ShoppingBag, Eye, QrCode } from "lucide-react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/_store/match-time")({
  head: () => ({ meta: [{ title: "Match Time — Descubra seus favoritos" }] }),
  component: MatchTimePage,
});

function MatchTimePage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Swipe animation states
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);

  // Recommendations state
  const [matches, setMatches] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const sessionRes = await startMatchTimeSession();
        if (sessionRes.status !== "success") {
          setError((sessionRes as any).message || "Erro de carregamento");
          setIsLoading(false);
          return;
        }
        setSessionId(sessionRes.data.sessionId);

        const prodRes = await getNextProductsForSwipe();
        if ("status" in prodRes && prodRes.status === "unconfigured") {
          setError(prodRes.message);
        } else {
          setProducts(prodRes as any[]);
        }
      } catch {
        setError("Erro de conexão");
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Fetch affinity recommendations when swipes end
  const loadAffinities = async () => {
    setLoadingRecs(true);
    try {
      const res = await getCustomerAffinityRecommendations();
      if (res && "status" in res && res.status === "success") {
        setMatches(res.data.matches || []);
        setRecommendations(res.data.recommendations || []);
      }
    } catch {
      toast.error("Erro ao carregar recomendações de afinidade");
    } finally {
      setLoadingRecs(false);
    }
  };

  const currentProduct = products[currentIndex];

  useEffect(() => {
    if (products.length > 0 && currentIndex >= products.length) {
      loadAffinities();
    }
  }, [currentIndex, products.length]);

  const handleSwipe = async (action: "like" | "dislike") => {
    if (!sessionId || !currentProduct) return;

    // Trigger animation
    setSwipeDirection(action === "like" ? "right" : "left");

    // Wait for animation to finish before updating index
    setTimeout(async () => {
      setCurrentIndex((prev) => prev + 1);
      setSwipeDirection(null);

      try {
        const res = await recordSwipe({
          data: {
            sessionId,
            productId: currentProduct.id,
            action,
          },
        });
        if ("status" in res && res.status === "unconfigured") {
          toast.error(res.message || "Erro ao registrar avaliação");
        }
      } catch {
        toast.error("Erro ao registrar avaliação");
      }
    }, 300);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Sincronizando seu perfil de descoberta...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background">
        <div className="size-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
          <X className="size-8" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Ops! Ocorreu um erro</h1>
        <p className="text-muted-foreground mb-6 max-w-sm">{error}</p>
        <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
      </div>
    );
  }

  // End of Swipe Session View: Displays Matches and Category Recommendations
  if (currentIndex >= products.length) {
    return (
      <div className="min-h-screen bg-background py-10 px-4">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
              <Sparkles className="size-3.5" />
              Sessão Concluída!
            </div>
            <h1 className="text-3xl md:text-4xl font-editorial font-bold text-foreground">
              Sua Vitrine de Afinidade
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto text-sm">
              Analisamos as suas escolhas em tempo real. Veja os matches diretos e as melhores
              sugestões selecionadas para você.
            </p>
          </div>

          {loadingRecs ? (
            <div className="py-20 text-center space-y-3">
              <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-muted-foreground">
                Calculando seu algoritmo de afinidade...
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Seção 1: Matches Diretos (Produtos que curtiu nesta sessão) */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2 border-b pb-2">
                  <Heart className="size-5 text-primary fill-primary" />
                  Seus Matches ({matches.length})
                </h2>
                {matches.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6">
                    Você não deu like em nenhum produto nesta sessão. Tente uma nova sessão para
                    encontrar favoritos!
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {matches.map((prod) => {
                      const image = prod.media?.[0]?.url || "";
                      return (
                        <div
                          key={prod.id}
                          className="group border rounded-xl overflow-hidden bg-card hover:shadow-md transition-shadow flex flex-col"
                        >
                          <div className="aspect-[4/5] bg-muted relative overflow-hidden">
                            {image && (
                              <img
                                src={image}
                                alt={prod.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            )}
                          </div>
                          <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                            <div>
                              <h3 className="font-semibold text-sm truncate" title={prod.title}>
                                {prod.title}
                              </h3>
                              <p className="text-xs font-semibold text-primary mt-1">
                                {formatMoney(prod.price_cents)}
                              </p>
                            </div>
                            <Button size="sm" className="w-full text-xs" asChild>
                              <Link to="/produto/$slug" params={{ slug: prod.slug }}>
                                <Eye className="size-3.5 mr-1" /> Ver Produto
                              </Link>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Seção 2: Recomendações por Afinidade (Mesma categoria, não swipados) */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2 border-b pb-2">
                  <Sparkles className="size-5 text-yellow-500 fill-yellow-500" />
                  Recomendados para Você ({recommendations.length})
                </h2>
                {recommendations.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6">
                    Sem novas recomendações de afinidade disponíveis no momento. Volte mais tarde!
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {recommendations.map((prod) => {
                      const image = prod.media?.[0]?.url || "";
                      return (
                        <div
                          key={prod.id}
                          className="group border rounded-xl overflow-hidden bg-card hover:shadow-md transition-shadow flex flex-col"
                        >
                          <div className="aspect-[4/5] bg-muted relative overflow-hidden">
                            {image && (
                              <img
                                src={image}
                                alt={prod.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            )}
                          </div>
                          <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                            <div>
                              <h3 className="font-semibold text-sm truncate" title={prod.title}>
                                {prod.title}
                              </h3>
                              <p className="text-xs font-semibold text-primary mt-1">
                                {formatMoney(prod.price_cents)}
                              </p>
                            </div>
                            <Button size="sm" variant="outline" className="w-full text-xs" asChild>
                              <Link to="/produto/$slug" params={{ slug: prod.slug }}>
                                <Eye className="size-3.5 mr-1" /> Ver Detalhes
                              </Link>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-center pt-8 gap-4">
            <Button variant="outline" size="lg" onClick={() => window.location.reload()}>
              Nova Sessão (Swipe)
            </Button>
            <Button size="lg" asChild>
              <Link to="/">Voltar para Vitrine</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const imageUrl = currentProduct.media?.[0]?.url ?? "";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full">
        {/* Swipe Card container */}
        <div
          className={`w-full aspect-[3/4] relative bg-card rounded-3xl overflow-hidden shadow-2xl mb-8 border transition-all duration-300 ${
            swipeDirection === "right"
              ? "translate-x-full rotate-12 opacity-0 bg-green-50/10 border-green-500/50"
              : swipeDirection === "left"
                ? "-translate-x-full -rotate-12 opacity-0 bg-red-50/10 border-red-500/50"
                : "scale-100"
          }`}
        >
          {imageUrl ? (
            <img src={imageUrl} alt={currentProduct.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Sparkles className="size-16 text-muted-foreground/30 animate-pulse" />
            </div>
          )}

          {/* Visual feedback overlays during swipe */}
          {swipeDirection === "right" && (
            <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center backdrop-blur-xs">
              <div className="border-4 border-green-500 text-green-500 font-bold text-2xl uppercase px-6 py-2 rounded-xl rotate-12">
                Amei
              </div>
            </div>
          )}
          {swipeDirection === "left" && (
            <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center backdrop-blur-xs">
              <div className="border-4 border-red-500 text-red-500 font-bold text-2xl uppercase px-6 py-2 rounded-xl -rotate-12">
                Pular
              </div>
            </div>
          )}

          {/* Gradient title card */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 pt-20">
            <h2 className="text-white text-2xl font-editorial font-bold mb-1 leading-tight">
              {currentProduct.title}
            </h2>
            <p className="text-primary font-bold text-lg">
              {formatMoney(currentProduct.price_cents)}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-8 w-full">
          <button
            onClick={() => handleSwipe("dislike")}
            disabled={!!swipeDirection}
            className="w-16 h-16 rounded-full bg-card border border-muted-foreground/20 flex items-center justify-center text-muted-foreground hover:border-red-500 hover:text-red-500 hover:bg-red-500/5 hover:scale-105 transition-all duration-200 active:scale-95 shadow-lg"
          >
            <X size={28} />
          </button>

          <button
            onClick={() => handleSwipe("like")}
            disabled={!!swipeDirection}
            className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:scale-108 hover:shadow-primary/30 transition-all duration-200 active:scale-95 shadow-xl shadow-primary/20"
          >
            <Heart size={32} fill="currentColor" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Arraste ou clique nos botões para classificar os modelos.
        </p>
      </div>
    </div>
  );
}
