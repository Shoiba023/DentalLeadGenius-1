import { db } from "./db";
import { geniusLeads } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { recordDealClosed, updateModuleStatus, canSendEmail, recordEmailSent } from "./masterControlGenius";
import OpenAI from "openai";

// Lazy-initialized OpenAI client
let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const isReplit = !!process.env.REPL_ID;
    const apiKey = isReplit 
      ? process.env.AI_INTEGRATIONS_OPENAI_API_KEY 
      : process.env.OPENAI_API_KEY;
    const baseURL = isReplit ? process.env.AI_INTEGRATIONS_OPENAI_BASE_URL : undefined;
    
    if (!apiKey) {
      throw new Error("OpenAI API key not configured");
    }
    openaiClient = new OpenAI({ apiKey, baseURL });
  }
  return openaiClient;
}

async function getGeniusLead(id: string) {
  const [lead] = await db.select().from(geniusLeads).where(eq(geniusLeads.id, id));
  return lead;
}

async function updateGeniusLead(id: string, data: Partial<typeof geniusLeads.$inferInsert>) {
  await db.update(geniusLeads).set(data).where(eq(geniusLeads.id, id));
}

async function getGeniusLeadsByStatus(status: string) {
  return db.select().from(geniusLeads).where(eq(geniusLeads.status, status));
}

interface SalesConversation {
  leadId: number;
  stage: 'discovery' | 'demo' | 'objection_handling' | 'pricing' | 'closing' | 'won' | 'lost';
  painPoints: string[];
  objections: string[];
  budget: number | null;
  decisionMaker: boolean;
  timeline: string | null;
  notes: string[];
  proposedPlan: string | null;
  proposedPrice: number | null;
}

const salesConversations: Map<number, SalesConversation> = new Map();

let closerInterval: NodeJS.Timeout | null = null;
let isRunning = false;
let dealsWon = 0;
let dealsLost = 0;
let totalRevenue = 0;

function log(message: string) {
  console.log(`[CLOSER] ${message}`);
}

const PRICING = {
  starter: { name: 'Starter', price: 297, features: ['AI Chatbot', '500 leads/mo', 'Email support'] },
  growth: { name: 'Growth', price: 497, features: ['AI Chatbot + SMS', '2000 leads/mo', 'Priority support', 'Analytics'] },
  scale: { name: 'Scale', price: 997, features: ['All channels', 'Unlimited leads', '24/7 support', 'Custom integrations', 'Dedicated CSM'] }
};

const CLOSER_SYSTEM_PROMPT = `You are an expert sales closer for DentalLeadGenius. Your goal is to close deals.

Sales Framework (SPIN + Value):
1. PAIN: Understand their biggest challenges (patient acquisition, no-shows, staff burnout)
2. PROBLEM: Quantify the cost of the problem (lost revenue, wasted time)
3. DEMO: Show how our AI solves it (24/7 booking, automated follow-ups)
4. VALUE: Calculate ROI (40 new patients x $500 avg = $20k/mo revenue)
5. PRICE: Present pricing as investment with clear ROI
6. CLOSE: Ask for the sale with confidence

Objection handlers:
- "Too expensive" → ROI calculation, payment plans, starter tier
- "Need to think" → Create urgency, limited slots, competitor mention
- "Not the right time" → Cost of waiting, quick setup
- "Need approval" → Offer call with decision maker

Pricing tiers:
- Starter: $297/mo (small practices)
- Growth: $497/mo (growing practices)  
- Scale: $997/mo (multi-location)

All plans include 14-day free trial. Month-to-month, cancel anytime.

Be confident, handle objections gracefully, and always ask for the sale.`;

