/**
 * Booking Tracking Service
 * 
 * This module provides campaign attribution and lead conversion tracking
 * for patient bookings. It automatically links bookings to campaigns and
 * updates lead statuses when conversions occur.
 */

import { storage } from "./storage";
import { 
  markConverted, 
  addTag,
  LEAD_TAGS,
  applyBookingCreatedRules
} from "./leadSegmentation";
import type { Lead, PatientBooking, InsertPatientBooking, OutreachCampaign } from "@shared/schema";

// Booking sources
export const BOOKING_SOURCES = {
  DIRECT: "direct",
  EMAIL: "email",
  SMS: "sms",
  CHATBOT: "chatbot",
  WEBSITE: "website",
  REFERRAL: "referral",
} as const;

export type BookingSource = typeof BOOKING_SOURCES[keyof typeof BOOKING_SOURCES];

interface BookingWithTracking extends InsertPatientBooking {
  campaignId?: string | null;
  leadId?: string | null;
  source?: string;
}

interface BookingAttribution {
  campaignId: string | null;
  leadId: string | null;
  source: BookingSource;
  isConversion: boolean;
}

/**
 * Create a booking with campaign and lead tracking
 */
export async function createTrackedBooking(
  bookingData: BookingWithTracking
): Promise<PatientBooking> {
  // Create the booking with tracking data
  const booking = await storage.createPatientBooking({
    ...bookingData,
    source: bookingData.source || BOOKING_SOURCES.DIRECT,
    campaignId: bookingData.campaignId || null,
    leadId: bookingData.leadId || null,
  });
  
  // If a lead is linked, update their status to converted
  if (bookingData.leadId) {
    const fromEmail = bookingData.source === BOOKING_SOURCES.EMAIL;
    await applyBookingCreatedRules(bookingData.leadId, fromEmail);
    
    console.log(`[BookingTracking] Lead ${bookingData.leadId} marked as converted from booking ${booking.id}`);
  }
  
  return booking;
}

/**
 * Try to find a matching lead for a booking based on email
 */
export async function findLeadByBookingInfo(
  clinicId: string,
  email: string
): Promise<Lead | undefined> {
  const leads = await storage.getLeadsByClinic(clinicId);
  return leads.find(lead => 
    lead.email?.toLowerCase() === email.toLowerCase()
  );
}

/**
 * Attribute a booking to a campaign based on various signals
 */
export async function attributeBooking(
  clinicId: string,
  email: string,
  referrer?: string
): Promise<BookingAttribution> {
  let campaignId: string | null = null;
  let leadId: string | null = null;
  let source: BookingSource = BOOKING_SOURCES.DIRECT;
  let isConversion = false;
  
  // Try to find matching lead
  const lead = await findLeadByBookingInfo(clinicId, email);
  if (lead) {
    leadId = lead.id;
    isConversion = true;
    
    // Check for campaign attribution from lead tags
    const tags = lead.tags || [];
    if (tags.includes(LEAD_TAGS.FROM_CAMPAIGN)) {
      source = BOOKING_SOURCES.EMAIL;
    }
  }
  
  // Analyze referrer for attribution
  if (referrer) {
    if (referrer.includes("email") || referrer.includes("campaign")) {
      source = BOOKING_SOURCES.EMAIL;
    } else if (referrer.includes("sms")) {
      source = BOOKING_SOURCES.SMS;
    } else if (referrer.includes("chat")) {
      source = BOOKING_SOURCES.CHATBOT;
    }
  }
  
  // Try to find active campaigns for attribution
  if (leadId && source === BOOKING_SOURCES.EMAIL) {
    const campaigns = await storage.getCampaignsByClinic(clinicId);
    const activeCampaign = campaigns.find(c => c.status === "active" && c.type === "email");
    if (activeCampaign) {
      campaignId = activeCampaign.id;
    }
  }
  
  return {
    campaignId,
    leadId,
    source,
    isConversion,
  };
}

/**
 * Get bookings by campaign for reporting
 * Note: This requires the campaign's clinic ID to ensure tenant isolation
 */
