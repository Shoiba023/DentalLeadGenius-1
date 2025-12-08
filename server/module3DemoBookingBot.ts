import { db } from "./db";
import { geniusLeads } from "@shared/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { recordDemoBooked, updateModuleStatus, canSendEmail, recordEmailSent } from "./masterControlGenius";
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

async function getHotGeniusLeads(limit: number = 20) {
  return db.select().from(geniusLeads)
    .where(and(eq(geniusLeads.status, 'hot'), gte(geniusLeads.leadScore, 7)))
    .orderBy(desc(geniusLeads.leadScore))
    .limit(limit);
}

interface ConversationContext {
  leadId: number;
  stage: 'initial' | 'qualifying' | 'booking' | 'confirmed' | 'lost';
  messages: Array<{ role: 'assistant' | 'user'; content: string; timestamp: Date }>;
  qualificationScore: number;
  objections: string[];
  preferredTime: string | null;
  demoDate: Date | null;
}

const activeConversations: Map<number, ConversationContext> = new Map();

let botInterval: NodeJS.Timeout | null = null;
let isRunning = false;
let demosBooked = 0;
let conversationsStarted = 0;

function log(message: string) {
  console.log(`[DEMO-BOT] ${message}`);
}

const DEMO_BOT_SYSTEM_PROMPT = `You are an AI assistant for DentalLeadGenius, helping dental clinics book a demo of our AI patient acquisition platform.

Your personality:
- Professional but friendly
- Confident about the product value
- Empathetic to dental practice challenges
- Focus on booking the demo, not selling features

Your goals:
1. Qualify the lead (are they a decision maker? do they have budget?)
2. Understand their pain points (patient acquisition, no-shows, staff time)
3. Book a 15-minute Zoom demo at their convenience

Key talking points:
- AI books patients 24/7 while they sleep
- Average clinic sees 40+ new patients/month
- 14-day free trial, no credit card required
- Takes 5 minutes to set up

Available demo times:
- Weekdays 9 AM - 5 PM EST
- 15-minute slots

Response format: Keep responses under 100 words. Be conversational, not salesy.`;

async function generateBotResponse(context: ConversationContext, userMessage: string): Promise<string> {
  const messages = [
    { role: 'system' as const, content: DEMO_BOT_SYSTEM_PROMPT },
    ...context.messages.map(m => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: userMessage }
  ];

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 200,
      temperature: 0.7
    });

    return response.choices[0]?.message?.content || "I'd love to show you how we can help your practice. When would be a good time for a quick 15-minute demo?";
  } catch (error) {
    log(`AI error: ${error}`);
    return "Thanks for your interest! Would you like to schedule a quick demo? I have availability this week.";
  }
}

async function analyzeIntent(message: string): Promise<{ intent: string; bookingSignal: boolean; objection: string | null }> {
  const lowerMessage = message.toLowerCase();
  
  const bookingPhrases = ['schedule', 'book', 'demo', 'show me', 'interested', 'yes', 'sure', 'sounds good', 'let\'s do it', 'available'];
  const objectionPhrases = ['not interested', 'no thanks', 'too busy', 'no budget', 'not now', 'maybe later', 'unsubscribe'];
  const questionPhrases = ['how', 'what', 'why', 'cost', 'price', 'does it'];
  
  const hasBookingSignal = bookingPhrases.some(phrase => lowerMessage.includes(phrase));
  const hasObjection = objectionPhrases.some(phrase => lowerMessage.includes(phrase));
  const hasQuestion = questionPhrases.some(phrase => lowerMessage.includes(phrase));
  
  let intent = 'neutral';
  if (hasBookingSignal) intent = 'booking';
  else if (hasObjection) intent = 'objection';
  else if (hasQuestion) intent = 'question';
  
  let objection = null;
  if (hasObjection) {
    if (lowerMessage.includes('busy')) objection = 'too_busy';
    else if (lowerMessage.includes('budget') || lowerMessage.includes('cost') || lowerMessage.includes('expensive')) objection = 'budget';
    else if (lowerMessage.includes('not interested')) objection = 'not_interested';
    else objection = 'other';
  }
  
  return { intent, bookingSignal: hasBookingSignal, objection };
}

async function handleWarmLead(leadId: number): Promise<boolean> {
  const lead = await getGeniusLead(leadId);
  if (!lead || lead.status === 'demo_booked' || lead.status === 'converted') {
    return false;
  }

  if (!canSendEmail()) {
    log('Budget limit reached - skipping demo outreach');
    return false;
  }

  let context = activeConversations.get(leadId);
  if (!context) {
    context = {
      leadId,
      stage: 'initial',
      messages: [],
      qualificationScore: 0,
      objections: [],
      preferredTime: null,
      demoDate: null
    };
    activeConversations.set(leadId, context);
    conversationsStarted++;
  }

  if (context.stage === 'initial') {
    const firstName = lead.dentistName?.replace('Dr. ', '').split(' ')[0] || 'Doctor';
    const initialMessage = `Hi ${firstName}! I noticed ${lead.clinicName} is doing great work in ${lead.city}. I'm reaching out because we've helped similar practices book 40+ new patients per month using AI. Would you be open to a quick 15-minute demo to see how it works?`;
    
    context.messages.push({
      role: 'assistant',
      content: initialMessage,
      timestamp: new Date()
    });
    context.stage = 'qualifying';

    log(`📧 Demo outreach sent to ${lead.email}`);
    recordEmailSent('demoBookingBot');
    
    await updateGeniusLead(leadId, {
      lastEngagement: new Date(),
      engagementLevel: Math.min(10, (lead.engagementLevel || 0) + 1)
    });
    
    return true;
  }

  return false;
}

