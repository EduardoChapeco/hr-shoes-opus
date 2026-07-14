import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Trash2, Image as ImageIcon } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/state/states";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { listAdminStories, upsertStory, deleteStory } from "@/services/cms.functions";

export const Route = createFileRoute("/admin/stories")({
  head: () => ({ meta: [{ title: "Stories — Hr Shoes" }] }),
  loader: async () => {
    const res = await listAdminStories();
    if (res.status === "error") throw new Error(res.message);
    return res.data;
  },
  component: StoriesPage,
});

function StoriesPage() {
  const stories = Route.useLoaderData() || [];
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      media_url: "",
      link_url: "",
    },
  });

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const res = await upsertStory({
        data: {
          media_url: values.media_url,
          link_url: values.link_url || null,
          status: "active",
          sort_order: stories.length,
        },
      });

      if (res.status === "success") {
        toast.success("Story publicado!");
        setOpen(false);
        reset();
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao publicar story");
      }
    } catch (e) {
      toast.error("Erro inesperado");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja apagar este story?")) return;
    try {
      const res = await deleteStory({ data: { id } });
      if (res.status === "success") {
        toast.success("Story excluído.");
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao excluir");
      }
    } catch (e) {
      toast.error("Erro inesperado");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stories"
        description="Publique imagens ou vídeos curtos no topo da loja para destacar novidades e promoções."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Story
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Publicar Story</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>URL da Mídia (Imagem ou Vídeo)</Label>
                  <Input {...register("media_url", { required: true })} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>Link de Destino (Opcional)</Label>
                  <Input {...register("link_url")} placeholder="https://..." />
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    Publicar
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {stories.length === 0 ? (
        <EmptyState
          title="Nenhum story ativo"
          description="Sua loja não tem stories rodando no momento."
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {stories.map((story: any) => (
            <Card key={story.id} className="overflow-hidden relative group">
              <div className="aspect-[9/16] bg-muted relative">
                {story.media_url.endsWith(".mp4") ? (
                  <video src={story.media_url} className="w-full h-full object-cover" muted loop />
                ) : (
                  <img src={story.media_url} alt="Story" className="w-full h-full object-cover" />
                )}

                <div className="absolute top-2 right-2">
                  <Badge variant={story.status === "active" ? "default" : "secondary"}>
                    {story.status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  {story.link_url && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-24 text-xs"
                      onClick={() => window.open(story.link_url, "_blank")}
                    >
                      Testar Link
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-24 text-xs"
                    onClick={() => handleDelete(story.id)}
                  >
                    <Trash2 className="mr-2 h-3 w-3" />
                    Excluir
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
