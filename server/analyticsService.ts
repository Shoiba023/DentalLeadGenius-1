/**
 * Analytics Service - Comprehensive Analytics Engine
 * 
 * Provides persistent storage and aggregation for:
 * - A/B test variant performance
 * - Page views and session tracking
 * - Scroll depth engagement
 * - CTA click tracking
 * - Demo booking conversions
 * - Email/SMS engagement
 * - Lead quality scoring
 * - City-based performance
 * - Heatmap data
 */

import { db } from "./db";
import { 
  analyticsEvents, 
  sessionMetrics, 
  leadScores, 
  messageEvents, 
  dailyAnalytics,
  heatmapEvents,
  leads,
  type InsertAnalyticsEvent,
  type InsertSessionMetric,
  type InsertLeadScore,
  type InsertMessageEvent,
  type InsertDailyAnalytics,
  type InsertHeatmapEvent,
  type AnalyticsEvent,
  type SessionMetric,
  type LeadScore,
  type Lead
} from "@shared/schema";
import { eq, and, gte, lte, desc, sql, count, avg, sum } from "drizzle-orm";

// ═══════════════════════════════════════════════════════════════════════════
// EVENT TRACKING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Track an analytics event
 */
export async function trackAnalyticsEvent(event: InsertAnalyticsEvent): Promise<void> {
  try {
    await db.insert(analyticsEvents).values(event);
    
    // Update session metrics
    await updateSessionMetrics(event);
    
    console.log(`[Analytics] ${event.eventType}`, {
      variant: event.variant,
      path: event.path,
      sessionId: event.sessionId?.substring(0, 20) + "..."
    });
  } catch (error) {
    console.error("[Analytics] Error tracking event:", error);
  }
}

/**
 * Update session metrics based on event
 * Uses upsert pattern to handle race conditions
 */
async function updateSessionMetrics(event: InsertAnalyticsEvent): Promise<void> {
  try {
    const now = new Date();
    const sessionId = event.sessionId;

    // Use PostgreSQL upsert (ON CONFLICT DO UPDATE) to handle race conditions
    await db.execute(sql`
      INSERT INTO session_metrics (
        session_id, user_id, clinic_id, variant, 
        first_page_view, last_activity, page_views, 
        max_scroll_depth, cta_clicks, demo_started, demo_completed,
        city, country, device_type, referrer, landing_page
      ) VALUES (
        ${sessionId}, 
        ${event.userId || null}, 
        ${event.clinicId || null}, 
        ${event.variant || null},
        ${now}, 
        ${now}, 
        ${event.eventType === "page_view" ? 1 : 0},
        ${event.eventType === "scroll_depth" ? (event.metadata?.depth as number || 0) : 0},
        ${event.eventType === "cta_click" ? 1 : 0},
        ${event.eventType === "demo_started"},
        ${event.eventType === "demo_completed"},
        ${event.city || null},
        ${event.country || null},
        ${event.deviceType || null},
        ${event.referrer || null},
        ${event.path || null}
      )
      ON CONFLICT (session_id) DO UPDATE SET
        last_activity = ${now},
        exit_page = ${event.path || null},
        page_views = CASE 
          WHEN ${event.eventType} = 'page_view' 
          THEN session_metrics.page_views + 1 
          ELSE session_metrics.page_views 
        END,
        max_scroll_depth = CASE 
          WHEN ${event.eventType} = 'scroll_depth' AND ${event.metadata?.depth as number || 0} > session_metrics.max_scroll_depth 
          THEN ${event.metadata?.depth as number || 0}
          ELSE session_metrics.max_scroll_depth 
        END,
        cta_clicks = CASE 
          WHEN ${event.eventType} = 'cta_click' 
          THEN session_metrics.cta_clicks + 1 
          ELSE session_metrics.cta_clicks 
        END,
        demo_started = session_metrics.demo_started OR ${event.eventType === "demo_started"},
        demo_completed = session_metrics.demo_completed OR ${event.eventType === "demo_completed"},
        session_duration = EXTRACT(EPOCH FROM (${now}::timestamp - session_metrics.first_page_view))::integer,
        bounced = CASE 
          WHEN session_metrics.page_views = 1 
            AND EXTRACT(EPOCH FROM (${now}::timestamp - session_metrics.first_page_view)) < 30 
          THEN true 
          ELSE false 
        END
    `);
  } catch (error) {
    console.error("[Analytics] Error updating session metrics:", error);
  }
}

