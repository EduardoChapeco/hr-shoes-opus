import { listPublishedProducts } from "@/services/catalog.functions";

/**
 * Registry of Data Resolvers for the Builder Platform.
 * Maps a binding source (e.g. 'latest_products') to an asynchronous fetcher function.
 */
export const builderResolvers: Record<string, (args?: any) => Promise<any>> = {
  
  // Resolve os produtos mais recentes da loja
  latest_products: async (args: { limit?: number } = {}) => {
    try {
      const res = await listPublishedProducts({ data: { limit: args.limit || 8 } });
      return res || [];
    } catch (e) {
      console.error("[builder-resolvers] latest_products error:", e);
      return [];
    }
  },

  // Resolve produtos de uma categoria específica
  category_products: async (args: { categorySlug: string; limit?: number }) => {
    try {
      if (!args.categorySlug) return [];
      const res = await listPublishedProducts({ 
        data: { categorySlug: args.categorySlug, limit: args.limit || 8 } 
      });
      return res || [];
    } catch (e) {
      console.error("[builder-resolvers] category_products error:", e);
      return [];
    }
  },

  // Você pode adicionar mais resolvers aqui (ex: best_sellers, collection_products, etc)
};

/**
 * Helper to process all bindings inside an ExperienceNode tree.
 * This should ideally run on the server loader to pre-fetch all needed data.
 */
export async function resolveNodeBindings(nodes: any[]): Promise<Record<string, any>> {
  const resolvedData: Record<string, any> = {};

  async function traverse(nodeList: any[]) {
    for (const node of nodeList) {
      // Se o nó possuir data_bindings configurado
      if (node.data_bindings && node.data_bindings.source) {
        const source = node.data_bindings.source as string;
        const args = node.data_bindings.args || {};
        
        // Evita resolver o mesmo nó/fonte múltiplas vezes (simplificação)
        const bindingKey = `${node.id}_${source}`;
        
        if (builderResolvers[source]) {
          resolvedData[bindingKey] = await builderResolvers[source](args);
        } else {
          resolvedData[bindingKey] = null;
        }
      }

      if (node.children && node.children.length > 0) {
        await traverse(node.children);
      }
    }
  }

  await traverse(nodes);
  return resolvedData;
}
