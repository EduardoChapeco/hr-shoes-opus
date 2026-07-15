import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Upload, Image, Trash2, ExternalLink } from "lucide-react";
import { createServerFn } from "@tanstack/react-start";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/state/states";
import { getServerClient } from "@/lib/supabase";
import { getSSRClient } from "@/lib/supabase-ssr";

const listMediaFiles = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const ssrClient = getSSRClient();
    const {
      data: { user },
    } = await ssrClient.auth.getUser();
    if (!user) throw new Error("Não autorizado");

    const db = getServerClient();
    const { data: store } = await db.from("stores").select("id").limit(1).single();
    if (!store) return { status: "unconfigured" as const };

    const { data, error } = await db.storage.from("product-media").list(`${store.id}/`, {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });

    if (error) throw error;

    const publicUrls = (data || []).map((file) => ({
      name: file.name,
      size: file.metadata?.size || 0,
      created_at: file.created_at,
      url: db.storage.from("product-media").getPublicUrl(`${store.id}/${file.name}`).data.publicUrl,
    }));

    return { status: "ok" as const, data: publicUrls, storeId: store.id };
  } catch (e: any) {
    console.error("[midias] listMediaFiles:", e);
    return { status: "error" as const, message: "Erro ao listar mídias." };
  }
});

export const Route = createFileRoute("/admin/midias")({
  head: () => ({ meta: [{ title: "Mídias — Hr Shoes" }] }),
  loader: async () => {
    return await listMediaFiles();
  },
  component: MidiasPage,
});

function MidiasPage() {
  const res = Route.useLoaderData();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (res.status === "unconfigured" || res.status === "error") {
    return (
      <div className="space-y-6">
        <PageHeader title="Mídias" description="Gerencie imagens e arquivos da loja." />
        <EmptyState
          title="Loja não configurada"
          description={res.status === "error" ? res.message : "Configure a loja primeiro."}
        />
      </div>
    );
  }

  const files = res.data;
  const storeId = res.storeId;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_MB = 5;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Máximo ${MAX_MB}MB.`);
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Apenas imagens são suportadas.");
      return;
    }

    setUploading(true);
    try {
      // Upload using supabase client on server is not possible from client side
      // We need to use the SSR client from the browser
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
      );
      const path = `${storeId}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("product-media").upload(path, file);
      if (error) throw error;
      toast.success("Imagem enviada com sucesso!");
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Mídias"
          description="Faça upload de imagens para usar em produtos e páginas."
        />
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            id="media-upload"
            onChange={handleUpload}
          />
          <Button asChild disabled={uploading}>
            <label htmlFor="media-upload" className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "Enviando..." : "Upload de Imagem"}
            </label>
          </Button>
        </div>
      </div>

      {files.length === 0 ? (
        <EmptyState
          title="Nenhuma mídia enviada"
          description="Faça upload de imagens para usar nos seus produtos e páginas."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {files.map((file: any) => (
            <div
              key={file.name}
              className="group relative rounded-lg border bg-card overflow-hidden aspect-square"
            >
              <img
                src={file.url}
                alt={file.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                <p className="text-white text-xs font-medium truncate w-full text-center px-2">
                  {file.name}
                </p>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(file.url);
                    toast.success("URL copiada!");
                  }}
                >
                  <Button size="sm" variant="secondary" className="text-xs">
                    Copiar URL
                  </Button>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
