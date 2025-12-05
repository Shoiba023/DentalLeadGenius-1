import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  uniqueIndex,
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

// Leads table - Campaign-ready with deduplication support
// syncStatus: pending (awaiting sync), synced (successfully imported), errored (sync failed), disabled (opt-out)
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: varchar("clinic_id").references(() => clinics.id), // Nullable for platform-level leads (demo requests)
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"), // Full street address
  city: text("city"),
  state: text("state"),
  country: text("country").default("USA"),
  notes: text("notes"),
  googleMapsUrl: text("google_maps_url"), // Primary dedupe key when present
  websiteUrl: text("website_url"),
  rating: text("rating"), // Google rating (e.g., "4.5", "4.8") from DentalMapsHelper
  reviewCount: integer("review_count"), // Number of Google reviews
  // Campaign readiness fields
  source: text("source").default("manual"), // maps-helper, manual-import, demo-request, etc.
  marketingOptIn: boolean("marketing_opt_in").default(false),
  tags: text("tags").array(), // For filtering/segmentation
  status: text("status").default("new").notNull(), // new, contacted, replied, demo_booked, won, lost
  contactedAt: timestamp("contacted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastImportedAt: timestamp("last_imported_at"), // Track when lead was last synced via import
  // DentalMapsHelper sync tracking
  syncStatus: text("sync_status").default("synced").notNull(), // pending, synced, errored, disabled
  externalSourceId: text("external_source_id"), // External system identifier (e.g., DentalMapsHelper ID)
  syncError: text("sync_error"), // Error message if sync failed
  lastSyncedAt: timestamp("last_synced_at"), // When lead was last successfully synced
}, (table) => ({
  // Unique index on googleMapsUrl for primary deduplication (nullable-safe)
  googleMapsUrlIdx: uniqueIndex("leads_google_maps_url_unique").on(table.googleMapsUrl).where(sql`google_maps_url IS NOT NULL`),
  // Index on source for quick filtering of imported leads
  sourceIdx: index("leads_source_idx").on(table.source),
  // Index on email for secondary dedup lookups
  emailIdx: index("leads_email_idx").on(table.email),
  // Index on syncStatus for filtering campaign-ready leads
  syncStatusIdx: index("leads_sync_status_idx").on(table.syncStatus),
  // Index on clinicId for multi-tenant queries
  clinicIdIdx: index("leads_clinic_id_idx").on(table.clinicId),
}));

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

// ========================================
// External API Types (for lead import)
// ========================================

// Payload schema for external lead import with strong validation
export const externalLeadPayloadSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  email: z.string().email("Invalid email format").max(255).optional().nullable(),
  phone: z.string().max(50, "Phone too long").optional().nullable(),
  address: z.string().max(500, "Address too long").optional().nullable(),
  city: z.string().max(100, "City name too long").optional().nullable(),
  state: z.string().max(100, "State name too long").optional().nullable(),
  country: z.string().max(100, "Country name too long").optional().nullable().default("USA"),
  googleMapsUrl: z.string().url("Invalid Google Maps URL").max(2000).optional().nullable(),
  websiteUrl: z.string().url("Invalid website URL").max(2000).optional().nullable(),
  rating: z.string().max(10).optional().nullable(), // Google rating (e.g., "4.5")
  reviewCount: z.number().int().min(0).optional().nullable(), // Number of Google reviews
  notes: z.string().max(5000, "Notes too long").optional().nullable(),
  source: z.string().max(50).optional().default("maps-helper"),
  marketingOptIn: z.boolean().optional().default(false),
  tags: z.array(z.string().max(50)).max(20).optional(),
  status: z.enum(["new", "contacted", "replied", "demo_booked", "won", "lost"]).optional().default("new"),
  clinicId: z.string().uuid().optional().nullable(),
  // DentalMapsHelper sync fields
  externalSourceId: z.string().max(255).optional().nullable(), // External ID from DentalMapsHelper
  syncStatus: z.enum(["pending", "synced", "errored", "disabled"]).optional().default("synced"),
});

export type ExternalLeadPayload = z.infer<typeof externalLeadPayloadSchema>;

// Result types for import operations
export interface SingleImportResult {
  success: true;
  leadId: string;
  existing?: boolean; // true if lead was found via dedup and merged
}

