import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  ExternalLink,
  Store,
  MapPin,
  Phone,
  Clock,
  Image as ImageIcon,
  Plus,
  Trash,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Calendar,
  Instagram,
  Star,
  MessageCircle,
  Globe,
  Calendar as CalendarIcon,
  Play,
  CreditCard,
  HelpCircle,
  Mail,
} from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPublicProfile, savePublicProfile } from "@/services/store.functions";
import { getOpenStatus } from "@/lib/datetime";

export const Route = createFileRoute("/admin/perfil-publico")({
  head: () => ({ meta: [{ title: "Perfil Público — Hr Shoes" }] }),
  loader: async () => {
    return await getPublicProfile();
  },
  component: PerfilPublicoPage,
});

function PerfilPublicoPage() {
  const res = Route.useLoaderData();
  const router = useRouter();
  const store = res.status === "ok" ? res.data : null;

  const storeSettings = (store as any)?.settings || {};

  const [form, setForm] = useState({
    description: (store as any)?.description || "",
    phone: (store as any)?.phone || "",
    address: (store as any)?.address || "",
    business_hours: (store as any)?.business_hours || "",
    logo_url: (store as any)?.logo_url || "",
  });

  const [coverUrl, setCoverUrl] = useState<string>(storeSettings.cover_url || "");

  // Extended Business Hours State (Google My Business style)
  const [extendedHours, setExtendedHours] = useState<any[]>(
    storeSettings.business_hours_extended || [
      { day: "Segunda-feira", open: true, openTime: "09:00", closeTime: "18:00" },
      { day: "Terça-feira", open: true, openTime: "09:00", closeTime: "18:00" },
      { day: "Quarta-feira", open: true, openTime: "09:00", closeTime: "18:00" },
      { day: "Quinta-feira", open: true, openTime: "09:00", closeTime: "18:00" },
      { day: "Sexta-feira", open: true, openTime: "09:00", closeTime: "18:00" },
      { day: "Sábado", open: true, openTime: "09:00", closeTime: "13:00" },
      { day: "Domingo", open: false, openTime: "09:00", closeTime: "18:00" },
    ]
  );

  // Holiday Exceptions
  const [holidayExceptions, setHolidayExceptions] = useState<any[]>(
    storeSettings.holiday_exceptions || []
  );

  // Custom Action Buttons
  const [actionButtons, setActionButtons] = useState<any[]>(
    storeSettings.action_buttons || []
  );

  // Custom Sections State (Google My Business / Page Builder style)
  const [profileSections, setProfileSections] = useState<any[]>(
    storeSettings.profile_sections || []
  );

  const [instagramHandle, setInstagramHandle] = useState<string>(
    storeSettings.instagramHandle || ""
  );

  const [virtualOnly, setVirtualOnly] = useState<boolean>(storeSettings.virtual_only || false);
  const [latitude, setLatitude] = useState<string>(storeSettings.latitude || "");
  const [longitude, setLongitude] = useState<string>(storeSettings.longitude || "");

  const [isSaving, setIsSaving] = useState(false);

  // New section form state
  const [newSection, setNewSection] = useState<any>({
    title: "",
    type: "text", // "text" | "payments" | "gallery" | "video" | "support" | "faq"
    content: "",
    icon: "Star",
    videoUrl: "",
    galleryUrl1: "",
    galleryUrl2: "",
    galleryUrl3: "",
    payPix: true,
    payCredit: true,
    payDebit: true,
    payInstallments: false,
    payManual: false,
    supportPhone: "",
    supportEmail: "",
    supportDesc: "",
    faqQuestion1: "",
    faqAnswer1: "",
    faqQuestion2: "",
    faqAnswer2: "",
  });

  // New exception form state
  const [newException, setNewException] = useState({
    label: "",
    date: "",
    open: false,
    openTime: "09:00",
    closeTime: "18:00",
  });

  // New action button form state
  const [newActionButton, setNewActionButton] = useState({
    label: "",
    url: "",
    icon: "whatsapp",
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        settings: {
          ...storeSettings,
          virtual_only: virtualOnly,
          latitude: latitude || undefined,
          longitude: longitude || undefined,
          logoUrl: form.logo_url || undefined,
          cover_url: coverUrl || undefined,
          instagramHandle: instagramHandle || undefined,
          businessHours: form.business_hours || undefined,
          business_hours_extended: extendedHours,
          holiday_exceptions: holidayExceptions,
          action_buttons: actionButtons,
          profile_sections: profileSections,
        },
      };

      await savePublicProfile({ data: payload });
      toast.success("Perfil público atualizado com sucesso!");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to edit extended hour field
  const handleUpdateHour = (index: number, key: string, value: any) => {
    setExtendedHours((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [key]: value } : item))
    );
  };

  // Custom sections builders helpers
  const handleAddSection = () => {
    if (!newSection.title) {
      toast.error("Preencha o título da seção");
      return;
    }

    let finalContent = "";
    let finalIcon = newSection.icon;

    if (newSection.type === "text") {
      if (!newSection.content) {
        toast.error("Preencha o conteúdo da seção");
        return;
      }
      finalContent = newSection.content;
    } else if (newSection.type === "payments") {
      finalContent = JSON.stringify({
        pix: newSection.payPix,
        credit: newSection.payCredit,
        debit: newSection.payDebit,
        installments: newSection.payInstallments,
        manual: newSection.payManual
      });
      finalIcon = "CreditCard";
    } else if (newSection.type === "gallery") {
      const urls = [newSection.galleryUrl1, newSection.galleryUrl2, newSection.galleryUrl3].filter(Boolean);
      if (urls.length === 0) {
        toast.error("Adicione pelo menos uma imagem à galeria");
        return;
      }
      finalContent = JSON.stringify(urls);
      finalIcon = "ImageIcon";
    } else if (newSection.type === "video") {
      if (!newSection.videoUrl) {
        toast.error("Preencha a URL do vídeo do YouTube");
        return;
      }
      finalContent = newSection.videoUrl;
      finalIcon = "Play";
    } else if (newSection.type === "support") {
      finalContent = JSON.stringify({
        phone: newSection.supportPhone,
        email: newSection.supportEmail,
        desc: newSection.supportDesc
      });
      finalIcon = "HelpCircle";
    } else if (newSection.type === "faq") {
      const items = [
        { q: newSection.faqQuestion1, a: newSection.faqAnswer1 },
        { q: newSection.faqQuestion2, a: newSection.faqAnswer2 }
      ].filter(item => item.q && item.a);

      if (items.length === 0) {
        toast.error("Adicione pelo menos uma pergunta e resposta");
        return;
      }
      finalContent = JSON.stringify(items);
      finalIcon = "HelpCircle";
    }

    const created = {
      id: `sec-${Date.now()}`,
      title: newSection.title,
      type: newSection.type,
      content: finalContent,
      icon: finalIcon,
    };

    setProfileSections((prev) => [...prev, created]);
    setNewSection({
      title: "",
      type: "text",
      content: "",
      icon: "Star",
      videoUrl: "",
      galleryUrl1: "",
      galleryUrl2: "",
      galleryUrl3: "",
      payPix: true,
      payCredit: true,
      payDebit: true,
      payInstallments: false,
      payManual: false,
      supportPhone: "",
      supportEmail: "",
      supportDesc: "",
      faqQuestion1: "",
      faqAnswer1: "",
      faqQuestion2: "",
      faqAnswer2: ""
    });
    toast.success("Seção adicionada!");
  };

  const handleRemoveSection = (id: string) => {
    setProfileSections((prev) => prev.filter((s) => s.id !== id));
    toast.success("Seção removida");
  };

  const handleMoveSection = (index: number, direction: "up" | "down") => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= profileSections.length) return;

    setProfileSections((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[nextIndex];
      updated[nextIndex] = temp;
      return updated;
    });
  };

  const handleAddException = () => {
    if (!newException.label || !newException.date) {
      toast.error("Preencha a descrição e a data do feriado");
      return;
    }
    setHolidayExceptions((prev) => [...prev, { ...newException, id: `ex-${Date.now()}` }]);
    setNewException({ label: "", date: "", open: false, openTime: "09:00", closeTime: "18:00" });
    toast.success("Feriado/Exceção adicionado!");
  };

  const handleRemoveException = (id: string) => {
    setHolidayExceptions((prev) => prev.filter((ex) => ex.id !== id));
    toast.success("Feriado/Exceção removido");
  };

  const handleAddActionButton = () => {
    if (!newActionButton.label || !newActionButton.url) {
      toast.error("Preencha a etiqueta e o link de destino");
      return;
    }
    setActionButtons((prev) => [...prev, { ...newActionButton, id: `btn-${Date.now()}` }]);
    setNewActionButton({ label: "", url: "", icon: "whatsapp" });
    toast.success("Botão de ação adicionado!");
  };

  const handleRemoveActionButton = (id: string) => {
    setActionButtons((prev) => prev.filter((b) => b.id !== id));
    toast.success("Botão de ação removido");
  };

  if (!store) {
    return (
      <div className="space-y-6">
        <PageHeader title="Perfil Público da Loja" description="Informações exibidas na vitrine." />
        <p className="text-muted-foreground text-sm">Loja não configurada.</p>
      </div>
    );
  }

  const BUTTON_ICONS: Record<string, any> = {
    phone: Phone,
    external: ExternalLink,
    whatsapp: MessageCircle,
    globe: Globe,
    calendar: CalendarIcon,
  };

  const getButtonIcon = (name: string) => {
    return BUTTON_ICONS[name] || ExternalLink;
  };

  // Helper to map icon name to component
  const renderIcon = (name: string) => {
    switch (name) {
      case "Star":
        return <Star className="h-4 w-4" />;
      case "Sparkles":
        return <Sparkles className="h-4 w-4" />;
      case "Clock":
        return <Clock className="h-4 w-4" />;
      case "MapPin":
        return <MapPin className="h-4 w-4" />;
      case "whatsapp":
        return <MessageCircle className="h-4 w-4" />;
      case "globe":
        return <Globe className="h-4 w-4" />;
      case "phone":
        return <Phone className="h-4 w-4" />;
      case "calendar":
        return <CalendarIcon className="h-4 w-4" />;
      case "CreditCard":
        return <CreditCard className="h-4 w-4" />;
      case "Play":
        return <Play className="h-4 w-4" />;
      case "HelpCircle":
        return <HelpCircle className="h-4 w-4" />;
      case "Mail":
        return <Mail className="h-4 w-4" />;
      case "ImageIcon":
        return <ImageIcon className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Perfil Público da Loja"
          description="Informações exibidas na página /perfil-da-loja e na vitrine."
        />
        <Button variant="outline" size="sm" asChild>
          <Link to="/perfil-da-loja">
            <ExternalLink className="mr-2 h-4 w-4" />
            Ver na Vitrine
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Preview Card (Mobile Frame) */}
        <div className="lg:col-span-4 sticky top-6 flex justify-center">
          <div className="relative w-full max-w-[340px] h-[700px] rounded-[2.5rem] border-[10px] border-muted/80 bg-background shadow-2xl overflow-hidden flex flex-col ring-1 ring-border/50">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-muted/80 rounded-b-2xl z-20"></div>

            <div className="flex-1 overflow-y-auto scrollbar-none bg-accent/20 relative z-10">
              {/* Cover Image */}
              <div className="relative h-40 w-full bg-muted">
                {coverUrl ? (
                  <img src={coverUrl} alt="Capa" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-[10px] text-muted-foreground italic">
                    Capa
                  </div>
                )}
                {/* Gradient overlay for text legibility if we wanted any on cover, or just depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
              </div>

              {/* Profile Header (Overlap) */}
              <div className="px-5 pb-5 -mt-12 relative z-10">
                <div className="flex flex-col items-center text-center space-y-3">
                  {form.logo_url ? (
                    <img
                      src={form.logo_url}
                      alt={(store as any).name}
                      className="size-24 rounded-full object-cover border-4 border-background shadow-sm bg-background"
                    />
                  ) : (
                    <div className="flex size-24 items-center justify-center rounded-full bg-background border-4 border-background shadow-sm text-primary">
                      <Store className="h-10 w-10" />
                    </div>
                  )}

                  <div>
                    <h2 className="font-bold text-xl leading-tight text-foreground">
                      {(store as any).name}
                    </h2>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                      @{(store as any).slug}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {form.description && (
                    <p className="text-[13px] leading-relaxed text-center text-muted-foreground px-2">
                      {form.description}
                    </p>
                  )}

                  {/* Quick Action Buttons */}
                  {actionButtons.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto scrollbar-none snap-x py-1">
                      {actionButtons.map((btn) => {
                        const Icon = getButtonIcon(btn.icon);
                        return (
                          <a
                            key={btn.id}
                            href={btn.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="snap-start shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                          >
                            <Icon className="size-3.5" />
                            {btn.label}
                          </a>
                        );
                      })}
                    </div>
                  )}

                  {/* Info Blocks */}
                  <div className="space-y-3 pt-2">
                    {/* Status badge */}
                    {extendedHours && (
                      <div className="flex items-center justify-center">
                        {(() => {
                          const status = getOpenStatus(extendedHours, holidayExceptions);
                          return (
                            <span
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider",
                                status.status === "open"
                                  ? "bg-emerald-500/15 text-emerald-700"
                                  : "bg-destructive/15 text-destructive"
                              )}
                            >
                              <Clock className="size-3" />
                              {status.text}
                            </span>
                          );
                        })()}
                      </div>
                    )}

                    <div className="rounded-2xl bg-card border shadow-sm p-4 space-y-3">
                      {form.phone && (
                        <div className="flex items-start gap-3">
                          <Phone className="size-4 text-primary shrink-0 mt-0.5" />
                          <span className="text-[13px] font-medium">{form.phone}</span>
                        </div>
                      )}
                      {instagramHandle && (
                        <div className="flex items-start gap-3">
                          <Instagram className="size-4 text-primary shrink-0 mt-0.5" />
                          <span className="text-[13px] font-medium">@{instagramHandle}</span>
                        </div>
                      )}
                      {virtualOnly ? (
                        <div className="flex items-start gap-3 text-left">
                          <Globe className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[12px] font-bold text-emerald-600 block">Loja 100% Online</span>
                            <span className="text-[11px] text-muted-foreground leading-tight">Atendimento e vendas digitais em todo o Brasil.</span>
                          </div>
                        </div>
                      ) : (
                        form.address && (
                          <div className="flex items-start gap-3 text-left">
                            <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                            <span className="text-[13px] font-medium leading-tight text-muted-foreground">{form.address}</span>
                          </div>
                        )
                      )}
                      {form.business_hours && (
                        <div className="flex items-start gap-3 text-left">
                          <Clock className="size-4 text-primary shrink-0 mt-0.5" />
                          <span className="text-[13px] font-medium leading-tight text-muted-foreground">{form.business_hours}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Custom Sections */}
                  {profileSections.length > 0 && (
                    <div className="space-y-3 pt-2 text-left">
                      {profileSections.map((sec) => (
                        <div key={sec.id} className="rounded-2xl bg-card border shadow-sm p-4">
                          <h3 className="font-bold text-[13px] flex items-center gap-2 mb-2">
                            <span className="text-primary">{renderIcon(sec.icon)}</span>
                            {sec.title}
                          </h3>
                          {(() => {
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
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                  {data.pix && <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded">Pix</span>}
                                  {data.credit && <span className="text-[10px] font-bold bg-blue-500/10 text-blue-700 px-2 py-0.5 rounded">Crédito</span>}
                                  {data.debit && <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-700 px-2 py-0.5 rounded">Débito</span>}
                                  {data.installments && <span className="text-[10px] font-bold bg-purple-500/10 text-purple-700 px-2 py-0.5 rounded">Carnê</span>}
                                  {data.manual && <span className="text-[10px] font-bold bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded">Manual</span>}
                                </div>
                              );
                            }

                            if (type === "gallery" && Array.isArray(data)) {
                              return (
                                <div className="grid grid-cols-3 gap-1 pt-0.5">
                                  {data.map((url: string, idx: number) => (
                                    <div key={idx} className="aspect-square rounded overflow-hidden border bg-muted">
                                      <img src={url} alt="" className="h-full w-full object-cover" />
                                    </div>
                                  ))}
                                </div>
                              );
                            }

                            if (type === "video") {
                              return <span className="text-[10px] text-muted-foreground italic">Vídeo incorporado</span>;
                            }

                            if (type === "support" && data) {
                              return (
                                <div className="space-y-1.5 pt-0.5 text-xs text-muted-foreground">
                                  {data.desc && <p className="text-[11px] leading-tight">{data.desc}</p>}
                                  {data.phone && <div className="font-semibold text-foreground">WhatsApp: {data.phone}</div>}
                                  {data.email && <div className="font-semibold text-foreground">E-mail: {data.email}</div>}
                                </div>
                              );
                            }

                            if (type === "faq" && Array.isArray(data)) {
                              return (
                                <div className="space-y-2 pt-0.5">
                                  {data.map((item: any, idx: number) => (
                                    <div key={idx} className="text-[11px] leading-snug border-b pb-1">
                                      <p className="font-bold text-foreground">Q: {item.q}</p>
                                      <p className="text-muted-foreground">A: {item.a}</p>
                                    </div>
                                  ))}
                                </div>
                              );
                            }

                            return (
                              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {sec.content}
                              </p>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Fake Home Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-muted-foreground/30 rounded-full z-20"></div>
          </div>
        </div>

        {/* Edit Form with Tabs (8 columns) */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSave} className="space-y-6">
            <Card className="shadow-lg border bg-card/60 backdrop-blur-xl overflow-hidden">
              <Tabs defaultValue="geral" className="w-full">
                <div className="border-b px-2 pt-2 bg-muted/10">
                  <TabsList className="bg-transparent border-none gap-2 w-full justify-start overflow-x-auto scrollbar-none h-12">
                    <TabsTrigger value="geral" className="text-[13px] font-semibold data-[state=active]:bg-background rounded-full px-4 h-8 data-[state=active]:shadow-sm">
                      Geral
                    </TabsTrigger>
                    <TabsTrigger value="horarios" className="text-[13px] font-semibold data-[state=active]:bg-background rounded-full px-4 h-8 data-[state=active]:shadow-sm">
                      Horários & Google
                    </TabsTrigger>
                    <TabsTrigger value="secoes" className="text-[13px] font-semibold data-[state=active]:bg-background rounded-full px-4 h-8 data-[state=active]:shadow-sm">
                      Seções do Perfil
                    </TabsTrigger>
                    <TabsTrigger value="botoes" className="text-[13px] font-semibold data-[state=active]:bg-background rounded-full px-4 h-8 data-[state=active]:shadow-sm">
                      Botões de Ação
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* TAB 1: INFORMAÇÕES GERAIS */}
                <TabsContent value="geral" className="p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <Label>Logotipo da Loja</Label>
                      </div>
                      <ImageUpload
                        value={form.logo_url}
                        onChange={(url) => setForm((f) => ({ ...f, logo_url: url }))}
                        onRemove={() => setForm((f) => ({ ...f, logo_url: "" }))}
                        bucket="cms-media"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <Label>Imagem de Capa (Banner)</Label>
                      </div>
                      <ImageUpload
                        value={coverUrl}
                        onChange={(url) => setCoverUrl(url)}
                        onRemove={() => setCoverUrl("")}
                        bucket="cms-media"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="store-phone">Telefone / WhatsApp</Label>
                      </div>
                      <Input
                        id="store-phone"
                        type="tel"
                        placeholder="(49) 99999-9999"
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Instagram className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="store-instagram">Instagram Handle (sem @)</Label>
                      </div>
                      <Input
                        id="store-instagram"
                        placeholder="hrshoes.oficial"
                        value={instagramHandle}
                        onChange={(e) => setInstagramHandle(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/10">
                    <div className="space-y-0.5">
                      <Label htmlFor="store-virtual">Loja 100% Virtual / Sem Endereço Físico</Label>
                      <p className="text-xs text-muted-foreground">
                        Ative se você não atende presencialmente. O mapa será ocultado na vitrine.
                      </p>
                    </div>
                    <Switch
                      id="store-virtual"
                      checked={virtualOnly}
                      onCheckedChange={setVirtualOnly}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="store-address">Endereço Físico</Label>
                    </div>
                    <Input
                      id="store-address"
                      placeholder="Rua Exemplo, 123 — Chapecó, SC"
                      value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                      disabled={virtualOnly}
                    />
                    {!virtualOnly && (
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Latitude do Mapa (Leaflet)</Label>
                          <Input
                            placeholder="Ex: -27.0988"
                            value={latitude}
                            onChange={(e) => setLatitude(e.target.value)}
                            className="h-8 text-xs bg-card"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Longitude do Mapa (Leaflet)</Label>
                          <Input
                            placeholder="Ex: -52.6128"
                            value={longitude}
                            onChange={(e) => setLongitude(e.target.value)}
                            className="h-8 text-xs bg-card"
                          />
                        </div>
                      </div>
                    )}
                    {!virtualOnly && form.address && (
                      <div className="mt-2 overflow-hidden rounded-lg border aspect-video w-full max-h-40 z-0">
                        <iframe
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(form.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          title="Preview do Mapa"
                        ></iframe>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="store-hours">Horário de Funcionamento (Texto Livre)</Label>
                    </div>
                    <Input
                      id="store-hours"
                      placeholder="Seg-Sex 9h-18h, Sáb 9h-13h"
                      value={form.business_hours}
                      onChange={(e) => setForm((f) => ({ ...f, business_hours: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="store-desc">Descrição / História da Loja</Label>
                    </div>
                    <Textarea
                      id="store-desc"
                      rows={4}
                      placeholder="Conte a história da sua loja na vitrine..."
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      maxLength={500}
                    />
                  </div>
                </TabsContent>

                {/* TAB 2: HORÁRIOS GOOGLE STYLE */}
                <TabsContent value="horarios" className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-sm">Horários Estruturados (Google Meu Negócio)</h3>
                      <p className="text-xs text-muted-foreground">
                        Configure os horários de abertura e fechamento padrão para cada dia da semana.
                      </p>
                    </div>

                    <div className="space-y-2.5 border rounded-xl p-3 bg-muted/10">
                      {extendedHours.map((item, index) => (
                        <div key={item.day} className="flex items-center justify-between gap-4 p-2 border-b last:border-b-0 text-xs">
                          <span className="font-bold w-24">{item.day}</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="checkbox"
                              checked={item.open}
                              onChange={(e) => handleUpdateHour(index, "open", e.target.checked)}
                              className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                            />
                            <span className={item.open ? "text-emerald-600 font-bold" : "text-destructive/80 font-bold"}>
                              {item.open ? "Aberto" : "Fechado"}
                            </span>
                          </div>
                          {item.open ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="time"
                                className="w-20 h-7 text-xs px-2 py-0"
                                value={item.openTime || "09:00"}
                                onChange={(e) => handleUpdateHour(index, "openTime", e.target.value)}
                              />
                              <span>até</span>
                              <Input
                                type="time"
                                className="w-20 h-7 text-xs px-2 py-0"
                                value={item.closeTime || "18:00"}
                                onChange={(e) => handleUpdateHour(index, "closeTime", e.target.value)}
                              />
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic text-[11px]">-</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Holiday Exceptions Sub-Section */}
                  <div className="border-t pt-6 space-y-4">
                    <div>
                      <h3 className="font-bold text-sm">Feriados e Exceções de Funcionamento</h3>
                      <p className="text-xs text-muted-foreground">
                        Adicione exceções para datas específicas (ex: feriados de fim de ano).
                      </p>
                    </div>

                    <div className="p-4 border rounded-xl bg-muted/20 space-y-4">
                      <h4 className="font-bold text-xs flex items-center gap-1">
                        <Plus className="h-3.5 w-3.5" /> Adicionar Nova Exceção
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Descrição / Nome do Feriado</Label>
                          <Input
                            placeholder="Ex: Feriado de Ano Novo"
                            value={newException.label}
                            onChange={(e) => setNewException({ ...newException, label: e.target.value })}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Data</Label>
                          <Input
                            type="date"
                            value={newException.date}
                            onChange={(e) => setNewException({ ...newException, date: e.target.value })}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="flex items-center space-x-2 pt-6">
                          <input
                            type="checkbox"
                            id="chk-new-exc-open"
                            checked={newException.open}
                            onChange={(e) => setNewException({ ...newException, open: e.target.checked })}
                            className="size-4 rounded border-gray-300 accent-primary"
                          />
                          <Label htmlFor="chk-new-exc-open" className="text-xs">Loja aberta nesta data?</Label>
                        </div>
                      </div>
                      
                      {newException.open && (
                        <div className="flex items-center gap-2 border-t pt-3">
                          <Label className="text-xs">Horário de Funcionamento:</Label>
                          <Input
                            type="time"
                            className="w-20 h-7 text-xs px-2 py-0 bg-card"
                            value={newException.openTime}
                            onChange={(e) => setNewException({ ...newException, openTime: e.target.value })}
                          />
                          <span className="text-xs">até</span>
                          <Input
                            type="time"
                            className="w-20 h-7 text-xs px-2 py-0 bg-card"
                            value={newException.closeTime}
                            onChange={(e) => setNewException({ ...newException, closeTime: e.target.value })}
                          />
                        </div>
                      )}

                      <Button type="button" size="sm" onClick={handleAddException} className="h-8 text-xs">
                        Adicionar Data Exceção
                      </Button>
                    </div>

                    {/* Exceptions List */}
                    {holidayExceptions.length > 0 && (
                      <div className="space-y-2">
                        {holidayExceptions.map((ex) => {
                          const [year, month, day] = ex.date.split("-");
                          return (
                            <div key={ex.id} className="flex items-center justify-between p-3 border rounded-lg bg-card text-xs">
                              <div>
                                <span className="font-bold">{ex.label}</span>
                                <span className="text-muted-foreground ml-2">({day}/{month}/{year})</span>
                                <div className="text-xs mt-0.5">
                                  {ex.open ? (
                                    <span className="text-emerald-600 font-bold">Aberto: {ex.openTime} - {ex.closeTime}</span>
                                  ) : (
                                    <span className="text-destructive font-bold">Fechado o dia todo</span>
                                  )}
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 text-destructive hover:bg-destructive/10"
                                onClick={() => handleRemoveException(ex.id)}
                              >
                                <Trash className="size-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* TAB 3: SEÇÕES CUSTOMIZADAS BUILDER */}
                <TabsContent value="secoes" className="p-6 space-y-6">
                  <div>
                    <h3 className="font-bold text-sm">Construtor de Seções Personalizadas</h3>
                    <p className="text-xs text-muted-foreground">
                      Adicione seções customizadas que serão exibidas na sua página de perfil da vitrine.
                    </p>
                  </div>

                  {/* Form de Nova Seção */}
                  <div className="p-4 border rounded-xl bg-muted/20 space-y-4">
                    <h4 className="font-bold text-xs flex items-center gap-1 text-primary">
                      <Plus className="h-3.5 w-3.5" /> Adicionar Nova Seção Personalizada
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Título da Seção</Label>
                        <Input
                          placeholder="Ex: Como Cuidar do Couro"
                          value={newSection.title}
                          onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                          className="h-8 text-xs bg-card"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Tipo de Bloco</Label>
                        <Select
                          value={newSection.type}
                          onValueChange={(val) => setNewSection({ ...newSection, type: val })}
                        >
                          <SelectTrigger className="h-8 text-xs bg-card">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Texto Livre / Artigo</SelectItem>
                            <SelectItem value="payments">Meios de Pagamento Aceitos</SelectItem>
                            <SelectItem value="gallery">Galeria de Imagens / Fotos</SelectItem>
                            <SelectItem value="video">Vídeo Incorporado (YouTube)</SelectItem>
                            <SelectItem value="support">Canais de Atendimento</SelectItem>
                            <SelectItem value="faq">Perguntas Frequentes (FAQ)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Ícone de Cabeçalho</Label>
                        <Select
                          value={newSection.icon}
                          onValueChange={(val) => setNewSection({ ...newSection, icon: val })}
                          disabled={newSection.type !== "text"} // Auto icons for other types
                        >
                          <SelectTrigger className="h-8 text-xs bg-card">
                            <SelectValue placeholder="Ícone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Star">Estrela</SelectItem>
                            <SelectItem value="Sparkles">Brilho/Destaque</SelectItem>
                            <SelectItem value="Clock">Relógio</SelectItem>
                            <SelectItem value="MapPin">Localização</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Conditional inputs depending on section type */}
                    {newSection.type === "text" && (
                      <div className="space-y-1">
                        <Label className="text-xs">Conteúdo da Seção</Label>
                        <Textarea
                          placeholder="Descreva as informações detalhadas desta seção..."
                          value={newSection.content}
                          onChange={(e) => setNewSection({ ...newSection, content: e.target.value })}
                          rows={3}
                          className="text-xs bg-card"
                        />
                      </div>
                    )}

                    {newSection.type === "payments" && (
                      <div className="p-3 border rounded-lg bg-card space-y-3 text-left">
                        <Label className="text-xs font-bold block mb-1">Meios de Pagamento Disponíveis:</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="pay-pix"
                              checked={newSection.payPix}
                              onChange={(e) => setNewSection({ ...newSection, payPix: e.target.checked })}
                              className="size-4 rounded border-gray-300 accent-primary"
                            />
                            <Label htmlFor="pay-pix" className="text-xs cursor-pointer">Pix</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="pay-credit"
                              checked={newSection.payCredit}
                              onChange={(e) => setNewSection({ ...newSection, payCredit: e.target.checked })}
                              className="size-4 rounded border-gray-300 accent-primary"
                            />
                            <Label htmlFor="pay-credit" className="text-xs cursor-pointer">Cartão de Crédito</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="pay-debit"
                              checked={newSection.payDebit}
                              onChange={(e) => setNewSection({ ...newSection, payDebit: e.target.checked })}
                              className="size-4 rounded border-gray-300 accent-primary"
                            />
                            <Label htmlFor="pay-debit" className="text-xs cursor-pointer">Cartão de Débito</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="pay-inst"
                              checked={newSection.payInstallments}
                              onChange={(e) => setNewSection({ ...newSection, payInstallments: e.target.checked })}
                              className="size-4 rounded border-gray-300 accent-primary"
                            />
                            <Label htmlFor="pay-inst" className="text-xs cursor-pointer">Ficha / Carnê Próprio</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="pay-manual"
                              checked={newSection.payManual}
                              onChange={(e) => setNewSection({ ...newSection, payManual: e.target.checked })}
                              className="size-4 rounded border-gray-300 accent-primary"
                            />
                            <Label htmlFor="pay-manual" className="text-xs cursor-pointer">A combinar (Manual)</Label>
                          </div>
                        </div>
                      </div>
                    )}

                    {newSection.type === "gallery" && (
                      <div className="p-3 border rounded-lg bg-card space-y-4 text-left">
                        <Label className="text-xs font-bold block">Galeria de Fotos (até 3 imagens):</Label>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Imagem 1</Label>
                            <ImageUpload
                              value={newSection.galleryUrl1}
                              onChange={(url) => setNewSection({ ...newSection, galleryUrl1: url })}
                              onRemove={() => setNewSection({ ...newSection, galleryUrl1: "" })}
                              bucket="cms-media"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Imagem 2</Label>
                            <ImageUpload
                              value={newSection.galleryUrl2}
                              onChange={(url) => setNewSection({ ...newSection, galleryUrl2: url })}
                              onRemove={() => setNewSection({ ...newSection, galleryUrl2: "" })}
                              bucket="cms-media"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Imagem 3</Label>
                            <ImageUpload
                              value={newSection.galleryUrl3}
                              onChange={(url) => setNewSection({ ...newSection, galleryUrl3: url })}
                              onRemove={() => setNewSection({ ...newSection, galleryUrl3: "" })}
                              bucket="cms-media"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {newSection.type === "video" && (
                      <div className="space-y-1 text-left">
                        <Label className="text-xs">Link do Vídeo no YouTube</Label>
                        <Input
                          placeholder="Ex: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                          value={newSection.videoUrl}
                          onChange={(e) => setNewSection({ ...newSection, videoUrl: e.target.value })}
                          className="h-8 text-xs bg-card"
                        />
                      </div>
                    )}

                    {newSection.type === "support" && (
                      <div className="p-3 border rounded-lg bg-card space-y-3 text-left">
                        <Label className="text-xs font-bold block mb-1">Canais de Contato Rápido:</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-[10px]">WhatsApp Comercial</Label>
                            <Input
                              placeholder="Ex: (49) 99999-9999"
                              value={newSection.supportPhone}
                              onChange={(e) => setNewSection({ ...newSection, supportPhone: e.target.value })}
                              className="h-8 text-xs bg-card"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">E-mail de Suporte</Label>
                            <Input
                              type="email"
                              placeholder="Ex: suporte@loja.com"
                              value={newSection.supportEmail}
                              onChange={(e) => setNewSection({ ...newSection, supportEmail: e.target.value })}
                              className="h-8 text-xs bg-card"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Descrição do Atendimento</Label>
                          <Textarea
                            placeholder="Ex: Respondemos em menos de 15 minutos em horário comercial."
                            value={newSection.supportDesc}
                            onChange={(e) => setNewSection({ ...newSection, supportDesc: e.target.value })}
                            rows={2}
                            className="text-xs bg-card"
                          />
                        </div>
                      </div>
                    )}

                    {newSection.type === "faq" && (
                      <div className="p-3 border rounded-lg bg-card space-y-3 text-left">
                        <Label className="text-xs font-bold block mb-1">Perguntas Frequentes (FAQ):</Label>
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 gap-2">
                            <Label className="text-[10px] font-semibold text-primary">Pergunta 1</Label>
                            <Input
                              placeholder="Ex: Quais as formas de envio?"
                              value={newSection.faqQuestion1}
                              onChange={(e) => setNewSection({ ...newSection, faqQuestion1: e.target.value })}
                              className="h-8 text-xs bg-card"
                            />
                            <Label className="text-[10px] text-muted-foreground">Resposta 1</Label>
                            <Textarea
                              placeholder="Ex: Enviamos via Correios (PAC e Sedex) e Transportadora para todo o Brasil..."
                              value={newSection.faqAnswer1}
                              onChange={(e) => setNewSection({ ...newSection, faqAnswer1: e.target.value })}
                              rows={2}
                              className="text-xs bg-card"
                            />
                          </div>
                          <div className="grid grid-cols-1 gap-2 border-t pt-2">
                            <Label className="text-[10px] font-semibold text-primary">Pergunta 2</Label>
                            <Input
                              placeholder="Ex: Como funciona a garantia?"
                              value={newSection.faqQuestion2}
                              onChange={(e) => setNewSection({ ...newSection, faqQuestion2: e.target.value })}
                              className="h-8 text-xs bg-card"
                            />
                            <Label className="text-[10px] text-muted-foreground">Resposta 2</Label>
                            <Textarea
                              placeholder="Ex: Todos os nossos produtos possuem garantia legal de 90 dias contra defeitos de fabricação..."
                              value={newSection.faqAnswer2}
                              onChange={(e) => setNewSection({ ...newSection, faqAnswer2: e.target.value })}
                              rows={2}
                              className="text-xs bg-card"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <Button type="button" onClick={handleAddSection} size="sm" className="font-bold w-full bg-primary/95 text-xs hover:bg-primary h-9">
                      Inserir Bloco de Seção no Perfil
                    </Button>
                  </div>

                  {/* Lista de Seções */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs">Seções Organizadas</h4>
                    {profileSections.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic p-4 border border-dashed rounded-lg text-center">
                        Nenhuma seção personalizada inserida ainda.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {profileSections.map((sec, index) => (
                          <div key={sec.id} className="flex items-start gap-3 p-3 border rounded-lg bg-card">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                              {renderIcon(sec.icon)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-xs">{sec.title}</p>
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed whitespace-pre-wrap">
                                {sec.content}
                              </p>
                            </div>
                            <div className="flex flex-col gap-1 shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-6 shrink-0"
                                disabled={index === 0}
                                onClick={() => handleMoveSection(index, "up")}
                              >
                                <ArrowUp className="size-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-6 shrink-0"
                                disabled={index === profileSections.length - 1}
                                onClick={() => handleMoveSection(index, "down")}
                              >
                                <ArrowDown className="size-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-6 hover:bg-destructive/10 hover:text-destructive shrink-0 text-muted-foreground"
                                onClick={() => handleRemoveSection(sec.id)}
                              >
                                <Trash className="size-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* TAB 4: BOTÕES DE AÇÃO */}
                <TabsContent value="botoes" className="p-6 space-y-6">
                  <div>
                    <h3 className="font-bold text-sm">Botões de Ação Personalizados</h3>
                    <p className="text-xs text-muted-foreground">
                      Crie botões adicionais (como WhatsApp, Calendário de Agendamento, etc.) para exibir na vitrine.
                    </p>
                  </div>

                  {/* Form de Novo Botão */}
                  <div className="p-4 border rounded-xl bg-muted/20 space-y-4">
                    <h4 className="font-bold text-xs flex items-center gap-1">
                      <Plus className="h-3.5 w-3.5" /> Adicionar Novo Botão
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Etiqueta do Botão</Label>
                        <Input
                          placeholder="Ex: Fale no WhatsApp"
                          value={newActionButton.label}
                          onChange={(e) => setNewActionButton({ ...newActionButton, label: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Link (URL completa)</Label>
                        <Input
                          placeholder="Ex: https://wa.me/..."
                          value={newActionButton.url}
                          onChange={(e) => setNewActionButton({ ...newActionButton, url: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Ícone</Label>
                        <Select
                          value={newActionButton.icon}
                          onValueChange={(val) => setNewActionButton({ ...newActionButton, icon: val })}
                        >
                          <SelectTrigger className="h-8 text-xs bg-card">
                            <SelectValue placeholder="Selecione um ícone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="whatsapp">WhatsApp (Conversa)</SelectItem>
                            <SelectItem value="globe">Site (Globo)</SelectItem>
                            <SelectItem value="phone">Telefone</SelectItem>
                            <SelectItem value="calendar">Calendário (Agenda)</SelectItem>
                            <SelectItem value="external">Link Externo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button type="button" onClick={handleAddActionButton} size="sm" className="font-bold">
                      Adicionar Botão
                    </Button>
                  </div>

                  {/* Lista de Botões cadastrados */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs">Botões Cadastrados</h4>
                    {actionButtons.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic p-4 border border-dashed rounded-lg text-center">
                        Nenhum botão de ação personalizado criado ainda.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {actionButtons.map((btn) => {
                          const Icon = getButtonIcon(btn.icon);
                          return (
                            <div key={btn.id} className="flex items-center justify-between p-3 border rounded-lg bg-card text-xs">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                  <Icon className="size-4" />
                                </div>
                                <div>
                                  <p className="font-bold">{btn.label}</p>
                                  <p className="text-muted-foreground text-[10px] truncate max-w-sm">{btn.url}</p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 text-destructive hover:bg-destructive/10"
                                onClick={() => handleRemoveActionButton(btn.id)}
                              >
                                <Trash className="size-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>

            <Button type="submit" disabled={isSaving} className="w-full font-bold h-11 text-sm">
              {isSaving ? "Gravando Perfil..." : "Salvar Configurações Completas"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
