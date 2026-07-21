import { createFileRoute } from "@tanstack/react-router";
import { Users, Search } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/commerce/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/state/states";
import { listStoreFollowers } from "@/services/social.functions";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/marketing/seguidores")({
  head: () => ({ meta: [{ title: "Seguidores da Loja — Hr Shoes" }] }),
  loader: async () => {
    const res = await listStoreFollowers();
    return res || [];
  },
  component: FollowersPage,
});

function FollowersPage() {
  const followers = Route.useLoaderData() as any[];
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFollowers = followers.filter(f => 
    f.customer?.raw_user_meta_data?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.customer?.raw_user_meta_data?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Seguidores da Loja"
        description={`Você tem ${followers.length} cliente(s) acompanhando suas novidades.`}
      />

      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome ou email..." 
            className="pl-9 bg-card"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredFollowers.length === 0 ? (
        <EmptyState
          title={searchTerm ? "Nenhum seguidor encontrado" : "Ainda sem seguidores"}
          description={searchTerm ? "Tente buscar por outro termo." : "Os clientes que clicarem em 'Seguir' na página do produto aparecerão aqui."}
        />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Data de Inscrição</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFollowers.map((f, i) => {
                const meta = f.customer?.raw_user_meta_data || {};
                return (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      {meta.full_name || "Cliente sem nome"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {meta.email || "-"}
                    </TableCell>
                    <TableCell>
                      {new Date(f.created_at).toLocaleDateString("pt-BR", {
                        day: '2-digit', month: 'long', year: 'numeric'
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">Ativo</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