export interface SingleImportError {
  success: false;
  error: string;
  field?: string;
}

export interface BulkImportResultItem {
  index: number;
  success: boolean;
  leadId?: string;
  existing?: boolean;
  error?: string;
}

export interface BulkImportResult {
  success: boolean;
  totalProcessed: number;
  created: number;
  existing: number;
  failed: number;
  results: BulkImportResultItem[];
}

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
  city: text("city"),
  state: text("state"),
  country: text("country").default("USA"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  timezone: text("timezone").default("America/New_York"),
  businessHours: text("business_hours"),
  services: text("services").array(),
  // Integration settings
  emailProvider: text("email_provider"), // gmail, resend, sendgrid
  smsEnabled: boolean("sms_enabled").default(false),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  // DentalMapsHelper sync fields
  externalId: text("external_id"),
  googleMapsUrl: text("google_maps_url"),
  // Marketing sync tracking (72-hour cooldown)
  lastEmailedAt: timestamp("last_emailed_at"),
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

// Campaign-Leads join table - Links campaigns to their target leads
// This enables automatic lead loading into campaigns and tracking email sends
export const campaignLeads = pgTable("campaign_leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => outreachCampaigns.id),
  leadId: varchar("lead_id").notNull().references(() => leads.id),
  // Send tracking
  status: text("status").default("pending").notNull(), // pending, sent, failed, bounced, opened, clicked
  sentAt: timestamp("sent_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  errorMessage: text("error_message"),
  // Metadata
  addedAt: timestamp("added_at").defaultNow(),
}, (table) => ({
  // Unique constraint to prevent duplicate campaign-lead pairs
  uniqueCampaignLead: uniqueIndex("campaign_leads_unique").on(table.campaignId, table.leadId),
  // Index for finding all leads in a campaign
  campaignIdIdx: index("campaign_leads_campaign_id_idx").on(table.campaignId),
  // Index for finding all campaigns a lead is in
  leadIdIdx: index("campaign_leads_lead_id_idx").on(table.leadId),
  // Index for filtering by status
  statusIdx: index("campaign_leads_status_idx").on(table.status),
}));

export const insertCampaignLeadSchema = createInsertSchema(campaignLeads).omit({
  id: true,
  addedAt: true,
});

export type InsertCampaignLead = z.infer<typeof insertCampaignLeadSchema>;
export type CampaignLead = typeof campaignLeads.$inferSelect;

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
  // Campaign tracking fields
  campaignId: varchar("campaign_id").references(() => outreachCampaigns.id),
  leadId: varchar("lead_id").references(() => leads.id),
  source: text("source").default("direct"), // direct, email, sms, chatbot, website
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

export const outreachCampaignsRelations = relations(outreachCampaigns, ({ one, many }) => ({
  clinic: one(clinics, {
    fields: [outreachCampaigns.clinicId],
    references: [clinics.id],
  }),
  campaignLeads: many(campaignLeads),
}));

export const campaignLeadsRelations = relations(campaignLeads, ({ one }) => ({
  campaign: one(outreachCampaigns, {
    fields: [campaignLeads.campaignId],
    references: [outreachCampaigns.id],
  }),
  lead: one(leads, {
    fields: [campaignLeads.leadId],
    references: [leads.id],
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
  campaignLeads: many(campaignLeads),
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

// Marketing Sync Outreach Logs - Tracks all automated email sends with 72-hour cooldown
export const outreachLogs = pgTable("outreach_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: varchar("clinic_id").notNull().references(() => clinics.id),
  leadId: varchar("lead_id").references(() => leads.id),
  campaignId: varchar("campaign_id").references(() => outreachCampaigns.id),
  cycleId: varchar("cycle_id").notNull(), // Unique ID for each automation cycle
  recipientEmail: text("recipient_email").notNull(),
  recipientName: text("recipient_name"),
  subject: text("subject").notNull(),
  messagePreview: text("message_preview"), // First 500 chars of message
  status: text("status").default("pending").notNull(), // pending, sent, failed, bounced
  errorMessage: text("error_message"),
  aiGenerated: boolean("ai_generated").default(true).notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  clinicIdIdx: index("outreach_logs_clinic_id_idx").on(table.clinicId),
  statusIdx: index("outreach_logs_status_idx").on(table.status),
  sentAtIdx: index("outreach_logs_sent_at_idx").on(table.sentAt),
  cycleIdIdx: index("outreach_logs_cycle_id_idx").on(table.cycleId),
}));

export const insertOutreachLogSchema = createInsertSchema(outreachLogs).omit({
  id: true,
  sentAt: true,
  createdAt: true,
});

export type InsertOutreachLog = z.infer<typeof insertOutreachLogSchema>;
export type OutreachLog = typeof outreachLogs.$inferSelect;

// Outreach logs relations
export const outreachLogsRelations = relations(outreachLogs, ({ one }) => ({
  clinic: one(clinics, {
    fields: [outreachLogs.clinicId],
    references: [clinics.id],
  }),
  lead: one(leads, {
    fields: [outreachLogs.leadId],
    references: [leads.id],
  }),
  campaign: one(outreachCampaigns, {
    fields: [outreachLogs.campaignId],
    references: [outreachCampaigns.id],
  }),
}));

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

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS TABLES - Comprehensive tracking for growth engine
// ═══════════════════════════════════════════════════════════════════════════

// Analytics Events - Raw event tracking for all user interactions
export const analyticsEvents = pgTable("analytics_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  userId: varchar("user_id").references(() => users.id),
  clinicId: varchar("clinic_id").references(() => clinics.id),
  eventType: varchar("event_type").notNull(), // page_view, cta_click, scroll_depth, hero_viewed, demo_started, etc.
  variant: varchar("variant"), // A/B test variant (A, B, C, D, E, F)
  path: varchar("path"), // URL path
  referrer: varchar("referrer"), // Traffic source
  metadata: jsonb("metadata").$type<Record<string, string | number | boolean>>(), // Flexible event data
  city: varchar("city"),
  country: varchar("country"),
  deviceType: varchar("device_type"), // desktop, mobile, tablet
  browser: varchar("browser"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  sessionIdx: index("analytics_events_session_idx").on(table.sessionId),
  eventTypeIdx: index("analytics_events_type_idx").on(table.eventType),
  variantIdx: index("analytics_events_variant_idx").on(table.variant),
  createdAtIdx: index("analytics_events_created_at_idx").on(table.createdAt),
  clinicIdIdx: index("analytics_events_clinic_id_idx").on(table.clinicId),
  cityIdx: index("analytics_events_city_idx").on(table.city),
}));

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;

// Session Metrics - Aggregated session-level data
export const sessionMetrics = pgTable("session_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
  clinicId: varchar("clinic_id").references(() => clinics.id),
  variant: varchar("variant"), // A/B variant assigned
  firstPageView: timestamp("first_page_view").notNull(),
  lastActivity: timestamp("last_activity").notNull(),
  pageViews: integer("page_views").default(0).notNull(),
  maxScrollDepth: integer("max_scroll_depth").default(0).notNull(), // 0-100
  ctaClicks: integer("cta_clicks").default(0).notNull(),
  demoStarted: boolean("demo_started").default(false).notNull(),
  demoCompleted: boolean("demo_completed").default(false).notNull(),
  leadCreated: boolean("lead_created").default(false).notNull(),
  leadId: varchar("lead_id").references(() => leads.id),
  city: varchar("city"),
  country: varchar("country"),
  deviceType: varchar("device_type"),
  referrer: varchar("referrer"),
  landingPage: varchar("landing_page"),
  exitPage: varchar("exit_page"),
  sessionDuration: integer("session_duration"), // in seconds
  bounced: boolean("bounced").default(false).notNull(), // Single page, <30s
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  sessionIdIdx: index("session_metrics_session_id_idx").on(table.sessionId),
  variantIdx: index("session_metrics_variant_idx").on(table.variant),
  cityIdx: index("session_metrics_city_idx").on(table.city),
  createdAtIdx: index("session_metrics_created_at_idx").on(table.createdAt),
  demoCompletedIdx: index("session_metrics_demo_completed_idx").on(table.demoCompleted),
}));

export const insertSessionMetricSchema = createInsertSchema(sessionMetrics).omit({
  id: true,
  createdAt: true,
});

export type InsertSessionMetric = z.infer<typeof insertSessionMetricSchema>;
export type SessionMetric = typeof sessionMetrics.$inferSelect;

// Lead Scores - AI-powered lead quality scoring
export const leadScores = pgTable("lead_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id),
  clinicId: varchar("clinic_id").references(() => clinics.id),
  overallScore: integer("overall_score").notNull(), // 0-100
  category: varchar("category").notNull(), // hot, warm, cold
  engagementScore: integer("engagement_score").default(0).notNull(), // Based on email opens, clicks
  behaviorScore: integer("behavior_score").default(0).notNull(), // Based on website interactions
  profileScore: integer("profile_score").default(0).notNull(), // Based on lead data completeness
  recencyScore: integer("recency_score").default(0).notNull(), // Based on last activity
  factors: jsonb("factors").$type<{
    hasEmail: boolean;
    hasPhone: boolean;
    hasWebsite: boolean;
    googleRating: number | null;
    reviewCount: number | null;
    emailOpens: number;
    emailClicks: number;
    lastActivity: string;
    demoRequested: boolean;
  }>(),
  scoredAt: timestamp("scored_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  leadIdIdx: uniqueIndex("lead_scores_lead_id_unique").on(table.leadId),
  categoryIdx: index("lead_scores_category_idx").on(table.category),
  overallScoreIdx: index("lead_scores_overall_score_idx").on(table.overallScore),
  clinicIdIdx: index("lead_scores_clinic_id_idx").on(table.clinicId),
}));

