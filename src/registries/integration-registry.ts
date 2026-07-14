import { z } from "zod";

export const IntegrationStatusSchema = z.enum([
  "unconfigured",
  "testing",
  "active",
  "error",
  "disabled",
]);
export type IntegrationStatus = z.infer<typeof IntegrationStatusSchema>;

export const IntegrationCategorySchema = z.enum([
  "payment",
  "shipping",
  "notification",
  "analytics",
  "marketing",
  "storage",
  "maps",
]);
export type IntegrationCategory = z.infer<typeof IntegrationCategorySchema>;

export const IntegrationDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: IntegrationCategorySchema,
  status: IntegrationStatusSchema,
  description: z.string(),
  capabilities: z.array(z.string()),
});
export type IntegrationDefinition = z.infer<typeof IntegrationDefinitionSchema>;

/**
 * Integration Registry
 * Single source of truth for all external integrations.
 */
export const IntegrationRegistry: Record<string, IntegrationDefinition> = {
  "payment.mercadopago": {
    id: "payment.mercadopago",
    name: "Mercado Pago",
    category: "payment",
    status: "unconfigured",
    description: "Gateway de pagamentos via Mercado Pago.",
    capabilities: ["pix", "credit_card"],
  },
  "shipping.melhorenvio": {
    id: "shipping.melhorenvio",
    name: "Melhor Envio",
    category: "shipping",
    status: "unconfigured",
    description: "Cotação de fretes via Melhor Envio.",
    capabilities: ["quote", "label_generation"],
  },
  "analytics.meta_pixel": {
    id: "analytics.meta_pixel",
    name: "Meta Pixel",
    category: "analytics",
    status: "unconfigured",
    description: "Rastreamento de eventos para Facebook e Instagram.",
    capabilities: ["page_view", "add_to_cart", "purchase"],
  },
};

export function getIntegrationById(id: string): IntegrationDefinition | undefined {
  return IntegrationRegistry[id];
}

export function getIntegrationsByCategory(category: IntegrationCategory): IntegrationDefinition[] {
  return Object.values(IntegrationRegistry).filter((i) => i.category === category);
}
