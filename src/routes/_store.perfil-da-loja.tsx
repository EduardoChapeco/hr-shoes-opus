import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Store,
  MapPin,
  Phone,
  Mail,
  Clock,
  Instagram,
  ExternalLink,
  ShoppingBag,
  Star,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorState, UnconfiguredState } from "@/components/state/states";
import { getPublicStoreProfile } from "@/services/catalog.functions";
import type { PublicStoreProfileDTO } from "@/services/catalog.functions";

export const Route = createFileRoute("/_store/perfil-da-loja")({
  head: () => ({
    meta: [
      { title: "Perfil da Loja — Hr Shoes" },
      {
        name: "description",
        content:
          "Conheça a Hr Shoes: nossa história, endereço, horários de funcionamento e canais de contato.",
      },
    ],
  }),
  loader: async () => {
    return await getPublicStoreProfile();
  },
  component: StorePerfil,
});

function StorePerfil() {
  const res = Route.useLoaderData();

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
        <ErrorState title="Erro ao carregar" description={res.message} />
      </div>
    );
  }

  if (res.status === "empty") {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-12 md:px-6">
        <p className="text-muted-foreground text-sm">Perfil não encontrado.</p>
      </div>
    );
  }

  const store = res.data;

  return <PerfilView store={store} />;
}

function PerfilView({ store }: { store: PublicStoreProfileDTO }) {
  const fullAddress = [store.address, store.city, store.state].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background pb-16 pt-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="mx-auto max-w-screen-xl px-4 md:px-6">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
            {/* Logo / Icon */}
            <div className="relative">
              {store.logoUrl ? (
                <img
                  src={store.logoUrl}
                  alt={store.name}
                  className="h-28 w-28 rounded-2xl border-4 border-background object-cover shadow-2xl ring-4 ring-primary/20 md:h-36 md:w-36"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-2xl border-4 border-background bg-primary/10 shadow-2xl ring-4 ring-primary/20 md:h-36 md:w-36">
                  <Store className="h-14 w-14 text-primary md:h-16 md:w-16" />
                </div>
              )}
              <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary px-3 text-[11px] text-primary-foreground shadow-lg">
                Loja Oficial
              </Badge>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{store.name}</h1>
              {fullAddress && (
                <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground md:justify-start">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                  {fullAddress}
                </p>
              )}
              {store.description && (
                <p className="mt-3 max-w-xl text-base text-foreground/80">{store.description}</p>
              )}
              <div className="mt-5 flex flex-wrap justify-center gap-3 md:justify-start">
                <Button asChild size="sm">
                  <Link to="/catalogo">
                    <ShoppingBag className="mr-1.5 h-4 w-4" />
                    Ver Catálogo
                  </Link>
                </Button>
                {store.instagramHandle && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`https://instagram.com/${store.instagramHandle.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Instagram className="mr-1.5 h-4 w-4" />
                      {store.instagramHandle}
                    </a>
                  </Button>
                )}
                <Button variant="ghost" size="sm" asChild className="border border-border/60">
                  <Link to="/admin/perfil-publico">
                    <ExternalLink className="mr-1.5 h-4 w-4" />
                    Editar no Painel Admin
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-screen-xl px-4 py-12 md:px-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Contato */}
          {(store.phone || store.email) && <ContactCard phone={store.phone} email={store.email} />}

          {/* Endereço */}
          {fullAddress && <AddressCard address={fullAddress} />}

          {/* Horários */}
          {store.businessHours && <HoursCard hours={store.businessHours} />}

          {/* Links rápidos */}
          <QuickLinksCard instagram={store.instagramHandle} />
        </div>

        {/* About section */}
        {store.description && (
          <div className="mt-10 rounded-2xl border bg-card p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Nossa História</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">{store.description}</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-8 text-center text-primary-foreground shadow-lg">
          <h2 className="text-2xl font-bold">Comece a explorar</h2>
          <p className="mt-2 text-primary-foreground/80">
            Encontre seu estilo perfeito na nossa coleção completa.
          </p>
          <Button
            asChild
            variant="secondary"
            size="lg"
            className="mt-6 bg-white text-primary hover:bg-white/90"
          >
            <Link to="/catalogo">
              Ir para o Catálogo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ContactCard({ phone, email }: { phone: string | null; email: string | null }) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Phone className="h-5 w-5 text-primary" />
        </div>
        <h3 className="font-semibold text-base">Contato</h3>
      </div>
      <div className="space-y-3">
        {phone && (
          <a
            href={`tel:${phone.replace(/\D/g, "")}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Phone className="h-3.5 w-3.5 shrink-0" />
            {phone}
          </a>
        )}
        {email && (
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Mail className="h-3.5 w-3.5 shrink-0" />
            {email}
          </a>
        )}
      </div>
    </div>
  );
}

function AddressCard({ address }: { address: string }) {
  const mapsUrl = `https://maps.google.com?q=${encodeURIComponent(address)}`;
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <h3 className="font-semibold text-base">Endereço</h3>
      </div>
      <p className="text-sm text-muted-foreground">{address}</p>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
      >
        Ver no mapa <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

function HoursCard({ hours }: { hours: string }) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Clock className="h-5 w-5 text-primary" />
        </div>
        <h3 className="font-semibold text-base">Horário de Funcionamento</h3>
      </div>
      <p className="text-sm text-muted-foreground whitespace-pre-line">{hours}</p>
    </div>
  );
}

function QuickLinksCard({ instagram }: { instagram: string | null }) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <ArrowRight className="h-5 w-5 text-primary" />
        </div>
        <h3 className="font-semibold text-base">Links Rápidos</h3>
      </div>
      <div className="space-y-2">
        <Link
          to="/catalogo"
          className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-muted/50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" />
            Catálogo
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
        </Link>
        <Link
          to="/faq"
          className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-muted/50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            Dúvidas Frequentes
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
        </Link>
        {instagram && (
          <a
            href={`https://instagram.com/${instagram.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-muted/50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-primary" />
              Instagram
            </span>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </a>
        )}
      </div>
    </div>
  );
}
