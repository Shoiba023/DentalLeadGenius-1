// 7-Day Nurture Email Templates for DentalLeadGenius
// Each email contains: subject, html, text (fallback)

export interface NurtureEmail {
  day: number;
  subject: string;
  html: string;
  text: string;
}

export const nurtureEmails: NurtureEmail[] = [
  // -------------------------------------------------------
  // DAY 1 — Welcome + Free Kit Delivery
  // -------------------------------------------------------
  {
    day: 1,
    subject: "Welcome! Your Free Dental Growth Kit is Inside 🦷✨",
    html: `
      <h2>Welcome to DentalLeadGenius!</h2>
      <p>Thank you for requesting your <strong>Free Dental Automation Kit</strong>.</p>
      <p>Your practice is now one step closer to:</p>
      <ul>
        <li>30% more appointments</li>
        <li>Instant AI responses to all patient inquiries</li>
        <li>Fully automated reminders + follow-ups</li>
      </ul>
      <p><a href="{{demoLink}}" style="font-size:18px;font-weight:bold;">Click here to download your kit</a></p>
      <p>More powerful insights are coming your way—stay tuned!</p>
    `,
    text: `
Welcome to DentalLeadGenius!

Your Free Dental Automation Kit is ready.

Click to download: {{demoLink}}

More insights are coming tomorrow!
    `
  },

  // -------------------------------------------------------
  // DAY 2 — Social Proof + Trust
  // -------------------------------------------------------
  {
    day: 2,
    subject: "How Clinics Added 40–60 Extra Appointments With Automation",
    html: `
      <h2>Real Clinics. Real Results.</h2>
      <p>Dentists using DentalLeadGenius report:</p>
      <ul>
        <li>40–60 new appointments every month</li>
        <li>70% decrease in missed calls</li>
        <li>Automatic follow-ups that run 24/7</li>
      </ul>
      <p>This is the power of AI + Automation.</p>
      <p><a href="{{demoLink}}">Click to see the live demo</a></p>
    `,
    text: `
Real clinics are adding 40–60 new appointments monthly using automation.

See the live demo: {{demoLink}}
    `
  },

  // -------------------------------------------------------
  // DAY 3 — AI Receptionist Demo
  // -------------------------------------------------------
  {
    day: 3,
    subject: "Meet Your 24/7 AI Receptionist 🤖",
    html: `
      <h2>Your Clinic's Hardest-Working Staff Member</h2>
      <p>This AI Receptionist:</p>
      <ul>
        <li>Answers instantly</li>
        <li>Books appointments automatically</li>
        <li>Handles missed calls</li>
        <li>Replies on SMS, Email & WhatsApp</li>
      </ul>
      <p>No hiring. No training. No sick days.</p>
      <p><a href="{{demoLink}}">Try the AI Receptionist</a></p>
    `,
    text: `
Meet your 24/7 AI Receptionist.

See how it answers instantly and books appointments: {{demoLink}}
    `
  },

  // -------------------------------------------------------
  // DAY 4 — Missed Calls Pain Point
  // -------------------------------------------------------
  {
    day: 4,
    subject: "How Many Patients Did You Lose Last Month?",
    html: `
      <h2>Missed Calls = Lost Patients</h2>
      <p>Most clinics lose 20–40 patients every month… silently.</p>
      <p>But yours don’t have to.</p>
      <p>AI follows up instantly — even after a missed call.</p>
      <p><a href="{{demoLink}}">Recover missed calls automatically</a></p>
    `,
    text: `
Most clinics lose 20–40 patients monthly due to missed calls.

Recover them automatically: {{demoLink}}
    `
  },

  // -------------------------------------------------------
  // DAY 5 — Limited Time Offer
  // -------------------------------------------------------
  {
    day: 5,
    subject: "Claim Your Limited-Time Automation Boost ⚡",
    html: `
      <h2>Your Automation Upgrade</h2>
      <p>For a limited time, new clinics get:</p>
      <ul>
        <li>Free AI receptionist setup</li>
        <li>Free 7-day nurture campaign installation</li>
        <li>50% off the first month</li>
      </ul>
      <p><a href="{{demoLink}}">Claim your upgrade</a></p>
    `,
    text: `
Limited-time automation upgrade available.

Claim your setup: {{demoLink}}
    `
  },

  // -------------------------------------------------------
  // DAY 6 — Book a Call
  // -------------------------------------------------------
  {
    day: 6,
    subject: "Want a 10-Minute Walkthrough? (Most Clinics Say Yes)",
    html: `
      <h2>Let's Walk Through Your Clinic's Growth Plan</h2>
      <p>In 10 minutes, we’ll show you:</p>
      <ul>
        <li>Where your clinic is losing revenue</li>
        <li>How automation can fix it instantly</li>
        <li>How many new bookings you can expect</li>
      </ul>
      <p><a href="{{demoLink}}">Book your walkthrough</a></p>
    `,
    text: `
Want a personalized growth plan?

Book your walkthrough: {{demoLink}}
    `
  },

  // -------------------------------------------------------
  // DAY 7 — Final Scarcity + Emotional Close
  // -------------------------------------------------------
  {
    day: 7,
    subject: "Last Chance — Your Automation Kit Expires Tonight",
    html: `
      <h2>This Is Your Final Reminder</h2>
      <p>Your access to the full automation kit expires tonight.</p>
      <p>If you're serious about growing your clinic, this is the moment.</p>
      <p><a href="{{demoLink}}">Activate your automation before it expires</a></p>
    `,
    text: `
Final reminder — your automation kit expires tonight.

Activate now: {{demoLink}}
    `
  }
];
