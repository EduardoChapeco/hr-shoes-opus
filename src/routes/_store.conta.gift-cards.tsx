import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Gift, Sparkles, CheckCircle, Copy, AlertCircle, Calendar } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  listCustomerGiftCards,
  claimGiftCard,
  checkGiftCardBalance,
} from "@/services/giftcard.functions";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/_store/conta/gift-cards")({
  head: () => ({ meta: [{ title: "Meus Cartões-Presente — Hr Shoes" }] }),
  loader: async () => {
    const res = await listCustomerGiftCards();
    return {
      giftCards: res || [],
    };
  },
  component: CustomerGiftCardsPage,
});

const CheckBalanceSchema = z.object({
  code: z.string().min(5, "Código muito curto"),
});

function CustomerGiftCardsPage() {
  const { giftCards } = Route.useLoaderData();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof CheckBalanceSchema>>({
    resolver: zodResolver(CheckBalanceSchema),
    defaultValues: { code: "" },
  });

  const handleClaim = async (data: z.infer<typeof CheckBalanceSchema>) => {
    setIsLoading(true);
    try {
      const res = await claimGiftCard({ data: { code: data.code } });
      if (res) {
        toast.success("Vale-presente resgatado e vinculado à sua conta!");
        form.reset();
        router.invalidate();
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao resgatar cartão");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado para a área de transferência!");
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <PageHeader
        title="Meus Vales-Presente"
        description="Gerencie seus cartões-presente ou vincule novos códigos à sua conta."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Adicionar / Resgatar Card */}
        <div className="md:col-span-1 space-y-6">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gift className="size-5 text-primary" />
                Resgatar Código
              </CardTitle>
              <CardDescription className="text-xs">
                Ganhou um presente? Digite o código de 12 dígitos abaixo para salvá-lo na sua conta
                e usá-lo nas compras.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleClaim)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Código do Cartão</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: ABCD-1234-WXYZ"
                            className="font-mono uppercase h-10"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full font-semibold" disabled={isLoading}>
                    {isLoading ? "Resgatando..." : "Resgatar Vale"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Listagem de Cartões Vinculados */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            Cartões Vinculados
            <Badge variant="secondary" className="text-xs font-normal">
              {giftCards.length}
            </Badge>
          </h3>

          {giftCards.length === 0 ? (
            <div className="border border-dashed rounded-xl p-8 text-center bg-muted/10 space-y-3">
              <Gift className="size-10 text-muted-foreground/60 mx-auto" />
              <div className="space-y-1">
                <p className="font-semibold text-sm">Nenhum vale-presente vinculado</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto font-normal">
                  Os vales vinculados aparecem automaticamente como saldo disponível na tela de
                  pagamento do Checkout.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {giftCards.map((card: any) => {
                const isUsed = card.status === "used" || card.current_balance_cents === 0;
                const isExpired = card.expires_at && new Date(card.expires_at) < new Date();

                return (
                  <div
                    key={card.id}
                    className={`relative p-5 border rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all ${
                      isUsed || card.status === "cancelled" || isExpired
                        ? "bg-muted/30 border-muted opacity-75"
                        : "bg-gradient-to-r from-card to-primary/5 hover:border-primary/30"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold tracking-wider text-sm">
                          {card.code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(card.code)}
                          className="size-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground transition-all"
                        >
                          <Copy className="size-3.5" />
                        </button>
                      </div>

                      <div className="flex gap-4 text-xs text-muted-foreground font-normal">
                        <span>Original: {formatMoney(card.initial_balance_cents)}</span>
                        {card.expires_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3.5" />
                            Expira: {new Date(card.expires_at).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-0 pt-3 sm:pt-0">
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground block font-normal">
                          Saldo Atual
                        </span>
                        <span
                          className={`text-lg font-bold ${isUsed ? "text-muted-foreground" : "text-primary"}`}
                        >
                          {formatMoney(card.current_balance_cents)}
                        </span>
                      </div>

                      <div>
                        {card.status === "cancelled" ? (
                          <Badge variant="destructive" className="font-normal text-xs">
                            Cancelado
                          </Badge>
                        ) : isExpired ? (
                          <Badge variant="outline" className="font-normal text-xs">
                            Expirado
                          </Badge>
                        ) : isUsed ? (
                          <Badge variant="secondary" className="font-normal text-xs">
                            Utilizado
                          </Badge>
                        ) : (
                          <Badge
                            variant="default"
                            className="bg-green-600 text-white font-normal text-xs hover:bg-green-700"
                          >
                            Ativo
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
