import * as React from "react";
import { ExperienceNode } from "@/lib/builder-types";
import { builderRegistry } from "@/lib/builder-registry";
import { cn } from "@/lib/utils";
import { HeroCarousel } from "./dynamic-sections/hero-carousel";
import { RichText } from "./dynamic-sections/rich-text";

import { BentoGrid } from "./dynamic-sections/bento-grid";
import { CountdownTimer } from "./dynamic-sections/countdown-timer";
import { StoriesRing } from "./dynamic-sections/stories-ring";
import { TrustBadges } from "./dynamic-sections/trust-badges";
import { ProductRail } from "./dynamic-sections/product-rail";
import { TrackView } from "./analytics-provider";

// Mapeamento dinâmico dos componentes React para cada bloco
const componentMap: Record<string, React.FC<any>> = {
  hero_carousel: HeroCarousel,
  rich_text: RichText,
  bento_grid: BentoGrid,
  countdown_timer: CountdownTimer,
  stories_ring: StoriesRing,
  trust_badges: TrustBadges,
  product_rail: ProductRail,
};

interface ExperienceRendererProps {
  nodes: any[];
  bindings?: any;
  transientData?: any;
}

export function ExperienceRenderer({ nodes, bindings, transientData }: ExperienceRendererProps) {
  if (!nodes || nodes.length === 0) return null;
  return (
    <>
      {nodes.map((node) => (
        <ExperienceNodeRenderer key={node.id} node={node} transientData={transientData} bindings={bindings} />
      ))}
    </>
  );
}

interface ExperienceNodeRendererProps {
  node: ExperienceNode;
  transientData?: any;
  bindings?: any;
}

function ExperienceNodeRenderer({ node, transientData, bindings }: ExperienceNodeRendererProps) {
  const manifest = builderRegistry[node.block_type];
  
  if (!manifest) {
    console.warn(`Block type "${node.block_type}" not found in registry.`);
    return <div className="p-4 border border-dashed border-red-500 bg-red-50 text-red-900 text-sm">Bloco não suportado: {node.block_type}</div>;
  }

  // Se o node for de layout estrutural base
  if (node.node_type === "section") {
    const bg = node.design_tokens?.backgroundColor;
    const bgImage = node.design_tokens?.backgroundImage;
    return (
      <section 
        className={cn("w-full relative")}
        style={{ 
          backgroundColor: bg,
          backgroundImage: bgImage ? `url(${bgImage})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        {node.children && node.children.length > 0 ? (
          node.children.map(child => <ExperienceNodeRenderer key={child.id} node={child} transientData={transientData} bindings={bindings} />)
        ) : (
          <div className="p-8 text-center border-2 border-dashed border-border/50 text-muted-foreground text-sm">Seção Vazia</div>
        )}
      </section>
    );
  }

  if (node.node_type === "container") {
    // Processamento das regras de layout
    const rules = node.layout_rules || {};
    const maxWidthClass = {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-3xl",
      xl: "max-w-5xl",
      "2xl": "max-w-7xl",
      full: "max-w-full"
    }[rules.maxWidth as string] || "max-w-5xl";

    const displayClass = {
      block: "block",
      flex: "flex",
      grid: "grid"
    }[rules.display as string] || "flex";
    
    const flexDirClass = rules.flexDirection === "row" ? "flex-row" : "flex-col";
    
    const gapClass = {
      none: "gap-0",
      sm: "gap-2",
      md: "gap-6",
      lg: "gap-12",
      xl: "gap-20"
    }[rules.gap as string] || "gap-6";

    const pxClass = {
      none: "px-0",
      sm: "px-2",
      md: "px-4 lg:px-8",
      lg: "px-8 lg:px-12"
    }[rules.paddingX as string] || "px-4 lg:px-8";
    
    const pyClass = {
      none: "py-0",
      sm: "py-4",
      md: "py-8",
      lg: "py-12",
      xl: "py-16",
      "2xl": "py-24"
    }[rules.paddingY as string] || "py-16";

    return (
      <div className={cn("mx-auto w-full", maxWidthClass, displayClass, flexDirClass, gapClass, pxClass, pyClass)}>
        {node.children && node.children.length > 0 ? (
          node.children.map(child => <ExperienceNodeRenderer key={child.id} node={child} transientData={transientData} bindings={bindings} />)
        ) : (
          <div className="p-4 text-center border border-dashed border-border/50 text-muted-foreground text-sm w-full">Container Vazio</div>
        )}
      </div>
    );
  }

  // Componentes visuais concretos e composições
  const Component = componentMap[node.block_type];
  if (!Component) {
    return <div className="p-4 border border-dashed border-orange-500 bg-orange-50 text-orange-900 text-sm">Falta Componente React para: {node.block_type}</div>;
  }

  let resolvedData = null;
  if (node.data_bindings && (node.data_bindings as any).source && bindings) {
    const bindingKey = `${node.id}_${(node.data_bindings as any).source}`;
    resolvedData = bindings[bindingKey];
  }

  return (
    <TrackView nodeId={node.id} blockType={node.block_type}>
      <Component 
        node_id={node.id}
        block_type={node.block_type}
        content={node.content} 
        design_tokens={node.design_tokens}
        data_bindings={node.data_bindings}
        action_bindings={node.action_bindings}
        transientData={transientData}
        bindings={bindings}
        resolvedData={resolvedData}
      />
    </TrackView>
  );
}
