import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";

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

      // Ensure unique filename
      const ext = fileName.split(".").pop() || "png";
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${ext}`;
      const filePath = `${uniqueName}`;

      // Convert base64 to buffer
      // Use Buffer.from instead of base64toBlob because this runs in Node.js/Nitro
      const base64Data = fileBase64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      let uploadResult = await supabase.storage.from(bucket).upload(filePath, buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: `image/${ext}`,
      });

      // Auto-Healing: If bucket not found, create it dynamically and retry
      if (uploadResult.error && uploadResult.error.message.includes("Bucket not found")) {
        console.log(`[storage] Bucket ${bucket} missing. Auto-healing...`);
        const { error: createError } = await supabase.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: 10485760, // 10MB
        });
        
        if (createError) {
          throw new Error(`Auto-healing failed: ${createError.message}`);
        }

        // Retry upload
        uploadResult = await supabase.storage.from(bucket).upload(filePath, buffer, {
          cacheControl: "3600",
          upsert: false,
          contentType: `image/${ext}`,
        });
      }

      if (uploadResult.error) {
        throw new Error(`Erro no upload: ${uploadResult.error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

      // Register asset in media_assets tracking table if possible
      try {
        const { getServerIdentity } = await import("@/lib/identity");
        const { store_id } = await getServerIdentity();
        const store = store_id ? { id: store_id } : null;
        const { data: user } = await supabase.auth.getUser();
        if (store && user.user) {
          await supabase.from("media_assets").insert({
            store_id: store.id,
            file_name: fileName,
            file_size: buffer.length,
            mime_type: `image/${ext}`,
            bucket_name: bucket,
            file_path: filePath,
            public_url: urlData.publicUrl,
            uploaded_by: user.user.id
          });
        }
      } catch (e) {
        // Silently fail asset tracking, return the URL regardless
      }

      return { status: "success" as const, url: urlData.publicUrl };
    } catch (e: any) {
      console.error("[storage.functions] uploadMedia error:", e);
      return { status: "error" as const, message: e.message || "Erro no upload" };
    }
  });
