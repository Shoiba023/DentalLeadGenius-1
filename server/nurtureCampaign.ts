/**
 * Nurture Campaign Service
 * 
 * This module provides automated 3-step follow-up sequences for leads.
 * Day 0: Initial welcome/intro email
 * Day 2: Educational content or value proposition
 * Day 5: Final follow-up with demo CTA
 */

import { storage } from "./storage";
import { sendEmail, isEmailConfigured } from "./email";
import { 
  markContacted, 
  addTag, 
  hasTag,
  LEAD_TAGS,
  LEAD_STATUSES,
  applyEmailSentRules 
} from "./leadSegmentation";
import type { Lead, Clinic, OutreachCampaign } from "@shared/schema";

// Nurture sequence step definitions
export const NURTURE_STEPS = {
  STEP_1: { day: 0, name: "welcome", subject: "Welcome to {clinic_name} - Let's Get Started" },
  STEP_2: { day: 2, name: "value_prop", subject: "How {clinic_name} is Transforming Dental Practices" },
  STEP_3: { day: 5, name: "demo_cta", subject: "Ready to See {clinic_name} in Action?" },
} as const;

export type NurtureStep = keyof typeof NURTURE_STEPS;

interface NurtureEmailData {
  leadId: string;
  leadName: string;
  leadEmail: string;
  clinicId: string;
  clinicName: string;
  campaignId?: string;
  step: NurtureStep;
}

/**
 * Generate email content for each nurture step
 */
