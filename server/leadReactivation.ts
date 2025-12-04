/**
 * Lead Reactivation Engine
 * 
 * Automatically re-engages inactive leads with:
 * - Inactivity detection (30+ days since last contact)
 * - Win-back email sequences
 * - Special offers and incentives
 * - Tracking and analytics
 */

import { storage } from "./storage";
import { sendEmail, isEmailConfigured } from "./email";
import { addTag, hasTag, LEAD_TAGS } from "./leadSegmentation";
import { SITE_NAME, SITE_URL } from "../shared/config";
import type { Lead, Clinic } from "@shared/schema";

// Reactivation configuration
export const REACTIVATION_CONFIG = {
  INACTIVITY_THRESHOLD_DAYS: 30,
  MAX_REACTIVATION_ATTEMPTS: 3,
  COOLDOWN_DAYS: 14, // Days between reactivation attempts
  SPECIAL_OFFER_DISCOUNT: 25, // Percentage off
};

export const REACTIVATION_TAGS = {
  REACTIVATION_1: "reactivation_attempt_1",
  REACTIVATION_2: "reactivation_attempt_2", 
  REACTIVATION_3: "reactivation_attempt_3",
  REACTIVATED: "reactivated",
  UNRESPONSIVE: "unresponsive",
};

interface ReactivationEmailData {
  leadId: string;
  leadName: string;
  leadEmail: string;
  clinicName: string;
  attemptNumber: number;
}

/**
 * Check if a lead is inactive and eligible for reactivation
 */
