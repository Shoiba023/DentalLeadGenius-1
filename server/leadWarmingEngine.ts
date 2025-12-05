/**
 * LEAD WARMING ENGINE
 * ====================
 * 
 * 4-Step automated warming sequence for non-responsive leads:
 * 
 * Day 1 → Soft intro (friendly, low-pressure)
 * Day 2 → Proof/results message (show value)
 * Day 3 → Pain-point message (create urgency)
 * Day 4 → Demo booking push (direct CTA)
 * 
 * If lead replies at ANY point → Switch to 9-step sales conversation
 */

import { db } from "./db";
import { geniusLeads, geniusEmailSends } from "@shared/schema";
import { eq, and, lt, isNull, gte, lte, sql } from "drizzle-orm";
import { sendEmail } from "./email";
import { SITE_NAME, SUPPORT_EMAIL } from "@shared/config";
import { getPaymentLinkForPlan } from "./stripeProducts";

// ============================================================================
// WARMING SEQUENCE CONFIGURATION
// ============================================================================

const WARMING_CONFIG = {
  SEQUENCE_DAYS: 4,
  CHECK_INTERVAL_MS: 5 * 60 * 1000, // Check every 5 minutes
  DEMO_LINK: "https://DentalLeadGenius.com/demo",
};

// High-converting subject lines for warming sequence
const WARMING_SUBJECTS = {
  DAY_1: [
    "Quick question about your dental clinic (saw something important)",
    "Hey, quick thought about your clinic",
    "Noticed something about your practice",
  ],
  DAY_2: [
    "We noticed you might be losing 7–12 new patients weekly…",
    "How clinics like yours add 40+ patients/month",
    "The #1 reason dental patients don't book",
  ],
  DAY_3: [
    "Your competitor is using AI — are you?",
    "What 3 nearby clinics are doing differently",
    "The hidden cost of missed calls at your clinic",
  ],
  DAY_4: [
    "1-minute improvement for your clinic's patient flow",
    "Last chance to see what we found",
    "Quick demo - see your clinic's potential",
  ],
};

// ============================================================================
// WARMING EMAIL TEMPLATES
// ============================================================================

interface WarmingTemplate {
  day: number;
  type: string;
  getSubject: () => string;
  getBody: (dentistName: string) => string;
  getHtml: (dentistName: string) => string;
}

