import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Users, Search, ArrowRight, Plus } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listCustomers, createCustomer } from "@/services/crm.functions";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/admin/clientes/")({
  head: () => ({ meta: [{ title: "Clientes — Hr Shoes" }] }),
  loader: async () => {
    return await listCustomers();
  },
  component: CustomersPage,
});

function CustomersPage() {
  const customers = Route.useLoaderData();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    tagsRaw: "",
    notes: "",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email) {
      toast.error("Nome e E-mail são obrigatórios");
      return;
    }
    setIsSaving(true);
    try {
      const tags = form.tagsRaw
        ? form.tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      const res = await createCustomer({
        data: {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          tags,
          notes: form.notes,
        },
      });

      if (res.status === "success") {
        toast.success("Cliente cadastrado com sucesso!");
        setIsOpen(false);
        setForm({ fullName: "", email: "", phone: "", tagsRaw: "", notes: "" });
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao cadastrar");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro inesperado");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Gestão de clientes, histórico de pedidos e CRM."
        actions={
          <Button onClick={() => setIsOpen(true)} className="font-bold flex items-center gap-1.5 size-sm">
            <Plus className="size-4" />
            Cadastrar Cliente
          </Button>
        }
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
            <DialogDescription>
              Cadastre um novo cliente no CRM da loja para vendas e acompanhamento de histórico.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="cli-name">Nome Completo *</Label>
              <Input
                id="cli-name"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Ex: Carlos Souza"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cli-email">E-mail *</Label>
              <Input
                id="cli-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="carlos@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cli-phone">Telefone / WhatsApp</Label>
              <Input
                id="cli-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(49) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cli-tags">Tags (separadas por vírgula)</Label>
              <Input
                id="cli-tags"
                value={form.tagsRaw}
                onChange={(e) => setForm({ ...form, tagsRaw: e.target.value })}
                placeholder="VIP, Atacado, Sapato"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cli-notes">Anotações Internas (CRM)</Label>
              <Input
                id="cli-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Observações importantes..."
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving} className="font-bold">
                {isSaving ? "Salvando..." : "Salvar Cliente"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Buscar cliente..." className="pl-8" />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Desde</TableHead>
              <TableHead className="text-center">Pedidos</TableHead>
              <TableHead className="text-right">LTV</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c: any) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>
                  {new Date(c.joinedAt).toLocaleDateString("pt-BR", {
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell className="text-center">{c.orderCount}</TableCell>
                <TableCell className="text-right">{formatMoney(c.ltvCents)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {c.tags.length > 0 ? (
                      c.tags.slice(0, 2).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-badge">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                    {c.tags.length > 2 && (
                      <Badge variant="outline" className="text-badge">
                        +{c.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/admin/clientes/$id" params={{ id: c.id }}>
                      Detalhes
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
