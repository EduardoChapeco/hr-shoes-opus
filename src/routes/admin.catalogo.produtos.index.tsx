import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Plus,
  Search,
  MoreVertical,
  Copy,
  Eye,
  Edit3,
  Archive,
  CheckCircle2,
  FileText,
  Trash2,
  Download,
  Package,
  Filter,
  Layers,
} from "lucide-react";

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
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/state/states";
import {
  listAdminProducts,
  duplicateProduct,
  toggleProductStatus,
  bulkUpdateProductStatus,
} from "@/services/admin-catalog.functions";
import { formatMoney } from "@/lib/money";
import type { AdminProductRow } from "@/types/catalog";

export const Route = createFileRoute("/admin/catalogo/produtos/")({
  head: () => ({ meta: [{ title: "Gerenciador de Produtos — Hr Shoes" }] }),
  loader: async () => {
    const res = await listAdminProducts();
    return res.status === "ok" ? res.data : [];
  },
  component: AdminProductsPage,
});

function AdminProductsPage() {
  const initialProducts = Route.useLoaderData();
  const [products, setProducts] = useState<AdminProductRow[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  // Filter products by search & status tab
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "active" ? p.status !== "archived" : p.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [products, searchQuery, statusFilter]);

  // Handle Select All
  const isAllSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedIds.includes(p.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Action: Duplicate Single
  const handleDuplicate = async (productId: string) => {
    setIsProcessing(true);
    const res = await duplicateProduct({ data: { productId } });
    setIsProcessing(false);

    if (res.status === "success" && res.data) {
      toast.success("Produto duplicado com sucesso em modo Rascunho!");
      const reloaded = await listAdminProducts();
      if (reloaded.status === "ok") setProducts(reloaded.data);
    } else {
      toast.error((res as any).message || "Erro ao duplicar produto.");
    }
  };

  // Action: Change Single Status
  const handleToggleStatus = async (
    productId: string,
    newStatus: "draft" | "published" | "archived",
  ) => {
    setIsProcessing(true);
    const res = await toggleProductStatus({ data: { productId, status: newStatus } });
    setIsProcessing(false);

    if (res.status === "success") {
      toast.success(`Status alterado para ${newStatus === "published" ? "Publicado" : newStatus === "archived" ? "Arquivado" : "Rascunho"}.`);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p)),
      );
    } else {
      toast.error((res as any).message || "Erro ao alterar status.");
    }
  };

  // Action: Bulk Update
  const handleBulkAction = async (action: "published" | "draft" | "archived" | "delete") => {
    if (selectedIds.length === 0) return;

    if (action === "delete" && !confirm(`Deseja realmente excluir ${selectedIds.length} produto(s)? Esta ação é permanente.`)) {
      return;
    }

    setIsProcessing(true);
    const res = await bulkUpdateProductStatus({ data: { productIds: selectedIds, action } });
    setIsProcessing(false);

    if (res.status === "success") {
      toast.success(`Ação em lote executada para ${selectedIds.length} produto(s).`);
      setSelectedIds([]);
      const reloaded = await listAdminProducts();
      if (reloaded.status === "ok") setProducts(reloaded.data);
    } else {
      toast.error((res as any).message || "Erro ao executar ação em lote.");
    }
  };

  // Action: Export JSON
  const handleExportJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(filteredProducts, null, 2),
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `catalogo_produtos_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Catálogo exportado em arquivo JSON.");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catálogo Comercial"
        title="Gestão de Produtos"
        description="Gerencie catálogo, variações de estoque, preços, publicações e ações em lote."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportJSON}>
              <Download className="mr-1.5 size-4" aria-hidden />
              Exportar
            </Button>
            <Button asChild size="sm">
              <Link to="/admin/catalogo/produtos/novo">
                <Plus className="mr-1.5 size-4" aria-hidden />
                Novo Produto
              </Link>
            </Button>
          </div>
        }
      />

      {/* Toolbar & Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <Tabs defaultValue="active" value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto overflow-hidden">
          <TabsList className="flex w-full overflow-x-auto no-scrollbar sm:w-auto h-auto py-1">
            <TabsTrigger value="active" className="text-xs shrink-0">
              Ativos ({products.filter(p => p.status !== "archived").length})
            </TabsTrigger>
            <TabsTrigger value="published" className="text-xs shrink-0">
              Publicados ({products.filter((p) => p.status === "published").length})
            </TabsTrigger>
            <TabsTrigger value="draft" className="text-xs shrink-0">
              Rascunhos ({products.filter((p) => p.status === "draft").length})
            </TabsTrigger>
            <TabsTrigger value="archived" className="text-xs shrink-0">
              Arquivo Morto ({products.filter((p) => p.status === "archived").length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            placeholder="Buscar por título ou SKU..."
            className="pl-9 text-xs w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Barra Flutuante de Ações em Lote */}
      {selectedIds.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/10 dark:bg-primary/20 animate-in fade-in-50 gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Badge variant="default" className="font-bold">
              {selectedIds.length}
            </Badge>
            <span>produto(s) selecionado(s)</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="text-xs flex-1 sm:flex-none justify-center"
              disabled={isProcessing}
              onClick={() => handleBulkAction("published")}
            >
              <CheckCircle2 className="size-3.5 mr-1 text-emerald-600 shrink-0" />
              Publicar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs flex-1 sm:flex-none justify-center"
              disabled={isProcessing}
              onClick={() => handleBulkAction("draft")}
            >
              <FileText className="size-3.5 mr-1 text-amber-600 shrink-0" />
              Rascunho
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs flex-1 sm:flex-none justify-center"
              disabled={isProcessing}
              onClick={() => handleBulkAction("archived")}
            >
              <Archive className="size-3.5 mr-1 text-muted-foreground shrink-0" />
              Arquivar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="text-xs flex-1 sm:flex-none justify-center"
              disabled={isProcessing}
              onClick={() => handleBulkAction("delete")}
            >
              <Trash2 className="size-3.5 mr-1 shrink-0" />
              Excluir
            </Button>
          </div>
        </div>
      )}

      {/* Tabela de Produtos */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          title="Nenhum produto encontrado"
          description={
            searchQuery || statusFilter !== "active"
              ? "Tente alterar os termos de busca ou filtros aplicados."
              : "Cadastre seu primeiro produto com fotos, variações e preços para vender."
          }
          action={
            <Button asChild size="sm">
              <Link to="/admin/catalogo/produtos/novo">
                <Plus className="mr-1.5 size-4" />
                Cadastrar Primeiro Produto
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-xs">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-12 text-center">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Selecionar todos os produtos"
                  />
                </TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tipo / Marca</TableHead>
                <TableHead>Preço de Venda</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const cover = product.product_media?.[0]?.url;
                const isSelected = selectedIds.includes(product.id);
                const typeName =
                  product.product_types && product.product_types.length > 0
                    ? product.product_types[0].name
                    : "Padrão";

                return (
                  <TableRow
                    key={product.id}
                    className={`transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-muted/30"}`}
                  >
                    <TableCell className="text-center">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelectRow(product.id)}
                        aria-label={`Selecionar ${product.title}`}
                      />
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-3">
                        {cover ? (
                          <img
                            src={cover}
                            alt=""
                            className="size-11 rounded-lg object-cover border border-border shrink-0"
                          />
                        ) : (
                          <div className="size-11 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                            <Package className="size-5 text-muted-foreground" aria-hidden />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/admin/catalogo/produtos/${product.id}` as never}
                            className="font-semibold text-sm text-foreground hover:underline truncate block"
                          >
                            {product.title}
                          </Link>
                          <span className="text-xs text-muted-foreground font-mono">
                            /{product.slug}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          product.status === "published"
                            ? "default"
                            : product.status === "archived"
                              ? "outline"
                              : "secondary"
                        }
                        className="text-xs"
                      >
                        {product.status === "published"
                          ? "Publicado"
                          : product.status === "archived"
                            ? "Arquivado"
                            : "Rascunho"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{typeName}</span>
                        {product.brand && <span className="text-[11px]">{product.brand}</span>}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground">
                          {formatMoney(product.price_cents)}
                        </span>
                        {product.compare_at_cents ? (
                          <span className="text-xs text-muted-foreground line-through">
                            {formatMoney(product.compare_at_cents)}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Ações do produto">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel className="text-xs">Ações Comerciais</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/catalogo/produtos/${product.id}` as never}>
                              <Edit3 className="size-3.5 mr-2" />
                              Editar Produto
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/produto/${product.slug}` as never} target="_blank">
                              <Eye className="size-3.5 mr-2" />
                              Ver na Loja
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(product.id)}>
                            <Copy className="size-3.5 mr-2" />
                            Duplicar Produto
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {product.status !== "published" && (
                            <DropdownMenuItem onClick={() => handleToggleStatus(product.id, "published")}>
                              <CheckCircle2 className="size-3.5 mr-2 text-emerald-600" />
                              Publicar na Vitrine
                            </DropdownMenuItem>
                          )}
                          {product.status !== "draft" && (
                            <DropdownMenuItem onClick={() => handleToggleStatus(product.id, "draft")}>
                              <FileText className="size-3.5 mr-2 text-amber-600" />
                              Tornar Rascunho
                            </DropdownMenuItem>
                          )}
                          {product.status !== "archived" && (
                            <DropdownMenuItem onClick={() => handleToggleStatus(product.id, "archived")}>
                              <Archive className="size-3.5 mr-2" />
                              Arquivar Produto
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </div>
      )}
    </div>
  );
}