/**
 * Track heatmap click event
 */
export async function trackHeatmapEvent(event: InsertHeatmapEvent): Promise<void> {
  try {
    await db.insert(heatmapEvents).values(event);
  } catch (error) {
    console.error("[Analytics] Error tracking heatmap event:", error);
  }
}

/**
 * Track message event (email, SMS)
 */
export async function trackMessageEvent(event: InsertMessageEvent): Promise<void> {
  try {
    await db.insert(messageEvents).values(event);
  } catch (error) {
    console.error("[Analytics] Error tracking message event:", error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// A/B TEST ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

export interface VariantStats {
  id: string;
  views: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
}

/**
 * Get A/B test variant performance
 */
export async function getVariantPerformance(
  startDate?: Date,
  endDate?: Date
): Promise<VariantStats[]> {
  try {
    const conditions = [];
    if (startDate) conditions.push(gte(analyticsEvents.createdAt, startDate));
    if (endDate) conditions.push(lte(analyticsEvents.createdAt, endDate));

    // Get view counts by variant
    const viewResults = await db
      .select({
        variant: analyticsEvents.variant,
        count: count()
      })
      .from(analyticsEvents)
      .where(and(
        eq(analyticsEvents.eventType, "hero_variant_viewed"),
        ...conditions
      ))
      .groupBy(analyticsEvents.variant);

    // Get click counts by variant
    const clickResults = await db
      .select({
        variant: analyticsEvents.variant,
        count: count()
      })
      .from(analyticsEvents)
      .where(and(
        eq(analyticsEvents.eventType, "hero_variant_clicked"),
        ...conditions
      ))
      .groupBy(analyticsEvents.variant);

    // Get conversion counts by variant (demo completed)
    const conversionResults = await db
      .select({
        variant: sessionMetrics.variant,
        count: count()
      })
      .from(sessionMetrics)
      .where(and(
        eq(sessionMetrics.demoCompleted, true),
        ...conditions.map(c => c) // Map conditions for sessionMetrics
      ))
      .groupBy(sessionMetrics.variant);

    // Combine results
    const variants = ["A", "B", "C", "D", "E", "F"];
    const stats: VariantStats[] = variants.map(id => {
      const views = viewResults.find(r => r.variant === id)?.count || 0;
      const clicks = clickResults.find(r => r.variant === id)?.count || 0;
      const conversions = conversionResults.find(r => r.variant === id)?.count || 0;

      return {
        id,
        views,
        clicks,
        conversions,
        ctr: views > 0 ? Math.round((clicks / views) * 100) : 0,
        conversionRate: views > 0 ? Math.round((conversions / views) * 100) : 0
      };
    });

    // Sort by conversion rate descending
    return stats.sort((a, b) => b.conversionRate - a.conversionRate);
  } catch (error) {
    console.error("[Analytics] Error getting variant performance:", error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNNEL ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

export interface FunnelStats {
  pageViews: number;
  uniqueVisitors: number;
  scrolled50: number;
  scrolled75: number;
  ctaClicks: number;
  demoStarts: number;
  demoCompletes: number;
  leadsCreated: number;
  conversionRates: {
    viewToScroll: number;
    scrollToClick: number;
    clickToDemo: number;
    demoToComplete: number;
    overallConversion: number;
  };
}

/**
 * Get conversion funnel stats
 */
export async function getFunnelStats(
  startDate?: Date,
  endDate?: Date,
  clinicId?: string
): Promise<FunnelStats> {
  try {
    const conditions = [];
    if (startDate) conditions.push(gte(analyticsEvents.createdAt, startDate));
    if (endDate) conditions.push(lte(analyticsEvents.createdAt, endDate));
    if (clinicId) conditions.push(eq(analyticsEvents.clinicId, clinicId));

    // Get event counts
    const eventCounts = await db
      .select({
        eventType: analyticsEvents.eventType,
        count: count()
      })
      .from(analyticsEvents)
      .where(and(...conditions))
      .groupBy(analyticsEvents.eventType);

    // Get unique visitors
    const uniqueVisitors = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${analyticsEvents.sessionId})` })
      .from(analyticsEvents)
      .where(and(...conditions));

    // Get scroll depth counts
    const scroll50 = await db
      .select({ count: count() })
      .from(analyticsEvents)
      .where(and(
        eq(analyticsEvents.eventType, "scroll_depth"),
        sql`${analyticsEvents.metadata}->>'depth' = '50'`,
        ...conditions
      ));

    const scroll75 = await db
      .select({ count: count() })
      .from(analyticsEvents)
      .where(and(
        eq(analyticsEvents.eventType, "scroll_depth"),
        sql`${analyticsEvents.metadata}->>'depth' = '75'`,
        ...conditions
      ));

    // Get session-based metrics
    const sessionConditions = [];
    if (startDate) sessionConditions.push(gte(sessionMetrics.createdAt, startDate));
    if (endDate) sessionConditions.push(lte(sessionMetrics.createdAt, endDate));
    if (clinicId) sessionConditions.push(eq(sessionMetrics.clinicId, clinicId));

    const demoStarts = await db
      .select({ count: count() })
      .from(sessionMetrics)
      .where(and(eq(sessionMetrics.demoStarted, true), ...sessionConditions));

    const demoCompletes = await db
      .select({ count: count() })
      .from(sessionMetrics)
      .where(and(eq(sessionMetrics.demoCompleted, true), ...sessionConditions));

    const leadsCreated = await db
      .select({ count: count() })
      .from(sessionMetrics)
      .where(and(eq(sessionMetrics.leadCreated, true), ...sessionConditions));

    // Calculate values
    const pageViews = eventCounts.find(e => e.eventType === "page_view")?.count || 0;
    const ctaClicks = eventCounts.find(e => e.eventType === "cta_click")?.count || 0;
    const visitors = uniqueVisitors[0]?.count || 0;
    const scrolled50 = scroll50[0]?.count || 0;
    const scrolled75 = scroll75[0]?.count || 0;
    const demos = demoStarts[0]?.count || 0;
    const completed = demoCompletes[0]?.count || 0;
    const leads = leadsCreated[0]?.count || 0;

    return {
      pageViews,
      uniqueVisitors: visitors,
      scrolled50,
      scrolled75,
      ctaClicks,
      demoStarts: demos,
      demoCompletes: completed,
      leadsCreated: leads,
      conversionRates: {
        viewToScroll: visitors > 0 ? Math.round((scrolled50 / visitors) * 100) : 0,
        scrollToClick: scrolled50 > 0 ? Math.round((ctaClicks / scrolled50) * 100) : 0,
        clickToDemo: ctaClicks > 0 ? Math.round((demos / ctaClicks) * 100) : 0,
        demoToComplete: demos > 0 ? Math.round((completed / demos) * 100) : 0,
        overallConversion: visitors > 0 ? Math.round((completed / visitors) * 100) : 0
      }
    };
  } catch (error) {
    console.error("[Analytics] Error getting funnel stats:", error);
    return {
      pageViews: 0,
      uniqueVisitors: 0,
      scrolled50: 0,
      scrolled75: 0,
      ctaClicks: 0,
      demoStarts: 0,
      demoCompletes: 0,
      leadsCreated: 0,
      conversionRates: {
        viewToScroll: 0,
        scrollToClick: 0,
        clickToDemo: 0,
        demoToComplete: 0,
        overallConversion: 0
      }
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CITY-BASED ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

export interface CityStats {
  city: string;
  country: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
}

/**
 * Get city-based performance
 */
export async function getCityPerformance(
  limit = 20,
  startDate?: Date,
  endDate?: Date
): Promise<CityStats[]> {
  try {
    const conditions = [];
    if (startDate) conditions.push(gte(sessionMetrics.createdAt, startDate));
    if (endDate) conditions.push(lte(sessionMetrics.createdAt, endDate));

    const results = await db
      .select({
        city: sessionMetrics.city,
        country: sessionMetrics.country,
        visitors: count(),
        conversions: sql<number>`SUM(CASE WHEN ${sessionMetrics.demoCompleted} = true THEN 1 ELSE 0 END)`
      })
      .from(sessionMetrics)
      .where(and(
        sql`${sessionMetrics.city} IS NOT NULL`,
        ...conditions
      ))
      .groupBy(sessionMetrics.city, sessionMetrics.country)
      .orderBy(desc(count()))
      .limit(limit);

    return results.map(r => ({
      city: r.city || "Unknown",
      country: r.country || "Unknown",
      visitors: r.visitors,
      conversions: r.conversions || 0,
      conversionRate: r.visitors > 0 ? Math.round((r.conversions / r.visitors) * 100) : 0
    }));
  } catch (error) {
    console.error("[Analytics] Error getting city performance:", error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL/SMS ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

export interface MessageStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
}

/**
 * Get email campaign performance
 */
export async function getEmailStats(
  campaignId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<MessageStats> {
  return getMessageStats("email", campaignId, startDate, endDate);
}

/**
 * Get SMS campaign performance
 */
export async function getSmsStats(
  campaignId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<MessageStats> {
  return getMessageStats("sms", campaignId, startDate, endDate);
}

async function getMessageStats(
  messageType: string,
  campaignId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<MessageStats> {
  try {
    const conditions = [eq(messageEvents.messageType, messageType)];
    if (campaignId) conditions.push(eq(messageEvents.campaignId, campaignId));
    if (startDate) conditions.push(gte(messageEvents.createdAt, startDate));
    if (endDate) conditions.push(lte(messageEvents.createdAt, endDate));

    const results = await db
      .select({
        eventType: messageEvents.eventType,
        count: count()
      })
      .from(messageEvents)
      .where(and(...conditions))
      .groupBy(messageEvents.eventType);

    const getCount = (type: string) => results.find(r => r.eventType === type)?.count || 0;

    const sent = getCount("sent");
    const delivered = getCount("delivered");
    const opened = getCount("opened");
    const clicked = getCount("clicked");
    const replied = getCount("replied");
    const bounced = getCount("bounced");
    const unsubscribed = getCount("unsubscribed");

    return {
      sent,
      delivered,
      opened,
      clicked,
      replied,
      bounced,
      unsubscribed,
      openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
      clickRate: opened > 0 ? Math.round((clicked / opened) * 100) : 0,
      replyRate: sent > 0 ? Math.round((replied / sent) * 100) : 0
    };
  } catch (error) {
    console.error(`[Analytics] Error getting ${messageType} stats:`, error);
    return {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      replied: 0,
      bounced: 0,
      unsubscribed: 0,
      openRate: 0,
      clickRate: 0,
      replyRate: 0
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// LEAD SCORING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate and store lead score
 */
export async function calculateLeadScore(leadId: string): Promise<LeadScore | null> {
  try {
    // Get lead data
    const leadData = await db
      .select()
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);

    if (leadData.length === 0) return null;
    const lead = leadData[0];

    // Get message engagement for this lead
    const emailEvents = await db
      .select({
        eventType: messageEvents.eventType,
        count: count()
      })
      .from(messageEvents)
      .where(eq(messageEvents.leadId, leadId))
      .groupBy(messageEvents.eventType);

    const emailOpens = emailEvents.find(e => e.eventType === "opened")?.count || 0;
    const emailClicks = emailEvents.find(e => e.eventType === "clicked")?.count || 0;

    // Calculate scores (0-25 each, total 0-100)
    
    // Profile score (data completeness)
    let profileScore = 0;
    if (lead.email) profileScore += 10;
    if (lead.phone) profileScore += 10;
    if (lead.websiteUrl) profileScore += 5;
    
    // Engagement score (email interaction)
    let engagementScore = 0;
    engagementScore += Math.min(emailOpens * 3, 15);
    engagementScore += Math.min(emailClicks * 5, 10);

    // Behavior score (website interaction)
    let behaviorScore = 0;
    // Check if lead has demo requested
    if (lead.status === "demo_booked") behaviorScore += 25;
    else if (lead.status === "replied") behaviorScore += 15;
    else if (lead.status === "contacted") behaviorScore += 5;

    // Recency score (last activity)
    let recencyScore = 0;
    const lastActivity = lead.updatedAt || lead.createdAt;
    if (lastActivity) {
      const daysSinceActivity = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceActivity <= 1) recencyScore = 25;
      else if (daysSinceActivity <= 3) recencyScore = 20;
      else if (daysSinceActivity <= 7) recencyScore = 15;
      else if (daysSinceActivity <= 14) recencyScore = 10;
      else if (daysSinceActivity <= 30) recencyScore = 5;
    }

    const overallScore = profileScore + engagementScore + behaviorScore + recencyScore;
    
    // Determine category
    let category: "hot" | "warm" | "cold";
    if (overallScore >= 70) category = "hot";
    else if (overallScore >= 40) category = "warm";
    else category = "cold";

    // Parse rating safely
    const googleRating = lead.rating ? parseFloat(lead.rating) : null;

    // Upsert lead score
    const factors = {
      hasEmail: !!lead.email,
      hasPhone: !!lead.phone,
      hasWebsite: !!lead.websiteUrl,
      googleRating: googleRating,
      reviewCount: lead.reviewCount || null,
      emailOpens,
      emailClicks,
      lastActivity: lastActivity?.toISOString() || "",
      demoRequested: lead.status === "demo_booked"
    };

    const scoreData = {
      leadId,
      clinicId: lead.clinicId || undefined,
      overallScore,
      category,
      engagementScore,
      behaviorScore,
      profileScore,
      recencyScore,
      factors
    };

    // Check if score exists
    const existing = await db
      .select()
      .from(leadScores)
      .where(eq(leadScores.leadId, leadId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(leadScores)
        .set({
          ...scoreData,
          updatedAt: new Date(),
          scoredAt: new Date()
        })
        .where(eq(leadScores.leadId, leadId));
    } else {
      await db.insert(leadScores).values(scoreData);
    }

    // Return the score
    const result = await db
      .select()
      .from(leadScores)
      .where(eq(leadScores.leadId, leadId))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("[Analytics] Error calculating lead score:", error);
    return null;
  }
}

/**
 * Get lead score distribution
 */
export async function getLeadScoreDistribution(clinicId?: string): Promise<{
  hot: number;
  warm: number;
  cold: number;
  total: number;
  averageScore: number;
}> {
  try {
    const conditions = [];
    if (clinicId) conditions.push(eq(leadScores.clinicId, clinicId));

    const results = await db
      .select({
        category: leadScores.category,
        count: count(),
        avgScore: avg(leadScores.overallScore)
      })
      .from(leadScores)
      .where(and(...conditions))
      .groupBy(leadScores.category);

    const hot = results.find(r => r.category === "hot")?.count || 0;
    const warm = results.find(r => r.category === "warm")?.count || 0;
    const cold = results.find(r => r.category === "cold")?.count || 0;
    const total = hot + warm + cold;

    // Calculate overall average
    const allAvg = await db
      .select({ avg: avg(leadScores.overallScore) })
      .from(leadScores)
      .where(and(...conditions));

    return {
      hot,
      warm,
      cold,
      total,
      averageScore: Math.round(Number(allAvg[0]?.avg || 0))
    };
  } catch (error) {
    console.error("[Analytics] Error getting lead score distribution:", error);
    return { hot: 0, warm: 0, cold: 0, total: 0, averageScore: 0 };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HEATMAP ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

export interface HeatmapData {
  x: number;
  y: number;
  intensity: number;
}

/**
 * Get heatmap data for a specific path
 */
export async function getHeatmapData(
  path: string,
  startDate?: Date,
  endDate?: Date
): Promise<HeatmapData[]> {
  try {
    const conditions = [eq(heatmapEvents.path, path)];
    if (startDate) conditions.push(gte(heatmapEvents.createdAt, startDate));
    if (endDate) conditions.push(lte(heatmapEvents.createdAt, endDate));

    // Group clicks by 5% grid cells
    const results = await db
      .select({
        x: sql<number>`FLOOR(${heatmapEvents.x} / 5) * 5`,
        y: sql<number>`FLOOR(${heatmapEvents.y} / 5) * 5`,
        intensity: count()
      })
      .from(heatmapEvents)
      .where(and(...conditions))
      .groupBy(
        sql`FLOOR(${heatmapEvents.x} / 5) * 5`,
        sql`FLOOR(${heatmapEvents.y} / 5) * 5`
      );

    // Normalize intensity (0-100)
    const maxIntensity = Math.max(...results.map(r => r.intensity), 1);
    return results.map(r => ({
      x: r.x,
      y: r.y,
      intensity: Math.round((r.intensity / maxIntensity) * 100)
    }));
  } catch (error) {
    console.error("[Analytics] Error getting heatmap data:", error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DAILY AGGREGATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate daily analytics snapshot
 */
export async function generateDailySnapshot(date: Date, clinicId?: string): Promise<void> {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get funnel stats for the day
    const funnel = await getFunnelStats(startOfDay, endOfDay, clinicId);
    
    // Get variant stats
    const variants = await getVariantPerformance(startOfDay, endOfDay);
    const variantStats: Record<string, { views: number; clicks: number; conversions: number }> = {};
    variants.forEach(v => {
      variantStats[v.id] = { views: v.views, clicks: v.clicks, conversions: v.conversions };
    });

    // Get city stats
    const cities = await getCityPerformance(10, startOfDay, endOfDay);
    const cityStats: Record<string, { views: number; conversions: number }> = {};
    cities.forEach(c => {
      cityStats[c.city] = { views: c.visitors, conversions: c.conversions };
    });

    // Get email stats
    const emailStats = await getEmailStats(undefined, startOfDay, endOfDay);
    
    // Get SMS stats
    const smsStats = await getSmsStats(undefined, startOfDay, endOfDay);

    // Get session stats
    const sessionStats = await db
      .select({
        avgDuration: avg(sessionMetrics.sessionDuration),
        avgScrollDepth: avg(sessionMetrics.maxScrollDepth),
        bounceCount: sql<number>`SUM(CASE WHEN ${sessionMetrics.bounced} = true THEN 1 ELSE 0 END)`
      })
      .from(sessionMetrics)
      .where(and(
        gte(sessionMetrics.createdAt, startOfDay),
        lte(sessionMetrics.createdAt, endOfDay),
        clinicId ? eq(sessionMetrics.clinicId, clinicId) : sql`1=1`
      ));

    const bounceCount = sessionStats[0]?.bounceCount || 0;
    const bounceRate = funnel.uniqueVisitors > 0 
      ? Math.round((bounceCount / funnel.uniqueVisitors) * 100) 
      : 0;

    // Upsert daily snapshot
    const snapshotData: InsertDailyAnalytics = {
      date: startOfDay,
      clinicId,
      pageViews: funnel.pageViews,
      uniqueVisitors: funnel.uniqueVisitors,
      bounceRate,
      avgSessionDuration: Math.round(Number(sessionStats[0]?.avgDuration || 0)),
      ctaClicks: funnel.ctaClicks,
      avgScrollDepth: Math.round(Number(sessionStats[0]?.avgScrollDepth || 0)),
      demoStarts: funnel.demoStarts,
      demoCompletes: funnel.demoCompletes,
      leadsCreated: funnel.leadsCreated,
      emailsSent: emailStats.sent,
      emailsOpened: emailStats.opened,
      emailsClicked: emailStats.clicked,
      smsSent: smsStats.sent,
      smsReplied: smsStats.replied,
      variantStats,
      cityStats
    };

    // Check if snapshot exists
    const existing = await db
      .select()
      .from(dailyAnalytics)
      .where(and(
        eq(dailyAnalytics.date, startOfDay),
        clinicId ? eq(dailyAnalytics.clinicId, clinicId) : sql`${dailyAnalytics.clinicId} IS NULL`
      ))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(dailyAnalytics)
        .set(snapshotData)
        .where(eq(dailyAnalytics.id, existing[0].id));
    } else {
      await db.insert(dailyAnalytics).values(snapshotData);
    }

    console.log(`[Analytics] Generated daily snapshot for ${startOfDay.toISOString().split('T')[0]}`);
  } catch (error) {
    console.error("[Analytics] Error generating daily snapshot:", error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD SUMMARY
// ═══════════════════════════════════════════════════════════════════════════

export interface DashboardSummary {
  overview: {
    totalVisitors: number;
    totalDemos: number;
    totalLeads: number;
    conversionRate: number;
    avgSessionDuration: number;
  };
  today: {
    visitors: number;
    demos: number;
    leads: number;
  };
  trends: {
    visitorsChange: number; // percentage change from yesterday
    demosChange: number;
    leadsChange: number;
  };
  topVariant: VariantStats | null;
  topCity: CityStats | null;
  leadScores: {
    hot: number;
    warm: number;
    cold: number;
  };
}

/**
 * Get comprehensive dashboard summary
 */
export async function getDashboardSummary(clinicId?: string): Promise<DashboardSummary> {
  try {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get today's funnel
    const todayFunnel = await getFunnelStats(today, now, clinicId);
    
    // Get yesterday's funnel
    const yesterdayFunnel = await getFunnelStats(yesterday, today, clinicId);

    // Get all-time funnel
    const allTimeFunnel = await getFunnelStats(undefined, undefined, clinicId);

    // Get variants and find top performer
    const variants = await getVariantPerformance();
    const topVariant = variants.length > 0 ? variants[0] : null;

    // Get city performance
    const cities = await getCityPerformance(1);
    const topCity = cities.length > 0 ? cities[0] : null;

    // Get lead score distribution
    const leadDist = await getLeadScoreDistribution(clinicId);

    // Calculate avg session duration
    const sessionDuration = await db
      .select({ avg: avg(sessionMetrics.sessionDuration) })
      .from(sessionMetrics)
      .where(clinicId ? eq(sessionMetrics.clinicId, clinicId) : sql`1=1`);

    // Calculate trends
    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      overview: {
        totalVisitors: allTimeFunnel.uniqueVisitors,
        totalDemos: allTimeFunnel.demoCompletes,
        totalLeads: allTimeFunnel.leadsCreated,
        conversionRate: allTimeFunnel.conversionRates.overallConversion,
        avgSessionDuration: Math.round(Number(sessionDuration[0]?.avg || 0))
      },
      today: {
        visitors: todayFunnel.uniqueVisitors,
        demos: todayFunnel.demoCompletes,
        leads: todayFunnel.leadsCreated
      },
      trends: {
        visitorsChange: calcChange(todayFunnel.uniqueVisitors, yesterdayFunnel.uniqueVisitors),
        demosChange: calcChange(todayFunnel.demoCompletes, yesterdayFunnel.demoCompletes),
        leadsChange: calcChange(todayFunnel.leadsCreated, yesterdayFunnel.leadsCreated)
      },
      topVariant,
      topCity,
      leadScores: {
        hot: leadDist.hot,
        warm: leadDist.warm,
        cold: leadDist.cold
      }
    };
  } catch (error) {
    console.error("[Analytics] Error getting dashboard summary:", error);
    return {
      overview: {
        totalVisitors: 0,
        totalDemos: 0,
        totalLeads: 0,
        conversionRate: 0,
        avgSessionDuration: 0
      },
      today: { visitors: 0, demos: 0, leads: 0 },
      trends: { visitorsChange: 0, demosChange: 0, leadsChange: 0 },
      topVariant: null,
      topCity: null,
      leadScores: { hot: 0, warm: 0, cold: 0 }
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CTA CLICK ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

export interface CTAStats {
  ctaId: string;
  clicks: number;
  conversions: number;
  conversionRate: number;
}

/**
 * Get CTA click performance
 */
export async function getCTAPerformance(
  startDate?: Date,
  endDate?: Date
): Promise<CTAStats[]> {
  try {
    const conditions = [eq(analyticsEvents.eventType, "cta_click")];
    if (startDate) conditions.push(gte(analyticsEvents.createdAt, startDate));
    if (endDate) conditions.push(lte(analyticsEvents.createdAt, endDate));

    const results = await db
      .select({
        ctaId: sql<string>`${analyticsEvents.metadata}->>'ctaId'`,
        clicks: count()
      })
      .from(analyticsEvents)
      .where(and(...conditions))
      .groupBy(sql`${analyticsEvents.metadata}->>'ctaId'`)
      .orderBy(desc(count()));

    return results.map(r => ({
      ctaId: r.ctaId || "unknown",
      clicks: r.clicks,
      conversions: 0, // Would need to track conversion attribution
      conversionRate: 0
    }));
  } catch (error) {
    console.error("[Analytics] Error getting CTA performance:", error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SCROLL DEPTH ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

export interface ScrollDepthStats {
  depth: number;
  count: number;
  percentage: number;
}

/**
 * Get scroll depth distribution
 */
export async function getScrollDepthStats(
  startDate?: Date,
  endDate?: Date
): Promise<ScrollDepthStats[]> {
  try {
    const conditions = [eq(analyticsEvents.eventType, "scroll_depth")];
    if (startDate) conditions.push(gte(analyticsEvents.createdAt, startDate));
    if (endDate) conditions.push(lte(analyticsEvents.createdAt, endDate));

    const results = await db
      .select({
        depth: sql<number>`(${analyticsEvents.metadata}->>'depth')::integer`,
        count: count()
      })
      .from(analyticsEvents)
      .where(and(...conditions))
      .groupBy(sql`(${analyticsEvents.metadata}->>'depth')::integer`)
      .orderBy(sql`(${analyticsEvents.metadata}->>'depth')::integer`);

    const total = results.reduce((sum, r) => sum + r.count, 0);

    return results.map(r => ({
      depth: r.depth || 0,
      count: r.count,
      percentage: total > 0 ? Math.round((r.count / total) * 100) : 0
    }));
  } catch (error) {
    console.error("[Analytics] Error getting scroll depth stats:", error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DAILY TREND DATA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get daily analytics for charting
 */
export async function getDailyTrends(
  days = 30,
  clinicId?: string
): Promise<typeof dailyAnalytics.$inferSelect[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const conditions = [gte(dailyAnalytics.date, startDate)];
    if (clinicId) conditions.push(eq(dailyAnalytics.clinicId, clinicId));

    const results = await db
      .select()
      .from(dailyAnalytics)
      .where(and(...conditions))
      .orderBy(dailyAnalytics.date);

    return results;
  } catch (error) {
    console.error("[Analytics] Error getting daily trends:", error);
    return [];
  }
}

// Re-export DailyAnalytics type from schema
export type DailyAnalyticsRecord = typeof dailyAnalytics.$inferSelect;
