import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";

import { ErrorState, UnconfiguredState } from "@/components/state/states";
import { getPublicStoreProfile } from "@/services/catalog.functions";
import { getPublicExperienceDocumentBySlug } from "@/services/builder.functions";
import { ExperienceRenderer } from "@/components/commerce/experience-renderer";

export const Route = createFileRoute("/_store/perfil-da-loja")({
  head: () => ({
    meta: [
      { title: "Perfil da Loja — Hr Shoes" },
      {
        name: "description",
        content: "Conheça a Hr Shoes: nossa história, endereço, horários de funcionamento e canais de contato.",
      },
    ],
  }),

  loader: async () => {
    const [profile, docRes] = await Promise.all([
      getPublicStoreProfile(),
      getPublicExperienceDocumentBySlug({
        data: { slug: "institucional", document_type: "storefront" }
      }).catch(() => null),
    ]);
    return {
      profile,
      builderTree: docRes?.status === "ok" && (docRes.data as any).tree?.length > 0
        ? (docRes.data as any).tree
        : null,
    };
  },

  component: StorePerfil,
});

function StorePerfil() {
  const { profile: res, builderTree } = Route.useLoaderData();

  if (res.status === "unconfigured") {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-12 md:px-6">
        <UnconfiguredState
          title="Perfil não disponível"
          description="As informações da loja ainda não foram configuradas."
        />
      </div>
    );
  }

  if (res.status === "error") {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-12 md:px-6">
        <ErrorState title="Erro ao carregar" description={(res as any).message ?? "Erro desconhecido"} />
      </div>
    );
  }

  if (res.status === "empty") {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-12 md:px-6">
        <UnconfiguredState title="Perfil não encontrado" description="Loja sem dados configurados." />
      </div>
    );
  }

  // If a published Builder document exists for slug "institucional", use canonical renderer
  if (builderTree) {
    return (
      <main className="w-full flex flex-col gap-0 min-h-screen">
        <ExperienceRenderer nodes={builderTree} />
      </main>
    );
  }

  // Honest canonical fallback — shows real store data until admin publishes a Builder page
  const store = res.data;

  return (
    <main className="min-h-screen bg-background">
      {/* Admin notice: visible only in dev or when not using Builder */}
      <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-xs text-center py-2 px-4">
        Exibindo dados canônicos da loja.{" "}
        <Link
          to="/admin/builder"
          search={{ type: undefined }}
          className="underline font-medium"
        >
          Crie e publique uma página "institucional" no Builder
        </Link>{" "}
        para personalizar este perfil.
      </div>

      <div className="mx-auto max-w-screen-xl px-4 md:px-6 py-12">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {store.logoUrl && (
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-background shadow-md flex-shrink-0 bg-background">
              <img src={store.logoUrl} alt={store.name} className="w-full h-full object-contain" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{store.name}</h1>
            {store.description && (
              <p className="mt-2 text-muted-foreground text-sm md:text-base max-w-2xl">{store.description}</p>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {store.phone && (
            <a href={`tel:${store.phone}`} className="flex items-center gap-3 p-4 rounded-xl border hover:bg-accent/50 transition-colors">
              <Phone className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="text-sm font-medium truncate">{store.phone}</span>
            </a>
          )}
          {store.email && (
            <a href={`mailto:${store.email}`} className="flex items-center gap-3 p-4 rounded-xl border hover:bg-accent/50 transition-colors">
              <Mail className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="text-sm font-medium truncate">{store.email}</span>
            </a>
          )}
          {store.instagramHandle && (
            <a
              href={`https://instagram.com/${store.instagramHandle.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-xl border hover:bg-accent/50 transition-colors"
            >
              <MessageCircle className="h-5 w-5 text-pink-500 flex-shrink-0" />
              <span className="text-sm font-medium">@{store.instagramHandle.replace("@", "")}</span>
            </a>
          )}
          {store.address && (
            <div className="flex items-center gap-3 p-4 rounded-xl border">
              <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="text-sm text-muted-foreground">{store.address}{store.city ? `, ${store.city}` : ""}{store.state ? `/${store.state}` : ""}</span>
            </div>
          )}
          {store.businessHours && (
            <div className="flex items-center gap-3 p-4 rounded-xl border">
              <Clock className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="text-sm text-muted-foreground">{store.businessHours}</span>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
