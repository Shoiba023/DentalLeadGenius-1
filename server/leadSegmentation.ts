/**
 * Lead Segmentation Service
 * 
 * This module provides helper functions for managing lead statuses, sources, and tags.
 * It ensures consistent status transitions across the application and provides
 * reusable logic for campaign engines, webhooks, and API routes.
 */

import { storage } from "./storage";
import type { Lead, InsertLead } from "@shared/schema";

// Valid lead status transitions
export const LEAD_STATUSES = {
  NEW: "new",
  CONTACTED: "contacted",
  WARM: "warm",
  REPLIED: "replied",
  DEMO_BOOKED: "demo_booked",
  WON: "won",
  LOST: "lost",
} as const;

export type LeadStatus = typeof LEAD_STATUSES[keyof typeof LEAD_STATUSES];

// Common lead sources
export const LEAD_SOURCES = {
  MAPS_HELPER: "maps-helper",
  MANUAL: "manual",
  DEMO_REQUEST: "demo-request",
  WEBSITE: "website",
  REFERRAL: "referral",
  CAMPAIGN: "campaign",
} as const;

export type LeadSource = typeof LEAD_SOURCES[keyof typeof LEAD_SOURCES];

// Common lead tags
export const LEAD_TAGS = {
  HIGH_VALUE: "high_value",
  NO_SHOW: "no_show",
  INSURANCE_QUESTION: "insurance_question",
  URGENT: "urgent",
  VIP: "vip",
  NURTURE_COMPLETE: "nurture_complete",
  FROM_CAMPAIGN: "from_campaign",
  BOOKED_FROM_EMAIL: "booked_from_email",
} as const;

export type LeadTag = typeof LEAD_TAGS[keyof typeof LEAD_TAGS];

/**
 * Determines the appropriate segment for a lead based on its properties
 */
export function segmentLead(lead: Lead): {
  segment: string;
  priority: "high" | "medium" | "low";
  suggestedActions: string[];
} {
  const tags = lead.tags || [];
  
  // High priority: warm leads or those with recent activity
  if (lead.status === LEAD_STATUSES.WARM || lead.status === LEAD_STATUSES.REPLIED) {
    return {
      segment: "hot_leads",
      priority: "high",
      suggestedActions: [
        "Call within 24 hours",
        "Send personalized follow-up",
        "Schedule demo",
      ],
    };
  }
  
  // High priority: demo booked
  if (lead.status === LEAD_STATUSES.DEMO_BOOKED) {
    return {
      segment: "demo_scheduled",
      priority: "high",
      suggestedActions: [
        "Prepare demo presentation",
        "Send confirmation email",
        "Research lead's practice",
      ],
    };
  }
  
  // Medium priority: contacted but no response
  if (lead.status === LEAD_STATUSES.CONTACTED) {
    return {
      segment: "in_nurture",
      priority: "medium",
      suggestedActions: [
        "Continue automated sequence",
        "Try different channel (SMS/call)",
        "Check if email was delivered",
      ],
    };
  }
  
  // Medium priority: new with high-value tags
  if (lead.status === LEAD_STATUSES.NEW && tags.includes(LEAD_TAGS.HIGH_VALUE)) {
    return {
      segment: "new_high_value",
      priority: "high",
      suggestedActions: [
        "Prioritize outreach",
        "Personalized first email",
        "Add to VIP campaign",
      ],
    };
  }
  
  // Low priority: new leads
  if (lead.status === LEAD_STATUSES.NEW) {
    return {
      segment: "new_leads",
      priority: "medium",
      suggestedActions: [
        "Add to welcome sequence",
        "Verify contact info",
        "Segment by source",
      ],
    };
  }
  
  // Won leads - for retention
  if (lead.status === LEAD_STATUSES.WON) {
    return {
      segment: "customers",
      priority: "low",
      suggestedActions: [
        "Add to retention campaigns",
        "Request review/referral",
        "Upsell additional services",
      ],
    };
  }
  
  // Lost leads - potential re-engagement
  if (lead.status === LEAD_STATUSES.LOST) {
    return {
      segment: "lost_leads",
      priority: "low",
      suggestedActions: [
        "Add to re-engagement campaign after 90 days",
        "Analyze loss reason",
        "Consider different approach",
      ],
    };
  }
  
  return {
    segment: "other",
    priority: "low",
    suggestedActions: ["Review and categorize manually"],
  };
}

/**
 * Mark a lead as contacted (first outreach sent)
 */
export async function markContacted(leadId: string): Promise<Lead | undefined> {
  const lead = await storage.getLeadById(leadId);
  if (!lead) return undefined;
  
  // Only update if currently new
  if (lead.status === LEAD_STATUSES.NEW) {
    return await storage.updateLead(leadId, {
      status: LEAD_STATUSES.CONTACTED,
      contactedAt: new Date(),
    });
  }
  
  return lead;
}

