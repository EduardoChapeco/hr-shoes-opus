import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Share2 } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/state/states";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { listSocialPosts, createSocialPost } from "@/services/marketing-engagement.functions";

export const Route = createFileRoute("/admin/marketing/feed")({
  head: () => ({ meta: [{ title: "Feed Social — Hr Shoes" }] }),
  loader: async () => await listSocialPosts() || [],
  component: FeedPage,
});

function FeedPage() {
  const posts = Route.useLoaderData() as any[];
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ platform: "instagram", content_text: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await createSocialPost({ data: form });
      
      toast.success("Post criado!");
      setOpen(false);
      setForm({ platform: "instagram", content_text: "" });
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro");
    } finally {
      setIsSaving(false);
    }
  };

  const platformLabel: Record<string, string> = {
    instagram: "Instagram",
    facebook: "Facebook",
    whatsapp: "WhatsApp",
    tiktok: "TikTok",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Feed Social"
          description="Crie e organize conteúdos de redes sociais a partir dos seus produtos."
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Post
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Post para Rede Social</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="post-platform">Plataforma</Label>
                <Select
                  value={form.platform}
                  onValueChange={(v) => setForm((f) => ({ ...f, platform: v }))}
                >
                  <SelectTrigger id="post-platform">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="post-text">Texto do Post</Label>
                <Textarea
                  id="post-text"
                  placeholder="Escreva a legenda do post..."
                  value={form.content_text}
                  onChange={(e) => setForm((f) => ({ ...f, content_text: e.target.value }))}
                  required
                  rows={5}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Salvando..." : "Salvar Post"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {posts.length === 0 ? (
        <EmptyState
          title="Nenhum post criado"
          description="Crie conteúdos para suas redes sociais e organize sua estratégia de marketing."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {posts.map((post: any) => (
            <div key={post.id} className="rounded-lg border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="secondary">{platformLabel[post.platform] || post.platform}</Badge>
                </div>
                <Badge variant={post.is_published ? "default" : "outline"}>
                  {post.is_published ? "Publicado" : "Rascunho"}
                </Badge>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-4">
                {post.content_text}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(post.created_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