function generateNurtureEmailContent(
  step: NurtureStep,
  leadName: string,
  clinicName: string,
  bookingUrl?: string
): { subject: string; html: string; text: string } {
  const firstName = leadName.split(" ")[0] || "there";
  const ctaUrl = bookingUrl || "https://dentalleadgenius.com/demo";
  
  switch (step) {
    case "STEP_1":
      return {
        subject: `Welcome to ${clinicName} - Let's Get Started`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">Welcome, ${firstName}!</h2>
            <p>Thank you for your interest in ${clinicName}. We're excited to help you grow your dental practice.</p>
            <p>We specialize in helping dental clinics like yours:</p>
            <ul>
              <li>Generate more qualified leads</li>
              <li>Automate patient outreach</li>
              <li>Convert inquiries into booked appointments</li>
            </ul>
            <p>Over the next few days, I'll share some insights on how we've helped practices like yours increase patient bookings by up to 40%.</p>
            <p>In the meantime, feel free to <a href="${ctaUrl}" style="color: #1e40af;">schedule a quick demo</a> to see our platform in action.</p>
            <p>Looking forward to connecting!</p>
            <p><strong>The ${clinicName} Team</strong></p>
          </div>
        `,
        text: `Welcome, ${firstName}!

Thank you for your interest in ${clinicName}. We're excited to help you grow your dental practice.

We specialize in helping dental clinics like yours:
- Generate more qualified leads
- Automate patient outreach
- Convert inquiries into booked appointments

Over the next few days, I'll share some insights on how we've helped practices like yours increase patient bookings by up to 40%.

In the meantime, feel free to schedule a quick demo: ${ctaUrl}

Looking forward to connecting!

The ${clinicName} Team`,
      };
      
    case "STEP_2":
      return {
        subject: `How ${clinicName} is Transforming Dental Practices`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">Hi ${firstName},</h2>
            <p>I wanted to follow up on my last email and share how ${clinicName} is helping dental practices thrive.</p>
            <h3 style="color: #374151;">Our Key Features:</h3>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p><strong>AI-Powered Lead Generation</strong><br/>
              Our smart targeting finds ideal patients in your area automatically.</p>
            </div>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p><strong>Automated Follow-Ups</strong><br/>
              Never let a lead go cold with intelligent, personalized nurture sequences.</p>
            </div>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p><strong>24/7 Patient Chatbot</strong><br/>
              Answer patient questions and book appointments even while you sleep.</p>
            </div>
            <p>Would you like to see how these features could work for your practice?</p>
            <p><a href="${ctaUrl}" style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Book a Demo</a></p>
            <p>Best regards,<br/><strong>The ${clinicName} Team</strong></p>
          </div>
        `,
        text: `Hi ${firstName},

I wanted to follow up on my last email and share how ${clinicName} is helping dental practices thrive.

Our Key Features:

AI-Powered Lead Generation
Our smart targeting finds ideal patients in your area automatically.

Automated Follow-Ups
Never let a lead go cold with intelligent, personalized nurture sequences.

24/7 Patient Chatbot
Answer patient questions and book appointments even while you sleep.

Would you like to see how these features could work for your practice?

Book a Demo: ${ctaUrl}

Best regards,
The ${clinicName} Team`,
      };
      
    case "STEP_3":
      return {
        subject: `Ready to See ${clinicName} in Action?`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">Hi ${firstName},</h2>
            <p>This is my final follow-up, and I wanted to make sure you had a chance to see what ${clinicName} can do for your practice.</p>
            <p style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <strong>Practices using our platform see:</strong><br/>
              ✓ 40% increase in patient bookings<br/>
              ✓ 50% reduction in no-shows<br/>
              ✓ 3x faster lead response times
            </p>
            <p>I'd love to show you exactly how we can help you achieve similar results. Our demo takes just 15 minutes.</p>
            <p style="text-align: center; margin: 25px 0;">
              <a href="${ctaUrl}" style="display: inline-block; background: #1e40af; color: white; padding: 15px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">Schedule Your Free Demo</a>
            </p>
            <p>If you're not interested right now, no worries! Just reply to let me know and I won't follow up again.</p>
            <p>Wishing you success,<br/><strong>The ${clinicName} Team</strong></p>
          </div>
        `,
        text: `Hi ${firstName},

This is my final follow-up, and I wanted to make sure you had a chance to see what ${clinicName} can do for your practice.

Practices using our platform see:
✓ 40% increase in patient bookings
✓ 50% reduction in no-shows
✓ 3x faster lead response times

I'd love to show you exactly how we can help you achieve similar results. Our demo takes just 15 minutes.

Schedule Your Free Demo: ${ctaUrl}

If you're not interested right now, no worries! Just reply to let me know and I won't follow up again.

Wishing you success,
The ${clinicName} Team`,
      };
      
    default:
      throw new Error(`Unknown nurture step: ${step}`);
  }
}

/**
 * Send a nurture email
 */
export async function sendNurtureEmail(data: NurtureEmailData): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!isEmailConfigured()) {
    return { success: false, error: "Email not configured" };
  }
  
  const stepConfig = NURTURE_STEPS[data.step];
  const bookingUrl = `https://dentalleadgenius.com/clinic/${data.clinicId}/book`;
  const content = generateNurtureEmailContent(data.step, data.leadName, data.clinicName, bookingUrl);
  
  try {
    await sendEmail({
      to: data.leadEmail,
      subject: content.subject,
      html: content.html,
      text: content.text,
    });
    
    // Update lead status and add tags
    await applyEmailSentRules(data.leadId, data.campaignId);
    
    console.log(`[NurtureCampaign] Sent ${data.step} email to ${data.leadEmail}`);
    return { success: true };
  } catch (error) {
    console.error(`[NurtureCampaign] Failed to send ${data.step} email:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Calculate the next step for a lead based on nurture history
 */
export function calculateNextStep(lead: Lead): NurtureStep | null {
  const tags = lead.tags || [];
  
  // Check which steps have been completed
  const completedStep1 = tags.includes("nurture_step_1_sent");
  const completedStep2 = tags.includes("nurture_step_2_sent");
  const completedStep3 = tags.includes("nurture_step_3_sent");
  
  // Already completed the sequence
  if (completedStep3 || hasTag(lead, LEAD_TAGS.NURTURE_COMPLETE)) {
    return null;
  }
  
  // Lead has responded or converted - no more nurture
  const terminalStatuses = [LEAD_STATUSES.REPLIED, LEAD_STATUSES.DEMO_BOOKED, LEAD_STATUSES.WON, LEAD_STATUSES.LOST];
  if (terminalStatuses.includes(lead.status as any)) {
    return null;
  }
  
  // Determine next step
  if (!completedStep1) return "STEP_1";
  if (!completedStep2) return "STEP_2";
  if (!completedStep3) return "STEP_3";
  
  return null;
}

/**
 * Check if enough time has passed for the next step
 */
export function isReadyForNextStep(lead: Lead, step: NurtureStep): boolean {
  const stepConfig = NURTURE_STEPS[step];
  const contactedAt = lead.contactedAt;
  
  // Step 1 is always ready (Day 0)
  if (step === "STEP_1") {
    return true;
  }
  
  // For other steps, check if enough days have passed since first contact
  if (!contactedAt) {
    return false;
  }
  
  const contactDate = new Date(contactedAt);
  const now = new Date();
  const daysSinceContact = Math.floor((now.getTime() - contactDate.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysSinceContact >= stepConfig.day;
}

/**
 * Mark a step as completed for a lead
 */
export async function markStepCompleted(leadId: string, step: NurtureStep): Promise<void> {
  const tagName = `nurture_step_${step === "STEP_1" ? 1 : step === "STEP_2" ? 2 : 3}_sent`;
  await addTag(leadId, tagName);
  
  // If this was step 3, mark nurture as complete
  if (step === "STEP_3") {
    await addTag(leadId, LEAD_TAGS.NURTURE_COMPLETE);
  }
}

/**
 * Process nurture sequence for a single lead
 */
export async function processLeadNurture(
  lead: Lead,
  clinic: Clinic,
  campaignId?: string
): Promise<{
  processed: boolean;
  step?: NurtureStep;
  success?: boolean;
  error?: string;
}> {
  // Skip if no email or not opted in
  if (!lead.email || !lead.marketingOptIn) {
    return { processed: false, error: "No email or not opted in" };
  }
  
  // Calculate next step
  const nextStep = calculateNextStep(lead);
  if (!nextStep) {
    return { processed: false, error: "No pending steps" };
  }
  
  // Check if ready for next step
  if (!isReadyForNextStep(lead, nextStep)) {
    return { processed: false, error: "Not ready for next step yet" };
  }
  
  // Send the email
  const result = await sendNurtureEmail({
    leadId: lead.id,
    leadName: lead.name,
    leadEmail: lead.email,
    clinicId: clinic.id,
    clinicName: clinic.name,
    campaignId,
    step: nextStep,
  });
  
  if (result.success) {
    await markStepCompleted(lead.id, nextStep);
    return { processed: true, step: nextStep, success: true };
  }
  
  return { processed: true, step: nextStep, success: false, error: result.error };
}

/**
 * Run nurture campaign for all eligible leads in a clinic
 */
export async function runClinicNurtureCampaign(clinicId: string): Promise<{
  processed: number;
  sent: number;
  skipped: number;
  errors: number;
  details: Array<{ leadId: string; step?: NurtureStep; success: boolean; error?: string }>;
}> {
  const clinic = await storage.getClinicById(clinicId);
  if (!clinic) {
    throw new Error(`Clinic not found: ${clinicId}`);
  }
  
  // Get all leads for the clinic
  const leads = await storage.getLeadsByClinic(clinicId);
  const eligibleLeads = leads.filter(lead => 
    lead.email && 
    lead.marketingOptIn &&
    !hasTag(lead, LEAD_TAGS.NURTURE_COMPLETE)
  );
  
  const results = {
    processed: 0,
    sent: 0,
    skipped: 0,
    errors: 0,
    details: [] as Array<{ leadId: string; step?: NurtureStep; success: boolean; error?: string }>,
  };
  
  for (const lead of eligibleLeads) {
    const result = await processLeadNurture(lead, clinic);
    
    if (!result.processed) {
      results.skipped++;
      results.details.push({ leadId: lead.id, success: false, error: result.error });
    } else if (result.success) {
      results.processed++;
      results.sent++;
      results.details.push({ leadId: lead.id, step: result.step, success: true });
    } else {
      results.processed++;
      results.errors++;
      results.details.push({ leadId: lead.id, step: result.step, success: false, error: result.error });
    }
  }
  
  return results;
}

/**
 * Get nurture status for a lead
 */
export async function getNurtureStatus(leadId: string): Promise<{
  currentStep: number;
  completedSteps: NurtureStep[];
  nextStep: NurtureStep | null;
  isComplete: boolean;
  nextStepDate: Date | null;
}> {
  const lead = await storage.getLeadById(leadId);
  if (!lead) {
    throw new Error(`Lead not found: ${leadId}`);
  }
  
  const tags = lead.tags || [];
  const completedSteps: NurtureStep[] = [];
  
  if (tags.includes("nurture_step_1_sent")) completedSteps.push("STEP_1");
  if (tags.includes("nurture_step_2_sent")) completedSteps.push("STEP_2");
  if (tags.includes("nurture_step_3_sent")) completedSteps.push("STEP_3");
  
  const nextStep = calculateNextStep(lead);
  const isComplete = hasTag(lead, LEAD_TAGS.NURTURE_COMPLETE);
  
  // Calculate next step date
  let nextStepDate: Date | null = null;
  if (nextStep && lead.contactedAt) {
    const stepConfig = NURTURE_STEPS[nextStep];
    const contactDate = new Date(lead.contactedAt);
    nextStepDate = new Date(contactDate.getTime() + stepConfig.day * 24 * 60 * 60 * 1000);
  }
  
  return {
    currentStep: completedSteps.length,
    completedSteps,
    nextStep,
    isComplete,
    nextStepDate,
  };
}

/**
 * Create a nurture sequence campaign in the database
 */
export async function createNurtureSequenceCampaign(
  clinicId: string,
  name: string = "Automated Nurture Sequence"
): Promise<OutreachCampaign> {
  const campaign = await storage.createCampaign({
    clinicId,
    name,
    type: "email",
    status: "active",
    subject: "Automated 3-Step Nurture Sequence",
    message: "This campaign sends automated follow-ups on Day 0, Day 2, and Day 5.",
  });
  
  return campaign;
}
