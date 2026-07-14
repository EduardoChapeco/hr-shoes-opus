import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Pin, ArrowRight } from "lucide-react";
import { createServerFn } from "@tanstack/react-start";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/state/states";
import { formatMoney } from "@/lib/money";
import { getServerClient } from "@/lib/supabase";

const getDestaques = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const db = getServerClient();
    const { data: store } = await db.from("stores").select("id").limit(1).single();
    if (!store) return { status: "unconfigured" as const };

    // Get featured / highlighted products via collection or via specific flag
    const { data, error } = await db
      .from("products")
      .select("id, title, slug, price_cents, status, product_media(url, alt)")
      .eq("store_id", store.id)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    return { status: "ok" as const, data: data || [] };
  } catch (e: any) {
    return { status: "error" as const, message: "Erro ao carregar destaques." };
  }
});

export const Route = createFileRoute("/admin/destaques")({
  head: () => ({ meta: [{ title: "Destaques — Hr Shoes" }] }),
  loader: async () => {
    return await getDestaques();
  },
  component: DestaquesPage,
});

function DestaquesPage() {
  const res = Route.useLoaderData();

  if (res.status !== "ok") {
    return (
      <div className="space-y-6">
        <PageHeader title="Destaques" description="Produtos em destaque na vitrine." />
        <EmptyState
          title="Sem dados"
          description={res.status === "error" ? res.message : "Loja não configurada."}
        />
      </div>
    );
  }

  const products = res.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Destaques da Vitrine"
          description="Selecione os produtos publicados que serão destacados na Home e em coleções."
        />
        <Button asChild>
          <Link to="/admin/catalogo/produtos">
            Gerenciar Produtos
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <EmptyState
          title="Nenhum produto publicado"
          description="Publique produtos em Catálogo → Produtos para que apareçam aqui."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {products.map((p: any) => {
            const cover = p.product_media?.[0]?.url;
            return (
              <Link
                key={p.id}
                to="/admin/catalogo/produtos/$id"
                params={{ id: p.id }}
                className="group rounded-lg border bg-card overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-muted relative overflow-hidden">
                  {cover ? (
                    <img
                      src={cover}
                      alt={p.product_media[0].alt || p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Pin className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium truncate">{p.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm font-semibold">{formatMoney(p.price_cents)}</p>
                    <Badge variant="secondary" className="text-xs">
                      {p.status === "published" ? "Publicado" : p.status}
                    </Badge>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
