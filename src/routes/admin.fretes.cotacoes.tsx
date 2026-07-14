import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Package } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/state/states";
import { listShippingZones, calculateShipping } from "@/services/shipping.functions";
import { formatMoney } from "@/lib/money";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/fretes/cotacoes")({
  head: () => ({ meta: [{ title: "Cotações de Frete — Hr Shoes" }] }),
  loader: async () => {
    const res = await listShippingZones();
    if (res.status === "error") throw new Error(res.message);
    return res.status === "ok" ? res.data : [];
  },
  component: FretesCotatoesPage,
});

function FretesCotatoesPage() {
  const zones = Route.useLoaderData() as any[];
  const [zipcode, setZipcode] = useState("");
  const [results, setResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (zipcode.replace(/\D/g, "").length < 8) {
      toast.error("Informe um CEP de 8 dígitos");
      return;
    }
    setLoading(true);
    try {
      const res = await calculateShipping({ data: { zipcode } });
      if (res.status === "error") throw new Error(res.message);
      setResults(res.data || []);
    } catch (e: any) {
      toast.error(e.message || "Erro ao calcular");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Simulador de Cotações"
        description="Teste o cálculo de frete para um CEP usando as zonas configuradas."
      />

      <div className="rounded-lg border bg-card p-6">
        <h3 className="font-semibold mb-4">Simular Frete por CEP</h3>
        <form onSubmit={handleSimulate} className="flex gap-3 max-w-sm">
          <Input
            placeholder="00000-000"
            value={zipcode}
            onChange={(e) => setZipcode(e.target.value)}
            maxLength={9}
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Calculando..." : "Simular"}
          </Button>
        </form>

        {results !== null && (
          <div className="mt-6">
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma opção de frete encontrada para o CEP informado. Verifique as zonas
                configuradas.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  {results.length} opção(ões) disponível(is) para {zipcode}:
                </p>
                {results.map((r: any) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-md border px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{r.name}</p>
                        {r.estimated_days && (
                          <p className="text-xs text-muted-foreground">
                            Prazo estimado: {r.estimated_days} dias
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {r.price_cents === 0 ? (
                        <Badge variant="secondary">Grátis</Badge>
                      ) : (
                        <p className="font-semibold">{formatMoney(r.price_cents)}</p>
                      )}
                      {r.min_order_cents && (
                        <p className="text-xs text-muted-foreground">
                          Mín: {formatMoney(r.min_order_cents)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h3 className="font-semibold mb-4">Zonas Ativas ({zones.length})</h3>
        {zones.length === 0 ? (
          <EmptyState
            title="Nenhuma zona configurada"
            description='Crie zonas de frete em "Tabelas" para que os cálculos funcionem.'
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {zones.map((z: any) => (
              <div
                key={z.id}
                className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm"
              >
                <span className="font-medium">{z.name}</span>
                <span className="text-muted-foreground">({(z.regions || []).join(", ")})</span>
                <Badge variant={z.is_active ? "secondary" : "outline"} className="text-xs">
                  {z.rates?.length || 0} taxa(s)
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
