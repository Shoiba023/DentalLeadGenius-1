/**
 * Email Service
 * 
 * Handles all email sending using Resend.
 * Supports both Replit's connector system and standard RESEND_API_KEY.
 * 
 * On Replit: Uses Replit's built-in Resend integration
 * On Render/other: Uses RESEND_API_KEY environment variable
 */

import { Resend } from "resend";
import { SITE_NAME, SITE_URL, SUPPORT_EMAIL, EMAIL_FROM_NAME, SITE_TAGLINE } from "@shared/config";

// ============================================================================
// RESEND CLIENT INITIALIZATION
// ============================================================================

const isReplitEnvironment = !!process.env.REPL_ID;

interface ResendConnectionSettings {
  settings: {
    api_key: string;
    from_email: string;
  };
}

let connectionSettings: ResendConnectionSettings | null = null;

/**
 * Get Resend credentials - supports both Replit connector and standard env vars.
 */
async function getCredentials(): Promise<{ apiKey: string; fromEmail: string }> {
  // If running outside Replit, use standard environment variable
  if (!isReplitEnvironment) {
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable not set');
    }
    
    console.log('[EMAIL] Using standard Resend API key (non-Replit environment)');
    return {
      apiKey: apiKey,
      fromEmail: process.env.RESEND_FROM_EMAIL || SUPPORT_EMAIL
    };
  }

  // Replit connector flow
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('Replit token not found - unable to authenticate with Resend connector');
  }

  if (!hostname) {
    throw new Error('REPLIT_CONNECTORS_HOSTNAME not found');
  }

  const response = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  );

  const data = await response.json();
  connectionSettings = data.items?.[0];

  if (!connectionSettings || !connectionSettings.settings.api_key) {
    throw new Error('Resend not connected - please set up the Resend integration');
  }

  return {
    apiKey: connectionSettings.settings.api_key,
    fromEmail: connectionSettings.settings.from_email || SUPPORT_EMAIL
  };
}

/**
 * Get a fresh Resend client (tokens can expire, so never cache).
 */
