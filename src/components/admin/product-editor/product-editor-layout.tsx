import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Section {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface ProductEditorLayoutProps {
  sections: Section[];
  children: React.ReactNode;
  preview?: React.ReactNode;
}

export function ProductEditorLayout({ sections, children, preview }: ProductEditorLayoutProps) {
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id || "");

  useEffect(() => {
    const observers = new Map<string, IntersectionObserver>();
    
    const callback = (entries: IntersectionObserverEntry[]) => {
      // Find the most visible intersecting entry
      let maxRatio = 0;
      let visibleId = "";
      
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
          maxRatio = entry.intersectionRatio;
          visibleId = entry.target.id;
        }
      });
      
      if (visibleId) {
        setActiveSection(visibleId);
      }
    };

    const observer = new IntersectionObserver(callback, {
      root: null,
      rootMargin: "-20% 0px -60% 0px", // triggers when element is roughly in top third
      threshold: [0, 0.25, 0.5, 0.75, 1],
    });

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [sections]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100; // 100px offset for sticky header
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative pb-24 mt-6">
      {/* Sidebar Anchor Navigation */}
      <div className="lg:col-span-3 lg:sticky lg:top-[100px] hidden lg:flex flex-col gap-6">
        <nav className="flex flex-col space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollTo(section.id)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-left",
                activeSection === section.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {section.icon && (
                <span className={cn(
                  "size-4",
                  activeSection === section.id ? "text-primary" : "text-muted-foreground"
                )}>
                  {section.icon}
                </span>
              )}
              {section.label}
            </button>
          ))}
        </nav>

        {preview && (
          <div className="pt-4 border-t border-border">
            {preview}
          </div>
        )}
      </div>

      {/* Main Content Areas */}
      <div className="lg:col-span-9 space-y-8">
        {/* Mobile Navigation Pills */}
        <div className="flex lg:hidden overflow-x-auto pb-4 gap-2 sticky top-[72px] bg-background/95 backdrop-blur z-40 border-b">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollTo(section.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap border transition-colors",
                activeSection === section.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground"
              )}
            >
              {section.icon && <span className="size-4">{section.icon}</span>}
              {section.label}
            </button>
          ))}
        </div>

        {children}
      </div>
    </div>
  );
}
