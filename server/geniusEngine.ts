/**
 * GENIUS ENGINE - 7-Day Automated Email Sequence System
 * 
 * This is the core automation engine for DentalLeadGenius outbound sales.
 * It manages lead sequences, email templates, and sending logic.
 * 
 * BUDGET LIMITS (enforced):
 * - Max 1,666 emails/day
 * - $100/month email budget
 * - Auto-pause at 70% thresholds
 */

import { db } from "./db";
import { 
  geniusLeads, 
  geniusEmailSends, 
  geniusDailyStats, 
  geniusConfig,
  type GeniusLead,
  type InsertGeniusLead,
  type GeniusEmailSend,
  type GeniusDailyStats,
} from "@shared/schema";
import { eq, and, lte, gte, sql, desc, isNull, or } from "drizzle-orm";
import { sendEmail } from "./email";
import { SITE_NAME, SITE_URL, SUPPORT_EMAIL } from "@shared/config";

// ============================================================================
// CONFIGURATION - Budget & Rate Limits
// ============================================================================

export const GENIUS_CONFIG = {
  DAILY_EMAIL_LIMIT: 1666,
  MONTHLY_EMAIL_BUDGET_CENTS: 10000, // $100
  WEEKLY_REPLIT_BUDGET_CENTS: 8000, // $80
  EMAIL_COST_CENTS: 0.4, // $0.004 per email (Resend pricing estimate)
  PAUSE_THRESHOLD_PERCENT: 70,
  DEMO_LINK: "https://DentalLeadGenius.com/demo",
  BATCH_SIZE: 50, // Emails per batch
  BATCH_DELAY_MS: 1000, // Delay between batches
  SEQUENCE_DAYS: 7,
};

// ============================================================================
// EMAIL TEMPLATES - 7-Day Sales Sequence
// ============================================================================

