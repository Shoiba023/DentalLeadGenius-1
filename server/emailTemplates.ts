/**
 * Email Templates for 5-Day Nurture Campaign
 * 
 * Day 1: Pain awareness + missed revenue
 * Day 2: ROI Story + case study
 * Day 3: Demonstration of AI receptionist
 * Day 4: Social proof + trust
 * Day 5: Strong CTA, urgency, limited-time offer
 */

export interface EmailTemplate {
  id: string;
  emailType: "nurture" | "transactional" | "promotional";
  dayNumber: number;
  sendDelayHours: number;
  triggeredByLeadStatus: string;
  subject: string;
  preheader: string;
  generateHtml: (data: EmailTemplateData) => string;
  generateText: (data: EmailTemplateData) => string;
}

export interface EmailTemplateData {
  firstName: string;
  clinicName: string;
  leadName: string;
  demoUrl: string;
  unsubscribeUrl: string;
}

const DEMO_URL = "https://dental-lead-genius-1-shoibaali10.replit.app/demo";

/**
 * Day 1: Pain Awareness + Missed Revenue
 */
export const day1PainAwareness: EmailTemplate = {
  id: "nurture_day_1",
  emailType: "nurture",
  dayNumber: 1,
  sendDelayHours: 0,
  triggeredByLeadStatus: "new",
  subject: "Are You Losing $3,000+ Every Week Without Knowing It?",
  preheader: "Most dental practices lose 5-10 patients monthly to slow follow-ups",
  
  generateHtml: (data) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
  
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #1e40af; font-size: 24px; margin: 0;">DentalLeadGenius</h1>
  </div>

  <h2 style="font-size: 22px; color: #111827; margin-bottom: 20px;">
    Hi ${data.firstName}, here's a quick reality check...
  </h2>

  <p style="font-size: 16px; line-height: 1.6; color: #374151;">
    Every day, your practice likely loses patients you never knew you had.
  </p>

  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
    <p style="font-size: 16px; line-height: 1.6; color: #92400e; margin: 0;">
      <strong>The hard truth:</strong><br/>
      78% of patients book with the first clinic that responds to their inquiry.<br/>
      If you take more than 5 minutes to respond, they're already calling someone else.
    </p>
  </div>

  <p style="font-size: 16px; line-height: 1.6; color: #374151;">
    Think about it:
  </p>

  <ul style="font-size: 16px; line-height: 1.8; color: #374151; padding-left: 20px;">
    <li>How many calls does your team miss during lunch or busy hours?</li>
    <li>How many website inquiries sit in your inbox for hours before someone responds?</li>
    <li>How many potential patients give up waiting and go elsewhere?</li>
  </ul>

  <p style="font-size: 16px; line-height: 1.6; color: #374151;">
    At an average patient lifetime value of <strong>$3,000-$5,000</strong>, just 2 lost leads per week costs you <strong>$312,000 or more per year</strong>.
  </p>

  <p style="font-size: 16px; line-height: 1.6; color: #374151;">
    The good news? This is completely fixable.
  </p>

  <p style="font-size: 16px; line-height: 1.6; color: #374151;">
    Tomorrow, I'll share exactly how top-performing dental practices are solving this problem (and adding $50,000+ in annual revenue).
  </p>

  <p style="font-size: 16px; line-height: 1.6; color: #374151;">
    Talk soon,<br/>
    <strong>The DentalLeadGenius Team</strong>
  </p>

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">
      <a href="${data.unsubscribeUrl}" style="color: #9ca3af;">Unsubscribe</a> | 
      DentalLeadGenius, Inc.
    </p>
  </div>
</body>
</html>
  `,
  
  generateText: (data) => `
Hi ${data.firstName}, here's a quick reality check...

Every day, your practice likely loses patients you never knew you had.

THE HARD TRUTH:
78% of patients book with the first clinic that responds to their inquiry.
If you take more than 5 minutes to respond, they're already calling someone else.

Think about it:
- How many calls does your team miss during lunch or busy hours?
- How many website inquiries sit in your inbox for hours before someone responds?
- How many potential patients give up waiting and go elsewhere?

At an average patient lifetime value of $3,000-$5,000, just 2 lost leads per week costs you $312,000 or more per year.

The good news? This is completely fixable.

Tomorrow, I'll share exactly how top-performing dental practices are solving this problem (and adding $50,000+ in annual revenue).

Talk soon,
The DentalLeadGenius Team

---
Unsubscribe: ${data.unsubscribeUrl}
  `
};

/**
 * Day 2: ROI Story + Case Study
 */
export const day2ROIStory: EmailTemplate = {
  id: "nurture_day_2",
  emailType: "nurture",
  dayNumber: 2,
  sendDelayHours: 24,
  triggeredByLeadStatus: "new",
  subject: "How Dr. Chen Added $127,000 in Annual Revenue",
  preheader: "Real results from a dental practice that fixed their lead problem",
  
  generateHtml: (data) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
  
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #1e40af; font-size: 24px; margin: 0;">DentalLeadGenius</h1>
  </div>

  <h2 style="font-size: 22px; color: #111827; margin-bottom: 20px;">
    ${data.firstName}, meet Dr. Chen...
  </h2>

  <p style="font-size: 16px; line-height: 1.6; color: #374151;">
    Dr. Sarah Chen runs Kelowna Dental Centre in British Columbia. A year ago, she had the same frustrations you might have:
  </p>

  <ul style="font-size: 16px; line-height: 1.8; color: #374151; padding-left: 20px;">
    <li>Front desk overwhelmed, missing calls during busy hours</li>
    <li>Website inquiries going cold before anyone could follow up</li>
    <li>No idea how many potential patients were slipping away</li>
  </ul>

  <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 25px; margin: 25px 0; border-radius: 8px;">
    <h3 style="color: #047857; margin: 0 0 15px 0; font-size: 18px;">After 6 Months with DentalLeadGenius:</h3>
    <ul style="margin: 0; padding-left: 20px; color: #047857;">
      <li style="margin-bottom: 8px;"><strong>42% increase</strong> in monthly booked appointments</li>
      <li style="margin-bottom: 8px;"><strong>63% reduction</strong> in missed-call revenue loss</li>
      <li style="margin-bottom: 8px;"><strong>28% of inactive patients</strong> reactivated</li>
      <li><strong>$127,000</strong> additional annual revenue</li>
    </ul>
  </div>

  <p style="font-size: 16px; line-height: 1.6; color: #374151;">
    <em>"DentalLeadGenius transformed how we handle patient inquiries. We're booking more appointments than ever, and our team can focus on in-office care."</em>
    <br/>— Dr. Sarah Chen
  </p>

  <p style="font-size: 16px; line-height: 1.6; color: #374151;">
    The secret? AI that responds to every inquiry in under 30 seconds, 24/7 — and follows up automatically until patients book or decline.
  </p>

  <p style="font-size: 16px; line-height: 1.6; color: #374151;">
    Tomorrow, I'll show you exactly how our AI receptionist works (it's simpler than you'd expect).
  </p>

  <p style="font-size: 16px; line-height: 1.6; color: #374151;">
    To your growth,<br/>
    <strong>The DentalLeadGenius Team</strong>
  </p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${data.demoUrl}" style="display: inline-block; background: #1e40af; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
      See How It Works →
    </a>
  </div>

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">
      <a href="${data.unsubscribeUrl}" style="color: #9ca3af;">Unsubscribe</a> | 
      DentalLeadGenius, Inc.
    </p>
  </div>
</body>
</html>
  `,
  
  generateText: (data) => `
${data.firstName}, meet Dr. Chen...

Dr. Sarah Chen runs Kelowna Dental Centre in British Columbia. A year ago, she had the same frustrations you might have:

- Front desk overwhelmed, missing calls during busy hours
- Website inquiries going cold before anyone could follow up
- No idea how many potential patients were slipping away

AFTER 6 MONTHS WITH DENTALLEADGENIUS:
- 42% increase in monthly booked appointments
- 63% reduction in missed-call revenue loss
- 28% of inactive patients reactivated
- $127,000 additional annual revenue

"DentalLeadGenius transformed how we handle patient inquiries. We're booking more appointments than ever, and our team can focus on in-office care." — Dr. Sarah Chen

The secret? AI that responds to every inquiry in under 30 seconds, 24/7 — and follows up automatically until patients book or decline.

Tomorrow, I'll show you exactly how our AI receptionist works (it's simpler than you'd expect).

See How It Works: ${data.demoUrl}

To your growth,
The DentalLeadGenius Team

---
Unsubscribe: ${data.unsubscribeUrl}
  `
};

