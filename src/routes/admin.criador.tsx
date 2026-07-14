import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PenTool, Image as ImageIcon, Send, Copy } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listSocialPosts, createSocialPost } from "@/services/marketing-engagement.functions";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/admin/criador")({
  head: () => ({ meta: [{ title: "Criador de Posts — Hr Shoes" }] }),
  loader: async () => {
    const res = await listSocialPosts();
    if (res.status === "error") throw new Error(res.message);
    return res.data;
  },
  component: CreatorPage,
});

function CreatorPage() {
  const posts = Route.useLoaderData() || [];
  const router = useRouter();

  const [platform, setPlatform] = useState("instagram");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;

    setIsSaving(true);
    try {
      const res = await createSocialPost({
        data: { platform, content_text: content },
      });
      if (res.status === "success") {
        toast.success("Post arquivado!");
        setContent("");
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao salvar post.");
      }
    } catch {
      toast.error("Erro inesperado");
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Criador de Posts (Social)"
        description="Escreva e arquive textos e ideias para suas redes sociais."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Creator Form */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PenTool className="h-4 w-4" /> Escrever Novo Post
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Plataforma</label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Legenda / Texto</label>
                <Textarea
                  placeholder="Escreva a legenda do post..."
                  className="min-h-[150px]"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSaving || !content}>
                {isSaving ? "Salvando..." : "Arquivar Ideia"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Timeline */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="font-semibold text-lg">Posts Arquivados</h3>
          {posts.length === 0 ? (
            <EmptyState
              title="Nenhum post arquivado"
              description="Comece escrevendo suas ideias ao lado."
            />
          ) : (
            <div className="grid gap-4">
              {posts.map((post: any) => (
                <Card key={post.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="secondary" className="capitalize">
                        {post.platform}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{post.content_text}</p>
                  </CardContent>
                  <CardFooter className="pt-2 border-t flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(post.content_text)}
                    >
                      <Copy className="mr-2 h-4 w-4" /> Copiar Texto
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
