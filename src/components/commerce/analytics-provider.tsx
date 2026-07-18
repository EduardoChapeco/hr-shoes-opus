import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { trackBuilderEvent } from "@/services/telemetry.functions";

interface TrackViewProps {
  nodeId: string;
  blockType: string;
  documentId?: string;
  children: React.ReactNode;
}

export function TrackView({ nodeId, blockType, documentId, children }: TrackViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasTracked, setHasTracked] = useState(false);

  useEffect(() => {
    if (hasTracked) return;

    const currentRef = ref.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          // Dispara o evento de view assim que o bloco entra 50% na tela
          trackBuilderEvent({ data: { event_type: "view", node_id: nodeId, block_type: blockType, document_id: documentId } });
          setHasTracked(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(currentRef);

    return () => {
      observer.disconnect();
    };
  }, [hasTracked, nodeId, blockType, documentId]);

  return (
    <div ref={ref} className="w-full h-full contents" data-node-id={nodeId} data-block-type={blockType}>
      {children}
    </div>
  );
}

export function useBuilderClickTracking(nodeId: string, blockType: string, documentId?: string) {
  const trackClick = (metadata?: Record<string, any>) => {
    trackBuilderEvent({ 
      data: { 
        event_type: "click", 
        node_id: nodeId, 
        block_type: blockType, 
        document_id: documentId,
        metadata
      } 
    });
  };

  return trackClick;
}
