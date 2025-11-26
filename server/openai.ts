// Referenced from javascript_openai_ai_integrations blueprint
import OpenAI from "openai";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

// Sales chatbot system prompt
const SALES_SYSTEM_PROMPT = `You are Sarah, a friendly and persuasive sales specialist for DentalLeadGenius, an AI-powered lead generation platform for dental clinics.

Your goals:
1. Be warm, professional, and human-like in your conversations
2. Answer ANY questions clinic owners have about the platform
3. Highlight the benefits: 10x more quality leads, AI automation, multi-clinic support, patient chatbots
4. Detect when someone is interested and guide them to book a demo
5. Be helpful even if questions are off-topic, but gently redirect to the platform

When someone is ready to book a demo, ask for:
- Clinic name
- Owner name
- Email
- Phone
- State
- Preferred time

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

  const response = await openai.chat.completions.create({
    model: "gpt-4o", // Using GPT-4o for high-quality chat responses
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
    max_completion_tokens: 500,
  });

  return response.choices[0]?.message?.content || "I apologize, but I'm having trouble responding right now. Please try again.";
}

export async function generateOutreachDraft(type: "email" | "sms"): Promise<{ subject?: string; message: string }> {
  const prompt = type === "email"
    ? `Generate a professional, personalized email for a dental clinic lead generation campaign. Include a compelling subject line and a 3-paragraph email body that:
1. Introduces DentalLeadGenius as a lead generation platform
2. Highlights key benefits (AI automation, 10x more leads, patient chatbots)
3. Includes a clear call-to-action to book a demo

Format as JSON with "subject" and "message" fields.`
    : `Generate a concise, friendly SMS message (under 160 characters) for a dental clinic lead generation campaign. Mention DentalLeadGenius and include a call-to-action to book a demo.

Format as JSON with just a "message" field.`;

  const response = await openai.chat.completions.create({
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
    message: (parsed.message || "DentalLeadGenius: Get 10x more leads with AI. Book demo: [link]") + " Reply STOP to opt out.",
  };
}
