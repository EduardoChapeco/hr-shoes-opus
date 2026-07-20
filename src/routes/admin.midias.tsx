import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Upload, Image, Trash2, ExternalLink } from "lucide-react";
import { listMediaAssets, createUploadUrl } from "@/services/builder.functions";
import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/state/states";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/midias")({
  head: () => ({ meta: [{ title: "Mídias — Hr Shoes" }] }),
  loader: async () => {
    return await listMediaAssets();
  },
  component: MidiasPage,
});

function MidiasPage() {
  const res = Route.useLoaderData();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (res.status === "error") {
    return (
      <div className="space-y-6">
        <PageHeader title="Mídias" description="Gerencie imagens e arquivos da loja." />
        <EmptyState
          title="Loja não configurada"
          description={res.message}
        />
      </div>
    );
  }

  const files = res.data || [];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_MB = 10;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Máximo ${MAX_MB}MB.`);
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Apenas imagens são suportadas nesta página.");
      return;
    }

    setUploading(true);
    try {
      const urlRes = await createUploadUrl({
        data: {
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
          bucket: "product-media"
        }
      });

      if (urlRes.status !== "success") {
        throw new Error(urlRes.message);
      }

      const { uploadUrl, publicUrl } = urlRes.data;

      // Upload directly using the presigned URL
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || "application/octet-stream",
        }
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

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
              key={file.id}
              className="group relative rounded-lg border bg-card overflow-hidden aspect-square"
            >
              <img
                src={file.public_url}
                alt={file.file_name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                <p className="text-white text-xs font-medium truncate w-full text-center px-2">
                  {file.file_name}
                </p>
                <a
                  href={file.public_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(file.public_url);
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
