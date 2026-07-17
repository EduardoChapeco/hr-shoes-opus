import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { UserCog, Plus } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  listTeamMembers,
  updateTeamMemberRole,
  inviteTeamMember,
} from "@/services/admin-team.functions";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/admin/equipe")({
  head: () => ({ meta: [{ title: "Equipe — Hr Shoes" }] }),
  loader: async () => {
    const res = await listTeamMembers();
    if (res.status === "error") throw new Error(res.message);
    return res.data;
  },
  component: TeamPage,
});

function TeamPage() {
  const team = Route.useLoaderData() || [];
  const router = useRouter();
  const { session } = Route.useRouteContext() as any;

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteData, setInviteData] = useState({ fullName: "", email: "", role: "seller" });
  const [isInviting, setIsInviting] = useState(false);

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      const res = await updateTeamMemberRole({ data: { id, role: newRole as any } });
      if (res.status === "success") {
        toast.success("Cargo atualizado com sucesso!");
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao atualizar cargo");
      }
    } catch (e) {
      toast.error("Erro inesperado");
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    try {
      const res = await inviteTeamMember({ data: inviteData as any });
      if (res.status === "success") {
        toast.success(`Conta criada! Senha temporária enviada (Simulação: HrShoes123!)`);
        setIsInviteOpen(false);
        setInviteData({ fullName: "", email: "", role: "seller" });
        router.invalidate();
      } else {
        toast.error(res.message);
      }
    } catch (e: any) {
      toast.error("Erro inesperado ao criar acesso.");
    } finally {
      setIsInviting(false);
    }
  };

  const roleLabels: Record<string, string> = {
    owner: "Proprietário",
    admin: "Administrador",
    manager: "Gerente",
    seller: "Vendedor",
    finance: "Financeiro",
    content: "Marketing/Conteúdo",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="Gestão de Equipe"
          description="Gerencie acessos e permissões ou cadastre novas vendedoras."
        />
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Cadastrar Vendedora/Membro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Acesso</DialogTitle>
              <DialogDescription>
                Crie um acesso para um funcionário da loja. Uma senha temporária será gerada.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input
                  required
                  value={inviteData.fullName}
                  onChange={(e) => setInviteData({ ...inviteData, fullName: e.target.value })}
                  placeholder="Ex: Maria Vendedora"
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  required
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  placeholder="maria@loja.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Cargo / Permissão</Label>
                <Select
                  value={inviteData.role}
                  onValueChange={(v) => setInviteData({ ...inviteData, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seller">Vendedor(a)</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="finance">Financeiro</SelectItem>
                    <SelectItem value="content">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={isInviting} className="w-full">
                {isInviting ? "Cadastrando..." : "Confirmar Cadastro"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {team.length === 0 ? (
        <EmptyState
          title="Nenhum membro encontrado"
          description="Apenas você tem acesso à loja no momento."
        />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membro</TableHead>
                <TableHead>Data de Entrada</TableHead>
                <TableHead>Cargo / Permissão</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.map((member: any) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <UserCog className="h-4 w-4 text-muted-foreground" />
                    </div>
                    {member.full_name || "Usuário Convidado"}
                  </TableCell>
                  <TableCell>{new Date(member.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    <Badge variant={member.role === "owner" ? "default" : "secondary"}>
                      {roleLabels[member.role] || member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Select
                      defaultValue={member.role}
                      onValueChange={(val) => handleRoleChange(member.id, val)}
                      disabled={
                        member.role === "owner" ||
                        (session?.role !== "owner" && member.role === "admin") ||
                        member.id === session?.id
                      }
                    >
                      <SelectTrigger className="w-[180px] ml-auto h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="manager">Gerente</SelectItem>
                        <SelectItem value="seller">Vendedor</SelectItem>
                        <SelectItem value="finance">Financeiro</SelectItem>
                        <SelectItem value="content">Conteúdo</SelectItem>
                        <SelectItem value="customer">Revogar Acesso</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