interface EmailTemplate {
  day: number;
  subject: string;
  getBody: (dentistName: string) => string;
  getHtml: (dentistName: string) => string;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  // DAY 0 - Warm-up Trigger (Short 3-line email)
  {
    day: 0,
    subject: "Your clinic is losing 30–50 patients every month",
    getBody: (dentistName: string) => `
Hi ${dentistName},

I checked your clinic online—patients leave when no one replies instantly.
I built an AI receptionist that books patients for you, 24/7.
Want the demo link?

Free Demo: ${GENIUS_CONFIG.DEMO_LINK}

Best,
The ${SITE_NAME} Team
    `.trim(),
    getHtml: (dentistName: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f9fafb; color: #1f2937;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
    <p style="margin: 0 0 16px;">Hi ${dentistName},</p>
    <p style="margin: 0 0 16px;">I checked your clinic online—patients leave when no one replies instantly.</p>
    <p style="margin: 0 0 16px;">I built an AI receptionist that books patients for you, 24/7.</p>
    <p style="margin: 0 0 24px;">Want the demo link?</p>
    <p style="margin: 0 0 24px;">
      <a href="${GENIUS_CONFIG.DEMO_LINK}" style="display: inline-block; background: #18181b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Access Free Demo
      </a>
    </p>
    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px;">
      Best,<br>The ${SITE_NAME} Team
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
      <a href="${GENIUS_CONFIG.DEMO_LINK}?unsubscribe=true" style="color: #9ca3af;">Unsubscribe</a> | 
      ${SITE_NAME} | ${SUPPORT_EMAIL}
    </p>
  </div>
</body>
</html>
    `.trim(),
  },

  // DAY 1 - Proof Email (Show value)
  {
    day: 1,
    subject: "See how clinics get 40–60 new bookings monthly",
    getBody: (dentistName: string) => `
Hi ${dentistName},

Our AI receptionist:
✔ Books automatically
✔ Handles insurance questions
✔ Converts missed calls to appointments
✔ Works 24/7 without breaks

Want to see it live?

Demo: ${GENIUS_CONFIG.DEMO_LINK}

Best,
The ${SITE_NAME} Team
    `.trim(),
    getHtml: (dentistName: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f9fafb; color: #1f2937;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
    <p style="margin: 0 0 16px;">Hi ${dentistName},</p>
    <p style="margin: 0 0 16px;">Our AI receptionist:</p>
    <ul style="margin: 0 0 16px; padding-left: 20px;">
      <li style="margin-bottom: 8px;">✔ Books automatically</li>
      <li style="margin-bottom: 8px;">✔ Handles insurance questions</li>
      <li style="margin-bottom: 8px;">✔ Converts missed calls to appointments</li>
      <li style="margin-bottom: 8px;">✔ Works 24/7 without breaks</li>
    </ul>
    <p style="margin: 0 0 24px;">Want to see it live?</p>
    <p style="margin: 0 0 24px;">
      <a href="${GENIUS_CONFIG.DEMO_LINK}" style="display: inline-block; background: #18181b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Access Free Demo
      </a>
    </p>
    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px;">
      Best,<br>The ${SITE_NAME} Team
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
      <a href="${GENIUS_CONFIG.DEMO_LINK}?unsubscribe=true" style="color: #9ca3af;">Unsubscribe</a> | 
      ${SITE_NAME} | ${SUPPORT_EMAIL}
    </p>
  </div>
</body>
</html>
    `.trim(),
  },

  // DAY 2 - FEAR Email (Missed Calls = Lost Revenue)
  {
    day: 2,
    subject: "Missed calls = $300–$600 lost daily",
    getBody: (dentistName: string) => `
Hi ${dentistName},

Clinics miss 20–40 calls/day.
Each missed patient = $1,000 lifetime value.
Your clinic can stop losing money today.

Start free: ${GENIUS_CONFIG.DEMO_LINK}

Best,
The ${SITE_NAME} Team
    `.trim(),
    getHtml: (dentistName: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f9fafb; color: #1f2937;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
    <p style="margin: 0 0 16px;">Hi ${dentistName},</p>
    <p style="margin: 0 0 16px;"><strong>Clinics miss 20–40 calls/day.</strong></p>
    <p style="margin: 0 0 16px;">Each missed patient = <span style="color: #dc2626; font-weight: 600;">$1,000 lifetime value.</span></p>
    <p style="margin: 0 0 24px;">Your clinic can stop losing money today.</p>
    <p style="margin: 0 0 24px;">
      <a href="${GENIUS_CONFIG.DEMO_LINK}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Stop Losing Money →
      </a>
    </p>
    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px;">
      Best,<br>The ${SITE_NAME} Team
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
      <a href="${GENIUS_CONFIG.DEMO_LINK}?unsubscribe=true" style="color: #9ca3af;">Unsubscribe</a> | 
      ${SITE_NAME} | ${SUPPORT_EMAIL}
    </p>
  </div>
</body>
</html>
    `.trim(),
  },

  // DAY 3 - Social Proof
  {
    day: 3,
    subject: "How one clinic added $14,200/month with AI receptionist",
    getBody: (dentistName: string) => `
Hi ${dentistName},

One clinic booked 17 patients overnight.
Another reduced no-shows by 40%.

Your clinic can achieve similar results.

Demo: ${GENIUS_CONFIG.DEMO_LINK}

Best,
The ${SITE_NAME} Team
    `.trim(),
    getHtml: (dentistName: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f9fafb; color: #1f2937;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
    <p style="margin: 0 0 16px;">Hi ${dentistName},</p>
    <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 0 0 16px; border-radius: 4px;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #16a34a;">Real Results:</p>
      <p style="margin: 0 0 8px;">✔ One clinic booked <strong>17 patients overnight</strong></p>
      <p style="margin: 0;">✔ Another reduced no-shows by <strong>40%</strong></p>
    </div>
    <p style="margin: 0 0 24px;">Your clinic can achieve similar results.</p>
    <p style="margin: 0 0 24px;">
      <a href="${GENIUS_CONFIG.DEMO_LINK}" style="display: inline-block; background: #18181b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        See How It Works
      </a>
    </p>
    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px;">
      Best,<br>The ${SITE_NAME} Team
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
      <a href="${GENIUS_CONFIG.DEMO_LINK}?unsubscribe=true" style="color: #9ca3af;">Unsubscribe</a> | 
      ${SITE_NAME} | ${SUPPORT_EMAIL}
    </p>
  </div>
</body>
</html>
    `.trim(),
  },

  // DAY 4 - Objection Killer
  {
    day: 4,
    subject: '"We already have a receptionist" (Solved)',
    getBody: (dentistName: string) => `
Hi ${dentistName},

Our AI supports your staff. It replies instantly, books patients,
and handles workload during rush hours.

Try 30 days free: ${GENIUS_CONFIG.DEMO_LINK}

Best,
The ${SITE_NAME} Team
    `.trim(),
    getHtml: (dentistName: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f9fafb; color: #1f2937;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
    <p style="margin: 0 0 16px;">Hi ${dentistName},</p>
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 0 0 16px; border-radius: 4px;">
      <p style="margin: 0; font-weight: 600; color: #92400e;">Common Question:</p>
      <p style="margin: 8px 0 0; font-style: italic;">"We already have a receptionist..."</p>
    </div>
    <p style="margin: 0 0 16px;">Our AI <strong>supports</strong> your staff. It:</p>
    <ul style="margin: 0 0 16px; padding-left: 20px;">
      <li style="margin-bottom: 8px;">Replies instantly (even at 2 AM)</li>
      <li style="margin-bottom: 8px;">Books patients automatically</li>
      <li style="margin-bottom: 8px;">Handles workload during rush hours</li>
    </ul>
    <p style="margin: 0 0 24px;">
      <a href="${GENIUS_CONFIG.DEMO_LINK}" style="display: inline-block; background: #18181b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Try 30 Days Free
      </a>
    </p>
    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px;">
      Best,<br>The ${SITE_NAME} Team
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
      <a href="${GENIUS_CONFIG.DEMO_LINK}?unsubscribe=true" style="color: #9ca3af;">Unsubscribe</a> | 
      ${SITE_NAME} | ${SUPPORT_EMAIL}
    </p>
  </div>
</body>
</html>
    `.trim(),
  },

  // DAY 5 - Urgency Email (24 hours left)
  {
    day: 5,
    subject: "Final 24 hours for early pricing access",
    getBody: (dentistName: string) => `
Hi ${dentistName},

Your clinic qualifies for special pricing for only 24 more hours.
Tomorrow the price returns to regular.

Claim offer: ${GENIUS_CONFIG.DEMO_LINK}

Best,
The ${SITE_NAME} Team
    `.trim(),
    getHtml: (dentistName: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f9fafb; color: #1f2937;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
    <div style="background: #fef2f2; border: 2px solid #dc2626; padding: 16px; margin: 0 0 20px; border-radius: 8px; text-align: center;">
      <p style="margin: 0; font-size: 18px; font-weight: 700; color: #dc2626;">⏰ FINAL 24 HOURS</p>
    </div>
    <p style="margin: 0 0 16px;">Hi ${dentistName},</p>
    <p style="margin: 0 0 16px;">Your clinic qualifies for <strong>special pricing</strong> for only 24 more hours.</p>
    <p style="margin: 0 0 24px;">Tomorrow the price returns to regular.</p>
    <p style="margin: 0 0 24px;">
      <a href="${GENIUS_CONFIG.DEMO_LINK}" style="display: inline-block; background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Claim Your Offer Now
      </a>
    </p>
    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px;">
      Best,<br>The ${SITE_NAME} Team
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
      <a href="${GENIUS_CONFIG.DEMO_LINK}?unsubscribe=true" style="color: #9ca3af;">Unsubscribe</a> | 
      ${SITE_NAME} | ${SUPPORT_EMAIL}
    </p>
  </div>
</body>
</html>
    `.trim(),
  },

  // DAY 6 - Final Call (Short + Direct)
  {
    day: 6,
    subject: "Last chance — installs in 3 minutes",
    getBody: (dentistName: string) => `
Hi ${dentistName},

This is the final reminder.
Your AI receptionist installs in minutes and runs nonstop.

Start free today: ${GENIUS_CONFIG.DEMO_LINK}

Best,
The ${SITE_NAME} Team
    `.trim(),
    getHtml: (dentistName: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f9fafb; color: #1f2937;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
    <p style="margin: 0 0 16px;">Hi ${dentistName},</p>
    <p style="margin: 0 0 16px;"><strong>This is the final reminder.</strong></p>
    <p style="margin: 0 0 16px;">Your AI receptionist:</p>
    <ul style="margin: 0 0 16px; padding-left: 20px;">
      <li style="margin-bottom: 8px;">✔ Installs in <strong>3 minutes</strong></li>
      <li style="margin-bottom: 8px;">✔ Runs 24/7 nonstop</li>
      <li style="margin-bottom: 8px;">✔ No contracts</li>
    </ul>
    <p style="margin: 0 0 24px;">
      <a href="${GENIUS_CONFIG.DEMO_LINK}" style="display: inline-block; background: #18181b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Start Free Today →
      </a>
    </p>
    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px;">
      Best,<br>The ${SITE_NAME} Team
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
      <a href="${GENIUS_CONFIG.DEMO_LINK}?unsubscribe=true" style="color: #9ca3af;">Unsubscribe</a> | 
      ${SITE_NAME} | ${SUPPORT_EMAIL}
    </p>
  </div>
</body>
</html>
    `.trim(),
  },
];

// ============================================================================
// GENIUS ENGINE STATE
// ============================================================================

let geniusState = {
  isRunning: false,
  isPaused: false,
  pauseReason: "",
  lastCycleAt: null as Date | null,
  emailsSentToday: 0,
  todayDate: new Date().toDateString(),
  // Tracks if 70% threshold has already triggered auto-pause
  // Reset when usage drops below threshold or new day starts
  thresholdPauseFired: false,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function log(message: string, level: "info" | "warn" | "error" | "success" = "info") {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: "ℹ️",
    warn: "⚠️",
    error: "❌",
    success: "✅",
  }[level];
  console.log(`${timestamp} [GENIUS] ${prefix} ${message}`);
}

function resetDailyCounterIfNeeded() {
  const today = new Date().toDateString();
  if (geniusState.todayDate !== today) {
    geniusState.emailsSentToday = 0;
    geniusState.todayDate = today;
    geniusState.thresholdPauseFired = false; // Reset threshold flag for new day
    log("Daily counter and threshold flag reset for new day", "info");
  }
}

// ============================================================================
// LEAD MANAGEMENT (HELPER AGENT)
// ============================================================================

/**
 * Validate email format (basic syntax check)
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Import a single lead into the GENIUS system
 */
export async function importGeniusLead(data: {
  email: string;
  dentistName?: string;
  clinicName?: string;
  city?: string;
  state?: string;
  phone?: string;
  website?: string;
  leadId?: string;
  source?: string;
}): Promise<{ success: boolean; leadId?: string; error?: string; existing?: boolean }> {
  try {
    if (!data.email || !isValidEmail(data.email)) {
      return { success: false, error: "Invalid email format" };
    }

    // Check for duplicate
    const [existing] = await db.select()
      .from(geniusLeads)
      .where(eq(geniusLeads.email, data.email.toLowerCase().trim()));

    if (existing) {
      return { success: true, leadId: existing.id, existing: true };
    }

    // Insert new lead
    const [lead] = await db.insert(geniusLeads).values({
      email: data.email.toLowerCase().trim(),
      dentistName: data.dentistName || "Dr.",
      clinicName: data.clinicName,
      city: data.city,
      state: data.state,
      phone: data.phone,
      website: data.website,
      leadId: data.leadId,
      source: data.source || "import",
      currentDay: 0,
      status: "active",
      nextEmailDue: new Date(), // Due immediately for Day 0
    }).returning();

    return { success: true, leadId: lead.id, existing: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    log(`Failed to import lead: ${message}`, "error");
    return { success: false, error: message };
  }
}

/**
 * Bulk import leads into the GENIUS system
 */
export async function bulkImportGeniusLeads(leads: Array<{
  email: string;
  dentistName?: string;
  clinicName?: string;
  city?: string;
  state?: string;
  phone?: string;
  website?: string;
}>): Promise<{
  total: number;
  imported: number;
  duplicates: number;
  failed: number;
  errors: string[];
}> {
  const result = {
    total: leads.length,
    imported: 0,
    duplicates: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const lead of leads) {
    const importResult = await importGeniusLead(lead);
    if (importResult.success) {
      if (importResult.existing) {
        result.duplicates++;
      } else {
        result.imported++;
      }
    } else {
      result.failed++;
      result.errors.push(`${lead.email}: ${importResult.error}`);
    }
  }

  log(`Bulk import complete: ${result.imported} imported, ${result.duplicates} duplicates, ${result.failed} failed`, "success");
  return result;
}

// ============================================================================
// EMAIL SENDING (GENIUS AGENT)
// ============================================================================

/**
 * Get the email template for a specific day
 */
function getTemplate(day: number): EmailTemplate | undefined {
  return EMAIL_TEMPLATES.find(t => t.day === day);
}

/**
 * Send a single email in the sequence
 */
async function sendSequenceEmail(lead: GeniusLead): Promise<{ success: boolean; error?: string }> {
  const template = getTemplate(lead.currentDay);
  if (!template) {
    return { success: false, error: `No template for day ${lead.currentDay}` };
  }

  try {
    const result = await sendEmail({
      to: lead.email,
      subject: template.subject,
      html: template.getHtml(lead.dentistName),
      text: template.getBody(lead.dentistName),
    });

    if (!result.ok) {
      return { success: false, error: result.error };
    }

    // Log the email send
    await db.insert(geniusEmailSends).values({
      geniusLeadId: lead.id,
      day: lead.currentDay,
      subject: template.subject,
      status: "sent",
    });

    // Update lead status
    const nextDay = lead.currentDay + 1;
    const isComplete = nextDay >= GENIUS_CONFIG.SEQUENCE_DAYS;
    
    await db.update(geniusLeads)
      .set({
        currentDay: nextDay,
        lastEmailSentAt: new Date(),
        nextEmailDue: isComplete ? null : new Date(Date.now() + 24 * 60 * 60 * 1000), // +24 hours
        emailsSent: lead.emailsSent + 1,
        status: isComplete ? "completed" : "active",
        updatedAt: new Date(),
      })
      .where(eq(geniusLeads.id, lead.id));

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    log(`Failed to send email to ${lead.email}: ${message}`, "error");
    return { success: false, error: message };
  }
}

// ============================================================================
// SCHEDULER (Main Automation Loop)
// ============================================================================

/**
 * Get current budget status from DB (authoritative source)
 * Returns current counts and whether hard limits are reached
 */
async function getBudgetStatusFromDB(): Promise<{
  emailsSentToday: number;
  emailsSentThisMonth: number;
  estimatedMonthlyCostCents: number;
  dailyPercentUsed: number;
  monthlyPercentUsed: number;
  dailyHardLimitReached: boolean;
  monthlyHardLimitReached: boolean;
  dailyThresholdExceeded: boolean;
  monthlyThresholdExceeded: boolean;
}> {
  const threshold = GENIUS_CONFIG.PAUSE_THRESHOLD_PERCENT / 100; // 0.7 = 70%

  // Get today's date range for daily count from DB
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Count emails sent today from DB (authoritative source)
  const [dailyCount] = await db.select({
    count: sql<number>`count(*)::int`,
  })
    .from(geniusEmailSends)
    .where(and(
      gte(geniusEmailSends.sentAt, todayStart),
      lte(geniusEmailSends.sentAt, todayEnd),
      eq(geniusEmailSends.status, "sent"),
    ));

  const emailsSentToday = dailyCount?.count || 0;

  // Get monthly count from DB
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [monthlyCount] = await db.select({
    count: sql<number>`count(*)::int`,
  })
    .from(geniusEmailSends)
    .where(and(
      gte(geniusEmailSends.sentAt, monthStart),
      eq(geniusEmailSends.status, "sent"),
    ));

  const emailsSentThisMonth = monthlyCount?.count || 0;
  const estimatedMonthlyCostCents = emailsSentThisMonth * GENIUS_CONFIG.EMAIL_COST_CENTS;

  const dailyPercentUsed = emailsSentToday / GENIUS_CONFIG.DAILY_EMAIL_LIMIT;
  const monthlyPercentUsed = estimatedMonthlyCostCents / GENIUS_CONFIG.MONTHLY_EMAIL_BUDGET_CENTS;

  return {
    emailsSentToday,
    emailsSentThisMonth,
    estimatedMonthlyCostCents,
    dailyPercentUsed,
    monthlyPercentUsed,
    dailyHardLimitReached: emailsSentToday >= GENIUS_CONFIG.DAILY_EMAIL_LIMIT,
    monthlyHardLimitReached: estimatedMonthlyCostCents >= GENIUS_CONFIG.MONTHLY_EMAIL_BUDGET_CENTS,
    dailyThresholdExceeded: dailyPercentUsed >= threshold,
    monthlyThresholdExceeded: monthlyPercentUsed >= threshold,
  };
}

/**
 * Check budget thresholds - enforces hard limits and optionally triggers auto-pause
 * Returns { canSend: boolean, reason?: string }
 * @param triggerAutoPause - if true, auto-pauses when 70% threshold exceeded (first crossing only)
 * 
 * LOGIC:
 * - Hard limits (100%) always block sends regardless of pause state
 * - 70% threshold triggers ONE-TIME auto-pause, tracked by thresholdPauseFired flag
 * - After manual resume, thresholdPauseFired remains true so no re-pause occurs
 * - Flag resets when: new day starts OR usage drops below 70% OR engine is stopped
 */
async function checkBudgetThresholds(triggerAutoPause: boolean = true): Promise<{ canSend: boolean; reason?: string }> {
  const budget = await getBudgetStatusFromDB();
  
  // Update in-memory counter to match DB (sync)
  geniusState.emailsSentToday = budget.emailsSentToday;

  // Reset thresholdPauseFired if usage dropped below threshold (allows re-triggering if usage rises again)
  if (!budget.dailyThresholdExceeded && !budget.monthlyThresholdExceeded) {
    geniusState.thresholdPauseFired = false;
  }

  // HARD STOP at 100% - always blocks, no resume possible
  if (budget.dailyHardLimitReached) {
    return { canSend: false, reason: `HARD LIMIT: Daily limit reached ${budget.emailsSentToday}/${GENIUS_CONFIG.DAILY_EMAIL_LIMIT} emails` };
  }

  if (budget.monthlyHardLimitReached) {
    return { canSend: false, reason: `HARD LIMIT: Monthly budget exhausted $${(budget.estimatedMonthlyCostCents / 100).toFixed(2)} of $${(GENIUS_CONFIG.MONTHLY_EMAIL_BUDGET_CENTS / 100).toFixed(2)}` };
  }

  // 70% THRESHOLD - triggers ONE-TIME auto-pause, but manual resume allows sends until 100%
  // Only trigger auto-pause if:
  // 1. triggerAutoPause is true (first check of cycle, not per-send guard)
  // 2. Engine is not already paused
  // 3. thresholdPauseFired is false (haven't auto-paused yet for this threshold crossing)
  
  const shouldAutoPause = triggerAutoPause && !geniusState.isPaused && !geniusState.thresholdPauseFired;
  
  if (budget.dailyThresholdExceeded && shouldAutoPause) {
    geniusState.thresholdPauseFired = true; // Mark as fired so resume works
    pauseGeniusEngine(`Daily budget at ${Math.round(budget.dailyPercentUsed * 100)}% - approaching limit. Resume to continue until 100%.`);
    return { canSend: false, reason: `Daily budget at ${Math.round(budget.dailyPercentUsed * 100)}% - auto-paused at 70% threshold` };
  }

  if (budget.monthlyThresholdExceeded && shouldAutoPause) {
    geniusState.thresholdPauseFired = true; // Mark as fired so resume works
    pauseGeniusEngine(`Monthly budget at ${Math.round(budget.monthlyPercentUsed * 100)}% - approaching limit. Resume to continue until 100%.`);
    return { canSend: false, reason: `Monthly budget at ${Math.round(budget.monthlyPercentUsed * 100)}% - auto-paused at 70% threshold` };
  }

  // If we're above threshold but:
  // - manually resumed (thresholdPauseFired is true, isPaused is false), OR
  // - threshold check disabled (triggerAutoPause is false)
  // Allow sends until hard limit (100%)
  return { canSend: true };
}

/**
 * Run one cycle of the GENIUS automation
 */
export async function runGeniusCycle(): Promise<{
  success: boolean;
  emailsSent: number;
  errors: number;
  message: string;
}> {
  resetDailyCounterIfNeeded();

  // Check if paused
  if (geniusState.isPaused) {
    return {
      success: false,
      emailsSent: 0,
      errors: 0,
      message: `GENIUS paused: ${geniusState.pauseReason}`,
    };
  }

  // Check budget thresholds (from DB - authoritative source)
  const budgetCheck = await checkBudgetThresholds();
  if (!budgetCheck.canSend) {
    log(`Budget check failed: ${budgetCheck.reason}`, "warn");
    return {
      success: false,
      emailsSent: 0,
      errors: 0,
      message: budgetCheck.reason || "Budget limit reached",
    };
  }

  // Calculate remaining emails for today (with buffer for safety)
  const remainingToday = Math.max(0, GENIUS_CONFIG.DAILY_EMAIL_LIMIT - geniusState.emailsSentToday);
  if (remainingToday <= 0) {
    return {
      success: false,
      emailsSent: 0,
      errors: 0,
      message: "Daily email limit reached (1,666/day)",
    };
  }

  // Get leads due for next email
  const now = new Date();
  const leadsToEmail = await db.select()
    .from(geniusLeads)
    .where(and(
      eq(geniusLeads.status, "active"),
      lte(geniusLeads.nextEmailDue, now),
    ))
    .orderBy(geniusLeads.nextEmailDue)
    .limit(Math.min(GENIUS_CONFIG.BATCH_SIZE, remainingToday));

  if (leadsToEmail.length === 0) {
    return {
      success: true,
      emailsSent: 0,
      errors: 0,
      message: "No leads due for email",
    };
  }

  let sent = 0;
  let errors = 0;

  for (const lead of leadsToEmail) {
    // Re-check budget thresholds BEFORE EACH SEND (from DB - authoritative source)
    // This catches mid-cycle hard limit crossings immediately
    // triggerAutoPause=false since:
    // 1. First cycle check already handled auto-pause at 70%
    // 2. After manual resume, we want to allow sends until 100% hard limit
    const perSendBudgetCheck = await checkBudgetThresholds(false);
    if (!perSendBudgetCheck.canSend) {
      // This only triggers when HARD LIMIT (100%) is reached
      log(`HARD LIMIT reached mid-cycle after ${sent} sends: ${perSendBudgetCheck.reason}`, "warn");
      break;
    }

    // Stagger sends slightly for deliverability
    if (sent > 0) {
      await new Promise(resolve => setTimeout(resolve, 200)); // 200ms between emails
    }

    const result = await sendSequenceEmail(lead);
    if (result.success) {
      sent++;
      // geniusState.emailsSentToday is synced from DB on each checkBudgetThresholds() call
      // This keeps the counter accurate even with concurrent sends from other processes
    } else {
      errors++;
      log(`Send failed for ${lead.email}: ${result.error}`, "error");
    }
  }

  geniusState.lastCycleAt = new Date();
  
  log(`Cycle complete: ${sent} sent, ${errors} errors`, sent > 0 ? "success" : "info");

  return {
    success: true,
    emailsSent: sent,
    errors,
    message: `Sent ${sent} emails, ${errors} errors`,
  };
}

// ============================================================================
// ENGINE CONTROL
// ============================================================================

let cycleInterval: NodeJS.Timeout | null = null;

/**
 * Start the GENIUS automation engine
 */
export function startGeniusEngine(intervalMinutes: number = 10): { success: boolean; message: string } {
  if (geniusState.isRunning) {
    return { success: false, message: "GENIUS engine already running" };
  }

  geniusState.isRunning = true;
  geniusState.isPaused = false;
  geniusState.pauseReason = "";

  // Run immediately
  runGeniusCycle();

  // Schedule recurring cycles
  cycleInterval = setInterval(() => {
    runGeniusCycle();
  }, intervalMinutes * 60 * 1000);

  log(`GENIUS engine started (${intervalMinutes}min cycles)`, "success");
  return { success: true, message: `GENIUS engine started with ${intervalMinutes}-minute cycles` };
}

/**
 * Stop the GENIUS automation engine
 */
export function stopGeniusEngine(): { success: boolean; message: string } {
  if (!geniusState.isRunning) {
    return { success: false, message: "GENIUS engine not running" };
  }

  if (cycleInterval) {
    clearInterval(cycleInterval);
    cycleInterval = null;
  }

  geniusState.isRunning = false;
  geniusState.thresholdPauseFired = false; // Reset threshold flag when stopping
  log("GENIUS engine stopped", "warn");
  return { success: true, message: "GENIUS engine stopped" };
}

/**
 * Pause the GENIUS engine (doesn't clear interval, just skips sending)
 */
export function pauseGeniusEngine(reason: string): { success: boolean; message: string } {
  geniusState.isPaused = true;
  geniusState.pauseReason = reason;
  log(`GENIUS engine paused: ${reason}`, "warn");
  return { success: true, message: `GENIUS engine paused: ${reason}` };
}

/**
 * Resume the GENIUS engine
 */
export function resumeGeniusEngine(): { success: boolean; message: string } {
  if (!geniusState.isPaused) {
    return { success: false, message: "GENIUS engine not paused" };
  }

  geniusState.isPaused = false;
  geniusState.pauseReason = "";
  log("GENIUS engine resumed", "success");
  return { success: true, message: "GENIUS engine resumed" };
}

// ============================================================================
// REPORTING
// ============================================================================

/**
 * Get current GENIUS system status
 */
export async function getGeniusStatus(): Promise<{
  isRunning: boolean;
  isPaused: boolean;
  pauseReason: string;
  lastCycleAt: Date | null;
  emailsSentToday: number;
  dailyLimit: number;
  remainingToday: number;
}> {
  resetDailyCounterIfNeeded();
  
  return {
    isRunning: geniusState.isRunning,
    isPaused: geniusState.isPaused,
    pauseReason: geniusState.pauseReason,
    lastCycleAt: geniusState.lastCycleAt,
    emailsSentToday: geniusState.emailsSentToday,
    dailyLimit: GENIUS_CONFIG.DAILY_EMAIL_LIMIT,
    remainingToday: GENIUS_CONFIG.DAILY_EMAIL_LIMIT - geniusState.emailsSentToday,
  };
}

/**
 * Get detailed GENIUS statistics
 */
export async function getGeniusStats(): Promise<{
  leads: {
    total: number;
    active: number;
    completed: number;
    paused: number;
    byDay: Record<number, number>;
  };
  emails: {
    totalSent: number;
    sentToday: number;
    opens: number;
    clicks: number;
    bounces: number;
  };
  budget: {
    emailsSentThisMonth: number;
    estimatedCostCents: number;
    monthlyLimitCents: number;
    percentUsed: number;
  };
}> {
  resetDailyCounterIfNeeded();

  // Get lead stats
  const [leadStats] = await db.select({
    total: sql<number>`count(*)::int`,
    active: sql<number>`count(*) filter (where status = 'active')::int`,
    completed: sql<number>`count(*) filter (where status = 'completed')::int`,
    paused: sql<number>`count(*) filter (where status = 'paused')::int`,
  }).from(geniusLeads);

  // Get leads by day
  const byDayResults = await db.select({
    day: geniusLeads.currentDay,
    count: sql<number>`count(*)::int`,
  })
    .from(geniusLeads)
    .where(eq(geniusLeads.status, "active"))
    .groupBy(geniusLeads.currentDay);

  const byDay: Record<number, number> = {};
  byDayResults.forEach(r => { byDay[r.day] = r.count; });

  // Get email stats
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [emailStats] = await db.select({
    totalSent: sql<number>`count(*)::int`,
    bounces: sql<number>`count(*) filter (where status = 'bounced')::int`,
  }).from(geniusEmailSends);

  const [monthlyEmailCount] = await db.select({
    count: sql<number>`count(*)::int`,
  })
    .from(geniusEmailSends)
    .where(gte(geniusEmailSends.sentAt, monthStart));

  // Get engagement stats from leads
  const [engagement] = await db.select({
    opens: sql<number>`sum(opens)::int`,
    clicks: sql<number>`sum(clicks)::int`,
  }).from(geniusLeads);

  const emailsSentThisMonth = monthlyEmailCount?.count || 0;
  const estimatedCostCents = Math.round(emailsSentThisMonth * GENIUS_CONFIG.EMAIL_COST_CENTS);

  return {
    leads: {
      total: leadStats?.total || 0,
      active: leadStats?.active || 0,
      completed: leadStats?.completed || 0,
      paused: leadStats?.paused || 0,
      byDay,
    },
    emails: {
      totalSent: emailStats?.totalSent || 0,
      sentToday: geniusState.emailsSentToday,
      opens: engagement?.opens || 0,
      clicks: engagement?.clicks || 0,
      bounces: emailStats?.bounces || 0,
    },
    budget: {
      emailsSentThisMonth,
      estimatedCostCents,
      monthlyLimitCents: GENIUS_CONFIG.MONTHLY_EMAIL_BUDGET_CENTS,
      percentUsed: Math.round((estimatedCostCents / GENIUS_CONFIG.MONTHLY_EMAIL_BUDGET_CENTS) * 100),
    },
  };
}

/**
 * Generate daily report
 */
export async function generateDailyReport(): Promise<{
  date: string;
  leads: {
    imported: number;
    total: number;
  };
  emails: {
    sent: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
  };
  demos: {
    booked: number;
  };
  budget: {
    emailCostCents: number;
    percentOfMonthlyLimit: number;
  };
  alerts: string[];
}> {
  const stats = await getGeniusStats();
  const status = await getGeniusStatus();

  const alerts: string[] = [];

  // Check thresholds
  if (stats.budget.percentUsed >= GENIUS_CONFIG.PAUSE_THRESHOLD_PERCENT) {
    alerts.push(`⚠️ Email budget at ${stats.budget.percentUsed}% - approaching monthly limit`);
  }

  const bounceRate = stats.emails.totalSent > 0 
    ? (stats.emails.bounces / stats.emails.totalSent) * 100 
    : 0;
  if (bounceRate > 5) {
    alerts.push(`⚠️ Bounce rate ${bounceRate.toFixed(1)}% exceeds 5% threshold`);
  }

  // Get demo bookings count
  const [demoStats] = await db.select({
    booked: sql<number>`count(*) filter (where demo_booked = true)::int`,
  }).from(geniusLeads);

  return {
    date: new Date().toISOString().split("T")[0],
    leads: {
      imported: stats.leads.total - stats.leads.completed,
      total: stats.leads.total,
    },
    emails: {
      sent: status.emailsSentToday,
      openRate: stats.emails.totalSent > 0 ? (stats.emails.opens / stats.emails.totalSent) * 100 : 0,
      clickRate: stats.emails.totalSent > 0 ? (stats.emails.clicks / stats.emails.totalSent) * 100 : 0,
      bounceRate,
    },
    demos: {
      booked: demoStats?.booked || 0,
    },
    budget: {
      emailCostCents: stats.budget.estimatedCostCents,
      percentOfMonthlyLimit: stats.budget.percentUsed,
    },
    alerts,
  };
}
