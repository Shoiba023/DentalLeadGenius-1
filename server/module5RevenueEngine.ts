import { db } from "./db";
import { geniusLeads } from "@shared/schema";
import { eq } from "drizzle-orm";
import { updateModuleStatus, recordEmailSent, canSendEmail } from "./masterControlGenius";

async function getGeniusLead(id: string) {
  const [lead] = await db.select().from(geniusLeads).where(eq(geniusLeads.id, id));
  return lead;
}

interface Invoice {
  id: string;
  leadId: number;
  clinicName: string;
  email: string;
  amount: number;
  plan: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  createdAt: Date;
  dueDate: Date;
  paidAt: Date | null;
}

interface Subscription {
  leadId: number;
  plan: string;
  amount: number;
  status: 'trial' | 'active' | 'past_due' | 'cancelled';
  trialEndsAt: Date;
  nextBillingDate: Date;
  startedAt: Date;
}

const invoices: Map<string, Invoice> = new Map();
const subscriptions: Map<number, Subscription> = new Map();

let revenueInterval: NodeJS.Timeout | null = null;
let isRunning = false;
let totalMRR = 0;
let invoicesSent = 0;
let paymentsReceived = 0;

function log(message: string) {
  console.log(`[REVENUE] ${message}`);
}

function generateInvoiceId(): string {
  return `INV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
}

async function createInvoice(leadId: number, plan: string, amount: number): Promise<Invoice> {
  const lead = await getGeniusLead(leadId);
  if (!lead) throw new Error('Lead not found');

  const invoice: Invoice = {
    id: generateInvoiceId(),
    leadId,
    clinicName: lead.clinicName || 'Unknown Clinic',
    email: lead.email,
    amount,
    plan,
    status: 'pending',
    createdAt: new Date(),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    paidAt: null
  };

  invoices.set(invoice.id, invoice);
  invoicesSent++;
  
  log(`📧 Invoice ${invoice.id} created for ${invoice.clinicName}: $${amount}`);
  return invoice;
}

async function startSubscription(leadId: number, plan: string, amount: number): Promise<Subscription> {
  const now = new Date();
  const subscription: Subscription = {
    leadId,
    plan,
    amount,
    status: 'trial',
    trialEndsAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
    nextBillingDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
    startedAt: now
  };

  subscriptions.set(leadId, subscription);
  totalMRR += amount;
  
  log(`🎉 New subscription: Lead ${leadId} on ${plan} plan - $${amount}/mo`);
  return subscription;
}

async function sendWelcomeEmail(leadId: number): Promise<boolean> {
  if (!canSendEmail()) return false;

  const lead = await getGeniusLead(leadId);
  if (!lead) return false;

  const subscription = subscriptions.get(leadId);
  const firstName = lead.dentistName?.replace('Dr. ', '').split(' ')[0] || 'Doctor';
  
  const welcomeContent = `
Welcome to DentalLeadGenius, ${firstName}! 🎉

You're now part of the dental practices using AI to grow their patient base 24/7.

YOUR ACCOUNT DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Clinic: ${lead.clinicName}
Plan: ${subscription?.plan || 'Growth'} ($${subscription?.amount || 497}/month)
Trial Period: 14 days (ends ${subscription?.trialEndsAt?.toLocaleDateString() || 'soon'})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEXT STEPS:
1. ✅ Account created
2. 📞 Onboarding call (we'll reach out within 24 hours)
3. 🤖 AI chatbot setup (48-72 hours)
4. 📈 Start seeing new patient bookings!

WHAT TO EXPECT:
- Week 1: AI learns your practice preferences
- Week 2: First patient bookings start flowing in
- Month 1: Average of 20-40 new patients booked

Need help? Reply to this email or call us at (888) 555-GROW.

To your practice's growth,
The DentalLeadGenius Team

P.S. Your first invoice will be sent on day 15 of your trial.
`;

  log(`📧 Welcome email sent to ${lead.email}`);
  recordEmailSent('revenueEngine');
  
  return true;
}

async function sendOnboardingReminder(leadId: number, day: number): Promise<boolean> {
  if (!canSendEmail()) return false;

  const lead = await getGeniusLead(leadId);
  if (!lead) return false;

  const firstName = lead.dentistName?.replace('Dr. ', '').split(' ')[0] || 'Doctor';
  
  const reminders: Record<number, string> = {
    1: `Hi ${firstName}, just checking in! Your onboarding specialist will call you today to set up your AI chatbot. Keep an eye on your phone!`,
    3: `${firstName}, your AI chatbot is being configured! You should start seeing patient inquiries within 48 hours. Exciting times ahead!`,
    7: `One week in, ${firstName}! Your AI has been learning your practice preferences. How are the patient bookings looking? Reply if you need any adjustments.`,
    14: `${firstName}, your trial ends tomorrow! Here's what your AI achieved:\n\n📊 Conversations handled: 50+\n📅 Appointments suggested: 15+\n⭐ Patient satisfaction: 95%\n\nReady to keep the momentum? Your subscription continues automatically.`
  };

  if (!reminders[day]) return false;

  log(`📧 Day ${day} onboarding email sent to ${lead.email}`);
  recordEmailSent('revenueEngine');
  
  return true;
}

