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
} from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

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

  const [isSaving, setIsSaving] = useState(false);

  // New section form state
  const [newSection, setNewSection] = useState({
    title: "",
    content: "",
    icon: "Star",
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
    if (!newSection.title || !newSection.content) {
      toast.error("Preencha o título e conteúdo da seção");
      return;
    }
    const created = {
      id: `sec-${Date.now()}`,
      ...newSection,
    };
    setProfileSections((prev) => [...prev, created]);
    setNewSection({ title: "", content: "", icon: "Star" });
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
        {/* Preview Card (4 columns) */}
        <div className="lg:col-span-4 rounded-lg border bg-card p-5 space-y-4 shadow-sm sticky top-6">
          <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
            Prévia do Perfil Público
          </h3>
          
          {/* Cover image preview in card top */}
          {coverUrl ? (
            <div className="h-24 w-full rounded-xl overflow-hidden relative border">
              <img src={coverUrl} alt="Capa" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-black/20" />
            </div>
          ) : (
            <div className="h-12 w-full rounded-xl bg-muted/40 border border-dashed flex items-center justify-center text-[10px] text-muted-foreground">
              Sem imagem de capa
            </div>
          )}

          <div className="flex items-center gap-4">
            {form.logo_url ? (
              <img
                src={form.logo_url}
                alt={(store as any).name}
                className="h-16 w-16 rounded-xl object-cover border"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                <Store className="h-8 w-8 text-primary" />
              </div>
            )}
            <div>
              <p className="font-bold text-base">{(store as any).name}</p>
              <p className="text-xs text-muted-foreground">/{(store as any).slug}</p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-muted-foreground border-t pt-3">
            {form.description ? (
              <p className="italic text-xs font-medium">"{form.description}"</p>
            ) : (
              <p className="text-destructive/80 text-xs">Sem descrição definida.</p>
            )}
            <div className="space-y-2 text-xs pt-1">
              {form.phone && (
                <p className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  {form.phone}
                </p>
              )}
              {instagramHandle && (
                <p className="flex items-center gap-1.5">
                  <Instagram className="h-3.5 w-3.5 text-primary" />
                  @{instagramHandle}
                </p>
              )}
              {form.address && (
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {form.address}
                </p>
              )}
              {form.business_hours && (
                <p className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  {form.business_hours}
                </p>
              )}
            </div>

            {/* Dynamic Open Status calculations inside preview */}
            {extendedHours && (
              <div className="border-t pt-3 w-full flex justify-between items-center text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> status
                </span>
                {(() => {
                  const status = getOpenStatus(extendedHours, holidayExceptions);
                  return (
                    <span
                      className={cn(
                        "font-semibold px-2 py-0.5 rounded-full text-[10px]",
                        status.status === "open"
                          ? "text-emerald-600 bg-emerald-500/10"
                          : "text-destructive bg-destructive/10"
                      )}
                    >
                      {status.text}
                    </span>
                  );
                })()}
              </div>
            )}

            {/* Action buttons preview inside preview */}
            {actionButtons.length > 0 && (
              <div className="border-t pt-3 space-y-1.5 w-full">
                <span className="text-muted-foreground text-[10px] uppercase font-bold block">
                  Botões de Ação ({actionButtons.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {actionButtons.map((btn) => {
                    const Icon = getButtonIcon(btn.icon);
                    return (
                      <span
                        key={btn.id}
                        className="inline-flex items-center gap-1 text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded border"
                      >
                        <Icon className="size-2.5" /> {btn.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {profileSections.length > 0 && (
            <div className="border-t pt-3 space-y-2">
              <h4 className="font-semibold text-xs text-muted-foreground">Seções Customizadas ({profileSections.length})</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {profileSections.map((sec) => (
                  <div key={sec.id} className="p-2 border rounded bg-muted/30 text-xs">
                    <p className="font-bold flex items-center gap-1">
                      {renderIcon(sec.icon)}
                      {sec.title}
                    </p>
                    <p className="text-muted-foreground truncate mt-0.5">{sec.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Edit Form with Tabs (8 columns) */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSave} className="space-y-6">
            <Card className="shadow-xs border bg-card">
              <Tabs defaultValue="geral" className="w-full">
                <div className="border-b px-4 pt-1 bg-muted/10">
                  <TabsList className="bg-transparent border-none gap-2">
                    <TabsTrigger value="geral" className="text-xs data-[state=active]:bg-background">
                      Informações Gerais
                    </TabsTrigger>
                    <TabsTrigger value="horarios" className="text-xs data-[state=active]:bg-background">
                      Horários (Google)
                    </TabsTrigger>
                    <TabsTrigger value="secoes" className="text-xs data-[state=active]:bg-background">
                      Seções do Perfil
                    </TabsTrigger>
                    <TabsTrigger value="botoes" className="text-xs data-[state=active]:bg-background">
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
                    />
                    {form.address && (
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
                    <h4 className="font-bold text-xs flex items-center gap-1">
                      <Plus className="h-3.5 w-3.5" /> Adicionar Nova Seção
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Título da Seção</Label>
                        <Input
                          placeholder="Ex: Como Cuidar do Couro"
                          value={newSection.title}
                          onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Ícone Relacionado</Label>
                        <Select
                          value={newSection.icon}
                          onValueChange={(val) => setNewSection({ ...newSection, icon: val })}
                        >
                          <SelectTrigger className="h-8 text-xs bg-card">
                            <SelectValue placeholder="Selecione um ícone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Star">Estrela</SelectItem>
                            <SelectItem value="Sparkles">Brilho/Destaque</SelectItem>
                            <SelectItem value="Clock">Relógio/Tempo</SelectItem>
                            <SelectItem value="MapPin">Mapa/Local</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Conteúdo da Seção</Label>
                      <Textarea
                        placeholder="Descreva as informações detalhadas desta seção..."
                        value={newSection.content}
                        onChange={(e) => setNewSection({ ...newSection, content: e.target.value })}
                        rows={3}
                        className="text-xs"
                      />
                    </div>
                    <Button type="button" onClick={handleAddSection} size="sm" className="font-bold">
                      Inserir Seção no Perfil
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
