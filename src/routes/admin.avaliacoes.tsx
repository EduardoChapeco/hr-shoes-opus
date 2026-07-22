import { createFileRoute, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, X, Plus } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
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
import { listReviews, updateReviewStatus, createManualReview } from "@/services/cms.functions";
import { listAdminProducts } from "@/services/admin-catalog.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/admin/avaliacoes")({
  head: () => ({ meta: [{ title: "Avaliações — Hr Shoes" }] }),
  loader: async () => {
    const [reviewsRes, productsRes] = await Promise.all([
      listReviews(),
      listAdminProducts()
    ]);
    return {
      reviews: reviewsRes || [],
      products: productsRes || []
    };
  },
  component: ReviewsPage,
});

function ReviewsPage() {
  const { reviews, products } = Route.useLoaderData() as any;
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newReview, setNewReview] = useState({
    productId: "",
    reviewerName: "",
    rating: "5",
    comment: ""
  });

  const handleUpdateStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      await updateReviewStatus({ data: { id, status } });
      toast.success(`Avaliação ${status === "approved" ? "aprovada" : "rejeitada"}.`);
      router.invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao atualizar avaliação.");
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.productId || !newReview.reviewerName) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setIsSubmitting(true);
    try {
      await createManualReview({
        data: {
          productId: newReview.productId,
          reviewerName: newReview.reviewerName,
          rating: parseInt(newReview.rating, 10),
          comment: newReview.comment || undefined
        }
      });
      toast.success("Avaliação adicionada com sucesso!");
      setIsModalOpen(false);
      setNewReview({ productId: "", reviewerName: "", rating: "5", comment: "" });
      router.invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao adicionar avaliação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Avaliações de Clientes"
        description="Aprove e gerencie depoimentos sobre seus produtos"
        actions={
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nova Avaliação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Avaliação Manual</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateReview} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Produto *</Label>
                  <Select value={newReview.productId} onValueChange={(v) => setNewReview({...newReview, productId: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o produto..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Nome do Cliente *</Label>
                  <Input 
                    value={newReview.reviewerName}
                    onChange={(e) => setNewReview({...newReview, reviewerName: e.target.value})}
                    placeholder="Ex: João da Silva"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nota (Estrelas)</Label>
                  <Select value={newReview.rating} onValueChange={(v) => setNewReview({...newReview, rating: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 Estrelas</SelectItem>
                      <SelectItem value="4">4 Estrelas</SelectItem>
                      <SelectItem value="3">3 Estrelas</SelectItem>
                      <SelectItem value="2">2 Estrelas</SelectItem>
                      <SelectItem value="1">1 Estrela</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Comentário</Label>
                  <Textarea 
                    value={newReview.comment}
                    onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                    placeholder="Opcional. Ex: Gostei muito do produto!"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Adicionando..." : "Salvar Avaliação"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {reviews.length === 0 ? (
        <EmptyState
          title="Nenhuma avaliação encontrada"
          description="Os clientes ainda não avaliaram nenhum produto."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead>Comentário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review: any) => (
                <TableRow key={review.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {review.products?.title || "Desconhecido"}
                  </TableCell>
                  <TableCell>
                    {review.reviewer_name || review.users?.raw_user_meta_data?.full_name || "Cliente Anonimo"}
                  </TableCell>
                  <TableCell>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={i < review.rating ? "text-yellow-500" : "text-gray-300"}
                      >
                        ★
                      </span>
                    ))}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate" title={review.comment}>
                    {review.comment || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        review.status === "approved"
                          ? "default"
                          : review.status === "rejected"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {review.status === "approved"
                        ? "Aprovada"
                        : review.status === "rejected"
                          ? "Rejeitada"
                          : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(review.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-right">
                    {review.status === "pending" && (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-green-600"
                          onClick={() => handleUpdateStatus(review.id, "approved")}
                          title="Aprovar"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-red-600"
                          onClick={() => handleUpdateStatus(review.id, "rejected")}
                          title="Rejeitar"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
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