async function getResendClient(): Promise<{ client: Resend; fromEmail: string }> {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

/**
 * Check if Resend is configured (via Replit connector or RESEND_API_KEY).
 */
export async function isEmailConfigured(): Promise<boolean> {
  try {
    await getCredentials();
    return true;
  } catch {
    return false;
  }
}

/**
 * Test email connection - useful for /health/email endpoint.
 */
export async function testEmailConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const { client, fromEmail } = await getResendClient();
    return {
      success: true,
      message: `Resend connected successfully. From email: ${fromEmail}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Resend connection test failed:", errorMessage);
    return {
      success: false,
      message: `Resend connection failed: ${errorMessage}`,
    };
  }
}

// ============================================================================
// GENERIC SEND EMAIL UTILITY
// ============================================================================

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Generic reusable email sending function.
 * Accepts: { to, subject, html, text }
 * Returns: { ok: true } on success, { ok: false, error: "..." } on failure
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ ok: boolean; error?: string }> {
  const { to, subject, html, text } = options;

  try {
    const { client, fromEmail } = await getResendClient();
    
    await client.emails.send({
      from: `${EMAIL_FROM_NAME} <${fromEmail}>`,
      to,
      subject,
      html,
      text: text || undefined,
    });

    console.log(`Email sent successfully to ${to}: ${subject}`);
    return { ok: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to send email:", errorMessage);
    return { ok: false, error: errorMessage };
  }
}

// ============================================================================
// SUPPORT EMAIL UTILITY
// ============================================================================

interface SendSupportEmailOptions {
  subject: string;
  html: string;
  text?: string;
  toOverride?: string;
}

/**
 * Send an email to the support address (or an override for testing).
 */
export async function sendSupportEmail(options: SendSupportEmailOptions): Promise<boolean> {
  const { subject, html, text, toOverride } = options;
  const recipient = toOverride || SUPPORT_EMAIL;

  const result = await sendEmail({
    to: recipient,
    subject,
    html,
    text,
  });

  return result.ok;
}

// ============================================================================
// LEAD NOTIFICATION EMAILS
// ============================================================================

interface LeadNotificationOptions {
  formType: string;
  leadData: Record<string, string | null | undefined>;
  source?: string;
}

/**
 * Send a notification email to support when a new lead is captured.
 */
export async function sendLeadNotificationEmail(options: LeadNotificationOptions): Promise<boolean> {
  const { formType, leadData, source } = options;
  const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });

  const dataRows = Object.entries(leadData)
    .filter(([_, value]) => value)
    .map(([key, value]) => `
      <tr>
        <td style="padding: 8px 12px; border: 1px solid #e4e4e7; font-weight: 600; background-color: #f9fafb; text-transform: capitalize;">
          ${key.replace(/([A-Z])/g, ' $1').trim()}
        </td>
        <td style="padding: 8px 12px; border: 1px solid #e4e4e7;">
          ${value}
        </td>
      </tr>
    `)
    .join("");

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #18181b; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">
                ${SITE_NAME}
              </h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #a1a1aa;">
                New ${formType}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <h2 style="margin: 0 0 20px; font-size: 18px; font-weight: 600; color: #18181b;">
                New Lead Captured
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px;">
                ${dataRows}
              </table>
              <div style="padding: 16px; background-color: #f4f4f5; border-radius: 8px; margin-top: 20px;">
                <p style="margin: 0; font-size: 13px; color: #71717a;">
                  <strong>Source:</strong> ${source || "Landing Page"}<br>
                  <strong>Captured At:</strong> ${timestamp}
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; text-align: center; border-top: 1px solid #e4e4e7; background-color: #fafafa; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                This is an automated notification from ${SITE_NAME}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const textLines = Object.entries(leadData)
    .filter(([_, value]) => value)
    .map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1').trim()}: ${value}`)
    .join("\n");

  const textContent = `
New ${formType} from ${SITE_NAME}
${"=".repeat(50)}

${textLines}

Source: ${source || "Landing Page"}
Captured At: ${timestamp}

---
This is an automated notification from ${SITE_NAME}
  `.trim();

  return sendSupportEmail({
    subject: `New ${formType} from ${SITE_NAME}`,
    html: htmlContent,
    text: textContent,
  });
}
// ============================================================================
// 7-DAY NURTURE AUTOMATION EMAILS
// ============================================================================

interface AutomationEmailOptions {
  to: string;
  day: number;          // 1–7
  clinicName?: string;  // optional – fallback “your clinic”
}

/**
 * Send a 7-day nurture email for the given day.
 * Uses simple HTML + text versions for better deliverability.
 */
