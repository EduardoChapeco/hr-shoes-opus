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
import { AnnouncementBar } from "./dynamic-sections/announcement-bar";
import { VideoSection } from "./dynamic-sections/video-section";
import { ContactForm } from "./dynamic-sections/contact-form";
import { GalleryGrid } from "./dynamic-sections/gallery-grid";
import { InfoCards } from "./dynamic-sections/info-cards";
import { MosaicBanners } from "./dynamic-sections/mosaic-banners";
import { SocialGrid } from "./dynamic-sections/social-grid";
import { FaqAccordion } from "./dynamic-sections/faq-accordion";
import { TestimonialCarousel } from "./dynamic-sections/testimonial-carousel";
import { TimelineHistory } from "./dynamic-sections/timeline-history";
import { ProductCarousel } from "./dynamic-sections/product-carousel";
import { ProductGrid } from "./dynamic-sections/product-grid";
import { SplitBanner } from "./dynamic-sections/split-banner";
import { StoreProfileHero } from "./dynamic-sections/store-profile-hero";
import { StoreHours } from "./dynamic-sections/store-hours";
import { StoreContact } from "./dynamic-sections/store-contact";
import { ImageHotspots } from "./dynamic-sections/image-hotspots";
import { RoutineSteps } from "./dynamic-sections/routine-steps";
import { IngredientSpotlight } from "./dynamic-sections/ingredient-spotlight";
import { BeforeAfterSlider } from "./dynamic-sections/before-after-slider";
import { BookingCalendar } from "./dynamic-sections/booking-calendar";
import { TrackView } from "./analytics-provider";

// ---------------------------------------------------------------------------
// Block type → React component mapping
// ---------------------------------------------------------------------------
const componentMap: Record<string, React.FC<any>> = {
  hero_carousel: HeroCarousel,
  hero_banner: HeroCarousel,
  rich_text: RichText,
  bento_grid: BentoGrid,
  countdown_timer: CountdownTimer,
  stories_ring: StoriesRing,
  trust_badges: TrustBadges,
  product_rail: ProductRail,
  announcement_bar: AnnouncementBar,
  video_section: VideoSection,
  contact_form: ContactForm,
  gallery_grid: GalleryGrid,
  info_cards: InfoCards,
  mosaic_banners: MosaicBanners,
  social_grid: SocialGrid,
  faq_accordion: FaqAccordion,
  testimonial_carousel: TestimonialCarousel,
  timeline_history: TimelineHistory,
  product_carousel: ProductCarousel,
  product_grid: ProductGrid,
  split_banner: SplitBanner,
  store_profile_hero: StoreProfileHero,
  store_hours: StoreHours,
  store_contact: StoreContact,
  image_hotspots: ImageHotspots,
  routine_steps: RoutineSteps,
  ingredient_spotlight: IngredientSpotlight,
  before_after_slider: BeforeAfterSlider,
  booking_calendar: BookingCalendar,
};

// ---------------------------------------------------------------------------
// Block types that receive real-time store profile data from transient_data
// ---------------------------------------------------------------------------
const STORE_PROFILE_BLOCKS = new Set(["store_profile_hero", "store_hours", "store_contact"]);

// ---------------------------------------------------------------------------
// Block types that receive product arrays from transient_data.products
// ---------------------------------------------------------------------------
const PRODUCT_DATA_BLOCKS = new Set(["product_rail", "product_carousel", "product_grid"]);

// ---------------------------------------------------------------------------
// Block types that receive review arrays from transient_data.reviews
// ---------------------------------------------------------------------------
const REVIEW_DATA_BLOCKS = new Set(["testimonial_carousel"]);

// ---------------------------------------------------------------------------
// ExperienceRenderer — root entry
// ---------------------------------------------------------------------------
interface ExperienceRendererProps {
  nodes: any[];
  bindings?: any;
  transientData?: any;
  isEditing?: boolean;
  selectedNodeId?: string | null;
  onSelectNode?: (id: string) => void;
}

