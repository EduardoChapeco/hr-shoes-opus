import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, CreditCard, QrCode, Receipt } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PageHeader } from "@/components/commerce/page-header";
import { createOrder } from "@/services/checkout.functions";

export const Route = createFileRoute("/_store/checkout/pagamento")({
  head: () => ({
    meta: [{ title: "Pagamento — Checkout Hr Shoes" }],
  }),
  component: PaymentPage,
});

const PaymentSchema = z.object({
  paymentMethod: z.enum(["credit_card", "pix", "boleto"], {
    required_error: "Selecione uma forma de pagamento",
  }),
});

type PaymentForm = z.infer<typeof PaymentSchema>;

function PaymentPage() {
  const navigate = useNavigate();
  const [address, setAddress] = useState<{
    zipcode: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    shippingOptionId: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hr_checkout_address");
      if (saved) {
        setAddress(JSON.parse(saved));
      } else {
        toast.error("Endereço não encontrado, por favor preencha novamente.");
        navigate({ to: "/checkout/entrega" });
      }
    }
  }, [navigate]);

  const form = useForm<PaymentForm>({
    resolver: zodResolver(PaymentSchema),
    defaultValues: { paymentMethod: "pix" },
  });

  const onSubmit = async (data: PaymentForm) => {
    if (!address) return;

    try {
      const result = await createOrder({
        data: {
          shippingAddress: {
            zipcode: address.zipcode,
            street: address.street,
            number: address.number,
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state,
          },
          shippingOptionId: address.shippingOptionId,
          paymentMethod: data.paymentMethod,
        },
      });

      if (result.status === "success") {
        toast.success("Pedido finalizado com sucesso!");
        // Clear saved address
        localStorage.removeItem("hr_checkout_address");
        navigate({ to: `/pedido/${result.orderToken}/confirmacao` });
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao processar o pagamento.");
    }
  };

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12">
      <nav
        aria-label="Navegação estrutural"
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground"
      >
        <Link to="/carrinho" className="hover:text-foreground">
          Carrinho
        </Link>
        <ChevronRight className="size-3" aria-hidden />
        <Link to="/checkout/entrega" className="hover:text-foreground">
          Entrega
        </Link>
        <ChevronRight className="size-3" aria-hidden />
        <span className="text-foreground">Pagamento</span>
      </nav>

      <div className="mx-auto max-w-2xl">
        <PageHeader title="Pagamento" description="Escolha como deseja pagar." />

        <div className="mt-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-lg border border-border p-4 transition-colors hover:bg-secondary has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                          <FormControl>
                            <RadioGroupItem value="pix" />
                          </FormControl>
                          <FormLabel className="flex flex-1 cursor-pointer items-center justify-between font-normal">
                            <span>Pix (Aprovação Imediata)</span>
                            <QrCode className="size-5 text-muted-foreground" aria-hidden />
                          </FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-lg border border-border p-4 transition-colors hover:bg-secondary has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                          <FormControl>
                            <RadioGroupItem value="credit_card" />
                          </FormControl>
                          <FormLabel className="flex flex-1 cursor-pointer items-center justify-between font-normal">
                            <span>Cartão de Crédito</span>
                            <CreditCard className="size-5 text-muted-foreground" aria-hidden />
                          </FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-lg border border-border p-4 transition-colors hover:bg-secondary has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                          <FormControl>
                            <RadioGroupItem value="boleto" />
                          </FormControl>
                          <FormLabel className="flex flex-1 cursor-pointer items-center justify-between font-normal">
                            <span>Boleto Bancário</span>
                            <Receipt className="size-5 text-muted-foreground" aria-hidden />
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-lg border border-border bg-secondary p-4 text-sm text-muted-foreground">
                <p>
                  Nenhum cartão é salvo nos nossos servidores. Transação criptografada ponta a
                  ponta.
                </p>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Finalizando..." : "Finalizar Compra"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