export const insertLeadScoreSchema = createInsertSchema(leadScores).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  scoredAt: true,
});

export type InsertLeadScore = z.infer<typeof insertLeadScoreSchema>;
export type LeadScore = typeof leadScores.$inferSelect;

// Message Events - Track email and SMS engagement
export const messageEvents = pgTable("message_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageType: varchar("message_type").notNull(), // email, sms, messenger
  campaignId: varchar("campaign_id").references(() => outreachCampaigns.id),
  leadId: varchar("lead_id").references(() => leads.id),
  clinicId: varchar("clinic_id").references(() => clinics.id),
  eventType: varchar("event_type").notNull(), // sent, delivered, opened, clicked, replied, bounced, unsubscribed
  subject: text("subject"),
  messageId: varchar("message_id"), // External message ID (Resend, Twilio)
  metadata: jsonb("metadata").$type<Record<string, string | number | boolean>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  messageTypeIdx: index("message_events_type_idx").on(table.messageType),
  eventTypeIdx: index("message_events_event_type_idx").on(table.eventType),
  campaignIdIdx: index("message_events_campaign_id_idx").on(table.campaignId),
  leadIdIdx: index("message_events_lead_id_idx").on(table.leadId),
  createdAtIdx: index("message_events_created_at_idx").on(table.createdAt),
}));

