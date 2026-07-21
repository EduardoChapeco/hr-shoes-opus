import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";

/**
 * Retorna uma URL assinada para que o cliente faça o upload diretamente para o Supabase Storage,
 * aliviando o servidor (BFF) de processar buffers/base64 de grandes arquivos (LGPD/Performance).
 * API_CONTRACTS.md - 8.1 Solicitar URL de upload
 */
export const getSignedUploadUrl = createServerFn({ method: "POST" })
  .validator(
    z.object({
      fileName: z.string().min(1),
      bucket: z.enum(["product-media", "cms-media", "payment-proofs"]),
      contentType: z.string(),
    }),
  )
  .handler(async ({ data: { fileName, bucket } }) => {
    try {
      const supabase = getServerClient();
      const ext = fileName.split(".").pop() || "png";
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${ext}`;

      // Tenta criar a URL assinada
      let result = await supabase.storage.from(bucket).createSignedUploadUrl(uniqueName);

      // Auto-Healing: Cria o bucket se não existir e tenta novamente
      if (result.error && result.error.message.includes("Bucket not found")) {
        console.log(`[storage] Bucket ${bucket} missing. Auto-healing...`);
        const { error: createError } = await supabase.storage.createBucket(bucket, {
          public: bucket !== "payment-proofs",
          fileSizeLimit: 10485760, // 10MB
        });
        
        if (createError) {
          throw new Error(`Auto-healing failed: ${createError.message}`);
        }
        
        result = await supabase.storage.from(bucket).createSignedUploadUrl(uniqueName);
      }

      if (result.error || !result.data) {
        throw new Error(`Erro ao gerar URL de upload: ${result.error?.message}`);
      }

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(uniqueName);

      return {
        status: "success" as const,
        signedUrl: result.data.signedUrl,
        token: result.data.token,
        path: result.data.path,
        publicUrl: bucket !== "payment-proofs" ? urlData.publicUrl : null,
      };
    } catch (e: any) {
      console.error("[storage.functions] getSignedUploadUrl error:", e);
      return { status: "error" as const, message: e.message || "Erro ao gerar URL" };
    }
  });

/**
 * @deprecated - Use getSignedUploadUrl para upload client-side direto.
 */
export const uploadMedia = createServerFn({ method: "POST" })
  .validator(
    z.object({
      fileName: z.string().min(1),
      fileBase64: z.string().min(1),
      bucket: z.enum(["product-media", "cms-media"]),
    }),
  )
  .handler(async ({ data: { fileName, fileBase64, bucket } }) => {
    try {
      const supabase = getServerClient();
      const ext = fileName.split(".").pop() || "png";
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${ext}`;

      const base64Data = fileBase64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      let uploadResult = await supabase.storage.from(bucket).upload(uniqueName, buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: `image/${ext}`,
      });

      if (uploadResult.error && uploadResult.error.message.includes("Bucket not found")) {
        await supabase.storage.createBucket(bucket, { public: true });
        uploadResult = await supabase.storage.from(bucket).upload(uniqueName, buffer, {
          contentType: `image/${ext}`,
        });
      }

      if (uploadResult.error) throw new Error(uploadResult.error.message);

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(uniqueName);
      return { status: "success" as const, url: urlData.publicUrl };
    } catch (e: any) {
      return { status: "error" as const, message: e.message || "Erro no upload" };
    }
  });
