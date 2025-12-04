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
  campaignLeads,
  patientBookings,
  sequences,
  sequenceSteps,
  sequenceEnrollments,
  demoAccessTokens,
  onboardingProgress,
  onboardingEmails,
  onboardingEmailLogs,
  outreachLogs,
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
  type CampaignLead,
  type InsertCampaignLead,
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
  type OutreachLog,
  type InsertOutreachLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, isNull, sql, gte, lt, isNotNull, ne } from "drizzle-orm";

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
  getLeadsWithEmail(clinicId: string): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  importLeads(leads: InsertLead[]): Promise<Lead[]>;
  getLeadById(id: string): Promise<Lead | undefined>;
  getLeadsByEmail(email: string): Promise<Lead[]>;
  updateLeadStatus(id: string, status: string): Promise<void>;
  updateLead(id: string, updates: Partial<InsertLead>): Promise<Lead | undefined>;
  
  // Deduplication methods for external imports
  findLeadByGoogleMapsUrl(googleMapsUrl: string): Promise<Lead | undefined>;
  findLeadByEmailAndCity(email: string, city: string, country: string): Promise<Lead | undefined>;
  upsertLeadByDedupe(lead: InsertLead): Promise<{ lead: Lead; existing: boolean }>;
  
  // Import stats for admin
  getImportStats(): Promise<{
    totalLeads: number;
    totalMapsHelperLeads: number;
    lastImportedAt: Date | null;
    importedTodayCount: number;
  }>;

  // Clinic operations
  getAllClinics(): Promise<Clinic[]>;
  getClinicsWithSyncedLeads(): Promise<Clinic[]>;
  createClinic(clinic: InsertClinic): Promise<Clinic>;
  updateClinic(id: string, data: Partial<InsertClinic>): Promise<Clinic>;
  getClinicById(id: string): Promise<Clinic | undefined>;
  getClinicBySlug(slug: string): Promise<Clinic | undefined>;
  getUserClinics(userId: string): Promise<Clinic[]>;
  findClinicByGoogleMapsUrl(googleMapsUrl: string): Promise<Clinic | undefined>;
  findClinicByNameAndLocation(name: string, city?: string, state?: string): Promise<Clinic | undefined>;

  // Booking operations
  createBooking(booking: InsertBooking): Promise<Booking>;
  getAllBookings(): Promise<Booking[]>;
  getBookingById(id: string): Promise<Booking | undefined>;
  updateBooking(id: string, updates: Partial<InsertBooking>): Promise<Booking | undefined>;
  getBookingsByClinic(clinicId: string): Promise<Booking[]>;

  // Chatbot thread operations
  createChatbotThread(thread: InsertChatbotThread): Promise<ChatbotThread>;
  getChatbotThread(id: string): Promise<ChatbotThread | undefined>;
  getChatbotMessages(threadId: string): Promise<ChatbotMessage[]>;
  createChatbotMessage(message: InsertChatbotMessage): Promise<ChatbotMessage>;

  // Outreach campaign operations (multi-tenant)
  getAllCampaigns(): Promise<OutreachCampaign[]>;
  getCampaignsByClinic(clinicId: string): Promise<OutreachCampaign[]>;
  getCampaignById(id: string): Promise<OutreachCampaign | undefined>;
  createCampaign(campaign: InsertOutreachCampaign): Promise<OutreachCampaign>;
  updateCampaignByClinic(id: string, clinicId: string, data: Partial<InsertOutreachCampaign> & { totalSent?: number; sentToday?: number }): Promise<OutreachCampaign | undefined>;
  
  // Campaign-Leads operations (for automatic lead loading)
  getCampaignLeads(campaignId: string): Promise<(CampaignLead & { lead: Lead })[]>;
  addLeadsToCampaign(campaignId: string, leadIds: string[]): Promise<CampaignLead[]>;
  removeLeadFromCampaign(campaignId: string, leadId: string): Promise<void>;
  getSyncedLeadsForClinic(clinicId: string): Promise<Lead[]>;
  autoLoadLeadsToCampaign(campaignId: string, clinicId: string): Promise<{ added: number; skipped: number }>;
  updateCampaignLeadStatus(id: string, status: string, errorMessage?: string): Promise<void>;
  markCampaignLeadSent(campaignLeadId: string): Promise<void>;

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
  
  // Enhanced Dashboard operations
  getDashboardStats(clinicId?: string): Promise<{
    totalClinics: number;
    totalLeads: number;
    totalCampaigns: number;
    activeCampaigns: number;
    pendingBookings: number;
    leadsByStatus: {
      new: number;
      contacted: number;
      warm: number;
      replied: number;
      demo_booked: number;
      won: number;
      lost: number;
    };
  }>;
  
  getRecentLeads(limit: number, clinicId?: string): Promise<(Lead & { clinicName: string | null })[]>;
  
  getCampaignsWithStats(clinicId?: string): Promise<(OutreachCampaign & { clinicName: string | null })[]>;
  
  // Sequence enrollment with lead info
  getEnrollmentsByLead(leadId: string): Promise<(SequenceEnrollment & { sequenceName: string })[]>;
  updateSequenceEnrollment(id: string, data: Partial<InsertSequenceEnrollment> & { nextSendAt?: Date; completedAt?: Date }): Promise<SequenceEnrollment>;
  getActiveEnrollmentsDue(): Promise<(SequenceEnrollment & { lead: Lead; sequence: Sequence; step: SequenceStep | null })[]>;
  
  // Marketing Sync Engine operations (72-hour cooldown)
  getClinicsEligibleForOutreach(cooldownHours?: number): Promise<Clinic[]>;
  updateClinicLastEmailedAt(clinicId: string): Promise<void>;
  getLeadsForOutreach(clinicId: string): Promise<Lead[]>;
  
  // Outreach logs operations
  createOutreachLog(log: InsertOutreachLog): Promise<OutreachLog>;
  getOutreachLogsByClinic(clinicId: string): Promise<OutreachLog[]>;
  getOutreachLogsByCycle(cycleId: string): Promise<OutreachLog[]>;
  getRecentOutreachLogs(limit: number): Promise<OutreachLog[]>;
  getOutreachStats(): Promise<{
    totalSent: number;
    successfulSends: number;
    failedSends: number;
    lastCycleAt: Date | null;
    clinicsEmailed: number;
  }>;
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

  async getLeadsWithEmail(clinicId: string): Promise<Lead[]> {
    return await db.select().from(leads)
      .where(and(
        eq(leads.clinicId, clinicId),
        sql`${leads.email} IS NOT NULL AND ${leads.email} != ''`
      ))
      .orderBy(desc(leads.createdAt));
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [newLead] = await db.insert(leads).values(lead).returning();
    return newLead;
  }

  async importLeads(leadsData: InsertLead[]): Promise<Lead[]> {
    if (leadsData.length === 0) return [];
    const importedLeads = await db.insert(leads).values(leadsData).returning();
    return importedLeads;
  }

  async getLeadById(id: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async getLeadsByEmail(email: string): Promise<Lead[]> {
    return await db.select().from(leads).where(eq(leads.email, email)).orderBy(desc(leads.createdAt));
  }
  
  async getLeadsByEmailAndClinic(email: string, clinicId: string): Promise<Lead[]> {
    return await db.select().from(leads)
      .where(and(eq(leads.email, email), eq(leads.clinicId, clinicId)))
      .orderBy(desc(leads.createdAt));
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

  // Deduplication methods for external imports
  // Primary dedupe: googleMapsUrl (unique when present)
  async findLeadByGoogleMapsUrl(googleMapsUrl: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads)
      .where(eq(leads.googleMapsUrl, googleMapsUrl));
    return lead;
  }

  // Secondary dedupe: email + city + country combination
  async findLeadByEmailAndCity(email: string, city: string, country: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads)
      .where(and(
        eq(leads.email, email),
        eq(leads.city, city),
        eq(leads.country, country)
      ));
    return lead;
  }

  // Upsert with deduplication logic
  // Returns { lead, existing: true } if found and merged, { lead, existing: false } if new
  // Handles race conditions gracefully by retrying on unique constraint violation
  async upsertLeadByDedupe(leadData: InsertLead): Promise<{ lead: Lead; existing: boolean }> {
    // Helper function to merge data into existing lead
    const mergeIntoExisting = async (existingLead: Lead, newData: InsertLead): Promise<{ lead: Lead; existing: boolean }> => {
      const mergedData: Partial<InsertLead> = {};
      if (!existingLead.phone && newData.phone) mergedData.phone = newData.phone;
      if (!existingLead.email && newData.email) mergedData.email = newData.email;
      if (!existingLead.websiteUrl && newData.websiteUrl) mergedData.websiteUrl = newData.websiteUrl;
      if (!existingLead.address && newData.address) mergedData.address = newData.address;
      if (!existingLead.googleMapsUrl && newData.googleMapsUrl) mergedData.googleMapsUrl = newData.googleMapsUrl;
      if (newData.notes && newData.notes !== existingLead.notes) {
        mergedData.notes = existingLead.notes 
          ? `${existingLead.notes}\n---\n${newData.notes}` 
          : newData.notes;
      }
      // Always update lastImportedAt for synced leads
      mergedData.lastImportedAt = new Date();
      
      if (Object.keys(mergedData).length > 0) {
        const updated = await this.updateLead(existingLead.id, mergedData);
        return { lead: updated || existingLead, existing: true };
      }
      return { lead: existingLead, existing: true };
    };

    // Primary dedupe: Check googleMapsUrl first (most reliable for maps-helper imports)
    if (leadData.googleMapsUrl) {
      const existingByMaps = await this.findLeadByGoogleMapsUrl(leadData.googleMapsUrl);
      if (existingByMaps) {
        return mergeIntoExisting(existingByMaps, leadData);
      }
    }

    // Secondary dedupe: Check email + city + country (fallback when no googleMapsUrl)
    if (leadData.email && leadData.city && leadData.country) {
      const existingByEmail = await this.findLeadByEmailAndCity(
        leadData.email, 
        leadData.city, 
        leadData.country
      );
      if (existingByEmail) {
        return mergeIntoExisting(existingByEmail, leadData);
      }
    }

    // No duplicate found - attempt to create new lead
    // Handle race condition: if unique constraint violated, retry lookup and merge
    try {
      const newLead = await this.createLead({
        ...leadData,
        lastImportedAt: new Date(),
      });
      return { lead: newLead, existing: false };
    } catch (error) {
      // Check if this is a unique constraint violation (race condition)
      if (error instanceof Error && error.message.includes("unique constraint")) {
        // Race condition: another request inserted this lead concurrently
        // Retry lookup and merge instead of failing
        if (leadData.googleMapsUrl) {
          const existingByMaps = await this.findLeadByGoogleMapsUrl(leadData.googleMapsUrl);
          if (existingByMaps) {
            return mergeIntoExisting(existingByMaps, leadData);
          }
        }
        if (leadData.email && leadData.city && leadData.country) {
          const existingByEmail = await this.findLeadByEmailAndCity(
            leadData.email, 
            leadData.city, 
            leadData.country
          );
          if (existingByEmail) {
            return mergeIntoExisting(existingByEmail, leadData);
          }
        }
      }
      // Re-throw if not a handled constraint violation
      throw error;
    }
  }

  // Import stats for admin dashboard
  async getImportStats(): Promise<{
    totalLeads: number;
    totalMapsHelperLeads: number;
    lastImportedAt: Date | null;
    importedTodayCount: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [stats] = await db.select({
      totalLeads: sql<number>`count(*)::int`,
      totalMapsHelperLeads: sql<number>`count(*) filter (where source = 'maps-helper')::int`,
      lastImportedAt: sql<Date>`max(last_imported_at)`,
      importedTodayCount: sql<number>`count(*) filter (where last_imported_at >= ${today})::int`,
    }).from(leads);

    return {
      totalLeads: stats.totalLeads || 0,
      totalMapsHelperLeads: stats.totalMapsHelperLeads || 0,
      lastImportedAt: stats.lastImportedAt || null,
      importedTodayCount: stats.importedTodayCount || 0,
    };
  }

  // Clinic operations
  async getAllClinics(): Promise<Clinic[]> {
    return await db.select().from(clinics).orderBy(desc(clinics.createdAt));
  }

  async getClinicsWithSyncedLeads(): Promise<Clinic[]> {
    // Get distinct clinic IDs that have at least one synced lead
    const clinicIdsWithLeads = await db
      .selectDistinct({ clinicId: leads.clinicId })
      .from(leads)
      .where(eq(leads.syncStatus, "synced"));
    
    if (clinicIdsWithLeads.length === 0) {
      return [];
    }
    
    // Filter out null clinicIds and get the actual clinic records
    const validClinicIds = clinicIdsWithLeads
      .map(row => row.clinicId)
      .filter((id): id is string => id !== null);
    
    if (validClinicIds.length === 0) {
      return [];
    }
    
    // Fetch the clinic records for these IDs
    const result = await db
      .select()
      .from(clinics)
      .where(sql`${clinics.id} IN (${sql.join(validClinicIds.map(id => sql`${id}`), sql`, `)})`)
      .orderBy(clinics.name);
    
    return result;
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
        address: clinics.address,
        city: clinics.city,
        state: clinics.state,
        country: clinics.country,
        phone: clinics.phone,
        email: clinics.email,
        website: clinics.website,
        timezone: clinics.timezone,
        businessHours: clinics.businessHours,
        services: clinics.services,
        emailProvider: clinics.emailProvider,
        smsEnabled: clinics.smsEnabled,
        onboardingCompleted: clinics.onboardingCompleted,
        externalId: clinics.externalId,
        googleMapsUrl: clinics.googleMapsUrl,
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

  async findClinicByGoogleMapsUrl(googleMapsUrl: string): Promise<Clinic | undefined> {
    const [clinic] = await db
      .select()
      .from(clinics)
      .where(eq(clinics.googleMapsUrl, googleMapsUrl))
      .limit(1);
    return clinic;
  }

  async findClinicByNameAndLocation(name: string, city?: string, state?: string): Promise<Clinic | undefined> {
    // Build conditions array
    const conditions = [eq(clinics.name, name)];
    
    // Add city filter if provided
    if (city) {
      conditions.push(eq(clinics.city, city));
    }
    
    // Add state filter if provided
    if (state) {
      conditions.push(eq(clinics.state, state));
    }
    
    // Query with all conditions combined
    const [clinic] = await db
      .select()
      .from(clinics)
      .where(and(...conditions))
      .limit(1);
    
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
  
  async getBookingsByClinic(clinicId: string): Promise<Booking[]> {
    return await db.select().from(bookings)
      .where(eq(bookings.clinicId, clinicId))
      .orderBy(desc(bookings.createdAt));
  }

  async getBookingById(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async updateBooking(id: string, updates: Partial<InsertBooking>): Promise<Booking | undefined> {
    const [updatedBooking] = await db
      .update(bookings)
      .set(updates)
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking;
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

  async getCampaignById(id: string): Promise<OutreachCampaign | undefined> {
    const [campaign] = await db.select().from(outreachCampaigns).where(eq(outreachCampaigns.id, id));
    return campaign;
  }

  async updateCampaignByClinic(id: string, clinicId: string, data: Partial<InsertOutreachCampaign> & { totalSent?: number; sentToday?: number }): Promise<OutreachCampaign | undefined> {
    const [updated] = await db
      .update(outreachCampaigns)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(outreachCampaigns.id, id),
          eq(outreachCampaigns.clinicId, clinicId)
        )
      )
      .returning();
    return updated;
  }

  // Campaign-Leads operations (for automatic lead loading)
  async getCampaignLeads(campaignId: string): Promise<(CampaignLead & { lead: Lead })[]> {
    const results = await db
      .select({
        id: campaignLeads.id,
        campaignId: campaignLeads.campaignId,
        leadId: campaignLeads.leadId,
        status: campaignLeads.status,
        sentAt: campaignLeads.sentAt,
        openedAt: campaignLeads.openedAt,
        clickedAt: campaignLeads.clickedAt,
        errorMessage: campaignLeads.errorMessage,
        addedAt: campaignLeads.addedAt,
        lead: leads,
      })
      .from(campaignLeads)
      .innerJoin(leads, eq(campaignLeads.leadId, leads.id))
      .where(eq(campaignLeads.campaignId, campaignId))
      .orderBy(desc(campaignLeads.addedAt));
    
    return results.map(r => ({
      ...r,
      lead: r.lead,
    }));
  }

  async addLeadsToCampaign(campaignId: string, leadIds: string[]): Promise<CampaignLead[]> {
    if (leadIds.length === 0) return [];
    
    const values = leadIds.map(leadId => ({
      campaignId,
      leadId,
      status: "pending" as const,
    }));
    
    const inserted = await db
      .insert(campaignLeads)
      .values(values)
      .onConflictDoNothing()
      .returning();
    
    return inserted;
  }

  async removeLeadFromCampaign(campaignId: string, leadId: string): Promise<void> {
    await db
      .delete(campaignLeads)
      .where(
        and(
          eq(campaignLeads.campaignId, campaignId),
          eq(campaignLeads.leadId, leadId)
        )
      );
  }

  async getSyncedLeadsForClinic(clinicId: string): Promise<Lead[]> {
    // Get all synced leads that are campaign-ready:
    // 1. Leads belonging to this clinic, OR
    // 2. Global leads (no clinicId) from DentalMapsHelper available to all clinics
    return await db
      .select()
      .from(leads)
      .where(
        and(
          or(
            eq(leads.clinicId, clinicId),
            isNull(leads.clinicId)
          ),
          eq(leads.syncStatus, "synced"),
          eq(leads.marketingOptIn, true)
        )
      )
      .orderBy(desc(leads.createdAt));
  }

  async autoLoadLeadsToCampaign(campaignId: string, clinicId: string): Promise<{ added: number; skipped: number }> {
    // Get all synced leads for this clinic that are campaign-ready
    const syncedLeads = await this.getSyncedLeadsForClinic(clinicId);
    
    // Get existing leads in this campaign to avoid duplicates
    const existingCampaignLeads = await db
      .select({ leadId: campaignLeads.leadId })
      .from(campaignLeads)
      .where(eq(campaignLeads.campaignId, campaignId));
    
    const existingLeadIds = new Set(existingCampaignLeads.map(cl => cl.leadId));
    
    // Filter out leads that are already in the campaign
    const newLeadIds = syncedLeads
      .filter(lead => !existingLeadIds.has(lead.id))
      .map(lead => lead.id);
    
    if (newLeadIds.length === 0) {
      return { added: 0, skipped: syncedLeads.length };
    }
    
    // Add the new leads
    const added = await this.addLeadsToCampaign(campaignId, newLeadIds);
    
    return {
      added: added.length,
      skipped: existingLeadIds.size,
    };
  }

  async updateCampaignLeadStatus(id: string, status: string, errorMessage?: string): Promise<void> {
    await db
      .update(campaignLeads)
      .set({
        status,
        errorMessage: errorMessage || null,
      })
      .where(eq(campaignLeads.id, id));
  }

  async markCampaignLeadSent(campaignLeadId: string): Promise<void> {
    await db
      .update(campaignLeads)
      .set({
        status: "sent",
        sentAt: new Date(),
      })
      .where(eq(campaignLeads.id, campaignLeadId));
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
  
  // Enhanced Dashboard operations
  async getDashboardStats(clinicId?: string): Promise<{
    totalClinics: number;
    totalLeads: number;
    totalCampaigns: number;
    activeCampaigns: number;
    pendingBookings: number;
    leadsByStatus: {
      new: number;
      contacted: number;
      warm: number;
      replied: number;
      demo_booked: number;
      won: number;
      lost: number;
    };
  }> {
    // Get total clinics
    const [clinicsCount] = await db.select({ count: sql<number>`count(*)::int` }).from(clinics);
    
    // Get leads count (filtered by clinic if provided)
    const leadsQuery = clinicId 
      ? db.select({ count: sql<number>`count(*)::int` }).from(leads).where(eq(leads.clinicId, clinicId))
      : db.select({ count: sql<number>`count(*)::int` }).from(leads);
    const [leadsCount] = await leadsQuery;
    
    // Get campaigns count
    const campaignsQuery = clinicId
      ? db.select({ count: sql<number>`count(*)::int` }).from(outreachCampaigns).where(eq(outreachCampaigns.clinicId, clinicId))
      : db.select({ count: sql<number>`count(*)::int` }).from(outreachCampaigns);
    const [campaignsCount] = await campaignsQuery;
    
    // Get active campaigns count
    const activeCampaignsQuery = clinicId
      ? db.select({ count: sql<number>`count(*)::int` }).from(outreachCampaigns).where(and(eq(outreachCampaigns.clinicId, clinicId), eq(outreachCampaigns.status, "active")))
      : db.select({ count: sql<number>`count(*)::int` }).from(outreachCampaigns).where(eq(outreachCampaigns.status, "active"));
    const [activeCampaignsCount] = await activeCampaignsQuery;
    
    // Get pending bookings
    const pendingQuery = clinicId
      ? db.select({ count: sql<number>`count(*)::int` }).from(patientBookings).where(and(eq(patientBookings.clinicId, clinicId), eq(patientBookings.status, "pending")))
      : db.select({ count: sql<number>`count(*)::int` }).from(patientBookings).where(eq(patientBookings.status, "pending"));
    const [pendingCount] = await pendingQuery;
    
    // Get leads by status
    const statusCounts = await Promise.all([
      clinicId 
        ? db.select({ count: sql<number>`count(*)::int` }).from(leads).where(and(eq(leads.clinicId, clinicId), eq(leads.status, "new")))
        : db.select({ count: sql<number>`count(*)::int` }).from(leads).where(eq(leads.status, "new")),
      clinicId 
        ? db.select({ count: sql<number>`count(*)::int` }).from(leads).where(and(eq(leads.clinicId, clinicId), eq(leads.status, "contacted")))
        : db.select({ count: sql<number>`count(*)::int` }).from(leads).where(eq(leads.status, "contacted")),
      clinicId 
        ? db.select({ count: sql<number>`count(*)::int` }).from(leads).where(and(eq(leads.clinicId, clinicId), eq(leads.status, "warm")))
        : db.select({ count: sql<number>`count(*)::int` }).from(leads).where(eq(leads.status, "warm")),
      clinicId 
        ? db.select({ count: sql<number>`count(*)::int` }).from(leads).where(and(eq(leads.clinicId, clinicId), eq(leads.status, "replied")))
        : db.select({ count: sql<number>`count(*)::int` }).from(leads).where(eq(leads.status, "replied")),
      clinicId 
        ? db.select({ count: sql<number>`count(*)::int` }).from(leads).where(and(eq(leads.clinicId, clinicId), eq(leads.status, "demo_booked")))
        : db.select({ count: sql<number>`count(*)::int` }).from(leads).where(eq(leads.status, "demo_booked")),
      clinicId 
        ? db.select({ count: sql<number>`count(*)::int` }).from(leads).where(and(eq(leads.clinicId, clinicId), eq(leads.status, "won")))
        : db.select({ count: sql<number>`count(*)::int` }).from(leads).where(eq(leads.status, "won")),
      clinicId 
        ? db.select({ count: sql<number>`count(*)::int` }).from(leads).where(and(eq(leads.clinicId, clinicId), eq(leads.status, "lost")))
        : db.select({ count: sql<number>`count(*)::int` }).from(leads).where(eq(leads.status, "lost")),
    ]);
    
    return {
      totalClinics: clinicsCount?.count || 0,
      totalLeads: leadsCount?.count || 0,
      totalCampaigns: campaignsCount?.count || 0,
      activeCampaigns: activeCampaignsCount?.count || 0,
      pendingBookings: pendingCount?.count || 0,
      leadsByStatus: {
        new: statusCounts[0][0]?.count || 0,
        contacted: statusCounts[1][0]?.count || 0,
        warm: statusCounts[2][0]?.count || 0,
        replied: statusCounts[3][0]?.count || 0,
        demo_booked: statusCounts[4][0]?.count || 0,
        won: statusCounts[5][0]?.count || 0,
        lost: statusCounts[6][0]?.count || 0,
      },
    };
  }
  
  async getRecentLeads(limit: number, clinicId?: string): Promise<(Lead & { clinicName: string | null })[]> {
    const query = clinicId
      ? db.select({
          id: leads.id,
          clinicId: leads.clinicId,
          name: leads.name,
          email: leads.email,
          phone: leads.phone,
          address: leads.address,
          city: leads.city,
          state: leads.state,
          country: leads.country,
          notes: leads.notes,
          googleMapsUrl: leads.googleMapsUrl,
          websiteUrl: leads.websiteUrl,
          source: leads.source,
          marketingOptIn: leads.marketingOptIn,
          tags: leads.tags,
          status: leads.status,
          contactedAt: leads.contactedAt,
          createdAt: leads.createdAt,
          updatedAt: leads.updatedAt,
          lastImportedAt: leads.lastImportedAt,
          syncStatus: leads.syncStatus,
          externalSourceId: leads.externalSourceId,
          syncError: leads.syncError,
          lastSyncedAt: leads.lastSyncedAt,
          rating: leads.rating,
          reviewCount: leads.reviewCount,
          clinicName: clinics.name,
        })
        .from(leads)
        .leftJoin(clinics, eq(leads.clinicId, clinics.id))
        .where(eq(leads.clinicId, clinicId))
        .orderBy(desc(leads.createdAt))
        .limit(limit)
      : db.select({
          id: leads.id,
          clinicId: leads.clinicId,
          name: leads.name,
          email: leads.email,
          phone: leads.phone,
          address: leads.address,
          city: leads.city,
          state: leads.state,
          country: leads.country,
          notes: leads.notes,
          googleMapsUrl: leads.googleMapsUrl,
          websiteUrl: leads.websiteUrl,
          source: leads.source,
          marketingOptIn: leads.marketingOptIn,
          tags: leads.tags,
          status: leads.status,
          contactedAt: leads.contactedAt,
          createdAt: leads.createdAt,
          updatedAt: leads.updatedAt,
          lastImportedAt: leads.lastImportedAt,
          syncStatus: leads.syncStatus,
          externalSourceId: leads.externalSourceId,
          syncError: leads.syncError,
          lastSyncedAt: leads.lastSyncedAt,
          rating: leads.rating,
          reviewCount: leads.reviewCount,
          clinicName: clinics.name,
        })
        .from(leads)
        .leftJoin(clinics, eq(leads.clinicId, clinics.id))
        .orderBy(desc(leads.createdAt))
        .limit(limit);
    
    return await query;
  }
  
  async getCampaignsWithStats(clinicId?: string): Promise<(OutreachCampaign & { clinicName: string | null })[]> {
    const query = clinicId
      ? db.select({
          id: outreachCampaigns.id,
          clinicId: outreachCampaigns.clinicId,
          name: outreachCampaigns.name,
          type: outreachCampaigns.type,
          subject: outreachCampaigns.subject,
          message: outreachCampaigns.message,
          status: outreachCampaigns.status,
          dailyLimit: outreachCampaigns.dailyLimit,
          sentToday: outreachCampaigns.sentToday,
          totalSent: outreachCampaigns.totalSent,
          targetUrl: outreachCampaigns.targetUrl,
          mediaUrl: outreachCampaigns.mediaUrl,
          hashtags: outreachCampaigns.hashtags,
          createdAt: outreachCampaigns.createdAt,
          updatedAt: outreachCampaigns.updatedAt,
          clinicName: clinics.name,
        })
        .from(outreachCampaigns)
        .leftJoin(clinics, eq(outreachCampaigns.clinicId, clinics.id))
        .where(eq(outreachCampaigns.clinicId, clinicId))
        .orderBy(desc(outreachCampaigns.createdAt))
      : db.select({
          id: outreachCampaigns.id,
          clinicId: outreachCampaigns.clinicId,
          name: outreachCampaigns.name,
          type: outreachCampaigns.type,
          subject: outreachCampaigns.subject,
          message: outreachCampaigns.message,
          status: outreachCampaigns.status,
          dailyLimit: outreachCampaigns.dailyLimit,
          sentToday: outreachCampaigns.sentToday,
          totalSent: outreachCampaigns.totalSent,
          targetUrl: outreachCampaigns.targetUrl,
          mediaUrl: outreachCampaigns.mediaUrl,
          hashtags: outreachCampaigns.hashtags,
          createdAt: outreachCampaigns.createdAt,
          updatedAt: outreachCampaigns.updatedAt,
          clinicName: clinics.name,
        })
        .from(outreachCampaigns)
        .leftJoin(clinics, eq(outreachCampaigns.clinicId, clinics.id))
        .orderBy(desc(outreachCampaigns.createdAt));
    
    return await query;
  }
  
  // Sequence enrollment with lead info
  async getEnrollmentsByLead(leadId: string): Promise<(SequenceEnrollment & { sequenceName: string })[]> {
    const results = await db.select({
      id: sequenceEnrollments.id,
      sequenceId: sequenceEnrollments.sequenceId,
      leadId: sequenceEnrollments.leadId,
      currentStepOrder: sequenceEnrollments.currentStepOrder,
      status: sequenceEnrollments.status,
      nextSendAt: sequenceEnrollments.nextSendAt,
      enrolledAt: sequenceEnrollments.enrolledAt,
      completedAt: sequenceEnrollments.completedAt,
      sequenceName: sequences.name,
    })
    .from(sequenceEnrollments)
    .innerJoin(sequences, eq(sequenceEnrollments.sequenceId, sequences.id))
    .where(eq(sequenceEnrollments.leadId, leadId))
    .orderBy(desc(sequenceEnrollments.enrolledAt));
    
    return results;
  }
  
  async updateSequenceEnrollment(id: string, data: Partial<InsertSequenceEnrollment> & { nextSendAt?: Date; completedAt?: Date }): Promise<SequenceEnrollment> {
    const [updated] = await db
      .update(sequenceEnrollments)
      .set(data)
      .where(eq(sequenceEnrollments.id, id))
      .returning();
    return updated;
  }
  
  async getActiveEnrollmentsDue(): Promise<(SequenceEnrollment & { lead: Lead; sequence: Sequence; step: SequenceStep | null })[]> {
    const now = new Date();
    
    // Get enrollments where nextSendAt is in the past and status is active
    const enrollments = await db.select()
      .from(sequenceEnrollments)
      .where(and(
        eq(sequenceEnrollments.status, "active"),
        sql`${sequenceEnrollments.nextSendAt} <= ${now}`
      ));
    
    const results: (SequenceEnrollment & { lead: Lead; sequence: Sequence; step: SequenceStep | null })[] = [];
    
    for (const enrollment of enrollments) {
      const lead = await this.getLeadById(enrollment.leadId);
      const sequence = await this.getSequenceById(enrollment.sequenceId);
      
      if (!lead || !sequence) continue;
      
      // Get the next step to send
      const [step] = await db.select()
        .from(sequenceSteps)
        .where(and(
          eq(sequenceSteps.sequenceId, enrollment.sequenceId),
          eq(sequenceSteps.stepOrder, enrollment.currentStepOrder + 1)
        ));
      
      results.push({
        ...enrollment,
        lead,
        sequence,
        step: step || null,
      });
    }
    
    return results;
  }
  
  // Marketing Sync Engine operations (72-hour cooldown)
  async getClinicsEligibleForOutreach(cooldownHours: number = 72): Promise<Clinic[]> {
    const cooldownDate = new Date();
    cooldownDate.setHours(cooldownDate.getHours() - cooldownHours);
    
    // Get clinics that have:
    // 1. Valid email OR
    // 2. Have synced leads with valid emails
    // AND have not been emailed in the last 72 hours (or never emailed)
    const clinicsWithLeads = await db
      .selectDistinct({
        id: clinics.id,
        name: clinics.name,
        slug: clinics.slug,
        logoUrl: clinics.logoUrl,
        brandColor: clinics.brandColor,
        ownerId: clinics.ownerId,
        address: clinics.address,
        city: clinics.city,
        state: clinics.state,
        country: clinics.country,
        phone: clinics.phone,
        email: clinics.email,
        website: clinics.website,
        timezone: clinics.timezone,
        businessHours: clinics.businessHours,
        services: clinics.services,
        emailProvider: clinics.emailProvider,
        smsEnabled: clinics.smsEnabled,
        onboardingCompleted: clinics.onboardingCompleted,
        externalId: clinics.externalId,
        googleMapsUrl: clinics.googleMapsUrl,
        lastEmailedAt: clinics.lastEmailedAt,
        createdAt: clinics.createdAt,
        updatedAt: clinics.updatedAt,
      })
      .from(clinics)
      .leftJoin(leads, eq(clinics.id, leads.clinicId))
      .where(and(
        // Clinic has valid email OR has leads with valid emails
        or(
          and(isNotNull(clinics.email), ne(clinics.email, '')),
          and(isNotNull(leads.email), ne(leads.email, ''))
        ),
        // Cooldown check: never emailed OR last emailed more than 72 hours ago
        or(
          isNull(clinics.lastEmailedAt),
          lt(clinics.lastEmailedAt, cooldownDate)
        )
      ))
      .orderBy(clinics.name);
    
    return clinicsWithLeads;
  }
  
  async updateClinicLastEmailedAt(clinicId: string): Promise<void> {
    await db
      .update(clinics)
      .set({ lastEmailedAt: new Date(), updatedAt: new Date() })
      .where(eq(clinics.id, clinicId));
  }
  
  async getLeadsForOutreach(clinicId: string): Promise<Lead[]> {
    // Get leads that:
    // 1. Belong to this clinic
    // 2. Have valid email
    // 3. Have status="new" or status="contacted"
    // 4. Have marketingOptIn=true
    // 5. Are synced (syncStatus="synced")
    return await db
      .select()
      .from(leads)
      .where(and(
        eq(leads.clinicId, clinicId),
        isNotNull(leads.email),
        ne(leads.email, ''),
        or(eq(leads.status, 'new'), eq(leads.status, 'contacted')),
        eq(leads.marketingOptIn, true),
        eq(leads.syncStatus, 'synced')
      ))
      .orderBy(desc(leads.createdAt));
  }
  
  // Outreach logs operations
  async createOutreachLog(log: InsertOutreachLog): Promise<OutreachLog> {
    const [newLog] = await db.insert(outreachLogs).values(log).returning();
    return newLog;
  }
  
  async getOutreachLogsByClinic(clinicId: string): Promise<OutreachLog[]> {
    return await db
      .select()
      .from(outreachLogs)
      .where(eq(outreachLogs.clinicId, clinicId))
      .orderBy(desc(outreachLogs.sentAt));
  }
  
  async getOutreachLogsByCycle(cycleId: string): Promise<OutreachLog[]> {
    return await db
      .select()
      .from(outreachLogs)
      .where(eq(outreachLogs.cycleId, cycleId))
      .orderBy(desc(outreachLogs.sentAt));
  }
  
  async getRecentOutreachLogs(limit: number): Promise<OutreachLog[]> {
    return await db
      .select()
      .from(outreachLogs)
      .orderBy(desc(outreachLogs.sentAt))
      .limit(limit);
  }
  
  async getOutreachStats(): Promise<{
    totalSent: number;
    successfulSends: number;
    failedSends: number;
    lastCycleAt: Date | null;
    clinicsEmailed: number;
  }> {
    const [stats] = await db.select({
      totalSent: sql<number>`count(*)::int`,
      successfulSends: sql<number>`count(*) filter (where status = 'sent')::int`,
      failedSends: sql<number>`count(*) filter (where status = 'failed')::int`,
      lastCycleAt: sql<Date>`max(sent_at)`,
      clinicsEmailed: sql<number>`count(distinct clinic_id)::int`,
    }).from(outreachLogs);
    
    return {
      totalSent: stats.totalSent || 0,
      successfulSends: stats.successfulSends || 0,
      failedSends: stats.failedSends || 0,
      lastCycleAt: stats.lastCycleAt || null,
      clinicsEmailed: stats.clinicsEmailed || 0,
    };
  }
}

export const storage = new DatabaseStorage();
