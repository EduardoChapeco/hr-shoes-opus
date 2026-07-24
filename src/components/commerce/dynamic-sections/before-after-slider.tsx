import React, { useState, useRef, useCallback } from "react";

interface BeforeAfterSliderProps {
  title?: string;
  subtitle?: string;
  before_image: string;
  after_image: string;
  before_label?: string;
  after_label?: string;
}

export function BeforeAfterSlider({
  title = "Resultados Reais",
  subtitle = "Arraste a barra central para comparar a transformação",
  before_image,
  after_image,
  before_label = "Antes",
  after_label = "Depois",
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  }, [handleMove]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  return (
    <section className="w-full py-12 px-4 md:px-8 max-w-5xl mx-auto">
      {(title || subtitle) && (
        <div className="text-center mb-8">
          {title && <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">{title}</h2>}
          {subtitle && <p className="text-muted-foreground text-base max-w-2xl mx-auto">{subtitle}</p>}
        </div>
      )}

      <div
        ref={containerRef}
        className="relative w-full h-[350px] md:h-[500px] rounded-2xl overflow-hidden shadow-xl select-none cursor-ew-resize border border-border"
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        {/* Background: After Image */}
        <img
          src={after_image || "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=800"}
          alt={after_label}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <span className="absolute top-4 right-4 bg-background/80 backdrop-blur-md text-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow border border-border">
          {after_label}
        </span>

        {/* Foreground: Before Image (Clipped) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={before_image || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800"}
            alt={before_label}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : "100%", maxWidth: "none" }}
          />
          <span className="absolute top-4 left-4 bg-background/80 backdrop-blur-md text-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow border border-border">
            {before_label}
          </span>
        </div>

        {/* Slider Divider Line */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl cursor-ew-resize"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white text-foreground shadow-lg flex items-center justify-center border-2 border-primary font-bold text-xs">
            ↔
          </div>
        </div>
      </div>
    </section>
  );
}
