/**
 * GENIUS PHASE-2 OPTIMIZATION ENGINE
 * ===================================
 * 
 * Advanced optimization system for maximizing conversions:
 * 1. Lead Scoring (1-10)
 * 2. Send-Time AI Optimization (3 windows: 8AM, 11:30AM, 4PM)
 * 3. Template Rotation (7 variations per day)
 * 4. Hot/Dead Lead Detection
 * 5. Response Handling
 * 6. Demo Auto-Booking
 * 7. Daily Performance Optimization Loop
 */

import { db } from "./db";
import { 
  geniusLeads, 
  geniusEmailSends, 
  geniusTemplateVariants, 
  geniusSendWindows, 
  geniusDomainHealth,
  geniusResponseQueue,
  geniusDailyStats 
} from "@shared/schema";
import { eq, and, gte, lte, desc, asc, isNull, or, sql, lt } from "drizzle-orm";

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEMO_LINK = "https://DentalLeadGenius.com/demo";

const CLINIC_TYPE_SCORES: Record<string, number> = {
  "multi-location": 10,
  "cosmetic": 9,
  "implant": 9,
  "orthodontic": 8,
  "pediatric": 7,
  "general": 5,
  "unknown": 4,
};

const WEALTH_TIER_SCORES: Record<string, number> = {
  "high": 3,
  "medium": 2,
  "low": 1,
};

const SEND_WINDOWS = [
  { label: "morning", baseTime: "08:00", spreadMinutes: 15 },
  { label: "midday", baseTime: "11:30", spreadMinutes: 15 },
  { label: "afternoon", baseTime: "16:00", spreadMinutes: 15 },
];

const TIMEZONE_CLUSTERS = [
  { name: "US-East", timezones: ["America/New_York", "America/Detroit", "America/Toronto"] },
  { name: "US-Central", timezones: ["America/Chicago", "America/Denver"] },
  { name: "US-Pacific", timezones: ["America/Los_Angeles", "America/Phoenix"] },
  { name: "Default", timezones: [] }, // Fallback
];

// ============================================================================
// LEAD SCORING ENGINE
// ============================================================================

export interface LeadScoringInput {
  clinicType?: string;
  reviewRating?: string;
  reviewCount?: number;
  websiteQuality?: number;
  wealthTier?: string;
  socialPresence?: boolean;
  yearsInBusiness?: number;
  techAdoptionScore?: number;
}

/**
 * Calculate lead score from 1-10 based on multiple factors
 */
export function calculateLeadScore(input: LeadScoringInput): {
  score: number;
  segment: string;
  breakdown: Record<string, number>;
} {
  const breakdown: Record<string, number> = {};
  let totalScore = 0;
  let maxPossible = 0;

  // Clinic Type (0-3 points, weighted heavily)
  const clinicTypeScore = CLINIC_TYPE_SCORES[input.clinicType || "unknown"] || 4;
  breakdown.clinicType = Math.round((clinicTypeScore / 10) * 3);
  totalScore += breakdown.clinicType;
  maxPossible += 3;

  // Review Rating (0-2 points)
  const rating = parseFloat(input.reviewRating || "0");
  if (rating >= 4.5) breakdown.reviewRating = 2;
  else if (rating >= 4.0) breakdown.reviewRating = 1.5;
  else if (rating >= 3.5) breakdown.reviewRating = 1;
  else breakdown.reviewRating = 0;
  totalScore += breakdown.reviewRating;
  maxPossible += 2;

  // Review Count (0-1.5 points)
  const reviewCount = input.reviewCount || 0;
  if (reviewCount >= 100) breakdown.reviewCount = 1.5;
  else if (reviewCount >= 50) breakdown.reviewCount = 1;
  else if (reviewCount >= 20) breakdown.reviewCount = 0.5;
  else breakdown.reviewCount = 0;
  totalScore += breakdown.reviewCount;
  maxPossible += 1.5;

  // Website Quality (0-1 points)
  const webQuality = input.websiteQuality || 5;
  breakdown.websiteQuality = (webQuality / 10);
  totalScore += breakdown.websiteQuality;
  maxPossible += 1;

  // Wealth Tier (0-1 points)
  const wealthScore = WEALTH_TIER_SCORES[input.wealthTier || "medium"] || 2;
  breakdown.wealthTier = wealthScore / 3;
  totalScore += breakdown.wealthTier;
  maxPossible += 1;

  // Social Presence (0-0.5 points)
  breakdown.socialPresence = input.socialPresence ? 0.5 : 0;
  totalScore += breakdown.socialPresence;
  maxPossible += 0.5;

  // Tech Adoption Score (0-1 points)
  const techScore = input.techAdoptionScore || 5;
  breakdown.techAdoption = techScore / 10;
  totalScore += breakdown.techAdoption;
  maxPossible += 1;

  // Normalize to 1-10 scale
  const normalizedScore = Math.round((totalScore / maxPossible) * 9) + 1;
  const finalScore = Math.max(1, Math.min(10, normalizedScore));

  // Determine segment
  let segment = "standard";
  if (finalScore >= 8) segment = "premium";
  else if (finalScore >= 6) segment = "high";
  else if (finalScore <= 3) segment = "low";

  return { score: finalScore, segment, breakdown };
}

/**
 * Score a lead and update in database
 */