export async function sendAutomationEmail(
  options: AutomationEmailOptions
): Promise<boolean> {
  const { to, day, clinicName = "your clinic" } = options;

  const demoUrl = `${SITE_URL}/demo`;
  const siteUrl = SITE_URL;

  let subject = "";
  let htmlContent = "";
  let textContent = "";

  switch (day) {
    // ------------------------------------------------------------------------
    // DAY 1 – INTRO + DEMO CTA
    // ------------------------------------------------------------------------
    case 1: {
      subject = "Transform Your Dental Patient Growth with AI";

      htmlContent = `
<div style="font-family: Arial, sans-serif; font-size:14px; line-height:1.6; color:#111827;">
  <p>Hi ${clinicName},</p>

  <p>Growing a dental practice today needs more than traditional marketing. It needs
  <strong>fast response, smart follow-up, and accurate patient qualification.</strong></p>

  <p><strong>${SITE_NAME}</strong> is an AI-powered assistant that helps you book more
  high-value patients without adding extra staff.</p>

  <p style="margin-top:20px; text-align:center;">
    <a href="${demoUrl}"
       style="display:inline-block; padding:12px 22px; background:#18181b; color:#ffffff; border-radius:6px; text-decoration:none;">
      ▶ Watch 3-Minute Demo
    </a>
  </p>

  <p style="text-align:center; margin-top:10px;">
    <a href="${siteUrl}" style="color:#2563eb; text-decoration:underline;">
      Visit DentalLeadGenius Website
    </a>
  </p>

  <p>Regards,<br/>Shoiba<br/>Founder – ${SITE_NAME}</p>
</div>
      `.trim();

      textContent = `
Hi ${clinicName},

Introducing ${SITE_NAME} — the AI system that helps dental offices grow faster
without extra staff.

Watch the demo: ${demoUrl}
Visit website: ${siteUrl}

Regards,
Shoiba
Founder – ${SITE_NAME}
      `.trim();

      break;
    }

    // ------------------------------------------------------------------------
    // DAY 2 – PAIN POINTS
    // ------------------------------------------------------------------------
    case 2: {
      subject = "Are Missed Calls & Slow Replies Losing You Patients?";

      htmlContent = `
<div style="font-family: Arial, sans-serif; font-size:14px; line-height:1.6; color:#111827;">
  <p>Hi ${clinicName},</p>

  <p>Most clinics lose potential patients because of:</p>
  <ul>
    <li>Missed calls during busy hours</li>
    <li>Slow reply to web or social media inquiries</li>
    <li>No structured follow-up for “not ready yet” patients</li>
  </ul>

  <p><strong>${SITE_NAME}</strong> solves all three automatically – 24/7.</p>

  <p style="margin-top:20px; text-align:center;">
    <a href="${demoUrl}"
       style="display:inline-block; padding:12px 22px; background:#18181b; color:#ffffff; border-radius:6px; text-decoration:none;">
      ▶ See How The System Works
    </a>
  </p>

  <p style="text-align:center;">
    <a href="${siteUrl}" style="color:#2563eb;">Visit Website</a>
  </p>

  <p>Regards,<br/>Shoiba</p>
</div>
      `.trim();

      textContent = `
Hi ${clinicName},

Most clinics lose 30–40% of potential patients due to missed calls and slow replies.
${SITE_NAME} fixes this automatically.

Demo: ${demoUrl}
Website: ${siteUrl}

Regards,
Shoiba
      `.trim();

      break;
    }

    // ------------------------------------------------------------------------
    // DAY 3 – SYSTEM BREAKDOWN
    // ------------------------------------------------------------------------
    case 3: {
      subject = "Here’s Exactly How Your AI Patient Engine Works";

      htmlContent = `
<div style="font-family: Arial, sans-serif; font-size:14px; line-height:1.6; color:#111827;">
  <p>Hi ${clinicName},</p>

  <p>Here’s what happens the moment a new patient inquiry arrives:</p>
  <ol>
    <li>AI responds instantly in 0–2 seconds.</li>
    <li>Collects treatment interest and insurance details.</li>
    <li>Qualifies the lead and books available slots.</li>
    <li>Sends reminders & follow-ups to reduce no-shows.</li>
    <li>Updates your dashboard so your team stays in control.</li>
  </ol>

  <p>This can replace the workload of an extra front-desk team member.</p>

  <p style="margin-top:20px; text-align:center;">
    <a href="${demoUrl}"
       style="display:inline-block; padding:12px 22px; background:#18181b; color:#ffffff; border-radius:6px; text-decoration:none;">
      ▶ See Live System Demo
    </a>
  </p>

  <p style="text-align:center;">
    <a href="${siteUrl}" style="color:#2563eb;">Visit Website</a>
  </p>

  <p>Regards,<br/>Shoiba</p>
</div>
      `.trim();

      textContent = `
Hi ${clinicName},

Here is how the AI system handles each new inquiry:
- responds in seconds
- qualifies the patient
- books appointments
- sends reminders and follow-ups.

Watch the live demo: ${demoUrl}

Regards,
Shoiba
      `.trim();

      break;
    }

    // ------------------------------------------------------------------------
    // DAY 4 – SOCIAL PROOF / RESULTS
    // ------------------------------------------------------------------------
    case 4: {
      subject = "Clinics Using AI Are Booking 3–7 Extra Patients Weekly";

      htmlContent = `
<div style="font-family: Arial, sans-serif; font-size:14px; line-height:1.6; color:#111827;">
  <p>Hi ${clinicName},</p>

  <p>Clinics using ${SITE_NAME} are seeing:</p>
  <ul>
    <li>✔ 70% faster response speed</li>
    <li>✔ 40% higher appointment conversion</li>
    <li>✔ 3–7 additional bookings every week</li>
  </ul>

  <p>And they achieved this <strong>without hiring extra staff.</strong></p>

  <p style="margin-top:20px; text-align:center;">
    <a href="${demoUrl}"
       style="display:inline-block; padding:12px 22px; background:#18181b; color:#ffffff; border-radius:6px; text-decoration:none;">
      ▶ Watch Real-World Results
    </a>
  </p>

  <p style="text-align:center;">
    <a href="${siteUrl}" style="color:#2563eb;">Visit Website</a>
  </p>

  <p>Regards,<br/>Shoiba</p>
</div>
      `.trim();

      textContent = `
Hi ${clinicName},

Clinics using ${SITE_NAME} report:
- 70% faster responses
- 40% higher conversions
- 3–7 extra bookings every week.

See the results demo: ${demoUrl}

Regards,
Shoiba
      `.trim();

      break;
    }

    // ------------------------------------------------------------------------
    // DAY 5 – WALKTHROUGH
    // ------------------------------------------------------------------------
    case 5: {
      subject = "Your 5-Minute Walkthrough – See It Before Competitors Do";

      htmlContent = `
<div style="font-family: Arial, sans-serif; font-size:14px; line-height:1.6; color:#111827;">
  <p>Hi ${clinicName},</p>

  <p>Here is a short walkthrough of how ${SITE_NAME} keeps working even when
  the clinic is closed, during evenings and weekends:</p>

  <p style="margin-top:20px; text-align:center;">
    <a href="${demoUrl}"
       style="display:inline-block; padding:12px 22px; background:#18181b; color:#ffffff; border-radius:6px; text-decoration:none;">
      ▶ Watch 5-Minute Walkthrough
    </a>
  </p>

  <p style="text-align:center;">
    <a href="${siteUrl}" style="color:#2563eb;">Visit Website</a>
  </p>

  <p>Regards,<br/>Shoiba</p>
</div>
      `.trim();

      textContent = `
Hi ${clinicName},

See a 5-minute walkthrough of how ${SITE_NAME} books patients for you,
even at night and on weekends.

Walkthrough demo: ${demoUrl}

Regards,
Shoiba
      `.trim();

      break;
    }

    // ------------------------------------------------------------------------
    // DAY 6 – VALUE / 24-7 SYSTEM
    // ------------------------------------------------------------------------
    case 6: {
      subject = "A System That Works 24/7 – Even When You’re Closed";

      htmlContent = `
<div style="font-family: Arial, sans-serif; font-size:14px; line-height:1.6; color:#111827;">
  <p>Hi ${clinicName},</p>

  <p>Imagine a system that:</p>
  <ul>
    <li>Never misses a lead</li>
    <li>Responds instantly in seconds</li>
    <li>Books and reminds patients automatically</li>
    <li>Runs 24/7 without salary or overtime</li>
  </ul>

  <p>This is why so many dental clinics are starting to add AI <strong>now</strong>,
  before every competitor has it.</p>

  <p style="margin-top:20px; text-align:center;">
    <a href="${demoUrl}"
       style="display:inline-block; padding:12px 22px; background:#18181b; color:#ffffff; border-radius:6px; text-decoration:none;">
      ▶ See 24/7 Booking System
    </a>
  </p>

  <p>Regards,<br/>Shoiba</p>
</div>
      `.trim();

      textContent = `
Hi ${clinicName},

${SITE_NAME} runs 24/7:
- no missed leads
- instant replies
- automatic booking and reminders.

See the 24/7 system demo: ${demoUrl}

Regards,
Shoiba
      `.trim();

      break;
    }

    // ------------------------------------------------------------------------
    // DAY 7 – STRONG CTA
    // ------------------------------------------------------------------------
    case 7: {
      subject = "Ready to See It Working for Your Clinic?";

      htmlContent = `
<div style="font-family: Arial, sans-serif; font-size:14px; line-height:1.6; color:#111827;">
  <p>Hi ${clinicName},</p>

  <p>You’ve now seen what ${SITE_NAME} can do for a dental clinic like yours.</p>

  <p>If you’d like a customised plan for your own patient growth, start with the demo below:</p>

  <p style="margin-top:24px; text-align:center;">
    <a href="${demoUrl}"
       style="display:inline-block; padding:14px 30px; background:#18181b; color:#ffffff; border-radius:6px; text-decoration:none; font-size:16px;">
      ▶ Book Your Demo Now
    </a>
  </p>

  <p style="text-align:center; margin-top:10px;">
    <a href="${siteUrl}" style="color:#2563eb;">Visit DentalLeadGenius Website</a>
  </p>

  <p>Regards,<br/>Shoiba</p>
</div>
      `.trim();

      textContent = `
Hi ${clinicName},

If you’re ready to see ${SITE_NAME} working for your own clinic,
start with a quick demo here:

Book your demo: ${demoUrl}
Website: ${siteUrl}

Regards,
Shoiba
      `.trim();

      break;
    }

    default: {
      throw new Error(`Unsupported automation day: ${day}`);
    }
  }

  const result = await sendEmail({
    to,
    subject,
    html: htmlContent,
    text: textContent,
  });

  return result.ok;
}
// ============================================================================
// 7-DAY NURTURE AUTOMATION EMAILS
// ============================================================================

