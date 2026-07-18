import { Instagram, Heart, MessageCircle } from "lucide-react";

interface SocialGridProps {
  content: {
    username: string;
    title?: string;
    posts?: Array<{
      image_url: string;
      link?: string;
    }>;
  };
}

export function SocialGrid({ content }: SocialGridProps) {
  const posts = content.posts || [];
  const title = content.title || "Siga-nos no Instagram";
  const username = content.username || "hrshoes";

  // Mock likes/comments numbers for a premium lively feel (wix hopp style)
  const mockMetrics = [
    { likes: "124", comments: "12" },
    { likes: "89", comments: "5" },
    { likes: "241", comments: "19" },
    { likes: "156", comments: "14" },
    { likes: "98", comments: "8" },
    { likes: "312", comments: "27" },
  ];

  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight">
            {title}
          </h2>
          <a
            href={`https://instagram.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5 mt-1"
          >
            <Instagram className="size-4" />
            @{username}
          </a>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
          Nenhuma publicação vinculada ao feed social.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {posts.slice(0, 6).map((post, idx) => {
            const metrics = mockMetrics[idx % mockMetrics.length];
            const Wrapper = post.link ? "a" : "div";
            const wrapperProps = post.link
              ? { href: post.link, target: "_blank", rel: "noopener noreferrer" }
              : {};

            return (
              <Wrapper
                key={idx}
                {...wrapperProps}
                className="relative group aspect-square rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center cursor-pointer shadow-xs"
              >
                <img
                  src={post.image_url}
                  alt={`Instagram Post ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                />

                {/* Overlaid Instagram Hover Actions (Wix Studio / premium feel) */}
                <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 text-white text-xs font-bold">
                  <span className="flex items-center gap-1">
                    <Heart className="size-4 fill-white" />
                    {metrics.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="size-4 fill-white" />
                    {metrics.comments}
                  </span>
                </div>
              </Wrapper>
            );
          })}
        </div>
      )}
    </section>
  );
}
