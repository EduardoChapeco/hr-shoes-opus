import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { UserCog, Plus, Search, ShieldCheck, Users, Briefcase, UserPlus, Trash2 } from "lucide-react";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  DialogFooter,
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
import { formatDateTime } from "@/lib/datetime";

export const Route = createFileRoute("/admin/equipe")({
  head: () => ({ meta: [{ title: "Gestão de Equipe — Hr Shoes" }] }),
  loader: async () => {
    const res = await listTeamMembers();
    if (res.status === "error") throw new Error(res.message);
    return res.data || [];
  },
  component: TeamPage,
});

const roleLabels: Record<string, string> = {
  owner: "Proprietário(a)",
  admin: "Administrador(a)",
  manager: "Gerente",
  seller: "Vendedor(a)",
  finance: "Financeiro",
  content: "Marketing / Conteúdo",
};

function getInitials(name: string) {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function TeamPage() {
  const team = Route.useLoaderData() as any[];
  const router = useRouter();
  const { session } = Route.useRouteContext() as any;

  const [searchQuery, setSearchQuery] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteData, setInviteData] = useState({ fullName: "", email: "", role: "seller" });
  const [isInviting, setIsInviting] = useState(false);

  // Computed metrics
  const sellersCount = useMemo(() => team.filter((m) => m.role === "seller").length, [team]);
  const managersCount = useMemo(
    () => team.filter((m) => m.role === "manager" || m.role === "admin" || m.role === "owner").length,
    [team],
  );

  // Filtered team members
  const filteredTeam = useMemo(() => {
    return team.filter((member) => {
      const name = (member.full_name || "").toLowerCase();
      const email = (member.email || "").toLowerCase();
      const query = searchQuery.toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [team, searchQuery]);

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      const res = await updateTeamMemberRole({ data: { id, role: newRole as any } });
      if (res.status === "success") {
        toast.success("Cargo e permissão atualizados com sucesso!");
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao atualizar cargo");
      }
    } catch (e) {
      toast.error("Erro inesperado ao atualizar cargo.");
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteData.fullName.trim() || !inviteData.email.trim()) return;

    setIsInviting(true);
    try {
      const res = await inviteTeamMember({ data: inviteData as any });
      if (res.status === "success") {
        toast.success(`Acesso criado! Senha temporária enviada para ${inviteData.email}`);
        setIsInviteOpen(false);
        setInviteData({ fullName: "", email: "", role: "seller" });
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao criar acesso.");
      }
    } catch (e: any) {
      toast.error("Erro inesperado ao cadastrar membro.");
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Recursos Humanos & Acessos"
        title="Gestão de Equipe & Permissões"
        description="Gerencie acessos ao painel, atribua funções a vendedoras e mantenha o controle de segurança da loja."
        actions={
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="w-4 h-4 mr-1.5" /> Cadastrar Vendedora / Membro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Colaborador</DialogTitle>
                <DialogDescription>
                  Crie uma conta de acesso para um membro da equipe com função e permissões específicas.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="mem-name">Nome Completo *</Label>
                  <Input
                    id="mem-name"
                    required
                    value={inviteData.fullName}
                    onChange={(e) => setInviteData({ ...inviteData, fullName: e.target.value })}
                    placeholder="Ex: Ana Maria Silva"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mem-email">E-mail Comercial *</Label>
                  <Input
                    id="mem-email"
                    type="email"
                    required
                    value={inviteData.email}
                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                    placeholder="ana.vendas@hrshoes.com.br"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mem-role">Cargo / Nível de Permissão *</Label>
                  <Select
                    value={inviteData.role}
                    onValueChange={(v) => setInviteData({ ...inviteData, role: v })}
                  >
                    <SelectTrigger id="mem-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seller">Vendedor(a)</SelectItem>
                      <SelectItem value="manager">Gerente de Loja</SelectItem>
                      <SelectItem value="admin">Administrador(a)</SelectItem>
                      <SelectItem value="finance">Financeiro</SelectItem>
                      <SelectItem value="content">Marketing / Conteúdo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter className="pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsInviteOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isInviting} className="font-bold">
                    {isInviting ? "Cadastrando..." : "Confirmar Acesso"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Grid de Métricas de Equipe */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total da Equipe
            </span>
            <Users className="size-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{team.length} membro(s)</div>
            <p className="text-xs text-muted-foreground mt-1">Usuários cadastrados nesta loja</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Vendedoras de Balcão
            </span>
            <Briefcase className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{sellersCount} vendedora(s)</div>
            <p className="text-xs text-muted-foreground mt-1">Perfil operacional com acesso ao PDV</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Gestão & Admin
            </span>
            <ShieldCheck className="size-4 text-amber-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{managersCount} gestor(es)</div>
            <p className="text-xs text-muted-foreground mt-1">Acesso administrativo completo</p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Busca e Tabela */}
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            placeholder="Buscar membro por nome ou e-mail..."
            className="pl-9 text-xs bg-card"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredTeam.length === 0 ? (
          <EmptyState
            title="Nenhum membro encontrado"
            description="Tente ajustar os termos da sua busca ou cadastre um novo membro no botão acima."
          />
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Data de Entrada</TableHead>
                  <TableHead>Cargo / Permissão</TableHead>
                  <TableHead className="text-right">Alterar Nível de Acesso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeam.map((member) => (
                  <TableRow key={member.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 border border-border">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                            {getInitials(member.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-foreground">
                            {member.full_name || "Usuário Convidado"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {member.email || "Sem e-mail registrado"}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(member.created_at)}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={member.role === "owner" ? "default" : "secondary"}
                        className="text-xs font-semibold px-2.5 py-0.5"
                      >
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
                        <SelectTrigger className="w-[190px] ml-auto h-8 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end">
                          <SelectItem value="admin">Administrador(a)</SelectItem>
                          <SelectItem value="manager">Gerente</SelectItem>
                          <SelectItem value="seller">Vendedor(a)</SelectItem>
                          <SelectItem value="finance">Financeiro</SelectItem>
                          <SelectItem value="content">Marketing</SelectItem>
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
    </div>
  );
}
