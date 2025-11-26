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

// User storage table (IMPORTANT: mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false).notNull(),
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

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;

// Leads table
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  city: text("city"),
  state: text("state"),
  country: text("country").default("USA"),
  notes: text("notes"),
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

// Demo bookings table
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicName: text("clinic_name").notNull(),
  ownerName: text("owner_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
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
export const outreachCampaigns = pgTable("outreach_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // email, sms
  subject: text("subject"),
  message: text("message").notNull(),
  status: text("status").default("draft").notNull(), // draft, active, paused, completed
  dailyLimit: integer("daily_limit").default(50),
  sentToday: integer("sent_today").default(0),
  totalSent: integer("total_sent").default(0),
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
