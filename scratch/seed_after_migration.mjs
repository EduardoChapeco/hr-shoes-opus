/**
 * Run AFTER applying migration 0040 in the Supabase SQL Editor.
 * URL: https://supabase.com/dashboard/project/hfgnageqkeryxsnwobjc/sql/new
 *
 * Seeds the home page with initial sections.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hfgnageqkeryxsnwobjc.supabase.co";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmZ25hZ2Vxa2VyeXhzbndvYmpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzk5MzEwNSwiZXhwIjoyMDk5NTY5MTA1fQ.Ni-B1dwwZ3ZNJslcBI68xRulOr23m-iWDKPCQIqwH-k";
const STORE_ID = "79f31227-80a1-483c-ba3e-a30f215db679";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function main() {
  console.log("=== SEED: HOME PAGE SECTIONS ===\n");

  // Find or create home page
  let pageId;
  const { data: existing } = await supabase
    .from("pages")
    .select("id")
    .eq("store_id", STORE_ID)
    .eq("slug", "home")
    .maybeSingle();

  if (existing) {
    pageId = existing.id;
    console.log("Found existing home page:", pageId);
    // Clear existing sections
    await supabase.from("page_sections").delete().eq("page_id", pageId);
    console.log("Cleared existing sections.");
  } else {
    const { data: newPage, error: pe } = await supabase
      .from("pages")
      .insert({
        store_id: STORE_ID,
        title: "Página Inicial",
        slug: "home",
        status: "published",
      })
      .select("id")
      .single();

    if (pe) {
      console.error("Error creating page:", pe.message);
      return;
    }
    pageId = newPage.id;
    console.log("Created home page:", pageId);
  }

  // Seed sections
  const { error } = await supabase.from("page_sections").insert([
    {
      page_id: pageId,
      section_type: "announcement_bar",
      sort_order: 0,
      content: {
        text: "Bem-vinda à Hr Shoes! Frete grátis acima de R$299",
        link: "/catalogo",
        bg_color: "#FF4FB8",
        text_color: "#ffffff",
      },
    },
    {
      page_id: pageId,
      section_type: "featured_products",
      sort_order: 1,
      content: {
        title: "Destaques da Coleção",
        layout: "carousel",
      },
    },
  ]);

  if (error) {
    console.error("Error seeding sections:", error.message);
    if (error.code === "23514") {
      console.log(
        "\n⚠️  Migration 0040 still not applied! Run the SQL in Supabase SQL Editor first.",
      );
    }
  } else {
    console.log("✅ Home page seeded with 2 sections:");
    console.log("  0: announcement_bar");
    console.log("  1: featured_products");
    console.log("\n✅ Editor URL: /admin/cms/paginas/" + pageId + "/editor");
  }
}

main().catch(console.error);