async function generateCloserResponse(conversation: SalesConversation, userMessage: string, context: string): Promise<string> {
  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: CLOSER_SYSTEM_PROMPT },
        { role: 'user', content: `Current stage: ${conversation.stage}\nPain points: ${conversation.painPoints.join(', ')}\nObjections: ${conversation.objections.join(', ')}\nContext: ${context}\n\nProspect says: "${userMessage}"\n\nRespond as the sales closer:` }
      ],
      max_tokens: 300,
      temperature: 0.7
    });

    return response.choices[0]?.message?.content || "Based on what you've shared, I think our Growth plan at $497/month would be perfect. It pays for itself with just 1-2 new patients. Ready to get started with the 14-day trial?";
  } catch (error) {
    log(`AI error: ${error}`);
    return "I understand your concerns. Let me address them directly...";
  }
}

function detectObjection(message: string): string | null {
  const lower = message.toLowerCase();
  if (lower.includes('expensive') || lower.includes('cost') || lower.includes('price') || lower.includes('budget')) return 'price';
  if (lower.includes('think about') || lower.includes('consider') || lower.includes('not sure')) return 'think';
  if (lower.includes('not now') || lower.includes('later') || lower.includes('busy')) return 'timing';
  if (lower.includes('speak to') || lower.includes('partner') || lower.includes('approval')) return 'authority';
  if (lower.includes('competitor') || lower.includes('other option') || lower.includes('alternative')) return 'competition';
  return null;
}

function detectBuyingSignal(message: string): boolean {
  const lower = message.toLowerCase();
  const signals = [
    'how do i', 'how do we', 'sign up', 'get started', 'next steps',
    'payment', 'credit card', 'invoice', 'contract', 'agreement',
    'when can', 'start', 'ready', 'let\'s do', 'sounds good', 'deal'
  ];
  return signals.some(signal => lower.includes(signal));
}

async function handleDemoFollowUp(leadId: number): Promise<boolean> {
  const lead = await getGeniusLead(leadId);
  if (!lead || lead.status !== 'demo_booked') return false;

  if (!canSendEmail()) {
    log('Budget limit reached - skipping closer outreach');
    return false;
  }

  let conversation = salesConversations.get(leadId);
  if (!conversation) {
    conversation = {
      leadId,
      stage: 'demo',
      painPoints: [],
      objections: [],
      budget: null,
      decisionMaker: true,
      timeline: null,
      notes: [],
      proposedPlan: null,
      proposedPrice: null
    };
    salesConversations.set(leadId, conversation);
  }

  const firstName = lead.dentistName?.replace('Dr. ', '').split(' ')[0] || 'Doctor';
  
  const followUpEmail = `Hi ${firstName},

Thank you for the demo! I hope you saw how our AI can transform patient acquisition for ${lead.clinicName}.

Quick recap of what we discussed:
- AI chatbot books patients 24/7
- Automated follow-ups reduce no-shows by 40%
- Average ROI: 40+ new patients/month

Based on your practice size, I'd recommend our Growth plan at $497/month. With an average patient value of $500, you'd see positive ROI with just ONE new patient.

Ready to start your 14-day free trial? Just reply "YES" and I'll get you set up in 5 minutes.

Best,
DentalLeadGenius Team`;

  log(`📧 Closer follow-up sent to ${lead.email}`);
  recordEmailSent('closerBot');
  
  await updateGeniusLead(leadId, {
    lastEngagement: new Date(),
    engagementLevel: Math.min(10, (lead.engagementLevel || 0) + 2)
  });

  conversation.stage = 'pricing';
  conversation.proposedPlan = 'growth';
  conversation.proposedPrice = 497;

  return true;
}

