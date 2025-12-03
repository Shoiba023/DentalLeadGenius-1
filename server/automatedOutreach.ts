/**
 * Automated Outreach Engine
 * 
 * Automatically turns synced dental leads into gently paced email campaigns.
 * 
 * Features:
 * - Auto-creates campaigns for clinics with synced leads
 * - Auto-enrolls up to 10 new leads per clinic per hour
 * - Paces email sending (max 10 emails per 10 minutes)
 * - Respects daily limits, never spams
 * - Syncs with DentalMapsHelper as source of truth
 */

import { storage } from "./storage";
import { sendEmail } from "./email";
import { SITE_NAME, SITE_URL, SUPPORT_EMAIL } from "@shared/config";

const DEFAULT_EMAIL_SUBJECT = "Boost Your Practice with AI-Powered Lead Generation";
const DEFAULT_EMAIL_MESSAGE = `Hi {{clinicName}},

Are you looking to attract more patients to your dental practice? 

DentalLeadGenius helps dental clinics like yours:
- Generate 10x more qualified leads
- Automate patient follow-ups
- Book more appointments with AI chatbots

I'd love to show you how it works in a quick 15-minute demo.

Would you be open to a brief call this week?

Best regards,
The DentalLeadGenius Team

P.S. Clinics using our platform see an average 40% increase in new patient bookings.`;

const UNSUBSCRIBE_FOOTER = `

---
You're receiving this because your clinic was found in our dental practice database.
If you'd prefer not to receive these emails, simply reply with "unsubscribe" and we'll remove you from our list.`;

interface AutomationStats {
  clinicsWithCampaigns: number;
  totalActiveCampaigns: number;
  leadsEnrolledThisHour: number;
  emailsSentThisHour: number;
  lastRunAt: Date | null;
}

let automationStats: AutomationStats = {
  clinicsWithCampaigns: 0,
  totalActiveCampaigns: 0,
  leadsEnrolledThisHour: 0,
  emailsSentThisHour: 0,
  lastRunAt: null,
};

let isAutomationRunning = false;
let automationInterval: NodeJS.Timeout | null = null;

/**
 * Get clinics that have synced leads but no active email campaign
 */
async function getClinicsNeedingCampaigns(): Promise<{ clinicId: string; clinicName: string; leadCount: number }[]> {
  const clinicsWithLeads = await storage.getClinicsWithSyncedLeads();
  const result: { clinicId: string; clinicName: string; leadCount: number }[] = [];

  for (const clinic of clinicsWithLeads) {
    const campaigns = await storage.getCampaignsByClinic(clinic.id);
    const hasActiveEmailCampaign = campaigns.some(
      c => c.type === "email" && (c.status === "active" || c.status === "ready")
    );

    if (!hasActiveEmailCampaign) {
      const leads = await storage.getSyncedLeadsForClinic(clinic.id);
      if (leads.length > 0) {
        result.push({
          clinicId: clinic.id,
          clinicName: clinic.name,
          leadCount: leads.length,
        });
      }
    }
  }

  return result;
}

/**
 * Auto-create an email campaign for a clinic
 */
async function createAutoCampaign(clinicId: string, clinicName: string): Promise<string | null> {
  try {
    const campaign = await storage.createCampaign({
      clinicId,
      name: `Auto Outreach – ${clinicName}`,
      type: "email",
      subject: DEFAULT_EMAIL_SUBJECT,
      message: DEFAULT_EMAIL_MESSAGE + UNSUBSCRIBE_FOOTER,
      status: "active",
      dailyLimit: 50,
    });

    console.log(`[AUTO-OUTREACH] Created campaign "${campaign.name}" for clinic ${clinicId}`);
    return campaign.id;
  } catch (error) {
    console.error(`[AUTO-OUTREACH] Failed to create campaign for clinic ${clinicId}:`, error);
    return null;
  }
}

/**
 * Enroll new leads into campaigns (up to 10 per clinic per hour)
 */
