import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/commerce/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCustomerInstallments } from "@/services/credit.functions";
import { formatMoney } from "@/lib/money";
import { QrCode, AlertCircle, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/conta/carnes")({
  head: () => ({ meta: [{ title: "Meus Carnês — Hr Shoes" }] }),
  loader: async () => {
    return await getCustomerInstallments({});
  },
  component: CustomerInstallmentsPage,
});

function CustomerInstallmentsPage() {
  const installments = Route.useLoaderData();

  const handleCopyPix = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código PIX copiado com sucesso!");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meus Carnês"
        description="Acompanhe e pague suas faturas e parcelas do crediário próprio."
      />

      {installments.length === 0 ? (
        <EmptyState 
          title="Nenhum carnê ativo" 
          description="Você não possui compras parceladas no carnê da loja no momento." 
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {installments.map((inst: any) => {
            const isLate = inst.status === "late";
            const totalCents = inst.amount_cents + (inst.penalty_cents || 0);

            return (
              <div key={inst.id} className={`border rounded-lg p-5 bg-card relative overflow-hidden ${isLate ? 'border-red-200' : ''}`}>
                {isLate && (
                  <div className="absolute top-0 right-0 bg-red-100 text-red-800 text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> ATRASADO
                  </div>
                )}
                {inst.status === "paid" && (
                  <div className="absolute top-0 right-0 bg-green-100 text-green-800 text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> PAGO
                  </div>
                )}
                
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground font-mono">Pedido #{inst.order_id?.split("-")[0]}</p>
                  <h3 className="font-semibold text-lg mt-1">Parcela {inst.installment_number}</h3>
                  <p className={`text-sm mt-0.5 ${isLate ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                    Vencimento: {new Date(inst.due_date).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                <div className="bg-muted/30 rounded p-3 mb-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor Principal</span>
                    <span>{formatMoney(inst.amount_cents)}</span>
                  </div>
                  {inst.penalty_cents > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Multa / Juros</span>
                      <span>+{formatMoney(inst.penalty_cents)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold pt-2 border-t mt-1">
                    <span>Total a Pagar</span>
                    <span>{formatMoney(totalCents)}</span>
                  </div>
                </div>

                {inst.status !== "paid" ? (
                  <div className="space-y-2">
                    <Button 
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        if (inst.pix_code) handleCopyPix(inst.pix_code);
                        else toast.error("Código PIX não disponível. Contate a loja.");
                      }}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Pagar Fatura com PIX
                    </Button>
                    {isLate && (
                      <p className="text-[10px] text-center text-muted-foreground">
                        Ao pagar via PIX, a baixa é automática em até 10 minutos.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-center text-green-600 font-medium pt-2">
                    Fatura liquidada em {new Date(inst.paid_at).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
