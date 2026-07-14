import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Gift, Plus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/state/states";
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
import { listGiftCards, createGiftCard } from "@/services/giftcard.functions";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/admin/marketing/gift-cards")({
  head: () => ({ meta: [{ title: "Gift Cards — Hr Shoes" }] }),
  loader: async () => {
    return await listGiftCards();
  },
  component: GiftCardsPage,
});

const CreateGiftCardSchema = z.object({
  balance: z.string().min(1, "Informe o valor"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});

function GiftCardsPage() {
  const cards = Route.useLoaderData();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof CreateGiftCardSchema>>({
    resolver: zodResolver(CreateGiftCardSchema),
    defaultValues: { balance: "", email: "" },
  });

  const parseMoneyInput = (val: string) => {
    const clean = val.replace(/\D/g, "");
    return parseInt(clean || "0", 10);
  };

  const handleCreate = async (data: z.infer<typeof CreateGiftCardSchema>) => {
    setIsCreating(true);
    try {
      const cents = parseMoneyInput(data.balance);
      const res = await createGiftCard({
        data: {
          initialBalanceCents: cents,
          recipientEmail: data.email || undefined,
        },
      });
      toast.success(`Cartão criado com sucesso! Código: ${res.code}`);
      setOpen(false);
      form.reset();
      router.invalidate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar cartão");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cartões-Presente (Gift Cards)"
        description="Emita códigos promocionais ou saldo de presente para clientes."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Emitir Cartão
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Cartão-Presente</DialogTitle>
                <DialogDescription>
                  Gere um código de saldo que pode ser usado como método de pagamento no checkout.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="balance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor (R$)</FormLabel>
                        <FormControl>
                          <Input placeholder="100,00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email do Destinatário (Opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="cliente@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isCreating}>
                    Gerar Código
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      {cards.length === 0 ? (
        <EmptyState
          title="Sem cartões emitidos"
          description="Você ainda não emitiu nenhum cartão-presente."
        />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Emitido por</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Valor Inicial</TableHead>
                <TableHead>Saldo Atual</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cards.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-muted-foreground">{c.code}</TableCell>
                  <TableCell>{c.purchaserName}</TableCell>
                  <TableCell>{new Date(c.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>{formatMoney(c.initialBalance)}</TableCell>
                  <TableCell className="font-medium text-primary">
                    {formatMoney(c.currentBalance)}
                  </TableCell>
                  <TableCell>
                    {c.status === "active" ? (
                      <Badge className="bg-green-600">Ativo</Badge>
                    ) : c.status === "exhausted" ? (
                      <Badge variant="secondary">Exaurido</Badge>
                    ) : (
                      <Badge variant="destructive">Cancelado</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
