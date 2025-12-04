/**
 * SMS & Messenger Follow-Up Scripts
 * 
 * Templates for automated SMS and Messenger follow-ups:
 * 1. Instant "We received your info" message
 * 2. 10-minute follow-up
 * 3. 24-hour reminder
 * 4. 72-hour re-activation
 * 5. 7-day re-activation
 */

export interface SMSTemplate {
  id: string;
  name: string;
  triggerType: "instant" | "delayed";
  delayMinutes: number;
  channel: "sms" | "messenger" | "whatsapp";
  generateMessage: (data: SMSTemplateData) => string;
}

export interface SMSTemplateData {
  firstName: string;
  clinicName: string;
  bookingUrl: string;
  phoneNumber?: string;
}

/**
 * Template 1: Instant Confirmation
 * Sent immediately when lead comes in
 */
export const instantConfirmation: SMSTemplate = {
  id: "sms_instant_confirm",
  name: "Instant Confirmation",
  triggerType: "instant",
  delayMinutes: 0,
  channel: "sms",
  generateMessage: (data) => 
    `Hi ${data.firstName}! Thanks for reaching out to ${data.clinicName}. We got your info and someone will be in touch shortly. Need to book now? ${data.bookingUrl}`
};

/**
 * Template 2: 10-Minute Follow-Up
 * Quick nudge if they haven't booked yet
 */
export const tenMinuteFollowUp: SMSTemplate = {
  id: "sms_10min_followup",
  name: "10-Minute Follow-Up",
  triggerType: "delayed",
  delayMinutes: 10,
  channel: "sms",
  generateMessage: (data) => 
    `Hey ${data.firstName}, still thinking about booking? We have appointments available as early as tomorrow. Pick a time that works: ${data.bookingUrl}`
};

/**
 * Template 3: 24-Hour Reminder
 * Gentle reminder the next day
 */
export const twentyFourHourReminder: SMSTemplate = {
  id: "sms_24hr_reminder",
  name: "24-Hour Reminder",
  triggerType: "delayed",
  delayMinutes: 1440, // 24 hours
  channel: "sms",
  generateMessage: (data) => 
    `Hi ${data.firstName}, just following up from ${data.clinicName}. Ready to schedule your visit? We'd love to help. Book here: ${data.bookingUrl}`
};

/**
 * Template 4: 72-Hour Re-Activation
 * More direct approach after 3 days
 */
export const seventyTwoHourReactivation: SMSTemplate = {
  id: "sms_72hr_reactivation",
  name: "72-Hour Re-Activation",
  triggerType: "delayed",
  delayMinutes: 4320, // 72 hours
  channel: "sms",
  generateMessage: (data) => 
    `${data.firstName}, we noticed you haven't booked yet. Most patients who wait end up losing their spot. Secure yours now: ${data.bookingUrl} - ${data.clinicName}`
};

/**
 * Template 5: 7-Day Re-Activation
 * Final attempt with value proposition
 */
export const sevenDayReactivation: SMSTemplate = {
  id: "sms_7day_reactivation",
  name: "7-Day Re-Activation",
  triggerType: "delayed",
  delayMinutes: 10080, // 7 days
  channel: "sms",
  generateMessage: (data) => 
    `Hi ${data.firstName}, this is ${data.clinicName}. We still have you on our list! If dental care is on your mind, we're here to help. Book when ready: ${data.bookingUrl}`
};

/**
 * Messenger-Specific Templates
 */
export const messengerInstant: SMSTemplate = {
  id: "messenger_instant",
  name: "Messenger Instant",
  triggerType: "instant",
  delayMinutes: 0,
  channel: "messenger",
  generateMessage: (data) => 
    `Hey ${data.firstName}! 👋 Thanks for reaching out to ${data.clinicName}. How can we help you today? Looking to book an appointment?`
};

export const messengerFollowUp: SMSTemplate = {
  id: "messenger_followup",
  name: "Messenger Follow-Up",
  triggerType: "delayed",
  delayMinutes: 60,
  channel: "messenger",
  generateMessage: (data) => 
    `Hi ${data.firstName}! Just checking in from ${data.clinicName}. Did you find what you were looking for? Happy to answer any questions about our services. 😊`
};