export const insertMessageEventSchema = createInsertSchema(messageEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertMessageEvent = z.infer<typeof insertMessageEventSchema>;
export type MessageEvent = typeof messageEvents.$inferSelect;

// Daily Analytics Snapshots - Pre-aggregated daily stats for fast dashboard loading
export const dailyAnalytics = pgTable("daily_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  clinicId: varchar("clinic_id").references(() => clinics.id),
  // Traffic metrics
  pageViews: integer("page_views").default(0).notNull(),
  uniqueVisitors: integer("unique_visitors").default(0).notNull(),
  bounceRate: integer("bounce_rate").default(0).notNull(), // 0-100
  avgSessionDuration: integer("avg_session_duration").default(0).notNull(), // seconds
  // Engagement metrics
  ctaClicks: integer("cta_clicks").default(0).notNull(),
  avgScrollDepth: integer("avg_scroll_depth").default(0).notNull(), // 0-100
  // Conversion metrics
  demoStarts: integer("demo_starts").default(0).notNull(),
  demoCompletes: integer("demo_completes").default(0).notNull(),
  leadsCreated: integer("leads_created").default(0).notNull(),
  // Email metrics
  emailsSent: integer("emails_sent").default(0).notNull(),
  emailsOpened: integer("emails_opened").default(0).notNull(),
  emailsClicked: integer("emails_clicked").default(0).notNull(),
  // SMS metrics
  smsSent: integer("sms_sent").default(0).notNull(),
  smsReplied: integer("sms_replied").default(0).notNull(),
  // A/B test data
  variantStats: jsonb("variant_stats").$type<Record<string, { views: number; clicks: number; conversions: number }>>(),
  // City performance
  cityStats: jsonb("city_stats").$type<Record<string, { views: number; conversions: number }>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  dateIdx: index("daily_analytics_date_idx").on(table.date),
  clinicIdIdx: index("daily_analytics_clinic_id_idx").on(table.clinicId),
  dateClinicIdx: uniqueIndex("daily_analytics_date_clinic_unique").on(table.date, table.clinicId),
}));

