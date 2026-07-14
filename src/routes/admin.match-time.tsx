import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Clock, Plus, Zap } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listMatchTimeCampaigns, upsertMatchTimeCampaign } from "@/services/marketing-engagement.functions";
import { EmptyState } from "@/components/state/states";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/admin/match-time")({
  head: () => ({ meta: [{ title: "Match Time — Hr Shoes" }] }),
  loader: async () => {
    const res = await listMatchTimeCampaigns();
    if (res.status === "error") throw new Error(res.message);
    return res.data;
  },
  component: MatchTimePage,
});

function MatchTimePage() {
  const campaigns = Route.useLoaderData() || [];
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState("");
  const [prize, setPrize] = useState("");
  const [coupon, setCoupon] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !prize || !startsAt || !endsAt) return;
    
    setIsSaving(true);
    try {
      const res = await upsertMatchTimeCampaign({
        data: {
          name,
          prize_description: prize,
          coupon_code: coupon,
          starts_at: new Date(startsAt).toISOString(),
          ends_at: new Date(endsAt).toISOString(),
          status: "draft"
        }
      });
      if (res.status === "success") {
        toast.success("Campanha Match Time criada!");
        setOpen(false);
        setName("");
        setPrize("");
        setCoupon("");
        setStartsAt("");
        setEndsAt("");
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao criar campanha.");
      }
    } catch {
      toast.error("Erro inesperado");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: any, currentCampaign: any) => {
    try {
      await upsertMatchTimeCampaign({
        data: {
          id,
          name: currentCampaign.name,
          prize_description: currentCampaign.prize_description,
          coupon_code: currentCampaign.coupon_code,
          starts_at: currentCampaign.starts_at,
          ends_at: currentCampaign.ends_at,
          status: newStatus
        }
      });
      router.invalidate();
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Match Time"
        description="Crie rodadas relâmpago de promoções para engajar seus clientes."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Rodada
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Rodada Match Time</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome da Campanha</label>
                  <Input placeholder="Ex: Black Friday Relâmpago" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Descrição do Prêmio</label>
                  <Input placeholder="Ex: 50% de desconto na coleção Verão" value={prize} onChange={e => setPrize(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Código do Cupom a ser liberado</label>
                  <Input placeholder="Ex: MATCH50" value={coupon} onChange={e => setCoupon(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Início</label>
                    <Input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Término</label>
                    <Input type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} required />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isSaving}>
                  {isSaving ? "Salvando..." : "Criar Campanha"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {campaigns.length === 0 ? (
        <EmptyState
          title="Nenhum evento agendado"
          description="Você ainda não configurou rodadas do Match Time."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {campaigns.map((c: any) => (
            <Card key={c.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500" />
                    {c.name}
                  </CardTitle>
                  <Badge variant={c.status === "active" ? "default" : c.status === "finished" ? "secondary" : "outline"}>
                    {c.status === "active" ? "Ativa" : c.status === "finished" ? "Encerrada" : "Rascunho"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{c.prize_description}</p>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {new Date(c.starts_at).toLocaleDateString("pt-BR", { hour: "2-digit", minute: "2-digit" })} até 
                    {new Date(c.ends_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="pt-3 border-t flex justify-end gap-2">
                {c.status === "draft" && (
                  <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(c.id, "active", c)}>
                    Ativar Agora
                  </Button>
                )}
                {c.status === "active" && (
                  <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(c.id, "finished", c)}>
                    Encerrar
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
