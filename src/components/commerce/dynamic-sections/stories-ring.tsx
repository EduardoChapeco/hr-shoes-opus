import * as React from "react";
import { useState } from "react";
import { Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface Story {
  id: string;
  thumbnail_url: string;
  media_url: string;
  type: "image" | "video";
  title: string;
}

interface StoriesRingProps {
  content: {
    stories: Story[];
  };
}

export function StoriesRing({ content }: StoriesRingProps) {
  const stories = content.stories || [];
  const [activeStory, setActiveStory] = useState<Story | null>(null);

  if (stories.length === 0) return null;

  return (
    <>
      {/* Ring / Bubbles */}
      <div className="w-full flex overflow-x-auto gap-4 py-4 px-4 scrollbar-hide snap-x">
        {stories.map((story) => (
          <button
            key={story.id}
            onClick={() => setActiveStory(story)}
            className="flex flex-col items-center gap-2 group snap-start shrink-0"
          >
            <div className="relative p-[3px] rounded-full bg-gradient-to-tr from-primary to-orange-500 transition-transform group-hover:scale-105 group-active:scale-95">
              <div className="w-20 h-20 bg-background rounded-full p-[2px]">
                <div className="w-full h-full rounded-full overflow-hidden relative">
                  <img src={story.thumbnail_url} alt={story.title} className="w-full h-full object-cover" />
                  {story.type === "video" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Play className="text-white w-6 h-6 fill-white" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <span className="text-xs font-medium max-w-[80px] truncate text-center">{story.title}</span>
          </button>
        ))}
      </div>

      {/* Fullscreen Story Viewer */}
      <Dialog open={!!activeStory} onOpenChange={(open) => !open && setActiveStory(null)}>
        <DialogContent className="max-w-md w-full h-[80vh] md:h-[90vh] p-0 overflow-hidden bg-black border-none rounded-2xl flex flex-col items-center justify-center">
          {activeStory && (
            <div className="w-full h-full relative">
              {activeStory.type === "video" ? (
                <video 
                  src={activeStory.media_url} 
                  autoPlay 
                  loop 
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img 
                  src={activeStory.media_url} 
                  alt={activeStory.title} 
                  className="w-full h-full object-cover"
                />
              )}
              {/* Overlay elements like close buttons or progress bars can go here */}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