export const insertDailyAnalyticsSchema = createInsertSchema(dailyAnalytics).omit({
  id: true,
  createdAt: true,
});

export type InsertDailyAnalytics = z.infer<typeof insertDailyAnalyticsSchema>;
export type DailyAnalytics = typeof dailyAnalytics.$inferSelect;

// Heatmap Data - Track click positions for heatmap visualization
export const heatmapEvents = pgTable("heatmap_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  path: varchar("path").notNull(),
  x: integer("x").notNull(), // X coordinate (percentage 0-100)
  y: integer("y").notNull(), // Y coordinate (percentage 0-100)
  elementId: varchar("element_id"), // Clicked element ID
  elementType: varchar("element_type"), // button, link, image, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  pathIdx: index("heatmap_events_path_idx").on(table.path),
  createdAtIdx: index("heatmap_events_created_at_idx").on(table.createdAt),
}));

export const insertHeatmapEventSchema = createInsertSchema(heatmapEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertHeatmapEvent = z.infer<typeof insertHeatmapEventSchema>;
export type HeatmapEvent = typeof heatmapEvents.$inferSelect;

// Analytics Relations
export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  user: one(users, {
    fields: [analyticsEvents.userId],
    references: [users.id],
  }),
  clinic: one(clinics, {
    fields: [analyticsEvents.clinicId],
    references: [clinics.id],
  }),
}));

export const sessionMetricsRelations = relations(sessionMetrics, ({ one }) => ({
  user: one(users, {
    fields: [sessionMetrics.userId],
    references: [users.id],
  }),
  clinic: one(clinics, {
    fields: [sessionMetrics.clinicId],
    references: [clinics.id],
  }),
  lead: one(leads, {
    fields: [sessionMetrics.leadId],
    references: [leads.id],
  }),
}));

export const leadScoresRelations = relations(leadScores, ({ one }) => ({
  lead: one(leads, {
    fields: [leadScores.leadId],
    references: [leads.id],
  }),
  clinic: one(clinics, {
    fields: [leadScores.clinicId],
    references: [clinics.id],
  }),
}));

export const messageEventsRelations = relations(messageEvents, ({ one }) => ({
  campaign: one(outreachCampaigns, {
    fields: [messageEvents.campaignId],
    references: [outreachCampaigns.id],
  }),
  lead: one(leads, {
    fields: [messageEvents.leadId],
    references: [leads.id],
  }),
  clinic: one(clinics, {
    fields: [messageEvents.clinicId],
    references: [clinics.id],
  }),
}));

// ============================================================================
// GENIUS SYSTEM - 7-Day Email Sequence Automation
// ============================================================================

// Genius Leads - Tracks leads through the 7-day email sequence
export const geniusLeads = pgTable("genius_leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").references(() => leads.id),
  email: text("email").notNull(),
  dentistName: text("dentist_name").default("Dr.").notNull(),
  clinicName: text("clinic_name"),
  city: text("city"),
  state: text("state"),
  phone: text("phone"),
  website: text("website"),
  currentDay: integer("current_day").default(0).notNull(), // 0-6 for 7-day sequence
  status: text("status").default("active").notNull(), // active, paused, completed, unsubscribed, bounced
  lastEmailSentAt: timestamp("last_email_sent_at"),
  nextEmailDue: timestamp("next_email_due"),
  emailsSent: integer("emails_sent").default(0).notNull(),
  opens: integer("opens").default(0).notNull(),
  clicks: integer("clicks").default(0).notNull(),
  replied: boolean("replied").default(false).notNull(),
  demoBooked: boolean("demo_booked").default(false).notNull(),
  source: text("source").default("import").notNull(), // import, scraper, manual
  importedAt: timestamp("imported_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  emailUniqueIdx: uniqueIndex("genius_leads_email_unique").on(table.email),
  statusIdx: index("genius_leads_status_idx").on(table.status),
  currentDayIdx: index("genius_leads_current_day_idx").on(table.currentDay),
  nextEmailDueIdx: index("genius_leads_next_email_due_idx").on(table.nextEmailDue),
}));

