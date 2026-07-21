import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Plus, MoreHorizontal, Edit, Trash2, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/state/states";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  listProductTypes,
  createProductType,
  updateProductType,
  deleteProductType,
} from "@/services/admin-catalog.functions";

const fieldSchemaObj = z.object({
  name: z.string().min(1, "Obrigatório"),
  kind: z.enum(["text", "number", "boolean", "select_single", "option_group"]),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
});

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Apenas letras minúsculas, números e hífens"),
  fields: z.array(fieldSchemaObj),
});

type FormValues = z.infer<typeof formSchema>;

export const Route = createFileRoute("/admin/catalogo/tipos")({
  head: () => ({ meta: [{ title: "Tipos de produto — Hr Shoes" }] }),
  loader: async () => {
    const res = await listProductTypes();
    return res.status === "ok" ? res.data : [];
  },
  component: ProductTypesPage,
});

function ProductTypesPage() {
  const types = Route.useLoaderData();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingType, setEditingType] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTypes = useMemo(() => {
    return types.filter((t: any) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [types, searchQuery]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      fields: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "fields",
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      if (editingType) {
        const res = await updateProductType({
          data: {
            id: editingType.id,
            name: values.name,
            slug: values.slug,
            field_schema: values.fields,
          },
        });
        if (res.status === "success") {
          toast.success("Tipo de produto atualizado!");
          setOpen(false);
          setEditingType(null);
          form.reset();
          router.invalidate();
        } else {
          toast.error(res.message || "Erro ao atualizar tipo");
        }
      } else {
        const res = await createProductType({
          data: {
            name: values.name,
            slug: values.slug,
            field_schema: values.fields,
          },
        });

        if (res.status === "success") {
          toast.success("Tipo de produto criado com sucesso!");
          setOpen(false);
          form.reset();
          router.invalidate();
        } else {
          toast.error(res.message || "Erro ao criar tipo");
        }
      }
    } catch (e: unknown) {
      toast.error("Erro inesperado");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenNew = () => {
    setEditingType(null);
    form.reset({ name: "", slug: "", fields: [] });
    setOpen(true);
  };

  const handleOpenEdit = (type: any) => {
    setEditingType(type);
    form.reset({
      name: type.name,
      slug: type.slug,
      fields: Array.isArray(type.field_schema) ? type.field_schema : [],
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este tipo de produto? Isso pode quebrar a associação de produtos que usam este tipo.")) {
      return;
    }
    try {
      const res = await deleteProductType({ data: { id } });
      if (res.status === "success") {
        toast.success("Tipo de produto excluído!");
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao excluir tipo");
      }
    } catch {
      toast.error("Erro ao excluir tipo");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catálogo"
        title="Tipos de produto"
        description="Defina os esquemas de atributos dinâmicos para diferentes categorias de produtos."
        actions={
          <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) setEditingType(null); }}>
            <Button onClick={handleOpenNew} size="sm">
              <Plus className="mr-1.5 size-4" aria-hidden />
              Novo Tipo
            </Button>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingType ? "Editar tipo de produto" : "Criar tipo de produto"}</DialogTitle>
                <DialogDescription>
                  Um tipo de produto define quais atributos um produto deve ter (ex: Tamanho, Cor,
                  Material).
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Tipo</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Tênis"
                      {...form.register("name")}
                      onChange={(e) => {
                        form.register("name").onChange(e);
                        // Auto-slugify
                        const slug = e.target.value
                          .toLowerCase()
                          .normalize("NFD")
                          .replace(/[\u0300-\u036f]/g, "")
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/(^-|-$)+/g, "");
                        form.setValue("slug", slug);
                      }}
                    />
                    {form.formState.errors.name && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input id="slug" placeholder="ex: tenis" {...form.register("slug")} />
                    {form.formState.errors.slug && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.slug.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Campos Dinâmicos</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ name: "", kind: "text", required: false })}
                    >
                      Adicionar Campo
                    </Button>
                  </div>

                  {fields.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md">
                      Nenhum campo dinâmico adicionado.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="flex items-start gap-4 p-4 border rounded-md relative"
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-2 h-6 w-6 p-0 text-destructive"
                            onClick={() => remove(index)}
                          >
                            ×
                          </Button>
                          <div className="grid flex-1 grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>Nome do campo</Label>
                              <Input
                                placeholder="Ex: Material ou Tamanho"
                                {...form.register(`fields.${index}.name`)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Tipo de dado</Label>
                              <Select
                                onValueChange={(val) =>
                                  form.setValue(
                                    `fields.${index}.kind`,
                                    val as "text" | "number" | "boolean" | "select_single" | "option_group",
                                  )
                                }
                                defaultValue={field.kind}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="text">Texto livre</SelectItem>
                                  <SelectItem value="number">Número</SelectItem>
                                  <SelectItem value="boolean">Verdadeiro/Falso</SelectItem>
                                  <SelectItem value="select_single">Seleção única</SelectItem>
                                  <SelectItem value="option_group">Matriz de Variações (Grade)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2 pt-8">
                                <Checkbox
                                  id={`req-${index}`}
                                  onCheckedChange={(checked) =>
                                    form.setValue(`fields.${index}.required`, !!checked)
                                  }
                                />
                                <Label htmlFor={`req-${index}`} className="text-sm font-normal">
                                  Obrigatório
                                </Label>
                              </div>
                            </div>
                            {form.watch(`fields.${index}.kind`) === "option_group" && (
                              <div className="space-y-2 md:col-span-3">
                                <Label className="text-xs text-muted-foreground">
                                  Valores permitidos (separados por vírgula)
                                </Label>
                                <Input
                                  placeholder="Ex: 34, 35, 36, Preto, Branco"
                                  onChange={(e) => {
                                    const opts = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                                    form.setValue(`fields.${index}.options`, opts);
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Salvando..." : "Salvar Tipo"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
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

      {filteredTypes.length === 0 ? (
        <EmptyState
          title="Nenhum tipo de produto"
          description={
            searchQuery
              ? "Tente alterar os termos da sua busca."
              : "Crie tipos de produtos para definir esquemas adaptativos de atributos, como tamanhos e materiais."
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
                  <TableHead>Campos Dinâmicos</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-[80px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTypes.map(
                  (type: {
                    id: string;
                    name: string;
                    slug: string;
                    field_schema: unknown;
                    created_at: string;
                  }) => (
                    <TableRow key={type.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold text-sm text-foreground">{type.name}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{type.slug}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {Array.isArray(type.field_schema) ? type.field_schema.length : 0} campos
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(type.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Ações do tipo">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEdit(type)}>
                              <Edit className="mr-2 size-3.5" />
                              Editar Tipo
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(type.id)}
                            >
                              <Trash2 className="mr-2 size-3.5" />
                              Excluir Tipo
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

