import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getCookie, setCookie } from "vinxi/http";

// ---------------------------------------------------------------------------
// Telemetry Ingestion
// ---------------------------------------------------------------------------

export const trackBuilderEvent = createServerFn({ method: "POST" })
  .validator(
    z.object({
      event_type: z.enum(["view", "click"]),
      document_id: z.string().optional(),
      node_id: z.string(),
      block_type: z.string(),
      metadata: z.record(z.any()).optional(),
    })
  )
  .handler(async ({ data: input }) => {
    try {
      const db = getServerClient();

      // Retrieve or generate anonymous session_id
      let sessionId = getCookie("builder_session_id");
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        setCookie("builder_session_id", sessionId, { maxAge: 60 * 60 * 24 * 30, path: "/" });
      }

      const { error } = await db.from("builder_analytics_events").insert({
        event_type: input.event_type,
        document_id: input.document_id || null,
        node_id: input.node_id,
        block_type: input.block_type,
        session_id: sessionId,
        metadata: input.metadata || {},
      });

      if (error) {
        console.error("Failed to track builder event", error);
      }

      return { status: "ok" as const };
    } catch (e: unknown) {
      console.error(e);
      return { status: "error" as const };
    }
  });

// ---------------------------------------------------------------------------
// Admin Analytics Queries
// ---------------------------------------------------------------------------

interface AnalyticsEvent {
  event_type: string;
  node_id: string;
  block_type: string;
  created_at: string;
}

export const getBuilderAnalyticsSummary = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const db = getServerClient();
      
      // We will perform basic aggregations since we can't easily write complex 
      // materialized views in the rapid dev phase without manual raw SQL querying.
      
      const { data: events, error } = await db
        .from("builder_analytics_events")
        .select("event_type, node_id, block_type, created_at")
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      if (error) throw error;
      if (!events) return { status: "ok" as const, data: { totalViews: 0, totalClicks: 0, blockStats: [] } };

      const typedEvents = events as unknown as AnalyticsEvent[];

      const totalViews = typedEvents.filter((e: AnalyticsEvent) => e.event_type === "view").length;
      const totalClicks = typedEvents.filter((e: AnalyticsEvent) => e.event_type === "click").length;

      // Group by Block Type
      const blockAggregations: Record<string, { views: number; clicks: number }> = {};
      typedEvents.forEach((e: AnalyticsEvent) => {
        if (!blockAggregations[e.block_type]) {
          blockAggregations[e.block_type] = { views: 0, clicks: 0 };
        }
        if (e.event_type === "view") blockAggregations[e.block_type].views++;
        if (e.event_type === "click") blockAggregations[e.block_type].clicks++;
      });

      const blockStats = Object.entries(blockAggregations).map(([block_type, stats]) => {
        const ctr = stats.views > 0 ? (stats.clicks / stats.views) * 100 : 0;
        return { block_type, views: stats.views, clicks: stats.clicks, ctr: Number(ctr.toFixed(2)) };
      }).sort((a, b) => b.views - a.views);

      return { status: "ok" as const, data: { totalViews, totalClicks, blockStats } };
    } catch (e: unknown) {
      throw new Error("Erro ao carregar sumário analítico." );
    }
  });
