import { createFileRoute, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

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
import { listReviews, updateReviewStatus } from "@/services/cms.functions";

export const Route = createFileRoute("/admin/avaliacoes")({
  head: () => ({ meta: [{ title: "Avaliações — Hr Shoes" }] }),
  loader: async () => {
    const res = await listReviews();
    return res.status === "ok" ? res.data : [];
  },
  component: ReviewsPage,
});

function ReviewsPage() {
  const reviews = Route.useLoaderData();
  const router = useRouter();

  const handleUpdateStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      const res = await updateReviewStatus({ data: { id, status } });
      if (res.status === "success") {
        toast.success(`Avaliação ${status === "approved" ? "aprovada" : "rejeitada"}.`);
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao atualizar.");
      }
    } catch (e) {
      toast.error("Erro inesperado");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Avaliações"
        description="Modere as avaliações de produtos deixadas pelos seus clientes."
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
