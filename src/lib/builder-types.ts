import { z } from "zod";

export type ExperienceType = "storefront" | "biolink" | "pwa" | "campaign" | "seller_showcase";

export interface ExperienceDocument {
  id: string;
  store_id: string;
  document_type: ExperienceType;
  owner_id?: string | null;
  slug: string;
  title: string;
  seo_metadata: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type NodeType = "section" | "container" | "element" | "composition";

export interface ResponsiveValue<T> {
  base: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  "2xl"?: T;
}

export interface ExperienceNode {
  id: string;
  version_id: string;
  parent_id?: string | null;
  
  node_type: NodeType;
  block_type: string;
  
  content: Record<string, any>;
  design_tokens: Record<string, any>;
  layout_rules: Record<string, any>;
  responsive_overrides: Record<string, ResponsiveValue<any>>;
  data_bindings: Record<string, any>;
  action_bindings: Record<string, any>;
  
  sort_order: number;
  is_hidden: boolean;
  
  // Children (hydrated in the tree representation, not persisted in flat rows)
  children?: ExperienceNode[];
}

// ---------------------------------------------------------------------------
// Block Registry Definitions
// ---------------------------------------------------------------------------

export type InspectorFieldType = 
  | "text" | "textarea" | "number" | "boolean" | "color" 
  | "image" | "video" | "select" | "radio" | "slider"
  | "data_binding" | "action_selector" | "collection" | "product";

export interface InspectorField {
  name: string;
  label: string;
  type: InspectorFieldType;
  options?: { label: string; value: string }[];
  defaultValue?: any;
  helpText?: string;
  required?: boolean;
}

export type BlockCategory = 
  | "layout" | "content" | "media" | "commerce" | "social" | "forms" | "marketing";

export interface BlockManifest {
  type: string;
  version: string;
  name: string;
  description: string;
  category: BlockCategory;
  icon: string;
  
  allowedBuilderProfiles: ExperienceType[] | "all";
  allowedParentTypes: NodeType[] | "none" | "all";
  allowedChildTypes: NodeType[] | "none" | "all";
  
  // Schemas for server-side validation
  contentSchema: z.ZodTypeAny;
  styleSchema?: z.ZodTypeAny;
  layoutSchema?: z.ZodTypeAny;
  
  // Inspector definition (UI for the editor)
  inspector: {
    content?: InspectorField[];
    design?: InspectorField[];
    layout?: InspectorField[];
  };
  
  defaultProps: Partial<ExperienceNode>;
}
