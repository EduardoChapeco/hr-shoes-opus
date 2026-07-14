import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { searchProducts } from "@/services/catalog.functions";
import { ProductCard } from "@/components/commerce/product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/buscar")({
  head: () => ({ meta: [{ title: "Buscar — Hr Shoes" }] }),
  component: SearchPage,
});

function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    setError(null);
    try {
      const res = await searchProducts({ data: { query } });
      if (res.status === "ok") {
        setResults(res.data);
      } else {
        setError(res.status === "error" ? res.message : "Erro ao buscar.");
      }
    } catch (e: any) {
      setError("Erro ao conectar.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-editorial text-foreground mb-8 text-center">Encontre o que procura</h1>
      
      <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto mb-12">
        <Input 
          className="h-12 text-lg" 
          placeholder="Ex: Tênis branco, bota de couro..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" size="lg" className="h-12 px-8" disabled={isSearching}>
          <Search className="mr-2 h-5 w-5" />
          {isSearching ? "Buscando..." : "Buscar"}
        </Button>
      </form>

      {error && <p className="text-destructive text-center mb-8">{error}</p>}

      {results !== null && (
        <div>
          {results.length === 0 ? (
            <EmptyState
              title="Nenhum resultado"
              description={`Não encontramos nenhum produto para "${query}". Tente buscar por outros termos.`}
            />
          ) : (
            <>
              <p className="text-muted-foreground mb-6">
                Encontramos {results.length} resultado{results.length !== 1 && "s"}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-10">
                {results.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