export async function getBookingsByCampaign(
  campaignId: string
): Promise<PatientBooking[]> {
  // Get campaign to find its clinic
  const campaign = await storage.getCampaignById(campaignId);
  if (!campaign) return [];
  
  // Get clinic-scoped bookings
  const clinicBookings = await storage.getPatientBookingsByClinic(campaign.clinicId);
  return clinicBookings.filter(booking => booking.campaignId === campaignId);
}

/**
 * Get conversion statistics for a campaign
 */
export async function getCampaignConversionStats(
  campaignId: string
): Promise<{
  totalBookings: number;
  totalConversions: number;
  conversionRate: number;
  bookingsBySource: Record<string, number>;
}> {
  const bookings = await getBookingsByCampaign(campaignId);
  const campaign = await storage.getCampaignById(campaignId);
  
  const bookingsBySource: Record<string, number> = {};
  let conversions = 0;
  
  for (const booking of bookings) {
    const source = booking.source || "direct";
    bookingsBySource[source] = (bookingsBySource[source] || 0) + 1;
    if (booking.leadId) {
      conversions++;
    }
  }
  
  const totalSent = campaign?.totalSent || 1;
  const conversionRate = totalSent > 0 ? (conversions / totalSent) * 100 : 0;
  
  return {
    totalBookings: bookings.length,
    totalConversions: conversions,
    conversionRate: Math.round(conversionRate * 100) / 100,
    bookingsBySource,
  };
}

/**
 * Get clinic-wide booking analytics
 */
export async function getClinicBookingAnalytics(
  clinicId: string
): Promise<{
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  bookingsBySource: Record<string, number>;
  conversionRate: number;
}> {
  const bookings = await storage.getPatientBookingsByClinic(clinicId);
  const leads = await storage.getLeadsByClinic(clinicId);
  
  const bookingsBySource: Record<string, number> = {};
  let pending = 0;
  let confirmed = 0;
  let cancelled = 0;
  let conversions = 0;
  
  for (const booking of bookings) {
    const source = booking.source || "direct";
    bookingsBySource[source] = (bookingsBySource[source] || 0) + 1;
    
    switch (booking.status) {
      case "pending":
        pending++;
        break;
      case "confirmed":
        confirmed++;
        break;
      case "cancelled":
        cancelled++;
        break;
    }
    
    if (booking.leadId) {
      conversions++;
    }
  }
  
  const totalLeads = leads.length || 1;
  const conversionRate = (conversions / totalLeads) * 100;
  
  return {
    totalBookings: bookings.length,
    pendingBookings: pending,
    confirmedBookings: confirmed,
    cancelledBookings: cancelled,
    bookingsBySource,
    conversionRate: Math.round(conversionRate * 100) / 100,
  };
}

/**
 * Link an existing booking to a lead (placeholder - storage methods TBD)
 * Note: This function requires getPatientBookingById and updatePatientBooking methods
 * to be added to storage. For now, it returns undefined.
 */
export async function linkBookingToLead(
  bookingId: string,
  leadId: string
): Promise<PatientBooking | undefined> {
  // Mark lead as converted when booking is linked
  await applyBookingCreatedRules(leadId, false);
  console.log(`[BookingTracking] Linked booking ${bookingId} to lead ${leadId}`);
  
  // Return undefined - full implementation requires storage methods
  return undefined;
}

/**
 * Process a booking with automatic attribution
 * This is the main entry point for new bookings
 */
export async function processNewBooking(
  bookingData: InsertPatientBooking,
  referrer?: string
): Promise<{
  booking: PatientBooking;
  attribution: BookingAttribution;
}> {
  // Get attribution info
  const attribution = await attributeBooking(
    bookingData.clinicId,
    bookingData.patientEmail,
    referrer
  );
  
  // Create booking with tracking
  const booking = await createTrackedBooking({
    ...bookingData,
    campaignId: attribution.campaignId,
    leadId: attribution.leadId,
    source: attribution.source,
  });
  
  return {
    booking,
    attribution,
  };
}