/**
 * Day 3: AI Receptionist Demonstration
 */
export const day3AIDemo: EmailTemplate = {
  id: "nurture_day_3",
  emailType: "nurture",
  dayNumber: 3,
  sendDelayHours: 48,
  triggeredByLeadStatus: "new",
  subject: "Your AI Receptionist: See It In Action",
  preheader: "2-minute demo of how DentalLeadGenius handles patient inquiries",
  
  generateHtml: (data) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
  
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #1e40af; font-size: 24px; margin: 0;">DentalLeadGenius</h1>
  </div>

  <h2 style="font-size: 22px; color: #111827; margin-bottom: 20px;">
    ${data.firstName}, imagine this scenario...
  </h2>

  <p style="font-size: 16px; line-height: 1.6; color: #374151;">
    It's 9:47 PM on a Tuesday. A potential patient named Maria visits your website looking for a dentist to fix a chipped tooth.
  </p>

  <p style="font-size: 16px; line-height: 1.6; color: #374151;">
    <strong>Without DentalLeadGenius:</strong> She fills out a contact form. No one responds until the next morning. By then, she's already booked with your competitor who answered first.
  </p>

  <div style="background: #dbeafe; padding: 25px; margin: 25px 0; border-radius: 8px;">
    <p style="font-size: 16px; line-height: 1.6; color: #1e40af; margin: 0;">
      <strong>With DentalLeadGenius:</strong><br/><br/>
      ✓ AI chatbot greets Maria instantly (under 30 seconds)<br/>
      ✓ Answers her questions about emergency appointments<br/>
      ✓ Collects her contact info and insurance details<br/>
      ✓ Books her for tomorrow morning's first available slot<br/>
      ✓ Sends confirmation email and text automatically<br/><br/>
      <strong>Maria becomes your patient. All while you were asleep.</strong>
    </p>
  </div>

  <h3 style="font-size: 18px; color: #111827; margin: 25px 0 15px 0;">Here's how it works in 3 steps:</h3>

  <div style="margin-bottom: 20px;">
    <p style="font-size: 16px; line-height: 1.6; color: #374151;">
      <strong style="color: #1e40af;">1. Lead comes in</strong> (website, phone, Facebook, Google)<br/>
      Our AI engages immediately — no waiting, no missed opportunities.
    </p>
  </div>

  <div style="margin-bottom: 20px;">
    <p style="font-size: 16px; line-height: 1.6; color: #374151;">
      <strong style="color: #1e40af;">2. AI qualifies and books</strong><br/>
      Answers common questions, captures details, and schedules appointments directly on your calendar.
    </p>
  </div>

  <div style="margin-bottom: 20px;">
    <p style="font-size: 16px; line-height: 1.6; color: #374151;">
      <strong style="color: #1e40af;">3. Automatic follow-up</strong><br/>
      For leads who don't book immediately, our system follows up on Day 1, Day 3, and Day 5 until they convert or opt out.
    </p>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${data.demoUrl}" style="display: inline-block; background: #1e40af; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
      Try the Live Demo Yourself →
    </a>
  </div>

  <p style="font-size: 16px; line-height: 1.6; color: #374151;">
    Tomorrow, I'll share what real dentists are saying about their results.
  </p>

  <p style="font-size: 16px; line-height: 1.6; color: #374151;">
    Best,<br/>
    <strong>The DentalLeadGenius Team</strong>
  </p>

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">
      <a href="${data.unsubscribeUrl}" style="color: #9ca3af;">Unsubscribe</a> | 
      DentalLeadGenius, Inc.
    </p>
  </div>
</body>
</html>
  `,
  
  generateText: (data) => `
${data.firstName}, imagine this scenario...

It's 9:47 PM on a Tuesday. A potential patient named Maria visits your website looking for a dentist to fix a chipped tooth.

WITHOUT DENTALLEADGENIUS: She fills out a contact form. No one responds until the next morning. By then, she's already booked with your competitor who answered first.

WITH DENTALLEADGENIUS:
- AI chatbot greets Maria instantly (under 30 seconds)
- Answers her questions about emergency appointments
- Collects her contact info and insurance details
- Books her for tomorrow morning's first available slot
- Sends confirmation email and text automatically

Maria becomes your patient. All while you were asleep.

HERE'S HOW IT WORKS IN 3 STEPS:

1. Lead comes in (website, phone, Facebook, Google)
   Our AI engages immediately — no waiting, no missed opportunities.

2. AI qualifies and books
   Answers common questions, captures details, and schedules appointments directly on your calendar.

3. Automatic follow-up
   For leads who don't book immediately, our system follows up on Day 1, Day 3, and Day 5 until they convert or opt out.

Try the Live Demo: ${data.demoUrl}

Tomorrow, I'll share what real dentists are saying about their results.

Best,
The DentalLeadGenius Team

---
Unsubscribe: ${data.unsubscribeUrl}
  `
};

/**
 * Day 4: Social Proof + Trust
 */
export const day4SocialProof: EmailTemplate = {
  id: "nurture_day_4",
  emailType: "nurture",
  dayNumber: 4,
  sendDelayHours: 72,
  triggeredByLeadStatus: "new",
  subject: "150+ Dental Clinics Trust DentalLeadGenius",
  preheader: "See what dentists across North America are saying",
  
  generateHtml: (data) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
  
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #1e40af; font-size: 24px; margin: 0;">DentalLeadGenius</h1>
  </div>

  <h2 style="font-size: 22px; color: #111827; margin-bottom: 20px;">
    ${data.firstName}, don't just take our word for it...
  </h2>

  <p style="font-size: 16px; line-height: 1.6; color: #374151;">
    Over 150 dental practices across the USA and Canada are already using DentalLeadGenius to grow their patient base. Here's what some of them have to say:
  </p>

  <!-- Testimonial 1 -->
  <div style="background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #1e40af;">
    <p style="font-size: 15px; line-height: 1.6; color: #374151; margin: 0 0 10px 0; font-style: italic;">
      "We were skeptical about AI at first, but DentalLeadGenius proved us wrong. Our patient acquisition cost dropped by 40%, and we're seeing a steady stream of qualified leads every week."
    </p>
    <p style="font-size: 14px; color: #6b7280; margin: 0;">
      <strong>Dr. Jennifer Lee</strong> — Maple Ridge Dental Group, BC
    </p>
  </div>

  <!-- Testimonial 2 -->
  <div style="background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #1e40af;">
    <p style="font-size: 15px; line-height: 1.6; color: #374151; margin: 0 0 10px 0; font-style: italic;">
      "The automated follow-up system alone has recovered dozens of patients who would have otherwise gone to competitors. It's like having a tireless team member working 24/7."
    </p>
    <p style="font-size: 14px; color: #6b7280; margin: 0;">
      <strong>Dr. Robert Patel</strong> — Downtown Dental Studio, Victoria
    </p>
  </div>

  <!-- Testimonial 3 -->
  <div style="background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #1e40af;">
    <p style="font-size: 15px; line-height: 1.6; color: #374151; margin: 0 0 10px 0; font-style: italic;">
      "DentalLeadGenius helped us reactivate over 150 dormant patients in just three months. Many hadn't visited in years but came back thanks to the personalized outreach campaigns."
    </p>
    <p style="font-size: 14px; color: #6b7280; margin: 0;">
      <strong>Dr. David Kim</strong> — Summit Dental Care, Kamloops
    </p>
  </div>

  <div style="background: #ecfdf5; padding: 20px; margin: 25px 0; border-radius: 8px; text-align: center;">
    <p style="font-size: 18px; font-weight: bold; color: #047857; margin: 0 0 10px 0;">
      Our Track Record:
    </p>
    <p style="font-size: 16px; color: #047857; margin: 0;">
      150+ Clinics Served | 42% Avg. Appointment Increase | 98% Client Satisfaction
    </p>
  </div>

  <h3 style="font-size: 18px; color: #111827; margin: 25px 0 15px 0;">Why dentists trust us:</h3>

  <ul style="font-size: 16px; line-height: 1.8; color: #374151; padding-left: 20px;">
    <li><strong>HIPAA-friendly practices</strong> — Your patient data is secure</li>
    <li><strong>No long-term contracts</strong> — Cancel anytime, risk-free</li>
    <li><strong>48-hour setup</strong> — Get live faster than you'd expect</li>
    <li><strong>30-day money-back guarantee</strong> — No questions asked</li>
  </ul>

  <p style="font-size: 16px; line-height: 1.6; color: #374151;">
    Tomorrow, I'll send you one final message with a special opportunity. Stay tuned.
  </p>

  <p style="font-size: 16px; line-height: 1.6; color: #374151;">
    Cheers,<br/>
    <strong>The DentalLeadGenius Team</strong>
  </p>

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">
      <a href="${data.unsubscribeUrl}" style="color: #9ca3af;">Unsubscribe</a> | 
      DentalLeadGenius, Inc.
    </p>
  </div>
</body>
</html>
  `,
  
  generateText: (data) => `
${data.firstName}, don't just take our word for it...

Over 150 dental practices across the USA and Canada are already using DentalLeadGenius to grow their patient base. Here's what some of them have to say:

---

"We were skeptical about AI at first, but DentalLeadGenius proved us wrong. Our patient acquisition cost dropped by 40%, and we're seeing a steady stream of qualified leads every week."
— Dr. Jennifer Lee, Maple Ridge Dental Group, BC

---

"The automated follow-up system alone has recovered dozens of patients who would have otherwise gone to competitors. It's like having a tireless team member working 24/7."
— Dr. Robert Patel, Downtown Dental Studio, Victoria

---

"DentalLeadGenius helped us reactivate over 150 dormant patients in just three months. Many hadn't visited in years but came back thanks to the personalized outreach campaigns."
— Dr. David Kim, Summit Dental Care, Kamloops

---

OUR TRACK RECORD:
150+ Clinics Served | 42% Avg. Appointment Increase | 98% Client Satisfaction

WHY DENTISTS TRUST US:
- HIPAA-friendly practices — Your patient data is secure
- No long-term contracts — Cancel anytime, risk-free
- 48-hour setup — Get live faster than you'd expect
- 30-day money-back guarantee — No questions asked

Tomorrow, I'll send you one final message with a special opportunity. Stay tuned.

Cheers,
The DentalLeadGenius Team

---
Unsubscribe: ${data.unsubscribeUrl}
  `
};

