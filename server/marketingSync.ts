/**
 * Marketing Sync Engine (Genius Auto-Mode)
 * 
 * Fully autonomous email outreach system that:
 * 1. Syncs with DentalMapsHelper every 1 minute
 * 2. Sends AI-personalized emails to eligible clinics (24/7)
 * 3. Enforces 72-hour cooldown per clinic (no spam)
 * 4. Always includes demo link in every email
 * 5. Logs all outreach activity for tracking
 * 6. Auto-creates campaigns and enrolls valid leads
 */

import { storage } from "./storage";
import { sendEmail } from "./email";
import OpenAI from "openai";
import type { Clinic, Lead, InsertOutreachLog } from "@shared/schema";

// Configuration - Genius Auto-Mode
const CONFIG = {
  CLINICS_PER_CYCLE: 10,           // Max 10 clinics per cycle (staggered delivery)
  CYCLE_INTERVAL_MS: 1 * 60 * 1000, // 1 minute sync interval
  COOLDOWN_HOURS: 72,               // 72-hour cooldown per clinic
  DEMO_LINK: "https://dental-lead-genius-1-shoibaali10.replit.app/demo",
  MAX_RETRIES: 3,
  SEND_DELAY_MS: 500,               // 500ms between emails (faster pacing)
};

// Engine state
let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;
let lastCycleAt: Date | null = null;
let cycleCount = 0;

// OpenAI client for AI-powered email generation
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

/**
 * Generate a unique cycle ID for tracking
 */
function generateCycleId(): string {
  return `cycle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * AI-powered email content generation
 */
async function generateEmailContent(clinic: Clinic, leads: Lead[]): Promise<{
  subject: string;
  htmlContent: string;
  plainText: string;
}> {
  const clinicName = clinic.name || "Your Dental Practice";
  const city = clinic.city || "your area";
  const state = clinic.state || "";
  const location = state ? `${city}, ${state}` : city;

  // Get a lead's name if available for personalization
  const sampleLead = leads[0];
  const doctorName = sampleLead?.name?.split(" ")[0] || "Doctor";

  const prompt = `Generate a professional, personalized cold email for a dental practice outreach campaign.

Clinic Details:
- Name: ${clinicName}
- Location: ${location}
- Website: ${clinic.website || "Not provided"}

Requirements:
1. Subject line should be attention-grabbing but professional (under 60 characters)
2. Email should be concise (150-200 words max)
3. Mention the value proposition: AI-powered patient acquisition and lead management
4. Reference their location naturally
5. Include a clear call-to-action to try the demo
6. Tone: Professional, helpful, not pushy
7. Don't use brackets or placeholder text - make it ready to send

Demo Link (MUST be included): ${CONFIG.DEMO_LINK}

Generate the email in this JSON format:
{
  "subject": "The email subject line",
  "htmlContent": "The HTML email body with proper formatting",
  "plainText": "Plain text version of the email"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a B2B email marketing expert specializing in dental industry SaaS. Generate personalized, high-converting outreach emails that feel authentic and helpful, not spammy."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in AI response");
    }

    const parsed = JSON.parse(content);
    
    // Ensure demo link is in the content
    if (!parsed.htmlContent.includes(CONFIG.DEMO_LINK)) {
      parsed.htmlContent += `<p><a href="${CONFIG.DEMO_LINK}" style="color: #0066cc;">Try the Demo</a></p>`;
      parsed.plainText += `\n\nTry the Demo: ${CONFIG.DEMO_LINK}`;
    }

    return {
      subject: parsed.subject,
      htmlContent: wrapEmailHtml(parsed.htmlContent, clinicName),
      plainText: parsed.plainText,
    };
  } catch (error) {
    console.error("[MarketingSync] AI generation failed, using fallback template:", error);
    return generateFallbackEmail(clinicName, location);
  }
}

/**
 * Fallback email template if AI fails
 */
function generateFallbackEmail(clinicName: string, location: string): {
  subject: string;
  htmlContent: string;
  plainText: string;
} {
  const subject = `Grow ${clinicName}'s Patient Base with AI`;
  
  const plainText = `Hi there,

I noticed ${clinicName} in ${location} and thought you might be interested in how dental practices are using AI to acquire new patients.

DentalLeadGenius helps dental clinics:
• Automatically capture and nurture leads
• Book more appointments with AI chatbots
• Manage patient communications across all channels

Many practices in your area are seeing 30-40% more patient appointments within 90 days.

Would you like to see how it works? Try our interactive demo:
${CONFIG.DEMO_LINK}

Best regards,
The DentalLeadGenius Team

P.S. No commitment required - just see if it's a fit for your practice.`;

  const htmlContent = `
    <p>Hi there,</p>
    
    <p>I noticed <strong>${clinicName}</strong> in ${location} and thought you might be interested in how dental practices are using AI to acquire new patients.</p>
    
    <p><strong>DentalLeadGenius</strong> helps dental clinics:</p>
    <ul>
      <li>Automatically capture and nurture leads</li>
      <li>Book more appointments with AI chatbots</li>
      <li>Manage patient communications across all channels</li>
    </ul>
    
    <p>Many practices in your area are seeing <strong>30-40% more patient appointments</strong> within 90 days.</p>
    
    <p>Would you like to see how it works? <a href="${CONFIG.DEMO_LINK}" style="color: #0066cc; font-weight: bold;">Try our interactive demo →</a></p>
    
    <p>Best regards,<br/>The DentalLeadGenius Team</p>
    
    <p style="font-size: 12px; color: #666;">P.S. No commitment required - just see if it's a fit for your practice.</p>
  `;

  return {
    subject,
    htmlContent: wrapEmailHtml(htmlContent, clinicName),
    plainText,
  };
}