/**
 * Mark a lead as warm (clicked link, showed interest)
 */
export async function markWarm(leadId: string): Promise<Lead | undefined> {
  const lead = await storage.getLeadById(leadId);
  if (!lead) return undefined;
  
  // Can transition from new, contacted, or replied
  const validPreviousStatuses: string[] = [LEAD_STATUSES.NEW, LEAD_STATUSES.CONTACTED, LEAD_STATUSES.REPLIED];
  if (validPreviousStatuses.includes(lead.status)) {
    return await storage.updateLead(leadId, {
      status: LEAD_STATUSES.WARM,
    });
  }
  
  return lead;
}

/**
 * Mark a lead as having replied (responded to outreach)
 */
export async function markReplied(leadId: string): Promise<Lead | undefined> {
  const lead = await storage.getLeadById(leadId);
  if (!lead) return undefined;
  
  // Can transition from new or contacted
  const validPreviousStatuses: string[] = [LEAD_STATUSES.NEW, LEAD_STATUSES.CONTACTED];
  if (validPreviousStatuses.includes(lead.status)) {
    return await storage.updateLead(leadId, {
      status: LEAD_STATUSES.REPLIED,
    });
  }
  
  return lead;
}

/**
 * Mark a lead as demo booked
 */
export async function markDemoBooked(leadId: string): Promise<Lead | undefined> {
  const lead = await storage.getLeadById(leadId);
  if (!lead) return undefined;
  
  // Can transition from any non-terminal status
  const terminalStatuses: string[] = [LEAD_STATUSES.WON, LEAD_STATUSES.LOST];
  if (!terminalStatuses.includes(lead.status)) {
    return await storage.updateLead(leadId, {
      status: LEAD_STATUSES.DEMO_BOOKED,
    });
  }
  
  return lead;
}

/**
 * Mark a lead as converted (won)
 */
export async function markConverted(leadId: string): Promise<Lead | undefined> {
  const lead = await storage.getLeadById(leadId);
  if (!lead) return undefined;
  
  // Can transition from any status except lost
  if (lead.status !== LEAD_STATUSES.LOST) {
    return await storage.updateLead(leadId, {
      status: LEAD_STATUSES.WON,
    });
  }
  
  return lead;
}

/**
 * Mark a lead as lost
 */
export async function markLost(leadId: string): Promise<Lead | undefined> {
  const lead = await storage.getLeadById(leadId);
  if (!lead) return undefined;
  
  // Can transition from any status except won
  if (lead.status !== LEAD_STATUSES.WON) {
    return await storage.updateLead(leadId, {
      status: LEAD_STATUSES.LOST,
    });
  }
  
  return lead;
}

/**
 * Add a tag to a lead
 */
export async function addTag(leadId: string, tag: string): Promise<Lead | undefined> {
  const lead = await storage.getLeadById(leadId);
  if (!lead) return undefined;
  
  const currentTags = lead.tags || [];
  if (currentTags.includes(tag)) {
    return lead; // Already has tag
  }
  
  return await storage.updateLead(leadId, {
    tags: [...currentTags, tag],
  });
}

/**
 * Remove a tag from a lead
 */
export async function removeTag(leadId: string, tag: string): Promise<Lead | undefined> {
  const lead = await storage.getLeadById(leadId);
  if (!lead) return undefined;
  
  const currentTags = lead.tags || [];
  if (!currentTags.includes(tag)) {
    return lead; // Doesn't have tag
  }
  
  return await storage.updateLead(leadId, {
    tags: currentTags.filter(t => t !== tag),
  });
}

/**
 * Check if a lead has a specific tag
 */
export function hasTag(lead: Lead, tag: string): boolean {
  return (lead.tags || []).includes(tag);
}

/**
 * Get leads by source for a clinic
 */
export async function getLeadsBySource(clinicId: string, source: string): Promise<Lead[]> {
  const allLeads = await storage.getLeadsByClinic(clinicId);
  return allLeads.filter(lead => lead.source === source);
}

/**
 * Get leads by status for a clinic
 */
export async function getLeadsByStatus(clinicId: string, status: string): Promise<Lead[]> {
  const allLeads = await storage.getLeadsByClinic(clinicId);
  return allLeads.filter(lead => lead.status === status);
}

/**
 * Get leads with specific tag for a clinic
 */
export async function getLeadsByTag(clinicId: string, tag: string): Promise<Lead[]> {
  const allLeads = await storage.getLeadsByClinic(clinicId);
  return allLeads.filter(lead => hasTag(lead, tag));
}

/**
 * Get opted-in leads for campaigns
 */
export async function getOptedInLeads(clinicId: string): Promise<Lead[]> {
  const allLeads = await storage.getLeadsByClinic(clinicId);
  return allLeads.filter(lead => 
    lead.marketingOptIn === true && 
    lead.email && 
    lead.status !== LEAD_STATUSES.LOST
  );
}

