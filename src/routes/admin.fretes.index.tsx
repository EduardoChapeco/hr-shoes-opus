import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Plus, Save, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  listShippingZones,
  upsertShippingZone,
  upsertShippingRate,
  deleteShippingRate,
} from "@/services/shipping.functions";
import { formatMoney } from "@/lib/money";
import { EmptyState } from "@/components/state/states";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/fretes/")({
  head: () => ({ meta: [{ title: "Fretes e Zonas — Hr Shoes" }] }),
  loader: async () => {
    const res = await listShippingZones();
    if (res.status === "error") throw new Error(res.message);
    return res.data;
  },
  component: ShippingPage,
});

function ShippingPage() {
  const zones = Route.useLoaderData() || [];
  const router = useRouter();

  const [openZone, setOpenZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName) return;

    setIsSaving(true);
    try {
      const res = await upsertShippingZone({
        data: {
          name: newZoneName,
          regions: ["*"], // default all
          is_active: true,
        },
      });
      if (res.status === "error") throw new Error(res.message);
      toast.success("Zona criada!");
      setOpenZone(false);
      setNewZoneName("");
      router.invalidate();
    } catch {
      toast.error("Erro ao criar zona.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleZone = async (zone: any, active: boolean) => {
    try {
      const res = await upsertShippingZone({
        data: { id: zone.id, name: zone.name, regions: zone.regions, is_active: active },
      });
      if (res.status === "error") throw new Error(res.message);
      router.invalidate();
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Zonas de Entrega"
        description="Configure áreas de entrega e valores de frete para sua loja."
        actions={
          <Dialog open={openZone} onOpenChange={setOpenZone}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Zona de Entrega
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Zona de Entrega</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateZone} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome da Zona</label>
                  <Input
                    placeholder="Ex: Região Sul e Sudeste"
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSaving}>
                  {isSaving ? "Criando..." : "Criar Zona"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {zones.length === 0 ? (
        <EmptyState
          title="Nenhuma zona configurada"
          description="Crie zonas de entrega para permitir que seus clientes finalizem compras."
        />
      ) : (
        <div className="grid gap-6">
          {zones.map((zone: any) => (
            <Card key={zone.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  {zone.name}
                </CardTitle>
                <Switch
                  checked={zone.is_active}
                  onCheckedChange={(c) => handleToggleZone(zone, c)}
                />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  Regiões:{" "}
                  {zone.regions.join(", ") === "*" ? "Todo o Brasil" : zone.regions.join(", ")}
                </div>

                <RatesTable
                  zoneId={zone.id}
                  rates={zone.rates || []}
                  onRefresh={router.invalidate}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function RatesTable({
  zoneId,
  rates,
  onRefresh,
}: {
  zoneId: string;
  rates: any[];
  onRefresh: () => void;
}) {
  const [openRate, setOpenRate] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleAddRate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await upsertShippingRate({
        data: {
          zone_id: zoneId,
          name,
          price_cents: Math.round(parseFloat(price) * 100),
          is_active: true,
        },
      });
      if (res.status === "error") throw new Error(res.message);
      setOpenRate(false);
      setName("");
      setPrice("");
      onRefresh();
    } catch {
      toast.error("Erro ao adicionar taxa");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteShippingRate({ data: { id } });
      if (res.status === "error") throw new Error(res.message);
      onRefresh();
    } catch {
      toast.error("Erro ao remover taxa");
    }
  };

  return (
    <div className="border rounded-md">
      <div className="p-3 border-b bg-muted/20 flex justify-between items-center">
        <h4 className="font-medium text-sm">Taxas de Frete</h4>
        <Dialog open={openRate} onOpenChange={setOpenRate}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Plus className="mr-2 h-3 w-3" /> Adicionar Taxa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Taxa de Frete</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddRate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome (Ex: PAC, Sedex, Fixo)</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSaving}>
                Salvar Taxa
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {rates.length === 0 ? (
        <div className="p-4 text-center text-sm text-muted-foreground">
          Nenhuma taxa configurada para esta zona.
        </div>
      ) : (
        <div className="p-0">
          {rates.map((rate) => (
            <div
              key={rate.id}
              className="flex items-center justify-between p-3 border-b last:border-0 hover:bg-muted/50"
            >
              <div>
                <div className="font-medium text-sm">{rate.name}</div>
                <div className="text-xs text-muted-foreground">
                  Preço: {formatMoney(rate.price_cents)}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => handleDelete(rate.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