/**
 * Wrap email content in a professional HTML template
 */
function wrapEmailHtml(content: string, clinicName: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  ${content}
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
  
  <footer style="font-size: 11px; color: #999; text-align: center;">
    <p>This email was sent by DentalLeadGenius to ${clinicName}.</p>
    <p>If you don't want to receive these emails, simply ignore this message or reply with "unsubscribe".</p>
  </footer>
</body>
</html>`;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Send email to a single clinic
 */
async function sendOutreachEmail(
  clinic: Clinic,
  leads: Lead[],
  cycleId: string
): Promise<{ success: boolean; error?: string }> {
  // Determine recipient - clinic email or first lead with email
  const recipientEmail = clinic.email || leads.find(l => l.email)?.email;
  const recipientName = clinic.name || leads.find(l => l.name)?.name || "Practice Owner";

  if (!recipientEmail) {
    // Log the failure - no valid email
    await storage.createOutreachLog({
      clinicId: clinic.id,
      leadId: leads[0]?.id || null,
      cycleId,
      recipientEmail: "none",
      recipientName,
      subject: "N/A",
      messagePreview: "No valid email address found for clinic or leads",
      status: "failed",
      errorMessage: "No valid email address found",
      aiGenerated: false,
    });
    return { success: false, error: "No valid email address found" };
  }

  try {
    // Generate personalized email content
    const emailContent = await generateEmailContent(clinic, leads);

    // Send the email
    const sent = await sendEmail({
      to: recipientEmail,
      subject: emailContent.subject,
      html: emailContent.htmlContent,
    });

    if (sent) {
      // Log successful send (single log entry)
      await storage.createOutreachLog({
        clinicId: clinic.id,
        leadId: leads[0]?.id || null,
        cycleId,
        recipientEmail,
        recipientName,
        subject: emailContent.subject,
        messagePreview: emailContent.plainText.substring(0, 500),
        status: "sent",
        aiGenerated: true,
      });
      
      // Update clinic's lastEmailedAt
      await storage.updateClinicLastEmailedAt(clinic.id);
      
      console.log(`[MarketingSync] ✓ Email sent to ${recipientEmail} for clinic ${clinic.name}`);
      return { success: true };
    } else {
      // Log failed send
      await storage.createOutreachLog({
        clinicId: clinic.id,
        leadId: leads[0]?.id || null,
        cycleId,
        recipientEmail,
        recipientName,
        subject: emailContent.subject,
        messagePreview: emailContent.plainText.substring(0, 500),
        status: "failed",
        errorMessage: "Email send returned false",
        aiGenerated: true,
      });
      return { success: false, error: "Email send failed" };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[MarketingSync] ✗ Error sending to clinic ${clinic.id}:`, errorMessage);
    
    // Log the failure
    await storage.createOutreachLog({
      clinicId: clinic.id,
      leadId: leads[0]?.id || null,
      cycleId,
      recipientEmail,
      recipientName,
      subject: "Error during generation/send",
      status: "failed",
      errorMessage,
      aiGenerated: true,
    });
    
    return { success: false, error: errorMessage };
  }
}

/**
 * Run a single outreach cycle
 */