export async function scoreAndUpdateLead(leadId: string): Promise<{ score: number; segment: string }> {
  const [lead] = await db.select().from(geniusLeads).where(eq(geniusLeads.id, leadId)).limit(1);
  
  if (!lead) {
    throw new Error(`Lead not found: ${leadId}`);
  }

  const result = calculateLeadScore({
    clinicType: lead.clinicType || undefined,
    reviewRating: lead.reviewRating || undefined,
    reviewCount: lead.reviewCount || 0,
    websiteQuality: lead.websiteQuality || 5,
    wealthTier: lead.wealthTier || "medium",
    socialPresence: lead.socialPresence || false,
    yearsInBusiness: lead.yearsInBusiness || undefined,
    techAdoptionScore: lead.techAdoptionScore || 5,
  });

  await db.update(geniusLeads).set({
    leadScore: result.score,
    prioritySegment: result.segment,
    updatedAt: new Date(),
  }).where(eq(geniusLeads.id, leadId));

  return result;
}

/**
 * Batch re-score all active leads
 */
export async function rescoreAllLeads(): Promise<{ rescored: number }> {
  const leads = await db.select().from(geniusLeads).where(eq(geniusLeads.status, "active"));
  
  let rescored = 0;
  for (const lead of leads) {
    try {
      await scoreAndUpdateLead(lead.id);
      rescored++;
    } catch (error) {
      console.error(`[GENIUS] Failed to rescore lead ${lead.id}:`, error);
    }
  }

  return { rescored };
}

// ============================================================================
// SEND-TIME AI OPTIMIZATION
// ============================================================================

/**
 * Get timezone cluster for a given timezone
 */
export function getTimezoneCluster(timezone: string): string {
  for (const cluster of TIMEZONE_CLUSTERS) {
    if (cluster.timezones.includes(timezone)) {
      return cluster.name;
    }
  }
  return "US-East"; // Default
}

/**
 * Calculate optimal send time with randomization
 */
export function calculateSendTime(
  timezone: string,
  preferredWindow?: string
): { window: string; localTime: string; utcTime: Date } {
  const cluster = getTimezoneCluster(timezone);
  
  // Determine which window to use (rotate or use learned preference)
  const windows = SEND_WINDOWS;
  let selectedWindow = windows[0];
  
  if (preferredWindow) {
    const found = windows.find(w => w.label === preferredWindow);
    if (found) selectedWindow = found;
  } else {
    // Rotate based on current hour to spread load
    const hour = new Date().getUTCHours();
    if (hour < 14) selectedWindow = windows[0]; // morning
    else if (hour < 18) selectedWindow = windows[1]; // midday
    else selectedWindow = windows[2]; // afternoon
  }

  // Add ±15 min randomization
  const spreadMs = selectedWindow.spreadMinutes * 60 * 1000;
  const randomOffset = Math.floor(Math.random() * spreadMs * 2) - spreadMs;
  
  // Parse base time
  const [hours, minutes] = selectedWindow.baseTime.split(":").map(Number);
  const now = new Date();
  const sendTime = new Date(now);
  sendTime.setHours(hours, minutes, 0, 0);
  sendTime.setTime(sendTime.getTime() + randomOffset);
  
  const localTime = `${String(sendTime.getHours()).padStart(2, "0")}:${String(sendTime.getMinutes()).padStart(2, "0")}`;

  return {
    window: selectedWindow.label,
    localTime,
    utcTime: sendTime,
  };
}

/**
 * Initialize default send windows in database
 */
export async function initializeSendWindows(): Promise<void> {
  for (const cluster of TIMEZONE_CLUSTERS) {
    for (const window of SEND_WINDOWS) {
      const existing = await db.select().from(geniusSendWindows)
        .where(and(
          eq(geniusSendWindows.timezoneCluster, cluster.name),
          eq(geniusSendWindows.windowLabel, window.label)
        )).limit(1);
      
      if (existing.length === 0) {
        await db.insert(geniusSendWindows).values({
          timezoneCluster: cluster.name,
          windowLabel: window.label,
          baseTimeLocal: window.baseTime,
          spreadMinutes: window.spreadMinutes,
        });
      }
    }
  }
}

// ============================================================================
// TEMPLATE VARIATIONS (7 per day)
// ============================================================================

