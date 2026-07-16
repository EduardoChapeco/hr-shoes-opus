import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { User, ChevronLeft, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { getCustomer360, updateCustomerCrm } from "@/services/crm.functions";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/admin/clientes/$id")({
  head: () => ({ meta: [{ title: "Detalhes do Cliente — Hr Shoes" }] }),
  loader: async ({ params }) => {
    return await getCustomer360({ data: { customerId: params.id } });
  },
  component: CustomerDetailPage,
});

const CrmSchema = z.object({
  notes: z.string().nullable(),
  tags: z.string(), // We'll parse this into an array
});

function CustomerDetailPage() {
  const data = Route.useLoaderData();
  const { id } = Route.useParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(CrmSchema),
    defaultValues: {
      notes: data.crm.notes || "",
      tags: data.crm.tags ? data.crm.tags.join(", ") : "",
    },
  });

  const onSubmit = async (formData: z.infer<typeof CrmSchema>) => {
    setIsSubmitting(true);
    try {
      const tagsArray = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const res = await updateCustomerCrm({
        data: {
          customerId: id,
          notes: formData.notes || null,
          tags: tagsArray,
        },
      });
      if (res.status === "error") throw new Error(res.message);
      toast.success("Ficha do cliente atualizada.");
      router.invalidate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="flex items-center text-sm text-muted-foreground">
        <Link to="/admin/clientes" className="hover:text-foreground flex items-center">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Voltar para Clientes
        </Link>
      </nav>

      <PageHeader
        title={data.profile.name}
        description={`Cliente desde ${new Date(data.profile.joinedAt).toLocaleDateString("pt-BR")}`}
      />

      <Tabs defaultValue="crm" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="crm">Ficha CRM</TabsTrigger>
          <TabsTrigger value="pedidos">Pedidos ({data.orders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="crm" className="space-y-4">
          <div className="max-w-2xl rounded-md border bg-card p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags (separadas por vírgula)</FormLabel>
                      <FormControl>
                        <Input placeholder="vip, atacado, revenda..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anotações Internas</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Preferências, histórico de atendimento..."
                          className="min-h-[120px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Ficha
                </Button>
              </form>
            </Form>
          </div>
        </TabsContent>

        <TabsContent value="pedidos">
          <div className="rounded-md border bg-card">
            {data.orders.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Este cliente ainda não fez nenhum pedido.
              </div>
            ) : (
              <div className="divide-y">
                {data.orders.map((o: any) => (
                  <div key={o.id} className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-medium">Pedido #{o.public_token}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatMoney(o.total_cents)}</div>
                      <Badge variant="secondary" className="mt-1">
                        {o.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