async function processResponse(leadId: number, userMessage: string): Promise<string> {
  let context = activeConversations.get(leadId);
  if (!context) {
    context = {
      leadId,
      stage: 'qualifying',
      messages: [],
      qualificationScore: 0,
      objections: [],
      preferredTime: null,
      demoDate: null
    };
    activeConversations.set(leadId, context);
  }

  context.messages.push({
    role: 'user',
    content: userMessage,
    timestamp: new Date()
  });

  const analysis = await analyzeIntent(userMessage);
  
  if (analysis.objection) {
    context.objections.push(analysis.objection);
    if (context.objections.length >= 3 || analysis.objection === 'not_interested') {
      context.stage = 'lost';
      await updateGeniusLead(leadId, { status: 'unsubscribed' });
      return "No problem at all! If you ever need help growing your patient base, feel free to reach out. Best of luck with your practice!";
    }
  }

  if (analysis.bookingSignal) {
    context.stage = 'booking';
    context.qualificationScore += 3;
    
    const lead = await getGeniusLead(leadId);
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    context.demoDate = tomorrow;
    
    if (lead) {
      await updateGeniusLead(leadId, {
        status: 'demo_booked',
        isHot: true,
        engagementLevel: 10,
        lastEngagement: new Date()
      });
    }
    
    context.stage = 'confirmed';
    demosBooked++;
    recordDemoBooked();
    
    log(`🎉 DEMO BOOKED for lead ${leadId}!`);
    
    const timeStr = tomorrow.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    return `Excellent! I've got you down for a demo on ${timeStr} at 10:00 AM EST. You'll receive a Zoom link shortly. Looking forward to showing you how we can help ${lead?.clinicName || 'your practice'} grow!`;
  }

  const response = await generateBotResponse(context, userMessage);
  
  context.messages.push({
    role: 'assistant',
    content: response,
    timestamp: new Date()
  });

  return response;
}

async function runDemoBotCycle(): Promise<{ leadsContacted: number; demosBooked: number }> {
  if (!isRunning) return { leadsContacted: 0, demosBooked: 0 };
  
  updateModuleStatus('demoBookingBot', 'running');
  
  const warmLeads = await getHotGeniusLeads(20);
  const eligibleLeads = warmLeads.filter(lead => 
    lead.status !== 'demo_booked' && 
    lead.status !== 'converted' &&
    lead.engagementLevel && lead.engagementLevel >= 3
  );

  let leadsContacted = 0;
  const initialDemos = demosBooked;

  for (const lead of eligibleLeads.slice(0, 5)) {
    if (!canSendEmail()) break;
    
    const contacted = await handleWarmLead(lead.id);
    if (contacted) leadsContacted++;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const newDemos = demosBooked - initialDemos;
  log(`📊 Cycle complete: ${leadsContacted} leads contacted, ${newDemos} demos booked`);
  
  return { leadsContacted, demosBooked: newDemos };
}

export async function startDemoBot(): Promise<{ success: boolean; message: string }> {
  if (isRunning) {
    return { success: false, message: 'Demo Booking Bot already running' };
  }

  log('🚀 Starting Demo Booking Bot...');
  isRunning = true;
  updateModuleStatus('demoBookingBot', 'running');

  await runDemoBotCycle();

  botInterval = setInterval(async () => {
    if (isRunning) {
      await runDemoBotCycle();
    }
  }, 60000);

  log('✅ Demo Booking Bot ACTIVE - engaging warm leads');
  return { success: true, message: 'Demo Booking Bot started' };
}

export async function stopDemoBot(): Promise<{ success: boolean; message: string }> {
  if (!isRunning) {
    return { success: false, message: 'Demo Booking Bot not running' };
  }

  if (botInterval) {
    clearInterval(botInterval);
    botInterval = null;
  }

  isRunning = false;
  updateModuleStatus('demoBookingBot', 'stopped');
  log('🛑 Demo Booking Bot stopped');
  return { success: true, message: 'Demo Booking Bot stopped' };
}

export function getDemoBotStatus(): {
  isRunning: boolean;
  demosBooked: number;
  conversationsStarted: number;
  activeConversations: number;
} {
  return {
    isRunning,
    demosBooked,
    conversationsStarted,
    activeConversations: activeConversations.size
  };
}

export { processResponse, handleWarmLead };