export const messengerReactivation: SMSTemplate = {
  id: "messenger_reactivation",
  name: "Messenger Re-Activation",
  triggerType: "delayed",
  delayMinutes: 4320, // 72 hours
  channel: "messenger",
  generateMessage: (data) => 
    `Hey ${data.firstName}! It's been a few days since we chatted. Still thinking about dental care? We have some great appointment slots open this week! Let me know if you'd like to book. 📅`
};

/**
 * WhatsApp Templates
 */
export const whatsappInstant: SMSTemplate = {
  id: "whatsapp_instant",
  name: "WhatsApp Instant",
  triggerType: "instant",
  delayMinutes: 0,
  channel: "whatsapp",
  generateMessage: (data) => 
    `Hi ${data.firstName}! Thanks for contacting ${data.clinicName}. We received your inquiry and will get back to you shortly. Need to book right away? Visit: ${data.bookingUrl}`
};

export const whatsappFollowUp: SMSTemplate = {
  id: "whatsapp_followup",
  name: "WhatsApp Follow-Up",
  triggerType: "delayed",
  delayMinutes: 1440, // 24 hours
  channel: "whatsapp",
  generateMessage: (data) => 
    `Hello ${data.firstName}, this is ${data.clinicName} following up on your inquiry. We have appointments available this week. Would you like to schedule a visit? Book here: ${data.bookingUrl}`
};

/**
 * All SMS Templates
 */
export const SMS_TEMPLATES: SMSTemplate[] = [
  instantConfirmation,
  tenMinuteFollowUp,
  twentyFourHourReminder,
  seventyTwoHourReactivation,
  sevenDayReactivation
];

/**
 * All Messenger Templates
 */
export const MESSENGER_TEMPLATES: SMSTemplate[] = [
  messengerInstant,
  messengerFollowUp,
  messengerReactivation
];

/**
 * All WhatsApp Templates
 */
export const WHATSAPP_TEMPLATES: SMSTemplate[] = [
  whatsappInstant,
  whatsappFollowUp
];

/**
 * All Templates Combined
 */
export const ALL_MESSAGE_TEMPLATES: SMSTemplate[] = [
  ...SMS_TEMPLATES,
  ...MESSENGER_TEMPLATES,
  ...WHATSAPP_TEMPLATES
];

/**
 * Get templates by channel
 */
export function getTemplatesByChannel(channel: "sms" | "messenger" | "whatsapp"): SMSTemplate[] {
  return ALL_MESSAGE_TEMPLATES.filter(t => t.channel === channel);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): SMSTemplate | undefined {
  return ALL_MESSAGE_TEMPLATES.find(t => t.id === id);
}

/**
 * Get delayed templates for scheduling
 */
export function getDelayedTemplates(): SMSTemplate[] {
  return ALL_MESSAGE_TEMPLATES.filter(t => t.triggerType === "delayed");
}

/**
 * Get instant templates
 */
export function getInstantTemplates(): SMSTemplate[] {
  return ALL_MESSAGE_TEMPLATES.filter(t => t.triggerType === "instant");
}

/**
 * Generate personalized message from template
 */
export function generateMessage(templateId: string, data: SMSTemplateData): string | null {
  const template = getTemplateById(templateId);
  if (!template) return null;
  return template.generateMessage(data);
}

/**
 * SMS Follow-Up Sequence Configuration
 * Maps the sequence of SMS messages to send automatically
 */
export const SMS_SEQUENCE = [
  { templateId: "sms_instant_confirm", triggerEvent: "lead_created" },
  { templateId: "sms_10min_followup", triggerEvent: "no_response", delayMinutes: 10 },
  { templateId: "sms_24hr_reminder", triggerEvent: "no_booking", delayMinutes: 1440 },
  { templateId: "sms_72hr_reactivation", triggerEvent: "no_booking", delayMinutes: 4320 },
  { templateId: "sms_7day_reactivation", triggerEvent: "no_booking", delayMinutes: 10080 }
];

/**
 * Check if lead should receive SMS based on status
 */
export function shouldSendSMS(leadStatus: string, templateId: string): boolean {
  // Don't send to leads who have already booked or opted out
  const excludedStatuses = ["booked", "demo_booked", "won", "lost", "unsubscribed", "opted_out"];
  if (excludedStatuses.includes(leadStatus.toLowerCase())) {
    return false;
  }
  
  // For reactivation messages, only send to cold leads
  if (templateId.includes("reactivation")) {
    const eligibleStatuses = ["new", "contacted", "cold", "no_response"];
    return eligibleStatuses.includes(leadStatus.toLowerCase());
  }
  
  return true;
}
