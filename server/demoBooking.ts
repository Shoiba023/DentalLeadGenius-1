/**
 * Demo Booking Service
 * 
 * Handles demo scheduling with:
 * - Available time slots generation
 * - Booking confirmations
 * - Automated reminders (24h, 1h before)
 * - Rescheduling and cancellation
 * - Follow-up after demo
 */

import { storage } from "./storage";
import { sendEmail, isEmailConfigured } from "./email";
import { SITE_NAME, SITE_URL, SUPPORT_EMAIL } from "../shared/config";
import type { Booking, Lead } from "@shared/schema";

// Demo booking configuration
export const DEMO_CONFIG = {
  DURATION_MINUTES: 30,
  WORKING_HOURS: { start: 9, end: 17 }, // 9 AM to 5 PM
  WORKING_DAYS: [1, 2, 3, 4, 5], // Monday to Friday
  TIMEZONE: "America/New_York",
  REMINDER_HOURS: [24, 1], // Send reminders 24h and 1h before
  MAX_BOOKINGS_PER_SLOT: 1,
  BOOKING_WINDOW_DAYS: 14, // How far in advance users can book
};

export interface TimeSlot {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  datetime: Date;
  available: boolean;
}

export interface DemoBookingData {
  name: string;
  email: string;
  phone?: string;
  clinicName: string;
  scheduledDate: string;
  scheduledTime: string;
  timezone?: string;
  notes?: string;
  leadId?: string;
  campaignId?: string;
}

/**
 * Generate available time slots for demo booking
 */
export function generateAvailableSlots(
  existingBookings: Booking[],
  daysAhead: number = DEMO_CONFIG.BOOKING_WINDOW_DAYS
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const now = new Date();
  const bookedSlots = new Set(
    existingBookings
      .filter(b => b.status !== "cancelled")
      .map(b => b.preferredTime || "")
  );

  for (let day = 1; day <= daysAhead; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() + day);
    
    // Skip weekends
    const dayOfWeek = date.getDay();
    if (!DEMO_CONFIG.WORKING_DAYS.includes(dayOfWeek)) {
      continue;
    }

    const dateStr = date.toISOString().split('T')[0];

    // Generate time slots for the day
    for (let hour = DEMO_CONFIG.WORKING_HOURS.start; hour < DEMO_CONFIG.WORKING_HOURS.end; hour++) {
      for (let minute of [0, 30]) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const slotKey = `${dateStr}T${timeStr}`;
        
        const slotDate = new Date(date);
        slotDate.setHours(hour, minute, 0, 0);

        slots.push({
          date: dateStr,
          time: timeStr,
          datetime: slotDate,
          available: !bookedSlots.has(slotKey),
        });
      }
    }
  }

  return slots;
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format time for display
 */
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Send demo booking confirmation email
 */
export async function sendDemoConfirmation(booking: DemoBookingData): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.log("[DemoBooking] Email not configured, skipping confirmation");
    return false;
  }

  const scheduledDate = new Date(`${booking.scheduledDate}T${booking.scheduledTime}`);
  const formattedDate = formatDate(scheduledDate);
  const formattedTime = formatTime(booking.scheduledTime);
  const calendarLink = generateCalendarLink(booking, scheduledDate);
  const rescheduleLink = `${SITE_URL}/demo/reschedule?email=${encodeURIComponent(booking.email)}`;
  const cancelLink = `${SITE_URL}/demo/cancel?email=${encodeURIComponent(booking.email)}`;

  try {
    await sendEmail({
      to: booking.email,
      subject: `Demo Confirmed: ${formattedDate} at ${formattedTime} - ${SITE_NAME}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Your Demo is Confirmed!</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p>Hi ${booking.name.split(' ')[0]},</p>
            
            <p>Great news! Your demo with ${SITE_NAME} is confirmed. We're excited to show you how we can help grow your dental practice.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1e40af;">Demo Details</h3>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${formattedTime} (Eastern Time)</p>
              <p style="margin: 5px 0;"><strong>Duration:</strong> ${DEMO_CONFIG.DURATION_MINUTES} minutes</p>
              <p style="margin: 5px 0;"><strong>Practice:</strong> ${booking.clinicName}</p>
            </div>
            
            <p style="text-align: center; margin: 25px 0;">
              <a href="${calendarLink}" style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-right: 10px;">Add to Calendar</a>
            </p>
            
            <h4>What to Expect:</h4>
            <ul>
              <li>Personalized walkthrough of our AI lead generation</li>
              <li>Live demo of the patient chatbot</li>
              <li>Review of automated follow-up sequences</li>
              <li>Q&A and custom pricing discussion</li>
            </ul>
            
            <p>We'll send you a reminder email 24 hours and 1 hour before your demo.</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
            
            <p style="color: #6b7280; font-size: 14px;">
              Need to change your appointment?<br/>
              <a href="${rescheduleLink}" style="color: #1e40af;">Reschedule</a> | 
              <a href="${cancelLink}" style="color: #dc2626;">Cancel</a>
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              Questions? Reply to this email or contact us at ${SUPPORT_EMAIL}
            </p>
          </div>
        </div>
      `,
      text: `Your Demo is Confirmed!

Hi ${booking.name.split(' ')[0]},

Great news! Your demo with ${SITE_NAME} is confirmed.

Demo Details:
- Date: ${formattedDate}
- Time: ${formattedTime} (Eastern Time)
- Duration: ${DEMO_CONFIG.DURATION_MINUTES} minutes
- Practice: ${booking.clinicName}

What to Expect:
- Personalized walkthrough of our AI lead generation
- Live demo of the patient chatbot
- Review of automated follow-up sequences
- Q&A and custom pricing discussion

We'll send you a reminder 24 hours and 1 hour before your demo.

Need to change your appointment?
Reschedule: ${rescheduleLink}
Cancel: ${cancelLink}

Questions? Reply to this email or contact us at ${SUPPORT_EMAIL}`,
    });

    console.log(`[DemoBooking] Confirmation email sent to ${booking.email}`);
    return true;
  } catch (error) {
    console.error("[DemoBooking] Failed to send confirmation:", error);
    return false;
  }
}