export const insertGeniusLeadSchema = createInsertSchema(geniusLeads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  importedAt: true,
});

export type InsertGeniusLead = z.infer<typeof insertGeniusLeadSchema>;
export type GeniusLead = typeof geniusLeads.$inferSelect;

// Genius Email Sends - Log of all emails sent by the system
export const geniusEmailSends = pgTable("genius_email_sends", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  geniusLeadId: varchar("genius_lead_id").notNull().references(() => geniusLeads.id),
  day: integer("day").notNull(), // 0-6
  subject: text("subject").notNull(),
  templateVersion: integer("template_version").default(1).notNull(), // For A/B testing/rotation
  status: text("status").default("sent").notNull(), // sent, delivered, opened, clicked, bounced, complained
  messageId: text("message_id"), // Resend message ID
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  bouncedAt: timestamp("bounced_at"),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
}, (table) => ({
  geniusLeadIdIdx: index("genius_email_sends_lead_id_idx").on(table.geniusLeadId),
  dayIdx: index("genius_email_sends_day_idx").on(table.day),
  statusIdx: index("genius_email_sends_status_idx").on(table.status),
  sentAtIdx: index("genius_email_sends_sent_at_idx").on(table.sentAt),
}));

export const insertGeniusEmailSendSchema = createInsertSchema(geniusEmailSends).omit({
  id: true,
  sentAt: true,
});

export type InsertGeniusEmailSend = z.infer<typeof insertGeniusEmailSendSchema>;
export type GeniusEmailSend = typeof geniusEmailSends.$inferSelect;

// Genius Daily Stats - Aggregated daily metrics for reporting
export const geniusDailyStats = pgTable("genius_daily_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  leadsImported: integer("leads_imported").default(0).notNull(),
  totalLeads: integer("total_leads").default(0).notNull(),
  emailsSent: integer("emails_sent").default(0).notNull(),
  opens: integer("opens").default(0).notNull(),
  clicks: integer("clicks").default(0).notNull(),
  replies: integer("replies").default(0).notNull(),
  demosBooked: integer("demos_booked").default(0).notNull(),
  bounces: integer("bounces").default(0).notNull(),
  complaints: integer("complaints").default(0).notNull(),
  emailBudgetUsed: integer("email_budget_used").default(0).notNull(), // cents
  replitBudgetUsed: integer("replit_budget_used").default(0).notNull(), // cents
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  dateUniqueIdx: uniqueIndex("genius_daily_stats_date_unique").on(table.date),
}));

export const insertGeniusDailyStatsSchema = createInsertSchema(geniusDailyStats).omit({
  id: true,
  createdAt: true,
});

export type InsertGeniusDailyStats = z.infer<typeof insertGeniusDailyStatsSchema>;
export type GeniusDailyStats = typeof geniusDailyStats.$inferSelect;

// Genius System Config - Runtime configuration for the automation engine
export const geniusConfig = pgTable("genius_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertGeniusConfigSchema = createInsertSchema(geniusConfig).omit({
  id: true,
  updatedAt: true,
});

export type InsertGeniusConfig = z.infer<typeof insertGeniusConfigSchema>;
export type GeniusConfig = typeof geniusConfig.$inferSelect;

// Relations for Genius tables
export const geniusLeadsRelations = relations(geniusLeads, ({ one, many }) => ({
  lead: one(leads, {
    fields: [geniusLeads.leadId],
    references: [leads.id],
  }),
  emailSends: many(geniusEmailSends),
}));

export const geniusEmailSendsRelations = relations(geniusEmailSends, ({ one }) => ({
  geniusLead: one(geniusLeads, {
    fields: [geniusEmailSends.geniusLeadId],
    references: [geniusLeads.id],
  }),
}));