interface AutomationEmailOptions {
  to: string;
  day: number;          // 1–7
  clinicName?: string;  // optional – fallback “your clinic”
}

/**
 * Send a 7-day nurture email for the given day.
 * Uses simple HTML + text versions for better deliverability.
 */
export async function sendAutomationEmail(
  options: AutomationEmailOptions
): Promise<boolean> {
  const { to, day, clinicName = "your clinic" } = options;

  const demoUrl = `${SITE_URL}/demo`;
  const siteUrl = SITE_URL;

  let subject = "";
  let htmlContent = "";
  let textContent = "";

  switch (day) {
    // ------------------------------------------------------------------------
    // DAY 1 – INTRO + DEMO CTA
    // ------------------------------------------------------------------------
    case 1: {
      subject = "Transform Your Dental Patient Growth with AI";

      htmlContent = `
<div style="font-family: Arial, sans-serif; font-size:14px; line-height:1.6; color:#111827;">
  <p>Hi ${clinicName},</p>

  <p>Growing a dental practice today needs more than traditional marketing. It needs
  <strong>fast response, smart follow-up, and accurate patient qualification.</strong></p>

  <p><strong>${SITE_NAME}</strong> is an AI-powered assistant that helps you book more
  high-value patients without adding extra staff.</p>

  <p style="margin-top:20px; text-align:center;">
    <a href="${demoUrl}"
       style="display:inline-block; padding:12px 22px; background:#18181b; color:#ffffff; border-radius:6px; text-decoration:none;">
      ▶ Watch 3-Minute Demo
    </a>
  </p>

  <p style="text-align:center; margin-top:10px;">
    <a href="${siteUrl}" style="color:#2563eb; text-decoration:underline;">
      Visit DentalLeadGenius Website
    </a>
  </p>

  <p>Regards,<br/>Shoiba<br/>Founder – ${SITE_NAME}</p>
</div>
      `.trim();

      textContent = `
Hi ${clinicName},

Introducing ${SITE_NAME} — the AI system that helps dental offices grow faster
without extra staff.

Watch the demo: ${demoUrl}
Visit website: ${siteUrl}

Regards,
Shoiba
Founder – ${SITE_NAME}
      `.trim();

      break;
    }

    // ------------------------------------------------------------------------
    // DAY 2 – PAIN POINTS
    // ------------------------------------------------------------------------
    case 2: {
      subject = "Are Missed Calls & Slow Replies Losing You Patients?";

      htmlContent = `
<div style="font-family: Arial, sans-serif; font-size:14px; line-height:1.6; color:#111827;">
  <p>Hi ${clinicName},</p>

  <p>Most clinics lose potential patients because of:</p>
  <ul>
    <li>Missed calls during busy hours</li>
    <li>Slow reply to web or social media inquiries</li>
    <li>No structured follow-up for “not ready yet” patients</li>
  </ul>

  <p><strong>${SITE_NAME}</strong> solves all three automatically – 24/7.</p>

  <p style="margin-top:20px; text-align:center;">
    <a href="${demoUrl}"
       style="display:inline-block; padding:12px 22px; background:#18181b; color:#ffffff; border-radius:6px; text-decoration:none;">
      ▶ See How The System Works
    </a>
  </p>

  <p style="text-align:center;">
    <a href="${siteUrl}" style="color:#2563eb;">Visit Website</a>
  </p>

  <p>Regards,<br/>Shoiba</p>
</div>
      `.trim();

      textContent = `
Hi ${clinicName},

Most clinics lose 30–40% of potential patients due to missed calls and slow replies.
${SITE_NAME} fixes this automatically.

Demo: ${demoUrl}
Website: ${siteUrl}

Regards,
Shoiba
      `.trim();

      break;
    }

    // ------------------------------------------------------------------------
    // DAY 3 – SYSTEM BREAKDOWN
    // ------------------------------------------------------------------------
    case 3: {
      subject = "Here’s Exactly How Your AI Patient Engine Works";

      htmlContent = `
<div style="font-family: Arial, sans-serif; font-size:14px; line-height:1.6; color:#111827;">
  <p>Hi ${clinicName},</p>

  <p>Here’s what happens the moment a new patient inquiry arrives:</p>
  <ol>
    <li>AI responds instantly in 0–2 seconds.</li>
    <li>Collects treatment interest and insurance details.</li>
    <li>Qualifies the lead and books available slots.</li>
    <li>Sends reminders & follow-ups to reduce no-shows.</li>
    <li>Updates your dashboard so your team stays in control.</li>
  </ol>

  <p>This can replace the workload of an extra front-desk team member.</p>

  <p style="margin-top:20px; text-align:center;">
    <a href="${demoUrl}"
       style="display:inline-block; padding:12px 22px; background:#18181b; color:#ffffff; border-radius:6px; text-decoration:none;">
      ▶ See Live System Demo
    </a>
  </p>

  <p style="text-align:center;">
    <a href="${siteUrl}" style="color:#2563eb;">Visit Website</a>
  </p>

  <p>Regards,<br/>Shoiba</p>
</div>
      `.trim();

      textContent = `
Hi ${clinicName},

Here is how the AI system handles each new inquiry:
- responds in seconds
- qualifies the patient
- books appointments
- sends reminders and follow-ups.

Watch the live demo: ${demoUrl}

Regards,
Shoiba
      `.trim();

      break;
    }

    // ------------------------------------------------------------------------
    // DAY 4 – SOCIAL PROOF / RESULTS
    // ------------------------------------------------------------------------
    case 4: {
      subject = "Clinics Using AI Are Booking 3–7 Extra Patients Weekly";

      htmlContent = `
<div style="font-family: Arial, sans-serif; font-size:14px; line-height:1.6; color:#111827;">
  <p>Hi ${clinicName},</p>

  <p>Clinics using ${SITE_NAME} are seeing:</p>
  <ul>
    <li>✔ 70% faster response speed</li>
    <li>✔ 40% higher appointment conversion</li>
    <li>✔ 3–7 additional bookings every week</li>
  </ul>

  <p>And they achieved this <strong>without hiring extra staff.</strong></p>

  <p style="margin-top:20px; text-align:center;">
    <a href="${demoUrl}"
       style="display:inline-block; padding:12px 22px; background:#18181b; color:#ffffff; border-radius:6px; text-decoration:none;">
      ▶ Watch Real-World Results
    </a>
  </p>

  <p style="text-align:center;">
    <a href="${siteUrl}" style="color:#2563eb;">Visit Website</a>
  </p>

  <p>Regards,<br/>Shoiba</p>
</div>
      `.trim();

      textContent = `
Hi ${clinicName},

Clinics using ${SITE_NAME} report:
- 70% faster responses
- 40% higher conversions
- 3–7 extra bookings every week.

See the results demo: ${demoUrl}

Regards,
Shoiba
      `.trim();

      break;
    }

    // ------------------------------------------------------------------------
    // DAY 5 – WALKTHROUGH
    // ------------------------------------------------------------------------
    case 5: {
      subject = "Your 5-Minute Walkthrough – See It Before Competitors Do";

      htmlContent = `
<div style="font-family: Arial, sans-serif; font-size:14px; line-height:1.6; color:#111827;">
  <p>Hi ${clinicName},</p>

  <p>Here is a short walkthrough of how ${SITE_NAME} keeps working even when
  the clinic is closed, during evenings and weekends:</p>

  <p style="margin-top:20px; text-align:center;">
    <a href="${demoUrl}"
       style="display:inline-block; padding:12px 22px; background:#18181b; color:#ffffff; border-radius:6px; text-decoration:none;">
      ▶ Watch 5-Minute Walkthrough
    </a>
  </p>

  <p style="text-align:center;">
    <a href="${siteUrl}" style="color:#2563eb;">Visit Website</a>
  </p>

  <p>Regards,<br/>Shoiba</p>
</div>
      `.trim();

      textContent = `
Hi ${clinicName},

See a 5-minute walkthrough of how ${SITE_NAME} books patients for you,
even at night and on weekends.

Walkthrough demo: ${demoUrl}

Regards,
Shoiba
      `.trim();

      break;
    }

    // ------------------------------------------------------------------------
    // DAY 6 – VALUE / 24-7 SYSTEM
    // ------------------------------------------------------------------------
    case 6: {
      subject = "A System That Works 24/7 – Even When You’re Closed";

      htmlContent = `
<div style="font-family: Arial, sans-serif; font-size:14px; line-height:1.6; color:#111827;">
  <p>Hi ${clinicName},</p>

  <p>Imagine a system that:</p>
  <ul>
    <li>Never misses a lead</li>
    <li>Responds instantly in seconds</li>
    <li>Books and reminds patients automatically</li>
    <li>Runs 24/7 without salary or overtime</li>
  </ul>

  <p>This is why so many dental clinics are starting to add AI <strong>now</strong>,
  before every competitor has it.</p>

  <p style="margin-top:20px; text-align:center;">
    <a href="${demoUrl}"
       style="display:inline-block; padding:12px 22px; background:#18181b; color:#ffffff; border-radius:6px; text-decoration:none;">
      ▶ See 24/7 Booking System
    </a>
  </p>

  <p>Regards,<br/>Shoiba</p>
</div>
      `.trim();

      textContent = `
Hi ${clinicName},

${SITE_NAME} runs 24/7:
- no missed leads
- instant replies
- automatic booking and reminders.

See the 24/7 system demo: ${demoUrl}

Regards,
Shoiba
      `.trim();

      break;
    }

    // ------------------------------------------------------------------------
    // DAY 7 – STRONG CTA
    // ------------------------------------------------------------------------
    case 7: {
      subject = "Ready to See It Working for Your Clinic?";

      htmlContent = `
<div style="font-family: Arial, sans-serif; font-size:14px; line-height:1.6; color:#111827;">
  <p>Hi ${clinicName},</p>

  <p>You’ve now seen what ${SITE_NAME} can do for a dental clinic like yours.</p>

  <p>If you’d like a customised plan for your own patient growth, start with the demo below:</p>

  <p style="margin-top:24px; text-align:center;">
    <a href="${demoUrl}"
       style="display:inline-block; padding:14px 30px; background:#18181b; color:#ffffff; border-radius:6px; text-decoration:none; font-size:16px;">
      ▶ Book Your Demo Now
    </a>
  </p>

  <p style="text-align:center; margin-top:10px;">
    <a href="${siteUrl}" style="color:#2563eb;">Visit DentalLeadGenius Website</a>
  </p>

  <p>Regards,<br/>Shoiba</p>
</div>
      `.trim();

      textContent = `
Hi ${clinicName},

If you’re ready to see ${SITE_NAME} working for your own clinic,
start with a quick demo here:

Book your demo: ${demoUrl}
Website: ${siteUrl}

Regards,
Shoiba
      `.trim();

      break;
    }

    default: {
      throw new Error(`Unsupported automation day: ${day}`);
    }
  }

  const result = await sendEmail({
    to,
    subject,
    html: htmlContent,
    text: textContent,
  });

  return result.ok;
}
// ============================================================================
// DEMO LINK EMAIL
// ============================================================================

