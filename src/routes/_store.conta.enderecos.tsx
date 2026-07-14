import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { getCustomerAddresses, addCustomerAddress, deleteCustomerAddress, setDefaultAddress } from "@/services/customer.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/state/states";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_store/conta/enderecos")({
  head: () => ({ meta: [{ title: "Meus Endereços — Hr Shoes" }] }),
  loader: () => getCustomerAddresses(),
  component: AddressesPage,
});

function AddressesPage() {
  const addresses = Route.useLoaderData();
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    zipcode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      await addCustomerAddress({ data: formData });
      toast.success("Endereço adicionado com sucesso!");
      setIsAdding(false);
      setFormData({
        zipcode: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "",
      });
      router.invalidate();
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar endereço.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este endereço?")) return;
    try {
      await deleteCustomerAddress({ data: { id } });
      toast.success("Endereço excluído.");
      router.invalidate();
    } catch (e: any) {
      toast.error("Erro ao excluir.");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress({ data: { id } });
      toast.success("Endereço padrão atualizado.");
      router.invalidate();
    } catch (e: any) {
      toast.error("Erro ao atualizar.");
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-editorial text-2xl text-foreground">Endereços</h2>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)}>Novo Endereço</Button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-card p-6 rounded-xl border border-border mb-8 space-y-4">
          <h3 className="font-semibold text-lg mb-4">Adicionar Endereço</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-1">
              <label className="text-sm font-medium">CEP *</label>
              <Input required value={formData.zipcode} onChange={e => setFormData({ ...formData, zipcode: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Rua / Avenida *</label>
              <Input required value={formData.street} onChange={e => setFormData({ ...formData, street: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-1">
              <label className="text-sm font-medium">Número *</label>
              <Input required value={formData.number} onChange={e => setFormData({ ...formData, number: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Complemento</label>
              <Input value={formData.complement} onChange={e => setFormData({ ...formData, complement: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-1">
              <label className="text-sm font-medium">Bairro *</label>
              <Input required value={formData.neighborhood} onChange={e => setFormData({ ...formData, neighborhood: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-1">
              <label className="text-sm font-medium">Cidade *</label>
              <Input required value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-1">
              <label className="text-sm font-medium">Estado (UF) *</label>
              <Select value={formData.state} onValueChange={v => setFormData({ ...formData, state: v })}>
                <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>
                  {["SP","RJ","MG","RS","PR","SC","BA","DF","GO","PE","CE"].map(uf => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>Salvar Endereço</Button>
          </div>
        </form>
      )}

      {!isAdding && addresses.length === 0 ? (
        <EmptyState
          title="Nenhum endereço cadastrado"
          description="Você ainda não adicionou endereços de entrega."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr: any) => (
            <div key={addr.id} className="p-5 border border-border rounded-xl bg-card relative">
              {addr.is_default && (
                <span className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded">
                  Padrão
                </span>
              )}
              <div className="flex items-start gap-3">
                <MapPin className="text-muted-foreground mt-1 shrink-0 h-5 w-5" />
                <div>
                  <p className="font-medium text-foreground">
                    {addr.street}, {addr.number} {addr.complement && `- ${addr.complement}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {addr.neighborhood} — {addr.city} / {addr.state}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">CEP: {addr.zipcode}</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6 border-t pt-4">
                {!addr.is_default && (
                  <Button variant="ghost" size="sm" onClick={() => handleSetDefault(addr.id)}>
                    <Star className="h-4 w-4 mr-2" />
                    Tornar padrão
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(addr.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
