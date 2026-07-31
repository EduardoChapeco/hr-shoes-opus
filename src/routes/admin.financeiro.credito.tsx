import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/commerce/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/money";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { getCustomerCreditLimit, updateCreditLimit } from "@/services/credit.functions";
import { Search } from "lucide-react";
import { getServerClient } from "@/lib/supabase"; // Note: For a real enterprise app, customer search should be a server function.

export const Route = createFileRoute("/admin/financeiro/credito")({
  head: () => ({ meta: [{ title: "Gestão de Risco e Crediário — Admin" }] }),
  component: CreditRiskPage,
});

function CreditRiskPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string } | null>(null);
  const [creditData, setCreditData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [newLimitStr, setNewLimitStr] = useState("");

  // This is a quick mock for searching customers. In a real scenario, this hits a dedicated server function `searchCustomers`.
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.length < 3) {
      toast.error("Digite ao menos 3 caracteres para buscar.");
      return;
    }
    // Fake selection for demo purposes. 
    // Usually, you'd list results and let the admin click one.
    // Assuming we found a customer for this prototype:
    toast.info("Busca simplificada para o protótipo. Digite o ID do cliente se souber.");
  };

  const loadCredit = async (customerId: string) => {
    setLoading(true);
    try {
      const data = await getCustomerCreditLimit({ data: { customerId } });
      setCreditData(data);
      setNewLimitStr((data.approved_limit_cents / 100).toFixed(2));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLimit = async () => {
    if (!selectedCustomer) return;
    const val = parseFloat(newLimitStr.replace(",", "."));
    if (isNaN(val) || val < 0) return;

    setLoading(true);
    try {
      await updateCreditLimit({
        data: {
          customerId: selectedCustomer.id,
          limitCents: Math.round(val * 100),
          isBlocked: creditData?.is_blocked
        }
      });
      toast.success("Limite atualizado com sucesso!");
      loadCredit(selectedCustomer.id);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (checked: boolean) => {
    if (!selectedCustomer || !creditData) return;
    setLoading(true);
    try {
      await updateCreditLimit({
        data: {
          customerId: selectedCustomer.id,
          limitCents: creditData.approved_limit_cents,
          isBlocked: checked
        }
      });
      toast.success(checked ? "Cliente bloqueado para carnês." : "Cliente desbloqueado.");
      loadCredit(selectedCustomer.id);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Crediário (Carnê)"
        description="Analise o risco, aprove limites de crédito e bloqueie inadimplentes."
      />

      <div className="bg-card p-4 rounded-lg border max-w-2xl space-y-4">
        <h3 className="font-medium text-sm">Buscar Cliente para Análise</h3>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input 
            placeholder="Nome, CPF ou ID do cliente..." 
            value={searchTerm} 
            onChange={(e) => {
              setSearchTerm(e.target.value);
              // For prototyping: If they paste a UUID, auto-select
              if (e.target.value.length === 36) {
                setSelectedCustomer({ id: e.target.value, name: "Cliente Selecionado" });
                loadCredit(e.target.value);
              }
            }}
          />
          <Button type="submit" variant="secondary"><Search className="h-4 w-4 mr-2" /> Buscar</Button>
        </form>
      </div>

      {selectedCustomer && creditData && (
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
          <div className="bg-card border rounded-lg p-5 space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{selectedCustomer.name}</h3>
                <p className="text-xs text-muted-foreground font-mono mt-1">ID: {selectedCustomer.id}</p>
              </div>
              <Badge variant={creditData.is_blocked ? "destructive" : "secondary"}>
                {creditData.is_blocked ? "Bloqueado" : "Ativo"}
              </Badge>
            </div>

            <div className="pt-4 border-t space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Bloquear Carnê (Inadimplência)?</label>
                <Switch 
                  checked={creditData.is_blocked} 
                  onCheckedChange={handleToggleBlock}
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Limite Aprovado (R$)</label>
                <div className="flex gap-2">
                  <Input 
                    type="number"
                    value={newLimitStr}
                    onChange={(e) => setNewLimitStr(e.target.value)}
                    disabled={loading}
                  />
                  <Button onClick={handleUpdateLimit} disabled={loading}>Salvar</Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-card border rounded-lg p-5 flex flex-col justify-center items-center h-full">
              <p className="text-sm text-muted-foreground mb-2">Crédito Utilizado</p>
              <p className="text-3xl font-bold text-foreground">
                {formatMoney(creditData.used_credit_cents)}
              </p>
              <div className="w-full bg-muted rounded-full h-2 mt-4 overflow-hidden">
                <div 
                  className={`h-full ${creditData.used_credit_cents > creditData.approved_limit_cents ? 'bg-red-500' : 'bg-primary'}`} 
                  style={{ width: `${Math.min((creditData.used_credit_cents / (creditData.approved_limit_cents || 1)) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                de {formatMoney(creditData.approved_limit_cents)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