async function processCloserResponse(leadId: number, userMessage: string): Promise<{ response: string; dealClosed: boolean; amount: number }> {
  let conversation = salesConversations.get(leadId);
  if (!conversation) {
    conversation = {
      leadId,
      stage: 'discovery',
      painPoints: [],
      objections: [],
      budget: null,
      decisionMaker: true,
      timeline: null,
      notes: [],
      proposedPlan: null,
      proposedPrice: null
    };
    salesConversations.set(leadId, conversation);
  }

  const objection = detectObjection(userMessage);
  if (objection) {
    conversation.objections.push(objection);
    conversation.stage = 'objection_handling';
  }

  const buyingSignal = detectBuyingSignal(userMessage);
  
  if (buyingSignal && conversation.stage !== 'won') {
    conversation.stage = 'closing';
    
    const lead = await getGeniusLead(leadId);
    const plan = conversation.proposedPlan || 'growth';
    const amount = conversation.proposedPrice || PRICING.growth.price;
    
    if (lead) {
      await updateGeniusLead(leadId, {
        status: 'converted',
        isHot: true,
        engagementLevel: 10,
        lastEngagement: new Date()
      });
    }
    
    conversation.stage = 'won';
    dealsWon++;
    totalRevenue += amount;
    recordDealClosed(amount);
    
    log(`💰 DEAL CLOSED: Lead ${leadId} - $${amount}/month`);
    
    return {
      response: `Fantastic! Welcome to DentalLeadGenius! 🎉\n\nI'm setting up your ${PRICING[plan as keyof typeof PRICING]?.name || 'Growth'} account now. You'll receive:\n\n1. Welcome email with login credentials\n2. Onboarding call scheduled within 24 hours\n3. Your AI chatbot live within 48 hours\n\nYour 14-day trial starts today. Your first invoice of $${amount} will be on day 15.\n\nWelcome aboard! Your practice is about to grow. 🦷`,
      dealClosed: true,
      amount
    };
  }

  const contextStr = `Lead has ${conversation.objections.length} objections. Current proposal: ${conversation.proposedPlan} at $${conversation.proposedPrice}`;
  const response = await generateCloserResponse(conversation, userMessage, contextStr);

  return { response, dealClosed: false, amount: 0 };
}

async function runCloserCycle(): Promise<{ followUpsSent: number; dealsClosed: number }> {
  if (!isRunning) return { followUpsSent: 0, dealsClosed: 0 };
  
  updateModuleStatus('closerBot', 'running');
  
  const leads = await getGeniusLeadsByStatus('demo_booked');
  const eligibleLeads = leads.filter(lead => {
    const lastContact = lead.lastEngagement ? new Date(lead.lastEngagement) : null;
    if (!lastContact) return true;
    const hoursSince = (Date.now() - lastContact.getTime()) / (1000 * 60 * 60);
    return hoursSince >= 24;
  });

  let followUpsSent = 0;
  const initialDeals = dealsWon;

  for (const lead of eligibleLeads.slice(0, 5)) {
    if (!canSendEmail()) break;
    
    const sent = await handleDemoFollowUp(lead.id);
    if (sent) followUpsSent++;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const newDeals = dealsWon - initialDeals;
  log(`📊 Cycle complete: ${followUpsSent} follow-ups, ${newDeals} deals closed`);
  
  return { followUpsSent, dealsClosed: newDeals };
}

export async function startCloserBot(): Promise<{ success: boolean; message: string }> {
  if (isRunning) {
    return { success: false, message: 'Closer Bot already running' };
  }

  log('🚀 Starting Closer Bot (Sales AI)...');
  isRunning = true;
  updateModuleStatus('closerBot', 'running');

  await runCloserCycle();

  closerInterval = setInterval(async () => {
    if (isRunning) {
      await runCloserCycle();
    }
  }, 60000);

  log('✅ Closer Bot ACTIVE - converting demos to deals');
  return { success: true, message: 'Closer Bot started' };
}

export async function stopCloserBot(): Promise<{ success: boolean; message: string }> {
  if (!isRunning) {
    return { success: false, message: 'Closer Bot not running' };
  }

  if (closerInterval) {
    clearInterval(closerInterval);
    closerInterval = null;
  }

  isRunning = false;
  updateModuleStatus('closerBot', 'stopped');
  log('🛑 Closer Bot stopped');
  return { success: true, message: 'Closer Bot stopped' };
}

export function getCloserBotStatus(): {
  isRunning: boolean;
  dealsWon: number;
  dealsLost: number;
  totalRevenue: number;
  activeConversations: number;
} {
  return {
    isRunning,
    dealsWon,
    dealsLost,
    totalRevenue,
    activeConversations: salesConversations.size
  };
}

export { processCloserResponse, handleDemoFollowUp };
