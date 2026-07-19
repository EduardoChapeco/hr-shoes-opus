import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, ShoppingBag, Loader2, Play, Pause } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { EmptyState } from "@/components/state/states";
import { Button } from "@/components/ui/button";
import { listPublicStories } from "@/services/cms.functions";

export const Route = createFileRoute("/_store/stories")({
  head: () => ({ meta: [{ title: "Stories — Hr Shoes" }] }),
  loader: async () => {
    const res = await listPublicStories();
    return {
      stories: res.status === "ok" ? res.data || [] : [],
    };
  },
  component: Page,
});

interface Story {
  id: string;
  media_url: string;
  link_url: string | null;
  status: string;
  sort_order: number;
  created_at: string;
}

function Page() {
  const { stories } = Route.useLoaderData() as { stories: Story[] };
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<any>(null);

  const activeStory = activeIdx !== null ? stories[activeIdx] : null;

  // Handle auto-advance
  useEffect(() => {
    if (activeIdx === null || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setProgress(0);
    const intervalTime = 50; // Update every 50ms
    const totalTime = 5000;  // 5 seconds
    const increment = (intervalTime / totalTime) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeIdx, isPaused]);

  const handlePrev = () => {
    if (activeIdx === null) return;
    if (activeIdx > 0) {
      setActiveIdx(activeIdx - 1);
      setProgress(0);
    } else {
      // Loop to end or reset progress
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (activeIdx === null) return;
    if (activeIdx < stories.length - 1) {
      setActiveIdx(activeIdx + 1);
      setProgress(0);
    } else {
      // Close player at the end of stories
      setActiveIdx(null);
      setProgress(0);
    }
  };

  const handleClose = () => {
    setActiveIdx(null);
    setProgress(0);
    setIsPaused(false);
  };

  const isVideo = (url: string) => {
    const cleanUrl = url.split("?")[0].toLowerCase();
    return (
      cleanUrl.endsWith(".mp4") ||
      cleanUrl.endsWith(".webm") ||
      cleanUrl.endsWith(".mov") ||
      cleanUrl.includes("/video/")
    );
  };

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12 min-h-[70vh]">
      <PageHeader
        eyebrow="Confira as novidades"
        title="Stories da Loja"
        description="Fique por dentro das últimas coleções, looks exclusivos e dicas de moda."
      />

      {stories.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Nenhum story ativo"
            description="Acompanhe nosso perfil administrativo para ver novas publicações em breve!"
          />
        </div>
      ) : (
        <div className="mt-10">
          {/* Stories Circular Grid */}
          <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
            {stories.map((story, index) => (
              <button
                key={story.id}
                onClick={() => {
                  setActiveIdx(index);
                  setIsPaused(false);
                }}
                className="group flex flex-col items-center gap-2 focus:outline-none transition-transform active:scale-95"
              >
                <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-primary via-pink-500 to-amber-400 group-hover:rotate-6 transition-transform duration-300">
                  <div className="p-1 bg-background rounded-full">
                    {isVideo(story.media_url) ? (
                      <div className="size-20 sm:size-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border relative">
                        <video
                          src={story.media_url}
                          className="h-full w-full object-cover rounded-full grayscale-[20%] group-hover:grayscale-0"
                          muted
                          playsInline
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                          <Play className="size-5 text-white fill-white opacity-80" />
                        </div>
                      </div>
                    ) : (
                      <img
                        src={story.media_url}
                        alt="Story Thumbnail"
                        className="size-20 sm:size-24 rounded-full object-cover border grayscale-[20%] group-hover:grayscale-0"
                      />
                    )}
                  </div>
                </div>
                <span className="text-xs font-semibold text-foreground tracking-tight">
                  Visualizar #{index + 1}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stories Full-screen Overlay Player */}
      {activeStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md transition-all duration-300">
          <div
            className="relative w-full max-w-lg aspect-[9/16] max-h-screen bg-black overflow-hidden flex flex-col shadow-2xl md:rounded-2xl"
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
          >
            {/* Top Progress Bars Indicators */}
            <div className="absolute top-3 left-3 right-3 z-30 flex gap-1">
              {stories.map((s, idx) => (
                <div key={s.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-75"
                    style={{
                      width:
                        idx < activeIdx!
                          ? "100%"
                          : idx === activeIdx!
                            ? `${progress}%`
                            : "0%",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Top Bar Header with Close/Pause indicators */}
            <div className="absolute top-6 left-4 right-4 z-30 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs border border-primary/40">
                  HR
                </div>
                <div>
                  <span className="text-xs font-bold block">Hr Shoes Oficial</span>
                  <span className="text-[10px] text-white/60">Story {activeIdx! + 1} de {stories.length}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isPaused && (
                  <Pause className="size-4 text-white/80 animate-pulse" />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                  }}
                  className="p-1 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
                >
                  <X className="size-6 text-white" />
                </button>
              </div>
            </div>

            {/* Click Navigation Areas (Left / Right overlays) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-0 top-0 bottom-0 w-[30%] z-20 cursor-w-resize"
              title="Voltar"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-0 top-0 bottom-0 w-[70%] z-20 cursor-e-resize"
              title="Avançar"
            />

            {/* Main Media Content */}
            <div className="flex-1 flex items-center justify-center z-10">
              {isVideo(activeStory.media_url) ? (
                <video
                  src={activeStory.media_url}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                  loop
                />
              ) : (
                <img
                  src={activeStory.media_url}
                  alt="Story Content"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Bottom Call To Action if Link is present */}
            {activeStory.link_url && (
              <div className="absolute bottom-8 left-4 right-4 z-30 text-center">
                <Button
                  asChild
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 shadow-lg flex items-center justify-center gap-2 rounded-xl text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <a href={activeStory.link_url} target="_blank" rel="noopener noreferrer">
                    <ShoppingBag className="size-4" />
                    Comprar Produto / Ver Mais
                  </a>
                </Button>
              </div>
            )}
          </div>

          {/* Large Screen Left/Right Shortcut buttons */}
          <div className="hidden md:flex absolute inset-x-8 justify-between items-center pointer-events-none z-30">
            <Button
              variant="outline"
              size="icon"
              className="size-12 rounded-full pointer-events-auto bg-black/40 text-white border-white/20 hover:bg-black/60"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              disabled={activeIdx === 0}
            >
              <ChevronLeft className="size-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-12 rounded-full pointer-events-auto bg-black/40 text-white border-white/20 hover:bg-black/60"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              disabled={activeIdx === stories.length - 1}
            >
              <ChevronRight className="size-6" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
