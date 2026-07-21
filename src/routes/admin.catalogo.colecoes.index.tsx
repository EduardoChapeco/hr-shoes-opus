import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Plus, MoreHorizontal, Edit, Archive, RotateCcw, EyeOff, Check, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { listCollections, updateCollection } from "@/services/admin-catalog.functions";

export const Route = createFileRoute("/admin/catalogo/colecoes/")({
  head: () => ({ meta: [{ title: "Coleções — Hr Shoes" }] }),
  loader: async () => {
    const res = await listCollections();
    return res.status === "ok" ? res.data : [];
  },
  component: AdminCollectionsPage,
});

function AdminCollectionsPage() {
  const collections = Route.useLoaderData();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<"active" | "archived">("active");
  const [searchQuery, setSearchQuery] = useState("");

  const activeCollectionsCount = collections.filter((c: any) => c.status !== "archived").length;
  const archivedCollectionsCount = collections.filter((c: any) => c.status === "archived").length;

  const filteredCollections = useMemo(() => {
    return collections.filter((c: any) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "active" ? c.status !== "archived" : c.status === "archived";

      return matchesSearch && matchesStatus;
    });
  }, [collections, searchQuery, statusFilter]);

  const handleUpdateStatus = async (id: string, newStatus: "active" | "inactive" | "archived") => {
    try {
      const res = await updateCollection({ data: { id, status: newStatus } });
      if (res.status === "success") {
        toast.success(
          newStatus === "archived"
            ? "Coleção arquivada com sucesso!"
            : "Coleção reativada/atualizada!"
        );
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao atualizar coleção");
      }
    } catch {
      toast.error("Erro inesperado ao atualizar status");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catálogo"
        title="Coleções"
        description="Agrupe produtos para campanhas, estações ou promoções especiais."
        actions={
          <Button asChild size="sm">
            <Link to="/admin/catalogo/colecoes/novo">
              <Plus className="mr-1.5 size-4" aria-hidden />
              Nova Coleção
            </Link>
          </Button>
        }
      />

      {/* Toolbar & Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <Tabs
          defaultValue="active"
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val as "active" | "archived")}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
            <TabsTrigger value="active">Ativas ({activeCollectionsCount})</TabsTrigger>
            <TabsTrigger value="archived">Arquivo Morto ({archivedCollectionsCount})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            placeholder="Buscar por nome ou slug..."
            className="pl-9 text-xs w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredCollections.length === 0 ? (
        <EmptyState
          title={
            statusFilter === "active"
              ? "Nenhuma coleção encontrada"
              : "Nenhuma coleção no arquivo morto"
          }
          description={
            searchQuery
              ? "Tente alterar os termos da sua busca."
              : statusFilter === "active"
                ? "Crie coleções para agrupar produtos para vitrines e campanhas."
                : "Coleções arquivadas aparecerão aqui."
          }
          action={
            statusFilter === "active" ? (
              <Button asChild size="sm">
                <Link to="/admin/catalogo/colecoes/novo">
                  <Plus className="mr-1.5 size-4" />
                  Nova Coleção
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-xs">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCollections.map((col: any) => (
                  <TableRow key={col.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-semibold text-sm text-foreground">
                      {col.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {col.slug}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          col.status === "active"
                            ? "default"
                            : col.status === "archived"
                              ? "outline"
                              : "secondary"
                        }
                        className="text-xs"
                      >
                        {col.status === "active"
                          ? "Ativa"
                          : col.status === "inactive"
                            ? "Inativa"
                            : "Arquivada"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Ações da coleção">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {col.status !== "archived" ? (
                            <>
                              <DropdownMenuItem asChild>
                                <Link to={`/admin/catalogo/colecoes/${col.id}` as any}>
                                  <Edit className="mr-2 size-3.5" />
                                  Editar Coleção
                                </Link>
                              </DropdownMenuItem>
                              {col.status === "active" ? (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(col.id, "inactive")}>
                                  <EyeOff className="mr-2 size-3.5" />
                                  Desativar
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(col.id, "active")}>
                                  <Check className="mr-2 size-3.5 text-emerald-600" />
                                  Ativar
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleUpdateStatus(col.id, "archived")}
                              >
                                <Archive className="mr-2 size-3.5" />
                                Arquivar
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(col.id, "active")}>
                              <RotateCcw className="mr-2 size-3.5" />
                              Restaurar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

