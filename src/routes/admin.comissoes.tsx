import { createFileRoute, useRouter } from "@tanstack/react-router";
import { DollarSign, CheckCircle, Users, Percent, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/state/states";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { listCommissions, payCommission, listSellers, updateSellerCommissionRate } from "@/services/commission.functions";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/admin/comissoes")({
  head: () => ({ meta: [{ title: "Comissões — Hr Shoes" }] }),
  loader: async () => {
    const [commissions, sellers] = await Promise.all([
      listCommissions(),
      listSellers(),
    ]);
    return { commissions, sellers };
  },
  component: CommissionsPage,
});

function CommissionsPage() {
  const { commissions, sellers } = Route.useLoaderData();
  const router = useRouter();

  const [editingSellerId, setEditingSellerId] = useState<string | null>(null);
  const [editingRate, setEditingRate] = useState<string>("");

  const handlePay = async (id: string) => {
    try {
      await payCommission({ data: { commissionId: id } });
      toast.success("Comissão marcada como paga.");
      router.invalidate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao pagar comissão");
    }
  };

  const handleSaveRate = async (sellerId: string) => {
    try {
      const rate = parseFloat(editingRate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        toast.error("Taxa inválida. Use um valor entre 0 e 100.");
        return;
      }
      await updateSellerCommissionRate({ data: { sellerId, rate } });
      toast.success("Taxa de comissão atualizada com sucesso!");
      setEditingSellerId(null);
      router.invalidate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao atualizar taxa");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comissões de Vendas"
        description="Gestão de pagamento de comissões e regras da equipe de vendas."
      />

      <Tabs defaultValue="extrato" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="extrato" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Extrato de Comissões
          </TabsTrigger>
          <TabsTrigger value="equipe" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Equipe e Regras
          </TabsTrigger>
        </TabsList>

        <TabsContent value="extrato" className="mt-0">
          {commissions.length === 0 ? (
            <EmptyState title="Sem comissões" description="Nenhuma comissão registrada nesta loja." />
          ) : (
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor(a)</TableHead>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Valor do Pedido</TableHead>
                    <TableHead>Comissão (R$)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.sellerName}</TableCell>
                      <TableCell>#{c.orderToken}</TableCell>
                      <TableCell>{formatMoney(c.orderTotal)}</TableCell>
                      <TableCell className="font-bold text-primary">
                        {formatMoney(c.amountCents)}
                      </TableCell>
                      <TableCell>
                        {c.status === "paid" ? (
                          <Badge variant="success">Paga</Badge>
                        ) : c.status === "cancelled" ? (
                          <Badge variant="destructive">Cancelada</Badge>
                        ) : (
                          <Badge variant="secondary">Pendente</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {c.status === "pending" && (
                          <Button variant="outline" size="sm" onClick={() => handlePay(c.id)}>
                            <CheckCircle className="mr-2 h-3 w-3" />
                            Pagar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="equipe" className="mt-0">
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Taxa de Comissão (%)</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      Nenhum vendedor ou gerente encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  sellers.map((seller: any) => (
                    <TableRow key={seller.id}>
                      <TableCell className="font-medium">
                        <div>{seller.full_name || "Sem nome"}</div>
                        <div className="text-xs text-muted-foreground">{seller.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {seller.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {editingSellerId === seller.id ? (
                          <div className="flex items-center gap-2 max-w-[120px]">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={editingRate}
                              onChange={(e) => setEditingRate(e.target.value)}
                              autoFocus
                            />
                            <span className="text-muted-foreground">%</span>
                          </div>
                        ) : (
                          <div className="font-semibold text-lg flex items-center gap-1">
                            {seller.commission_rate ?? 5} <Percent className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingSellerId === seller.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setEditingSellerId(null)}>
                              Cancelar
                            </Button>
                            <Button size="sm" onClick={() => handleSaveRate(seller.id)}>
                              Salvar
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingRate((seller.commission_rate ?? 5).toString());
                              setEditingSellerId(seller.id);
                            }}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Ajustar Regra
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
