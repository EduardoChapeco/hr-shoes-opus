import * as React from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ExperienceRenderer } from "@/components/commerce/experience-renderer";

export type ViewportMode = "desktop" | "mobile";

export interface BuilderCanvasProps {
  viewport: ViewportMode | string;
  nodesCount: number;
  treeNodes: any[];
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
}

export function BuilderCanvas({
  viewport,
  nodesCount,
  treeNodes,
  selectedNodeId,
  setSelectedNodeId,
}: BuilderCanvasProps) {
  return (
    <main className="flex-1 overflow-y-auto bg-[#0d0d0d] flex flex-col items-center">
      {/* Viewport indicator */}
      <div className="sticky top-0 z-10 flex justify-center pt-3 pb-2 bg-[#0d0d0d] w-full">
        <Badge
          variant="outline"
          className="text-white/40 border-white/10 text-[10px] bg-transparent"
        >
          {viewport === "desktop" ? "Desktop — 1440px" : "Mobile — 390px"}
        </Badge>
      </div>

      {/* Canvas frame */}
      <div
        className={cn(
          "bg-white relative transition-all duration-300 mb-8 flex flex-col shadow-2xl",
          viewport === "desktop"
            ? "w-full max-w-[1280px] min-h-[calc(100vh-140px)] rounded-xl overflow-hidden"
            : "w-[390px] h-[780px] rounded-[3rem] border-[12px] border-[#222] overflow-hidden",
        )}
        onClick={() => setSelectedNodeId(null)}
      >
        {/* Scrollable content wrapper */}
        <div className="@container flex-1 overflow-y-auto overflow-x-hidden w-full h-full flex flex-col bg-white">
          {nodesCount === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-gray-400 gap-4 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                <Plus className="h-8 w-8 text-gray-300" />
              </div>
              <div className="max-w-xs">
                <p className="font-semibold text-gray-600 text-sm">Canvas vazio</p>
                <p className="text-xs text-gray-400 mt-1">
                  Adicione seções no painel à esquerda para construir sua página.
                </p>
              </div>
            </div>
          ) : (
            <ExperienceRenderer
              nodes={treeNodes}
              isEditing
              selectedNodeId={selectedNodeId}
              onSelectNode={(id: string) => {
                // Prevent bubbling to outer container which would clear selection
                setSelectedNodeId(id);
              }}
            />
          )}
        </div>
      </div>
    </main>
  );
}
