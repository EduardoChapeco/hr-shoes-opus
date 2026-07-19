import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Users,
  Search,
  ArrowRight,
  Plus,
  ArrowLeftRight,
  CheckCircle,
  Archive,
  MessageSquare,
  Mail,
  Phone,
  UserCheck,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  listCustomers,
  createCustomer,
  listLeads,
  updateLeadStatus,
  promoteLeadToCustomer,
} from "@/services/crm.functions";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/admin/clientes/")({
  head: () => ({ meta: [{ title: "Clientes & Leads — Hr Shoes" }] }),
  loader: async () => {
    const [customers, leadsRes] = await Promise.all([
      listCustomers(),
      listLeads(),
    ]);
    return {
      customers,
      leads: leadsRes.status === "ok" ? leadsRes.data : [],
    };
  },
  component: CustomersPage,
});

function CustomersPage() {
  const { customers, leads } = Route.useLoaderData();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("customers");
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    tagsRaw: "",
    notes: "",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email) {
      toast.error("Nome e E-mail são obrigatórios");
      return;
    }
    setIsSaving(true);
    try {
      const tags = form.tagsRaw
        ? form.tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      const res = await createCustomer({
        data: {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          tags,
          notes: form.notes,
        },
      });

      if (res.status === "success") {
        toast.success("Cliente cadastrado com sucesso!");
        setIsOpen(false);
        setForm({ fullName: "", email: "", phone: "", tagsRaw: "", notes: "" });
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao cadastrar");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro inesperado");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (leadId: string, status: "new" | "contacted" | "converted" | "lost") => {
    try {
      const res = await updateLeadStatus({ data: { leadId, status } });
      if (res.status === "success") {
        toast.success("Lead atualizado");
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao atualizar");
      }
    } catch {
      toast.error("Falha ao atualizar lead");
    }
  };

  const handlePromote = async (leadId: string) => {
    try {
      toast.loading("Promovendo lead a cliente...", { id: "promote" });
      const res = await promoteLeadToCustomer({ data: { leadId } });
      if (res.status === "success") {
        toast.success("Lead promovido a cliente com sucesso!", { id: "promote" });
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao promover", { id: "promote" });
      }
    } catch {
      toast.error("Falha ao promover lead", { id: "promote" });
    }
  };

  // Filter customers by search term
  const filteredCustomers = customers.filter(
    (c: any) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tags.some((t: string) => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group leads for Kanban Columns
  const leadsNew = leads.filter((l: any) => l.status === "new");
  const leadsContacted = leads.filter((l: any) => l.status === "contacted");
  const leadsConverted = leads.filter((l: any) => l.status === "converted");
  const leadsLost = leads.filter((l: any) => l.status === "lost");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes & Leads"
        description="Gestão integrada de fichas de clientes, funil de vendas e contatos de vitrines."
        actions={
          <Button onClick={() => setIsOpen(true)} className="font-bold flex items-center gap-1.5 text-xs h-9">
            <Plus className="size-4" />
            Cadastrar Cliente
          </Button>
        }
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b bg-muted/30">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <UserCheck className="size-5 text-primary" />
              Cadastrar Novo Cliente
            </DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para adicionar um contato ao seu CRM e habilitar o histórico de compras.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="px-6 py-4">
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Coluna 1: Dados Pessoais e Contato */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cli-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome Completo *</Label>
                  <Input
                    id="cli-name"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Ex: Carlos Souza"
                    className="h-10 bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cli-tax" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CPF ou CNPJ</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 size-4 text-muted-foreground/50" />
                    <Input
                      id="cli-tax"
                      value={form.taxId}
                      onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                      placeholder="000.000.000-00"
                      className="pl-9 h-10 bg-background"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cli-email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">E-mail *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 size-4 text-muted-foreground/50" />
                    <Input
                      id="cli-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="carlos@exemplo.com"
                      className="pl-9 h-10 bg-background"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cli-phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Telefone / WhatsApp</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 size-4 text-muted-foreground/50" />
                    <Input
                      id="cli-phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="(49) 99999-9999"
                      className="pl-9 h-10 bg-background"
                    />
                  </div>
                </div>
              </div>

              {/* Coluna 2: Segmentação e Notas CRM */}
              <div className="space-y-4 md:border-l md:pl-6">
                <div className="space-y-2">
                  <Label htmlFor="cli-tags" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tags de Segmentação</Label>
                  <Input
                    id="cli-tags"
                    value={form.tagsRaw}
                    onChange={(e) => setForm({ ...form, tagsRaw: e.target.value })}
                    placeholder="Ex: VIP, Atacado, Compra Frequente"
                    className="h-10 bg-background"
                  />
                  <p className="text-[10px] text-muted-foreground">Separe as tags por vírgulas.</p>
                </div>
                <div className="flex items-start space-x-2 pt-2 pb-2 border-y border-dashed border-border/80">
                  <Checkbox
                    id="cli-consent-lgpd"
                    checked={form.isConsentLgpd}
                    onCheckedChange={(checked) => setForm({ ...form, isConsentLgpd: !!checked })}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="cli-consent-lgpd"
                      className="text-xs font-bold uppercase tracking-wider text-muted-foreground cursor-pointer flex items-center gap-1"
                    >
                      <ShieldCheck className="size-3.5 text-emerald-500" /> Consentimento LGPD
                    </label>
                    <p className="text-[10px] text-muted-foreground leading-snug">
                      O cliente autoriza expressamente a coleta e o processamento de seus dados cadastrais.
                    </p>
                  </div>
                </div>
                <div className="space-y-2 h-full flex flex-col">
                  <Label htmlFor="cli-notes" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MessageSquare className="size-3.5" /> Notas Internas do CRM
                  </Label>
                  <textarea
                    id="cli-notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Observações importantes sobre preferências ou negociações..."
                    className="flex min-h-[80px] w-full flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter className="pt-6 mt-4 border-t border-border/50">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="h-10">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving} className="h-10 min-w-32 font-bold bg-primary text-primary-foreground hover:bg-primary/90">
                {isSaving ? "Salvando..." : (
                  <>
                    <CheckCircle className="size-4 mr-2" /> Cadastrar Cliente
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 max-w-md mb-6">
          <TabsTrigger value="customers" className="text-xs">
            Clientes CRM ({filteredCustomers.length})
          </TabsTrigger>
          <TabsTrigger value="kanban" className="text-xs">
            Funil de Leads ({leads.length})
          </TabsTrigger>
          <TabsTrigger value="messages" className="text-xs">
            Mensagens de Contato
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Customers CRM List */}
        <TabsContent value="customers" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar cliente ou tag..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Desde</TableHead>
                  <TableHead className="text-center">Pedidos</TableHead>
                  <TableHead className="text-right">LTV</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                        {c.name}
                        {c.isConsentLgpd && (
                          <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-600 bg-emerald-50/50 hover:bg-emerald-50/50 h-4 px-1">
                            LGPD
                          </Badge>
                        )}
                      </div>
                      {c.taxId && (
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{c.taxId}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(c.joinedAt).toLocaleDateString("pt-BR", {
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-center text-sm font-semibold">{c.orderCount}</TableCell>
                    <TableCell className="text-right text-sm font-bold text-foreground">{formatMoney(c.ltvCents)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {c.tags.length > 0 ? (
                          c.tags.slice(0, 2).map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] h-5">
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                        {c.tags.length > 2 && (
                          <Badge variant="outline" className="text-[10px] h-5">
                            +{c.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild className="h-8">
                        <Link to="/admin/clientes/$id" params={{ id: c.id }}>
                          Detalhes
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCustomers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-xs text-muted-foreground">
                      Nenhum cliente cadastrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Tab 2: Funil Kanban Pipeline */}
        <TabsContent value="kanban" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
            {/* Column 1: New */}
            <Card className="bg-muted/30 border border-muted-foreground/15">
              <CardHeader className="p-3 pb-2 border-b">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-foreground">Novos Leads</span>
                  <Badge variant="secondary" className="h-5 text-[10px]">{leadsNew.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-2 space-y-2">
                {leadsNew.map((l: any) => (
                  <LeadCard
                    key={l.id}
                    lead={l}
                    onStatusChange={handleStatusChange}
                    onPromote={handlePromote}
                  />
                ))}
                {leadsNew.length === 0 && (
                  <div className="p-6 text-center text-[10px] text-muted-foreground border border-dashed rounded-lg bg-card/50">
                    Nenhum lead novo.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Column 2: Contacted */}
            <Card className="bg-muted/30 border border-muted-foreground/15">
              <CardHeader className="p-3 pb-2 border-b">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-amber-600">Em Contato</span>
                  <Badge variant="warning" className="h-5 text-[10px] bg-amber-100 text-amber-800">{leadsContacted.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-2 space-y-2">
                {leadsContacted.map((l: any) => (
                  <LeadCard
                    key={l.id}
                    lead={l}
                    onStatusChange={handleStatusChange}
                    onPromote={handlePromote}
                  />
                ))}
                {leadsContacted.length === 0 && (
                  <div className="p-6 text-center text-[10px] text-muted-foreground border border-dashed rounded-lg bg-card/50">
                    Nenhum em contato.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Column 3: Converted */}
            <Card className="bg-muted/30 border border-muted-foreground/15">
              <CardHeader className="p-3 pb-2 border-b">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-emerald-600">Convertidos</span>
                  <Badge className="h-5 text-[10px] bg-emerald-100 text-emerald-800">{leadsConverted.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-2 space-y-2">
                {leadsConverted.map((l: any) => (
                  <LeadCard
                    key={l.id}
                    lead={l}
                    onStatusChange={handleStatusChange}
                    onPromote={handlePromote}
                  />
                ))}
                {leadsConverted.length === 0 && (
                  <div className="p-6 text-center text-[10px] text-muted-foreground border border-dashed rounded-lg bg-card/50">
                    Nenhum convertido.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Column 4: Lost */}
            <Card className="bg-muted/30 border border-muted-foreground/15">
              <CardHeader className="p-3 pb-2 border-b">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-muted-foreground">Arquivados</span>
                  <Badge variant="outline" className="h-5 text-[10px]">{leadsLost.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-2 space-y-2">
                {leadsLost.map((l: any) => (
                  <LeadCard
                    key={l.id}
                    lead={l}
                    onStatusChange={handleStatusChange}
                    onPromote={handlePromote}
                  />
                ))}
                {leadsLost.length === 0 && (
                  <div className="p-6 text-center text-[10px] text-muted-foreground border border-dashed rounded-lg bg-card/50">
                    Nenhum arquivado.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Message Logs */}
        <TabsContent value="messages" className="space-y-4">
          <div className="rounded-xl border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Remetente</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-semibold text-sm">
                      <div>
                        <p>{l.full_name}</p>
                        <p className="text-[10px] text-muted-foreground">{l.email}</p>
                        {l.phone && <p className="text-[10px] text-muted-foreground">{l.phone}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs leading-relaxed max-w-md whitespace-pre-wrap py-3">
                      {l.message || <span className="text-muted-foreground italic">Sem mensagem</span>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(l.created_at).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          l.status === "new"
                            ? "default"
                            : l.status === "contacted"
                              ? "warning"
                              : l.status === "converted"
                                ? "success"
                                : "outline"
                        }
                        className="text-[10px] capitalize"
                      >
                        {l.status === "new"
                          ? "Novo"
                          : l.status === "contacted"
                            ? "Em Contato"
                            : l.status === "converted"
                              ? "Convertido"
                              : "Perdido"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {leads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-xs text-muted-foreground">
                      Nenhuma mensagem registrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface LeadCardProps {
  lead: any;
  onStatusChange: (leadId: string, status: any) => void;
  onPromote: (leadId: string) => void;
}

function LeadCard({ lead, onStatusChange, onPromote }: LeadCardProps) {
  return (
    <Card className="shadow-xs border border-border/80 bg-card hover:shadow-sm transition-all p-3 space-y-3 relative group">
      <div className="space-y-1">
        <h4 className="text-xs font-black tracking-tight text-foreground truncate">{lead.full_name}</h4>
        <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 truncate">
          <Mail className="size-3 text-muted-foreground/75" />
          {lead.email}
        </p>
        {lead.phone && (
          <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 truncate">
            <Phone className="size-3 text-muted-foreground/75" />
            {lead.phone}
          </p>
        )}
      </div>

      {lead.message && (
        <div className="p-2 bg-muted/40 rounded-lg border border-border/50 text-[10px] text-muted-foreground leading-relaxed line-clamp-3">
          {lead.message}
        </div>
      )}

      <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-border/40">
        {/* Stage controls */}
        <div className="flex items-center gap-0.5">
          {lead.status !== "new" && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6 text-muted-foreground hover:text-foreground"
              onClick={() => {
                const prevStatus = lead.status === "contacted" ? "new" : lead.status === "converted" ? "contacted" : "contacted";
                onStatusChange(lead.id, prevStatus);
              }}
              title="Voltar Coluna"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
          )}
          {lead.status !== "lost" && lead.status !== "converted" && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6 text-muted-foreground hover:text-foreground"
              onClick={() => {
                const nextStatus = lead.status === "new" ? "contacted" : "converted";
                onStatusChange(lead.id, nextStatus);
              }}
              title="Avançar Coluna"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          )}
        </div>

        {/* Promotion Action */}
        <div className="flex items-center gap-1">
          {lead.status !== "converted" && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => onStatusChange(lead.id, "lost")}
                title="Arquivar Lead"
              >
                <Archive className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-primary hover:bg-primary/10"
                onClick={() => onPromote(lead.id)}
                title="Promover a Cliente"
              >
                <UserCheck className="size-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
