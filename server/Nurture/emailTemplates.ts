// 7-Day Nurture Email Templates for DentalLeadGenius
// Each email contains: subject, html, text (fallback)

export interface NurtureEmail {
  day: number;
  subject: string;
  html: string;
  text: string;
}

export const nurtureEmails: NurtureEmail[] = [
  // ======================================================
  // DAY 1 – Welcome + Free Kit Delivery
  // ======================================================
  {
    day: 1,
    subject: "Welcome! Your Free Dental Growth Kit is Inside 🦷✨",
    html: `
      <h2>Welcome to DentalLeadGenius!</h2>
      <p>Thank you for requesting your <strong>Free Dental Automation Kit</strong>.</p>
      <p>Your practice is now one step closer to:</p>
      <ul>
        <li>30% more appointments</li>
        <li>Instant AI responses to all patient enquiries</li>
        <li>Fully automated reminders + follow-ups</li>
      </ul>
      <p><a href="{{demoLink}}" style="font-size:18px; font-weight:bold;">Click here to download your kit</a></p>
      <p>More powerful insights are coming your way – stay tuned!</p>
    `,
    text: `
Welcome to DentalLeadGenius!

Your Free Dental Automation Kit is ready.

Click to download: {{demoLink}}

More insights are coming tomorrow!
    `
  },

  // ======================================================
  // DAY 2 – Social Proof + Trust
  // ======================================================
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

  // ======================================================
  // DAY 3 – AI Receptionist Demo
  // ======================================================
  {
    day: 3,
    subject: "Meet Your 24/7 AI Receptionist 🤖",
    html: `
      <h2>Your Clinic’s Hardest-Working Staff Member</h2>
      <p>This AI Receptionist:</p>
      <ul>
        <li>Answers instantly</li>
        <li>Books appointments automatically</li>
        <li>Handles FAQs without bothering your front desk</li>
      </ul>
      <p><a href="{{demoLink}}">Watch how the AI Receptionist works in real time</a></p>
    `,
    text: `
Your 24/7 AI Receptionist is ready to take calls and book patients.

Watch the live demo: {{demoLink}}
    `
  },

  // ======================================================
  // DAY 4 – No-Show + Cancellation Saver
  // ======================================================
  {
    day: 4,
    subject: "Stop No-Shows From Silently Killing Your Schedule",
    html: `
      <h2>Recover Lost Revenue From No-Shows</h2>
      <p>Our automation flow:</p>
      <ul>
        <li>Sends friendly reminders before every visit</li>
        <li>Re-engages missed and cancelled appointments</li>
        <li>Fills empty slots with warm leads automatically</li>
      </ul>
      <p><a href="{{demoLink}}">See how the no-show recovery sequence works</a></p>
    `,
    text: `
No-show and cancelled appointments don’t need to be lost revenue.

See the recovery sequence: {{demoLink}}
    `
  },

  // ======================================================
  // DAY 5 – Missed Call Saver + Lead Capture
  // ======================================================
  {
    day: 5,
    subject: "Turn Every Missed Call Into a Potential Booking ☎️",
    html: `
      <h2>Never Lose a Patient Because You Were Busy</h2>
      <p>When a call is missed, DentalLeadGenius:</p>
      <ul>
        <li>Texts the patient back within seconds</li>
        <li>Answers common questions with AI</li>
        <li>Offers to book an appointment right away</li>
      </ul>
      <p><a href="{{demoLink}}">Watch the missed-call recovery in action</a></p>
    `,
    text: `
Every missed call can be turned into a conversation and a possible booking.

See how it works: {{demoLink}}
    `
  },

  // ======================================================
  // DAY 6 – ROI & Numbers
  // ======================================================
  {
    day: 6,
    subject: "What Kind of ROI Can Your Clinic Expect?",
    html: `
      <h2>Numbers That Matter to Your Practice</h2>
      <p>Clinics using DentalLeadGenius typically see:</p>
      <ul>
        <li>3–5x return on their monthly investment</li>
        <li>Higher case acceptance from better follow-up</li>
        <li>More predictable, stable monthly revenue</li>
      </ul>
      <p><a href="{{demoLink}}">Use our simple ROI calculator for your clinic</a></p>
    `,
    text: `
Clinics see on average 3–5x return on their automation investment.

Try the ROI calculator: {{demoLink}}
    `
  },

  // ======================================================
  // DAY 7 – Call to Action / Strategy Session
  // ======================================================
  {
    day: 7,
    subject: "Ready to See This Working for Your Clinic Next Week?",
    html: `
      <h2>Let’s Map Out Your Automation Plan</h2>
      <p>On a short strategy call we will:</p>
      <ul>
        <li>Review your current lead + booking process</li>
        <li>Identify the fastest wins automation can bring</li>
        <li>Show you exactly how DentalLeadGenius plugs in</li>
      </ul>
      <p><a href="{{demoLink}}">Click here to book your strategy session</a></p>
      <p>There’s no obligation – this is simply to see if it’s a fit for your clinic.</p>
    `,
    text: `
Want to see this working for your clinic?

Book a short strategy session: {{demoLink}}
    `
  }
];

// ======================================================
// Helper: get template by day (1–7)
// If day is invalid, fallback to the last email in the sequence.
// ======================================================
export function getNurtureTemplate(day: number): NurtureEmail {
  const found = nurtureEmails.find((t) => t.day === day);
  if (found) {
    return found;
  }

  // fallback – last email in the array
  return nurtureEmails[nurtureEmails.length - 1];
}