const WARMING_TEMPLATES: WarmingTemplate[] = [
  // DAY 1 - Soft Intro (friendly, low-pressure)
  {
    day: 1,
    type: "soft_intro",
    getSubject: () => WARMING_SUBJECTS.DAY_1[Math.floor(Math.random() * WARMING_SUBJECTS.DAY_1.length)],
    getBody: (dentistName: string) => `
Hi ${dentistName},

I was looking at dental clinics in your area and noticed something interesting about yours.

I work with dental practices to help them capture more patients - especially the ones who call after hours or get put on hold.

Mind if I share what I found? No pressure at all.

Best,
The ${SITE_NAME} Team

P.S. Just a 2-minute read, I promise.
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
    <p style="margin: 0 0 16px;">I was looking at dental clinics in your area and noticed something interesting about yours.</p>
    <p style="margin: 0 0 16px;">I work with dental practices to help them capture more patients - especially the ones who call after hours or get put on hold.</p>
    <p style="margin: 0 0 24px;">Mind if I share what I found? No pressure at all.</p>
    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px;">
      Best,<br>The ${SITE_NAME} Team
    </p>
    <p style="margin: 16px 0 0; font-size: 13px; color: #9ca3af; font-style: italic;">
      P.S. Just a 2-minute read, I promise.
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
      <a href="${WARMING_CONFIG.DEMO_LINK}?unsubscribe=true" style="color: #9ca3af;">Unsubscribe</a> | 
      ${SITE_NAME} | ${SUPPORT_EMAIL}
    </p>
  </div>
</body>
</html>
    `.trim(),
  },

  // DAY 2 - Proof/Results Message
  {
    day: 2,
    type: "proof_results",
    getSubject: () => WARMING_SUBJECTS.DAY_2[Math.floor(Math.random() * WARMING_SUBJECTS.DAY_2.length)],
    getBody: (dentistName: string) => `
Hi ${dentistName},

Quick follow-up with some numbers that might interest you:

• One clinic we work with booked 17 new patients in their first week
• Another reduced missed calls by 82%
• Average ROI: 5-7x within 60 days

These aren't giant corporate practices - they're clinics just like yours.

The difference? They have an AI that answers calls, chats with patients, and books appointments 24/7.

Would you like to see how it works?

Demo: ${WARMING_CONFIG.DEMO_LINK}

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
    <p style="margin: 0 0 16px;">Quick follow-up with some numbers that might interest you:</p>
    <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 0 0 16px; border-radius: 4px;">
      <p style="margin: 0 0 8px;">• One clinic booked <strong>17 new patients</strong> in their first week</p>
      <p style="margin: 0 0 8px;">• Another reduced missed calls by <strong>82%</strong></p>
      <p style="margin: 0;">• Average ROI: <strong>5-7x within 60 days</strong></p>
    </div>
    <p style="margin: 0 0 16px;">These aren't giant corporate practices - they're clinics just like yours.</p>
    <p style="margin: 0 0 24px;">The difference? They have an AI that answers calls, chats with patients, and books appointments 24/7.</p>
    <p style="margin: 0 0 24px;">
      <a href="${WARMING_CONFIG.DEMO_LINK}" style="display: inline-block; background: #18181b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        See How It Works
      </a>
    </p>
    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px;">
      Best,<br>The ${SITE_NAME} Team
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
      <a href="${WARMING_CONFIG.DEMO_LINK}?unsubscribe=true" style="color: #9ca3af;">Unsubscribe</a> | 
      ${SITE_NAME} | ${SUPPORT_EMAIL}
    </p>
  </div>
</body>
</html>
    `.trim(),
  },

  // DAY 3 - Pain Point Message
  {
    day: 3,
    type: "pain_point",
    getSubject: () => WARMING_SUBJECTS.DAY_3[Math.floor(Math.random() * WARMING_SUBJECTS.DAY_3.length)],
    getBody: (dentistName: string) => `
Hi ${dentistName},

I'll be direct: Your competitors are already using AI.

Right now, while you're reading this:
• 20-40% of your calls go unanswered
• Each missed call = $300-600 in lost revenue
• Patients who can't reach you book with someone else

The clinics winning right now aren't the biggest - they're the fastest to respond.

Our AI responds in seconds, 24/7. No breaks, no sick days, no hold times.

Your competitors figured this out. When will you?

Demo: ${WARMING_CONFIG.DEMO_LINK}

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
    <p style="margin: 0 0 16px;"><strong>I'll be direct: Your competitors are already using AI.</strong></p>
    <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 0 0 16px; border-radius: 4px;">
      <p style="margin: 0; font-weight: 600; color: #dc2626;">Right now, while you're reading this:</p>
      <p style="margin: 8px 0 0;">• 20-40% of your calls go unanswered</p>
      <p style="margin: 4px 0 0;">• Each missed call = <strong>$300-600 lost</strong></p>
      <p style="margin: 4px 0 0;">• Patients who can't reach you book with someone else</p>
    </div>
    <p style="margin: 0 0 16px;">The clinics winning right now aren't the biggest - they're the <strong>fastest to respond</strong>.</p>
    <p style="margin: 0 0 24px;">Our AI responds in seconds, 24/7. No breaks, no sick days, no hold times.</p>
    <p style="margin: 0 0 24px;">
      <a href="${WARMING_CONFIG.DEMO_LINK}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        See What You're Missing
      </a>
    </p>
    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px;">
      Best,<br>The ${SITE_NAME} Team
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
      <a href="${WARMING_CONFIG.DEMO_LINK}?unsubscribe=true" style="color: #9ca3af;">Unsubscribe</a> | 
      ${SITE_NAME} | ${SUPPORT_EMAIL}
    </p>
  </div>
</body>
</html>
    `.trim(),
  },

  // DAY 4 - Demo Booking Push
  {
    day: 4,
    type: "demo_push",
    getSubject: () => WARMING_SUBJECTS.DAY_4[Math.floor(Math.random() * WARMING_SUBJECTS.DAY_4.length)],
    getBody: (dentistName: string) => `
Hi ${dentistName},

This is my last email to you.

I've shared the data. I've shown you what's possible. The next move is yours.

In 60 seconds, you can:
1. Click the demo link below
2. See exactly how it works for YOUR clinic
3. Decide if it's worth 5 minutes of your time

If not - no hard feelings. I'll stop emailing.

But if you're losing even ONE patient per week to slow response times, that's $52,000/year walking out the door.

Your call.

→ ${WARMING_CONFIG.DEMO_LINK}

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
    <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 12px 16px; margin: 0 0 20px; border-radius: 6px; text-align: center;">
      <p style="margin: 0; font-weight: 600; color: #92400e;">Final Message</p>
    </div>
    <p style="margin: 0 0 16px;">Hi ${dentistName},</p>
    <p style="margin: 0 0 16px;">This is my last email to you.</p>
    <p style="margin: 0 0 16px;">I've shared the data. I've shown you what's possible. The next move is yours.</p>
    <div style="background: #f9fafb; padding: 16px; margin: 0 0 16px; border-radius: 6px;">
      <p style="margin: 0 0 8px; font-weight: 600;">In 60 seconds, you can:</p>
      <p style="margin: 0 0 4px;">1. Click the demo link below</p>
      <p style="margin: 0 0 4px;">2. See exactly how it works for YOUR clinic</p>
      <p style="margin: 0;">3. Decide if it's worth 5 minutes of your time</p>
    </div>
    <p style="margin: 0 0 16px;">If not - no hard feelings. I'll stop emailing.</p>
    <p style="margin: 0 0 24px;">But if you're losing even <strong>ONE patient per week</strong> to slow response times, that's <span style="color: #dc2626; font-weight: 600;">$52,000/year</span> walking out the door.</p>
    <p style="margin: 0 0 8px; font-size: 18px; font-weight: 600;">Your call.</p>
    <p style="margin: 0 0 24px;">
      <a href="${WARMING_CONFIG.DEMO_LINK}" style="display: inline-block; background: #18181b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Book Your Demo Now
      </a>
    </p>
    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px;">
      Best,<br>The ${SITE_NAME} Team
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
      <a href="${WARMING_CONFIG.DEMO_LINK}?unsubscribe=true" style="color: #9ca3af;">Unsubscribe</a> | 
      ${SITE_NAME} | ${SUPPORT_EMAIL}
    </p>
  </div>
</body>
</html>
    `.trim(),
  },
];

