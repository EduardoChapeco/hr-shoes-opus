import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { getCart, updateCartShipping } from "@/services/cart.functions";
import { processCheckout } from "@/services/checkout.functions";
import { initiatePaymentTransaction, getPublicPaymentMethods } from "@/services/payment.functions";
import { calculateShipping } from "@/services/shipping.functions";
import {
  CheckCircle2,
  Ticket,
  MessageCircle,
  User,
  Truck,
  CreditCard,
  ShoppingBag,
  AlertCircle,
  MapPin,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_store/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Hr Shoes" }] }),
  loader: async () => {
    const [cart, paymentMethodsRes] = await Promise.all([
      getCart(),
      getPublicPaymentMethods(),
    ]);

    return {
      cart: cart || {
        id: "",
        items: [],
        totalCents: 0,
        subtotalCents: 0,
        discountCents: 0,
        shippingCents: 0,
        shippingMethod: "",
        couponCode: null,
        itemCount: 0,
      },
      paymentMethods: paymentMethodsRes.status === "success" ? paymentMethodsRes.data : [],
    };
  },
  component: CheckoutPage,
});

interface ManualPaymentOption {
  id: string;
  name: string;
  instructions: string;
  surcharge_percentage: number;
  discount_percentage: number;
}

function CheckoutPage() {
  const { cart: initialCart, paymentMethods } = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();

  const [cart, setCart] = useState(initialCart);
  const [activeStep, setActiveStep] = useState(1); // 1: Identificação, 2: Entrega, 3: Pagamento, 4: Confirmar
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToken, setSuccessToken] = useState("");

  // Address inputs & calculations
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [noShippingRatesFound, setNoShippingRatesFound] = useState(false);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerDocument: "",
    customerPhone: "",
    paymentMethod: "pix" as "pix" | "manual" | "credit_card" | "receipt",
    paymentMethodId: "" as string, // UUID of chosen manual payment option
    shippingMethod: "manual_table" as "manual_table" | "pickup" | "manual_quote",
    shippingAddress: {
      zipcode: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
    },
  });

  // Keep local cart state synced on loader updates
  useEffect(() => {
    setCart(initialCart);
  }, [initialCart]);

  // Cep autofill & dynamic shipping cost calculation
  const handleCepChange = async (val: string) => {
    const cep = val.replace(/\D/g, "");
    setFormData((prev) => ({
      ...prev,
      shippingAddress: { ...prev.shippingAddress, zipcode: cep },
    }));

    if (cep.length === 8) {
      setIsCalculatingShipping(true);
      setNoShippingRatesFound(false);
      try {
        // Auto-fill address fields from ViaCep
        const zipRes = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const zipData = await zipRes.json();
        if (!zipData.erro) {
          setFormData((prev) => ({
            ...prev,
            shippingAddress: {
              ...prev.shippingAddress,
              street: zipData.logradouro || "",
              neighborhood: zipData.bairro || "",
              city: zipData.localidade || "",
              state: zipData.uf || "",
            },
          }));
        }

        // Calculate shipping rates
        const shipRes = await calculateShipping({ data: { zipcode: cep } });
        if (shipRes.status === "ok" && shipRes.data && shipRes.data.length > 0) {
          setShippingRates(shipRes.data);
          setNoShippingRatesFound(false);
        } else {
          setShippingRates([]);
          setNoShippingRatesFound(true);
        }
      } catch (err) {
        console.error("Erro no cálculo de frete:", err);
        toast.error("Erro ao calcular o frete.");
      } finally {
        setIsCalculatingShipping(false);
      }
    } else {
      setShippingRates([]);
    }
  };

  // Select shipping rate
  const handleSelectRate = async (rate: any) => {
    setSelectedRateId(rate.id);
    setFormData((prev) => ({ ...prev, shippingMethod: "manual_table" }));
    
    try {
      await updateCartShipping({
        data: {
          zipcode: formData.shippingAddress.zipcode,
          method: rate.name,
          cents: rate.price_cents,
        }
      });
      // Invalidate router cache to pull updated cart totals
      router.invalidate();
    } catch (e) {
      toast.error("Erro ao atualizar frete.");
    }
  };

  // Request custom shipping quote
  const handleRequestQuote = async () => {
    setSelectedRateId("quote");
    setFormData((prev) => ({ ...prev, shippingMethod: "manual_quote" }));

    try {
      await updateCartShipping({
        data: {
          zipcode: formData.shippingAddress.zipcode,
          method: "manual_quote",
          cents: 0,
        }
      });
      router.invalidate();
      toast.success("Cotação de frete personalizada selecionada!");
    } catch (e) {
      toast.error("Erro ao atualizar cotação.");
    }
  };

  // Handle local pickup
  const handleSelectPickup = async () => {
    setSelectedRateId("pickup");
    setFormData((prev) => ({ ...prev, shippingMethod: "pickup" }));
    
    try {
      await updateCartShipping({
        data: {
          zipcode: "89800000",
          method: "pickup",
          cents: 0,
        }
      });
      router.invalidate();
    } catch (e) {
      toast.error("Erro ao atualizar retirada.");
    }
  };

  // Surcharges & discount reactive calculation
  const getSelectedPaymentMethodInfo = () => {
    if (formData.paymentMethod === "manual" && formData.paymentMethodId) {
      const match = paymentMethods.find((p: any) => p.id === formData.paymentMethodId);
      if (match) return match as ManualPaymentOption;
    }
    return null;
  };

  const paymentInfo = getSelectedPaymentMethodInfo();
  let paymentSurchargeCents = 0;
  let paymentDiscountCents = 0;

  if (paymentInfo) {
    if (Number(paymentInfo.discount_percentage) > 0) {
      paymentDiscountCents = Math.floor(cart.subtotalCents * (Number(paymentInfo.discount_percentage) / 100));
    } else if (Number(paymentInfo.surcharge_percentage) > 0) {
      paymentSurchargeCents = Math.floor(cart.subtotalCents * (Number(paymentInfo.surcharge_percentage) / 100));
    }
  }

  const finalTotalCents =
    cart.subtotalCents +
    (formData.shippingMethod === "pickup" ? 0 : cart.shippingCents) -
    cart.discountCents -
    paymentDiscountCents +
    paymentSurchargeCents;

  // Process checkout submission
  const handleSubmitOrder = async () => {
    if (isSubmitting) return;

    // Validate fields based on shipping choice
    if (formData.shippingMethod !== "pickup") {
      const { zipcode, street, number, neighborhood, city, state } = formData.shippingAddress;
      if (!zipcode || !street || !number || !neighborhood || !city || !state) {
        toast.error("Por favor, preencha todos os campos obrigatórios do endereço.");
        return;
      }

      if (!selectedRateId) {
        toast.error("Por favor, escolha uma opção de entrega ou solicite uma cotação.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await processCheckout({
        data: {
          cartId: cart.id,
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone,
          customerDocument: formData.customerDocument,
          shippingMethod: formData.shippingMethod,
          shippingAddress: formData.shippingMethod === "pickup" ? undefined : formData.shippingAddress,
          paymentMethod: formData.paymentMethod,
          paymentMethodId: formData.paymentMethod === "manual" ? formData.paymentMethodId : undefined,
        },
      });

      if (res.status === "success") {
        if (formData.shippingMethod !== "manual_quote") {
          try {
            await initiatePaymentTransaction({
              data: {
                orderId: res.orderToken,
                method: formData.paymentMethod === "credit_card" ? "credit_card" : "pix",
                amountCents: finalTotalCents,
              },
            });
          } catch (payErr: any) {
            console.error("Erro de transação:", payErr);
          }
        }
        setSuccessToken(res.orderToken);
        toast.success("Pedido realizado com sucesso!");
      } else {
        toast.error(res.message || "Falha ao processar checkout.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successToken) {
    return (
      <div className="container max-w-2xl py-24 mx-auto px-4 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-6" />
        <h1 className="text-3xl font-serif font-bold mb-4">Pedido Realizado!</h1>
        <p className="text-muted-foreground mb-8">
          Seu pedido <strong>#{successToken.split("-")[0]}</strong> foi criado com sucesso.
          {formData.shippingMethod === "manual_quote"
            ? " Ele está aguardando cotação de frete personalizada pela loja."
            : " Ele está aguardando o pagamento."}
        </p>

        <div className="bg-muted/30 p-6 rounded-xl border border-border inline-block mb-8 max-w-md text-left">
          <MessageCircle className="w-8 h-8 text-primary mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2 text-center">Próximos Passos</h3>
          
          {formData.shippingMethod === "manual_quote" ? (
            <p className="text-sm text-muted-foreground mb-4 font-normal">
              Nossa equipe calculará a taxa de frete para o seu bairro e atualizará seu pedido.
              Você receberá o link atualizado pelo WhatsApp para realizar o pagamento.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mb-4 font-normal">
              Sua vendedora entrará em contato pelo WhatsApp com o link ou chave de pagamento para finalizar sua compra.
            </p>
          )}

          {paymentInfo?.instructions && (
            <div className="border-t pt-4 mt-2">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                Instruções do Pagamento
              </span>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{paymentInfo.instructions}</p>
            </div>
          )}
        </div>

        <div>
          <Button onClick={() => navigate({ to: "/conta/pedidos" })}>Acompanhar Meus Pedidos</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-12 mx-auto px-4">
      <h1 className="text-3xl font-serif font-bold tracking-tight mb-8">Finalizar Compra</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Accordion Steps Layout */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Passo 1: Seus Dados */}
          <div className="border rounded-xl bg-card overflow-hidden">
            <button
              onClick={() => setActiveStep(1)}
              className="w-full flex items-center justify-between p-4 bg-muted/20 border-b font-medium"
            >
              <span className="flex items-center gap-2.5">
                <span className={`size-6 rounded-full flex items-center justify-center text-xs ${activeStep > 1 ? "bg-green-600 text-white" : "bg-primary text-primary-foreground font-semibold"}`}>
                  1
                </span>
                Identificação
              </span>
              {activeStep > 1 && <span className="text-xs text-muted-foreground font-normal">Editar</span>}
            </button>
            
            {activeStep === 1 && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Nome Completo *</Label>
                    <Input
                      required
                      placeholder="Nome completo do destinatário"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail *</Label>
                    <Input
                      type="email"
                      required
                      placeholder="seuemail@exemplo.com"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp / Telefone *</Label>
                    <Input
                      type="tel"
                      required
                      placeholder="(99) 99999-9999"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>CPF / CNPJ (Opcional)</Label>
                    <Input
                      placeholder="000.000.000-00"
                      value={formData.customerDocument}
                      onChange={(e) => setFormData({ ...formData, customerDocument: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    disabled={!formData.customerName || !formData.customerEmail || !formData.customerPhone}
                    onClick={() => setActiveStep(2)}
                  >
                    Continuar para Entrega
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Passo 2: Entrega */}
          <div className="border rounded-xl bg-card overflow-hidden">
            <button
              onClick={() => formData.customerName && setActiveStep(2)}
              disabled={activeStep < 2 && !formData.customerName}
              className="w-full flex items-center justify-between p-4 bg-muted/20 border-b font-medium disabled:opacity-50"
            >
              <span className="flex items-center gap-2.5">
                <span className={`size-6 rounded-full flex items-center justify-center text-xs ${activeStep > 2 ? "bg-green-600 text-white" : "bg-primary text-primary-foreground font-semibold"}`}>
                  2
                </span>
                Entrega ou Retirada
              </span>
              {activeStep > 2 && <span className="text-xs text-muted-foreground font-normal">Editar</span>}
            </button>

            {activeStep === 2 && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, shippingMethod: "manual_table" })}
                    className={`flex flex-col items-center justify-center p-4 border rounded-xl gap-2 transition-all ${
                      formData.shippingMethod !== "pickup"
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <Truck className="size-6 text-muted-foreground" />
                    <span className="text-sm font-semibold">Entregar no Endereço</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectPickup}
                    className={`flex flex-col items-center justify-center p-4 border rounded-xl gap-2 transition-all ${
                      formData.shippingMethod === "pickup"
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <MapPin className="size-6 text-muted-foreground" />
                    <span className="text-sm font-semibold">Retirar na Loja</span>
                  </button>
                </div>

                {formData.shippingMethod !== "pickup" ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>CEP *</Label>
                        <Input
                          placeholder="89800-000"
                          maxLength={9}
                          value={formData.shippingAddress.zipcode}
                          onChange={(e) => handleCepChange(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Rua / Logradouro *</Label>
                        <Input
                          placeholder="Rua Exemplo"
                          value={formData.shippingAddress.street}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              shippingAddress: { ...formData.shippingAddress, street: e.target.value },
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Número *</Label>
                        <Input
                          placeholder="123"
                          value={formData.shippingAddress.number}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              shippingAddress: { ...formData.shippingAddress, number: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Complemento</Label>
                        <Input
                          placeholder="Apto 101"
                          value={formData.shippingAddress.complement}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              shippingAddress: { ...formData.shippingAddress, complement: e.target.value },
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Bairro *</Label>
                        <Input
                          placeholder="Centro"
                          value={formData.shippingAddress.neighborhood}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              shippingAddress: { ...formData.shippingAddress, neighborhood: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cidade *</Label>
                        <Input
                          value={formData.shippingAddress.city}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              shippingAddress: { ...formData.shippingAddress, city: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Estado (UF) *</Label>
                        <Select
                          value={formData.shippingAddress.state}
                          onValueChange={(v) =>
                            setFormData({
                              ...formData,
                              shippingAddress: { ...formData.shippingAddress, state: v },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="UF" />
                          </SelectTrigger>
                          <SelectContent>
                            {["SP", "RJ", "MG", "RS", "PR", "SC", "BA", "DF", "GO", "PE", "CE"].map((uf) => (
                              <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Shipping Rates Options */}
                    <div className="border-t pt-4 mt-4">
                      <Label className="text-sm font-semibold mb-2 block">Selecione o Frete</Label>
                      {isCalculatingShipping ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2 font-normal">
                          <Loader2 className="animate-spin size-4" />
                          Calculando fretes disponíveis...
                        </div>
                      ) : shippingRates.length > 0 ? (
                        <div className="grid gap-2">
                          {shippingRates.map((rate) => (
                            <button
                              key={rate.id}
                              type="button"
                              onClick={() => handleSelectRate(rate)}
                              className={`flex items-center justify-between p-3 border rounded-xl text-left transition-all ${
                                selectedRateId === rate.id
                                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                                  : "hover:bg-muted/50"
                              }`}
                            >
                              <div>
                                <p className="font-semibold text-sm">{rate.name}</p>
                                {rate.estimated_days && (
                                  <p className="text-xs text-muted-foreground font-normal">Prazo: {rate.estimated_days} dias úteis</p>
                                )}
                              </div>
                              <p className="font-bold text-sm">{formatMoney(rate.price_cents)}</p>
                            </button>
                          ))}
                        </div>
                      ) : noShippingRatesFound && formData.shippingAddress.zipcode ? (
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-4 rounded-xl space-y-3">
                          <div className="flex gap-2">
                            <AlertCircle className="size-5 text-amber-600 dark:text-amber-500 shrink-0" />
                            <div className="text-sm text-amber-800 dark:text-amber-300 font-normal">
                              <p className="font-semibold">Nenhum frete automático cadastrado para este bairro.</p>
                              <p className="text-xs">Você pode solicitar uma cotação de frete personalizada. Nossa vendedora informará o valor do frete antes de solicitar o pagamento.</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="bg-background text-foreground border-amber-300 hover:bg-amber-100"
                            onClick={handleRequestQuote}
                          >
                            Solicitar Cotação de Frete
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground font-normal">Digite o CEP para ver as opções de entrega.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-muted/30 rounded-xl border space-y-1">
                    <p className="font-semibold text-sm">Retirada na Hr Shoes</p>
                    <p className="text-xs text-muted-foreground font-normal">Rua Principal, Chapecó - SC. Horário: Seg a Sex 09h às 18h.</p>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t gap-2">
                  <Button variant="outline" onClick={() => setActiveStep(1)}>Voltar</Button>
                  <Button
                    disabled={
                      formData.shippingMethod !== "pickup" &&
                      (!formData.shippingAddress.zipcode || !formData.shippingAddress.street || !selectedRateId)
                    }
                    onClick={() => setActiveStep(3)}
                  >
                    Continuar para Pagamento
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Passo 3: Pagamento */}
          <div className="border rounded-xl bg-card overflow-hidden">
            <button
              onClick={() => activeStep >= 3 && setActiveStep(3)}
              disabled={activeStep < 3}
              className="w-full flex items-center justify-between p-4 bg-muted/20 border-b font-medium disabled:opacity-50"
            >
              <span className="flex items-center gap-2.5">
                <span className={`size-6 rounded-full flex items-center justify-center text-xs ${activeStep > 3 ? "bg-green-600 text-white" : "bg-primary text-primary-foreground font-semibold"}`}>
                  3
                </span>
                Forma de Pagamento
              </span>
              {activeStep > 3 && <span className="text-xs text-muted-foreground font-normal">Editar</span>}
            </button>

            {activeStep === 3 && (
              <div className="p-6 space-y-6">
                <div>
                  <Label className="text-sm font-semibold mb-3 block">Opções Principais</Label>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentMethod: "pix", paymentMethodId: "" })}
                      className={`flex items-center justify-center p-3 border rounded-xl gap-2 font-medium transition-all ${
                        formData.paymentMethod === "pix"
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      PIX
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentMethod: "credit_card", paymentMethodId: "" })}
                      className={`flex items-center justify-center p-3 border rounded-xl gap-2 font-medium transition-all ${
                        formData.paymentMethod === "credit_card"
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      Cartão de Crédito
                    </button>
                  </div>

                  {paymentMethods.length > 0 && (
                    <>
                      <Label className="text-sm font-semibold mb-3 block">Opções Manuais da Loja</Label>
                      <div className="grid gap-2">
                        {paymentMethods.map((method: any) => (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                paymentMethod: "manual",
                                paymentMethodId: method.id,
                              })
                            }
                            className={`flex items-center justify-between p-4 border rounded-xl text-left transition-all ${
                              formData.paymentMethod === "manual" && formData.paymentMethodId === method.id
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : "hover:bg-muted/50"
                            }`}
                          >
                            <div>
                              <p className="font-semibold text-sm">{method.name}</p>
                              {method.instructions && (
                                <p className="text-xs text-muted-foreground truncate max-w-sm mt-0.5 font-normal">
                                  {method.instructions}
                                </p>
                              )}
                            </div>
                            {Number(method.discount_percentage) > 0 ? (
                              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                -{method.discount_percentage}% Desconto
                              </span>
                            ) : Number(method.surcharge_percentage) > 0 ? (
                              <span className="text-xs font-semibold text-destructive bg-destructive/5 px-2 py-0.5 rounded-full">
                                +{method.surcharge_percentage}% Acréscimo
                              </span>
                            ) : null}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t gap-2">
                  <Button variant="outline" onClick={() => setActiveStep(2)}>Voltar</Button>
                  <Button onClick={() => setActiveStep(4)}>Continuar para Resumo</Button>
                </div>
              </div>
            )}
          </div>

          {/* Passo 4: Resumo e Confirmação */}
          <div className="border rounded-xl bg-card overflow-hidden">
            <div className="w-full flex items-center p-4 bg-muted/20 border-b font-medium">
              <span className="flex items-center gap-2.5">
                <span className="size-6 rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center text-xs">
                  4
                </span>
                Resumo e Confirmação
              </span>
            </div>

            {activeStep === 4 && (
              <div className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6 text-sm">
                  <div className="space-y-2">
                    <p className="font-semibold text-muted-foreground uppercase text-xs tracking-wider">Destinatário</p>
                    <p className="font-medium text-foreground">{formData.customerName}</p>
                    <p className="text-muted-foreground font-normal">{formData.customerEmail} | {formData.customerPhone}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-muted-foreground uppercase text-xs tracking-wider">Entrega</p>
                    {formData.shippingMethod === "pickup" ? (
                      <p className="font-medium text-foreground">Retirada em Loja (Grátis)</p>
                    ) : (
                      <>
                        <p className="font-medium text-foreground">Entrega: {cart.shippingMethod === "manual_quote" ? "Cotação de Frete" : cart.shippingMethod || "Entrega Normal"}</p>
                        <p className="text-muted-foreground font-normal">
                          {formData.shippingAddress.street}, {formData.shippingAddress.number}{" "}
                          {formData.shippingAddress.complement && `(${formData.shippingAddress.complement})`} -{" "}
                          {formData.shippingAddress.neighborhood}, {formData.shippingAddress.city} -{" "}
                          {formData.shippingAddress.state}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2 border-t pt-4">
                    <p className="font-semibold text-muted-foreground uppercase text-xs tracking-wider">Forma de Pagamento</p>
                    <p className="font-medium text-foreground">
                      {formData.paymentMethod === "pix" && "PIX"}
                      {formData.paymentMethod === "credit_card" && "Cartão de Crédito"}
                      {formData.paymentMethod === "manual" && (paymentInfo?.name || "Manual")}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t gap-2">
                  <Button variant="outline" onClick={() => setActiveStep(3)}>Voltar</Button>
                  <Button disabled={isSubmitting} onClick={handleSubmitOrder} className="px-6 font-semibold">
                    {isSubmitting ? "Finalizando..." : "Confirmar e Pagar"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resumo Lateral de Valores */}
        <div className="bg-muted/50 rounded-xl p-6 h-fit sticky top-24 border">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <ShoppingBag className="size-5 text-primary" />
            Resumo do Pedido
          </h2>
          <div className="space-y-4 mb-6">
            {cart.items.map((item: any) => (
              <div key={item.id} className="flex flex-col text-sm border-b pb-3 last:border-0 last:pb-0">
                <div className="flex justify-between font-medium">
                  <span>
                    {item.qty}x {item.productTitle}
                  </span>
                  <span>{formatMoney(item.lineTotalCents)}</span>
                </div>
                {(item.variantAttributes?.color || item.variantAttributes?.size) && (
                  <span className="text-xs text-muted-foreground mt-0.5 font-normal">
                    {item.variantAttributes?.color && `Cor: ${item.variantAttributes.color}`}
                    {item.variantAttributes?.color && item.variantAttributes?.size && " | "}
                    {item.variantAttributes?.size && `Tam: ${item.variantAttributes.size}`}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-2 mb-6 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatMoney(cart.subtotalCents)}</span>
            </div>

            {cart.couponCode && (
              <div className="flex justify-between text-green-600">
                <span className="flex items-center gap-1">
                  <Ticket className="h-4 w-4" /> Cupom ({cart.couponCode})
                </span>
                <span>-{formatMoney(cart.discountCents)}</span>
              </div>
            )}

            <div className="flex justify-between text-muted-foreground">
              <span>Entrega</span>
              <span>
                {formData.shippingMethod === "pickup"
                  ? "Grátis (Retirada)"
                  : cart.shippingMethod === "manual_quote"
                    ? "A ser cotado"
                    : formatMoney(cart.shippingCents)}
              </span>
            </div>

            {paymentDiscountCents > 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Desconto Pagamento ({paymentInfo?.name})</span>
                <span>-{formatMoney(paymentDiscountCents)}</span>
              </div>
            )}

            {paymentSurchargeCents > 0 && (
              <div className="flex justify-between text-destructive font-medium">
                <span>Taxa Pagamento ({paymentInfo?.name})</span>
                <span>+{formatMoney(paymentSurchargeCents)}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-end border-t pt-4 mb-4">
            <span className="font-semibold text-foreground">Total</span>
            <span className="font-bold text-2xl text-foreground">
              {formatMoney(finalTotalCents)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