/**
 * Get new leads that haven't been contacted yet
 */
export async function getNewLeads(clinicId: string): Promise<Lead[]> {
  return await getLeadsByStatus(clinicId, LEAD_STATUSES.NEW);
}

/**
 * Get leads eligible for follow-up sequences
 */
export async function getSequenceEligibleLeads(clinicId: string): Promise<Lead[]> {
  const allLeads = await storage.getLeadsByClinic(clinicId);
  const eligibleStatuses: string[] = [LEAD_STATUSES.NEW, LEAD_STATUSES.CONTACTED];
  return allLeads.filter(lead => 
    lead.marketingOptIn === true &&
    lead.email &&
    eligibleStatuses.includes(lead.status) &&
    !hasTag(lead, LEAD_TAGS.NURTURE_COMPLETE)
  );
}

/**
 * Apply default segmentation rules on lead import
 * Called when a new lead is imported
 */
export async function applyImportRules(lead: Lead): Promise<Lead> {
  const updates: Partial<InsertLead> = {};
  const currentTags = lead.tags || [];
  const newTags = [...currentTags];
  
  // Add source-based tags
  if (lead.source === LEAD_SOURCES.MAPS_HELPER && !currentTags.includes("maps-helper")) {
    newTags.push("maps-helper");
  }
  
  // Ensure status is new for imports
  if (!lead.status) {
    updates.status = LEAD_STATUSES.NEW;
  }
  
  if (newTags.length !== currentTags.length) {
    updates.tags = newTags;
  }
  
  if (Object.keys(updates).length > 0) {
    const updated = await storage.updateLead(lead.id, updates);
    return updated || lead;
  }
  
  return lead;
}

/**
 * Apply rules when a campaign email is successfully sent
 */
export async function applyEmailSentRules(leadId: string, campaignId?: string): Promise<Lead | undefined> {
  const lead = await storage.getLeadById(leadId);
  if (!lead) return undefined;
  
  const updates: Partial<InsertLead> = {};
  const currentTags = lead.tags || [];
  const newTags = [...currentTags];
  
  // Mark as contacted if currently new
  if (lead.status === LEAD_STATUSES.NEW) {
    updates.status = LEAD_STATUSES.CONTACTED;
    updates.contactedAt = new Date();
  }
  
  // Add from_campaign tag if not present
  if (!currentTags.includes(LEAD_TAGS.FROM_CAMPAIGN)) {
    newTags.push(LEAD_TAGS.FROM_CAMPAIGN);
    updates.tags = newTags;
  }
  
  if (Object.keys(updates).length > 0) {
    return await storage.updateLead(leadId, updates);
  }
  
  return lead;
}

/**
 * Apply rules when a lead clicks a booking link
 */
export async function applyBookingClickRules(leadId: string): Promise<Lead | undefined> {
  return await markWarm(leadId);
}

/**
 * Apply rules when a booking is created from a campaign
 */
export async function applyBookingCreatedRules(leadId: string, fromEmail: boolean = false): Promise<Lead | undefined> {
  const lead = await storage.getLeadById(leadId);
  if (!lead) return undefined;
  
  const updates: Partial<InsertLead> = {};
  const currentTags = lead.tags || [];
  const newTags = [...currentTags];
  
  // Mark as converted
  updates.status = LEAD_STATUSES.WON;
  
  // Add booked_from_email tag if applicable
  if (fromEmail && !currentTags.includes(LEAD_TAGS.BOOKED_FROM_EMAIL)) {
    newTags.push(LEAD_TAGS.BOOKED_FROM_EMAIL);
    updates.tags = newTags;
  }
  
  return await storage.updateLead(leadId, updates);
}

/**
 * Get segmentation summary for a clinic
 */
export async function getSegmentationSummary(clinicId: string): Promise<{
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  byTag: Record<string, number>;
  optedIn: number;
  total: number;
}> {
  const allLeads = await storage.getLeadsByClinic(clinicId);
  
  const byStatus: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  const byTag: Record<string, number> = {};
  let optedIn = 0;
  
  for (const lead of allLeads) {
    // Count by status
    const status = lead.status || "unknown";
    byStatus[status] = (byStatus[status] || 0) + 1;
    
    // Count by source
    const source = lead.source || "unknown";
    bySource[source] = (bySource[source] || 0) + 1;
    
    // Count by tags
    const tags = lead.tags || [];
    for (const tag of tags) {
      byTag[tag] = (byTag[tag] || 0) + 1;
    }
    
    // Count opted in
    if (lead.marketingOptIn) {
      optedIn++;
    }
  }
  
  return {
    byStatus,
    bySource,
    byTag,
    optedIn,
    total: allLeads.length,
  };
}