// ============================================================================
// WARMING ENGINE STATE
// ============================================================================

let warmingInterval: NodeJS.Timeout | null = null;
let isWarmingActive = false;
let warmingStats = {
  leadsWarmed: 0,
  emailsSent: 0,
  replies: 0,
  conversions: 0,
  lastCycleAt: null as Date | null,
};

function log(message: string) {
  console.log(`[WARMING] ${message}`);
}

// ============================================================================
// CORE WARMING FUNCTIONS
// ============================================================================

/**
 * Get leads eligible for warming sequence
 * - Not replied
 * - Active status
 * - Imported more than 1 day ago
 * - Haven't completed warming sequence (currentDay < 4)
 */
async function getLeadsForWarming(): Promise<any[]> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const leads = await db.select()
    .from(geniusLeads)
    .where(
      and(
        eq(geniusLeads.status, 'active'),
        eq(geniusLeads.replied, false),
        lt(geniusLeads.importedAt, oneDayAgo),
        sql`${geniusLeads.currentDay} < 4`
      )
    )
    .limit(50);

  return leads;
}

/**
 * Send warming email to a lead
 */
async function sendWarmingEmail(lead: any, warmingDay: number): Promise<boolean> {
  const template = WARMING_TEMPLATES.find(t => t.day === warmingDay);
  if (!template) {
    log(`No template for warming day ${warmingDay}`);
    return false;
  }

  const dentistName = lead.dentistName || lead.clinicName?.split(' ')[0] || 'there';
  const subject = template.getSubject();
  const body = template.getBody(dentistName);
  const html = template.getHtml(dentistName);

  try {
    const result = await sendEmail({
      to: lead.email,
      subject,
      text: body,
      html,
    });

    if (result.ok) {
      // Update lead current day
      await db.update(geniusLeads)
        .set({
          currentDay: warmingDay,
          lastEmailSentAt: new Date(),
          emailsSent: sql`${geniusLeads.emailsSent} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(geniusLeads.id, lead.id));

      // Record email send
      await db.insert(geniusEmailSends).values({
        geniusLeadId: lead.id,
        day: warmingDay,
        subject,
        sentAt: new Date(),
        variantId: 1,
        sendWindow: 'morning',
        delivered: true,
      });

      log(`Sent warming day ${warmingDay} to ${lead.email}`);
      warmingStats.emailsSent++;
      return true;
    }

    return false;
  } catch (error) {
    log(`Error sending warming email: ${error}`);
    return false;
  }
}

/**
 * Check if lead should switch to 9-step sales sequence
 */
async function checkForRepliesAndSwitch(): Promise<number> {
  // Find leads who have replied (their repliedAt is set)
  const repliedLeads = await db.select()
    .from(geniusLeads)
    .where(
      and(
        sql`${geniusLeads.repliedAt} IS NOT NULL`,
        sql`COALESCE(${geniusLeads.warmingDay}, 0) < 5`,
        eq(geniusLeads.status, 'enrolled')
      )
    )
    .limit(50);

  let switched = 0;
  for (const lead of repliedLeads) {
    // Switch to main 9-step sales sequence
    await db.update(geniusLeads)
      .set({
        warmingDay: 5, // Mark warming as complete
        sequenceDay: 0, // Start main sequence
        status: 'warm',
        updatedAt: new Date(),
      })
      .where(eq(geniusLeads.id, lead.id));

    log(`Switched ${lead.email} to 9-step sales sequence (replied)`);
    warmingStats.replies++;
    switched++;
  }

  return switched;
}

/**
 * Run one warming cycle
 */
async function runWarmingCycle(): Promise<void> {
  log("Running warming cycle...");

  try {
    // First, check for replies and switch those leads
    const switched = await checkForRepliesAndSwitch();
    if (switched > 0) {
      log(`Switched ${switched} leads to sales sequence`);
    }

    // Get leads eligible for warming
    const leads = await getLeadsForWarming();
    log(`Found ${leads.length} leads for warming`);

    let sent = 0;
    for (const lead of leads) {
      const currentWarmingDay = lead.warmingDay || 0;
      const lastEmailAt = lead.lastWarmingEmailAt ? new Date(lead.lastWarmingEmailAt) : null;

      // Check if enough time has passed (24 hours between emails)
      if (lastEmailAt) {
        const hoursSinceLastEmail = (Date.now() - lastEmailAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastEmail < 24) {
          continue; // Skip, not enough time passed
        }
      }

      // Determine next warming day
      const nextWarmingDay = currentWarmingDay + 1;
      if (nextWarmingDay > 4) {
        // Warming sequence complete, move to main sequence
        await db.update(geniusLeads)
          .set({
            warmingDay: 5,
            sequenceDay: 0,
            status: 'contacted',
            updatedAt: new Date(),
          })
          .where(eq(geniusLeads.id, lead.id));
        log(`Warming complete for ${lead.email}, starting main sequence`);
        continue;
      }

      // Send warming email
      const success = await sendWarmingEmail(lead, nextWarmingDay);
      if (success) {
        sent++;
        warmingStats.leadsWarmed++;
      }

      // Rate limit
      if (sent >= 10) break; // Max 10 per cycle
    }

    warmingStats.lastCycleAt = new Date();
    log(`Warming cycle complete: ${sent} emails sent`);
  } catch (error) {
    log(`Warming cycle error: ${error}`);
  }
}

// ============================================================================
// ENGINE CONTROL
// ============================================================================

export function startWarmingEngine(): void {
  if (isWarmingActive) {
    log("Warming engine already active");
    return;
  }

  log("Starting Lead Warming Engine...");
  isWarmingActive = true;

  // Run immediately
  runWarmingCycle();

  // Schedule recurring cycles
  warmingInterval = setInterval(runWarmingCycle, WARMING_CONFIG.CHECK_INTERVAL_MS);

  log("Lead Warming Engine ACTIVE");
  log("4-step sequence: Soft Intro → Proof → Pain Point → Demo Push");
}

export function stopWarmingEngine(): void {
  if (!isWarmingActive) return;

  if (warmingInterval) {
    clearInterval(warmingInterval);
    warmingInterval = null;
  }

  isWarmingActive = false;
  log("Warming Engine stopped");
}

export function getWarmingStatus(): {
  isActive: boolean;
  stats: typeof warmingStats;
} {
  return {
    isActive: isWarmingActive,
    stats: warmingStats,
  };
}

export { WARMING_SUBJECTS, WARMING_TEMPLATES };
