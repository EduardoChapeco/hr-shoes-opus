import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
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
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Printer,
  CreditCard,
  QrCode,
  User,
  UserPlus,
  Package,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  addRegisterEntry,
  closeRegister,
  getActiveRegister,
  openRegister,
  processPOSSale,
} from "@/services/cash.functions";
import { listAdminProducts } from "@/services/admin-catalog.functions";
import { listCustomers, createCustomer } from "@/services/crm.functions";
import { parseCurrencyInputToCents } from "@/lib/cash";
import { formatDateTime } from "@/lib/datetime";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/admin/caixa/")({
  head: () => ({ meta: [{ title: "PDV & Frente de Caixa — Hr Shoes" }] }),
  loader: async () => {
    const [registerRes, productsRes] = await Promise.all([
      getActiveRegister(),
      listAdminProducts(),
    ]);
    return {
      register: registerRes,
      products: productsRes.status === "ok" ? productsRes.data : [],
    };
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

function CashRegisterError({ error }: { error: Error }) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operação Comercial"
        title="Frente de Caixa (PDV)"
        description="Erro no carregamento do caixa ou permissões insuficientes."
      />
      <ErrorState
        title="Falha ao carregar caixa"
        description={error.message || "Verifique se sua conta de usuário está vinculada a uma loja ativa."}
      />
    </div>
  );
}