/**
 * Send demo reminder email
 */
export async function sendDemoReminder(
  booking: Booking,
  hoursUntilDemo: number
): Promise<boolean> {
  if (!isEmailConfigured() || !booking.email) {
    return false;
  }

  const scheduledDate = booking.preferredTime 
    ? new Date(booking.preferredTime)
    : null;
  
  if (!scheduledDate) {
    return false;
  }

  const formattedDate = formatDate(scheduledDate);
  const formattedTime = scheduledDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const timeUntil = hoursUntilDemo === 1 ? "in 1 hour" : "tomorrow";
  const urgencyColor = hoursUntilDemo === 1 ? "#dc2626" : "#f59e0b";

  try {
    await sendEmail({
      to: booking.email,
      subject: `Reminder: Your Demo is ${timeUntil} - ${SITE_NAME}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${urgencyColor}; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="color: white; margin: 0;">Demo Reminder: ${timeUntil.charAt(0).toUpperCase() + timeUntil.slice(1)}!</h2>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p>Hi ${booking.ownerName.split(' ')[0]},</p>
            
            <p>Just a friendly reminder that your demo with ${SITE_NAME} is coming up ${timeUntil}.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${formattedTime} (Eastern Time)</p>
            </div>
            
            <p>We're looking forward to showing you how ${SITE_NAME} can transform your dental practice!</p>
            
            <p>Best regards,<br/><strong>The ${SITE_NAME} Team</strong></p>
          </div>
        </div>
      `,
      text: `Demo Reminder: ${timeUntil}!

Hi ${booking.ownerName.split(' ')[0]},

Just a friendly reminder that your demo with ${SITE_NAME} is coming up ${timeUntil}.

Date: ${formattedDate}
Time: ${formattedTime} (Eastern Time)

We're looking forward to showing you how ${SITE_NAME} can transform your dental practice!

Best regards,
The ${SITE_NAME} Team`,
    });

    console.log(`[DemoBooking] ${hoursUntilDemo}h reminder sent to ${booking.email}`);
    return true;
  } catch (error) {
    console.error("[DemoBooking] Failed to send reminder:", error);
    return false;
  }
}

/**
 * Send post-demo follow-up email
 */
