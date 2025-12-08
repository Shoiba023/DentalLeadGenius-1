// OpenAI integration - supports both Replit AI Integrations and standard OpenAI API
import OpenAI from "openai";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@shared/config";

// Lazy-initialized OpenAI client (only created when first needed)
let openai: OpenAI | null = null;
let openaiInitialized = false;
let openaiConfigError: string | null = null;

/**
 * Check if OpenAI is configured (has API key)
 * Use this to check availability before calling AI functions
 */
export function isOpenAIConfigured(): boolean {
  // Check for any available OpenAI API key
  const hasReplitKey = !!process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const hasStandardKey = !!process.env.OPENAI_API_KEY;
  return hasReplitKey || hasStandardKey;
}

function getOpenAIClient(): OpenAI {
  if (!openaiInitialized) {
    openaiInitialized = true;
    
    // Log environment for debugging
    const isReplitEnvironment = !!process.env.REPL_ID;
    console.log("[OpenAI] Initializing client...");
    console.log("[OpenAI] Environment: " + (isReplitEnvironment ? "Replit" : "External (Render/other)"));
    console.log("[OpenAI] REPL_ID present:", !!process.env.REPL_ID);
    console.log("[OpenAI] AI_INTEGRATIONS_OPENAI_API_KEY present:", !!process.env.AI_INTEGRATIONS_OPENAI_API_KEY);
    console.log("[OpenAI] OPENAI_API_KEY present:", !!process.env.OPENAI_API_KEY);
    
    // Detect environment and configure OpenAI client accordingly
    // - On Replit: Uses AI Integrations service (AI_INTEGRATIONS_OPENAI_*)
    // - On Render/other: Uses standard OpenAI API (OPENAI_API_KEY)
    const openaiConfig: { apiKey?: string; baseURL?: string } = {};

    if (isReplitEnvironment && process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
      // Replit AI Integrations
      openaiConfig.baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
      openaiConfig.apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
      console.log("[OpenAI] Using Replit AI Integrations");
    } else if (process.env.OPENAI_API_KEY) {
      // Standard OpenAI API
      openaiConfig.apiKey = process.env.OPENAI_API_KEY;
      console.log("[OpenAI] Using standard OpenAI API key");
    }

    if (openaiConfig.apiKey) {
      openai = new OpenAI(openaiConfig);
      console.log("[OpenAI] Client initialized successfully");
    } else {
      openaiConfigError = "No OpenAI API key configured. Set OPENAI_API_KEY environment variable.";
      console.error("[OpenAI] ERROR: " + openaiConfigError);
    }
  }

  if (!openai) {
    throw new Error(openaiConfigError || "OpenAI is not configured. Set OPENAI_API_KEY environment variable.");
  }

  return openai;
}

// Sales chatbot system prompt - Updated to reflect INSTANT demo delivery
const SALES_SYSTEM_PROMPT = `You are Sarah, a friendly and persuasive sales specialist for ${SITE_NAME}, an AI-powered lead generation platform for dental clinics.

Your goals:
1. Be warm, professional, and human-like in your conversations
2. Answer ANY questions clinic owners have about the platform
3. Highlight the benefits: 10x more quality leads, AI automation, multi-clinic support, patient chatbots
4. When someone shows interest, encourage them to request instant demo access
5. Be helpful even if questions are off-topic, but gently redirect to the platform

PRICING PACKAGES (ALWAYS use these EXACT prices - never make up different prices):

1. Essential Package — $1,997 one-time setup + $497/month
   - AI Sales Chatbot
   - Lead Management Dashboard
   - CSV Lead Import
   - Email Outreach Campaigns
   - Basic Analytics
   - Up to 500 leads/month

2. Growth Package — $2,997 one-time setup + $997/month
   - Everything in Essential, plus:
   - Multi-Channel Outreach (Email, SMS, WhatsApp)
   - Automated Follow-up Sequences
   - Advanced Analytics & Reporting
   - Up to 2,000 leads/month
   - Priority Support

3. Elite Package — $4,997 one-time setup + $1,497/month
   - Everything in Growth, plus:
   - Multi-Clinic Support with Branded Subpages
   - Patient-Facing AI Chatbots
   - Patient Appointment Booking System
   - Unlimited leads
   - Dedicated Account Manager
   - Custom Integrations

When discussing pricing:
- Always mention BOTH the one-time setup fee AND the monthly fee
- Emphasize the value and ROI (10x more leads typically pays for itself in the first month)
- For budget-conscious prospects, start with Essential and mention upgrade path
- For larger clinics or groups, recommend Elite for multi-clinic features

CRITICAL - INSTANT DEMO ACCESS RULES:
- We provide INSTANT demo access - completely self-service
- When someone wants to see the platform, tell them: "You can access the demo right now! Just click the 'Get Instant Access' button, enter your name and email, and you'll get the demo link in seconds."
- FORBIDDEN WORDS - NEVER use these words in any context: "schedule", "scheduling", "wait", "waiting", "match", "matching", "prepare", "preparing", "appointment"
- REQUIRED WORDS - Always use: "instant", "immediate", "right now", "seconds", "self-service"
- Example responses:
  - "Great! You can explore the platform immediately - just click 'Get Instant Access' and you'll have the demo link in seconds."
  - "I'd love to show you! Click the 'Get Instant Access' button and you'll have immediate access to explore everything yourself."

Keep responses concise and conversational. Be persuasive but not pushy.`;

