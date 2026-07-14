import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Calculator, Play, Lock, HandCoins, ArrowRightLeft } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getActiveRegister,
  openRegister,
  closeRegister,
  addRegisterEntry,
} from "@/services/cash.functions";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/admin/caixa")({
  head: () => ({ meta: [{ title: "Frente de Caixa — Hr Shoes" }] }),
  loader: async () => {
    return await getActiveRegister();
  },
  component: CashRegisterPage,
});

const OpenRegisterSchema = z.object({
  initialBalance: z.string().min(1, "Informe o troco inicial"),
  notes: z.string().optional(),
});

const CloseRegisterSchema = z.object({
  countedBalance: z.string().min(1, "Informe quanto dinheiro há no caixa"),
  notes: z.string().optional(),
});

const EntrySchema = z.object({
  amount: z.string().min(1, "Informe o valor"),
  type: z.enum(["income", "expense"]),
  description: z.string().min(3, "Descrição obrigatória"),
});

function CashRegisterPage() {
  const register = Route.useLoaderData();
  const router = useRouter();

  const [isOpening, setIsOpening] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isAddingEntry, setIsAddingEntry] = useState(false);

  const openForm = useForm({
    resolver: zodResolver(OpenRegisterSchema),
    defaultValues: { initialBalance: "", notes: "" },
  });

  const closeForm = useForm({
    resolver: zodResolver(CloseRegisterSchema),
    defaultValues: { countedBalance: "", notes: "" },
  });

  const entryForm = useForm<z.infer<typeof EntrySchema>>({
    resolver: zodResolver(EntrySchema),
    defaultValues: { amount: "", type: "expense", description: "" },
  });

  const parseMoneyInput = (val: string) => {
    const clean = val.replace(/\D/g, "");
    return parseInt(clean || "0", 10);
  };

  const handleOpen = async (data: z.infer<typeof OpenRegisterSchema>) => {
    setIsOpening(true);
    try {
      const cents = parseMoneyInput(data.initialBalance);
      await openRegister({ data: { initialBalanceCents: cents, notes: data.notes } });
      toast.success("Caixa aberto com sucesso");
      router.invalidate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao abrir caixa");
    } finally {
      setIsOpening(false);
    }
  };

  const handleClose = async (data: z.infer<typeof CloseRegisterSchema>) => {
    if (!register) return;
    setIsClosing(true);
    try {
      const cents = parseMoneyInput(data.countedBalance);
      const res = await closeRegister({
        data: {
          registerId: register.id,
          countedBalanceCents: cents,
          notes: data.notes,
        },
      });
      if (res.discrepancy) {
        toast.warning(
          `Caixa fechado com quebra. Esperado: ${formatMoney(res.expected)}, Informado: ${formatMoney(res.counted)}`,
        );
      } else {
        toast.success("Caixa fechado sem diferenças.");
      }
      router.invalidate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao fechar caixa");
    } finally {
      setIsClosing(false);
    }
  };

  const handleEntry = async (data: z.infer<typeof EntrySchema>) => {
    if (!register) return;
    setIsAddingEntry(true);
    try {
      const cents = parseMoneyInput(data.amount);
      const finalCents = data.type === "expense" ? -cents : cents;

      await addRegisterEntry({
        data: {
          registerId: register.id,
          amountCents: finalCents,
          method: "cash",
          description: data.description,
        },
      });
      toast.success("Lançamento registrado");
      entryForm.reset();
      router.invalidate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao lançar");
    } finally {
      setIsAddingEntry(false);
    }
  };

  if (!register) {
    return (
      <div className="space-y-6">
        <PageHeader title="Frente de Caixa" description="Controle de Turnos e PDV" />

        <Card className="max-w-md mx-auto mt-12">
          <CardHeader className="text-center">
            <div className="mx-auto bg-muted w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Calculator className="w-6 h-6 text-muted-foreground" />
            </div>
            <CardTitle>Nenhum caixa aberto</CardTitle>
            <CardDescription>
              Para iniciar as vendas e movimentações de balcão, abra o turno atual.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...openForm}>
              <form onSubmit={openForm.handleSubmit(handleOpen)} className="space-y-4">
                <FormField
                  control={openForm.control}
                  name="initialBalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fundo de Troco (R$)</FormLabel>
                      <FormControl>
                        <Input placeholder="0,00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={openForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações (opcional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Anotações para este turno..." {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isOpening}>
                  <Play className="mr-2 h-4 w-4" />
                  Abrir Turno
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Frente de Caixa" description="Turno atual em andamento" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-xl">Resumo do Turno</CardTitle>
              <CardDescription>
                Aberto em {new Date(register.opened_at).toLocaleString("pt-BR")} por{" "}
                {register.opened_by_profile.full_name}
              </CardDescription>
            </div>
            <Badge variant="default" className="bg-green-600">
              Ativo
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg bg-muted/20">
                <div className="text-sm text-muted-foreground mb-1">Troco Inicial</div>
                <div className="text-2xl font-bold">
                  {formatMoney(register.initial_balance_cents)}
                </div>
              </div>
              <div className="p-4 border rounded-lg bg-muted/20">
                <div className="text-sm text-muted-foreground mb-1">Saldo em Caixa (Dinheiro)</div>
                <div className="text-2xl font-bold text-primary">
                  {formatMoney(register.currentBalanceCents)}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-6">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Lançamento Avulso / Sangria
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Lançamento</DialogTitle>
                  <DialogDescription>
                    Registre entrada de troco extra ou sangria de gaveta.
                  </DialogDescription>
                </DialogHeader>
                <Form {...entryForm}>
                  <form onSubmit={entryForm.handleSubmit(handleEntry)} className="space-y-4">
                    <FormField
                      control={entryForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <FormControl>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              {...field}
                            >
                              <option value="expense">Sangria / Saída</option>
                              <option value="income">Entrada / Reforço</option>
                            </select>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={entryForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor (R$)</FormLabel>
                          <FormControl>
                            <Input placeholder="0,00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={entryForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Input placeholder="Motivo do lançamento" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isAddingEntry}>
                      Registrar
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Lock className="mr-2 h-4 w-4" />
                  Fechar Caixa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Fechamento de Turno</DialogTitle>
                  <DialogDescription>
                    Conte o dinheiro em gaveta e informe o valor real. O sistema validará se há
                    quebra.
                  </DialogDescription>
                </DialogHeader>
                <Form {...closeForm}>
                  <form onSubmit={closeForm.handleSubmit(handleClose)} className="space-y-4">
                    <FormField
                      control={closeForm.control}
                      name="countedBalance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Contado em Gaveta (R$)</FormLabel>
                          <FormControl>
                            <Input placeholder="0,00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={closeForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Justifique possíveis diferenças..." {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      variant="destructive"
                      className="w-full"
                      disabled={isClosing}
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Confirmar Fechamento
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
