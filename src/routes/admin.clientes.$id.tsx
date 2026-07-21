import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { 
  User, 
  ChevronLeft, 
  Save, 
  MapPin, 
  Trash2, 
  Plus, 
  Check, 
  ShieldCheck, 
  FileText, 
  Mail, 
  Phone,
  Settings,
  Sparkles,
  Search,
  AlertTriangle
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  getCustomer360, 
  updateCustomerCrm,
  upsertCustomerAddress,
  deleteCustomerAddress
} from "@/services/crm.functions";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/admin/clientes/$id")({
  head: () => ({ meta: [{ title: "Detalhes do Cliente — Hr Shoes" }] }),
  loader: async ({ params }) => {
    return await getCustomer360({ data: { customerId: params.id } });
  },
  component: CustomerDetailPage,
});

const CrmSchema = z.object({
  notes: z.string().nullable(),
  tags: z.string(), // We'll parse this into an array
});

function CustomerDetailPage() {
  const data = Route.useLoaderData();
  const { id } = Route.useParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Address Dialog states
  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [addressForm, setAddressForm] = useState({
    zipcode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    is_default: false,
  });
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const form = useForm({
    resolver: zodResolver(CrmSchema),
    defaultValues: {
      notes: data.crm.notes || "",
      tags: data.crm.tags ? data.crm.tags.join(", ") : "",
    },
  });

  const onSubmit = async (formData: z.infer<typeof CrmSchema>) => {
    setIsSubmitting(true);
    try {
      const tagsArray = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await updateCustomerCrm({
        data: {
          customerId: id,
          notes: formData.notes || null,
          tags: tagsArray,
        },
      });
      toast.success("Ficha do cliente atualizada.");
      router.invalidate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCepLookup = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;
    setIsSearchingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const resData = await res.json();
      if (!resData.erro) {
        setAddressForm((prev) => ({
          ...prev,
          zipcode: cep,
          street: resData.logradouro || "",
          neighborhood: resData.bairro || "",
          city: resData.localidade || "",
          state: resData.uf || "",
        }));
        toast.success("Endereço preenchido automaticamente via CEP!");
      } else {
        toast.error("CEP não encontrado");
      }
    } catch {
      toast.error("Erro ao buscar CEP");
    } finally {
      setIsSearchingCep(false);
    }
  };

  const handleOpenNewAddress = () => {
    setEditingAddress(null);
    setAddressForm({
      zipcode: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      is_default: data.addresses.length === 0,
    });
    setIsAddressOpen(true);
  };

  const handleOpenEditAddress = (addr: any) => {
    setEditingAddress(addr);
    setAddressForm({
      zipcode: addr.zipcode,
      street: addr.street,
      number: addr.number,
      complement: addr.complement || "",
      neighborhood: addr.neighborhood,
      city: addr.city,
      state: addr.state,
      is_default: addr.is_default,
    });
    setIsAddressOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.zipcode || !addressForm.street || !addressForm.number || !addressForm.neighborhood || !addressForm.city || !addressForm.state) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setIsSavingAddress(true);
    try {
      const res = await upsertCustomerAddress({
        data: {
          id: editingAddress?.id,
          customer_id: id,
          zipcode: addressForm.zipcode,
          street: addressForm.street,
          number: addressForm.number,
          complement: addressForm.complement || null,
          neighborhood: addressForm.neighborhood,
          city: addressForm.city,
          state: addressForm.state,
          is_default: addressForm.is_default,
        },
      });

      if (res.status === "success") {
        toast.success(editingAddress ? "Endereço atualizado!" : "Endereço cadastrado!");
        setIsAddressOpen(false);
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao salvar endereço");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro inesperado");
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm("Tem certeza que deseja remover este endereço permanentemente?")) return;
    try {
      const res = await deleteCustomerAddress({
        data: {
          addressId,
          customerId: id,
        },
      });
      if (res.status === "success") {
        toast.success("Endereço removido");
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao remover endereço");
      }
    } catch {
      toast.error("Erro inesperado");
    }
  };

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="flex items-center text-sm text-muted-foreground">
        <Link to="/admin/clientes" className="hover:text-foreground flex items-center">
          <ChevronLeft className="mr-1 size-4" />
          Voltar para Clientes
        </Link>
      </nav>

      {/* Identidade Resumida */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-card border border-border rounded-xl shadow-xs">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <User className="size-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              {data.profile.name}
              {data.profile.isConsentLgpd && (
                <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-600 bg-emerald-50/50 hover:bg-emerald-50/50 h-5 px-1.5">
                  LGPD Consentido
                </Badge>
              )}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><FileText className="size-3.5" /> {data.profile.taxId || "CPF/CNPJ não informado"}</span>
              <span>•</span>
              <span>Cadastro em {new Date(data.profile.joinedAt).toLocaleDateString("pt-BR")}</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="crm" className="w-full">
        <TabsList className="grid grid-cols-3 max-w-md mb-6 h-9">
          <TabsTrigger value="crm" className="text-xs">Ficha CRM</TabsTrigger>
          <TabsTrigger value="enderecos" className="text-xs">Endereços ({data.addresses.length})</TabsTrigger>
          <TabsTrigger value="pedidos" className="text-xs">Pedidos ({data.orders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="crm" className="space-y-4">
          <div className="max-w-2xl rounded-xl border border-border bg-card p-6 shadow-xs">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tags (separadas por vírgula)</FormLabel>
                      <FormControl>
                        <Input placeholder="vip, atacado, revenda..." {...field} className="h-10 bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Anotações Internas do CRM</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Preferências de marcas, cores, tamanho do calçado, histórico de conversas..."
                          className="min-h-[140px] bg-background"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSubmitting} className="font-bold">
                  <Save className="mr-2 size-4" />
                  {isSubmitting ? "Salvando..." : "Salvar Ficha"}
                </Button>
              </form>
            </Form>
          </div>
        </TabsContent>

        <TabsContent value="enderecos" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Endereços Cadastrados</h3>
              <p className="text-xs text-muted-foreground">Gerencie múltiplos endereços de envio do cliente.</p>
            </div>
            <Button onClick={handleOpenNewAddress} size="sm" className="font-bold flex items-center gap-1 text-xs">
              <Plus className="size-4" /> Novo Endereço
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.addresses.map((addr: any) => (
              <Card key={addr.id} className={`relative overflow-hidden border shadow-xs ${addr.is_default ? "border-primary bg-primary/5" : "bg-card border-border"}`}>
                {addr.is_default && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-primary font-bold">
                    <Check className="size-3.5" /> Padrão
                  </div>
                )}
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3.5 text-primary" />
                    <span>CEP {addr.zipcode}</span>
                  </div>
                  <CardTitle className="text-sm font-bold mt-1 text-foreground">
                    {addr.street}, nº {addr.number}
                  </CardTitle>
                  {addr.complement && (
                    <CardDescription className="text-xs text-muted-foreground font-mono">
                      {addr.complement}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-4 pt-0 text-xs space-y-3">
                  <p className="text-muted-foreground">
                    {addr.neighborhood} — {addr.city}/{addr.state}
                  </p>
                  
                  <div className="flex items-center justify-between border-t pt-3">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-foreground"
                        onClick={() => handleOpenEditAddress(addr)}
                      >
                        <Settings className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteAddress(addr.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>

                    {!addr.is_default && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="text-[11px] h-7 px-2 font-bold"
                        onClick={async () => {
                          try {
                            const res = await upsertCustomerAddress({
                              data: {
                                ...addr,
                                is_default: true
                              }
                            });
                            if (res.status === "success") {
                              toast.success("Endereço padrão atualizado!");
                              router.invalidate();
                            }
                          } catch {
                            toast.error("Falha ao salvar padrão");
                          }
                        }}
                      >
                        Definir como padrão
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {data.addresses.length === 0 && (
              <div className="col-span-full border border-dashed border-border rounded-xl p-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                <AlertTriangle className="size-5 text-amber-500" />
                Nenhum endereço de entrega cadastrado para este cliente.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pedidos">
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            {data.orders.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs">
                Este cliente ainda não fez nenhum pedido no e-commerce ou balcão.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {data.orders.map((o: any) => (
                  <div key={o.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div>
                      <div className="font-semibold text-foreground text-sm">Pedido #{o.public_token}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-foreground text-sm">{formatMoney(o.total_cents)}</div>
                      <Badge variant="secondary" className="mt-1 text-[9px] h-5">
                        {o.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Address Form Dialog Modal */}
      <Dialog open={isAddressOpen} onOpenChange={setIsAddressOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="size-5 text-primary" />
              {editingAddress ? "Editar Endereço" : "Cadastrar Novo Endereço"}
            </DialogTitle>
            <DialogDescription>
              Preencha os detalhes logísticos para entrega de pedidos.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveAddress} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="addr-zip">CEP *</Label>
                <div className="relative">
                  <Input
                    id="addr-zip"
                    required
                    maxLength={9}
                    placeholder="00000-000"
                    value={addressForm.zipcode}
                    onChange={(e) => {
                      const value = e.target.value;
                      setAddressForm({ ...addressForm, zipcode: value });
                      if (value.replace(/\D/g, "").length === 8) {
                        handleCepLookup(value);
                      }
                    }}
                  />
                  {isSearchingCep && (
                    <span className="absolute right-3 top-3 text-[10px] text-muted-foreground animate-pulse">
                      Buscando...
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="addr-num">Número *</Label>
                <Input
                  id="addr-num"
                  required
                  placeholder="Ex: 123"
                  value={addressForm.number}
                  onChange={(e) => setAddressForm({ ...addressForm, number: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="addr-street">Logradouro / Rua *</Label>
              <Input
                id="addr-street"
                required
                placeholder="Rua, Avenida..."
                value={addressForm.street}
                onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addr-comp">Complemento (Opcional)</Label>
              <Input
                id="addr-comp"
                placeholder="Ex: Apto 402, Bloco B"
                value={addressForm.complement}
                onChange={(e) => setAddressForm({ ...addressForm, complement: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="addr-neigh">Bairro *</Label>
                <Input
                  id="addr-neigh"
                  required
                  placeholder="Bairro"
                  value={addressForm.neighborhood}
                  onChange={(e) => setAddressForm({ ...addressForm, neighborhood: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="addr-city">Cidade *</Label>
                  <Input
                    id="addr-city"
                    required
                    placeholder="Cidade"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addr-state">UF *</Label>
                  <Input
                    id="addr-state"
                    required
                    maxLength={2}
                    placeholder="SP"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-dashed">
              <Checkbox
                id="addr-default"
                checked={addressForm.is_default}
                onCheckedChange={(checked) => setAddressForm({ ...addressForm, is_default: !!checked })}
              />
              <Label htmlFor="addr-default" className="text-xs text-muted-foreground cursor-pointer">
                Definir como endereço padrão de envio.
              </Label>
            </div>

            <DialogFooter className="pt-4 mt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddressOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSavingAddress} className="font-bold">
                {isSavingAddress ? "Salvando..." : "Salvar Endereço"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
