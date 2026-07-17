import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Truck,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  Search,
  Calculator,
  FileText,
  BadgePercent,
  Layers,
} from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/state/states";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  listShippingZones,
  upsertShippingZone,
  deleteShippingZone,
  calculateShipping,
} from "@/services/shipping.functions";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/admin/fretes/")({
  head: () => ({ meta: [{ title: "Gestão de Fretes & Entregas — Hr Shoes" }] }),
  loader: async () => {
    const res = await listShippingZones();
    if (res.status === "error") throw new Error(res.message);
    if (res.status === "unconfigured") return [];
    return res.data || [];
  },
  component: ShippingHubPage,
});

function ShippingHubPage() {
  const zones = Route.useLoaderData() as any[];
  const router = useRouter();

  const [openZone, setOpenZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneRegions, setNewZoneRegions] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Fast Simulator state
  const [simZipcode, setSimZipcode] = useState("");
  const [simResults, setSimResults] = useState<any[] | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Computed Metrics
  const activeZonesCount = useMemo(() => zones.filter((z) => z.is_active).length, [zones]);
  const totalRatesCount = useMemo(
    () => zones.reduce((acc, z) => acc + (z.shipping_rates?.length || 0), 0),
    [zones],
  );

  // Create Shipping Zone
  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;

    setIsSaving(true);
    try {
      const regionsArray = newZoneRegions
        ? newZoneRegions.split(",").map((r) => r.trim()).filter(Boolean)
        : ["*"];

      const res = await upsertShippingZone({
        data: {
          name: newZoneName,
          regions: regionsArray,
          is_active: true,
        },
      });

      if (res.status === "error") throw new Error(res.message);
      toast.success("Zona de entrega criada com sucesso!");
      setOpenZone(false);
      setNewZoneName("");
      setNewZoneRegions("");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar zona de entrega.");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Zone Active
  const handleToggleZone = async (zone: any, active: boolean) => {
    try {
      const res = await upsertShippingZone({
        data: { id: zone.id, name: zone.name, regions: zone.regions, is_active: active },
      });
      if (res.status === "error") throw new Error(res.message);
      toast.success(`Zona ${active ? "ativada" : "desativada"}.`);
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar status.");
    }
  };

  // Delete Zone
  const handleDeleteZone = async (zoneId: string) => {
    if (!confirm("Deseja realmente excluir esta zona de entrega e suas taxas?")) return;
    try {
      const res = await deleteShippingZone({ data: { id: zoneId } });
      if (res.status === "error") throw new Error(res.message);
      toast.success("Zona de entrega removida.");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir zona.");
    }
  };

  // Fast Zipcode Simulator
  const handleSimulateShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanZip = simZipcode.replace(/\D/g, "");
    if (cleanZip.length < 8) {
      toast.error("Informe um CEP válido de 8 dígitos.");
      return;
    }

    setIsSimulating(true);
    try {
      const res = await calculateShipping({ data: { zipcode: cleanZip } });
      if (res.status === "error") throw new Error(res.message);
      setSimResults(res.data || []);
    } catch (e: any) {
      toast.error(e.message || "Erro ao calcular frete para o CEP.");
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Logística Comercial"
        title="Gestão de Fretes & Entregas"
        description="Configure zonas de envio por CEP, frete fixo, frete grátis por valor mínimo e cotador dinâmico."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/fretes/tabelas">
                <Layers className="mr-1.5 size-4" /> Tabelas & Regras
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/fretes/cotacoes">
                <FileText className="mr-1.5 size-4" /> Cotações Pendentes
              </Link>
            </Button>
          </div>
        }
      />

      {/* Grid de Métricas de Frete */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Zonas de Entrega
            </span>
            <MapPin className="size-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{zones.length} cadastrada(s)</div>
            <p className="text-xs text-muted-foreground mt-1">{activeZonesCount} zonas ativas operando</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Regras & Taxas Fixas
            </span>
            <Truck className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{totalRatesCount} regra(s)</div>
            <p className="text-xs text-muted-foreground mt-1">Opções de envio ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Frete Grátis
            </span>
            <BadgePercent className="size-4 text-amber-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">Ativo por Regra</div>
            <p className="text-xs text-muted-foreground mt-1">Configurado por valor mínimo de pedido</p>
          </CardContent>
        </Card>
      </div>

      {/* Simulador Rápido de CEP */}
      <Card className="border-primary/20 bg-gradient-to-r from-card to-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="size-5 text-primary" />
            Simulador Rápido de CEP & Opções de Envio
          </CardTitle>
          <CardDescription>
            Digite um CEP de destino para simular quais regras de frete serão apresentadas ao cliente no checkout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSimulateShipping} className="flex gap-2 max-w-md">
            <Input
              placeholder="Digite o CEP (ex: 89900-000)"
              value={simZipcode}
              onChange={(e) => setSimZipcode(e.target.value)}
            />
            <Button type="submit" disabled={isSimulating} size="sm" className="font-bold">
              {isSimulating ? "Calculando..." : "Simular CEP"}
            </Button>
          </form>

          {simResults && (
            <div className="pt-2 border-t space-y-2">
              <span className="text-xs font-bold text-foreground">
                Resultados para o CEP {simZipcode}:
              </span>
              {simResults.length === 0 ? (
                <p className="text-xs text-amber-600 bg-amber-500/10 p-2 rounded-md border border-amber-500/20">
                  Nenhuma regra de frete atende a esta região. O cliente precisará solicitar cotação manual.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {simResults.map((rate, idx) => (
                    <div key={idx} className="p-3 rounded-lg border bg-card text-xs space-y-1">
                      <div className="flex justify-between font-bold text-foreground">
                        <span>{rate.name}</span>
                        <span>{rate.price_cents === 0 ? "GRÁTIS" : formatMoney(rate.price_cents)}</span>
                      </div>
                      <p className="text-muted-foreground">Prazo estimado: {rate.estimated_days} dia(s) útil(eis)</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Zonas de Entrega Principais */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Zonas de Entrega Ativas</CardTitle>
            <CardDescription>Regiões geográficas e suas taxas de envio associadas.</CardDescription>
          </div>
          <Dialog open={openZone} onOpenChange={setOpenZone}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1.5 size-4" /> Nova Zona
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Zona de Entrega</DialogTitle>
                <DialogDescription>Defina um nome e prefixos de CEP para a região.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateZone} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="z-name">Nome da Zona *</Label>
                  <Input
                    id="z-name"
                    placeholder="Ex: Região Sul & Sudeste"
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="z-regions">Prefixos de CEP (Separados por vírgula)</Label>
                  <Input
                    id="z-regions"
                    placeholder="Ex: 89, 88, 90 (Deixe em branco para todas as regiões)"
                    value={newZoneRegions}
                    onChange={(e) => setNewZoneRegions(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Exemplo: 89 atenderá CEPs iniciando em 89000-000 até 89999-999.
                  </p>
                </div>

                <DialogFooter className="pt-4">
                  <Button type="button" variant="ghost" onClick={() => setOpenZone(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Criando..." : "Criar Zona"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {zones.length === 0 ? (
            <EmptyState
              title="Nenhuma zona de entrega cadastrada"
              description="Cadastre zonas de entrega para habilitar a opção de frete aos seus clientes no checkout."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {zones.map((zone) => (
                <div key={zone.id} className="p-4 rounded-xl border border-border bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{zone.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        Regiões: {zone.regions?.join(", ") || "Todas as regiões (*)"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={zone.is_active}
                        onCheckedChange={(active) => handleToggleZone(zone, active)}
                        aria-label={`Ativar ${zone.name}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteZone(zone.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="pt-2 border-t space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground">Taxas Ativas:</span>
                    {(!zone.shipping_rates || zone.shipping_rates.length === 0) ? (
                      <p className="text-xs text-amber-600">Nenhuma taxa de envio cadastrada nesta zona.</p>
                    ) : (
                      <div className="space-y-1">
                        {zone.shipping_rates.map((rate: any) => (
                          <div key={rate.id} className="flex justify-between items-center text-xs p-1.5 rounded bg-muted/40">
                            <span className="font-medium">{rate.name} ({rate.estimated_days}d)</span>
                            <span className="font-bold">
                              {rate.price_cents === 0 ? "Frete Grátis" : formatMoney(rate.price_cents)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
