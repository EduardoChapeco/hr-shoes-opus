import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Check, X, FileText, ExternalLink, AlertTriangle } from "lucide-react";

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
import {
  listPendingManualPayments,
  approvePayment,
  rejectPayment,
} from "@/services/payment.functions";
import { formatMoney } from "@/lib/money";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/admin/comprovantes")({
  head: () => ({ meta: [{ title: "Comprovantes — Hr Shoes" }] }),
  loader: async () => {
    const res = await listPendingManualPayments();
    if (res.status === "error") throw new Error(res.message);
    return res.data;
  },
  component: ReceiptsPage,
});

function ReceiptsPage() {
  const receipts = Route.useLoaderData() || [];
  const router = useRouter();

  // Reject dialog state
  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const handleApprove = async (orderId: string) => {
    setApprovingId(orderId);
    try {
      const res = await approvePayment({ data: { orderId } });
      if (res.status === "success") {
        toast.success("Pagamento aprovado. O pedido entrará em separação!");
        router.invalidate();
      } else {
        toast.error((res as any).message || "Erro ao aprovar pagamento.");
      }
    } catch (e) {
      toast.error("Erro inesperado");
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    setIsRejecting(true);
    try {
      const orderId = rejectTarget.orders?.id || rejectTarget.order_id;
      const res = await rejectPayment({ data: { orderId, reason: rejectReason } });
      if (res.status === "success") {
        toast.success("Comprovante rejeitado. O cliente foi notificado do status.");
        router.invalidate();
        setRejectTarget(null);
        setRejectReason("");
      } else {
        toast.error((res as any).message || "Erro ao rejeitar comprovante.");
      }
    } catch (e) {
      toast.error("Erro inesperado");
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Vendas"
        title="Comprovantes Pendentes"
        description="Analise os comprovantes de pagamento enviados pelos clientes e confirme ou rejeite."
      />

      {receipts.length === 0 ? (
        <EmptyState
          title="Nenhum comprovante pendente"
          description="Quando clientes enviarem comprovantes de pagamento, eles aparecerão aqui para revisão."
        />
      ) : (
        <div className="rounded-xl border border-border shadow-xs bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Comprovante</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.map((r: any) => {
                const order = r.orders || {};
                const orderId = order.id || r.order_id;
                const customerName = order.customer_snapshot?.name || "Desconhecido";
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      <Link
                        to="/admin/pedidos/$id"
                        params={{ id: orderId }}
                        className="flex items-center gap-1.5 hover:underline text-primary font-mono text-sm"
                      >
                        <FileText className="h-3.5 w-3.5" />#
                        {order.public_token || orderId.split("-")[0]}
                      </Link>
                    </TableCell>
                    <TableCell>{customerName}</TableCell>
                    <TableCell>{new Date(r.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="font-semibold">{formatMoney(r.amount_cents)}</TableCell>
                    <TableCell>
                      {r.receipt_url ? (
                        <a
                          href={r.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          Ver comprovante <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <Badge variant="secondary">Aguardando envio</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-success border-success/30 hover:bg-success/10 hover:text-success hover:border-success/50"
                          disabled={approvingId === orderId}
                          onClick={() => handleApprove(orderId)}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          {approvingId === orderId ? "Aprovando..." : "Aprovar"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                          onClick={() => setRejectTarget(r)}
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(v) => !v && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              Rejeitar Comprovante
            </DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição. O pedido voltará para "Aguardando Pagamento" e o cliente
              poderá enviar um novo comprovante.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="reject-reason">Motivo da Rejeição</Label>
            <Input
              id="reject-reason"
              placeholder="Ex: Imagem ilegível, valor incorreto, comprovante expirado..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" disabled={isRejecting} onClick={handleRejectConfirm}>
              {isRejecting ? "Rejeitando..." : "Confirmar Rejeição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
