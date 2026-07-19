import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { Search, X, Loader2 } from "lucide-react";

import { searchProducts } from "@/services/catalog.functions";
import { ProductGrid } from "@/components/commerce/product-grid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/state/states";
import type { ProductListResult } from "@/types/catalog";

const SearchSchema = z.object({
  q: z.string().optional(),
});

export const Route = createFileRoute("/_store/buscar")({
  head: () => ({ meta: [{ title: "Buscar produtos — Hr Shoes" }] }),
  validateSearch: SearchSchema,
  loader: async ({ location }) => {
    const q = (location.search as { q?: string }).q;
    if (!q || q.trim().length < 2) return { result: null, query: q ?? "" };
    const result = await searchProducts({ data: { query: q.trim() } });
    return { result, query: q };
  },
  component: SearchPage,
});

const SUGGESTIONS = [
  "tênis branco",
  "bota de couro",
  "sandália nude",
  "salto alto",
  "mule",
  "scarpin",
];

function SearchPage() {
  const { result: initialResult, query: initialQuery } = Route.useLoaderData() as {
    result: ProductListResult | null;
    query: string;
  };
  const navigate = useNavigate();
  const [input, setInput] = useState(initialQuery ?? "");
  const [result, setResult] = useState<ProductListResult | null>(initialResult);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || trimmed.length < 2) return;

    setIsSearching(true);
    // Update URL
    navigate({ search: { q: trimmed } });

    try {
      const res = await searchProducts({ data: { query: trimmed } });
      setResult(res);
    } catch {
      setResult({ status: "error", message: "Erro ao conectar ao servidor." });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(input);
  };

  const handleClear = () => {
    setInput("");
    setResult(null);
    navigate({ search: {} });
    inputRef.current?.focus();
  };

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-10 md:px-6 md:py-16">
      {/* Hero search area */}
      <div className="mx-auto max-w-2xl text-center mb-10">
        <h1 className="text-editorial text-3xl md:text-4xl text-foreground mb-2">
          Encontre o que procura
        </h1>
        <p className="text-sm text-muted-foreground">
          Busque por nome, marca, cor, tamanho ou estilo.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl mb-10">
        <div className="relative flex items-center">
          <Search
            className="absolute left-4 size-5 text-muted-foreground pointer-events-none"
            aria-hidden
          />
          <Input
            ref={inputRef}
            id="input-buscar"
            type="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="h-14 pl-12 pr-32 text-base rounded-2xl border-border focus-visible:ring-2 focus-visible:ring-primary"
            placeholder="Ex: tênis branco, bota de couro..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Buscar produtos"
          />
          {input && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-[7.5rem] size-7 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Limpar busca"
            >
              <X className="size-4" />
            </button>
          )}
          <Button
            id="btn-buscar"
            type="submit"
            disabled={isSearching || input.trim().length < 2}
            className="absolute right-2 h-10 px-5 rounded-xl"
          >
            {isSearching ? <Loader2 className="size-4 animate-spin" /> : "Buscar"}
          </Button>
        </div>
      </form>

      {/* Suggestions (when no query yet) */}
      {!result && !isSearching && (
        <div className="mx-auto max-w-2xl">
          <p className="text-xs text-muted-foreground text-center mb-4">Sugestões populares</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setInput(s);
                  handleSearch(s);
                }}
                className="px-4 py-2 rounded-full border border-border text-sm hover:bg-accent hover:border-primary/40 transition-colors capitalize"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {isSearching && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-square rounded-2xl bg-muted animate-pulse" />
              <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!isSearching && result && (
        <div className="mt-2">
          {result.status === "ok" && result.data.length === 0 && (
            <EmptyState
              title={`Nenhum resultado para "${initialQuery}"`}
              description="Tente outros termos. Ex: use o nome do produto, a marca ou a cor."
            />
          )}
          {result.status === "error" && (
            <p className="text-destructive text-center py-8">{result.message}</p>
          )}
          {result.status === "ok" && result.data.length > 0 && (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                {result.data.length} resultado{result.data.length !== 1 ? "s" : ""} para{" "}
                <strong className="text-foreground">"{initialQuery}"</strong>
              </p>
              <ProductGrid result={result} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
