/**
 * AI-Assisted Reply Suggestions Service
 * 
 * Uses OpenAI to generate contextual reply suggestions for clinics
 * when responding to leads and patient inquiries.
 */

import OpenAI from "openai";
import { storage } from "./storage";
import type { Lead, Clinic, ChatbotMessage } from "@shared/schema";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface ReplySuggestion {
  id: string;
  tone: "professional" | "friendly" | "urgent" | "empathetic";
  subject?: string;
  content: string;
  confidence: number;
}

export interface SuggestionContext {
  leadName: string;
  leadEmail?: string;
  leadPhone?: string;
  leadStatus: string;
  clinicName: string;
  inquiryType?: string;
  previousMessages?: string[];
  customInstructions?: string;
}

/**
 * Generate email reply suggestions for a lead inquiry
 */
export async function generateEmailReplySuggestions(
  context: SuggestionContext,
  inquiry: string
): Promise<ReplySuggestion[]> {
  const systemPrompt = `You are an expert dental practice communications assistant. Generate professional email reply suggestions for dental clinic staff responding to patient/lead inquiries.

CLINIC: ${context.clinicName}
LEAD NAME: ${context.leadName}
LEAD STATUS: ${context.leadStatus}
${context.inquiryType ? `INQUIRY TYPE: ${context.inquiryType}` : ""}
${context.customInstructions ? `CUSTOM INSTRUCTIONS: ${context.customInstructions}` : ""}

Guidelines:
- Keep responses concise but warm and professional
- Address the lead by their first name
- Include a clear call-to-action when appropriate
- Maintain HIPAA compliance - never request sensitive health info via email
- Offer to schedule a call or appointment when relevant
- Sign off appropriately for the clinic

Generate 3 different reply options with varying tones:
1. Professional and formal
2. Friendly and approachable
3. Urgent/action-oriented (if applicable) or empathetic (for sensitive topics)

Return as JSON array with format:
[
  { "tone": "professional", "subject": "Re: Your Inquiry", "content": "...", "confidence": 0.95 },
  { "tone": "friendly", "subject": "Re: Your Inquiry", "content": "...", "confidence": 0.90 },
  { "tone": "empathetic", "subject": "Re: Your Inquiry", "content": "...", "confidence": 0.85 }
]`;

  const userPrompt = `Original inquiry from ${context.leadName}:
"${inquiry}"

${context.previousMessages?.length ? `Previous conversation:
${context.previousMessages.join('\n')}` : ""}

Generate 3 professional email reply suggestions.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return getDefaultSuggestions(context, inquiry);
    }

    const parsed = JSON.parse(content);
    const suggestions = Array.isArray(parsed) ? parsed : parsed.suggestions || [];
    
    return suggestions.map((s: any, index: number) => ({
      id: `suggestion_${Date.now()}_${index}`,
      tone: s.tone || "professional",
      subject: s.subject,
      content: s.content,
      confidence: s.confidence || 0.8,
    }));
  } catch (error) {
    console.error("[AIReplySuggestions] Error generating suggestions:", error);
    return getDefaultSuggestions(context, inquiry);
  }
}

/**
 * Generate quick reply suggestions for chat messages
 */
export async function generateChatReplySuggestions(
  context: SuggestionContext,
  lastMessage: string
): Promise<string[]> {
  const systemPrompt = `You are a helpful dental practice assistant. Generate 3 short, natural chat reply options for clinic staff responding to patient messages.

CLINIC: ${context.clinicName}
PATIENT: ${context.leadName}

Guidelines:
- Keep responses brief (1-2 sentences max)
- Be professional but conversational
- Include helpful next steps when appropriate
- Never request sensitive health information in chat

Return as JSON: { "replies": ["Reply 1", "Reply 2", "Reply 3"] }`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Patient message: "${lastMessage}"\n\nGenerate 3 quick reply options.` },
      ],
      temperature: 0.8,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return getDefaultChatReplies(context, lastMessage);
    }

    const parsed = JSON.parse(content);
    return parsed.replies || getDefaultChatReplies(context, lastMessage);
  } catch (error) {
    console.error("[AIReplySuggestions] Error generating chat replies:", error);
    return getDefaultChatReplies(context, lastMessage);
  }
}

/**
 * Generate follow-up message suggestions for a lead
 */
