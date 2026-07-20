import { Play } from "lucide-react";

interface VideoSectionProps {
  content: {
    title?: string;
    video_url: string;
    auto_play?: boolean;
    loop?: boolean;
  };
}

export function VideoSection({ content }: VideoSectionProps) {
  const title = content.title || "";
  const videoUrl = content.video_url || "";
  const autoPlay = Boolean(content.auto_play);
  const loop = Boolean(content.loop !== undefined ? content.loop : true);

  // Helper to extract YouTube ID
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Helper to extract Vimeo ID
  const getVimeoId = (url: string) => {
    const regExp = /vimeo\.com\/(?:video\/)?([0-9]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const ytId = getYouTubeId(videoUrl);
  const vimeoId = getVimeoId(videoUrl);

  const isMp4 = videoUrl ? !!videoUrl.split('?')[0].match(/\.(mp4|webm|mov|ogg)$/i) : false;

  const renderVideoPlayer = () => {
    if (ytId) {
      const embedUrl = `https://www.youtube.com/embed/${ytId}?autoplay=${autoPlay ? 1 : 0}&loop=${loop ? 1 : 0}&playlist=${ytId}`;
      return (
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title || "YouTube Video"}
        />
      );
    }

    if (vimeoId) {
      const embedUrl = `https://player.vimeo.com/video/${vimeoId}?autoplay=${autoPlay ? 1 : 0}&loop=${loop ? 1 : 0}`;
      return (
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full border-0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title={title || "Vimeo Video"}
        />
      );
    }

    if (isMp4) {
      return (
        <video
          src={videoUrl}
          autoPlay={autoPlay}
          loop={loop}
          muted={autoPlay}
          controls
          className="absolute inset-0 w-full h-full object-cover"
        />
      );
    }

    // Fallback if URL is invalid
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 text-muted-foreground p-6 text-center">
        <Play className="size-8 mb-2 text-primary" />
        <p className="text-xs font-semibold">Link de vídeo não reconhecido.</p>
        <span className="text-[10px] text-muted-foreground mt-1 max-w-xs break-all">
          {videoUrl || "Adicione uma URL válida nas configurações do bloco"}
        </span>
      </div>
    );
  };

  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-8 space-y-4">
      {title && (
        <h2 className="text-lg @md:text-xl font-black text-foreground tracking-tight text-center">
          {title}
        </h2>
      )}
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-border shadow-md bg-black">
        {renderVideoPlayer()}
      </div>
    </section>
  );
}
