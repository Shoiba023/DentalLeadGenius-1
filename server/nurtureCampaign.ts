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

// 5-Day Nurture Sequence Step Definitions
export const NURTURE_STEPS = {
  STEP_1: { day: 0, name: "welcome", subject: "Welcome to {clinic_name} - Let's Get Started" },
  STEP_2: { day: 1, name: "social_proof", subject: "Why 500+ Dental Practices Trust {clinic_name}" },
  STEP_3: { day: 2, name: "features", subject: "3 Features That Transform Dental Lead Management" },
  STEP_4: { day: 3, name: "case_study", subject: "How Dr. Smith Increased Bookings by 40%" },
  STEP_5: { day: 4, name: "final_cta", subject: "Your Free Demo Expires Tomorrow - {clinic_name}" },
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
        subject: `Why 500+ Dental Practices Trust ${clinicName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">Hi ${firstName},</h2>
            <p>Yesterday I introduced you to ${clinicName}. Today, I wanted to share why over 500 dental practices already trust us.</p>
            
            <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0;">
              <p style="font-style: italic; margin: 0;">"We saw a 45% increase in new patient bookings within the first month. The AI chatbot handles inquiries 24/7, and our staff can focus on patient care."</p>
              <p style="margin: 10px 0 0 0; font-weight: bold;">- Dr. Sarah Johnson, Smile Dental Care</p>
            </div>
            
            <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0;">
              <p style="font-style: italic; margin: 0;">"The automated follow-ups alone saved us 15 hours per week. Our conversion rate doubled."</p>
              <p style="margin: 10px 0 0 0; font-weight: bold;">- Dr. Michael Chen, Premier Dental Group</p>
            </div>
            
            <p>Want to see similar results? I'd love to show you exactly how we can help.</p>
            <p><a href="${ctaUrl}" style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Schedule Your Demo</a></p>
            <p>Best regards,<br/><strong>The ${clinicName} Team</strong></p>
          </div>
        `,
        text: `Hi ${firstName},

Yesterday I introduced you to ${clinicName}. Today, I wanted to share why over 500 dental practices already trust us.

"We saw a 45% increase in new patient bookings within the first month. The AI chatbot handles inquiries 24/7, and our staff can focus on patient care."
- Dr. Sarah Johnson, Smile Dental Care

"The automated follow-ups alone saved us 15 hours per week. Our conversion rate doubled."
- Dr. Michael Chen, Premier Dental Group

Want to see similar results? I'd love to show you exactly how we can help.

Schedule Your Demo: ${ctaUrl}

Best regards,
The ${clinicName} Team`,
      };
      
    case "STEP_3":
      return {
        subject: `3 Features That Transform Dental Lead Management`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">Hi ${firstName},</h2>
            <p>I wanted to highlight 3 powerful features that set ${clinicName} apart:</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 15px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">1. AI-Powered Lead Generation</h3>
              <p>Our smart targeting uses machine learning to find ideal patients in your area. We analyze demographics, search patterns, and intent signals to deliver high-quality leads to your practice.</p>
            </div>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 15px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">2. Automated Follow-Up Sequences</h3>
              <p>Never let a lead go cold again. Our intelligent nurture sequences automatically send personalized messages at the perfect time, converting inquiries into booked appointments.</p>
            </div>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 15px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">3. 24/7 AI Patient Chatbot</h3>
              <p>Answer patient questions, schedule appointments, and capture leads around the clock. Your virtual assistant never sleeps, ensuring you never miss an opportunity.</p>
            </div>
            
            <p>Want to see these features in action?</p>
            <p><a href="${ctaUrl}" style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Book Your Demo</a></p>
            <p>Best regards,<br/><strong>The ${clinicName} Team</strong></p>
          </div>
        `,
        text: `Hi ${firstName},

I wanted to highlight 3 powerful features that set ${clinicName} apart:

1. AI-Powered Lead Generation
Our smart targeting uses machine learning to find ideal patients in your area. We analyze demographics, search patterns, and intent signals to deliver high-quality leads to your practice.

2. Automated Follow-Up Sequences
Never let a lead go cold again. Our intelligent nurture sequences automatically send personalized messages at the perfect time, converting inquiries into booked appointments.

3. 24/7 AI Patient Chatbot
Answer patient questions, schedule appointments, and capture leads around the clock. Your virtual assistant never sleeps, ensuring you never miss an opportunity.

Want to see these features in action?

Book Your Demo: ${ctaUrl}

Best regards,
The ${clinicName} Team`,
      };
      
    case "STEP_4":
      return {
        subject: `How Dr. Smith Increased Bookings by 40%`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">Hi ${firstName},</h2>
            <p>Today I want to share a real success story from one of our clients.</p>
            
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">Case Study: Bright Smile Dental</h3>
              
              <p><strong>The Challenge:</strong><br/>
              Dr. Smith's practice was struggling with inconsistent lead flow and a 30% no-show rate. Her team spent hours each week on manual follow-ups with minimal results.</p>
              
              <p><strong>The Solution:</strong><br/>
              After implementing ${clinicName}, the practice automated their entire lead nurture process and added 24/7 chatbot support.</p>
              
              <p><strong>The Results (in 90 days):</strong></p>
              <ul>
                <li>40% increase in new patient bookings</li>
                <li>No-show rate dropped to 12%</li>
                <li>Staff saved 20 hours per week</li>
                <li>ROI: 8x on their investment</li>
              </ul>
            </div>
            
            <p>Want to achieve similar results? Let me show you exactly how we can transform your practice.</p>
            <p style="text-align: center;">
              <a href="${ctaUrl}" style="display: inline-block; background: #1e40af; color: white; padding: 15px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">Schedule Your Free Demo</a>
            </p>
            <p>Best regards,<br/><strong>The ${clinicName} Team</strong></p>
          </div>
        `,
        text: `Hi ${firstName},

Today I want to share a real success story from one of our clients.

Case Study: Bright Smile Dental

The Challenge:
Dr. Smith's practice was struggling with inconsistent lead flow and a 30% no-show rate. Her team spent hours each week on manual follow-ups with minimal results.

The Solution:
After implementing ${clinicName}, the practice automated their entire lead nurture process and added 24/7 chatbot support.

The Results (in 90 days):
- 40% increase in new patient bookings
- No-show rate dropped to 12%
- Staff saved 20 hours per week
- ROI: 8x on their investment

Want to achieve similar results? Let me show you exactly how we can transform your practice.

Schedule Your Free Demo: ${ctaUrl}

Best regards,
The ${clinicName} Team`,
      };
      
    case "STEP_5":
      return {
        subject: `Your Free Demo Expires Tomorrow - Don't Miss Out`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">Hi ${firstName},</h2>
            <p>This is my final message, and I didn't want you to miss this opportunity.</p>
            
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <p style="font-weight: bold; color: #92400e; margin: 0;">Your exclusive demo offer expires tomorrow!</p>
            </div>
            
            <p>Over the past few days, I've shared how ${clinicName} helps dental practices:</p>
            <ul>
              <li>Generate 40%+ more patient bookings</li>
              <li>Reduce no-shows by up to 50%</li>
              <li>Save 15-20 hours per week on manual follow-ups</li>
              <li>Never miss a lead with 24/7 AI chatbot support</li>
            </ul>
            
            <p><strong>Our 15-minute demo will show you exactly how to implement these results in your practice.</strong></p>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${ctaUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 18px 36px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Claim Your Free Demo Now</a>
            </p>
            
            <p style="color: #6b7280; font-size: 14px;">If now isn't the right time, no worries! Reply to this email and let me know when might be better.</p>
            
            <p>Wishing you success,<br/><strong>The ${clinicName} Team</strong></p>
          </div>
        `,
        text: `Hi ${firstName},

This is my final message, and I didn't want you to miss this opportunity.

Your exclusive demo offer expires tomorrow!

Over the past few days, I've shared how ${clinicName} helps dental practices:

- Generate 40%+ more patient bookings
- Reduce no-shows by up to 50%
- Save 15-20 hours per week on manual follow-ups
- Never miss a lead with 24/7 AI chatbot support

Our 15-minute demo will show you exactly how to implement these results in your practice.

Claim Your Free Demo Now: ${ctaUrl}

If now isn't the right time, no worries! Reply to this email and let me know when might be better.

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
  const completedStep4 = tags.includes("nurture_step_4_sent");
  const completedStep5 = tags.includes("nurture_step_5_sent");
  
  // Already completed the full 5-day sequence
  if (completedStep5 || hasTag(lead, LEAD_TAGS.NURTURE_COMPLETE)) {
    return null;
  }
  
  // Lead has responded or converted - no more nurture
  const terminalStatuses = [LEAD_STATUSES.REPLIED, LEAD_STATUSES.DEMO_BOOKED, LEAD_STATUSES.WON, LEAD_STATUSES.LOST];
  if (terminalStatuses.includes(lead.status as any)) {
    return null;
  }
  
  // Determine next step in 5-day sequence
  if (!completedStep1) return "STEP_1";
  if (!completedStep2) return "STEP_2";
  if (!completedStep3) return "STEP_3";
  if (!completedStep4) return "STEP_4";
  if (!completedStep5) return "STEP_5";
  
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
  // Map step to number for tag
  const stepNumber = step === "STEP_1" ? 1 : 
                     step === "STEP_2" ? 2 : 
                     step === "STEP_3" ? 3 : 
                     step === "STEP_4" ? 4 : 5;
  const tagName = `nurture_step_${stepNumber}_sent`;
  await addTag(leadId, tagName);
  
  // If this was step 5 (final step), mark nurture as complete
  if (step === "STEP_5") {
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
