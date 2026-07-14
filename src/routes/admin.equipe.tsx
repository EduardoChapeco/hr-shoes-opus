import { createFileRoute, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { UserCog } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listTeamMembers, updateTeamMemberRole } from "@/services/admin-team.functions";
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
      <PageHeader
        title="Gestão de Equipe"
        description="Gerencie os acessos e permissões dos funcionários da sua loja."
      />

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
                      disabled={member.role === "owner"}
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
