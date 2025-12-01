/**
 * Email Service
 * 
 * Handles all email sending using Nodemailer with Zoho Mail SMTP.
 * 
 * REQUIRED ENVIRONMENT VARIABLES:
 * - SMTP_HOST: Zoho Mail SMTP server (default: smtp.zoho.com)
 * - SMTP_PORT: SMTP port (default: 587 for TLS)
 * - SMTP_USER: SMTP username (e.g., support@dentalleadgenius.com)
 * - SMTP_PASS: SMTP password or app-specific password
 * - SUPPORT_EMAIL: Support email address (default: support@dentalleadgenius.com)
 */

import nodemailer from "nodemailer";
import { SITE_NAME, SITE_URL, SUPPORT_EMAIL, EMAIL_FROM_NAME, SITE_TAGLINE } from "@shared/config";

// Create nodemailer transporter with Zoho Mail SMTP configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.zoho.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // Use STARTTLS (port 587)
  requireTLS: true, // Force TLS upgrade
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: true, // Enforce valid TLS certificates
  },
});

/**
 * Check if SMTP is properly configured
 */
export function isSmtpConfigured(): boolean {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

/**
 * Test SMTP connection - useful for /health/email endpoint
 */
export async function testSmtpConnection(): Promise<{ success: boolean; message: string }> {
  if (!isSmtpConfigured()) {
    return {
      success: false,
      message: "SMTP not configured. Set SMTP_USER and SMTP_PASS environment variables.",
    };
  }

  try {
    await transporter.verify();
    return {
      success: true,
      message: "SMTP connection verified successfully.",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("SMTP connection test failed:", errorMessage);
    return {
      success: false,
      message: `SMTP connection failed: ${errorMessage}`,
    };
  }
}

// ============================================================================
// SUPPORT EMAIL UTILITY
// ============================================================================

interface SendSupportEmailOptions {
  subject: string;
  html: string;
  text: string;
  toOverride?: string; // Override recipient for testing
}

/**
 * Send an email to the support address (or an override for testing).
 * 
 * @param options - Email options including subject, html body, text body
 * @returns Promise<boolean> - true if sent successfully, false otherwise
 * 
 * @example
 * await sendSupportEmail({
 *   subject: "New Lead from Landing Page",
 *   html: "<h1>New Lead</h1><p>Name: John Doe</p>",
 *   text: "New Lead\nName: John Doe",
 * });
 */
export async function sendSupportEmail(options: SendSupportEmailOptions): Promise<boolean> {
  const { subject, html, text, toOverride } = options;
  const recipient = toOverride || process.env.SUPPORT_EMAIL || SUPPORT_EMAIL;
  const fromAddress = process.env.SMTP_USER || SUPPORT_EMAIL;

  const mailOptions = {
    from: `"${EMAIL_FROM_NAME}" <${fromAddress}>`,
    to: recipient,
    subject,
    text,
    html,
  };

  // If SMTP not configured, log to console (dev/debug mode)
  if (!isSmtpConfigured()) {
    console.log("=".repeat(60));
    console.log("SUPPORT EMAIL (SMTP not configured - logging to console)");
    console.log("=".repeat(60));
    console.log(`From: ${mailOptions.from}`);
    console.log(`To: ${recipient}`);
    console.log(`Subject: ${subject}`);
    console.log("-".repeat(60));
    console.log("Text Content:");
    console.log(text);
    console.log("=".repeat(60));
    return true; // Return true so dev mode doesn't break flow
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Support email sent successfully to ${recipient}: ${subject}`);
    return true;
  } catch (error) {
    console.error("Failed to send support email:", error instanceof Error ? error.message : error);
    return false;
  }
}

// ============================================================================
// LEAD NOTIFICATION EMAILS
// ============================================================================

interface LeadNotificationOptions {
  formType: string; // e.g., "Demo Request", "Contact Form", "Booking"
  leadData: Record<string, string | null | undefined>;
  source?: string;
}

/**
 * Send a notification email to support when a new lead is captured.
 * 
 * @param options - Lead notification options
 * @returns Promise<boolean>
 */
export async function sendLeadNotificationEmail(options: LeadNotificationOptions): Promise<boolean> {
  const { formType, leadData, source } = options;
  const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });

  // Build HTML content
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
          <!-- Header -->
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
          
          <!-- Content -->
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
          
          <!-- Footer -->
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

  // Build plain text content
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
          <!-- Header -->
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
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #18181b;">
                ${clinicName ? `Welcome, ${clinicName}!` : 'Welcome!'}
              </h2>
              
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #3f3f46;">
                Thank you for your interest in ${SITE_NAME}. Click the button below to access your exclusive demo and discover how our AI-powered platform can help you generate 10x more quality dental leads.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${demoLink}" style="display: inline-block; padding: 16px 40px; background-color: #18181b; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; transition: background-color 0.2s;">
                      Access Your Demo
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.5; color: #71717a;">
                This link will expire in <strong>${expiresIn}</strong>. If you didn't request this demo, you can safely ignore this email.
              </p>
              
              <!-- Link fallback -->
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
          
          <!-- What to expect -->
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
          
          <!-- Footer -->
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
  `;

  const fromAddress = process.env.SMTP_USER || SUPPORT_EMAIL;

  const mailOptions = {
    from: `"${EMAIL_FROM_NAME}" <${fromAddress}>`,
    to,
    subject,
    text: textContent,
    html: htmlContent,
  };

  // If SMTP not configured, log to console (dev/debug mode)
  if (!isSmtpConfigured()) {
    console.log("=".repeat(60));
    console.log("DEMO ACCESS EMAIL (SMTP not configured - logging to console)");
    console.log("=".repeat(60));
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Demo Link: ${demoLink}`);
    console.log(`Expires In: ${expiresIn}`);
    if (clinicName) console.log(`Clinic Name: ${clinicName}`);
    console.log("=".repeat(60));
    return true;
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Demo access email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error("Failed to send demo access email:", error instanceof Error ? error.message : error);
    return false;
  }
}

// ============================================================================
// TEST EMAIL (for /health/email endpoint)
// ============================================================================

/**
 * Send a test email to verify SMTP configuration.
 */
export async function sendTestEmail(toOverride?: string): Promise<{ success: boolean; message: string }> {
  const recipient = toOverride || process.env.SUPPORT_EMAIL || SUPPORT_EMAIL;
  
  const result = await sendSupportEmail({
    subject: `[TEST] ${SITE_NAME} Email Configuration Test`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Email Configuration Test</h2>
        <p>This is a test email from <strong>${SITE_NAME}</strong>.</p>
        <p>If you received this email, your SMTP configuration is working correctly!</p>
        <p style="color: #666; font-size: 12px;">
          Sent at: ${new Date().toISOString()}
        </p>
      </div>
    `,
    text: `Email Configuration Test\n\nThis is a test email from ${SITE_NAME}.\n\nIf you received this email, your SMTP configuration is working correctly!\n\nSent at: ${new Date().toISOString()}`,
    toOverride: recipient,
  });

  if (result) {
    return {
      success: true,
      message: `Test email sent successfully to ${recipient}`,
    };
  } else {
    return {
      success: false,
      message: "Failed to send test email. Check server logs for details.",
    };
  }
}