export async function generateFollowUpSuggestions(
  lead: Lead,
  clinic: Clinic
): Promise<ReplySuggestion[]> {
  const daysSinceContact = lead.contactedAt
    ? Math.floor((Date.now() - new Date(lead.contactedAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const systemPrompt = `You are a dental practice sales expert. Generate follow-up message suggestions to re-engage a lead.

CLINIC: ${clinic.name}
LEAD: ${lead.name}
STATUS: ${lead.status}
${daysSinceContact !== null ? `DAYS SINCE LAST CONTACT: ${daysSinceContact}` : "NEVER CONTACTED"}
TAGS: ${(lead.tags || []).join(", ") || "None"}

Generate 2 follow-up email options:
1. Value-focused: Share something useful/educational
2. Direct: Ask for a meeting/call

Return as JSON array:
[
  { "tone": "professional", "subject": "Subject line", "content": "Email body", "confidence": 0.9 },
  { "tone": "friendly", "subject": "Subject line", "content": "Email body", "confidence": 0.85 }
]`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate follow-up suggestions for this lead." },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return [];
    }

    const parsed = JSON.parse(content);
    const suggestions = Array.isArray(parsed) ? parsed : parsed.suggestions || [];
    
    return suggestions.map((s: any, index: number) => ({
      id: `followup_${Date.now()}_${index}`,
      tone: s.tone || "professional",
      subject: s.subject,
      content: s.content,
      confidence: s.confidence || 0.8,
    }));
  } catch (error) {
    console.error("[AIReplySuggestions] Error generating follow-up suggestions:", error);
    return [];
  }
}

/**
 * Generate objection handling responses
 */
export async function generateObjectionResponse(
  objection: string,
  clinicName: string
): Promise<ReplySuggestion[]> {
  const systemPrompt = `You are a dental practice sales expert. A potential client has raised an objection. Generate 2 professional response options that address the concern and move toward a positive outcome.

CLINIC: ${clinicName}

Common objection categories:
- Price/Budget concerns
- Timing/Not ready
- Already have a solution
- Need to consult others
- Skepticism about results

Guidelines:
- Acknowledge the concern empathetically
- Provide relevant information or reframe
- Offer alternatives when possible
- Include a soft call-to-action
- Stay professional and non-pushy

Return as JSON array:
[
  { "tone": "empathetic", "content": "Response 1", "confidence": 0.9 },
  { "tone": "professional", "content": "Response 2", "confidence": 0.85 }
]`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Objection: "${objection}"\n\nGenerate response options.` },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return [];
    }

    const parsed = JSON.parse(content);
    const suggestions = Array.isArray(parsed) ? parsed : parsed.suggestions || [];
    
    return suggestions.map((s: any, index: number) => ({
      id: `objection_${Date.now()}_${index}`,
      tone: s.tone || "empathetic",
      content: s.content,
      confidence: s.confidence || 0.8,
    }));
  } catch (error) {
    console.error("[AIReplySuggestions] Error generating objection response:", error);
    return [];
  }
}

/**
 * Default email suggestions when AI fails
 */
function getDefaultSuggestions(
  context: SuggestionContext,
  inquiry: string
): ReplySuggestion[] {
  const firstName = context.leadName.split(" ")[0];
  
  return [
    {
      id: `default_${Date.now()}_0`,
      tone: "professional",
      subject: `Re: Your Inquiry - ${context.clinicName}`,
      content: `Dear ${firstName},

Thank you for reaching out to ${context.clinicName}. We appreciate your interest and would be happy to assist you.

I've received your message and will review it carefully. A member of our team will follow up with you within 24 hours to address your inquiry.

If you have any urgent questions, please don't hesitate to call us directly.

Best regards,
${context.clinicName} Team`,
      confidence: 0.7,
    },
    {
      id: `default_${Date.now()}_1`,
      tone: "friendly",
      subject: `Thanks for Reaching Out! - ${context.clinicName}`,
      content: `Hi ${firstName}!

Thanks so much for getting in touch with us at ${context.clinicName}! We're excited to hear from you.

I've got your message and wanted to let you know we'll be in touch very soon. In the meantime, feel free to explore our website or give us a call if you'd like to chat sooner.

Looking forward to connecting with you!

Warm regards,
The ${context.clinicName} Team`,
      confidence: 0.65,
    },
    {
      id: `default_${Date.now()}_2`,
      tone: "empathetic",
      subject: `We're Here to Help - ${context.clinicName}`,
      content: `Dear ${firstName},

Thank you for trusting ${context.clinicName} with your inquiry. We understand that choosing the right dental care provider is an important decision.

Your message is important to us, and I want to personally ensure you receive the attention you deserve. I'll be following up with you shortly to address your questions and concerns.

Please know that we're here to support you every step of the way.

With care,
${context.clinicName} Team`,
      confidence: 0.6,
    },
  ];
}

/**
 * Default chat replies when AI fails
 */
function getDefaultChatReplies(
  context: SuggestionContext,
  lastMessage: string
): string[] {
  return [
    `Thanks for your message! Let me look into that for you.`,
    `I appreciate you reaching out. A team member will assist you shortly.`,
    `Thank you for contacting ${context.clinicName}. How can I help you today?`,
  ];
}

/**
 * Get reply suggestions for a specific lead
 */
export async function getSuggestionsForLead(
  leadId: string,
  inquiry: string
): Promise<ReplySuggestion[]> {
  const lead = await storage.getLeadById(leadId);
  if (!lead) {
    throw new Error(`Lead not found: ${leadId}`);
  }

  const clinic = lead.clinicId 
    ? await storage.getClinicById(lead.clinicId)
    : null;

  const context: SuggestionContext = {
    leadName: lead.name,
    leadEmail: lead.email || undefined,
    leadPhone: lead.phone || undefined,
    leadStatus: lead.status,
    clinicName: clinic?.name || "Our Practice",
  };

  return generateEmailReplySuggestions(context, inquiry);
}