export function ExperienceRenderer({
  nodes,
  bindings,
  transientData,
  isEditing,
  selectedNodeId,
  onSelectNode,
}: ExperienceRendererProps) {
  if (!nodes || nodes.length === 0) return null;
  return (
    <>
      {nodes.map((node) => (
        <ExperienceNodeRenderer
          key={node.id}
          node={node}
          transientData={transientData}
          bindings={bindings}
          isEditing={isEditing}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
        />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// ExperienceNodeRenderer — recursive node renderer
// ---------------------------------------------------------------------------
interface ExperienceNodeRendererProps {
  node: ExperienceNode;
  transientData?: any;
  bindings?: any;
  isEditing?: boolean;
  selectedNodeId?: string | null;
  onSelectNode?: (id: string) => void;
}

function ExperienceNodeRenderer({
  node,
  transientData,
  bindings,
  isEditing,
  selectedNodeId,
  onSelectNode,
}: ExperienceNodeRendererProps) {
  const manifest = builderRegistry[node.block_type];

  if (!manifest) {
    if (isEditing) {
      return (
        <div className="p-4 border border-dashed border-red-500 bg-red-50 text-red-900 text-sm">
          Bloco não suportado: {node.block_type}
        </div>
      );
    }
    console.warn(`[Builder] Block type "${node.block_type}" not found in registry.`);
    return null;
  }

  // ── Interactive editing wrapper ────────────────────────────────────────────
  const wrapInteractive = (children: React.ReactNode, className: string = "") => {
    if (!isEditing) return children;
    const isSelected = selectedNodeId === node.id;
    return (
      <div
        className={cn(
          "relative group cursor-pointer transition-all outline-none",
          isSelected
            ? "ring-2 ring-primary ring-inset z-10"
            : "hover:ring-2 hover:ring-primary/50 hover:ring-inset z-0",
          className,
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (onSelectNode) onSelectNode(node.id);
        }}
      >
        {children}
        {isSelected && (
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] px-2 py-1 font-mono z-20 rounded-bl-md shadow-sm pointer-events-none">
            {manifest.name}
          </div>
        )}
      </div>
    );
  };

  // ── Structural: section ────────────────────────────────────────────────────
  if (node.block_type === "section") {
    const bg = (node.design_tokens as any)?.backgroundColor;
    const bgImage = (node.design_tokens as any)?.backgroundImage;
    return wrapInteractive(
      <section
        className={cn("w-full relative")}
        style={{
          backgroundColor: bg,
          backgroundImage: bgImage ? `url(${bgImage})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {node.children && node.children.length > 0 ? (
          node.children.map((child: ExperienceNode) => (
            <ExperienceNodeRenderer
              key={child.id}
              node={child}
              transientData={transientData}
              bindings={bindings}
              isEditing={isEditing}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
            />
          ))
        ) : isEditing ? (
          <div className="p-8 text-center border-2 border-dashed border-border/50 text-muted-foreground text-sm">
            Seção Vazia — adicione um Container
          </div>
        ) : null}
      </section>,
    );
  }

  // ── Structural: container ──────────────────────────────────────────────────
  if (node.block_type === "container") {
    const rules = (node.layout_rules as any) || {};

    const maxWidthClass =
      (
        {
          sm: "max-w-sm",
          md: "max-w-md",
          lg: "max-w-3xl",
          xl: "max-w-5xl",
          "2xl": "max-w-7xl",
          full: "max-w-full",
        } as Record<string, string>
      )[rules.maxWidth as string] ?? "max-w-5xl";

    const displayClass =
      (
        {
          block: "block",
          flex: "flex",
          grid: "grid",
        } as Record<string, string>
      )[rules.display as string] ?? "flex";

    const flexDirClass = rules.flexDirection === "row" ? "flex-row" : "flex-col";

    const gapClass =
      (
        {
          none: "gap-0",
          sm: "gap-2",
          md: "gap-6",
          lg: "gap-12",
          xl: "gap-20",
        } as Record<string, string>
      )[rules.gap as string] ?? "gap-6";

    const pxClass =
      (
        {
          none: "px-0",
          sm: "px-2",
          md: "px-4 lg:px-8",
          lg: "px-8 lg:px-12",
        } as Record<string, string>
      )[rules.paddingX as string] ?? "px-4 lg:px-8";

    const pyClass =
      (
        {
          none: "py-0",
          sm: "py-4",
          md: "py-8",
          lg: "py-12",
          xl: "py-16",
          "2xl": "py-24",
        } as Record<string, string>
      )[rules.paddingY as string] ?? "py-16";

    return wrapInteractive(
      <div
        className={cn(
          "mx-auto w-full",
          maxWidthClass,
          displayClass,
          flexDirClass,
          gapClass,
          pxClass,
          pyClass,
        )}
      >
        {node.children && node.children.length > 0 ? (
          node.children.map((child: ExperienceNode) => (
            <ExperienceNodeRenderer
              key={child.id}
              node={child}
              transientData={transientData}
              bindings={bindings}
              isEditing={isEditing}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
            />
          ))
        ) : isEditing ? (
          <div className="p-4 text-center border border-dashed border-border/50 text-muted-foreground text-sm w-full">
            Container Vazio — selecione este container e adicione um bloco
          </div>
        ) : null}
      </div>,
    );
  }

  // ── Leaf/Composition component ─────────────────────────────────────────────
  const Component = componentMap[node.block_type];
  if (!Component) {
    if (isEditing) {
      return (
        <div className="p-4 border border-dashed border-orange-500 bg-orange-50 text-orange-900 text-sm">
          Falta componente React para: {node.block_type}
        </div>
      );
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Resolve dynamic data for this specific node.
  //
  // Priority order:
  // 1. Node-level transient_data (injected by BFF hydrateBindings per-node)
  // 2. Page-level transientData (passed top-down from route loader)
  // 3. External bindings map (legacy fallback)
  // ---------------------------------------------------------------------------
  const nodeTransientData = (node as any).transient_data ?? null;
  const bindingSource = (node.data_bindings as any)?.source || null;

  // Props for store profile blocks: extract the correct sub-key
  let storeProfileProps: Record<string, any> = {};
  if (STORE_PROFILE_BLOCKS.has(node.block_type) && nodeTransientData) {
    if (node.block_type === "store_profile_hero") {
      storeProfileProps = { storeData: nodeTransientData.store_hero ?? nodeTransientData };
    } else if (node.block_type === "store_hours") {
      storeProfileProps = { storeData: nodeTransientData.store_hours ?? nodeTransientData };
    } else if (node.block_type === "store_contact") {
      storeProfileProps = { storeData: nodeTransientData.store_contact ?? nodeTransientData };
    }
  }

  // Props for product blocks: always an array
  let resolvedProducts: any[] | null = null;
  if (PRODUCT_DATA_BLOCKS.has(node.block_type)) {
    if (nodeTransientData?.products) {
      resolvedProducts = nodeTransientData.products;
    } else if (transientData?.products) {
      resolvedProducts = transientData.products;
    } else if (bindingSource && bindings) {
      const key = `${node.id}_${bindingSource}`;
      resolvedProducts = bindings[key] ?? null;
    }
  }

  // Props for review blocks: always an array
  let resolvedReviews: any[] | null = null;
  if (REVIEW_DATA_BLOCKS.has(node.block_type)) {
    if (nodeTransientData?.reviews) {
      resolvedReviews = nodeTransientData.reviews;
    } else if (transientData?.reviews) {
      resolvedReviews = transientData.reviews;
    }
  }

  // The canonical content object (from DB node.content JSONB)
  const content = (node.content as Record<string, any>) ?? {};
  const designTokens = (node.design_tokens as Record<string, any>) ?? {};
  const layoutRules = (node.layout_rules as Record<string, any>) ?? {};

  return wrapInteractive(
    <TrackView nodeId={node.id} blockType={node.block_type}>
      <Component
        // ── Canonical: Pass the full content object ─────────────────────────
        content={content}
        // ── Legacy Compat: Spread content fields as flat props ──────────────
        {...content}
        // ── Extra canonical props ───────────────────────────────────────────
        node_id={node.id}
        block_type={node.block_type}
        design_tokens={designTokens}
        layout_rules={layoutRules}
        data_bindings={node.data_bindings}
        action_bindings={node.action_bindings}
        isEditing={isEditing}
        // ── Dynamic data ────────────────────────────────────────────────────
        resolvedProducts={resolvedProducts}
        resolvedReviews={resolvedReviews}
        {...storeProfileProps}
      />
    </TrackView>,
  );
}
