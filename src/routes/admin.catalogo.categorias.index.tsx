import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Plus, MoreHorizontal, Edit, Archive, RotateCcw, EyeOff, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

  const activeCategories = categories.filter((c: any) => c.status !== "archived");
  const archivedCategories = categories.filter((c: any) => c.status === "archived");

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

  const renderTable = (list: any[]) => {
    if (list.length === 0) {
      return (
        <EmptyState
          title={
            activeTab === "active"
              ? "Nenhuma categoria ativa cadastrada"
              : "Nenhuma categoria no arquivo morto"
          }
          description={
            activeTab === "active"
              ? "Crie categorias para organizar seus produtos na vitrine."
              : "Categorias arquivadas aparecerão aqui."
          }
          action={
            activeTab === "active" ? (
              <Button asChild>
                <Link to="/admin/catalogo/categorias/novo">Nova categoria</Link>
              </Button>
            ) : undefined
          }
        />
      );
    }

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((cat: any) => (
              <TableRow key={cat.id}>
                <TableCell className="font-medium">{cat.name}</TableCell>
                <TableCell className="text-muted-foreground">{cat.slug}</TableCell>
                <TableCell>
                  <Badge variant={cat.status === "active" ? "default" : "secondary"}>
                    {cat.status === "active" ? "Ativa" : cat.status === "inactive" ? "Inativa" : "Arquivada"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {cat.status !== "archived" ? (
                        <>
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/catalogo/categorias/${cat.id}` as any}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar categoria
                            </Link>
                          </DropdownMenuItem>
                          {cat.status === "active" ? (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(cat.id, "inactive")}>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Desativar
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(cat.id, "active")}>
                              <Check className="mr-2 h-4 w-4" />
                              Ativar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleUpdateStatus(cat.id, "archived")}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Arquivar
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <DropdownMenuItem onClick={() => handleUpdateStatus(cat.id, "active")}>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Recuperar
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
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Catálogo"
        title="Categorias"
        description="Organize seus produtos em categorias hierárquicas."
        actions={
          <Button asChild>
            <Link to="/admin/catalogo/categorias/novo">
              <Plus className="mr-2 size-4" aria-hidden />
              Nova categoria
            </Link>
          </Button>
        }
      />

      <Tabs
        defaultValue="active"
        onValueChange={(val) => setActiveTab(val as "active" | "archived")}
        className="w-full"
      >
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="active">Ativas ({activeCategories.length})</TabsTrigger>
          <TabsTrigger value="archived">Arquivo Morto ({archivedCategories.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {renderTable(activeCategories)}
        </TabsContent>

        <TabsContent value="archived" className="mt-4">
          {renderTable(archivedCategories)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
