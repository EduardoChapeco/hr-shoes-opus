import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Calculator,
  History,
  Lock,
  Play,
  ReceiptText,
  DollarSign,
  AlertTriangle,
} from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { ErrorState, EmptyState } from "@/components/state/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  addRegisterEntry,
  closeRegister,
  getActiveRegister,
  openRegister,
} from "@/services/cash.functions";
import { parseCurrencyInputToCents } from "@/lib/cash";
import { formatDateTime } from "@/lib/datetime";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/admin/caixa/")({
  head: () => ({ meta: [{ title: "Caixa - Hr Shoes" }] }),
  loader: async () => {
    return await getActiveRegister();
  },
  errorComponent: ({ error }) => <CashRegisterError error={error} />,
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

function CashRegisterError({ error }: { error: Error }) {
  const isUnauthorized = error.message.includes("Não autorizado") || error.message.includes("loja");
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operação"
        title="Caixa"
        description="Acompanhamento e controle financeiro do ponto de venda."
      />
      {isUnauthorized ? (
        <ErrorState
          title="Loja ou Acesso não configurado"
          description="Sua conta de usuário não está vinculada a nenhuma loja ativa. Vá em Configurações > Equipe para associar o seu perfil a uma loja."
        />
      ) : (
        <ErrorState
          title="Não foi possível carregar o caixa"
          description={error.message || "O módulo de Caixa retornou uma falha inesperada."}
        />
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  icon: typeof Calculator;
  tone?: "neutral" | "income" | "expense";
}) {
  const toneClass =
    tone === "income"
      ? "bg-success/15 text-success"
      : tone === "expense"
        ? "bg-destructive/10 text-destructive"
        : "bg-muted text-muted-foreground";

  return (
    <Card>
      <CardContent className="flex min-h-28 items-center gap-4 p-5">
        <span className={`grid size-11 shrink-0 place-items-center rounded-lg ${toneClass}`}>
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function translateMethod(method: string) {
  const map: Record<string, string> = {
    cash: "Dinheiro",
    pix: "Pix",
    credit: "Crédito",
    debit: "Débito",
    other: "Outro",
  };
  return map[method] || method;
}

function CashRegisterPage() {
  const register = Route.useLoaderData();
  const router = useRouter();

  const [isOpening, setIsOpening] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isAddingEntry, setIsAddingEntry] = useState(false);

  const openForm = useForm<z.infer<typeof OpenRegisterSchema>>({
    resolver: zodResolver(OpenRegisterSchema),
    defaultValues: { initialBalance: "", notes: "" },
  });

  const closeForm = useForm<z.infer<typeof CloseRegisterSchema>>({
    resolver: zodResolver(CloseRegisterSchema),
    defaultValues: { countedBalance: "", notes: "" },
  });

  const entryForm = useForm<z.infer<typeof EntrySchema>>({
    resolver: zodResolver(EntrySchema),
    defaultValues: { amount: "", type: "expense", description: "" },
  });

  const handleOpen = async (data: z.infer<typeof OpenRegisterSchema>) => {
    setIsOpening(true);
    try {
      await openRegister({
        data: {
          initialBalanceCents: parseCurrencyInputToCents(data.initialBalance),
          notes: data.notes,
        },
      });
      toast.success("Caixa aberto com sucesso");
      openForm.reset();
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
      const res = await closeRegister({
        data: {
          registerId: register.id,
          countedBalanceCents: parseCurrencyInputToCents(data.countedBalance),
          notes: data.notes,
        },
      });

      if (res.discrepancy) {
        toast.warning(
          `Caixa fechado com diferença. Esperado: ${formatMoney(res.expected)}, informado: ${formatMoney(res.counted)}`,
        );
      } else {
        toast.success("Caixa fechado sem diferenças.");
      }
      closeForm.reset();
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
      const cents = parseCurrencyInputToCents(data.amount);
      await addRegisterEntry({
        data: {
          registerId: register.id,
          amountCents: data.type === "expense" ? -cents : cents,
          method: "cash",
          description: data.description,
        },
      });
      toast.success("Lançamento adicionado");
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
        <PageHeader
          eyebrow="Operação"
          title="Caixa"
          description="Abra o turno antes de registrar vendas de balcão, sangrias ou reforços."
          actions={
            <Button variant="outline" asChild>
              <Link to="/admin/caixa/turnos">
                <History className="size-4" aria-hidden />
                Turnos
              </Link>
            </Button>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <EmptyState
            title="Nenhum caixa aberto"
            description="Sem turno ativo, o sistema bloqueia lançamentos para preservar o ledger financeiro."
            className="min-h-80"
          />

          <Card>
            <CardHeader>
              <CardTitle>Abertura de turno</CardTitle>
              <CardDescription>
                O saldo inicial entra como base do caixa. Movimentações futuras sempre viram
                lançamentos.
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
                        <FormLabel>Fundo de troco</FormLabel>
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
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Opcional" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isOpening}>
                    <Play className="size-4 animate-pulse mr-1" aria-hidden />
                    Abrir caixa
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operação"
        title="Caixa"
        description={`Turno aberto em ${formatDateTime(register.opened_at)} por ${
          register.opened_by_profile?.full_name ?? "responsável não identificado"
        }.`}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/admin/caixa/lancamentos">
                <ReceiptText className="size-4" aria-hidden />
                Lançamentos
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/caixa/turnos">
                <History className="size-4" aria-hidden />
                Turnos
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Saldo atual em dinheiro"
          value={formatMoney(register.currentBalanceCents)}
          icon={DollarSign}
          tone="income"
        />
        <MetricCard
          label="Entradas manuais"
          value={formatMoney(register.incomeCents)}
          icon={ArrowDownLeft}
          tone="income"
        />
        <MetricCard
          label="Saídas e sangrias"
          value={formatMoney(register.expenseCents)}
          icon={ArrowUpRight}
          tone="expense"
        />
        <MetricCard
          label="Fundo inicial"
          value={formatMoney(register.initial_balance_cents)}
          icon={Calculator}
        />
      </div>

      {/* Consolidação por meio de recebimento */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground flex items-center gap-1.5 text-base">
          <Calculator className="size-4 text-primary" /> Conciliação e Formas de Recebimento
        </h3>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          <Card className="p-4 bg-muted/40">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Dinheiro em gaveta
            </p>
            <p className="text-xl font-bold mt-1 text-foreground">
              {formatMoney(register.methodTotals.cash)}
            </p>
          </Card>
          <Card className="p-4 bg-muted/40">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              PIX Direto
            </p>
            <p className="text-xl font-bold mt-1 text-foreground">
              {formatMoney(register.methodTotals.pix)}
            </p>
          </Card>
          <Card className="p-4 bg-muted/40">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Cartão de Crédito
            </p>
            <p className="text-xl font-bold mt-1 text-foreground">
              {formatMoney(register.methodTotals.credit)}
            </p>
          </Card>
          <Card className="p-4 bg-muted/40">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Cartão de Débito
            </p>
            <p className="text-xl font-bold mt-1 text-foreground">
              {formatMoney(register.methodTotals.debit)}
            </p>
          </Card>
          <Card className="p-4 bg-muted/40 border border-primary/20 bg-primary/5">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">
              Total Acumulado
            </p>
            <p className="text-xl font-bold mt-1 text-primary">
              {formatMoney(register.totalInDrawerCents)}
            </p>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Últimos lançamentos</CardTitle>
              <CardDescription>
                Ledger do turno ativo. Saldo final nunca é editado diretamente.
              </CardDescription>
            </div>
            <Badge variant="success">Aberto</Badge>
          </CardHeader>
          <CardContent>
            {register.recentEntries.length > 0 ? (
              <div className="divide-y divide-border rounded-lg border">
                {register.recentEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{entry.description}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDateTime(entry.created_at)} — {translateMethod(entry.method)}
                      </p>
                    </div>
                    <p
                      className={
                        entry.amount_cents >= 0
                          ? "font-semibold text-green-600"
                          : "font-semibold text-red-600"
                      }
                    >
                      {entry.amount_cents >= 0 ? "+" : "-"}
                      {formatMoney(Math.abs(entry.amount_cents))}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Sem lançamentos neste turno"
                description="Quando houver venda, reforço ou sangria, o movimento aparece aqui."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações do turno</CardTitle>
            <CardDescription>Operações que alteram caixa passam pelo servidor.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <ArrowRightLeft className="size-4 mr-2" aria-hidden />
                  Lançamento avulso
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo lançamento</DialogTitle>
                  <DialogDescription>
                    Registre reforço, despesa ou sangria em dinheiro no turno aberto.
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
                              <option value="expense">Sangria / saída</option>
                              <option value="income">Entrada / reforço</option>
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
                          <FormLabel>Valor</FormLabel>
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
                      {isAddingEntry ? "Registrando..." : "Registrar"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full justify-start">
                  <Lock className="size-4 mr-2" aria-hidden />
                  Fechar caixa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Fechamento de turno</DialogTitle>
                  <DialogDescription>
                    Informe o dinheiro contado. O servidor compara com o saldo esperado do ledger.
                  </DialogDescription>
                </DialogHeader>
                <Form {...closeForm}>
                  <form onSubmit={closeForm.handleSubmit(handleClose)} className="space-y-4">
                    <FormField
                      control={closeForm.control}
                      name="countedBalance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor contado em gaveta</FormLabel>
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
                            <Textarea placeholder="Justifique possíveis diferenças" {...field} />
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
                      {isClosing ? "Fechando..." : "Confirmar fechamento"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardContent>
          <CardFooter className="block border-t text-xs text-muted-foreground pt-4">
            PDV, vendas, Pix e cartão devem registrar entradas por services dedicados; esta tela só
            opera o turno e movimentos manuais.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
