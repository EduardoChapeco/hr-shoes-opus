import { getBrowserClient } from "@/lib/supabase";

export async function uploadMedia(file: File, bucket: "product-media" | "cms-media"): Promise<string> {
  const supabase = getBrowserClient();
  
  // Ensure unique filename
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${ext}`;
  const filePath = `${fileName}`;

  const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw new Error(`Erro no upload: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
  
  return urlData.publicUrl;
}
