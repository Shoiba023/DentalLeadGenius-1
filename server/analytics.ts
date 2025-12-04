/**
 * Analytics Tracking Service
 * 
 * Handles event tracking for:
 * - A/B test variants
 * - Page views
 * - Scroll depth
 * - CTA clicks
 * - Demo bookings
 */

import { storage } from "./storage";

export interface AnalyticsEvent {
  type: string;
  variant?: string;
  metadata?: Record<string, string | number | boolean>;
  timestamp: number;
  sessionId: string;
  path: string;
}

// In-memory analytics storage (for demo purposes)
// In production, you'd want to persist this to a database
interface AnalyticsData {
  events: AnalyticsEvent[];
  variantStats: Map<string, { views: number; clicks: number }>;
}

const analyticsData: AnalyticsData = {
  events: [],
  variantStats: new Map([
    ["A", { views: 0, clicks: 0 }],
    ["B", { views: 0, clicks: 0 }],
    ["C", { views: 0, clicks: 0 }],
    ["D", { views: 0, clicks: 0 }],
    ["E", { views: 0, clicks: 0 }],
    ["F", { views: 0, clicks: 0 }]
  ])
};

/**
 * Track an analytics event
 */
export function trackEvent(event: AnalyticsEvent): void {
  // Store event
  analyticsData.events.push(event);
  
  // Limit stored events to prevent memory issues
  if (analyticsData.events.length > 10000) {
    analyticsData.events = analyticsData.events.slice(-5000);
  }
  
  // Update variant stats
  if (event.variant) {
    const stats = analyticsData.variantStats.get(event.variant);
    if (stats) {
      if (event.type === "hero_variant_viewed") {
        stats.views++;
      } else if (event.type === "hero_variant_clicked") {
        stats.clicks++;
      }
    }
  }
  
  console.log(`[Analytics] ${event.type}`, {
    variant: event.variant,
    path: event.path,
    sessionId: event.sessionId.substring(0, 20) + "..."
  });
}

/**
 * Get analytics summary for A/B test results
 */
export function getAnalyticsSummary(): {
  variants: Array<{
    id: string;
    views: number;
    clicks: number;
    ctr: number;
  }>;
  totalEvents: number;
  uniqueSessions: number;
} {
  const variants: Array<{ id: string; views: number; clicks: number; ctr: number }> = [];
  
  analyticsData.variantStats.forEach((stats, id) => {
    variants.push({
      id,
      views: stats.views,
      clicks: stats.clicks,
      ctr: stats.views > 0 ? Math.round((stats.clicks / stats.views) * 100) : 0
    });
  });
  
  // Sort by CTR descending
  variants.sort((a, b) => b.ctr - a.ctr);
  
  // Count unique sessions
  const uniqueSessions = new Set(analyticsData.events.map(e => e.sessionId)).size;
  
  return {
    variants,
    totalEvents: analyticsData.events.length,
    uniqueSessions
  };
}

/**
 * Get events by type
 */
export function getEventsByType(type: string, limit = 100): AnalyticsEvent[] {
  return analyticsData.events
    .filter(e => e.type === type)
    .slice(-limit);
}

/**
 * Get scroll depth analytics
 */
export function getScrollDepthStats(): { depth: number; count: number }[] {
  const scrollEvents = analyticsData.events.filter(e => e.type === "scroll_depth");
  const depthCounts: Record<number, number> = { 25: 0, 50: 0, 75: 0, 100: 0 };
  
  scrollEvents.forEach(event => {
    const depth = event.metadata?.depth as number;
    if (depth && depthCounts[depth] !== undefined) {
      depthCounts[depth]++;
    }
  });
  
  return Object.entries(depthCounts).map(([depth, count]) => ({
    depth: parseInt(depth),
    count
  }));
}

/**
 * Get CTA click stats
 */
export function getCTAClickStats(): Array<{ ctaId: string; clicks: number }> {
  const ctaEvents = analyticsData.events.filter(e => e.type === "cta_click");
  const ctaCounts: Record<string, number> = {};
  
  ctaEvents.forEach(event => {
    const ctaId = event.metadata?.ctaId as string;
    if (ctaId) {
      ctaCounts[ctaId] = (ctaCounts[ctaId] || 0) + 1;
    }
  });
  
  return Object.entries(ctaCounts)
    .map(([ctaId, clicks]) => ({ ctaId, clicks }))
    .sort((a, b) => b.clicks - a.clicks);
}

/**
 * Get conversion funnel stats
 */
export function getFunnelStats(): {
  pageViews: number;
  scrolled50: number;
  ctaClicks: number;
  demoStarts: number;
  demoCompletes: number;
} {
  const events = analyticsData.events;
  
  return {
    pageViews: events.filter(e => e.type === "page_view").length,
    scrolled50: events.filter(e => e.type === "scroll_depth" && e.metadata?.depth === 50).length,
    ctaClicks: events.filter(e => e.type === "cta_click").length,
    demoStarts: events.filter(e => e.type === "demo_started").length,
    demoCompletes: events.filter(e => e.type === "demo_completed").length
  };
}

/**
 * Reset analytics (for testing)
 */
export function resetAnalytics(): void {
  analyticsData.events = [];
  analyticsData.variantStats.forEach((stats) => {
    stats.views = 0;
    stats.clicks = 0;
  });
}

/**
 * Export analytics data for reporting
 */
export function exportAnalyticsData(): {
  summary: ReturnType<typeof getAnalyticsSummary>;
  scrollDepth: ReturnType<typeof getScrollDepthStats>;
  ctaClicks: ReturnType<typeof getCTAClickStats>;
  funnel: ReturnType<typeof getFunnelStats>;
} {
  return {
    summary: getAnalyticsSummary(),
    scrollDepth: getScrollDepthStats(),
    ctaClicks: getCTAClickStats(),
    funnel: getFunnelStats()
  };
}
