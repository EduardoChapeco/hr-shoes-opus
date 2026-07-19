import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
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
  Sparkles,
  ArrowRight,
  ChevronRight,
  MessageCircle,
  Globe,
  Calendar as CalendarIcon,
  Play,
  CreditCard,
  HelpCircle,
  Image as ImageIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorState, UnconfiguredState } from "@/components/state/states";
import { getPublicStoreProfile } from "@/services/catalog.functions";
import type { PublicStoreProfileDTO } from "@/services/catalog.functions";
import { getUserSession } from "@/services/auth.functions";
import { getOpenStatus } from "@/lib/datetime";
import { cn } from "@/lib/utils";

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
    const [profile, session] = await Promise.all([
      getPublicStoreProfile(),
      getUserSession().catch(() => null),
    ]);
    return { profile, session };
  },
  component: StorePerfil,
});

function StorePerfil() {
  const { profile: res, session } = Route.useLoaderData() as any;

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

  return <PerfilView store={store} session={session} />;
}



const BUTTON_ICONS: Record<string, any> = {
  phone: Phone,
  external: ExternalLink,
  whatsapp: MessageCircle,
  globe: Globe,
  calendar: CalendarIcon,
};

function getButtonIcon(name: string) {
  return BUTTON_ICONS[name] || ExternalLink;
}

// Icon helper mapper
const renderIcon = (name: string) => {
  switch (name) {
    case "Star":
      return <Star className="h-5 w-5" />;
    case "Sparkles":
      return <Sparkles className="h-5 w-5" />;
    case "Clock":
      return <Clock className="h-5 w-5" />;
    case "MapPin":
      return <MapPin className="h-5 w-5" />;
    case "CreditCard":
      return <CreditCard className="h-5 w-5" />;
    case "Play":
      return <Play className="h-5 w-5" />;
    case "HelpCircle":
      return <HelpCircle className="h-5 w-5" />;
    case "Mail":
      return <Mail className="h-5 w-5" />;
    case "ImageIcon":
      return <ImageIcon className="h-5 w-5" />;
    default:
      return <Sparkles className="h-5 w-5" />;
  }
};

