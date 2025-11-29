import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface DemoLinkEmailOptions {
  to: string;
  clinicName?: string;
  demoLink: string;
  expiresIn: string;
}

export async function sendDemoLinkEmail(options: DemoLinkEmailOptions): Promise<boolean> {
  const { to, clinicName, demoLink, expiresIn } = options;
  
  const subject = "Your DentalLeadGenius Demo Access Link";
  
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
                DentalLeadGenius
              </h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #71717a;">
                AI-Powered Lead Generation for Dental Clinics
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
                Thank you for your interest in DentalLeadGenius. Click the button below to access your exclusive demo and discover how our AI-powered platform can help you generate 10x more quality dental leads.
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
                Questions? Reply to this email and we'll get back to you.
              </p>
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                DentalLeadGenius - Transforming Dental Lead Generation
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

Thank you for your interest in DentalLeadGenius. Click the link below to access your exclusive demo and discover how our AI-powered platform can help you generate 10x more quality dental leads.

Access Your Demo: ${demoLink}

This link will expire in ${expiresIn}. If you didn't request this demo, you can safely ignore this email.

What You'll Discover:
- AI-powered sales chatbot for instant lead qualification
- Multi-channel outreach automation (Email, SMS, WhatsApp)
- Comprehensive lead management dashboard
- Multi-clinic support with custom branding
- Real-time analytics and conversion tracking

Questions? Reply to this email and we'll get back to you.

DentalLeadGenius - Transforming Dental Lead Generation
  `;

  const mailOptions = {
    from: process.env.SMTP_FROM || '"DentalLeadGenius" <noreply@dentalleadgenius.com>',
    to,
    subject,
    text: textContent,
    html: htmlContent,
  };

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
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
    console.error("Failed to send demo access email:", error);
    return false;
  }
}