function CashRegisterPage() {
  const { register, products } = Route.useLoaderData();
  const router = useRouter();

  const [isOpening, setIsOpening] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isProcessingSale, setIsProcessingSale] = useState(false);

  // PDV Cart State
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<
    Array<{
      variantId: string;
      title: string;
      sku: string;
      priceCents: number;
      qty: number;
    }>
  >([]);
  const [discountCentsInput, setDiscountCentsInput] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "pix" | "credit" | "debit" | "other">("cash");
  const [customerNameInput, setCustomerNameInput] = useState("Cliente Avulso Balcão");
  const [amountPaidInput, setAmountPaidInput] = useState("");
  const [lastReceipt, setLastReceipt] = useState<any | null>(null);

  // CRM Customer selector states
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  const fetchCustomers = async () => {
    try {
      const list = await listCustomers();
      setCustomersList(list || []);
    } catch (e) {
      console.error("Erro ao listar clientes para o caixa:", e);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerForm.fullName || !newCustomerForm.email) {
      toast.error("Nome e E-mail são obrigatórios");
      return;
    }
    setIsSavingCustomer(true);
    try {
      const res = await createCustomer({
        data: {
          fullName: newCustomerForm.fullName,
          email: newCustomerForm.email,
          phone: newCustomerForm.phone,
          tags: ["PDV Balcão"],
          notes: "Cadastrado via terminal de caixa",
        },
      });

      if (res.status === "success") {
        toast.success("Cliente cadastrado!");
        setIsNewCustomerOpen(false);
        setNewCustomerForm({ fullName: "", email: "", phone: "" });
        
        await fetchCustomers();
        setSelectedCustomerId(res.customerId);
        setCustomerNameInput(newCustomerForm.fullName);
      } else {
        toast.error(res.message || "Erro ao cadastrar cliente");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro inesperado");
    } finally {
      setIsSavingCustomer(false);
    }
  };

  // Forms for open/close/entry
  const openForm = useForm<z.infer<typeof OpenRegisterSchema>>({
    resolver: zodResolver(OpenRegisterSchema),
    defaultValues: { initialBalance: "100.00", notes: "" },
  });

  const closeForm = useForm<z.infer<typeof CloseRegisterSchema>>({
    resolver: zodResolver(CloseRegisterSchema),
    defaultValues: { countedBalance: "", notes: "" },
  });

  // Flat variants list derived from products
  const availableVariants = useMemo(() => {
    const list: Array<{
      variantId: string;
      title: string;
      sku: string;
      priceCents: number;
      coverUrl?: string;
    }> = [];

    for (const p of products) {
      const cover = p.product_media?.[0]?.url;
      list.push({
        variantId: p.id, // default to product id if variants array is not directly exposed
        title: p.title,
        sku: p.slug,
        priceCents: p.price_cents,
        coverUrl: cover,
      });
    }
    return list;
  }, [products]);

  const filteredVariants = useMemo(() => {
    return availableVariants.filter(
      (v) =>
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.sku.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [availableVariants, searchQuery]);

  // Cart helper functions
  const handleAddToCart = (variant: typeof availableVariants[0]) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.variantId === variant.variantId);
      if (existing) {
        return prev.map((i) =>
          i.variantId === variant.variantId ? { ...i, qty: i.qty + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          variantId: variant.variantId,
          title: variant.title,
          sku: variant.sku,
          priceCents: variant.priceCents,
          qty: 1,
        },
      ];
    });
  };

  const handleUpdateQty = (variantId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((i) => (i.variantId === variantId ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0),
    );
  };

  // Cart Totals
  const cartSubtotalCents = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.priceCents * item.qty, 0);
  }, [cartItems]);

  const discountCents = useMemo(() => {
    const val = parseFloat(discountCentsInput.replace(",", "."));
    return isNaN(val) ? 0 : Math.round(val * 100);
  }, [discountCentsInput]);

  const cartTotalCents = Math.max(0, cartSubtotalCents - discountCents);

  const amountPaidCents = useMemo(() => {
    const val = parseFloat(amountPaidInput.replace(",", "."));
    return isNaN(val) ? cartTotalCents : Math.round(val * 100);
  }, [amountPaidInput, cartTotalCents]);

  const changeCents = paymentMethod === "cash" ? Math.max(0, amountPaidCents - cartTotalCents) : 0;

  // Execute POS Sale
  const handleFinalizePOSSale = async () => {
    if (!register || cartItems.length === 0 || isProcessingSale) return;

    setIsProcessingSale(true);
    try {
      const res = await processPOSSale({
        data: {
          registerId: register.id,
          items: cartItems,
          paymentMethod,
          discountCents,
          customerName: customerNameInput,
          customerId: selectedCustomerId,
          amountPaidCents,
        },
      });

      if (res.status === "success") {
        if (res.hasNegativeStock) {
          toast.warning("Venda concluída, mas o estoque ficou negativo em alguns produtos. Recomendamos auditoria/recontagem de estoque.", { duration: 8000 });
        } else {
          toast.success("Venda de balcão concluída!");
        }
        setLastReceipt(res);
        setCartItems([]);
        setDiscountCentsInput("0");
        setAmountPaidInput("");
        setSelectedCustomerId(null);
        setCustomerNameInput("Cliente Avulso Balcão");
        router.invalidate();
      } else {
        toast.error("Erro ao registrar venda.");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao finalizar venda.");
    } finally {
      setIsProcessingSale(false);
    }
  };

  // Open Register Action
  const handleOpen = async (data: z.infer<typeof OpenRegisterSchema>) => {
    setIsOpening(true);
    try {
      await openRegister({
        data: {
          initialBalanceCents: parseCurrencyInputToCents(data.initialBalance),
          notes: data.notes,
        },
      });
      toast.success("Caixa aberto com sucesso!");
      openForm.reset();
      router.invalidate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao abrir caixa");
    } finally {
      setIsOpening(false);
    }
  };

  // Close Register Action
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

  // If Register is Closed: Show Opening Card
  if (!register) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader
          eyebrow="Frente de Loja / PDV"
          title="Caixa Fechado"
          description="Abra o turno informando o fundo de troco inicial para iniciar as vendas de balcão."
        />

        <Card className="border-warning/30 bg-warning/10 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="size-5 text-warning-foreground" />
              Abertura Obrigatória de Turno
            </CardTitle>
            <CardDescription>
              Sem um caixa aberto, vendas de balcão e lançamentos financeiros permanecem bloqueados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...openForm}>
              <form onSubmit={openForm.handleSubmit(handleOpen)} className="space-y-4 max-w-md">
                <FormField
                  control={openForm.control}
                  name="initialBalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fundo de Troco Inicial (R$) *</FormLabel>
                      <FormControl>
                        <Input placeholder="100,00" {...field} />
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
                      <FormLabel>Observações de Abertura</FormLabel>
                      <FormControl>
                        <Input placeholder="Turno manhã / Operador..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isOpening} size="lg" className="w-full font-bold">
                  {isOpening ? "Abrindo..." : "Abrir Turno de Caixa"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active Register View (PDV Terminal)
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Caixa Aberto • Turno #${register.id.slice(0, 8)}`}
        title="Frente de Caixa & PDV Balcão"
        description={`Operador: ${register.opened_by_profile?.full_name || "Staff"} • Aberto às ${formatDateTime(register.opened_at)}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="success" className="text-xs px-3 py-1 font-bold uppercase tracking-wider">
              Gaveta: {formatMoney(register.currentBalanceCents)}
            </Badge>
            <Button variant="outline" asChild size="sm">
              <Link to="/admin/comprovantes">
                <ReceiptText className="mr-1.5 size-4" /> Comprovantes
              </Link>
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="pdv" className="w-full">
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="pdv" className="text-xs">
            Venda Balcão (PDV)
          </TabsTrigger>
          <TabsTrigger value="lancamentos" className="text-xs">
            Extrato ({register.recentEntries?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="fechamento" className="text-xs">
            Fechamento
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: TERMINAL PDV BALCÃO */}
        <TabsContent value="pdv" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LADO ESQUERDO: Busca de Produtos e Catálogo (7 Colunas) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar produto por nome, código ou SKU..."
                  className="pl-9 text-sm h-11 bg-card"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[580px] overflow-y-auto pr-1">
                {filteredVariants.map((variant) => (
                  <div
                    key={variant.variantId}
                    onClick={() => handleAddToCart(variant)}
                    className="p-3 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-xs transition-all cursor-pointer flex items-center gap-3 group"
                  >
                    {variant.coverUrl ? (
                      <img src={variant.coverUrl} alt="" className="size-12 rounded-lg object-cover border shrink-0" />
                    ) : (
                      <div className="size-12 rounded-lg bg-muted border flex items-center justify-center shrink-0">
                        <Package className="size-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                        {variant.title}
                      </h4>
                      <p className="text-xs text-muted-foreground font-mono">/{variant.sku}</p>
                      <span className="font-extrabold text-sm text-foreground block mt-0.5">
                        {formatMoney(variant.priceCents)}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0 group-hover:bg-primary group-hover:text-primary-foreground">
                      <Plus className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* LADO DIREITO: Carrinho do Balcão e Fechamento (5 Colunas) */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="rounded-xl border border-border bg-card shadow-xs">
                <CardHeader className="py-3 px-4 border-b bg-muted/30 flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShoppingCart className="size-4 text-primary" />
                    Carrinho do Balcão
                  </CardTitle>
                  <Badge variant="default" className="text-xs font-bold">
                    {cartItems.reduce((a, b) => a + b.qty, 0)} itens
                  </Badge>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {/* Item List */}
                  {cartItems.length === 0 ? (
                    <div className="py-12 text-center text-xs text-muted-foreground">
                      Clique em um produto da lista à esquerda para adicionar ao carrinho do PDV.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {cartItems.map((item) => (
                        <div key={item.variantId} className="flex items-center justify-between p-2 rounded-lg border bg-muted/20">
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="font-bold text-xs truncate">{item.title}</p>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {formatMoney(item.priceCents)} x {item.qty}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              variant="outline"
                              size="icon"
                              className="size-6 text-xs"
                              onClick={() => handleUpdateQty(item.variantId, -1)}
                            >
                              <Minus className="size-3" />
                            </Button>
                            <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="size-6 text-xs"
                              onClick={() => handleUpdateQty(item.variantId, 1)}
                            >
                              <Plus className="size-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Customer & Discount Controls */}
                  <div className="space-y-3 pt-2 border-t">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Cliente Balcão</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-5 text-[10px] px-1 text-primary gap-1 hover:bg-primary/5"
                          onClick={() => setIsNewCustomerOpen(true)}
                        >
                          <UserPlus className="size-3" />
                          + Novo Cliente
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Select
                            value={selectedCustomerId || "guest"}
                            onValueChange={(val) => {
                              if (val === "guest") {
                                setSelectedCustomerId(null);
                                setCustomerNameInput("Cliente Avulso Balcão");
                              } else {
                                setSelectedCustomerId(val);
                                const found = customersList.find((c) => c.id === val);
                                setCustomerNameInput(found ? found.name : "Cliente Registrado");
                              }
                            }}
                          >
                            <SelectTrigger className="text-xs h-8 bg-card">
                              <SelectValue placeholder="Selecione o cliente" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="guest">Cliente Avulso (Não registrado)</SelectItem>
                              {customersList.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {selectedCustomerId === null && (
                          <Input
                            className="text-xs h-8 max-w-[150px]"
                            placeholder="Nome..."
                            value={customerNameInput}
                            onChange={(e) => setCustomerNameInput(e.target.value)}
                          />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Desconto (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          className="text-xs h-8"
                          placeholder="0,00"
                          value={discountCentsInput}
                          onChange={(e) => setDiscountCentsInput(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Meio de Pagamento</Label>
                        <Select
                          value={paymentMethod}
                          onValueChange={(v: any) => setPaymentMethod(v)}
                        >
                          <SelectTrigger className="text-xs h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Dinheiro</SelectItem>
                            <SelectItem value="pix">Pix QR Code</SelectItem>
                            <SelectItem value="credit">Cartão de Crédito</SelectItem>
                            <SelectItem value="debit">Cartão de Débito</SelectItem>
                            <SelectItem value="other">Outro / Cortesia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Cash Change Calculation */}
                    {paymentMethod === "cash" && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="space-y-1">
                          <Label className="text-xs">Valor Entregue (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            className="text-xs h-8 font-bold"
                            placeholder={ (cartTotalCents / 100).toFixed(2) }
                            value={amountPaidInput}
                            onChange={(e) => setAmountPaidInput(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Troco a Devolver</Label>
                          <div className="h-8 rounded-md bg-success/15 border border-transparent flex items-center justify-center font-extrabold text-sm text-success">
                            {formatMoney(changeCents)}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order Summary */}
                    <div className="pt-2 border-t space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Subtotal:</span>
                        <span>{formatMoney(cartSubtotalCents)}</span>
                      </div>
                      {discountCents > 0 && (
                        <div className="flex justify-between text-xs text-success font-semibold">
                          <span>Desconto:</span>
                          <span>- {formatMoney(discountCents)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-base font-extrabold text-foreground pt-1 border-t">
                        <span>Total Final:</span>
                        <span>{formatMoney(cartTotalCents)}</span>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      className="w-full font-extrabold text-sm mt-2"
                      disabled={cartItems.length === 0 || isProcessingSale}
                      onClick={handleFinalizePOSSale}
                    >
                      {isProcessingSale ? "Finalizando..." : "Finalizar Venda de Balcão"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: EXTRATO DE LANÇAMENTOS */}
        <TabsContent value="lancamentos" className="mt-6">
          <Card className="rounded-xl border border-border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Extrato de Lançamentos do Turno</CardTitle>
                <CardDescription>Vendas, reforços de troco e sangrias registradas.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {(!register.recentEntries || register.recentEntries.length === 0) ? (
                <EmptyState title="Nenhum lançamento" description="Nenhuma movimentação realizada neste turno." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Horário</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Forma de Pagamento</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {register.recentEntries.map((entry: any) => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-xs font-mono">
                          {formatDateTime(entry.created_at)}
                        </TableCell>
                        <TableCell className="text-xs font-medium">{entry.description}</TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline">{entry.method}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-xs">
                          <span className={entry.amount_cents >= 0 ? "text-success" : "text-destructive"}>
                            {entry.amount_cents >= 0 ? "+" : ""}{formatMoney(entry.amount_cents)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: FECHAMENTO DE TURNO */}
        <TabsContent value="fechamento" className="mt-6">
          <Card className="max-w-xl mx-auto rounded-xl border border-border shadow-xs">
            <CardHeader>
              <CardTitle className="text-base">Encerrar Turno de Caixa</CardTitle>
              <CardDescription>Efetue a contagem cega do dinheiro na gaveta para encerrar o caixa.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...closeForm}>
                <form onSubmit={closeForm.handleSubmit(handleClose)} className="space-y-4">
                  <FormField
                    control={closeForm.control}
                    name="countedBalance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dinheiro Físico Contado na Gaveta (R$) *</FormLabel>
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
                        <FormLabel>Observações de Fechamento</FormLabel>
                        <FormControl>
                          <Input placeholder="Motivo de eventuais divergências..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" variant="destructive" disabled={isClosing} className="w-full font-bold">
                    {isClosing ? "Encerrando..." : "Confirmar Fechamento de Turno"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog do Comprovante da Venda */}
      <Dialog open={Boolean(lastReceipt)} onOpenChange={(open) => !open && setLastReceipt(null)}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-success">
              <CheckCircle2 className="size-6" /> Venda Concluída!
            </DialogTitle>
            <DialogDescription>Comprovante de Venda do Balcão</DialogDescription>
          </DialogHeader>

          {lastReceipt && (
            <div className="space-y-3 p-4 bg-muted/40 rounded-xl text-xs text-left border font-mono">
              <div className="flex justify-between border-b pb-2 font-bold">
                <span>Hr Shoes Store</span>
                <span>PDV #{lastReceipt.receiptId?.slice(0, 6)}</span>
              </div>
              <p>Cliente: {lastReceipt.customerName}</p>
              <p>Data: {formatDateTime(lastReceipt.timestamp)}</p>
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatMoney(lastReceipt.subtotalCents)}</span>
                </div>
                {lastReceipt.discountCents > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Desconto:</span>
                    <span>-{formatMoney(lastReceipt.discountCents)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t">
                  <span>Total Pago:</span>
                  <span>{formatMoney(lastReceipt.totalCents)}</span>
                </div>
                {lastReceipt.changeCents > 0 && (
                  <div className="flex justify-between font-bold text-success">
                    <span>Troco:</span>
                    <span>{formatMoney(lastReceipt.changeCents)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => window.print()} className="w-full text-xs">
              <Printer className="size-3.5 mr-1" /> Imprimir Comprovante
            </Button>
            <Button onClick={() => setLastReceipt(null)} className="w-full text-xs font-bold">
              Nova Venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog do Cadastro Rápido de Cliente no PDV */}
      <Dialog open={isNewCustomerOpen} onOpenChange={setIsNewCustomerOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Cadastro Rápido de Cliente</DialogTitle>
            <DialogDescription>
              Insira as informações do cliente para registrá-lo no caixa e vinculá-lo a esta venda.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCustomer} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="pdv-cli-name">Nome Completo *</Label>
              <Input
                id="pdv-cli-name"
                required
                value={newCustomerForm.fullName}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, fullName: e.target.value })}
                placeholder="Ex: Carlos Souza"
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pdv-cli-email">E-mail *</Label>
              <Input
                id="pdv-cli-email"
                type="email"
                required
                value={newCustomerForm.email}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                placeholder="carlos@exemplo.com"
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pdv-cli-phone">Telefone / WhatsApp</Label>
              <Input
                id="pdv-cli-phone"
                type="tel"
                value={newCustomerForm.phone}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                placeholder="(49) 99999-9999"
                className="h-9"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsNewCustomerOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSavingCustomer} className="font-bold">
                {isSavingCustomer ? "Salvando..." : "Confirmar e Vincular"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