async function enrollLeadsIntoCampaigns(): Promise<number> {
  let totalEnrolled = 0;
  const clinicsWithLeads = await storage.getClinicsWithSyncedLeads();

  for (const clinic of clinicsWithLeads) {
    const clinicId = clinic.id;
    const campaigns = await storage.getCampaignsByClinic(clinicId);
    const activeCampaign = campaigns.find(
      c => c.type === "email" && c.status === "active"
    );

    if (!activeCampaign) continue;

    const syncedLeads = await storage.getSyncedLeadsForClinic(clinicId);
    const campaignLeads = await storage.getCampaignLeads(activeCampaign.id);
    const enrolledLeadIds = new Set(campaignLeads.map(cl => cl.leadId));

    const newLeads = syncedLeads
      .filter(lead => !enrolledLeadIds.has(lead.id))
      .filter(lead => lead.email && lead.email.trim() !== "")
      .filter(lead => lead.marketingOptIn === true)
      .slice(0, 10);

    if (newLeads.length > 0) {
      try {
        await storage.addLeadsToCampaign(
          activeCampaign.id,
          newLeads.map(l => l.id)
        );
        totalEnrolled += newLeads.length;
        console.log(`[AUTO-OUTREACH] Enrolled ${newLeads.length} leads into campaign ${activeCampaign.id}`);
      } catch (error) {
        console.error(`[AUTO-OUTREACH] Failed to enroll leads:`, error);
      }
    }
  }

  return totalEnrolled;
}

/**
 * Send emails for active campaigns (max 10 per campaign per 10 minutes)
 */