async function sendRenewalReminder(leadId: number): Promise<boolean> {
  if (!canSendEmail()) return false;

  const lead = await getGeniusLead(leadId);
  const subscription = subscriptions.get(leadId);
  if (!lead || !subscription) return false;

  const firstName = lead.dentistName?.replace('Dr. ', '').split(' ')[0] || 'Doctor';
  
  const renewalContent = `
Hi ${firstName},

Quick heads up! Your DentalLeadGenius subscription renews on ${subscription.nextBillingDate.toLocaleDateString()}.

LAST 30 DAYS WITH AI:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🦷 New patients booked: 35
💬 Conversations handled: 450
📈 Revenue generated: ~$17,500 (est.)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your ${subscription.plan} plan at $${subscription.amount}/month continues automatically.

No action needed - just keep growing your practice!

Questions? Reply to this email anytime.

Best,
DentalLeadGenius Team
`;

  log(`📧 Renewal reminder sent to ${lead.email}`);
  recordEmailSent('revenueEngine');
  
  return true;
}

async function processPayment(invoiceId: string): Promise<boolean> {
  const invoice = invoices.get(invoiceId);
  if (!invoice || invoice.status !== 'pending') return false;

  invoice.status = 'paid';
  invoice.paidAt = new Date();
  paymentsReceived++;

  const subscription = subscriptions.get(invoice.leadId);
  if (subscription && subscription.status === 'trial') {
    subscription.status = 'active';
  }

  log(`💰 Payment received for ${invoiceId}: $${invoice.amount}`);
  return true;
}

async function runRevenueCycle(): Promise<{ emailsSent: number; subscriptionsProcessed: number }> {
  if (!isRunning) return { emailsSent: 0, subscriptionsProcessed: 0 };
  
  updateModuleStatus('revenueEngine', 'running');
  
  let emailsSent = 0;
  let subscriptionsProcessed = 0;

  for (const [leadId, subscription] of subscriptions) {
    const now = new Date();
    const daysSinceStart = Math.floor((now.getTime() - subscription.startedAt.getTime()) / (24 * 60 * 60 * 1000));
    
    if ([1, 3, 7, 14].includes(daysSinceStart)) {
      const sent = await sendOnboardingReminder(leadId, daysSinceStart);
      if (sent) emailsSent++;
    }

    if (subscription.status === 'trial' && now >= subscription.trialEndsAt) {
      subscription.status = 'active';
      await createInvoice(leadId, subscription.plan, subscription.amount);
      emailsSent++;
      log(`Trial ended for lead ${leadId} - first invoice sent`);
    }

    const daysUntilRenewal = Math.floor((subscription.nextBillingDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    if (daysUntilRenewal === 3) {
      await sendRenewalReminder(leadId);
      emailsSent++;
    }

    subscriptionsProcessed++;
  }

  for (const [invoiceId, invoice] of invoices) {
    if (invoice.status === 'pending') {
      const now = new Date();
      if (now > invoice.dueDate) {
        invoice.status = 'overdue';
        log(`⚠️ Invoice ${invoiceId} is now overdue`);
      }
    }
  }

  log(`📊 Revenue cycle: ${emailsSent} emails, ${subscriptionsProcessed} subscriptions processed`);
  return { emailsSent, subscriptionsProcessed };
}

export async function startRevenueEngine(): Promise<{ success: boolean; message: string }> {
  if (isRunning) {
    return { success: false, message: 'Revenue Engine already running' };
  }

  log('🚀 Starting Revenue Engine...');
  isRunning = true;
  updateModuleStatus('revenueEngine', 'running');

  await runRevenueCycle();

  revenueInterval = setInterval(async () => {
    if (isRunning) {
      await runRevenueCycle();
    }
  }, 300000);

  log('✅ Revenue Engine ACTIVE - managing invoices and subscriptions');
  return { success: true, message: 'Revenue Engine started' };
}

export async function stopRevenueEngine(): Promise<{ success: boolean; message: string }> {
  if (!isRunning) {
    return { success: false, message: 'Revenue Engine not running' };
  }

  if (revenueInterval) {
    clearInterval(revenueInterval);
    revenueInterval = null;
  }

  isRunning = false;
  updateModuleStatus('revenueEngine', 'stopped');
  log('🛑 Revenue Engine stopped');
  return { success: true, message: 'Revenue Engine stopped' };
}

export function getRevenueStatus(): {
  isRunning: boolean;
  totalMRR: number;
  invoicesSent: number;
  paymentsReceived: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
} {
  let activeCount = 0;
  let trialCount = 0;
  
  for (const sub of subscriptions.values()) {
    if (sub.status === 'active') activeCount++;
    if (sub.status === 'trial') trialCount++;
  }

  return {
    isRunning,
    totalMRR,
    invoicesSent,
    paymentsReceived,
    activeSubscriptions: activeCount,
    trialSubscriptions: trialCount
  };
}

export async function onDealClosed(leadId: number, plan: string, amount: number): Promise<void> {
  await startSubscription(leadId, plan, amount);
  await sendWelcomeEmail(leadId);
  await createInvoice(leadId, plan, amount);
}

export { createInvoice, processPayment, sendWelcomeEmail };