const DAY_TEMPLATES: Record<number, { subjects: string[]; bodies: string[] }> = {
  0: {
    subjects: [
      "Quick question about your practice, {{dentistName}}",
      "{{clinicName}} - are you losing patients without knowing?",
      "30-50 patients may be slipping away monthly...",
      "Important: Your front desk might be costing you patients",
      "{{dentistName}}, a 2-min read that could change everything",
      "How 1 small change adds $8K/month to dental practices",
      "The hidden leak in your patient pipeline",
    ],
    bodies: [
      `Hi {{dentistName}},

Quick thought: Studies show dental practices lose 30-50 potential patients monthly from missed calls alone.

What if you could capture every single one?

Our AI receptionist never sleeps, never misses a call, and books appointments 24/7.

Worth a quick look? {{demoLink}}

Best,
DentalLeadGenius`,
      `{{dentistName}},

I'll keep this short:

Every missed call = a patient choosing your competitor.

Our AI receptionist answers every call, handles insurance questions, and books appointments—even at 2 AM.

See how it works: {{demoLink}}

To your success,
DentalLeadGenius`,
      `Hi {{dentistName}},

Here's a number that matters: 30-50 missed patient opportunities per month.

That's the average for practices without 24/7 phone coverage.

What if you never missed another one?

Take 3 minutes to see how: {{demoLink}}

Best,
DentalLeadGenius`,
      `{{dentistName}},

One question:

When your phones ring after hours, who answers?

If the answer is "voicemail"—you're losing patients to practices that answer.

Fix it in 3 minutes: {{demoLink}}

DentalLeadGenius`,
      `Hi {{dentistName}},

Imagine never losing a patient to a missed call again.

No more "sorry, we were closed" moments.
No more competitors getting YOUR patients.

Just 24/7 booking, insurance verification, and patient care.

See the difference: {{demoLink}}

Best regards,
DentalLeadGenius`,
      `{{dentistName}},

What's your missed call rate? For most practices, it's 30-50 per month.

Each one is $300-$500 in lost revenue. Do the math.

Our AI receptionist changes that equation completely.

3 minutes to understand how: {{demoLink}}

DentalLeadGenius`,
      `Hi {{dentistName}},

The hardest patients to win back? The ones who never got through.

They called. You missed it. They went elsewhere.

What if that never happened again?

{{demoLink}}

Best,
DentalLeadGenius`,
    ],
  },
  1: {
    subjects: [
      "Your AI receptionist is ready, {{dentistName}}",
      "24/7 booking + insurance handling = more patients",
      "{{clinicName}}: Never miss another patient call",
      "The receptionist that never calls in sick",
      "{{dentistName}}, your after-hours solution is here",
      "How top practices handle 100% of calls",
      "Your patients deserve 24/7 availability",
    ],
    bodies: [
      `Hi {{dentistName}},

Here's what our AI receptionist does for practices like {{clinicName}}:

✓ Answers every call—24/7/365
✓ Books appointments directly into your calendar
✓ Handles insurance verification questions
✓ Speaks naturally (patients can't tell the difference)
✓ Costs less than a part-time hire

The result? Zero missed opportunities.

See it in action: {{demoLink}}

Best,
DentalLeadGenius`,
      `{{dentistName}},

Your front desk is amazing. But they can't be everywhere.

What happens when they're:
- On another call?
- At lunch?
- Off for the day?

Your patients go elsewhere.

Our AI receptionist fills every gap: {{demoLink}}

DentalLeadGenius`,
      `Hi {{dentistName}},

Meet your new team member:

Works 24/7 ✓
Never needs time off ✓
Handles insurance questions ✓
Books appointments perfectly ✓
Costs less than you'd expect ✓

{{demoLink}}

Best,
DentalLeadGenius`,
      `{{dentistName}},

What if your receptionist could clone themselves?

Same friendly service. Same professionalism.
But available every second of every day.

That's exactly what our AI delivers.

3 minutes to see how: {{demoLink}}

DentalLeadGenius`,
      `Hi {{dentistName}},

The top practices share one thing: they never miss a call.

Not at 8 AM before you open.
Not during the lunch rush.
Not at 9 PM when emergencies happen.

How? AI receptionists.

Your turn: {{demoLink}}

Best,
DentalLeadGenius`,
      `{{dentistName}},

Your patients call when it's convenient for THEM. Not you.

Early morning. Late night. Weekends.

If you're not answering, they're booking elsewhere.

The fix takes 3 minutes: {{demoLink}}

DentalLeadGenius`,
      `Hi {{dentistName}},

Picture this: It's 9 PM. A patient has an emergency.

Option A: Voicemail → they call another practice
Option B: AI answers → they book with YOU

Which option grows your practice?

{{demoLink}}

Best,
DentalLeadGenius`,
    ],
  },
  2: {
    subjects: [
      "The $300-$600 you lose daily without realizing",
      "{{dentistName}}, the numbers don't lie...",
      "Missed calls = missed revenue (the math inside)",
      "{{clinicName}}: This might sting a little",
      "The expensive mistake most practices make",
      "Are you leaving $9K on the table monthly?",
      "{{dentistName}}, let's talk about your phone",
    ],
    bodies: [
      `Hi {{dentistName}},

Let me share some uncomfortable math:

Average missed calls per practice: 5/day
Average patient value: $300-$500
Daily lost revenue: $1,500-$2,500
Monthly: $30,000-$50,000

Even capturing HALF of those calls means an extra $15-25K monthly.

See how practices are fixing this: {{demoLink}}

Best,
DentalLeadGenius`,
      `{{dentistName}},

Every missed call has a dollar amount attached.

$300 for a cleaning
$500 for a crown
$2,000+ for implants

How many calls slip through daily?

3? 5? 10?

Multiply that by 22 work days. That's your leak.

Plug it here: {{demoLink}}

DentalLeadGenius`,
      `Hi {{dentistName}},

I'll be direct:

Your front desk is probably costing you $300-$600 per day in missed opportunities.

Not because they're bad—they're human. They can only handle one call at a time.

What about the other callers?

{{demoLink}}

Best,
DentalLeadGenius`,
      `{{dentistName}},

Here's a question that might hurt:

How many times this week did a patient call and get voicemail?

Each one? That's $300-$500 walking away.

There's a better way: {{demoLink}}

DentalLeadGenius`,
      `Hi {{dentistName}},

The average dental practice loses:
• 5+ calls per day to voicemail or busy signals
• $300-$500 per missed patient opportunity
• $6,500+ monthly in preventable losses

The solution isn't hiring more staff.

It's smarter technology: {{demoLink}}

Best,
DentalLeadGenius`,
      `{{dentistName}},

I'm not going to sugarcoat this:

Missed calls are killing your growth.

Every ring that goes to voicemail is revenue going to your competitor down the street.

Ready to stop the bleeding? {{demoLink}}

DentalLeadGenius`,
      `Hi {{dentistName}},

Quick reality check:

You spend thousands on marketing to make the phone ring.

Then miss 20-30% of those calls?

That's paying to send patients to competitors.

Fix the leak: {{demoLink}}

Best,
DentalLeadGenius`,
    ],
  },
  3: {
    subjects: [
      "How Dr. Peterson added $14,200/month to her practice",
      "Case study: From missed calls to $170K/year increase",
      "{{dentistName}}, this practice was like yours...",
      "Real results from a practice in {{state}}",
      "The transformation that took 3 minutes to start",
      "{{clinicName}}: See what's possible",
      "From struggling with calls to thriving",
    ],
    bodies: [
      `Hi {{dentistName}},

Dr. Sarah Peterson was skeptical too.

Her practice in Phoenix was "doing fine." But she was losing 40+ calls monthly.

After adding our AI receptionist:
• First month: 127 additional appointments booked
• Revenue increase: $14,200
• ROI: 47x

Her words: "I didn't realize how much we were leaving on the table."

See her full story: {{demoLink}}

Best,
DentalLeadGenius`,
      `{{dentistName}},

Case Study: Bright Smile Dental (practice similar to {{clinicName}})

BEFORE:
- 35 missed calls/week
- Overwhelmed front desk
- Lost patients to competitors

AFTER (3 months):
- Zero missed calls
- Front desk focused on in-office patients
- $18K monthly revenue increase

What changed? 3 minutes to find out: {{demoLink}}

DentalLeadGenius`,
      `Hi {{dentistName}},

Want to see real numbers?

Practice: Family Dental Care, Texas
Problem: Missing 45% of after-hours calls

Solution: AI receptionist

Results:
✓ 100% calls answered
✓ 89 new patients in month 1
✓ $12,400 additional revenue
✓ Staff morale improved

Your practice could be next: {{demoLink}}

Best,
DentalLeadGenius`,
      `{{dentistName}},

Meet Dr. James Mitchell.

6 months ago, he thought AI was "too complicated" for his practice.

Today? He's added $170,000 in annual revenue.

All because his phone never goes unanswered.

The same opportunity is waiting for {{clinicName}}: {{demoLink}}

DentalLeadGenius`,
      `Hi {{dentistName}},

I could tell you our AI works. But here's proof:

"We captured 142 appointments in month one that would have gone to voicemail. That's $42K in revenue we were throwing away before."
— Dr. Amanda Chen, Chicago

Ready to capture YOUR missed opportunities? {{demoLink}}

Best,
DentalLeadGenius`,
      `{{dentistName}},

Real story from a practice like {{clinicName}}:

"We didn't believe we were missing that many calls. The data shocked us—47 per week! Now we capture every single one."

Results:
• Month 1: 89 new patients
• Month 3: $14K/month revenue increase
• Month 6: Expanded to second location

Start here: {{demoLink}}

DentalLeadGenius`,
      `Hi {{dentistName}},

What would an extra $10-15K monthly do for your practice?

That's what Dr. Peterson captured—just by never missing a call.

No marketing increase. No new staff. Just technology that works.

See the full story: {{demoLink}}

Best,
DentalLeadGenius`,
    ],
  },
  4: {
    subjects: [
      "\"We already have a receptionist\" - we hear that a lot",
      "{{dentistName}}, this isn't about replacing your team",
      "The objection every successful practice overcame",
      "Your receptionist + AI = unstoppable",
      "{{clinicName}}: Let me address your concerns",
      "It's not OR—it's AND",
      "Why your great receptionist needs AI backup",
    ],
    bodies: [
      `Hi {{dentistName}},

I know what you might be thinking:

"We already have a receptionist."

Here's the thing—this isn't about replacement. It's about backup.

Your receptionist handles one call. AI handles the overflow.
Your receptionist goes home at 5. AI works until midnight.
Your receptionist takes lunch. AI never stops.

Together? You never miss a patient.

See how it works: {{demoLink}}

Best,
DentalLeadGenius`,
      `{{dentistName}},

Common concern: "Won't AI replace my front desk?"

Reality: AI makes them MORE valuable.

When AI handles:
• Overflow calls
• After-hours inquiries
• Basic scheduling

Your team focuses on:
• In-person patient experience
• Complex cases
• Building relationships

Everyone wins. Especially patients.

{{demoLink}}

DentalLeadGenius`,
      `Hi {{dentistName}},

Let me guess your concern:

"AI can't match the personal touch my receptionist provides."

You're right! And that's not what we do.

We handle what humans CAN'T:
✓ The 2 AM emergency call
✓ The 5 calls at once during lunch
✓ The weekend inquiry

Your team handles everything else—better than ever.

{{demoLink}}

Best,
DentalLeadGenius`,
      `{{dentistName}},

Quick thought experiment:

Your best receptionist handles 1 call at a time.
3 patients call simultaneously.
2 get voicemail.
2 might book elsewhere.

Our AI ensures ALL 3 get immediate attention.

It's math, not magic: {{demoLink}}

DentalLeadGenius`,
      `Hi {{dentistName}},

I talked to 50 practices this month.

Top concern? "We can't afford to add AI."

Top surprise? "It costs LESS than a part-time hire."

And it works 24/7. With zero sick days.

Worth exploring: {{demoLink}}

Best,
DentalLeadGenius`,
      `{{dentistName}},

Your receptionist is probably amazing.

But even amazing humans:
• Can't work 24/7
• Handle only one call at a time
• Need breaks, vacations, sick days

AI fills every gap. Your receptionist stays amazing.

{{demoLink}}

DentalLeadGenius`,
      `Hi {{dentistName}},

The practices thriving right now? They stopped choosing.

Not "receptionist OR AI."
It's "receptionist AND AI."

One handles in-person. One handles overflow.
Both make patients happy.

See the partnership in action: {{demoLink}}

Best,
DentalLeadGenius`,
    ],
  },
  5: {
    subjects: [
      "URGENT: Early pricing ends in 24 hours",
      "{{dentistName}}, final day for founding rates",
      "Tomorrow this offer disappears",
      "Last chance: Lock in 40% off forever",
      "{{clinicName}}: Midnight deadline approaching",
      "24 hours left for early adopter pricing",
      "The window is closing, {{dentistName}}",
    ],
    bodies: [
      `Hi {{dentistName}},

I'll be direct: our early adopter pricing ends tomorrow at midnight.

Current rate: 40% off standard pricing
Lock-in: Forever (as long as you stay)
After tomorrow: Full price only

This is the last time I'll mention pricing.

If you've been considering it, now is the moment: {{demoLink}}

Best,
DentalLeadGenius`,
      `{{dentistName}},

24 hours.

That's how long you have to lock in founding member rates.

After that? Regular pricing (40% higher).

I won't pressure you. But I didn't want you to miss it.

{{demoLink}}

DentalLeadGenius`,
      `Hi {{dentistName}},

Quick heads up:

The early adopter discount we've been offering? Gone tomorrow.

Practices that sign up today get:
✓ 40% off forever
✓ Priority support
✓ Founding member benefits

Tomorrow's signups? Full price.

Last chance: {{demoLink}}

Best,
DentalLeadGenius`,
      `{{dentistName}},

I don't usually send "urgency" emails.

But I'd feel bad if you missed this:

Early pricing ends tomorrow.

That's 40% savings—locked in permanently.

Worth a quick look before midnight: {{demoLink}}

DentalLeadGenius`,
      `Hi {{dentistName}},

This is a timing email, not a sales email.

You may want our AI receptionist. You may not.

But if you DO want it, tomorrow will cost you 40% more.

Just wanted you to know: {{demoLink}}

Best,
DentalLeadGenius`,
      `{{dentistName}},

Final reminder:

Founding member rates: Until midnight
After that: Standard pricing only

If the numbers made sense at full price, they're even better now.

{{demoLink}}

DentalLeadGenius`,
      `Hi {{dentistName}},

Two things happen at midnight:

1. Our early adopter program closes
2. Prices go up 40%

Not a scare tactic. Just how launches work.

If you're curious, now's the time: {{demoLink}}

Best,
DentalLeadGenius`,
    ],
  },
  6: {
    subjects: [
      "Final message: 3 minutes to better patient capture",
      "{{dentistName}}, this is my last email",
      "Closing thought for {{clinicName}}",
      "One last thing before I go...",
      "{{dentistName}}: Install takes 3 minutes. Seriously.",
      "The simplest upgrade your practice could make",
      "Last note: The results speak for themselves",
    ],
    bodies: [
      `Hi {{dentistName}},

This is my final email. I promise.

Here's what I want you to take away:

1. You're probably missing 30-50 patient opportunities monthly
2. Each one is worth $300-$500
3. Our AI captures every single one
4. Setup takes 3 minutes (really)

If that sounds worth exploring, I'm here: {{demoLink}}

If not, I wish you and {{clinicName}} all the best.

Thank you for your time,
DentalLeadGenius`,
      `{{dentistName}},

Last email from me.

One number to remember: 3 minutes.

That's how long setup takes.
That's how long to change your practice's growth trajectory.
That's all I'm asking for.

If you want to explore: {{demoLink}}

Either way, wishing you success.

DentalLeadGenius`,
      `Hi {{dentistName}},

Closing thoughts:

Every day without 24/7 phone coverage is:
• Patients going elsewhere
• Revenue walking away
• Competitors winning

3 minutes changes that.

Here if you need me: {{demoLink}}

Best always,
DentalLeadGenius`,
      `{{dentistName}},

I could write more. But you're busy.

So here's the bottom line:

Missed calls = lost patients
AI receptionist = zero missed calls
Setup = 3 minutes
Decision = yours

{{demoLink}}

Whatever you decide, thank you for reading.

DentalLeadGenius`,
      `Hi {{dentistName}},

Final note:

The practices growing fastest right now have one thing in common:
They never miss a patient call.

Not one.

If you want that for {{clinicName}}: {{demoLink}}

Wishing you growth and success,
DentalLeadGenius`,
      `{{dentistName}},

I've shared:
• The problem (missed calls)
• The cost ($300-$600/day)
• The solution (AI receptionist)
• The proof (real results)
• The timeline (3 minutes)

Now it's your move.

{{demoLink}}

Thank you for your time,
DentalLeadGenius`,
      `Hi {{dentistName}},

This is goodbye (for now).

The opportunity I've outlined isn't going away.
Whenever you're ready, the door is open.

In the meantime, keep providing excellent care.
Your patients are lucky to have {{clinicName}}.

Best wishes,
DentalLeadGenius

PS: If you ever want to explore: {{demoLink}}`,
    ],
  },
};