async function runOutreachCycle(): Promise<{
  cycleId: string;
  clinicsProcessed: number;
  emailsSent: number;
  errors: string[];
}> {
  const cycleId = generateCycleId();
  console.log(`\n[MarketingSync] ═══════════════════════════════════════`);
  console.log(`[MarketingSync] Starting cycle ${cycleId}`);
  console.log(`[MarketingSync] Time: ${new Date().toISOString()}`);
  console.log(`[MarketingSync] ═══════════════════════════════════════`);

  const results = {
    cycleId,
    clinicsProcessed: 0,
    emailsSent: 0,
    errors: [] as string[],
  };

  try {
    // Get eligible clinics (respects 72-hour cooldown)
    const eligibleClinics = await storage.getClinicsEligibleForOutreach(CONFIG.COOLDOWN_HOURS);
    console.log(`[MarketingSync] Found ${eligibleClinics.length} eligible clinics`);

    if (eligibleClinics.length === 0) {
      console.log(`[MarketingSync] No eligible clinics - all are in cooldown period`);
      return results;
    }

    // Select up to 10 clinics for this cycle
    const clinicsToProcess = eligibleClinics.slice(0, CONFIG.CLINICS_PER_CYCLE);
    console.log(`[MarketingSync] Processing ${clinicsToProcess.length} clinics this cycle`);

    // Process each clinic
    for (const clinic of clinicsToProcess) {
      results.clinicsProcessed++;
      
      // Get leads for this clinic
      const leads = await storage.getLeadsForOutreach(clinic.id);
      console.log(`[MarketingSync] Clinic "${clinic.name}" has ${leads.length} outreach-eligible leads`);

      // Send outreach email
      const sendResult = await sendOutreachEmail(clinic, leads, cycleId);
      
      if (sendResult.success) {
        results.emailsSent++;
      } else if (sendResult.error) {
        results.errors.push(`${clinic.name}: ${sendResult.error}`);
      }

      // Delay between emails to avoid rate limiting
      await sleep(CONFIG.SEND_DELAY_MS);
    }

    console.log(`[MarketingSync] ───────────────────────────────────────`);
    console.log(`[MarketingSync] Cycle complete: ${results.emailsSent}/${results.clinicsProcessed} emails sent`);
    if (results.errors.length > 0) {
      console.log(`[MarketingSync] Errors: ${results.errors.length}`);
    }
    console.log(`[MarketingSync] ═══════════════════════════════════════\n`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[MarketingSync] Cycle failed:`, errorMessage);
    results.errors.push(`Cycle error: ${errorMessage}`);
  }

  lastCycleAt = new Date();
  cycleCount++;

  return results;
}

/**
 * Start the marketing sync engine
 */
export function startMarketingSync(): { success: boolean; message: string } {
  if (isRunning) {
    return { success: false, message: "Marketing sync engine is already running" };
  }

  console.log(`[MarketingSync] ╔═══════════════════════════════════════════╗`);
  console.log(`[MarketingSync] ║  MARKETING SYNC ENGINE STARTING           ║`);
  console.log(`[MarketingSync] ╠═══════════════════════════════════════════╣`);
  console.log(`[MarketingSync] ║  Clinics per cycle: ${CONFIG.CLINICS_PER_CYCLE.toString().padStart(3)}                  ║`);
  console.log(`[MarketingSync] ║  Interval: ${(CONFIG.CYCLE_INTERVAL_MS / 60000).toString().padStart(2)} minutes                   ║`);
  console.log(`[MarketingSync] ║  Cooldown: ${CONFIG.COOLDOWN_HOURS.toString().padStart(2)} hours                     ║`);
  console.log(`[MarketingSync] ╚═══════════════════════════════════════════╝`);

  isRunning = true;

  // Run immediately on start
  runOutreachCycle().catch(err => {
    console.error("[MarketingSync] Initial cycle failed:", err);
  });

  // Set up recurring interval
  intervalId = setInterval(() => {
    runOutreachCycle().catch(err => {
      console.error("[MarketingSync] Scheduled cycle failed:", err);
    });
  }, CONFIG.CYCLE_INTERVAL_MS);

  return { success: true, message: "Marketing sync engine started successfully" };
}

/**
 * Stop the marketing sync engine
 */
export function stopMarketingSync(): { success: boolean; message: string } {
  if (!isRunning) {
    return { success: false, message: "Marketing sync engine is not running" };
  }

  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }

  isRunning = false;
  console.log(`[MarketingSync] Engine stopped`);

  return { success: true, message: "Marketing sync engine stopped successfully" };
}

/**
 * Get current engine status
 */
export function getMarketingSyncStatus(): {
  isRunning: boolean;
  lastCycleAt: Date | null;
  cycleCount: number;
  config: typeof CONFIG;
} {
  return {
    isRunning,
    lastCycleAt,
    cycleCount,
    config: CONFIG,
  };
}

/**
 * Run a single cycle manually (for testing/admin)
 */
export async function runManualCycle(): Promise<{
  cycleId: string;
  clinicsProcessed: number;
  emailsSent: number;
  errors: string[];
}> {
  console.log(`[MarketingSync] Manual cycle triggered`);
  return await runOutreachCycle();
}

/**
 * Get outreach statistics
 */
export async function getOutreachStatistics(): Promise<{
  engine: {
    isRunning: boolean;
    lastCycleAt: Date | null;
    cycleCount: number;
  };
  totals: {
    totalSent: number;
    successfulSends: number;
    failedSends: number;
    clinicsEmailed: number;
  };
  recentLogs: Array<{
    id: string;
    clinicId: string;
    recipientEmail: string;
    status: string;
    sentAt: Date | null;
  }>;
}> {
  const stats = await storage.getOutreachStats();
  const recentLogs = await storage.getRecentOutreachLogs(10);

  return {
    engine: {
      isRunning,
      lastCycleAt,
      cycleCount,
    },
    totals: stats,
    recentLogs: recentLogs.map(log => ({
      id: log.id,
      clinicId: log.clinicId,
      recipientEmail: log.recipientEmail,
      status: log.status,
      sentAt: log.sentAt,
    })),
  };
}
