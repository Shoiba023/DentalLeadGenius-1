// Referenced from javascript_database and javascript_log_in_with_replit blueprints
import {
  users,
  leads,
  clinics,
  clinicUsers,
  bookings,
  chatbotThreads,
  chatbotMessages,
  outreachCampaigns,
  patientBookings,
  sequences,
  sequenceSteps,
  sequenceEnrollments,
  demoAccessTokens,
  onboardingProgress,
  onboardingEmails,
  onboardingEmailLogs,
  type User,
  type UpsertUser,
  type Lead,
  type InsertLead,
  type Clinic,
  type InsertClinic,
  type Booking,
  type InsertBooking,
  type ChatbotThread,
  type InsertChatbotThread,
  type ChatbotMessage,
  type InsertChatbotMessage,
  type OutreachCampaign,
  type InsertOutreachCampaign,
  type PatientBooking,
  type InsertPatientBooking,
  type Sequence,
  type InsertSequence,
  type SequenceStep,
  type InsertSequenceStep,
  type SequenceEnrollment,
  type InsertSequenceEnrollment,
  type DemoAccessToken,
  type InsertDemoAccessToken,
  type OnboardingProgress,
  type InsertOnboardingProgress,
  type OnboardingEmail,
  type InsertOnboardingEmail,
  type OnboardingEmailLog,
  type InsertOnboardingEmailLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUserWithPassword(email: string, hashedPassword: string, role: string, firstName?: string, lastName?: string): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  addUserToClinic(userId: string, clinicId: string, role: string): Promise<void>;
  updateUserStripeInfo(userId: string, stripeInfo: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionTier?: string;
    subscriptionStatus?: string;
  }): Promise<User>;

  // Lead operations (multi-tenant)
  getAllLeads(): Promise<Lead[]>;
  getLeadsByClinic(clinicId: string): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  importLeads(leads: InsertLead[]): Promise<void>;
  getLeadById(id: string): Promise<Lead | undefined>;
  getLeadsByEmail(email: string): Promise<Lead[]>;
  updateLeadStatus(id: string, status: string): Promise<void>;
  updateLead(id: string, updates: Partial<InsertLead>): Promise<Lead | undefined>;

  // Clinic operations
  getAllClinics(): Promise<Clinic[]>;
  createClinic(clinic: InsertClinic): Promise<Clinic>;
  updateClinic(id: string, data: Partial<InsertClinic>): Promise<Clinic>;
  getClinicById(id: string): Promise<Clinic | undefined>;
  getClinicBySlug(slug: string): Promise<Clinic | undefined>;
  getUserClinics(userId: string): Promise<Clinic[]>;

  // Booking operations
  createBooking(booking: InsertBooking): Promise<Booking>;
  getAllBookings(): Promise<Booking[]>;

  // Chatbot thread operations
  createChatbotThread(thread: InsertChatbotThread): Promise<ChatbotThread>;
  getChatbotThread(id: string): Promise<ChatbotThread | undefined>;
  getChatbotMessages(threadId: string): Promise<ChatbotMessage[]>;
  createChatbotMessage(message: InsertChatbotMessage): Promise<ChatbotMessage>;

  // Outreach campaign operations (multi-tenant)
  getAllCampaigns(): Promise<OutreachCampaign[]>;
  getCampaignsByClinic(clinicId: string): Promise<OutreachCampaign[]>;
  createCampaign(campaign: InsertOutreachCampaign): Promise<OutreachCampaign>;

  // Patient booking operations
  createPatientBooking(booking: InsertPatientBooking): Promise<PatientBooking>;
  getPatientBookingsByClinic(clinicId: string): Promise<PatientBooking[]>;
  getAllPatientBookings(): Promise<PatientBooking[]>;
  getPatientBookingsForUser(userId: string): Promise<PatientBooking[]>;
  updatePatientBookingStatus(id: string, status: string): Promise<void>;

  // Analytics (multi-tenant)
  getAnalytics(): Promise<{
    leadsImported: number;
    leadsContacted: number;
    replies: number;
    demosBooked: number;
    won: number;
    lost: number;
  }>;
  getAnalyticsByClinic(clinicId: string): Promise<{
    leadsImported: number;
    leadsContacted: number;
    replies: number;
    demosBooked: number;
    won: number;
    lost: number;
  }>;
  
  // Chatbot Analytics
  getChatbotAnalytics(): Promise<{
    totalConversations: number;
    salesConversations: number;
    patientConversations: number;
    totalMessages: number;
    userMessages: number;
    aiMessages: number;
    patientBookingsFromChat: number;
    averageMessagesPerConversation: number;
  }>;
  
  // Clinic-specific operations
  getChatbotThreadsByClinic(clinicId: string): Promise<(ChatbotThread & { messageCount: number })[]>;
  getClinicAnalytics(clinicId: string): Promise<{
    totalBookings: number;
    pendingBookings: number;
    confirmedBookings: number;
    totalConversations: number;
    totalMessages: number;
  }>;
  
  // Sequence operations (multi-tenant)
  getAllSequences(): Promise<Sequence[]>;
  getSequencesByClinic(clinicId: string): Promise<Sequence[]>;
  getSequenceById(id: string): Promise<Sequence | undefined>;
  createSequence(sequence: InsertSequence): Promise<Sequence>;
  updateSequence(id: string, data: Partial<InsertSequence>): Promise<Sequence>;
  deleteSequence(id: string): Promise<void>;
  
  // Sequence step operations
  getSequenceSteps(sequenceId: string): Promise<SequenceStep[]>;
  createSequenceStep(step: InsertSequenceStep): Promise<SequenceStep>;
  updateSequenceStep(id: string, data: Partial<InsertSequenceStep>): Promise<SequenceStep>;
  deleteSequenceStep(id: string): Promise<void>;
  
  // Sequence enrollment operations
  getSequenceEnrollments(sequenceId: string): Promise<SequenceEnrollment[]>;
  createSequenceEnrollment(enrollment: InsertSequenceEnrollment): Promise<SequenceEnrollment>;
  updateSequenceEnrollmentStatus(id: string, status: string): Promise<void>;
  
  // Demo access token operations
  createDemoAccessToken(data: InsertDemoAccessToken): Promise<DemoAccessToken>;
  getDemoAccessTokenByToken(token: string): Promise<DemoAccessToken | undefined>;
  markDemoAccessTokenUsed(token: string): Promise<void>;
  
  // Onboarding operations
  createOnboardingProgress(data: InsertOnboardingProgress): Promise<OnboardingProgress>;
  getOnboardingProgressByClinic(clinicId: string): Promise<OnboardingProgress | undefined>;
  getOnboardingProgressByUser(userId: string): Promise<OnboardingProgress | undefined>;
  updateOnboardingProgress(id: string, data: Partial<InsertOnboardingProgress>): Promise<OnboardingProgress>;
  getAllOnboardingProgress(): Promise<OnboardingProgress[]>;
  
  // Onboarding email operations
  createOnboardingEmail(data: InsertOnboardingEmail): Promise<OnboardingEmail>;
  getOnboardingEmailsByStage(stage: number): Promise<OnboardingEmail[]>;
  getOnboardingEmailByTrigger(stage: number, triggerType: string): Promise<OnboardingEmail | undefined>;
  getAllOnboardingEmails(): Promise<OnboardingEmail[]>;
  updateOnboardingEmail(id: string, data: Partial<InsertOnboardingEmail>): Promise<OnboardingEmail>;
  
  // Onboarding email log operations
  createOnboardingEmailLog(data: InsertOnboardingEmailLog): Promise<OnboardingEmailLog>;
  getOnboardingEmailLogs(onboardingId: string): Promise<OnboardingEmailLog[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUserWithPassword(
    email: string, 
    hashedPassword: string, 
    role: string,
    firstName?: string,
    lastName?: string
  ): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        role,
        firstName,
        lastName,
        isAdmin: role === 'admin',
      })
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // First check if user with this email already exists
    if (userData.email) {
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser) {
        // Update existing user instead of creating a conflict
        const [user] = await db
          .update(users)
          .set({
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUser.id))
          .returning();
        return user;
      }
    }
    
    // Try to insert or update by ID
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async addUserToClinic(userId: string, clinicId: string, role: string): Promise<void> {
    await db.insert(clinicUsers).values({
      userId,
      clinicId,
      role,
    });
  }

  async updateUserStripeInfo(userId: string, stripeInfo: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionTier?: string;
    subscriptionStatus?: string;
  }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...stripeInfo,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Lead operations
  async getAllLeads(): Promise<Lead[]> {
    return await db.select().from(leads).orderBy(desc(leads.createdAt));
  }
  
  async getLeadsByClinic(clinicId: string): Promise<Lead[]> {
    return await db.select().from(leads)
      .where(eq(leads.clinicId, clinicId))
      .orderBy(desc(leads.createdAt));
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [newLead] = await db.insert(leads).values(lead).returning();
    return newLead;
  }

  async importLeads(leadsData: InsertLead[]): Promise<void> {
    if (leadsData.length === 0) return;
    await db.insert(leads).values(leadsData);
  }

  async getLeadById(id: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async getLeadsByEmail(email: string): Promise<Lead[]> {
    return await db.select().from(leads).where(eq(leads.email, email)).orderBy(desc(leads.createdAt));
  }

  async updateLeadStatus(id: string, status: string): Promise<void> {
    await db
      .update(leads)
      .set({ status, updatedAt: new Date() })
      .where(eq(leads.id, id));
  }

  async updateLead(id: string, updates: Partial<InsertLead>): Promise<Lead | undefined> {
    const [updatedLead] = await db
      .update(leads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return updatedLead;
  }

  // Clinic operations
  async getAllClinics(): Promise<Clinic[]> {
    return await db.select().from(clinics).orderBy(desc(clinics.createdAt));
  }

  async createClinic(clinic: InsertClinic): Promise<Clinic> {
    const [newClinic] = await db.insert(clinics).values(clinic).returning();
    return newClinic;
  }

  async updateClinic(id: string, data: Partial<InsertClinic>): Promise<Clinic> {
    const [updatedClinic] = await db
      .update(clinics)
      .set(data)
      .where(eq(clinics.id, id))
      .returning();
    return updatedClinic;
  }

  async getClinicById(id: string): Promise<Clinic | undefined> {
    const [clinic] = await db.select().from(clinics).where(eq(clinics.id, id));
    return clinic;
  }

  async getClinicBySlug(slug: string): Promise<Clinic | undefined> {
    const [clinic] = await db.select().from(clinics).where(eq(clinics.slug, slug));
    return clinic;
  }
  
  async getUserClinics(userId: string): Promise<Clinic[]> {
    // Get all clinics the user is a member of or owns
    const memberClinics = await db
      .select({
        id: clinics.id,
        name: clinics.name,
        slug: clinics.slug,
        logoUrl: clinics.logoUrl,
        brandColor: clinics.brandColor,
        ownerId: clinics.ownerId,
        createdAt: clinics.createdAt,
        updatedAt: clinics.updatedAt,
      })
      .from(clinicUsers)
      .innerJoin(clinics, eq(clinicUsers.clinicId, clinics.id))
      .where(eq(clinicUsers.userId, userId));
    
    // Also get clinics they own directly (in case not in clinicUsers)
    const ownedClinics = await db
      .select()
      .from(clinics)
      .where(eq(clinics.ownerId, userId));
    
    // Merge and deduplicate by clinic id
    const allClinics = [...memberClinics, ...ownedClinics];
    const uniqueClinics = allClinics.filter((clinic, index, self) => 
      index === self.findIndex(c => c.id === clinic.id)
    );
    
    return uniqueClinics;
  }

  // Booking operations
  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }

  async getAllBookings(): Promise<Booking[]> {
    return await db.select().from(bookings).orderBy(desc(bookings.createdAt));
  }

  // Chatbot thread operations
  async createChatbotThread(thread: InsertChatbotThread): Promise<ChatbotThread> {
    const [newThread] = await db.insert(chatbotThreads).values(thread).returning();
    return newThread;
  }

  async getChatbotThread(id: string): Promise<ChatbotThread | undefined> {
    const [thread] = await db.select().from(chatbotThreads).where(eq(chatbotThreads.id, id));
    return thread;
  }

  async getChatbotMessages(threadId: string): Promise<ChatbotMessage[]> {
    return await db
      .select()
      .from(chatbotMessages)
      .where(eq(chatbotMessages.threadId, threadId))
      .orderBy(chatbotMessages.createdAt);
  }

  async createChatbotMessage(message: InsertChatbotMessage): Promise<ChatbotMessage> {
    const [newMessage] = await db.insert(chatbotMessages).values(message).returning();
    return newMessage;
  }

  // Outreach campaign operations
  async getAllCampaigns(): Promise<OutreachCampaign[]> {
    return await db.select().from(outreachCampaigns).orderBy(desc(outreachCampaigns.createdAt));
  }
  
  async getCampaignsByClinic(clinicId: string): Promise<OutreachCampaign[]> {
    return await db.select().from(outreachCampaigns)
      .where(eq(outreachCampaigns.clinicId, clinicId))
      .orderBy(desc(outreachCampaigns.createdAt));
  }

  async createCampaign(campaign: InsertOutreachCampaign): Promise<OutreachCampaign> {
    const [newCampaign] = await db.insert(outreachCampaigns).values(campaign).returning();
    return newCampaign;
  }

  // Patient booking operations
  async createPatientBooking(booking: InsertPatientBooking): Promise<PatientBooking> {
    const [newBooking] = await db.insert(patientBookings).values(booking).returning();
    return newBooking;
  }

  async getPatientBookingsByClinic(clinicId: string): Promise<PatientBooking[]> {
    return await db
      .select()
      .from(patientBookings)
      .where(eq(patientBookings.clinicId, clinicId))
      .orderBy(desc(patientBookings.createdAt));
  }

  async getAllPatientBookings(): Promise<PatientBooking[]> {
    return await db.select().from(patientBookings).orderBy(desc(patientBookings.createdAt));
  }

  async getPatientBookingsForUser(userId: string): Promise<PatientBooking[]> {
    const userClinics = await db
      .select()
      .from(clinics)
      .where(eq(clinics.ownerId, userId));
    
    const clinicIds = userClinics.map(c => c.id);
    
    if (clinicIds.length === 0) {
      return [];
    }
    
    return await db
      .select()
      .from(patientBookings)
      .where(sql`${patientBookings.clinicId} IN (${sql.join(clinicIds.map(id => sql`${id}`), sql`, `)})`)
      .orderBy(desc(patientBookings.createdAt));
  }

  async updatePatientBookingStatus(id: string, status: string): Promise<void> {
    await db
      .update(patientBookings)
      .set({ status })
      .where(eq(patientBookings.id, id));
  }

  // Analytics
  async getAnalytics() {
    const [leadsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads);

    const [contactedCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(eq(leads.status, "contacted"));

    const [repliesCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(eq(leads.status, "replied"));

    const [demosCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings);

    const [wonCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(eq(leads.status, "won"));

    const [lostCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(eq(leads.status, "lost"));

    return {
      leadsImported: Number(leadsCount?.count || 0),
      leadsContacted: Number(contactedCount?.count || 0),
      replies: Number(repliesCount?.count || 0),
      demosBooked: Number(demosCount?.count || 0),
      won: Number(wonCount?.count || 0),
      lost: Number(lostCount?.count || 0),
    };
  }
  
  async getAnalyticsByClinic(clinicId: string) {
    const [leadsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(eq(leads.clinicId, clinicId));

    const [contactedCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(and(eq(leads.clinicId, clinicId), eq(leads.status, "contacted")));

    const [repliesCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(and(eq(leads.clinicId, clinicId), eq(leads.status, "replied")));

    const [demosCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(patientBookings)
      .where(eq(patientBookings.clinicId, clinicId));

    const [wonCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(and(eq(leads.clinicId, clinicId), eq(leads.status, "won")));

    const [lostCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(and(eq(leads.clinicId, clinicId), eq(leads.status, "lost")));

    return {
      leadsImported: Number(leadsCount?.count || 0),
      leadsContacted: Number(contactedCount?.count || 0),
      replies: Number(repliesCount?.count || 0),
      demosBooked: Number(demosCount?.count || 0),
      won: Number(wonCount?.count || 0),
      lost: Number(lostCount?.count || 0),
    };
  }
  
  // Chatbot Analytics
  async getChatbotAnalytics() {
    const [totalThreads] = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatbotThreads);
    
    const [salesThreads] = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatbotThreads)
      .where(eq(chatbotThreads.type, "sales"));
    
    const [patientThreads] = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatbotThreads)
      .where(eq(chatbotThreads.type, "patient"));
    
    const [totalMsgs] = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatbotMessages);
    
    const [userMsgs] = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatbotMessages)
      .where(eq(chatbotMessages.role, "user"));
    
    const [aiMsgs] = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatbotMessages)
      .where(eq(chatbotMessages.role, "assistant"));
    
    const [patientBookingsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(patientBookings);
    
    const totalConversations = Number(totalThreads?.count || 0);
    const totalMessages = Number(totalMsgs?.count || 0);
    const avgMessages = totalConversations > 0 ? Math.round((totalMessages / totalConversations) * 10) / 10 : 0;
    
    return {
      totalConversations,
      salesConversations: Number(salesThreads?.count || 0),
      patientConversations: Number(patientThreads?.count || 0),
      totalMessages,
      userMessages: Number(userMsgs?.count || 0),
      aiMessages: Number(aiMsgs?.count || 0),
      patientBookingsFromChat: Number(patientBookingsCount?.count || 0),
      averageMessagesPerConversation: avgMessages,
    };
  }
  
  // Clinic-specific operations
  async getChatbotThreadsByClinic(clinicId: string): Promise<(ChatbotThread & { messageCount: number })[]> {
    const threads = await db
      .select()
      .from(chatbotThreads)
      .where(eq(chatbotThreads.clinicId, clinicId))
      .orderBy(desc(chatbotThreads.createdAt));
    
    const threadsWithCount = await Promise.all(
      threads.map(async (thread) => {
        const [msgCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(chatbotMessages)
          .where(eq(chatbotMessages.threadId, thread.id));
        return {
          ...thread,
          messageCount: Number(msgCount?.count || 0),
        };
      })
    );
    
    return threadsWithCount;
  }
  
  async getClinicAnalytics(clinicId: string) {
    const [totalBookingsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(patientBookings)
      .where(eq(patientBookings.clinicId, clinicId));
    
    const [pendingCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(patientBookings)
      .where(and(
        eq(patientBookings.clinicId, clinicId),
        eq(patientBookings.status, "pending")
      ));
    
    const [confirmedCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(patientBookings)
      .where(and(
        eq(patientBookings.clinicId, clinicId),
        eq(patientBookings.status, "confirmed")
      ));
    
    const [conversationsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatbotThreads)
      .where(eq(chatbotThreads.clinicId, clinicId));
    
    // Count messages for this clinic's threads
    const clinicThreads = await db
      .select({ id: chatbotThreads.id })
      .from(chatbotThreads)
      .where(eq(chatbotThreads.clinicId, clinicId));
    
    let totalMessages = 0;
    for (const thread of clinicThreads) {
      const [msgCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(chatbotMessages)
        .where(eq(chatbotMessages.threadId, thread.id));
      totalMessages += Number(msgCount?.count || 0);
    }
    
    return {
      totalBookings: Number(totalBookingsCount?.count || 0),
      pendingBookings: Number(pendingCount?.count || 0),
      confirmedBookings: Number(confirmedCount?.count || 0),
      totalConversations: Number(conversationsCount?.count || 0),
      totalMessages,
    };
  }
  
  // Sequence operations
  async getAllSequences(): Promise<Sequence[]> {
    return await db.select().from(sequences).orderBy(desc(sequences.createdAt));
  }
  
  async getSequencesByClinic(clinicId: string): Promise<Sequence[]> {
    return await db.select().from(sequences)
      .where(eq(sequences.clinicId, clinicId))
      .orderBy(desc(sequences.createdAt));
  }
  
  async getSequenceById(id: string): Promise<Sequence | undefined> {
    const [sequence] = await db.select().from(sequences).where(eq(sequences.id, id));
    return sequence;
  }
  
  async createSequence(sequence: InsertSequence): Promise<Sequence> {
    const [newSequence] = await db.insert(sequences).values(sequence).returning();
    return newSequence;
  }
  
  async updateSequence(id: string, data: Partial<InsertSequence>): Promise<Sequence> {
    const [updated] = await db
      .update(sequences)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sequences.id, id))
      .returning();
    return updated;
  }
  
  async deleteSequence(id: string): Promise<void> {
    await db.delete(sequenceSteps).where(eq(sequenceSteps.sequenceId, id));
    await db.delete(sequenceEnrollments).where(eq(sequenceEnrollments.sequenceId, id));
    await db.delete(sequences).where(eq(sequences.id, id));
  }
  
  // Sequence step operations
  async getSequenceSteps(sequenceId: string): Promise<SequenceStep[]> {
    return await db
      .select()
      .from(sequenceSteps)
      .where(eq(sequenceSteps.sequenceId, sequenceId))
      .orderBy(sequenceSteps.stepOrder);
  }
  
  async createSequenceStep(step: InsertSequenceStep): Promise<SequenceStep> {
    const [newStep] = await db.insert(sequenceSteps).values(step).returning();
    return newStep;
  }
  
  async updateSequenceStep(id: string, data: Partial<InsertSequenceStep>): Promise<SequenceStep> {
    const [updated] = await db
      .update(sequenceSteps)
      .set(data)
      .where(eq(sequenceSteps.id, id))
      .returning();
    return updated;
  }
  
  async deleteSequenceStep(id: string): Promise<void> {
    await db.delete(sequenceSteps).where(eq(sequenceSteps.id, id));
  }
  
  // Sequence enrollment operations
  async getSequenceEnrollments(sequenceId: string): Promise<SequenceEnrollment[]> {
    return await db
      .select()
      .from(sequenceEnrollments)
      .where(eq(sequenceEnrollments.sequenceId, sequenceId))
      .orderBy(desc(sequenceEnrollments.enrolledAt));
  }
  
  async createSequenceEnrollment(enrollment: InsertSequenceEnrollment): Promise<SequenceEnrollment> {
    const [newEnrollment] = await db.insert(sequenceEnrollments).values(enrollment).returning();
    return newEnrollment;
  }
  
  async updateSequenceEnrollmentStatus(id: string, status: string): Promise<void> {
    await db
      .update(sequenceEnrollments)
      .set({ status })
      .where(eq(sequenceEnrollments.id, id));
  }
  
  // Demo access token operations
  async createDemoAccessToken(data: InsertDemoAccessToken): Promise<DemoAccessToken> {
    const [token] = await db.insert(demoAccessTokens).values(data).returning();
    return token;
  }
  
  async getDemoAccessTokenByToken(token: string): Promise<DemoAccessToken | undefined> {
    const [accessToken] = await db
      .select()
      .from(demoAccessTokens)
      .where(eq(demoAccessTokens.token, token));
    return accessToken;
  }
  
  async markDemoAccessTokenUsed(token: string): Promise<void> {
    await db
      .update(demoAccessTokens)
      .set({ used: true })
      .where(eq(demoAccessTokens.token, token));
  }
  
  // Onboarding operations
  async createOnboardingProgress(data: InsertOnboardingProgress): Promise<OnboardingProgress> {
    const [progress] = await db.insert(onboardingProgress).values(data).returning();
    return progress;
  }
  
  async getOnboardingProgressByClinic(clinicId: string): Promise<OnboardingProgress | undefined> {
    const [progress] = await db
      .select()
      .from(onboardingProgress)
      .where(eq(onboardingProgress.clinicId, clinicId));
    return progress;
  }
  
  async getOnboardingProgressByUser(userId: string): Promise<OnboardingProgress | undefined> {
    const [progress] = await db
      .select()
      .from(onboardingProgress)
      .where(eq(onboardingProgress.userId, userId));
    return progress;
  }
  
  async updateOnboardingProgress(id: string, data: Partial<InsertOnboardingProgress>): Promise<OnboardingProgress> {
    const [updated] = await db
      .update(onboardingProgress)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(onboardingProgress.id, id))
      .returning();
    return updated;
  }
  
  async getAllOnboardingProgress(): Promise<OnboardingProgress[]> {
    return await db.select().from(onboardingProgress).orderBy(desc(onboardingProgress.createdAt));
  }
  
  // Onboarding email operations
  async createOnboardingEmail(data: InsertOnboardingEmail): Promise<OnboardingEmail> {
    const [email] = await db.insert(onboardingEmails).values(data).returning();
    return email;
  }
  
  async getOnboardingEmailsByStage(stage: number): Promise<OnboardingEmail[]> {
    return await db
      .select()
      .from(onboardingEmails)
      .where(eq(onboardingEmails.stage, stage));
  }
  
  async getOnboardingEmailByTrigger(stage: number, triggerType: string): Promise<OnboardingEmail | undefined> {
    const [email] = await db
      .select()
      .from(onboardingEmails)
      .where(and(
        eq(onboardingEmails.stage, stage),
        eq(onboardingEmails.triggerType, triggerType)
      ));
    return email;
  }
  
  async getAllOnboardingEmails(): Promise<OnboardingEmail[]> {
    return await db.select().from(onboardingEmails).orderBy(onboardingEmails.stage);
  }
  
  async updateOnboardingEmail(id: string, data: Partial<InsertOnboardingEmail>): Promise<OnboardingEmail> {
    const [updated] = await db
      .update(onboardingEmails)
      .set(data)
      .where(eq(onboardingEmails.id, id))
      .returning();
    return updated;
  }
  
  // Onboarding email log operations
  async createOnboardingEmailLog(data: InsertOnboardingEmailLog): Promise<OnboardingEmailLog> {
    const [log] = await db.insert(onboardingEmailLogs).values(data).returning();
    return log;
  }
  
  async getOnboardingEmailLogs(onboardingId: string): Promise<OnboardingEmailLog[]> {
    return await db
      .select()
      .from(onboardingEmailLogs)
      .where(eq(onboardingEmailLogs.onboardingId, onboardingId))
      .orderBy(desc(onboardingEmailLogs.sentAt));
  }
}

export const storage = new DatabaseStorage();
