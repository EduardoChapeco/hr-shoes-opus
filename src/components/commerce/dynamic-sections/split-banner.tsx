import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SplitBannerProps {
  node_id: string;
  block_type: string;
  content?: {
    title?: string;
    description?: string;
    button_text?: string;
    button_link?: string;
    image_url?: string;
    image_position?: "left" | "right";
  };
  design_tokens?: any;
}

export function SplitBanner({ content, design_tokens }: SplitBannerProps) {
  const isImageLeft = content?.image_position === "left";

  return (
    <div
      className={cn("w-full overflow-hidden", design_tokens?.className)}
      style={{
        backgroundColor: design_tokens?.backgroundColor,
        color: design_tokens?.textColor,
      }}
    >
      <div className="grid md:grid-cols-2 min-h-[500px] lg:min-h-[600px]">
        {/* Content Side */}
        <div className={cn("flex flex-col justify-center p-8 md:p-16 lg:p-24", isImageLeft ? "md:order-last" : "")}>
          {content?.title && (
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              {content.title}
            </h2>
          )}
          {content?.description && (
            <p className="text-lg text-muted-foreground mb-8 max-w-lg">
              {content.description}
            </p>
          )}
          {content?.button_text && (
            <div>
              <Button size="lg" asChild>
                <Link to={content.button_link || "/catalog"}>{content.button_text}</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Image Side */}
        <div className="relative h-64 md:h-auto bg-muted">
          {content?.image_url ? (
            <img 
              src={content.image_url} 
              alt={content?.title || "Banner"} 
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-muted/50">
              [Imagem não configurada]
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
