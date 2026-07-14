import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PageHeader } from "@/components/commerce/page-header";
import { calculateShipping } from "@/services/checkout.functions";
import { toast } from "sonner";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/_store/checkout/entrega")({
  head: () => ({
    meta: [{ title: "Entrega — Checkout Hr Shoes" }],
  }),
  component: DeliveryPage,
});

const AddressSchema = z.object({
  zipcode: z.string().min(8, "CEP inválido"),
  street: z.string().min(1, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().length(2, "Estado (UF) deve ter 2 letras"),
  shippingOptionId: z.string().min(1, "Selecione uma opção de frete"),
});

type AddressForm = z.infer<typeof AddressSchema>;

function DeliveryPage() {
  const navigate = useNavigate();
  const [shippingOptions, setShippingOptions] = useState<
    { id: string; name: string; priceCents: number; days: number }[]
  >([]);

  const form = useForm<AddressForm>({
    resolver: zodResolver(AddressSchema),
    defaultValues: { zipcode: "", street: "", number: "", neighborhood: "", city: "", state: "" },
  });

  const handleZipcodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    form.setValue("zipcode", value);

    if (value.length === 8) {
      try {
        const result = await calculateShipping({ data: { zipcode: value } });
        setShippingOptions(result.options);
      } catch (error: unknown) {
        toast.error("Erro ao calcular frete");
      }
    } else {
      setShippingOptions([]);
    }
  };

  const onSubmit = (data: AddressForm) => {
    // Save address in session/state for the next step.
    // For simplicity, we can pass it via router state or search params, but localStorage is easier for guest checkout.
    if (typeof window !== "undefined") {
      localStorage.setItem("hr_checkout_address", JSON.stringify(data));
    }
    navigate({ to: "/checkout/pagamento" });
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
        <Link to="/checkout/identificacao" className="hover:text-foreground">
          Identificação
        </Link>
        <ChevronRight className="size-3" aria-hidden />
        <span className="text-foreground">Entrega</span>
      </nav>

      <div className="mx-auto max-w-2xl">
        <PageHeader title="Endereço de Entrega" description="Onde devemos entregar seu pedido?" />

        <div className="mt-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="zipcode"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="00000000"
                          maxLength={8}
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleZipcodeChange(e);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua / Avenida" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input placeholder="123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input placeholder="Centro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="São Paulo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado (UF)</FormLabel>
                      <FormControl>
                        <Input placeholder="SP" maxLength={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {shippingOptions.length > 0 && (
                <FormField
                  control={form.control}
                  name="shippingOptionId"
                  render={({ field }) => (
                    <FormItem className="space-y-3 rounded-lg border border-border bg-secondary p-4">
                      <h3 className="text-sm font-semibold text-foreground">
                        Opções de Frete Estimadas
                      </h3>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-2"
                        >
                          {shippingOptions.map((opt) => (
                            <FormItem
                              key={opt.id}
                              className="flex items-center space-x-3 space-y-0"
                            >
                              <FormControl>
                                <RadioGroupItem value={opt.id} />
                              </FormControl>
                              <FormLabel className="flex flex-1 cursor-pointer items-center justify-between font-normal text-sm">
                                <span>
                                  {opt.name} ({opt.days} dias)
                                </span>
                                <span className="font-medium">
                                  {formatMoney(opt.priceCents)}
                                </span>
                              </FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button type="submit" size="lg" className="w-full">
                Continuar para Pagamento
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
