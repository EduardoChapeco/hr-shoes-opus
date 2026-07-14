import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Gift } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { checkGiftCardBalance } from "@/services/giftcard.functions";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/_store/conta/gift-cards")({
  head: () => ({ meta: [{ title: "Gift Cards — Hr Shoes" }] }),
  component: CustomerGiftCardsPage,
});

const CheckBalanceSchema = z.object({
  code: z.string().min(5, "Código inválido"),
});

function CustomerGiftCardsPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof CheckBalanceSchema>>({
    resolver: zodResolver(CheckBalanceSchema),
    defaultValues: { code: "" },
  });

  const handleCheck = async (data: z.infer<typeof CheckBalanceSchema>) => {
    setIsLoading(true);
    setBalance(null);
    try {
      const res = await checkGiftCardBalance({ data: { code: data.code } });
      setBalance(res.balanceCents);
      toast.success("Cartão encontrado!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao buscar cartão");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meus Cartões-Presente"
        description="Consulte o saldo de seus cartões ou resgate novos."
      />

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Consultar Saldo</CardTitle>
          <CardDescription>
            Insira o código do seu cartão-presente para verificar quanto dinheiro virtual você
            possui disponível.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCheck)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código do Cartão</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: ABCD-1234-WXYZ" className="font-mono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                Verificar Saldo
              </Button>
            </form>
          </Form>

          {balance !== null && (
            <div className="mt-6 p-4 border rounded-lg bg-muted/20 text-center">
              <div className="text-sm text-muted-foreground mb-1">Saldo Disponível</div>
              <div className="text-3xl font-bold text-primary">{formatMoney(balance)}</div>
              <div className="text-xs text-muted-foreground mt-2">
                Este saldo será exibido como forma de pagamento na etapa de Checkout.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
