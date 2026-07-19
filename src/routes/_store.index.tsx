import { createFileRoute, Link } from "@tanstack/react-router";
import { PlugZap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/state/states";
import {
  getStoreConfig,
} from "@/services/catalog.functions";
import type { StoreConfigDTO } from "@/types/catalog";
import { getPublicExperienceDocumentBySlug } from "@/services/builder.functions";
import { ExperienceRenderer } from "@/components/commerce/experience-renderer";

export const Route = createFileRoute("/_store/")({
  head: () => ({
    meta: [
      { title: "Hr Shoes — Conforto e Estilo" },
      {
        name: "description",
        content:
          "Loja online da Hr Shoes: moda feminina contemporânea com conforto e estilo. Calçados, roupas e acessórios.",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Hr Shoes — Conforto e Estilo" },
    ],
  }),
  loader: async () => {
    const [storeConfig, experienceRes] = await Promise.all([
      getStoreConfig(),
      getPublicExperienceDocumentBySlug({ data: { slug: "home", document_type: "storefront" } }),
    ]);

    return {
      storeConfig,
      experienceRes,
    };
  },
  component: Home,
});



function UnconfiguredStorefront() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-20 text-center md:px-6">
      <div className="mx-auto max-w-md">
        <div className="mb-6 inline-flex size-16 items-center justify-center rounded-full bg-accent">
          <PlugZap className="size-8 text-accent-foreground" aria-hidden />
        </div>
        <h1 className="text-editorial text-3xl text-foreground">Loja em configuração</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          A loja está sendo configurada. Acesse o painel de administração para criar sua loja,
          adicionar produtos e publicar conteúdo.
        </p>
        <Button className="mt-8" asChild>
          <Link to="/admin">Ir para o painel</Link>
        </Button>
      </div>
    </div>
  );
}

function Home() {
  const { storeConfig, experienceRes } = Route.useLoaderData();

  if (storeConfig.status === "unconfigured") return <UnconfiguredStorefront />;
  if (storeConfig.status === "error")
    return (
      <div className="p-8">
        <ErrorState description={storeConfig.message} />
      </div>
    );
  if (storeConfig.status === "empty")
    return (
      <div className="p-8">
        <ErrorState description="Loja sem configuração" />
      </div>
    );

  // Fallback se não houver experience document "home" publicado
  if (experienceRes.status !== "ok" || !experienceRes.data.tree || experienceRes.data.tree.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="mx-auto max-w-xl text-center py-20 flex-1">
          <h2 className="text-xl font-bold">Nenhum layout publicado</h2>
          <p className="text-muted-foreground mt-2">Acesse o Builder no Admin para construir e publicar a página inicial.</p>
          <Button className="mt-6" asChild>
            <Link to="/admin/builder">Acessar Builder</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Renderização Dinâmica 100% via Builder (Experience Renderer)
  return (
    <div className="flex flex-col min-h-[50vh]">
      <ExperienceRenderer nodes={experienceRes.data.tree} />
    </div>
  );
}