const renderRichSectionContent = (sec: any) => {
  const type = sec.type || "text";
  let data: any = null;
  const isJson = sec.content && (sec.content.startsWith("{") || sec.content.startsWith("["));
  if (isJson) {
    try {
      data = JSON.parse(sec.content);
    } catch (e) {
      console.error(e);
    }
  }

  if (type === "payments" && data) {
    return (
      <div className="flex flex-wrap gap-2 pt-1">
        {data.pix && (
          <Badge variant="outline" className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 border-emerald-500/20 font-bold py-1 px-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Pix
          </Badge>
        )}
        {data.credit && (
          <Badge variant="outline" className="flex items-center gap-1.5 bg-blue-500/10 text-blue-700 border-blue-500/20 font-bold py-1 px-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Cartão de Crédito
          </Badge>
        )}
        {data.debit && (
          <Badge variant="outline" className="flex items-center gap-1.5 bg-indigo-500/10 text-indigo-700 border-indigo-500/20 font-bold py-1 px-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Cartão de Débito
          </Badge>
        )}
        {data.installments && (
          <Badge variant="outline" className="flex items-center gap-1.5 bg-purple-500/10 text-purple-700 border-purple-500/20 font-bold py-1 px-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
            Ficha / Carnê
          </Badge>
        )}
        {data.manual && (
          <Badge variant="outline" className="flex items-center gap-1.5 bg-amber-500/10 text-amber-700 border-amber-500/20 font-bold py-1 px-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Pagamento Manual
          </Badge>
        )}
      </div>
    );
  }

  if (type === "gallery" && Array.isArray(data)) {
    return (
      <div className="grid grid-cols-3 gap-3 pt-1">
        {data.map((url: string, index: number) => (
          <div key={index} className="aspect-square rounded-xl overflow-hidden border bg-muted shadow-xs">
            <img src={url} alt={`Gallery item ${index}`} className="h-full w-full object-cover hover:scale-105 transition-transform duration-300" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "video") {
    const ytUrl = sec.content || "";
    let ytId = "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = ytUrl.match(regExp);
    if (match && match[2].length === 11) {
      ytId = match[2];
    }

    if (ytId) {
      return (
        <div className="mt-2 overflow-hidden rounded-xl border aspect-video w-full z-0 bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${ytId}`}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Video Section"
          ></iframe>
        </div>
      );
    }
    return <p className="text-xs text-muted-foreground italic">Link de vídeo inválido: {ytUrl}</p>;
  }

  if (type === "support" && data) {
    return (
      <div className="space-y-4 pt-1">
        {data.desc && <p className="text-sm text-muted-foreground leading-relaxed">{data.desc}</p>}
        <div className="flex flex-col sm:flex-row gap-3">
          {data.phone && (
            <Button size="sm" variant="outline" className="flex-1 flex items-center justify-center gap-2 text-xs h-10 border-primary/20 hover:bg-primary/5" asChild>
              <a href={`https://wa.me/${data.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 text-emerald-500 fill-emerald-500" />
                WhatsApp: {data.phone}
              </a>
            </Button>
          )}
          {data.email && (
            <Button size="sm" variant="outline" className="flex-1 flex items-center justify-center gap-2 text-xs h-10 border-primary/20 hover:bg-primary/5" asChild>
              <a href={`mailto:${data.email}`}>
                <Mail className="h-4 w-4 text-primary" />
                E-mail: {data.email}
              </a>
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (type === "faq" && Array.isArray(data)) {
    return (
      <div className="space-y-3 pt-1">
        {data.map((item: any, idx: number) => (
          <details key={idx} className="group border rounded-xl bg-muted/20 overflow-hidden transition-all duration-300">
            <summary className="flex items-center justify-between p-4 font-bold text-xs sm:text-sm cursor-pointer hover:bg-muted/40 transition-colors list-none select-none">
              <span>{item.q}</span>
              <span className="text-primary transition-transform group-open:rotate-180">
                <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200" />
              </span>
            </summary>
            <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {item.a}
            </div>
          </details>
        ))}
      </div>
    );
  }

  return (
    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
      {sec.content}
    </p>
  );
};

function PerfilView({ store, session }: { store: PublicStoreProfileDTO; session: any }) {
  const fullAddress = [store.address, store.city, store.state].filter(Boolean).join(", ");
  const extendedHours = store.settings?.business_hours_extended || null;
  const customSections = store.settings?.profile_sections || [];
  const coverUrl = store.settings?.cover_url || null;
  const holidayExceptions = store.settings?.holiday_exceptions || [];

  const isStaff =
    session &&
    ["owner", "admin", "manager", "seller", "stock", "finance", "content", "support"].includes(
      session.role
    );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div
        className={cn(
          "relative overflow-hidden pb-16 pt-20 bg-cover bg-center transition-all duration-300"
        )}
        style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : {}}
      >
        <div
          className={cn(
            "absolute inset-0 z-0",
            coverUrl
              ? "bg-black/50 backdrop-blur-xs"
              : "bg-gradient-to-br from-primary/10 via-primary/5 to-background"
          )}
        />
        {!coverUrl && (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        )}
        <div className="mx-auto max-w-screen-xl px-4 md:px-6 relative z-10">
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
              <h1
                className={cn(
                  "text-3xl font-bold tracking-tight md:text-4xl",
                  coverUrl ? "text-white" : "text-foreground"
                )}
              >
                {store.name}
              </h1>
              {fullAddress && (
                <p
                  className={cn(
                    "mt-1 flex items-center justify-center gap-1.5 text-sm md:justify-start",
                    coverUrl ? "text-white/80" : "text-muted-foreground"
                  )}
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                  {fullAddress}
                </p>
              )}
              {store.description && (
                <p
                  className={cn(
                    "mt-3 max-w-xl text-base",
                    coverUrl ? "text-white/90" : "text-foreground/80"
                  )}
                >
                  {store.description}
                </p>
              )}
              <div className="mt-5 flex flex-wrap justify-center gap-3 md:justify-start">
                <Button asChild size="sm">
                  <Link to="/catalogo">
                    <ShoppingBag className="mr-1.5 h-4 w-4" />
                    Ver Catálogo
                  </Link>
                </Button>
                {store.instagramHandle && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className={cn(
                      coverUrl && "bg-white/10 hover:bg-white/20 text-white border-white/20"
                    )}
                  >
                    <a
                      href={`https://instagram.com/${store.instagramHandle.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Instagram className="mr-1.5 h-4 w-4" />
                      @{store.instagramHandle}
                    </a>
                  </Button>
                )}

                {/* Custom Action Buttons from settings */}
                {Array.isArray(store.settings?.action_buttons) &&
                  store.settings.action_buttons.map((btn: any, idx: number) => {
                    const IconComponent = btn.icon ? getButtonIcon(btn.icon) : null;
                    return (
                      <Button
                        key={idx}
                        variant={coverUrl ? "outline" : "secondary"}
                        size="sm"
                        asChild
                        className={cn(
                          coverUrl && "bg-white/10 hover:bg-white/20 text-white border-white/20"
                        )}
                      >
                        <a href={btn.url} target="_blank" rel="noopener noreferrer">
                          {IconComponent && <IconComponent className="mr-1.5 h-4 w-4" />}
                          {btn.label}
                        </a>
                      </Button>
                    );
                  })}

                {isStaff && (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className={cn(
                      "border border-border/60",
                      coverUrl && "text-white bg-white/5 border-white/10 hover:bg-white/15"
                    )}
                  >
                    <Link to="/admin/perfil-publico">
                      <ExternalLink className="mr-1.5 h-4 w-4" />
                      Editar no Painel Admin
                    </Link>
                  </Button>
                )}
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

          {/* Endereço ou Atendimento Online */}
          {store.settings?.virtual_only ? (
            <OnlineSupportCard phone={store.phone} email={store.email} />
          ) : (
            fullAddress && (
              <AddressCard
                address={fullAddress}
                latitude={store.settings?.latitude || null}
                longitude={store.settings?.longitude || null}
              />
            )
          )}

          {/* Horários */}
          {(store.businessHours || extendedHours) && (
            <HoursCard
              hours={store.businessHours}
              extendedHours={extendedHours}
              holidayExceptions={holidayExceptions}
            />
          )}

          {/* Links rápidos */}
          <QuickLinksCard instagram={store.instagramHandle} />
        </div>

        {/* Custom profile builder sections */}
        {customSections.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 mt-10">
            {customSections.map((sec: any) => (
              <div key={sec.id} className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow text-left">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <div className="text-primary">{renderIcon(sec.icon)}</div>
                  </div>
                  <h3 className="font-bold text-base">{sec.title}</h3>
                </div>
                {renderRichSectionContent(sec)}
              </div>
            ))}
          </div>
        )}

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

function AddressCard({
  address,
  latitude,
  longitude,
}: {
  address: string;
  latitude: string | null;
  longitude: string | null;
}) {
  const mapsUrl = `https://maps.google.com?q=${encodeURIComponent(address)}`;
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!latitude || !longitude || !mapContainerRef.current) return;

    let isMounted = true;

    // Load leaflet stylesheet
    let cssLink = document.querySelector('link[href*="leaflet.css"]');
    if (!cssLink) {
      cssLink = document.createElement('link');
      (cssLink as any).rel = 'stylesheet';
      (cssLink as any).href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(cssLink);
    }

    const initMap = () => {
      if (!isMounted || !mapContainerRef.current) return;
      const L = (window as any).L;
      if (!L) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView([lat, lng], 15);

      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground border-4 border-background shadow-lg transform -translate-x-1/2 -translate-y-1/2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      L.marker([lat, lng], { icon: customIcon }).addTo(map).bindPopup(`
        <div class="text-center p-1 font-sans">
          <p class="font-bold text-xs text-foreground mb-0.5">Hr Shoes</p>
          <p class="text-[10px] text-muted-foreground">${address.split(',')[0]}</p>
        </div>
      `).openPopup();
    };

    if ((window as any).L) {
      setTimeout(initMap, 100);
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = initMap;
      document.body.appendChild(script);
    }

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, address]);

  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  const latVal = latitude ? parseFloat(latitude) : null;
  const lngVal = longitude ? parseFloat(longitude) : null;

  const wazeUrl = latVal && lngVal 
    ? `https://waze.com/ul?ll=${latVal},${lngVal}&navigate=yes` 
    : `https://waze.com/ul?q=${encodeURIComponent(address)}`;

  const appleMapsUrl = latVal && lngVal
    ? `http://maps.apple.com/?ll=${latVal},${lngVal}&q=Hr%20Shoes`
    : `http://maps.apple.com/?q=${encodeURIComponent(address)}`;

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md flex flex-col justify-between md:col-span-2 lg:col-span-1">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-semibold text-base">Endereço</h3>
        </div>
        <p className="text-sm text-muted-foreground">{address}</p>

        <div className="mt-3 overflow-hidden rounded-xl border aspect-video w-full z-0 relative min-h-[180px]">
          {latitude && longitude ? (
            <div ref={mapContainerRef} className="w-full h-full min-h-[180px] z-0" />
          ) : (
            <iframe
              src={mapEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              title="Mapa da Loja"
            ></iframe>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Rotas no GPS:</span>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" className="h-9 text-[11px] flex gap-1 justify-center items-center font-bold bg-emerald-500/5 border-emerald-500/20 text-emerald-700 hover:bg-emerald-500/10" asChild>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              Google Maps
            </a>
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-[11px] flex gap-1 justify-center items-center font-bold bg-blue-500/5 border-blue-500/20 text-blue-700 hover:bg-blue-500/10" asChild>
            <a href={wazeUrl} target="_blank" rel="noopener noreferrer">
              Waze
            </a>
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-[11px] flex gap-1 justify-center items-center font-bold bg-purple-500/5 border-purple-500/20 text-purple-700 hover:bg-purple-500/10" asChild>
            <a href={appleMapsUrl} target="_blank" rel="noopener noreferrer">
              Apple Maps
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

function HoursCard({
  hours,
  extendedHours,
  holidayExceptions,
}: {
  hours: string | null;
  extendedHours: any[] | null;
  holidayExceptions?: any[] | null;
}) {
  const status = extendedHours ? getOpenStatus(extendedHours, holidayExceptions) : null;

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-base">Funcionamento</h3>
          </div>
          {status && (
            <Badge
              variant="outline"
              className={
                status.status === "open"
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold text-[10px]"
                  : "bg-destructive/10 text-destructive border-destructive/20 font-bold text-[10px]"
              }
            >
              {status.text}
            </Badge>
          )}
        </div>

        {extendedHours && extendedHours.length > 0 ? (
          <div className="space-y-1.5 pt-2 border-t text-xs">
            {extendedHours.map((h) => (
              <div key={h.day} className="flex justify-between py-0.5">
                <span className="text-muted-foreground font-medium">{h.day}</span>
                <span className={h.open ? "font-bold text-foreground" : "text-muted-foreground/60 italic"}>
                  {h.open ? `${h.openTime} - ${h.closeTime}` : "Fechado"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground whitespace-pre-line">{hours || "Não configurado."}</p>
        )}

        {/* Display holiday/special exceptions list if any */}
        {holidayExceptions && holidayExceptions.length > 0 && (
          <div className="mt-4 pt-3 border-t border-dashed">
            <p className="text-xs font-bold text-muted-foreground mb-2">Feriados e Exceções:</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {holidayExceptions.map((ex: any, idx: number) => {
                const [year, month, day] = ex.date.split("-");
                const formattedDate = `${day}/${month}`;
                return (
                  <div key={idx} className="flex justify-between text-[11px] py-0.5">
                    <span className="text-muted-foreground font-medium">
                      {ex.label} ({formattedDate})
                    </span>
                    <span className={ex.open ? "font-bold text-primary" : "text-destructive/80"}>
                      {ex.open ? `${ex.openTime} - ${ex.closeTime}` : "Fechado"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
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

function OnlineSupportCard({ phone, email }: { phone: string | null; email: string | null }) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <MessageCircle className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-semibold text-base">Atendimento Online</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          Nossa loja opera 100% online! Oferecemos suporte completo pelos canais abaixo.
        </p>
        <div className="space-y-3">
          {phone && (
            <Button size="sm" variant="outline" className="w-full flex items-center justify-start gap-2 h-10" asChild>
              <a href={`https://wa.me/${phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 text-emerald-500 fill-emerald-500 shrink-0" />
                <span className="truncate text-xs">WhatsApp: {phone}</span>
              </a>
            </Button>
          )}
          {email && (
            <Button size="sm" variant="outline" className="w-full flex items-center justify-start gap-2 h-10" asChild>
              <a href={`mailto:${email}`}>
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate text-xs">E-mail: {email}</span>
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
