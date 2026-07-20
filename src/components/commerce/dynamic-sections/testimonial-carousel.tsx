import * as React from "react";
import { Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TestimonialCarouselProps {
  node_id: string;
  block_type: string;
  content?: {
    title?: string;
    subtitle?: string;
    testimonials?: Array<{
      author: string;
      role?: string;
      content: string;
      rating?: number;
      avatar_url?: string;
    }>;
  };
  design_tokens?: any;
}

export function TestimonialCarousel({ content, design_tokens }: TestimonialCarouselProps) {
  const testimonials = content?.testimonials || [];

  return (
    <div
      className={cn("w-full py-12 md:py-24", design_tokens?.className)}
      style={{
        backgroundColor: design_tokens?.backgroundColor,
        color: design_tokens?.textColor,
      }}
    >
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        {(content?.title || content?.subtitle) && (
          <div className="mb-12 text-center">
            {content?.title && (
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
                {content.title}
              </h2>
            )}
            {content?.subtitle && (
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                {content.subtitle}
              </p>
            )}
          </div>
        )}

        {testimonials.length > 0 ? (
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {testimonials.map((item, idx) => (
                <CarouselItem key={idx} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <div className="p-1 h-full">
                    <Card className="h-full border-muted/50 bg-background/50 backdrop-blur shadow-sm">
                      <CardContent className="flex flex-col h-full p-6">
                        {item.rating && (
                          <div className="flex gap-1 mb-4 text-amber-400">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "h-4 w-4",
                                  i < item.rating! ? "fill-current" : "text-muted opacity-30 fill-transparent"
                                )}
                              />
                            ))}
                          </div>
                        )}
                        <p className="text-sm md:text-base leading-relaxed text-foreground flex-1 italic mb-6">
                          "{item.content}"
                        </p>
                        <div className="flex items-center gap-3 mt-auto">
                          {item.avatar_url ? (
                            <img
                              src={item.avatar_url}
                              alt={item.author}
                              className="h-10 w-10 rounded-full object-cover border"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                              {item.author.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-sm">{item.author}</p>
                            {item.role && (
                              <p className="text-xs text-muted-foreground">{item.role}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:block">
              <CarouselPrevious className="-left-12" />
              <CarouselNext className="-right-12" />
            </div>
          </Carousel>
        ) : (
          <div className="p-8 border border-dashed text-center text-muted-foreground bg-muted/50 rounded-xl">
            Adicione depoimentos pelo inspetor para exibi-los aqui.
          </div>
        )}
      </div>
    </div>
  );
}
