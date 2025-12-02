import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (IMPORTANT: mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (supports both Replit Auth and email/password)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: varchar("password"), // For email/password auth (hashed)
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("clinic").notNull(), // admin, clinic
  isAdmin: boolean("is_admin").default(false).notNull(),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionTier: varchar("subscription_tier"), // essential, growth, elite
  subscriptionStatus: varchar("subscription_status"), // active, past_due, canceled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["admin", "clinic"]).default("clinic"),
  clinicId: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;

// Leads table
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: varchar("clinic_id").references(() => clinics.id), // Nullable for platform-level leads (demo requests)
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  city: text("city"),
  state: text("state"),
  country: text("country").default("USA"),
  notes: text("notes"),
  googleMapsUrl: text("google_maps_url"),
  websiteUrl: text("website_url"),
  status: text("status").default("new").notNull(), // new, contacted, replied, demo_booked, won, lost
  contactedAt: timestamp("contacted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

// Clinics table
export const clinics = pgTable("clinics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  brandColor: text("brand_color").default("#3B82F6"),
  ownerId: varchar("owner_id").references(() => users.id),
  // Onboarding fields
  address: text("address"),
  phone: text("phone"),
  website: text("website"),
  timezone: text("timezone").default("America/New_York"),
  businessHours: text("business_hours"),
  services: text("services").array(),
  // Integration settings
  emailProvider: text("email_provider"), // gmail, resend, sendgrid
  smsEnabled: boolean("sms_enabled").default(false),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertClinicSchema = createInsertSchema(clinics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertClinic = z.infer<typeof insertClinicSchema>;
export type Clinic = typeof clinics.$inferSelect;

// Clinic users junction table (multi-tenant support)
export const clinicUsers = pgTable("clinic_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: varchar("clinic_id").notNull().references(() => clinics.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: text("role").default("member").notNull(), // owner, admin, member
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClinicUserSchema = createInsertSchema(clinicUsers).omit({
  id: true,
  createdAt: true,
});

export type InsertClinicUser = z.infer<typeof insertClinicUserSchema>;
export type ClinicUser = typeof clinicUsers.$inferSelect;

// Demo bookings table - INSTANT DELIVERY (minimal required fields)
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: varchar("clinic_id").references(() => clinics.id), // Optional for legacy bookings
  clinicName: text("clinic_name").notNull(),
  ownerName: text("owner_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"), // Optional - instant access doesn't require phone
  state: text("state"),
  preferredTime: text("preferred_time"),
  notes: text("notes"),
  status: text("status").default("pending").notNull(), // pending, confirmed, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

// Chatbot threads table
export const chatbotThreads = pgTable("chatbot_threads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // sales, patient
  clinicId: varchar("clinic_id").references(() => clinics.id),
  visitorEmail: text("visitor_email"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertChatbotThreadSchema = createInsertSchema(chatbotThreads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertChatbotThread = z.infer<typeof insertChatbotThreadSchema>;
export type ChatbotThread = typeof chatbotThreads.$inferSelect;

// Chatbot messages table
export const chatbotMessages = pgTable("chatbot_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id").notNull().references(() => chatbotThreads.id),
  role: text("role").notNull(), // user, assistant
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChatbotMessageSchema = createInsertSchema(chatbotMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertChatbotMessage = z.infer<typeof insertChatbotMessageSchema>;
export type ChatbotMessage = typeof chatbotMessages.$inferSelect;

// Outreach campaigns table
// Campaign types: email, sms, whatsapp, facebook_post, instagram_post, youtube_post, tiktok_caption
// Status: draft, ready, active, paused, completed, archived
export const outreachCampaigns = pgTable("outreach_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: varchar("clinic_id").notNull().references(() => clinics.id), // Multi-tenant isolation
  name: text("name").notNull(),
  type: text("type").notNull(), // email, sms, whatsapp, facebook_post, instagram_post, youtube_post, tiktok_caption
  subject: text("subject"),
  message: text("message").notNull(),
  status: text("status").default("draft").notNull(), // draft, ready, active, paused, completed, archived
  dailyLimit: integer("daily_limit").default(50),
  sentToday: integer("sent_today").default(0),
  totalSent: integer("total_sent").default(0),
  // Social media specific fields
  targetUrl: text("target_url"), // Landing page or clinic page URL
  mediaUrl: text("media_url"), // Optional image/video URL for the post
  hashtags: text("hashtags"), // Comma-separated hashtags
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOutreachCampaignSchema = createInsertSchema(outreachCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  sentToday: true,
  totalSent: true,
});

export type InsertOutreachCampaign = z.infer<typeof insertOutreachCampaignSchema>;
export type OutreachCampaign = typeof outreachCampaigns.$inferSelect;

// Patient bookings table (for clinic subpages)
export const patientBookings = pgTable("patient_bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: varchar("clinic_id").notNull().references(() => clinics.id),
  patientName: text("patient_name").notNull(),
  patientEmail: text("patient_email").notNull(),
  patientPhone: text("patient_phone").notNull(),
  appointmentType: text("appointment_type"),
  preferredDate: text("preferred_date"),
  preferredTime: text("preferred_time"),
  notes: text("notes"),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPatientBookingSchema = createInsertSchema(patientBookings).omit({
  id: true,
  createdAt: true,
});

export type InsertPatientBooking = z.infer<typeof insertPatientBookingSchema>;
export type PatientBooking = typeof patientBookings.$inferSelect;

// Automated follow-up sequences table
export const sequences = pgTable("sequences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: varchar("clinic_id").notNull().references(() => clinics.id), // Multi-tenant isolation
  name: text("name").notNull(),
  description: text("description"),
  sequenceType: text("sequence_type").default("custom").notNull(), // new_lead, missed_call, no_show, appointment_reminder, review_request, custom
  status: text("status").default("draft").notNull(), // draft, active, paused
  ownerId: varchar("owner_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSequenceSchema = createInsertSchema(sequences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSequence = z.infer<typeof insertSequenceSchema>;
export type Sequence = typeof sequences.$inferSelect;

// Sequence steps table (individual steps in a sequence)
export const sequenceSteps = pgTable("sequence_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sequenceId: varchar("sequence_id").notNull().references(() => sequences.id),
  stepOrder: integer("step_order").notNull(),
  channel: text("channel").notNull(), // email, sms, whatsapp
  subject: text("subject"), // for email
  message: text("message").notNull(),
  delayDays: integer("delay_days").default(0).notNull(), // days to wait after previous step
  delayHours: integer("delay_hours").default(0).notNull(), // hours to wait after previous step
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSequenceStepSchema = createInsertSchema(sequenceSteps).omit({
  id: true,
  createdAt: true,
});

export type InsertSequenceStep = z.infer<typeof insertSequenceStepSchema>;
export type SequenceStep = typeof sequenceSteps.$inferSelect;

// Sequence enrollments table (tracks leads enrolled in sequences)
export const sequenceEnrollments = pgTable("sequence_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sequenceId: varchar("sequence_id").notNull().references(() => sequences.id),
  leadId: varchar("lead_id").notNull().references(() => leads.id),
  currentStepOrder: integer("current_step_order").default(0).notNull(),
  status: text("status").default("active").notNull(), // active, paused, completed, cancelled
  nextSendAt: timestamp("next_send_at"),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertSequenceEnrollmentSchema = createInsertSchema(sequenceEnrollments).omit({
  id: true,
  enrolledAt: true,
  completedAt: true,
});

export type InsertSequenceEnrollment = z.infer<typeof insertSequenceEnrollmentSchema>;
export type SequenceEnrollment = typeof sequenceEnrollments.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ownedClinics: many(clinics),
  clinicMemberships: many(clinicUsers),
}));

export const clinicsRelations = relations(clinics, ({ one, many }) => ({
  owner: one(users, {
    fields: [clinics.ownerId],
    references: [users.id],
  }),
  members: many(clinicUsers),
  leads: many(leads),
  sequences: many(sequences),
  outreachCampaigns: many(outreachCampaigns),
  chatbotThreads: many(chatbotThreads),
  patientBookings: many(patientBookings),
}));

export const clinicUsersRelations = relations(clinicUsers, ({ one }) => ({
  clinic: one(clinics, {
    fields: [clinicUsers.clinicId],
    references: [clinics.id],
  }),
  user: one(users, {
    fields: [clinicUsers.userId],
    references: [users.id],
  }),
}));

export const chatbotThreadsRelations = relations(chatbotThreads, ({ one, many }) => ({
  clinic: one(clinics, {
    fields: [chatbotThreads.clinicId],
    references: [clinics.id],
  }),
  messages: many(chatbotMessages),
}));

export const chatbotMessagesRelations = relations(chatbotMessages, ({ one }) => ({
  thread: one(chatbotThreads, {
    fields: [chatbotMessages.threadId],
    references: [chatbotThreads.id],
  }),
}));

export const patientBookingsRelations = relations(patientBookings, ({ one }) => ({
  clinic: one(clinics, {
    fields: [patientBookings.clinicId],
    references: [clinics.id],
  }),
}));

export const sequencesRelations = relations(sequences, ({ one, many }) => ({
  clinic: one(clinics, {
    fields: [sequences.clinicId],
    references: [clinics.id],
  }),
  owner: one(users, {
    fields: [sequences.ownerId],
    references: [users.id],
  }),
  steps: many(sequenceSteps),
  enrollments: many(sequenceEnrollments),
}));

export const outreachCampaignsRelations = relations(outreachCampaigns, ({ one }) => ({
  clinic: one(clinics, {
    fields: [outreachCampaigns.clinicId],
    references: [clinics.id],
  }),
}));

export const sequenceStepsRelations = relations(sequenceSteps, ({ one }) => ({
  sequence: one(sequences, {
    fields: [sequenceSteps.sequenceId],
    references: [sequences.id],
  }),
}));

export const sequenceEnrollmentsRelations = relations(sequenceEnrollments, ({ one }) => ({
  sequence: one(sequences, {
    fields: [sequenceEnrollments.sequenceId],
    references: [sequences.id],
  }),
  lead: one(leads, {
    fields: [sequenceEnrollments.leadId],
    references: [leads.id],
  }),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  clinic: one(clinics, {
    fields: [leads.clinicId],
    references: [clinics.id],
  }),
  sequenceEnrollments: many(sequenceEnrollments),
}));

// Demo access tokens table (for email-gated demo access)
export const demoAccessTokens = pgTable("demo_access_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  clinicName: text("clinic_name"),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDemoAccessTokenSchema = createInsertSchema(demoAccessTokens).omit({
  id: true,
  createdAt: true,
});

export type InsertDemoAccessToken = z.infer<typeof insertDemoAccessTokenSchema>;
export type DemoAccessToken = typeof demoAccessTokens.$inferSelect;

// Onboarding progress table - tracks 4-stage onboarding workflow
export const onboardingProgress = pgTable("onboarding_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: varchar("clinic_id").notNull().references(() => clinics.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  // Stage 1: Welcome
  welcomeCompleted: boolean("welcome_completed").default(false).notNull(),
  welcomeCompletedAt: timestamp("welcome_completed_at"),
  welcomeEmailSent: boolean("welcome_email_sent").default(false).notNull(),
  
  // Stage 2: Clinic Setup
  setupCompleted: boolean("setup_completed").default(false).notNull(),
  setupCompletedAt: timestamp("setup_completed_at"),
  clinicAddress: text("clinic_address"),
  clinicPhone: text("clinic_phone"),
  clinicWebsite: text("clinic_website"),
  clinicTimezone: text("clinic_timezone").default("America/New_York"),
  businessHours: jsonb("business_hours"),
  services: text("services").array(),
  
  // Stage 3: AI Chatbot Activation
  chatbotCompleted: boolean("chatbot_completed").default(false).notNull(),
  chatbotCompletedAt: timestamp("chatbot_completed_at"),
  chatbotEnabled: boolean("chatbot_enabled").default(false).notNull(),
  chatbotGreeting: text("chatbot_greeting"),
  chatbotTone: text("chatbot_tone").default("professional"), // professional, friendly, casual
  chatbotFocusServices: text("chatbot_focus_services").array(),
  
  // Stage 4: Growth Optimization
  optimizationCompleted: boolean("optimization_completed").default(false).notNull(),
  optimizationCompletedAt: timestamp("optimization_completed_at"),
  autoFollowupEnabled: boolean("auto_followup_enabled").default(false).notNull(),
  leadScoringEnabled: boolean("lead_scoring_enabled").default(false).notNull(),
  reviewRequestsEnabled: boolean("review_requests_enabled").default(false).notNull(),
  referralProgramEnabled: boolean("referral_program_enabled").default(false).notNull(),
  targetLeadsPerMonth: integer("target_leads_per_month").default(50),
  
  // Overall status
  currentStage: integer("current_stage").default(1).notNull(), // 1-4
  completedAt: timestamp("completed_at"), // when all 4 stages done
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOnboardingProgressSchema = createInsertSchema(onboardingProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOnboardingProgress = z.infer<typeof insertOnboardingProgressSchema>;
export type OnboardingProgress = typeof onboardingProgress.$inferSelect;

// Onboarding email templates table
export const onboardingEmails = pgTable("onboarding_emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stage: integer("stage").notNull(), // 1-4
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content").notNull(),
  triggerType: text("trigger_type").notNull(), // stage_start, stage_complete, reminder
  delayHours: integer("delay_hours").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOnboardingEmailSchema = createInsertSchema(onboardingEmails).omit({
  id: true,
  createdAt: true,
});

export type InsertOnboardingEmail = z.infer<typeof insertOnboardingEmailSchema>;
export type OnboardingEmail = typeof onboardingEmails.$inferSelect;

// Onboarding email logs table - tracks sent emails
export const onboardingEmailLogs = pgTable("onboarding_email_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  onboardingId: varchar("onboarding_id").notNull().references(() => onboardingProgress.id),
  emailTemplateId: varchar("email_template_id").notNull().references(() => onboardingEmails.id),
  recipientEmail: text("recipient_email").notNull(),
  subject: text("subject").notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
  status: text("status").default("sent").notNull(), // sent, delivered, opened, clicked, failed
});

export const insertOnboardingEmailLogSchema = createInsertSchema(onboardingEmailLogs).omit({
  id: true,
  sentAt: true,
});

export type InsertOnboardingEmailLog = z.infer<typeof insertOnboardingEmailLogSchema>;
export type OnboardingEmailLog = typeof onboardingEmailLogs.$inferSelect;

// Onboarding relations
export const onboardingProgressRelations = relations(onboardingProgress, ({ one, many }) => ({
  clinic: one(clinics, {
    fields: [onboardingProgress.clinicId],
    references: [clinics.id],
  }),
  user: one(users, {
    fields: [onboardingProgress.userId],
    references: [users.id],
  }),
  emailLogs: many(onboardingEmailLogs),
}));

export const onboardingEmailLogsRelations = relations(onboardingEmailLogs, ({ one }) => ({
  onboarding: one(onboardingProgress, {
    fields: [onboardingEmailLogs.onboardingId],
    references: [onboardingProgress.id],
  }),
  emailTemplate: one(onboardingEmails, {
    fields: [onboardingEmailLogs.emailTemplateId],
    references: [onboardingEmails.id],
  }),
}));