// Patient chatbot system prompt
const PATIENT_SYSTEM_PROMPT = `You are a helpful dental assistant chatbot for {CLINIC_NAME}.

Your goals:
1. Answer common dental questions with accurate, friendly information
2. Help patients understand dental procedures and treatments
3. Provide appointment booking assistance
4. Be warm, professional, and reassuring

When someone wants to book an appointment, collect:
- Patient name
- Email
- Phone
- Appointment type (checkup, cleaning, cosmetic, emergency, etc.)
- Preferred date and time

Keep responses concise and caring. Prioritize patient comfort and clarity.`;

export async function generateChatResponse(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  type: "sales" | "patient",
  clinicName?: string
): Promise<string> {
  const systemPrompt = type === "sales"
    ? SALES_SYSTEM_PROMPT
    : PATIENT_SYSTEM_PROMPT.replace("{CLINIC_NAME}", clinicName || "our dental clinic");

  const response = await getOpenAIClient().chat.completions.create({
    model: "gpt-4o", // Using GPT-4o for high-quality chat responses
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
    max_completion_tokens: 500,
  });

  return response.choices[0]?.message?.content || "I apologize, but I'm having trouble responding right now. Please try again.";
}

// ============================================================================
// AI DEMO MODES - System prompts for the live demo page
// ============================================================================

const AI_DEMO_BASE_PROMPT = `You are a demo AI assistant for a dental clinic automation platform called ${SITE_NAME}. 
You do not give actual medical diagnosis, but you explain options clearly, encourage booking, and show how you could help a real clinic grow.
Keep responses concise, professional, and helpful. Never mention that you are a language model or AI in your responses.`;

const AI_DEMO_MODES: Record<string, string> = {
  receptionist: `${AI_DEMO_BASE_PROMPT}

You are acting as an AI Dental Receptionist. Your role is to:
- Greet patients warmly and professionally like a human front-desk agent
- Ask what they need help with (appointments, questions, emergencies)
- Help schedule visits by collecting: name, phone, email, preferred date/time
- Confirm appointments with a friendly summary
- Handle insurance verification questions
- Use a friendly, reassuring tone throughout
- If someone mentions pain or emergency, express concern and prioritize helping them

Example greeting: "Hello! Welcome to our dental clinic. I'm here to help you with appointments, answer questions, or assist with any dental needs. How can I help you today?"`,

  treatment: `${AI_DEMO_BASE_PROMPT}

You are acting as an AI Treatment Planner. Your role is to:
- Explain common dental treatments in simple, patient-friendly language
- Cover procedures like cleanings, fillings, root canals, crowns, implants, whitening, etc.
- Help patients understand what to expect, approximate timelines, and typical steps
- Address common fears and concerns with reassurance
- Always remind patients that final diagnosis and treatment plans are determined by the dentist after examination
- Encourage patients to book a consultation for personalized assessment

Example: "A dental implant is like a replacement tooth root. The procedure typically takes 3-6 months total, including healing time. Would you like me to explain the steps involved?"`,

  recall: `${AI_DEMO_BASE_PROMPT}

You are acting as an AI Recall System specialist. Your role is to:
- Focus on reactivating inactive patients who haven't visited in 6+ months
- Remind patients about overdue checkups and cleanings
- Follow up on completed treatments that may need monitoring
- Use gentle, motivating language to encourage patients to return
- Highlight the importance of preventive care
- Offer to help book their next appointment right away

Example: "Hi! I noticed it's been a while since your last dental visit. Regular checkups help catch issues early and keep your smile healthy. Would you like me to help you schedule a convenient time?"`,

  marketing: `${AI_DEMO_BASE_PROMPT}

You are acting as an AI Marketing Agent for dental clinics. Your role is to:
- Help create compelling offers and promotional campaigns
- Suggest special promotions (whitening specials, new patient discounts, implant campaigns)
- Write engaging marketing messages for email, SMS, and social media
- Help attract new patients with targeted messaging
- Provide ideas for seasonal campaigns and referral programs
- Show how AI can help clinics grow their patient base

Example: "I can help you create a spring whitening campaign! Something like: 'Spring into a brighter smile! 20% off professional whitening this month.' Would you like me to draft more ideas for your clinic?"`,
};

