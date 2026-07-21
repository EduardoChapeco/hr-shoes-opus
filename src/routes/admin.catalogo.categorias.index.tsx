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
import { listCategories, updateCategory } from "@/services/admin-catalog.functions";

export const Route = createFileRoute("/admin/catalogo/categorias/")({
  head: () => ({ meta: [{ title: "Categorias — Hr Shoes" }] }),
  loader: async () => {
    const res = await listCategories();
    return res.status === "ok" ? res.data : [];
  },
  component: AdminCategoriesPage,
});

function AdminCategoriesPage() {
  const categories = Route.useLoaderData();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<"active" | "archived">("active");
  const [searchQuery, setSearchQuery] = useState("");

  const activeCategoriesCount = categories.filter((c: any) => c.status !== "archived").length;
  const archivedCategoriesCount = categories.filter((c: any) => c.status === "archived").length;

  const filteredCategories = useMemo(() => {
    return categories.filter((c: any) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "active" ? c.status !== "archived" : c.status === "archived";

      return matchesSearch && matchesStatus;
    });
  }, [categories, searchQuery, statusFilter]);

  const handleUpdateStatus = async (id: string, newStatus: "active" | "inactive" | "archived") => {
    try {
      const res = await updateCategory({ data: { id, status: newStatus } });
      if (res.status === "success") {
        toast.success(
          newStatus === "archived"
            ? "Categoria arquivada com sucesso!"
            : "Categoria reativada/atualizada!"
        );
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao atualizar categoria");
      }
    } catch {
      toast.error("Erro inesperado ao atualizar status");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catálogo"
        title="Categorias"
        description="Organize seus produtos em categorias hierárquicas."
        actions={
          <Button asChild size="sm">
            <Link to="/admin/catalogo/categorias/novo">
              <Plus className="mr-1.5 size-4" aria-hidden />
              Nova Categoria
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
            <TabsTrigger value="active">Ativas ({activeCategoriesCount})</TabsTrigger>
            <TabsTrigger value="archived">Arquivo Morto ({archivedCategoriesCount})</TabsTrigger>
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

      {filteredCategories.length === 0 ? (
        <EmptyState
          title={
            statusFilter === "active"
              ? "Nenhuma categoria encontrada"
              : "Nenhuma categoria no arquivo morto"
          }
          description={
            searchQuery
              ? "Tente alterar os termos da sua busca."
              : statusFilter === "active"
                ? "Crie categorias para organizar seus produtos na vitrine."
                : "Categorias arquivadas aparecerão aqui."
          }
          action={
            statusFilter === "active" ? (
              <Button asChild size="sm">
                <Link to="/admin/catalogo/categorias/novo">
                  <Plus className="mr-1.5 size-4" />
                  Nova Categoria
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
                {filteredCategories.map((cat: any) => (
                  <TableRow key={cat.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-semibold text-sm text-foreground">
                      {cat.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {cat.slug}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          cat.status === "active"
                            ? "default"
                            : cat.status === "archived"
                              ? "outline"
                              : "secondary"
                        }
                        className="text-xs"
                      >
                        {cat.status === "active"
                          ? "Ativa"
                          : cat.status === "inactive"
                            ? "Inativa"
                            : "Arquivada"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Ações da categoria">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {cat.status !== "archived" ? (
                            <>
                              <DropdownMenuItem asChild>
                                <Link to={`/admin/catalogo/categorias/${cat.id}` as any}>
                                  <Edit className="mr-2 size-3.5" />
                                  Editar Categoria
                                </Link>
                              </DropdownMenuItem>
                              {cat.status === "active" ? (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(cat.id, "inactive")}>
                                  <EyeOff className="mr-2 size-3.5" />
                                  Desativar
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(cat.id, "active")}>
                                  <Check className="mr-2 size-3.5 text-emerald-600" />
                                  Ativar
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleUpdateStatus(cat.id, "archived")}
                              >
                                <Archive className="mr-2 size-3.5" />
                                Arquivar
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(cat.id, "active")}>
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