/**
 * Initialize all template variants in database
 */
export async function initializeTemplateVariants(): Promise<{ inserted: number }> {
  let inserted = 0;
  
  for (const [dayStr, templates] of Object.entries(DAY_TEMPLATES)) {
    const day = parseInt(dayStr);
    
    for (let variantId = 1; variantId <= 7; variantId++) {
      const subjectIndex = variantId - 1;
      const bodyIndex = variantId - 1;
      
      const existing = await db.select().from(geniusTemplateVariants)
        .where(and(
          eq(geniusTemplateVariants.day, day),
          eq(geniusTemplateVariants.variantId, variantId)
        )).limit(1);
      
      if (existing.length === 0) {
        await db.insert(geniusTemplateVariants).values({
          day,
          variantId,
          subject: templates.subjects[subjectIndex] || templates.subjects[0],
          bodyTemplate: templates.bodies[bodyIndex] || templates.bodies[0],
          isActive: true,
        });
        inserted++;
      }
    }
  }
  
  return { inserted };
}

/**
 * Get template variant with rotation (avoids spam filters)
 */
export async function getRotatedTemplate(
  day: number,
  lastVariantUsed?: number
): Promise<{ subject: string; body: string; variantId: number }> {
  // Get active variants for this day
  const variants = await db.select()
    .from(geniusTemplateVariants)
    .where(and(
      eq(geniusTemplateVariants.day, day),
      eq(geniusTemplateVariants.isActive, true)
    ))
    .orderBy(asc(geniusTemplateVariants.variantId));
  
  if (variants.length === 0) {
    // Fallback to hardcoded if DB empty
    const templates = DAY_TEMPLATES[day] || DAY_TEMPLATES[0];
    return {
      subject: templates.subjects[0],
      body: templates.bodies[0],
      variantId: 1,
    };
  }
  
  // Rotate: use next variant after last used (wrapping around)
  let nextVariantIndex = 0;
  if (lastVariantUsed) {
    const currentIndex = variants.findIndex(v => v.variantId === lastVariantUsed);
    nextVariantIndex = (currentIndex + 1) % variants.length;
  } else {
    // Random selection for first use
    nextVariantIndex = Math.floor(Math.random() * variants.length);
  }
  
  const selected = variants[nextVariantIndex];
  
  // Update last used timestamp
  await db.update(geniusTemplateVariants).set({
    lastUsedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(geniusTemplateVariants.id, selected.id));
  
  return {
    subject: selected.subject,
    body: selected.bodyTemplate,
    variantId: selected.variantId,
  };
}

/**
 * Apply micro-variations to avoid spam filters
 */
export function applyMicroVariations(text: string): string {
  const variations: [RegExp, string[]][] = [
    [/\bHi\b/g, ["Hi", "Hello", "Hey"]],
    [/\bBest\b/g, ["Best", "Cheers", "Warm regards", "All the best"]],
    [/\bquick\b/gi, ["quick", "brief", "short"]],
    [/\bpatients?\b/gi, ["patients", "clients"]],
    [/\b24\/7\b/g, ["24/7", "around the clock", "24 hours a day"]],
    [/\bnever\b/gi, ["never", "not once", "at no point"]],
    [/\bevery\b/gi, ["every", "each", "all"]],
  ];
  
  let result = text;
  
  for (const [pattern, replacements] of variations) {
    // 30% chance to apply each variation
    if (Math.random() < 0.3) {
      const replacement = replacements[Math.floor(Math.random() * replacements.length)];
      result = result.replace(pattern, replacement);
    }
  }
  
  return result;
}

// ============================================================================
// HOT/DEAD LEAD DETECTION
// ============================================================================

const HOT_LEAD_THRESHOLDS = {
  minOpens: 3,
  minClicks: 1,
  hasReplied: true,
};

const DEAD_LEAD_THRESHOLDS = {
  daysSinceImport: 10,
  maxOpens: 0,
};

/**
 * Check if a lead qualifies as HOT
 */
export function isHotLead(lead: {
  opens: number;
  clicks: number;
  replied: boolean;
}): boolean {
  return (
    lead.opens >= HOT_LEAD_THRESHOLDS.minOpens ||
    lead.clicks >= HOT_LEAD_THRESHOLDS.minClicks ||
    lead.replied
  );
}

/**
 * Check if a lead should be marked as DEAD
 */
export function isDeadLead(lead: {
  opens: number;
  totalBounces?: number;
  totalComplaints?: number;
  lastIntent?: string | null;
  importedAt: Date;
}): { isDead: boolean; reason?: string } {
  // Bounced
  if ((lead.totalBounces || 0) >= 1) {
    return { isDead: true, reason: "bounced" };
  }
  
  // Complained
  if ((lead.totalComplaints || 0) >= 1) {
    return { isDead: true, reason: "complained" };
  }
  
  // Uninterested reply
  if (lead.lastIntent === "not_interested") {
    return { isDead: true, reason: "uninterested" };
  }
  
  // No engagement after 10 days
  const daysSinceImport = Math.floor(
    (Date.now() - lead.importedAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceImport >= DEAD_LEAD_THRESHOLDS.daysSinceImport && lead.opens === 0) {
    return { isDead: true, reason: "no_engagement" };
  }
  
  return { isDead: false };
}

/**
 * Update hot/dead status for all leads
 */
export async function updateLeadStatuses(): Promise<{
  hotMarked: number;
  deadMarked: number;
}> {
  const leads = await db.select().from(geniusLeads)
    .where(and(
      eq(geniusLeads.status, "active"),
      eq(geniusLeads.isDead, false)
    ));
  
  let hotMarked = 0;
  let deadMarked = 0;
  
  for (const lead of leads) {
    // Check for hot
    if (!lead.isHot && isHotLead(lead)) {
      await db.update(geniusLeads).set({
        isHot: true,
        status: "hot",
        lastEngagementAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(geniusLeads.id, lead.id));
      hotMarked++;
      continue;
    }
    
    // Check for dead
    const deadCheck = isDeadLead({
      opens: lead.opens,
      totalBounces: lead.totalBounces || 0,
      totalComplaints: lead.totalComplaints || 0,
      lastIntent: lead.lastIntent,
      importedAt: lead.importedAt,
    });
    
    if (deadCheck.isDead) {
      // Set nextEligibleSendAt to 90 days from now
      const eligibleDate = new Date();
      eligibleDate.setDate(eligibleDate.getDate() + 90);
      
      await db.update(geniusLeads).set({
        isDead: true,
        status: "dead",
        deadReason: deadCheck.reason,
        nextEligibleSendAt: eligibleDate,
        updatedAt: new Date(),
      }).where(eq(geniusLeads.id, lead.id));
      deadMarked++;
    }
  }
  
  return { hotMarked, deadMarked };
}

// ============================================================================
// RESPONSE HANDLING
// ============================================================================

const RESPONSE_TEMPLATES = {
  info_request: {
    subject: "Here's the info you requested, {{dentistName}}",
    body: `Hi {{dentistName}},

Thanks for reaching out! Here's what you wanted to know:

Our AI receptionist handles:
• 24/7 call answering
• Appointment booking
• Insurance verification
• Patient inquiries

Setup takes just 3 minutes, and most practices see ROI within the first week.

Ready to see it in action? {{demoLink}}

Best,
DentalLeadGenius`,
  },
  pricing_request: {
    subject: "Pricing details + special offer for {{clinicName}}",
    body: `Hi {{dentistName}},

Thanks for asking about pricing!

Our plans start at $299/month—less than a part-time hire—with unlimited calls and appointments.

As a special offer, sign up within 30 days and lock in 40% off for life.

See all options here: {{demoLink}}

Questions? Just reply to this email.

Best,
DentalLeadGenius`,
  },
  positive: {
    subject: "Let's get you started, {{dentistName}}!",
    body: `Hi {{dentistName}},

Fantastic! I'm thrilled you're interested.

Next step: Book a quick 15-minute demo where I'll show you exactly how it works for {{clinicName}}.

Schedule here (takes 30 seconds): {{demoLink}}

Looking forward to it!

Best,
DentalLeadGenius`,
  },
  call_request: {
    subject: "Let's schedule that call, {{dentistName}}",
    body: `Hi {{dentistName}},

I'd be happy to jump on a call!

Pick a time that works for you: {{demoLink}}

I'll walk you through everything and answer any questions.

Talk soon,
DentalLeadGenius`,
  },
  not_interested: {
    subject: "Understood - Door's always open",
    body: `Hi {{dentistName}},

No problem at all! I appreciate you letting me know.

If anything changes in the future, I'm here to help.

Wishing you and {{clinicName}} continued success!

Best,
DentalLeadGenius`,
  },
};

/**
 * Classify reply intent using basic keyword matching
 * (In production, this would use OpenAI for better classification)
 */
export function classifyReplyIntent(replyText: string): string {
  const lower = replyText.toLowerCase();
  
  if (/price|cost|how much|pricing|rates|fee/i.test(lower)) {
    return "pricing_request";
  }
  
  if (/info|information|more details|tell me more|how does|what does/i.test(lower)) {
    return "info_request";
  }
  
  if (/not interested|unsubscribe|stop|remove|no thanks|pass|not now/i.test(lower)) {
    return "not_interested";
  }
  
  if (/call me|phone|talk|schedule a call|give me a call/i.test(lower)) {
    return "call_request";
  }
  
  if (/interested|yes|sounds good|let's do it|sign me up|demo|schedule/i.test(lower)) {
    return "positive";
  }
  
  return "info_request"; // Default to info request
}

/**
 * Queue an automated response
 */
export async function queueAutoResponse(
  leadId: string,
  triggerType: string,
  delayMinutes: number = 15
): Promise<void> {
  const template = RESPONSE_TEMPLATES[triggerType as keyof typeof RESPONSE_TEMPLATES];
  if (!template) return;
  
  const scheduledFor = new Date();
  scheduledFor.setMinutes(scheduledFor.getMinutes() + delayMinutes);
  
  await db.insert(geniusResponseQueue).values({
    geniusLeadId: leadId,
    triggerType,
    priority: triggerType === "positive" ? 10 : triggerType === "call_request" ? 9 : 5,
    scheduledFor,
    responseTemplate: JSON.stringify(template),
    status: "pending",
  });
}

// ============================================================================
// DEMO AUTO-BOOKING (Buying Signal Detection)
// ============================================================================

const BUYING_SIGNAL_THRESHOLDS = {
  minOpens: 2,
  minClicks: 1,
  hasPositiveReply: true,
};

/**
 * Check if lead shows buying signals
 */
export function hasBuyingSignals(lead: {
  opens: number;
  clicks: number;
  replied: boolean;
  lastIntent?: string | null;
}): boolean {
  // 2+ opens OR 1+ click OR positive reply
  return (
    lead.opens >= BUYING_SIGNAL_THRESHOLDS.minOpens ||
    lead.clicks >= BUYING_SIGNAL_THRESHOLDS.minClicks ||
    (lead.replied && lead.lastIntent === "positive")
  );
}

/**
 * Queue demo invite for leads with buying signals
 */
export async function queueDemoInvite(leadId: string): Promise<void> {
  const [lead] = await db.select().from(geniusLeads).where(eq(geniusLeads.id, leadId)).limit(1);
  
  if (!lead || lead.demoInviteSent) return;
  
  // Queue demo invite
  await queueAutoResponse(leadId, "positive", 5); // Send within 5 minutes
  
  // Queue 4-hour reminder if not booked
  const reminderTime = new Date();
  reminderTime.setHours(reminderTime.getHours() + 4);
  
  await db.insert(geniusResponseQueue).values({
    geniusLeadId: leadId,
    triggerType: "demo_reminder",
    priority: 8,
    scheduledFor: reminderTime,
    responseTemplate: JSON.stringify({
      subject: "Quick reminder about your demo, {{dentistName}}",
      body: `Hi {{dentistName}},

Just wanted to make sure you saw my note about scheduling a demo.

I have a few spots open this week—pick one here: {{demoLink}}

It only takes 15 minutes, and you'll see exactly how it works for {{clinicName}}.

Talk soon!
DentalLeadGenius`,
    }),
    status: "pending",
  });
  
  // Mark invite sent
  await db.update(geniusLeads).set({
    demoInviteSent: true,
    buyingSignalAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(geniusLeads.id, leadId));
}

// ============================================================================
// DAILY OPTIMIZATION LOOP
// ============================================================================

/**
 * Run daily optimization cycle
 */
export async function runDailyOptimization(): Promise<{
  leadsRescored: number;
  hotMarked: number;
  deadMarked: number;
  templatesAnalyzed: number;
}> {
  console.log("[GENIUS] Running daily optimization cycle...");
  
  // 1. Re-score all leads
  const { rescored } = await rescoreAllLeads();
  
  // 2. Update hot/dead statuses
  const { hotMarked, deadMarked } = await updateLeadStatuses();
  
  // 3. Analyze template performance
  const templates = await db.select().from(geniusTemplateVariants);
  for (const template of templates) {
    if (template.sentCount > 0) {
      const openRate = ((template.openCount / template.sentCount) * 100).toFixed(1);
      const clickRate = ((template.clickCount / template.sentCount) * 100).toFixed(1);
      const replyRate = ((template.replyCount / template.sentCount) * 100).toFixed(1);
      
      await db.update(geniusTemplateVariants).set({
        openRate,
        clickRate,
        replyRate,
        updatedAt: new Date(),
      }).where(eq(geniusTemplateVariants.id, template.id));
    }
  }
  
  // 4. Record daily stats
  await saveDailyStats();
  
  console.log(`[GENIUS] Daily optimization complete: ${rescored} rescored, ${hotMarked} hot, ${deadMarked} dead`);
  
  return {
    leadsRescored: rescored,
    hotMarked,
    deadMarked,
    templatesAnalyzed: templates.length,
  };
}

/**
 * Save daily stats snapshot
 */
export async function saveDailyStats(): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get counts
  const [leadStats] = await db.select({
    total: sql<number>`count(*)`,
    hot: sql<number>`count(*) filter (where is_hot = true)`,
    dead: sql<number>`count(*) filter (where is_dead = true)`,
    highScore: sql<number>`count(*) filter (where lead_score >= 7)`,
  }).from(geniusLeads);
  
  const [emailStats] = await db.select({
    sent: sql<number>`count(*)`,
    opens: sql<number>`count(*) filter (where opened_at is not null)`,
    clicks: sql<number>`count(*) filter (where clicked_at is not null)`,
    bounces: sql<number>`count(*) filter (where bounced_at is not null)`,
  }).from(geniusEmailSends)
    .where(gte(geniusEmailSends.sentAt, today));
  
  // Upsert daily stats
  const existing = await db.select().from(geniusDailyStats).where(eq(geniusDailyStats.date, today)).limit(1);
  
  const stats = {
    date: today,
    totalLeads: Number(leadStats?.total || 0),
    hotLeads: Number(leadStats?.hot || 0),
    deadLeads: Number(leadStats?.dead || 0),
    highScoreLeads: Number(leadStats?.highScore || 0),
    emailsSent: Number(emailStats?.sent || 0),
    opens: Number(emailStats?.opens || 0),
    clicks: Number(emailStats?.clicks || 0),
    bounces: Number(emailStats?.bounces || 0),
    openRate: emailStats?.sent ? ((Number(emailStats?.opens || 0) / Number(emailStats?.sent)) * 100).toFixed(1) : "0",
    clickRate: emailStats?.sent ? ((Number(emailStats?.clicks || 0) / Number(emailStats?.sent)) * 100).toFixed(1) : "0",
    bounceRate: emailStats?.sent ? ((Number(emailStats?.bounces || 0) / Number(emailStats?.sent)) * 100).toFixed(1) : "0",
  };
  
  if (existing.length > 0) {
    await db.update(geniusDailyStats).set(stats).where(eq(geniusDailyStats.id, existing[0].id));
  } else {
    await db.insert(geniusDailyStats).values(stats);
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize all PHASE-2 optimization components
 */
export async function initializePhase2(): Promise<{
  templatesInserted: number;
  sendWindowsInitialized: boolean;
}> {
  console.log("[GENIUS] Initializing PHASE-2 Optimization Engine...");
  
  // Initialize template variants
  const { inserted } = await initializeTemplateVariants();
  console.log(`[GENIUS] Template variants: ${inserted} inserted`);
  
  // Initialize send windows
  await initializeSendWindows();
  console.log("[GENIUS] Send windows initialized");
  
  // Initialize default domain health (using Resend domain)
  const existingDomain = await db.select().from(geniusDomainHealth).limit(1);
  if (existingDomain.length === 0) {
    await db.insert(geniusDomainHealth).values({
      domain: "resend.dev",
      isActive: true,
      warmupStage: 3, // Already warmed up with Resend
      dailySendLimit: 1666, // Match GENIUS limit
    });
    console.log("[GENIUS] Default domain health record created");
  }
  
  console.log("[GENIUS] PHASE-2 Optimization Engine initialized!");
  
  return {
    templatesInserted: inserted,
    sendWindowsInitialized: true,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  DEMO_LINK,
  DAY_TEMPLATES,
  RESPONSE_TEMPLATES,
  SEND_WINDOWS,
  TIMEZONE_CLUSTERS,
};
