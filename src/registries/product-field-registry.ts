import { z } from "zod";

export const FieldTypeSchema = z.enum([
  "text",
  "rich_text",
  "number",
  "money",
  "measurement",
  "boolean",
  "date",
  "select",
  "multi_select",
  "color",
  "size",
  "reference",
  "file",
  "image",
  "video",
]);
export type FieldType = z.infer<typeof FieldTypeSchema>;

export const ProductFieldDefinitionSchema = z.object({
  id: z.string(),
  type: FieldTypeSchema,
  label: z.string(),
  description: z.string().optional(),
  isRequired: z.boolean(),
  // For select/multi_select
  options: z.array(z.string()).optional(),
  // Constraints
  min: z.number().optional(),
  max: z.number().optional(),
});
export type ProductFieldDefinition = z.infer<typeof ProductFieldDefinitionSchema>;

/**
 * Product Field Registry
 * Defines the canonical types of dynamic fields a product can have.
 */
export const ProductFieldRegistry: Record<string, ProductFieldDefinition> = {
  // Common internal examples
  "core.brand": {
    id: "core.brand",
    type: "text",
    label: "Marca",
    isRequired: false,
  },
  "core.weight": {
    id: "core.weight",
    type: "measurement",
    label: "Peso",
    isRequired: true,
  },
  "core.preorder": {
    id: "core.preorder",
    type: "boolean",
    label: "Sob Encomenda",
    isRequired: true,
  },
  "variant.color": {
    id: "variant.color",
    type: "color",
    label: "Cor",
    isRequired: true,
  },
  "variant.size": {
    id: "variant.size",
    type: "size",
    label: "Tamanho",
    isRequired: true,
  },
};

export function getProductFieldById(id: string): ProductFieldDefinition | undefined {
  return ProductFieldRegistry[id];
}
