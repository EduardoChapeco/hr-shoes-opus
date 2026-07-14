import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  startMatchTimeSession,
  endMatchTimeSession,
  getNextProductsForSwipe,
  recordSwipe,
} from "@/services/match-time.functions";
import { Button } from "@/components/ui/button";
import { X, Heart } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_store/match-time")({
  head: () => ({ meta: [{ title: "Match Time — Descubra seus favoritos" }] }),
  component: MatchTimePage,
});

function MatchTimePage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const sessionRes = await startMatchTimeSession();
        if (sessionRes.status === "error") {
          setError(sessionRes.message);
          setIsLoading(false);
          return;
        }
        setSessionId(sessionRes.data.sessionId);

        const prodRes = await getNextProductsForSwipe();
        if (prodRes.status === "error") {
          setError(prodRes.message);
        } else {
          setProducts(prodRes.data || []);
        }
      } catch {
        setError("Erro de conexão");
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const handleSwipe = async (action: "like" | "dislike") => {
    if (!sessionId || !products[currentIndex]) return;
    const currentProduct = products[currentIndex];

    // Optimistic UI
    setCurrentIndex((prev) => prev + 1);

    try {
      await recordSwipe({
        data: {
          sessionId,
          productId: currentProduct.id,
          action,
        },
      });
    } catch {
      toast.error("Erro ao registrar avaliação");
    }
  };

  if (isLoading)
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-editorial mb-4">Ops!</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
      </div>
    );
  }

  const currentProduct = products[currentIndex];

  if (!currentProduct) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-card">
        <Heart className="w-16 h-16 text-primary mb-6 animate-pulse" />
        <h1 className="text-3xl font-editorial mb-4">Você viu tudo!</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Não temos mais produtos para te mostrar agora. Baseado no que você curtiu, nossa equipe
          está separando as melhores recomendações.
        </p>
        <Button size="lg" onClick={() => (window.location.href = "/")}>
          Voltar para a Loja
        </Button>
      </div>
    );
  }

  const imageUrl = currentProduct.media?.[0]?.url || "https://placehold.co/600x800?text=Sem+Foto";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full">
        <div className="w-full aspect-[3/4] relative bg-muted rounded-2xl overflow-hidden shadow-xl mb-8">
          <img src={imageUrl} alt={currentProduct.name} className="w-full h-full object-cover" />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
            <h2 className="text-white text-2xl font-editorial font-medium mb-1">
              {currentProduct.name}
            </h2>
            <p className="text-white/80 font-medium">
              {(currentProduct.price_cents / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-8 w-full">
          <button
            onClick={() => handleSwipe("dislike")}
            className="w-16 h-16 rounded-full bg-background border-2 border-muted flex items-center justify-center text-muted-foreground hover:border-destructive hover:text-destructive transition-colors shadow-lg"
          >
            <X size={32} />
          </button>

          <button
            onClick={() => handleSwipe("like")}
            className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:scale-105 transition-transform shadow-xl shadow-primary/25"
          >
            <Heart size={36} fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}
