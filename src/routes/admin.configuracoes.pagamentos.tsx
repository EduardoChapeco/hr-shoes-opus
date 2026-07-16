import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Save } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/state/states";
import {
  listManualPaymentMethods,
  saveManualPaymentMethod,
  deleteManualPaymentMethod,
} from "@/services/payment.functions";

export const Route = createFileRoute("/admin/configuracoes/pagamentos")({
  head: () => ({ meta: [{ title: "Métodos de Pagamento — Hr Shoes" }] }),
  loader: async () => {
    const res = await listManualPaymentMethods();
    if (res.status === "error") throw new Error(res.message);
    return res.data || [];
  },
  component: ManualPaymentsPage,
});

interface PaymentMethod {
  id: string;
  name: string;
  instructions: string;
  surcharge_percentage: number;
  discount_percentage: number;
  is_active: boolean;
}

function ManualPaymentsPage() {
  const methods = Route.useLoaderData() as PaymentMethod[];
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      name: "",
      instructions: "",
      surcharge_percentage: 0,
      discount_percentage: 0,
      is_active: true,
    },
  });

  const isActiveValue = watch("is_active");

  const openCreate = () => {
    setEditingMethod(null);
    reset({
      name: "",
      instructions: "",
      surcharge_percentage: 0,
      discount_percentage: 0,
      is_active: true,
    });
    setOpen(true);
  };

  const openEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    reset({
      name: method.name,
      instructions: method.instructions || "",
      surcharge_percentage: Number(method.surcharge_percentage),
      discount_percentage: Number(method.discount_percentage),
      is_active: method.is_active,
    });
    setOpen(true);
  };

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const res = await saveManualPaymentMethod({
        data: {
          id: editingMethod?.id,
          name: values.name,
          instructions: values.instructions,
          surcharge_percentage: Number(values.surcharge_percentage),
          discount_percentage: Number(values.discount_percentage),
          is_active: values.is_active,
        },
      });

      if (res.status === "success") {
        toast.success(editingMethod ? "Método atualizado!" : "Método criado com sucesso!");
        setOpen(false);
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao salvar método.");
      }
    } catch (e) {
      toast.error("Erro inesperado");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este método de pagamento? Ele não aparecerá mais no checkout.")) return;
    try {
      const res = await deleteManualPaymentMethod({ data: { id } });
      if (res.status === "success") {
        toast.success("Método excluído.");
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao excluir.");
      }
    } catch (e) {
      toast.error("Erro inesperado");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configurações"
        title="Métodos de Pagamento"
        description="Configure Pix Manual, Carnê/Ficha e taxas ou descontos customizados para o checkout."
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Método
          </Button>
        }
      />

      {methods.length === 0 ? (
        <EmptyState
          title="Nenhum método manual"
          description="Crie Pix Manual ou Ficha para receber pagamentos diretamente."
          action={<Button onClick={openCreate}>Novo Método</Button>}
        />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Instruções</TableHead>
                <TableHead>Acréscimo</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {methods.map((method) => (
                <TableRow key={method.id}>
                  <TableCell className="font-semibold">{method.name}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {method.instructions || "-"}
                  </TableCell>
                  <TableCell className="text-destructive font-medium">
                    {Number(method.surcharge_percentage) > 0
                      ? `+${method.surcharge_percentage}%`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-green-600 font-medium">
                    {Number(method.discount_percentage) > 0
                      ? `-${method.discount_percentage}%`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        method.is_active
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {method.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-1.5">
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(method)}>
                      <Edit2 className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(method.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog for Edit/Create */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMethod ? "Editar Método" : "Novo Método de Pagamento"}</DialogTitle>
            <DialogDescription>
              Preencha os dados e taxas para exibição no checkout dos clientes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Método *</Label>
              <Input
                {...register("name", { required: true })}
                placeholder="Ex: Pix Direto, Ficha da Casa, Carnê"
              />
            </div>

            <div className="space-y-2">
              <Label>Instruções para o Cliente</Label>
              <Textarea
                {...register("instructions")}
                placeholder="Instruções para pagamento (chave Pix, conta bancária, etc.)"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Taxa de Acréscimo (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("surcharge_percentage", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label>Desconto (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("discount_percentage", { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div className="space-y-0.5">
                <Label>Status do Método</Label>
                <p className="text-xs text-muted-foreground">Exibir como opção ativa no checkout</p>
              </div>
              <Switch
                checked={isActiveValue}
                onCheckedChange={(c) => setValue("is_active", c)}
              />
            </div>

            <DialogFooter className="border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="mr-2 size-4" />
                {isSubmitting ? "Salvando..." : "Salvar Método"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
