import * as React from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Laptop,
  Smartphone,
  Undo2,
  Redo2,
  LayoutTemplate,
  Settings2,
  ExternalLink,
  Save,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface BuilderTopBarProps {
  document: any;
  version: any;
  viewport: "desktop" | "mobile" | string;
  setViewport: (vp: any) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  previewUrl?: string | null;
  setIsTemplateModalOpen: (open: boolean) => void;
  handleSave: () => void;
  handlePublish: () => void;
  isSaving: boolean;
  isPublishing: boolean;
}

export function BuilderTopBar({
  document,
  version,
  viewport,
  setViewport,
  undo,
  redo,
  canUndo,
  canRedo,
  previewUrl,
  setIsTemplateModalOpen,
  handleSave,
  handlePublish,
  isSaving,
  isPublishing,
}: BuilderTopBarProps) {
  const navigate = useNavigate();

  return (
    <header className="flex-none h-12 bg-[#1a1a1a] border-b border-white/10 flex items-center justify-between px-3 gap-3">
      {/* Left: Back + Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => navigate({ to: "/admin/builder", search: {} as any })}
          className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs transition-colors shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:block">Sair</span>
        </button>
        <div className="h-4 w-px bg-white/10 hidden sm:block" />
        <div className="flex flex-col min-w-0">
          <span className="text-white text-sm font-semibold truncate">
            {document?.title ?? "Documento"}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <span className="text-white/40 text-[10px]">
              Rascunho v{version?.version_number ?? 1}
            </span>
          </div>
        </div>
      </div>

      {/* Center: Viewport */}
      <div className="flex items-center bg-white/5 rounded-lg p-1 gap-1">
        <button
          type="button"
          onClick={() => setViewport("desktop")}
          className={cn(
            "h-7 w-7 rounded-md flex items-center justify-center transition-colors",
            viewport === "desktop" ? "bg-white/15 text-white" : "text-white/40 hover:text-white/70",
          )}
        >
          <Laptop className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setViewport("mobile")}
          className={cn(
            "h-7 w-7 rounded-md flex items-center justify-center transition-colors",
            viewport === "mobile" ? "bg-white/15 text-white" : "text-white/40 hover:text-white/70",
          )}
        >
          <Smartphone className="h-4 w-4" />
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* History Controls */}
        <div className="flex items-center gap-1 mr-2 border-r border-white/10 pr-3">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className="p-1.5 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded hover:bg-white/10"
            title="Desfazer (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            className="p-1.5 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded hover:bg-white/10"
            title="Refazer (Ctrl+Shift+Z)"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        {(document?.slug === "home" || document?.document_type === "storefront") && (
          <button
            type="button"
            onClick={() => setIsTemplateModalOpen(true)}
            className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs px-3 py-1.5 rounded-lg border border-amber-500/30 transition-colors font-medium mr-1"
          >
            <LayoutTemplate className="h-3.5 w-3.5" />
            Trocar Template (Temas)
          </button>
        )}

        <Link
          to="/admin/configuracoes/loja"
          className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs transition-colors hidden md:flex border-r border-white/10 pr-3 mr-1"
          title="Logo, Favicon e Dados da Loja"
        >
          <Settings2 className="h-3.5 w-3.5" />
          Loja
        </Link>
        {previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs transition-colors hidden md:flex"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Visualizar
          </a>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          {isSaving ? "Salvando..." : "Salvar"}
        </button>
        <button
          type="button"
          onClick={handlePublish}
          disabled={isPublishing || isSaving}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 font-medium"
        >
          <Check className="h-3.5 w-3.5" />
          {isPublishing ? "Publicando..." : "Publicar"}
        </button>
      </div>
    </header>
  );
}
