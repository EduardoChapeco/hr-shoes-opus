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

      const { error } = await supabase.storage.from(bucket).upload(filePath, buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: `image/${ext}`,
      });

      if (error) {
        throw new Error(`Erro no upload: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

      return { status: "success" as const, url: urlData.publicUrl };
    } catch (e: any) {
      console.error("[storage.functions] uploadMedia error:", e);
      return { status: "error" as const, message: e.message || "Erro no upload" };
    }
  });