interface DemoLinkEmailOptions {
  to: string;
  clinicName?: string;
  demoLink: string;
  expiresIn: string;
}

/**
 * Send a demo access link email to a potential customer.
 */
export async function sendDemoLinkEmail(options: DemoLinkEmailOptions): Promise<boolean> {
  const { to, clinicName, demoLink, expiresIn } = options;
  
  const subject = `Your ${SITE_NAME} Demo Access Link`;
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Demo Access Link</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e4e4e7;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #18181b;">
                ${SITE_NAME}
              </h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #71717a;">
                ${SITE_TAGLINE}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #18181b;">
                ${clinicName ? `Welcome, ${clinicName}!` : 'Welcome!'}
              </h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #3f3f46;">
                Thank you for your interest in ${SITE_NAME}. Click the button below to access your exclusive demo and discover how our AI-powered platform can help you generate 10x more quality dental leads.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${demoLink}" style="display: inline-block; padding: 16px 40px; background-color: #18181b; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                      Access Your Demo
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.5; color: #71717a;">
                This link will expire in <strong>${expiresIn}</strong>. If you didn't request this demo, you can safely ignore this email.
              </p>
              <div style="margin-top: 24px; padding: 16px; background-color: #f4f4f5; border-radius: 8px;">
                <p style="margin: 0 0 8px; font-size: 12px; color: #71717a;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p style="margin: 0; font-size: 12px; color: #18181b; word-break: break-all;">
                  ${demoLink}
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px;">
              <div style="padding: 24px; background-color: #fafafa; border-radius: 8px; border: 1px solid #e4e4e7;">
                <h3 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #18181b;">
                  What You'll Discover:
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #3f3f46; font-size: 14px; line-height: 1.8;">
                  <li>AI-powered sales chatbot for instant lead qualification</li>
                  <li>Multi-channel outreach automation (Email, SMS, WhatsApp)</li>
                  <li>Comprehensive lead management dashboard</li>
                  <li>Multi-clinic support with custom branding</li>
                  <li>Real-time analytics and conversion tracking</li>
                </ul>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; text-align: center; border-top: 1px solid #e4e4e7; background-color: #fafafa; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #71717a;">
                Questions? Reply to this email or contact us at ${SUPPORT_EMAIL}
              </p>
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                ${SITE_NAME} - ${SITE_TAGLINE}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
  
  const textContent = `
Welcome${clinicName ? `, ${clinicName}` : ''}!

Thank you for your interest in ${SITE_NAME}. Click the link below to access your exclusive demo and discover how our AI-powered platform can help you generate 10x more quality dental leads.

Access Your Demo: ${demoLink}

This link will expire in ${expiresIn}. If you didn't request this demo, you can safely ignore this email.

What You'll Discover:
- AI-powered sales chatbot for instant lead qualification
- Multi-channel outreach automation (Email, SMS, WhatsApp)
- Comprehensive lead management dashboard
- Multi-clinic support with custom branding
- Real-time analytics and conversion tracking

Questions? Contact us at ${SUPPORT_EMAIL}

${SITE_NAME} - ${SITE_TAGLINE}
  `.trim();

  const result = await sendEmail({
    to,
    subject,
    html: htmlContent,
    text: textContent,
  });

  return result.ok;
}

// ============================================================================
// TEST EMAIL (for /health/email endpoint)
// ============================================================================

/**
 * Send a test email to verify Resend configuration.
 */
export async function sendTestEmail(toOverride?: string): Promise<{ success: boolean; message: string }> {
  const recipient = toOverride || SUPPORT_EMAIL;
  
  const result = await sendEmail({
    to: recipient,
    subject: `[TEST] ${SITE_NAME} Email Configuration Test`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Email Configuration Test</h2>
        <p>This is a test email from <strong>${SITE_NAME}</strong>.</p>
        <p>If you received this email, your Resend integration is working correctly!</p>
        <p style="color: #666; font-size: 12px;">
          Sent at: ${new Date().toISOString()}
        </p>
      </div>
    `,
    text: `Email Configuration Test\n\nThis is a test email from ${SITE_NAME}.\n\nIf you received this email, your Resend integration is working correctly!\n\nSent at: ${new Date().toISOString()}`,
  });

  if (result.ok) {
    return {
      success: true,
      message: `Test email sent successfully to ${recipient}`,
    };
  } else {
    return {
      success: false,
      message: result.error || "Failed to send test email. Check server logs for details.",
    };
  }
}
