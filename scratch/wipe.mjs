import { createClient } from "@supabase/supabase-js";
import { resolve } from "path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function wipe() {
  const { data, error } = await supabase
    .from("experience_documents")
    .delete()
    .eq("slug", "institucional")
    .eq("document_type", "storefront");
  
  if (error) {
    console.error("Error wiping:", error);
  } else {
    console.log("Successfully wiped the blank institutional profile!");
  }
}

wipe();