export async function sendPostDemoFollowUp(booking: Booking): Promise<boolean> {
  if (!isEmailConfigured() || !booking.email) {
    return false;
  }

  const pricingLink = `${SITE_URL}/pricing`;
  const calendarLink = `${SITE_URL}/demo`;

  try {
    await sendEmail({
      to: booking.email,
      subject: `Thank You for Your Demo - Next Steps with ${SITE_NAME}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Thank You for Your Time!</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p>Hi ${booking.ownerName.split(' ')[0]},</p>
            
            <p>Thank you for taking the time to see ${SITE_NAME} in action! I hope our demo gave you a clear picture of how we can help ${booking.clinicName} grow.</p>
            
            <h3 style="color: #1e40af;">What We Discussed:</h3>
            <ul>
              <li>AI-powered lead generation for your local area</li>
              <li>24/7 patient chatbot to capture and convert leads</li>
              <li>Automated follow-up sequences to boost conversions</li>
              <li>Real-time analytics and ROI tracking</li>
            </ul>
            
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; font-weight: bold;">Special Offer: Start Today!</p>
              <p style="margin: 10px 0 0 0;">Sign up within 48 hours and get your first month at 50% off.</p>
            </div>
            
            <p style="text-align: center; margin: 25px 0;">
              <a href="${pricingLink}" style="display: inline-block; background: #1e40af; color: white; padding: 15px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">View Pricing & Get Started</a>
            </p>
            
            <h4>Questions?</h4>
            <p>I'm here to help! Simply reply to this email, and I'll get back to you within 24 hours.</p>
            
            <p>Looking forward to helping ${booking.clinicName} succeed!</p>
            
            <p>Best regards,<br/><strong>The ${SITE_NAME} Team</strong></p>
          </div>
        </div>
      `,
      text: `Thank You for Your Time!

Hi ${booking.ownerName.split(' ')[0]},

Thank you for taking the time to see ${SITE_NAME} in action! I hope our demo gave you a clear picture of how we can help ${booking.clinicName} grow.

What We Discussed:
- AI-powered lead generation for your local area
- 24/7 patient chatbot to capture and convert leads
- Automated follow-up sequences to boost conversions
- Real-time analytics and ROI tracking

Special Offer: Start Today!
Sign up within 48 hours and get your first month at 50% off.

View Pricing: ${pricingLink}

Questions? I'm here to help! Simply reply to this email.

Looking forward to helping ${booking.clinicName} succeed!

Best regards,
The ${SITE_NAME} Team`,
    });

    console.log(`[DemoBooking] Post-demo follow-up sent to ${booking.email}`);
    return true;
  } catch (error) {
    console.error("[DemoBooking] Failed to send post-demo follow-up:", error);
    return false;
  }
}

/**
 * Generate Google Calendar link
 */
function generateCalendarLink(booking: DemoBookingData, startDate: Date): string {
  const endDate = new Date(startDate.getTime() + DEMO_CONFIG.DURATION_MINUTES * 60 * 1000);
  
  const formatForCalendar = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z';
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${SITE_NAME} Demo - ${booking.clinicName}`,
    dates: `${formatForCalendar(startDate)}/${formatForCalendar(endDate)}`,
    details: `Demo with ${SITE_NAME} to explore AI-powered lead generation for your dental practice.`,
    location: 'Virtual (link will be provided)',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Check for demos needing reminders and send them
 */
export async function processScheduledReminders(): Promise<{
  sent: number;
  errors: number;
}> {
  const results = { sent: 0, errors: 0 };
  
  try {
    const allBookings = await storage.getAllBookings();
    const pendingBookings = allBookings.filter(b => 
      b.status === "confirmed" && 
      b.preferredTime
    );

    const now = new Date();

    for (const booking of pendingBookings) {
      const scheduledDate = new Date(booking.preferredTime!);
      const hoursUntil = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Check if we should send a reminder
      for (const reminderHour of DEMO_CONFIG.REMINDER_HOURS) {
        // Send reminder if within 30 minutes of the reminder time
        if (hoursUntil > (reminderHour - 0.5) && hoursUntil <= (reminderHour + 0.5)) {
          const success = await sendDemoReminder(booking, reminderHour);
          if (success) {
            results.sent++;
          } else {
            results.errors++;
          }
        }
      }
    }
  } catch (error) {
    console.error("[DemoBooking] Error processing reminders:", error);
  }

  return results;
}

/**
 * Get demo booking statistics for a specific clinic
 */
export async function getDemoBookingStats(clinicId?: string): Promise<{
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  conversionRate: number;
  averageBookingLeadTime: number;
}> {
  // Get bookings filtered by clinic if provided
  const allBookings = clinicId 
    ? await storage.getBookingsByClinic(clinicId)
    : await storage.getAllBookings();
  
  const stats = {
    total: allBookings.length,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    conversionRate: 0,
    averageBookingLeadTime: 0,
  };

  for (const booking of allBookings) {
    switch (booking.status) {
      case "pending":
        stats.pending++;
        break;
      case "confirmed":
        stats.confirmed++;
        break;
      case "completed":
        stats.completed++;
        break;
      case "cancelled":
        stats.cancelled++;
        break;
    }
  }

  // Calculate conversion rate (completed / total non-cancelled)
  const validBookings = stats.total - stats.cancelled;
  stats.conversionRate = validBookings > 0 
    ? (stats.completed / validBookings) * 100 
    : 0;

  return stats;
}

/**
 * Update lead status when demo is booked
 */
export async function updateLeadForDemo(leadId: string): Promise<void> {
  try {
    await storage.updateLead(leadId, {
      status: "demo_booked",
    });
    console.log(`[DemoBooking] Lead ${leadId} updated to demo_booked status`);
  } catch (error) {
    console.error("[DemoBooking] Failed to update lead status:", error);
  }
}