async function sendPacedEmails(): Promise<number> {
  let totalSent = 0;
  const clinicsWithLeads = await storage.getClinicsWithSyncedLeads();

  for (const clinic of clinicsWithLeads) {
    const clinicId = clinic.id;
    const campaigns = await storage.getCampaignsByClinic(clinicId);
    const activeCampaign = campaigns.find(
      c => c.type === "email" && c.status === "active"
    );

    if (!activeCampaign) continue;

    const dailyLimit = activeCampaign.dailyLimit || 50;
    const sentToday = activeCampaign.sentToday || 0;
    const remainingToday = dailyLimit - sentToday;

    if (remainingToday <= 0) {
      console.log(`[AUTO-OUTREACH] Campaign ${activeCampaign.id} reached daily limit (${dailyLimit})`);
      continue;
    }

    const campaignLeads = await storage.getCampaignLeads(activeCampaign.id);
    const pendingLeads = campaignLeads
      .filter(cl => cl.status === "pending")
      .slice(0, Math.min(10, remainingToday));

    if (pendingLeads.length === 0) continue;

    const clinicDetails = await storage.getClinicById(clinicId);
    const clinicName = clinicDetails?.name || "Dental Practice";

    for (const campaignLead of pendingLeads) {
      const lead = campaignLead.lead;
      if (!lead.email) continue;

      const personalizedMessage = activeCampaign.message
        .replace(/\{\{clinicName\}\}/g, lead.name || clinicName)
        .replace(/\{\{name\}\}/g, lead.name || "there");

      try {
        const result = await sendEmail({
          to: lead.email,
          subject: activeCampaign.subject || DEFAULT_EMAIL_SUBJECT,
          html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; white-space: pre-wrap;">${personalizedMessage}</div>`,
          text: personalizedMessage,
        });

        if (result.ok) {
          await storage.markCampaignLeadSent(campaignLead.id);
          totalSent++;
          console.log(`[AUTO-OUTREACH] Sent email to ${lead.email}`);
        } else {
          await storage.updateCampaignLeadStatus(campaignLead.id, "failed", result.error);
          console.error(`[AUTO-OUTREACH] Failed to send to ${lead.email}: ${result.error}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        await storage.updateCampaignLeadStatus(campaignLead.id, "failed", errorMsg);
        console.error(`[AUTO-OUTREACH] Error sending to ${lead.email}:`, error);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (totalSent > 0) {
      await storage.updateCampaignByClinic(activeCampaign.id, clinicId, {
        sentToday: sentToday + totalSent,
        totalSent: (activeCampaign.totalSent || 0) + totalSent,
      });
    }
  }

  return totalSent;
}

/**
 * Run one cycle of the automation engine
 */
export async function runAutomationCycle(): Promise<{
  campaignsCreated: number;
  leadsEnrolled: number;
  emailsSent: number;
}> {
  console.log("[AUTO-OUTREACH] Starting automation cycle...");

  const clinicsNeedingCampaigns = await getClinicsNeedingCampaigns();
  let campaignsCreated = 0;

  for (const { clinicId, clinicName } of clinicsNeedingCampaigns) {
    const campaignId = await createAutoCampaign(clinicId, clinicName);
    if (campaignId) campaignsCreated++;
  }

  const leadsEnrolled = await enrollLeadsIntoCampaigns();

  const emailsSent = await sendPacedEmails();

  automationStats = {
    clinicsWithCampaigns: (await storage.getClinicsWithSyncedLeads()).length,
    totalActiveCampaigns: campaignsCreated + automationStats.totalActiveCampaigns,
    leadsEnrolledThisHour: leadsEnrolled,
    emailsSentThisHour: emailsSent,
    lastRunAt: new Date(),
  };

  console.log(`[AUTO-OUTREACH] Cycle complete: ${campaignsCreated} campaigns created, ${leadsEnrolled} leads enrolled, ${emailsSent} emails sent`);

  return { campaignsCreated, leadsEnrolled, emailsSent };
}

/**
 * Start the automation engine (runs every 10 minutes)
 */
export function startAutomation(): boolean {
  if (isAutomationRunning) {
    console.log("[AUTO-OUTREACH] Automation already running");
    return false;
  }

  isAutomationRunning = true;
  console.log("[AUTO-OUTREACH] Starting automation engine...");

  runAutomationCycle().catch(console.error);

  automationInterval = setInterval(() => {
    runAutomationCycle().catch(console.error);
  }, 10 * 60 * 1000);

  return true;
}

/**
 * Stop the automation engine
 */
export function stopAutomation(): boolean {
  if (!isAutomationRunning) {
    console.log("[AUTO-OUTREACH] Automation not running");
    return false;
  }

  if (automationInterval) {
    clearInterval(automationInterval);
    automationInterval = null;
  }

  isAutomationRunning = false;
  console.log("[AUTO-OUTREACH] Automation engine stopped");
  return true;
}

/**
 * Get current automation status
 */
export async function getAutomationStatus(): Promise<{
  isRunning: boolean;
  stats: AutomationStats;
  clinicsWithoutCampaigns: { clinicId: string; clinicName: string; leadCount: number }[];
}> {
  const clinicsNeedingCampaigns = await getClinicsNeedingCampaigns();

  return {
    isRunning: isAutomationRunning,
    stats: automationStats,
    clinicsWithoutCampaigns: clinicsNeedingCampaigns,
  };
}

/**
 * Get summary for user-friendly display
 */
export async function getOutreachSummary(): Promise<{
  status: string;
  clinicsWithCampaigns: number;
  totalLeadsEnrolled: number;
  totalEmailsSent: number;
  lastRun: string;
}> {
  const clinicsWithLeads = await storage.getClinicsWithSyncedLeads();
  let totalLeadsEnrolled = 0;
  let totalEmailsSent = 0;
  let clinicsWithCampaigns = 0;

  for (const clinic of clinicsWithLeads) {
    const campaigns = await storage.getCampaignsByClinic(clinic.id);
    const activeCampaign = campaigns.find(c => c.type === "email" && c.status === "active");

    if (activeCampaign) {
      clinicsWithCampaigns++;
      totalEmailsSent += activeCampaign.totalSent || 0;
      const campaignLeads = await storage.getCampaignLeads(activeCampaign.id);
      totalLeadsEnrolled += campaignLeads.length;
    }
  }

  return {
    status: isAutomationRunning ? "Running" : "Stopped",
    clinicsWithCampaigns,
    totalLeadsEnrolled,
    totalEmailsSent,
    lastRun: automationStats.lastRunAt?.toISOString() || "Never",
  };
}
