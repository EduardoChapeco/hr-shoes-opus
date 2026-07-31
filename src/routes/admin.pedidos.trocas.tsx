import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PackageOpen, AlertCircle, ArrowRight } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getStoreRmaRequests, updateRmaStatus } from "@/services/rma.functions";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

export const Route = createFileRoute("/admin/pedidos/trocas")({
  head: () => ({ meta: [{ title: "Trocas e Logística Reversa — Admin" }] }),
  loader: async () => {
    const data = await getStoreRmaRequests();
    return { requests: data || [] };
  },
  component: RmaAdminPage,
});

function RmaAdminPage() {
  const { requests } = Route.useLoaderData() as { requests: any[] };
  const router = Route.useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setLoadingId(id);
    try {
      await updateRmaStatus({ data: { rmaId: id, status: "authorized" } });
      toast.success("RMA Autorizado! A etiqueta pode ser gerada.");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setLoadingId(id);
    try {
      await updateRmaStatus({ data: { rmaId: id, status: "rejected" } });
      toast.success("RMA Recusado.");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoadingId(null);
    }
  };

  const columns = [
    { id: "pending", title: "Aguardando Análise" },
    { id: "authorized", title: "Aguardando Postagem" },
    { id: "shipped_back", title: "Em Trânsito Reverso" },
    { id: "received", title: "Em Inspeção" },
    { id: "resolved", title: "Resolvido" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Logística Reversa (RMA)"
        description="Gerencie as solicitações de troca, devolução e garantia da sua loja."
      >
        <Button variant="outline">Configurar Políticas de Troca</Button>
      </PageHeader>

      <div className="flex gap-6 overflow-x-auto pb-4">
        {columns.map((col) => (
          <div key={col.id} className="w-80 shrink-0 flex flex-col">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="font-semibold text-sm text-foreground">{col.title}</h3>
              <Badge variant="secondary" className="px-1.5 py-0">
                {requests.filter((r) => r.status === col.id).length}
              </Badge>
            </div>
            
            <ScrollArea className="flex-1 bg-muted/30 rounded-xl p-3 border border-border/50 h-[calc(100vh-220px)]">
              <div className="space-y-3">
                {requests
                  .filter((r) => r.status === col.id)
                  .map((r) => (
                    <Card key={r.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-semibold">RMA #{r.id.split("-")[0]}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {new Date(r.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {r.type === "return" ? "Devolução" : r.type === "exchange" ? "Troca" : "Garantia"}
                          </Badge>
                        </div>
                        
                        <div className="text-sm">
                          <p className="flex items-center gap-1.5 text-muted-foreground mb-1 text-[11px]">
                            <PackageOpen className="h-3.5 w-3.5" />
                            {r.rma_items?.length || 0} Itens
                          </p>
                          {r.type === "warranty" && (
                            <p className="flex items-center gap-1.5 text-orange-600 text-[11px] font-medium">
                              <AlertCircle className="h-3 w-3" />
                              Contém fotos de defeito
                            </p>
                          )}
                        </div>

                        {r.status === "pending" && (
                          <div className="flex items-center gap-2 pt-2 border-t">
                            <Button 
                              size="sm" 
                              className="flex-1 text-[11px] h-7"
                              onClick={() => handleApprove(r.id)}
                              disabled={loadingId === r.id}
                            >
                              Aprovar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              className="flex-1 text-[11px] h-7"
                              onClick={() => handleReject(r.id)}
                              disabled={loadingId === r.id}
                            >
                              Recusar
                            </Button>
                          </div>
                        )}
                        
                        {r.status === "authorized" && (
                          <div className="pt-2 border-t">
                            <Button size="sm" variant="outline" className="w-full text-[11px] h-7">
                              Gerar Etiqueta Reversa <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  
                {requests.filter((r) => r.status === col.id).length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-[11px] text-muted-foreground">Nenhuma solicitação</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        ))}
      </div>
    </div>
  );
}
