import { z } from "zod";

export const SectionPlacementSchema = z.enum(["home", "store_profile", "bio_link", "any"]);
export type SectionPlacement = z.infer<typeof SectionPlacementSchema>;

export const SectionDefinitionSchema = z.object({
  type: z.string(),
  version: z.string(),
  label: z.string(),
  description: z.string(),
  allowedPlacements: z.array(SectionPlacementSchema),
  // In a real scenario, this would be a specific Zod schema for the block config
  configSchema: z.any(),
  defaultConfig: z.record(z.any()),
});
export type SectionDefinition = z.infer<typeof SectionDefinitionSchema>;

/**
 * CMS Section Registry
 * Canonical registry of all available CMS sections.
 * This ensures that sections are not duplicated and only valid schemas are used.
 */
export const SectionRegistry: Record<string, SectionDefinition> = {
  AnnouncementBar: {
    type: "AnnouncementBar",
    version: "1.0.0",
    label: "Barra de Avisos",
    description: "Barra superior para anúncios globais.",
    allowedPlacements: ["home", "store_profile"],
    configSchema: z.object({
      text: z.string(),
      link: z.string().optional(),
      isActive: z.boolean(),
    }),
    defaultConfig: {
      text: "Frete grátis nas compras acima de R$ 299",
      isActive: true,
    },
  },
  HeroBannerCarousel: {
    type: "HeroBannerCarousel",
    version: "1.0.0",
    label: "Carrossel de Banners",
    description: "Banners rotativos em destaque.",
    allowedPlacements: ["home"],
    configSchema: z.object({
      banners: z.array(
        z.object({
          imageUrl: z.string(),
          link: z.string().optional(),
          altText: z.string(),
        }),
      ),
      autoPlay: z.boolean(),
    }),
    defaultConfig: {
      banners: [],
      autoPlay: true,
    },
  },
  ProductRail: {
    type: "ProductRail",
    version: "1.0.0",
    label: "Carrossel de Produtos",
    description: "Vitrine horizontal de produtos baseada em regras.",
    allowedPlacements: ["home", "store_profile", "bio_link"],
    configSchema: z.object({
      title: z.string(),
      collectionId: z.string().optional(),
      sortBy: z.enum(["newest", "bestselling", "price_asc", "price_desc"]),
      limit: z.number().min(1).max(20),
    }),
    defaultConfig: {
      title: "Novidades",
      sortBy: "newest",
      limit: 10,
    },
  },
  // Add more sections as per requirements (e.g. StoryRail, CategoryQuickAccess)
};

export function getSectionByType(type: string): SectionDefinition | undefined {
  return SectionRegistry[type];
}
