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
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

  const activeCollections = collections.filter((c: any) => c.status !== "archived");
  const archivedCollections = collections.filter((c: any) => c.status === "archived");

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

  const renderTable = (list: any[]) => {
    if (list.length === 0) {
      return (
        <EmptyState
          title={
            activeTab === "active"
              ? "Nenhuma coleção ativa cadastrada"
              : "Nenhuma coleção no arquivo morto"
          }
          description={
            activeTab === "active"
              ? "Crie coleções para agrupar produtos para vitrines e campanhas."
              : "Coleções arquivadas aparecerão aqui."
          }
          action={
            activeTab === "active" ? (
              <Button asChild>
                <Link to="/admin/catalogo/colecoes/novo">Nova coleção</Link>
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
            {list.map((col: any) => (
              <TableRow key={col.id}>
                <TableCell className="font-medium">{col.name}</TableCell>
                <TableCell className="text-muted-foreground">{col.slug}</TableCell>
                <TableCell>
                  <Badge variant={col.status === "active" ? "default" : "secondary"}>
                    {col.status === "active" ? "Ativa" : col.status === "inactive" ? "Inativa" : "Arquivada"}
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
                      {col.status !== "archived" ? (
                        <>
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/catalogo/colecoes/${col.id}` as any}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar coleção
                            </Link>
                          </DropdownMenuItem>
                          {col.status === "active" ? (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(col.id, "inactive")}>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Desativar
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(col.id, "active")}>
                              <Check className="mr-2 h-4 w-4" />
                              Ativar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleUpdateStatus(col.id, "archived")}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Arquivar
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <DropdownMenuItem onClick={() => handleUpdateStatus(col.id, "active")}>
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
        title="Coleções"
        description="Agrupe produtos para campanhas, estações ou promoções especiais."
        actions={
          <Button asChild>
            <Link to="/admin/catalogo/colecoes/novo">
              <Plus className="mr-2 size-4" aria-hidden />
              Nova coleção
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
          <TabsTrigger value="active">Ativas ({activeCollections.length})</TabsTrigger>
          <TabsTrigger value="archived">Arquivo Morto ({archivedCollections.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {renderTable(activeCollections)}
        </TabsContent>

        <TabsContent value="archived" className="mt-4">
          {renderTable(archivedCollections)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
