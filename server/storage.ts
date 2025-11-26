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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Lead operations
  getAllLeads(): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  importLeads(leads: InsertLead[]): Promise<void>;
  getLeadById(id: string): Promise<Lead | undefined>;
  updateLeadStatus(id: string, status: string): Promise<void>;

  // Clinic operations
  getAllClinics(): Promise<Clinic[]>;
  createClinic(clinic: InsertClinic): Promise<Clinic>;
  updateClinic(id: string, data: Partial<InsertClinic>): Promise<Clinic>;
  getClinicById(id: string): Promise<Clinic | undefined>;
  getClinicBySlug(slug: string): Promise<Clinic | undefined>;

  // Booking operations
  createBooking(booking: InsertBooking): Promise<Booking>;
  getAllBookings(): Promise<Booking[]>;

  // Chatbot thread operations
  createChatbotThread(thread: InsertChatbotThread): Promise<ChatbotThread>;
  getChatbotThread(id: string): Promise<ChatbotThread | undefined>;
  getChatbotMessages(threadId: string): Promise<ChatbotMessage[]>;
  createChatbotMessage(message: InsertChatbotMessage): Promise<ChatbotMessage>;

  // Outreach campaign operations
  getAllCampaigns(): Promise<OutreachCampaign[]>;
  createCampaign(campaign: InsertOutreachCampaign): Promise<OutreachCampaign>;

  // Patient booking operations
  createPatientBooking(booking: InsertPatientBooking): Promise<PatientBooking>;
  getPatientBookingsByClinic(clinicId: string): Promise<PatientBooking[]>;
  getAllPatientBookings(): Promise<PatientBooking[]>;
  getPatientBookingsForUser(userId: string): Promise<PatientBooking[]>;
  updatePatientBookingStatus(id: string, status: string): Promise<void>;

  // Analytics
  getAnalytics(): Promise<{
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
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
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

  // Lead operations
  async getAllLeads(): Promise<Lead[]> {
    return await db.select().from(leads).orderBy(desc(leads.createdAt));
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

  async updateLeadStatus(id: string, status: string): Promise<void> {
    await db
      .update(leads)
      .set({ status, updatedAt: new Date() })
      .where(eq(leads.id, id));
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
}

export const storage = new DatabaseStorage();
