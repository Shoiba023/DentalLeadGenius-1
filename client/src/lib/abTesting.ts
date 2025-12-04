/**
 * A/B Testing Library for Landing Page
 * 
 * Features:
 * - 6 headline variants optimized for different triggers
 * - Cookie-based variant assignment for consistency
 * - Analytics event tracking
 * - Scroll depth and CTA click tracking
 */

// Hero Headline Variants
export interface HeadlineVariant {
  id: string;
  category: "pain" | "roi" | "ai_power" | "human_free" | "time_saving" | "urgency";
  headline: string;
  subheadline: string;
}

export const HEADLINE_VARIANTS: HeadlineVariant[] = [
  {
    id: "A",
    category: "pain",
    headline: "Stop Losing Patients — Let AI Convert Every Lead For You",
    subheadline: "DentalLeadGenius is your clinic's 24/7 AI receptionist that instantly replies to patients, follows up every lead, and turns missed calls into booked appointments — without hiring extra staff."
  },
  {
    id: "B",
    category: "roi",
    headline: "Recover $5,000-$15,000 in Lost Revenue Every Month",
    subheadline: "Most dental practices lose 5-10 patients monthly to slow follow-ups. DentalLeadGenius responds in seconds, follows up automatically, and books appointments while you sleep."
  },
  {
    id: "C",
    category: "ai_power",
    headline: "Your 24/7 AI Receptionist That Never Misses a Call",
    subheadline: "While your competitors sleep, our AI engages every patient inquiry instantly — answering questions, booking appointments, and nurturing leads until they convert."
  },
  {
    id: "D",
    category: "human_free",
    headline: "Book More Patients Without Hiring More Staff",
    subheadline: "DentalLeadGenius handles all your patient inquiries automatically — from first contact to booked appointment — so your team can focus on in-office care."
  },
  {
    id: "E",
    category: "time_saving",
    headline: "Save 15+ Hours Per Week on Patient Follow-Ups",
    subheadline: "Stop chasing leads manually. Our AI automatically responds, qualifies, and books patients around the clock — giving your team their time back."
  },
  {
    id: "F",
    category: "urgency",
    headline: "78% of Patients Book With Whoever Responds First",
    subheadline: "Every minute you wait, patients call your competitors. DentalLeadGenius responds in under 30 seconds — 24/7, 365 days a year. Never lose another patient to slow follow-ups."
  }
];

// Cookie name for variant assignment
const VARIANT_COOKIE_NAME = "dlg_hero_variant";
const VARIANT_COOKIE_EXPIRY_DAYS = 30;

/**
 * Get or assign a variant for the current visitor
 */
export function getAssignedVariant(): HeadlineVariant {
  // Check for existing assignment in cookie
  const existingVariant = getCookie(VARIANT_COOKIE_NAME);
  if (existingVariant) {
    const variant = HEADLINE_VARIANTS.find(v => v.id === existingVariant);
    if (variant) return variant;
  }
  
  // Check for URL parameter override (for testing)
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    const overrideVariant = urlParams.get("variant");
    if (overrideVariant) {
      const variant = HEADLINE_VARIANTS.find(v => v.id === overrideVariant.toUpperCase());
      if (variant) {
        setCookie(VARIANT_COOKIE_NAME, variant.id, VARIANT_COOKIE_EXPIRY_DAYS);
        return variant;
      }
    }
  }
  
  // Assign random variant
  const randomIndex = Math.floor(Math.random() * HEADLINE_VARIANTS.length);
  const assignedVariant = HEADLINE_VARIANTS[randomIndex];
  setCookie(VARIANT_COOKIE_NAME, assignedVariant.id, VARIANT_COOKIE_EXPIRY_DAYS);
  
  return assignedVariant;
}

/**
 * Get variant by ID
 */
export function getVariantById(id: string): HeadlineVariant | undefined {
  return HEADLINE_VARIANTS.find(v => v.id === id);
}

/**
 * Cookie utilities
 */
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