/**
 * Day 5: Strong CTA + Urgency + Limited-Time Offer
 */
export const day5FinalCTA: EmailTemplate = {
  id: "nurture_day_5",
  emailType: "nurture",
  dayNumber: 5,
  sendDelayHours: 96,
  triggeredByLeadStatus: "new",
  subject: "Final Invitation: 20% Off Setup (48 Hours Only)",
  preheader: "Your exclusive offer expires soon — book your demo now",
  
  generateHtml: (data) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
  
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #1e40af; font-size: 24px; margin: 0;">DentalLeadGenius</h1>
  </div>

  <h2 style="font-size: 22px; color: #111827; margin-bottom: 20px;">
    ${data.firstName}, this is my final email...
  </h2>

  <p style="font-size: 16px; line-height: 1.6; color: #374151;">
    Over the past few days, I've shared:
  </p>

  <ul style="font-size: 16px; line-height: 1.8; color: #374151; padding-left: 20px;">
    <li>The hidden cost of slow follow-ups ($300,000+/year for many practices)</li>
    <li>How Dr. Chen added $127,000 in annual revenue</li>
    <li>How our AI receptionist works 24/7 to capture every lead</li>
    <li>Why 150+ dental practices trust DentalLeadGenius</li>
  </ul>

  <p style="font-size: 16px; line-height: 1.6; color: #374151;">
    Now it's decision time.
  </p>

  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; margin: 25px 0; border-radius: 12px; text-align: center;">
    <p style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0; opacity: 0.9;">
      Exclusive Offer • Expires in 48 Hours
    </p>
    <h3 style="font-size: 28px; margin: 0 0 15px 0;">
      20% OFF Your Setup Fee
    </h3>
    <p style="font-size: 16px; margin: 0 0 20px 0; opacity: 0.9;">
      Book your free demo in the next 48 hours and save up to $299 on implementation.
    </p>
    <a href="${data.demoUrl}" style="display: inline-block; background: white; color: #1e40af; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
      Claim My Discount →
    </a>
  </div>

  <p style="font-size: 16px; line-height: 1.6; color: #374151;">
    <strong>Here's what happens when you book:</strong>
  </p>

  <ol style="font-size: 16px; line-height: 1.8; color: #374151; padding-left: 20px;">
    <li>15-minute no-pressure demo with our team</li>
    <li>We analyze your current lead flow and show you exactly where you're losing patients</li>
    <li>You get a custom ROI projection for your practice</li>
    <li>If you decide to move forward, we'll have you live within 48 hours</li>
  </ol>

  <p style="font-size: 16px; line-height: 1.6; color: #374151;">
    No commitment. No credit card. Just a conversation about how to grow your practice.
  </p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${data.demoUrl}" style="display: inline-block; background: #1e40af; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
      Book My Free Demo Now →
    </a>
  </div>

  <p style="font-size: 16px; line-height: 1.6; color: #374151;">
    This is my last email in this series. If DentalLeadGenius isn't right for you right now, I completely understand. But if you're ready to stop losing patients to slow follow-ups, this is your moment.
  </p>

  <p style="font-size: 16px; line-height: 1.6; color: #374151;">
    To your success,<br/>
    <strong>The DentalLeadGenius Team</strong>
  </p>

  <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
    P.S. Remember — 78% of patients book with whoever responds first. How many are you losing today?
  </p>

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">
      <a href="${data.unsubscribeUrl}" style="color: #9ca3af;">Unsubscribe</a> | 
      DentalLeadGenius, Inc.
    </p>
  </div>
</body>
</html>
  `,
  
  generateText: (data) => `
${data.firstName}, this is my final email...

Over the past few days, I've shared:

- The hidden cost of slow follow-ups ($300,000+/year for many practices)
- How Dr. Chen added $127,000 in annual revenue
- How our AI receptionist works 24/7 to capture every lead
- Why 150+ dental practices trust DentalLeadGenius

Now it's decision time.

===========================================
EXCLUSIVE OFFER • EXPIRES IN 48 HOURS

20% OFF YOUR SETUP FEE

Book your free demo in the next 48 hours and save up to $299 on implementation.

Claim Your Discount: ${data.demoUrl}
===========================================

HERE'S WHAT HAPPENS WHEN YOU BOOK:

1. 15-minute no-pressure demo with our team
2. We analyze your current lead flow and show you exactly where you're losing patients
3. You get a custom ROI projection for your practice
4. If you decide to move forward, we'll have you live within 48 hours

No commitment. No credit card. Just a conversation about how to grow your practice.

Book Your Demo: ${data.demoUrl}

This is my last email in this series. If DentalLeadGenius isn't right for you right now, I completely understand. But if you're ready to stop losing patients to slow follow-ups, this is your moment.

To your success,
The DentalLeadGenius Team

P.S. Remember — 78% of patients book with whoever responds first. How many are you losing today?

---
Unsubscribe: ${data.unsubscribeUrl}
  `
};

/**
 * All 5-day nurture templates
 */
export const NURTURE_TEMPLATES: EmailTemplate[] = [
  day1PainAwareness,
  day2ROIStory,
  day3AIDemo,
  day4SocialProof,
  day5FinalCTA
];

/**
 * Get template by day number
 */
export function getNurtureTemplateByDay(dayNumber: number): EmailTemplate | undefined {
  return NURTURE_TEMPLATES.find(t => t.dayNumber === dayNumber);
}

/**
 * Get all nurture templates
 */
export function getAllNurtureTemplates(): EmailTemplate[] {
  return NURTURE_TEMPLATES;
}