export type DemoMode = "receptionist" | "treatment" | "recall" | "marketing";

/**
 * Custom error class for OpenAI configuration issues
 */
export class OpenAINotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenAINotConfiguredError";
  }
}

/**
 * Generate AI response for the live demo page with mode-specific behavior.
 * Supports 4 modes: receptionist, treatment, recall, marketing
 * 
 * Throws OpenAINotConfiguredError if API key is missing
 * Throws other errors for API failures
 */
export async function generateDemoResponse(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  mode: DemoMode
): Promise<string> {
  const systemPrompt = AI_DEMO_MODES[mode] || AI_DEMO_MODES.receptionist;

  // This will throw if OpenAI is not configured
  const client = getOpenAIClient();
  
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.slice(-10), // Keep last 10 messages for context
    ],
    max_completion_tokens: 400,
  });

  return response.choices[0]?.message?.content || "I apologize, but I'm having trouble responding right now. Please try again.";
}

export async function generateOutreachDraft(type: "email" | "sms" | "whatsapp"): Promise<{ subject?: string; message: string }> {
  const DEMO_URL = `${SITE_URL}/demo`;
  let prompt: string;
  
  if (type === "email") {
    prompt = `Generate a professional, personalized email for a dental clinic lead generation campaign. Include a compelling subject line and a 3-paragraph email body that:
1. Introduces DentalLeadGenius as a lead generation platform
2. Highlights key benefits (AI automation, 10x more leads, patient chatbots)
3. Includes a clear call-to-action with this EXACT demo link: ${DEMO_URL}

IMPORTANT: You MUST include this line in the email: "Click here to access your instant DentalLeadGenius demo: ${DEMO_URL}"

Format as JSON with "subject" and "message" fields.`;
  } else if (type === "sms") {
    prompt = `Generate a concise, friendly SMS message (under 160 characters) for a dental clinic lead generation campaign. Mention DentalLeadGenius and include the demo link: ${DEMO_URL}

Format as JSON with just a "message" field.`;
  } else {
    prompt = `Generate a friendly, conversational WhatsApp message (under 250 characters) for a dental clinic lead generation campaign. The tone should be more casual than email but still professional. Mention DentalLeadGenius benefits and include the demo link: ${DEMO_URL}

IMPORTANT: Do NOT include any emojis, emoticons, or special unicode symbols whatsoever. Use plain text only.

Format as JSON with just a "message" field.`;
  }

  const response = await getOpenAIClient().chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_completion_tokens: 300,
  });

  const content = response.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);

  if (type === "email") {
    return {
      subject: parsed.subject || "Transform Your Dental Practice with AI",
      message: parsed.message + "\n\nTo unsubscribe, reply with 'UNSUBSCRIBE'.",
    };
  }

  return {
    message: (parsed.message || "DentalLeadGenius: Get 10x more leads with AI. Get instant access: [link]") + " Reply STOP to opt out.",
  };
}