function setCookie(name: string, value: string, days: number): void {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

/**
 * Analytics Event Types
 */
export type AnalyticsEventType =
  | "hero_variant_viewed"
  | "hero_variant_clicked"
  | "page_view"
  | "scroll_depth"
  | "cta_click"
  | "demo_started"
  | "demo_completed"
  | "form_submitted"
  | "booking_started"
  | "booking_completed";

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  variant?: string;
  metadata?: Record<string, string | number | boolean>;
  timestamp: number;
  sessionId: string;
  path: string;
}

// Session ID for analytics
let sessionId: string | null = null;

function getSessionId(): string {
  if (sessionId) return sessionId;
  
  // Check for existing session
  const existingSession = sessionStorage.getItem("dlg_session_id");
  if (existingSession) {
    sessionId = existingSession;
    return sessionId;
  }
  
  // Generate new session ID
  sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem("dlg_session_id", sessionId);
  return sessionId;
}

/**
 * Track an analytics event
 */
export async function trackEvent(
  type: AnalyticsEventType,
  metadata?: Record<string, string | number | boolean>
): Promise<void> {
  const variant = getAssignedVariant();
  
  // Use eventType for new API format
  const event = {
    eventType: type,
    variant: variant.id,
    metadata,
    timestamp: Date.now(),
    sessionId: getSessionId(),
    path: typeof window !== "undefined" ? window.location.pathname : "/",
    referrer: typeof document !== "undefined" ? document.referrer : undefined,
    deviceType: getDeviceType(),
    browser: getBrowserName()
  };
  
  // Log to console in development
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    console.log("[Analytics]", event);
  }
  
  // Send to backend
  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event)
    });
  } catch (error) {
    // Silently fail - analytics shouldn't break the app
    console.warn("[Analytics] Failed to track event:", error);
  }
}

/**
 * Detect device type
 */
function getDeviceType(): string {
  if (typeof window === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/tablet|ipad/i.test(ua)) return "tablet";
  if (/mobile|android|iphone/i.test(ua)) return "mobile";
  return "desktop";
}

/**
 * Detect browser name
 */
function getBrowserName(): string {
  if (typeof window === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (ua.includes("Chrome") && !ua.includes("Edge")) return "Chrome";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edge")) return "Edge";
  return "Other";
}

/**
 * Track hero variant impression
 */
export function trackHeroViewed(): void {
  const variant = getAssignedVariant();
  trackEvent("hero_variant_viewed", {
    variantId: variant.id,
    category: variant.category
  });
}

/**
 * Track hero CTA click
 */
export function trackHeroClicked(ctaText: string): void {
  const variant = getAssignedVariant();
  trackEvent("hero_variant_clicked", {
    variantId: variant.id,
    category: variant.category,
    ctaText
  });
}

/**
 * Track scroll depth
 */
export function trackScrollDepth(depth: number): void {
  trackEvent("scroll_depth", { depth });
}

/**
 * Track CTA click
 */
export function trackCTAClick(ctaId: string, ctaText: string): void {
  trackEvent("cta_click", { ctaId, ctaText });
}

/**
 * Track page view
 */
export function trackPageView(): void {
  trackEvent("page_view", {
    referrer: typeof document !== "undefined" ? document.referrer : ""
  });
}

/**
 * Initialize scroll depth tracking
 */
export function initScrollTracking(): () => void {
  if (typeof window === "undefined") return () => {};
  
  const thresholds = [25, 50, 75, 100];
  const trackedThresholds = new Set<number>();
  
  const handleScroll = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.round((scrollTop / docHeight) * 100);
    
    for (const threshold of thresholds) {
      if (scrollPercent >= threshold && !trackedThresholds.has(threshold)) {
        trackedThresholds.add(threshold);
        trackScrollDepth(threshold);
      }
    }
  };
  
  window.addEventListener("scroll", handleScroll, { passive: true });
  
  // Return cleanup function
  return () => {
    window.removeEventListener("scroll", handleScroll);
  };
}

/**
 * Get analytics summary from backend
 */
export async function getAnalyticsSummary(): Promise<{
  variants: Array<{
    id: string;
    views: number;
    clicks: number;
    ctr: number;
  }>;
} | null> {
  try {
    const response = await fetch("/api/analytics/summary");
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}
