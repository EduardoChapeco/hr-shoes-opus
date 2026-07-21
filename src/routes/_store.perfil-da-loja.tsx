import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { ErrorState, UnconfiguredState } from "@/components/state/states";
import { getPublicStoreProfile } from "@/services/catalog.functions";
import { getPublicExperienceDocumentBySlug } from "@/services/builder.functions";
import { ExperienceRenderer } from "@/components/commerce/experience-renderer";
import { getOpenStatus } from "@/lib/datetime";

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
        data: { slug: "institucional", document_type: "storefront" },
      }).catch(() => null),
    ]);
    return {
      profile,
      builderTree:
        docRes?.status === "ok" && (docRes.data as any).tree?.length > 0
          ? (docRes.data as any).tree
          : null,
    };
  },

  component: StorePerfil,
});

function StorePerfil() {
  const { profile: data, builderTree } = Route.useLoaderData();

  if (data && "status" in data && data.status === "unconfigured") {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-12 md:px-6">
        <UnconfiguredState
          title="Perfil não disponível"
          description="As informações da loja ainda não foram configuradas."
        />
      </div>
    );
  }

  // ── Canonical path: published Builder document for slug "institucional"
  // The server has already hydrated store_profile bindings (hours, contact, hero)
  if (builderTree) {
    return (
      <main className="w-full flex flex-col gap-0 min-h-screen">
        <ExperienceRenderer nodes={builderTree} />
      </main>
    );
  }

  // ── Honest fallback: no Builder document published yet.
  // Reads real store data and shows structured info.
  // Admin banner prompts creating the institutional profile.
  const store = data as any;
  const settings = store.settings || {};
  const extendedHours = settings.business_hours_extended || [];
  const holidayExceptions = settings.holiday_exceptions || [];
  const actionButtons: any[] = settings.action_buttons || [];
  const openStatus = extendedHours.length > 0 ? getOpenStatus(extendedHours, holidayExceptions) : null;

  return (
    <main className="min-h-screen bg-background">
      {/* Admin banner — directs admin to create the Builder page */}
      <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-xs text-center py-2 px-4">
        Exibindo perfil canônico da loja.{" "}
        <Link
          to="/admin/perfil-publico"
          className="underline font-semibold"
        >
          Personalize este perfil no Editor Visual
        </Link>
        {" "}para uma página com design completo.
      </div>

      {/* Cover */}
      {settings.cover_url && (
        <div className="relative h-40 md:h-64 w-full overflow-hidden">
          <img src={settings.cover_url} alt="Capa da loja" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
        </div>
      )}

      <div className="mx-auto max-w-2xl px-4 md:px-6 py-8">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center gap-3">
          {(store.logo_url || settings.logoUrl) && (
            <img
              src={store.logo_url || settings.logoUrl}
              alt={store.name}
              className={`size-24 rounded-full object-cover border-4 border-background shadow-md bg-background ${settings.cover_url ? "-mt-16 relative z-10" : ""}`}
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">{store.name}</h1>
            {store.slug && <p className="text-sm text-muted-foreground">@{store.slug}</p>}
            {store.description && (
              <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                {store.description}
              </p>
            )}
          </div>

          {/* Status badge */}
          {openStatus && (
            <span
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                openStatus.status === "open"
                  ? "bg-emerald-500/15 text-emerald-700"
                  : "bg-destructive/15 text-destructive"
              }`}
            >
              <span className={`size-2 rounded-full ${openStatus.status === "open" ? "bg-emerald-500" : "bg-destructive"}`} />
              {openStatus.text}
            </span>
          )}

          {/* Action buttons */}
          {actionButtons.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {actionButtons.map((btn: any) => (
                <a
                  key={btn.id}
                  href={btn.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-full border bg-background text-sm font-medium hover:bg-muted transition-colors"
                >
                  {btn.label}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="mt-8 space-y-3">
          {store.phone && (
            <a
              href={`tel:${store.phone}`}
              className="flex items-center gap-4 p-3 rounded-xl border hover:bg-muted/50 transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Telefone</p>
                <p className="text-sm font-medium">{store.phone}</p>
              </div>
            </a>
          )}
          {store.phone && (
            <a
              href={`https://wa.me/${store.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-3 rounded-xl border hover:bg-muted/50 transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 shrink-0">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">WhatsApp</p>
                <p className="text-sm font-medium">{store.phone}</p>
              </div>
            </a>
          )}
          {store.address && (
            <div className="flex items-start gap-4 p-3 rounded-xl border">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Endereço</p>
                <p className="text-sm font-medium">
                  {store.address}{store.city ? `, ${store.city}` : ""}{store.state ? `/${store.state}` : ""}
                </p>
              </div>
            </div>
          )}
          {extendedHours.length > 0 && (
            <div className="p-4 rounded-xl border">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Horários de Funcionamento</p>
              </div>
              <div className="space-y-1.5">
                {extendedHours.map((day: any) => (
                  <div key={day.day} className="flex justify-between text-sm">
                    <span className={`${!day.open ? "text-muted-foreground" : "font-medium"}`}>
                      {day.day}
                    </span>
                    <span className={`font-mono text-xs ${!day.open ? "text-muted-foreground" : ""}`}>
                      {day.open ? `${day.openTime} – ${day.closeTime}` : "Fechado"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
