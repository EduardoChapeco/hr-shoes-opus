import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/state/states";
import {
  listShippingZones,
  upsertShippingZone,
  deleteShippingZone,
  upsertShippingRate,
  deleteShippingRate,
} from "@/services/shipping.functions";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/admin/fretes/tabelas")({
  head: () => ({ meta: [{ title: "Tabelas de Frete — Hr Shoes" }] }),
  loader: async () => await listShippingZones() || [],
  component: FretesTabelasPage,
});

function FretesTabelasPage() {
  const zones = Route.useLoaderData() as any[];
  const router = useRouter();
  const [addZoneOpen, setAddZoneOpen] = useState(false);
  const [editZoneOpen, setEditZoneOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<any | null>(null);
  const [addRateOpen, setAddRateOpen] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [zoneForm, setZoneForm] = useState({ name: "", regions: "" });
  const [editZoneForm, setEditZoneForm] = useState({ id: "", name: "", regions: "" });
  const [rateForm, setRateForm] = useState({
    name: "",
    price: "",
    minOrderCents: "",
    estimatedDays: "",
  });

  const handleAddZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await upsertShippingZone({
        data: {
          name: zoneForm.name,
          regions: zoneForm.regions
            .split(",")
            .map((r) => r.trim())
            .filter(Boolean),
          is_active: true,
        },
      });
      
      toast.success("Zona adicionada!");
      setAddZoneOpen(false);
      setZoneForm({ name: "", regions: "" });
      router.invalidate();
    } catch (e: any) {
      let msg = e.message || "Erro ao criar zona";
      try {
        const parsed = JSON.parse(e.message);
        if (Array.isArray(parsed) && parsed[0]?.message) {
          msg = parsed.map((p: any) => p.message).join(", ");
        }
      } catch {}
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditZoneStart = (zone: any) => {
    setEditingZone(zone);
    setEditZoneForm({
      id: zone.id,
      name: zone.name,
      regions: (zone.regions || []).join(", "),
    });
    setEditZoneOpen(true);
  };

  const handleEditZoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await upsertShippingZone({
        data: {
          id: editZoneForm.id,
          name: editZoneForm.name,
          regions: editZoneForm.regions
            .split(",")
            .map((r) => r.trim())
            .filter(Boolean),
          is_active: true,
        },
      });
      
      toast.success("Zona atualizada!");
      setEditZoneOpen(false);
      router.invalidate();
    } catch (e: any) {
      let msg = e.message || "Erro ao atualizar zona";
      try {
        const parsed = JSON.parse(e.message);
        if (Array.isArray(parsed) && parsed[0]?.message) {
          msg = parsed.map((p: any) => p.message).join(", ");
        }
      } catch {}
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteZone = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta zona e todas as suas taxas?")) return;
    try {
      const res = await deleteShippingZone({ data: { id } });
      
      toast.success("Zona excluída!");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir");
    }
  };

  const handleAddRate = async (e: React.FormEvent, zoneId: string) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await upsertShippingRate({
        data: {
          zone_id: zoneId,
          name: rateForm.name,
          price_cents: Math.round(parseFloat(rateForm.price.replace(",", ".")) * 100),
          min_order_cents: rateForm.minOrderCents
            ? Math.round(parseFloat(rateForm.minOrderCents.replace(",", ".")) * 100)
            : null,
          estimated_days: rateForm.estimatedDays ? parseInt(rateForm.estimatedDays) : null,
          is_active: true,
        },
      });
      
      toast.success("Taxa adicionada!");
      setAddRateOpen(null);
      setRateForm({ name: "", price: "", minOrderCents: "", estimatedDays: "" });
      router.invalidate();
    } catch (e: any) {
      let msg = e.message || "Erro ao adicionar taxa";
      try {
        const parsed = JSON.parse(e.message);
        if (Array.isArray(parsed) && parsed[0]?.message) {
          msg = parsed.map((p: any) => p.message).join(", ");
        }
      } catch {}
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRate = async (id: string) => {
    try {
      const res = await deleteShippingRate({ data: { id } });
      
      toast.success("Taxa removida.");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao remover");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Tabelas de Frete"
          description="Configure zonas de frete e taxas por região."
        />
        <Dialog open={addZoneOpen} onOpenChange={setAddZoneOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Zona
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Zona de Frete</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddZone} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zone-name">Nome da Zona</Label>
                <Input
                  id="zone-name"
                  placeholder="Ex: Sul do Brasil"
                  value={zoneForm.name}
                  onChange={(e) => setZoneForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zone-regions">Prefixos de CEP (separados por vírgula)</Label>
                <Input
                  id="zone-regions"
                  placeholder="Ex: 80, 81, 82, 83 ou * para todo Brasil"
                  value={zoneForm.regions}
                  onChange={(e) => setZoneForm((f) => ({ ...f, regions: e.target.value }))}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Use * para cobrir todos os CEPs do Brasil.
                </p>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Salvando..." : "Criar Zona"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {zones.length === 0 ? (
        <EmptyState
          title="Nenhuma zona de frete"
          description="Crie a primeira zona de frete para começar a calcular fretes automaticamente."
        />
      ) : (
        <div className="space-y-6">
          {zones.map((zone: any) => (
            <div key={zone.id} className="rounded-lg border bg-card overflow-hidden">
              <div className="flex items-center justify-between bg-muted/30 px-5 py-3 border-b">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">{zone.name}</h3>
                  <div className="flex flex-wrap gap-1">
                    {(zone.regions || []).map((r: string) => (
                      <Badge key={r} variant="secondary" className="text-xs">
                        {r}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog open={editZoneOpen} onOpenChange={setEditZoneOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => handleEditZoneStart(zone)}>
                        <Edit className="mr-1 h-3.5 w-3.5" />
                        Editar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Zona de Frete</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleEditZoneSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-zone-name">Nome da Zona</Label>
                          <Input
                            id="edit-zone-name"
                            value={editZoneForm.name}
                            onChange={(e) =>
                              setEditZoneForm((f) => ({ ...f, name: e.target.value }))
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-zone-regions">
                            Prefixos de CEP (separados por vírgula)
                          </Label>
                          <Input
                            id="edit-zone-regions"
                            value={editZoneForm.regions}
                            onChange={(e) =>
                              setEditZoneForm((f) => ({ ...f, regions: e.target.value }))
                            }
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            Use * para cobrir todos os CEPs do Brasil.
                          </p>
                        </div>
                        <DialogFooter>
                          <Button type="submit" disabled={isSaving}>
                            {isSaving ? "Salvando..." : "Salvar Alterações"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteZone(zone.id)}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Excluir
                  </Button>

                  <Dialog
                    open={addRateOpen === zone.id}
                    onOpenChange={(v) => setAddRateOpen(v ? zone.id : null)}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        Adicionar Taxa
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nova Taxa — {zone.name}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={(e) => handleAddRate(e, zone.id)} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="rate-name">Nome</Label>
                          <Input
                            id="rate-name"
                            placeholder="Ex: PAC, SEDEX, Retirada"
                            value={rateForm.name}
                            onChange={(e) => setRateForm((f) => ({ ...f, name: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="rate-price">Valor (R$)</Label>
                            <Input
                              id="rate-price"
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0,00"
                              value={rateForm.price}
                              onChange={(e) =>
                                setRateForm((f) => ({ ...f, price: e.target.value }))
                              }
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="rate-days">Prazo (dias)</Label>
                            <Input
                              id="rate-days"
                              type="number"
                              min="1"
                              placeholder="7"
                              value={rateForm.estimatedDays}
                              onChange={(e) =>
                                setRateForm((f) => ({ ...f, estimatedDays: e.target.value }))
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="rate-minorder">
                            Pedido mínimo para frete grátis (R$)
                          </Label>
                          <Input
                            id="rate-minorder"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Deixe em branco para sem mínimo"
                            value={rateForm.minOrderCents}
                            onChange={(e) =>
                              setRateForm((f) => ({ ...f, minOrderCents: e.target.value }))
                            }
                          />
                        </div>
                        <DialogFooter>
                          <Button type="submit" disabled={isSaving}>
                            {isSaving ? "Salvando..." : "Adicionar Taxa"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {zone.rates && zone.rates.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Modalidade</TableHead>
                      <TableHead className="text-center">Prazo</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Pedido Mínimo</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {zone.rates.map((rate: any) => (
                      <TableRow key={rate.id}>
                        <TableCell className="font-medium">{rate.name}</TableCell>
                        <TableCell className="text-center">
                          {rate.estimated_days ? `${rate.estimated_days} dias` : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {rate.price_cents === 0 ? (
                            <Badge variant="secondary">Grátis</Badge>
                          ) : (
                            formatMoney(rate.price_cents)
                          )}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {rate.min_order_cents ? formatMoney(rate.min_order_cents) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteRate(rate.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Nenhuma taxa adicionada a esta zona.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