export function isInactiveAndEligible(lead: Lead): boolean {
  // Skip if no email or opted out
  if (!lead.email || !lead.marketingOptIn) {
    return false;
  }

  // Skip if already converted or in terminal state
  const terminalStatuses = ["demo_booked", "won", "lost"];
  if (terminalStatuses.includes(lead.status)) {
    return false;
  }

  // Skip if already marked as unresponsive
  if (hasTag(lead, REACTIVATION_TAGS.UNRESPONSIVE)) {
    return false;
  }

  // Skip if already reactivated
  if (hasTag(lead, REACTIVATION_TAGS.REACTIVATED)) {
    return false;
  }

  // Check inactivity period
  const lastContact = lead.contactedAt || lead.createdAt;
  if (!lastContact) {
    return true; // Never contacted, eligible
  }

  const daysSinceContact = Math.floor(
    (Date.now() - new Date(lastContact).getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysSinceContact >= REACTIVATION_CONFIG.INACTIVITY_THRESHOLD_DAYS;
}

/**
 * Get the current reactivation attempt number for a lead
 */
export function getReactivationAttempt(lead: Lead): number {
  const tags = lead.tags || [];
  
  if (tags.includes(REACTIVATION_TAGS.REACTIVATION_3)) return 3;
  if (tags.includes(REACTIVATION_TAGS.REACTIVATION_2)) return 2;
  if (tags.includes(REACTIVATION_TAGS.REACTIVATION_1)) return 1;
  
  return 0;
}

/**
 * Check if lead is in cooldown period between reactivation attempts
 */
export function isInCooldown(lead: Lead): boolean {
  // Check when the last reactivation email was sent
  const lastReactivation = lead.contactedAt;
  if (!lastReactivation) return false;

  const daysSinceContact = Math.floor(
    (Date.now() - new Date(lastReactivation).getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysSinceContact < REACTIVATION_CONFIG.COOLDOWN_DAYS;
}

/**
 * Generate reactivation email content based on attempt number
 */
function generateReactivationContent(
  data: ReactivationEmailData
): { subject: string; html: string; text: string } {
  const firstName = data.leadName.split(" ")[0] || "there";
  const demoUrl = `${SITE_URL}/demo`;
  const unsubscribeUrl = `${SITE_URL}/unsubscribe?email=${encodeURIComponent(data.leadEmail)}`;

  switch (data.attemptNumber) {
    case 1:
      return {
        subject: `We Miss You, ${firstName}! Here's What's New`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">Hi ${firstName}, We Haven't Heard From You!</h2>
            
            <p>I noticed it's been a while since we last connected about ${SITE_NAME}. I wanted to reach out and share some exciting updates.</p>
            
            <h3 style="color: #374151;">What's New:</h3>
            <ul>
              <li><strong>Enhanced AI Chatbot</strong> - Now with 40% faster response times</li>
              <li><strong>New Analytics Dashboard</strong> - Track every lead and conversion</li>
              <li><strong>Improved Follow-Up Sequences</strong> - Higher open and click rates</li>
            </ul>
            
            <p>I'd love to show you these improvements in a quick 15-minute demo.</p>
            
            <p style="text-align: center; margin: 25px 0;">
              <a href="${demoUrl}" style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Schedule a Demo</a>
            </p>
            
            <p>Looking forward to reconnecting!</p>
            <p><strong>The ${SITE_NAME} Team</strong></p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px;">
              <a href="${unsubscribeUrl}" style="color: #6b7280;">Unsubscribe</a> from future emails
            </p>
          </div>
        `,
        text: `Hi ${firstName}, We Haven't Heard From You!

I noticed it's been a while since we last connected about ${SITE_NAME}. I wanted to reach out and share some exciting updates.

What's New:
- Enhanced AI Chatbot - Now with 40% faster response times
- New Analytics Dashboard - Track every lead and conversion
- Improved Follow-Up Sequences - Higher open and click rates

I'd love to show you these improvements in a quick 15-minute demo.

Schedule a Demo: ${demoUrl}

Looking forward to reconnecting!
The ${SITE_NAME} Team`,
      };

    case 2:
      return {
        subject: `${REACTIVATION_CONFIG.SPECIAL_OFFER_DISCOUNT}% Off - Limited Time Offer for ${firstName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
              <h2 style="color: #92400e; margin: 0;">EXCLUSIVE: ${REACTIVATION_CONFIG.SPECIAL_OFFER_DISCOUNT}% OFF Your First 3 Months!</h2>
            </div>
            
            <p>Hi ${firstName},</p>
            
            <p>I wanted to reach out one more time with a special offer exclusively for you.</p>
            
            <p>As a thank you for your initial interest in ${SITE_NAME}, we're offering you <strong>${REACTIVATION_CONFIG.SPECIAL_OFFER_DISCOUNT}% off your first 3 months</strong> when you sign up this week.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1e40af;">What You'll Get:</h3>
              <ul>
                <li>AI-powered lead generation for your local area</li>
                <li>24/7 patient chatbot</li>
                <li>Automated follow-up sequences</li>
                <li>Real-time analytics dashboard</li>
                <li>Dedicated support team</li>
              </ul>
            </div>
            
            <p style="text-align: center; margin: 25px 0;">
              <a href="${demoUrl}?offer=reactivation25" style="display: inline-block; background: #dc2626; color: white; padding: 15px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">Claim Your ${REACTIVATION_CONFIG.SPECIAL_OFFER_DISCOUNT}% Discount</a>
            </p>
            
            <p style="color: #6b7280; font-size: 14px;">This offer expires in 7 days.</p>
            
            <p>Best regards,<br/><strong>The ${SITE_NAME} Team</strong></p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px;">
              <a href="${unsubscribeUrl}" style="color: #6b7280;">Unsubscribe</a> from future emails
            </p>
          </div>
        `,
        text: `EXCLUSIVE: ${REACTIVATION_CONFIG.SPECIAL_OFFER_DISCOUNT}% OFF Your First 3 Months!

Hi ${firstName},

I wanted to reach out one more time with a special offer exclusively for you.

As a thank you for your initial interest in ${SITE_NAME}, we're offering you ${REACTIVATION_CONFIG.SPECIAL_OFFER_DISCOUNT}% off your first 3 months when you sign up this week.

What You'll Get:
- AI-powered lead generation for your local area
- 24/7 patient chatbot
- Automated follow-up sequences
- Real-time analytics dashboard
- Dedicated support team

Claim Your Discount: ${demoUrl}?offer=reactivation25

This offer expires in 7 days.

Best regards,
The ${SITE_NAME} Team`,
      };

    case 3:
      return {
        subject: `Final Check-In: Is ${SITE_NAME} Right for You?`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">Hi ${firstName},</h2>
            
            <p>This is my last email to you about ${SITE_NAME}.</p>
            
            <p>I understand that timing is everything, and maybe right now isn't the best time for you to explore new solutions for your dental practice.</p>
            
            <p>Before I go, I wanted to ask: <strong>Is there anything specific holding you back?</strong></p>
            
            <p>Common concerns I hear:</p>
            <ul>
              <li><strong>Budget</strong> - We offer flexible pricing and payment plans</li>
              <li><strong>Time</strong> - Our setup takes less than 30 minutes</li>
              <li><strong>Current Solution</strong> - We integrate with most existing systems</li>
              <li><strong>Skepticism</strong> - We offer a 30-day money-back guarantee</li>
            </ul>
            
            <p>If any of these resonate, just reply to this email and let me know. I'm happy to address your specific situation.</p>
            
            <p>If you'd rather not hear from us again, that's completely okay too - no hard feelings!</p>
            
            <p>Wishing you success,<br/><strong>The ${SITE_NAME} Team</strong></p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px;">
              <a href="${unsubscribeUrl}" style="color: #6b7280;">Unsubscribe</a> - We won't email you again
            </p>
          </div>
        `,
        text: `Hi ${firstName},

This is my last email to you about ${SITE_NAME}.

I understand that timing is everything, and maybe right now isn't the best time for you to explore new solutions for your dental practice.

Before I go, I wanted to ask: Is there anything specific holding you back?

Common concerns I hear:
- Budget - We offer flexible pricing and payment plans
- Time - Our setup takes less than 30 minutes
- Current Solution - We integrate with most existing systems
- Skepticism - We offer a 30-day money-back guarantee

If any of these resonate, just reply to this email and let me know. I'm happy to address your specific situation.

If you'd rather not hear from us again, that's completely okay too - no hard feelings!

Wishing you success,
The ${SITE_NAME} Team`,
      };

    default:
      throw new Error(`Invalid reactivation attempt: ${data.attemptNumber}`);
  }
}

/**
 * Send a reactivation email
 */
export async function sendReactivationEmail(
  data: ReactivationEmailData
): Promise<{ success: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { success: false, error: "Email not configured" };
  }

  try {
    const content = generateReactivationContent(data);
    
    await sendEmail({
      to: data.leadEmail,
      subject: content.subject,
      html: content.html,
      text: content.text,
    });

    // Mark the reactivation attempt
    const tagName = `reactivation_attempt_${data.attemptNumber}`;
    await addTag(data.leadId, tagName);

    // Update lead's contacted timestamp
    await storage.updateLead(data.leadId, {
      contactedAt: new Date(),
    });

    console.log(`[LeadReactivation] Sent attempt ${data.attemptNumber} to ${data.leadEmail}`);
    return { success: true };
  } catch (error) {
    console.error("[LeadReactivation] Failed to send email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Process a single lead for reactivation
 */
export async function processLeadReactivation(
  lead: Lead,
  clinic: Clinic
): Promise<{
  processed: boolean;
  attempt?: number;
  success?: boolean;
  error?: string;
}> {
  // Check eligibility
  if (!isInactiveAndEligible(lead)) {
    return { processed: false, error: "Not eligible for reactivation" };
  }

  // Check cooldown
  if (isInCooldown(lead)) {
    return { processed: false, error: "In cooldown period" };
  }

  // Get current attempt number
  const currentAttempt = getReactivationAttempt(lead);
  
  // Check if max attempts reached
  if (currentAttempt >= REACTIVATION_CONFIG.MAX_REACTIVATION_ATTEMPTS) {
    // Mark as unresponsive
    await addTag(lead.id, REACTIVATION_TAGS.UNRESPONSIVE);
    return { processed: false, error: "Max attempts reached" };
  }

  // Send reactivation email
  const nextAttempt = currentAttempt + 1;
  const result = await sendReactivationEmail({
    leadId: lead.id,
    leadName: lead.name,
    leadEmail: lead.email!,
    clinicName: clinic.name,
    attemptNumber: nextAttempt,
  });

  return {
    processed: true,
    attempt: nextAttempt,
    success: result.success,
    error: result.error,
  };
}

/**
 * Run reactivation campaign for all eligible leads in a clinic
 */
export async function runClinicReactivation(clinicId: string): Promise<{
  processed: number;
  sent: number;
  skipped: number;
  errors: number;
  markedUnresponsive: number;
}> {
  const clinic = await storage.getClinicById(clinicId);
  if (!clinic) {
    throw new Error(`Clinic not found: ${clinicId}`);
  }

  const leads = await storage.getLeadsByClinic(clinicId);
  
  const results = {
    processed: 0,
    sent: 0,
    skipped: 0,
    errors: 0,
    markedUnresponsive: 0,
  };

  for (const lead of leads) {
    const result = await processLeadReactivation(lead, clinic);

    if (!result.processed) {
      results.skipped++;
      if (result.error === "Max attempts reached") {
        results.markedUnresponsive++;
      }
    } else if (result.success) {
      results.processed++;
      results.sent++;
    } else {
      results.processed++;
      results.errors++;
    }
  }

  return results;
}

/**
 * Get reactivation statistics for a clinic
 */
export async function getReactivationStats(clinicId: string): Promise<{
  totalInactive: number;
  eligibleForReactivation: number;
  inProgress: number;
  reactivated: number;
  unresponsive: number;
}> {
  const leads = await storage.getLeadsByClinic(clinicId);
  
  const stats = {
    totalInactive: 0,
    eligibleForReactivation: 0,
    inProgress: 0,
    reactivated: 0,
    unresponsive: 0,
  };

  for (const lead of leads) {
    // Check if inactive
    const lastContact = lead.contactedAt || lead.createdAt;
    if (lastContact) {
      const daysSinceContact = Math.floor(
        (Date.now() - new Date(lastContact).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceContact >= REACTIVATION_CONFIG.INACTIVITY_THRESHOLD_DAYS) {
        stats.totalInactive++;
      }
    }

    // Check reactivation status
    if (hasTag(lead, REACTIVATION_TAGS.REACTIVATED)) {
      stats.reactivated++;
    } else if (hasTag(lead, REACTIVATION_TAGS.UNRESPONSIVE)) {
      stats.unresponsive++;
    } else if (
      hasTag(lead, REACTIVATION_TAGS.REACTIVATION_1) ||
      hasTag(lead, REACTIVATION_TAGS.REACTIVATION_2)
    ) {
      stats.inProgress++;
    } else if (isInactiveAndEligible(lead)) {
      stats.eligibleForReactivation++;
    }
  }

  return stats;
}

/**
 * Mark a lead as reactivated (responded to reactivation)
 */
export async function markLeadReactivated(leadId: string): Promise<void> {
  await addTag(leadId, REACTIVATION_TAGS.REACTIVATED);
  console.log(`[LeadReactivation] Lead ${leadId} marked as reactivated`);
}
