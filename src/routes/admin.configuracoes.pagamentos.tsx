import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Save, QrCode, AlertTriangle } from "lucide-react";

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
import { getPaymentSettings, savePaymentSettings } from "@/services/store.functions";

export const Route = createFileRoute("/admin/configuracoes/pagamentos")({
  head: () => ({ meta: [{ title: "Métodos de Pagamento — Hr Shoes" }] }),
  loader: async () => {
    const [methodsRes, pixRes] = await Promise.all([
      listManualPaymentMethods(),
      getPaymentSettings().catch(() => ({ status: "error" as const, data: null })),
    ]);
    return {
      methods: methodsRes.status === "error" ? [] : methodsRes.data || [],
      pixSettings: pixRes.status === "ok" ? pixRes.data : null,
    };
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
  const { methods, pixSettings } = Route.useLoaderData() as {
    methods: PaymentMethod[];
    pixSettings: { pix_key?: string; payment_instructions?: string } | null;
  };
  const router = useRouter();

  // PIX config state
  const [pixKey, setPixKey] = useState(pixSettings?.pix_key || "");
  const [paymentInstructions, setPaymentInstructions] = useState(
    pixSettings?.payment_instructions || "",
  );
  const [isSavingPix, setIsSavingPix] = useState(false);

  // Method dialog state
  const [open, setOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PaymentMethod | null>(null);

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

  // Save PIX configuration
  const handleSavePix = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPix(true);
    try {
      const res = await savePaymentSettings({
        data: {
          pix_key: pixKey,
          payment_instructions: paymentInstructions,
        },
      });
      if (res.status === "success") {
        toast.success(
          "Configurações de PIX salvas! Os clientes verão estas informações nos pedidos.",
        );
        router.invalidate();
      } else {
        toast.error("Erro ao salvar configurações PIX.");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro inesperado");
    } finally {
      setIsSavingPix(false);
    }
  };

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

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deleteManualPaymentMethod({ data: { id: deleteTarget.id } });
      if (res.status === "success") {
        toast.success("Método excluído.");
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao excluir.");
      }
    } catch (e) {
      toast.error("Erro inesperado");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Configurações"
        title="Pagamentos"
        description="Configure sua chave PIX, instruções e métodos manuais disponíveis no checkout."
      />

      {/* PIX / Instruções Globais */}
      <div className="rounded-xl border bg-card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <QrCode className="size-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Chave PIX e Instruções de Pagamento</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Estas informações aparecem automaticamente nos pedidos dos clientes quando aguardam
              pagamento.
            </p>
          </div>
        </div>

        <form onSubmit={handleSavePix} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pix-key">Chave PIX</Label>
            <Input
              id="pix-key"
              placeholder="celular@email.com / 00.000.000/0001-00 / chave aleatória"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Esta chave será exibida ao cliente no detalhes do pedido quando o pagamento for via
              PIX.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-instructions">Instruções Complementares</Label>
            <Textarea
              id="payment-instructions"
              placeholder="Ex: Envie o comprovante para o nosso WhatsApp após o pagamento. Horário de atendimento: Seg–Sex 9h–18h."
              rows={3}
              value={paymentInstructions}
              onChange={(e) => setPaymentInstructions(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSavingPix}>
              <Save className="mr-2 size-4" />
              {isSavingPix ? "Salvando..." : "Salvar Configurações PIX"}
            </Button>
          </div>
        </form>
      </div>

      {/* Métodos Manuais */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Métodos Manuais Adicionais</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ficha, carnê, boleto manual ou qualquer condição especial com taxas ou descontos.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Método
          </Button>
        </div>

        {methods.length === 0 ? (
          <EmptyState
            title="Nenhum método manual adicional"
            description="Crie métodos como ficha, carnê ou condições especiais com taxas e descontos."
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
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => openEdit(method)}
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget(method)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Dialog Create/Edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? "Editar Método" : "Novo Método de Pagamento"}
            </DialogTitle>
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
              <Switch checked={isActiveValue} onCheckedChange={(c) => setValue("is_active", c)} />
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              Excluir método de pagamento?
            </DialogTitle>
            <DialogDescription>
              O método <strong>"{deleteTarget?.name}"</strong> não aparecerá mais como opção no
              checkout. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
