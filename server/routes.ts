// Referenced from javascript_log_in_with_replit blueprint
import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateChatResponse, generateOutreachDraft } from "./openai";
import { insertLeadSchema, insertClinicSchema, insertBookingSchema, insertSequenceSchema, insertSequenceStepSchema, insertSequenceEnrollmentSchema, loginSchema, createUserSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "attached_assets", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage_multer,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for deployment monitoring
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Serve uploaded files
  app.use("/uploads", express.static(uploadDir));
  
  // Set up session and auth middleware FIRST (before any routes that need session)
  await setupAuth(app);
  
  // Email/password login endpoint
  app.post("/api/auth/login", async (req: any, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Set up session
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.isAuthenticated = true;
      
      // Explicitly save session before responding
      req.session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Login failed" });
        }
        
        // Return user data without password
        const { password: _, ...userWithoutPassword } = user;
        res.json({ 
          user: userWithoutPassword,
          redirectTo: user.role === 'admin' ? '/admin' : '/clinic/dashboard'
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid email or password format" });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Email/password logout endpoint
  app.post("/api/auth/logout", (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current session user (for email/password auth)
  app.get("/api/auth/session", (req: any, res) => {
    if (req.session?.isAuthenticated && req.session?.userId) {
      storage.getUser(req.session.userId)
        .then(user => {
          if (user) {
            const { password: _, ...userWithoutPassword } = user;
            res.json({ user: userWithoutPassword, isAuthenticated: true });
          } else {
            res.json({ user: null, isAuthenticated: false });
          }
        })
        .catch(() => res.json({ user: null, isAuthenticated: false }));
    } else {
      res.json({ user: null, isAuthenticated: false });
    }
  });

  // Seed admin user endpoint (call once to set up admin)
  app.post("/api/auth/seed-admin", async (req, res) => {
    try {
      const existingAdmin = await storage.getUserByEmail("admin@dentalfunnel.com");
      if (existingAdmin) {
        return res.json({ message: "Admin user already exists" });
      }
      
      const hashedPassword = await bcrypt.hash("Admin123!", 10);
      const admin = await storage.createUserWithPassword(
        "admin@dentalfunnel.com",
        hashedPassword,
        "admin",
        "Admin",
        "User"
      );
      
      res.json({ message: "Admin user created successfully", email: admin.email });
    } catch (error) {
      console.error("Seed admin error:", error);
      res.status(500).json({ message: "Failed to create admin user" });
    }
  });

  // Create new user (admin only)
  app.post("/api/users", async (req: any, res) => {
    try {
      // Check if requester is authenticated and is admin
      if (!req.session?.isAuthenticated || !req.session?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const adminUser = await storage.getUser(req.session.userId);
      if (!adminUser || adminUser.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can create users" });
      }
      
      // Validate request body
      const { email, password, firstName, lastName, role, clinicId } = createUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      // Hash password and create user
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await storage.createUserWithPassword(
        email,
        hashedPassword,
        role || 'clinic',
        firstName,
        lastName
      );
      
      // If clinicId provided, link user to clinic
      if (clinicId) {
        await storage.addUserToClinic(newUser.id, clinicId, 'member');
      }
      
      const { password: _, ...userWithoutPassword } = newUser;
      res.json({ user: userWithoutPassword, message: "User created successfully" });
    } catch (error) {
      console.error("Create user error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Get all users (admin only)
  app.get("/api/users", async (req: any, res) => {
    try {
      if (!req.session?.isAuthenticated || !req.session?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const adminUser = await storage.getUser(req.session.userId);
      if (!adminUser || adminUser.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can view users" });
      }
      
      const allUsers = await storage.getAllUsers();
      const usersWithoutPasswords = allUsers.map(u => {
        const { password: _, ...rest } = u;
        return rest;
      });
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  // Auth routes (Replit Auth - for backward compatibility)
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Helper to check if user is authenticated (either OIDC or session-based)
  // Returns the user ID if authenticated, null otherwise
  const requireAuth = (req: any, res: any): boolean => {
    // Check session-based auth first
    if (req.session?.isAuthenticated && req.session?.userId) {
      return true;
    }
    // Fall back to OIDC auth
    if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
      return true;
    }
    res.status(401).json({ message: "Unauthorized" });
    return false;
  };
  
  // Helper to get user ID from session or OIDC
  const getUserId = (req: any): string | null => {
    if (req.session?.userId) {
      return req.session.userId;
    }
    if (req.user?.claims?.sub) {
      return req.user.claims.sub;
    }
    return null;
  };
  
  // Helper to check if user has admin role
  const requireAdminRole = async (req: any, res: any): Promise<boolean> => {
    if (!requireAuth(req, res)) return false;
    
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return false;
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ message: "Forbidden: Admin access required" });
      return false;
    }
    
    return true;
  };

  // Lead routes
  app.get("/api/leads", async (req: any, res) => {
    try {
      if (!requireAuth(req, res)) return;
      
      const leads = await storage.getAllLeads();
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post("/api/leads/import", async (req: any, res) => {
    try {
      if (!await requireAdminRole(req, res)) return;
      
      const { leads } = req.body;

      if (!Array.isArray(leads) || leads.length === 0) {
        return res.status(400).json({ message: "Invalid leads data" });
      }

      // Transform and validate leads
      const validLeads = leads
        .filter((lead) => lead.name && lead.name.trim())
        .map((lead) => ({
          name: lead.name || lead.Name || "",
          email: lead.email || lead.Email || null,
          phone: lead.phone || lead.Phone || null,
          city: lead.city || lead.City || null,
          state: lead.state || lead.State || null,
          country: lead.country || lead.Country || "USA",
          notes: lead.notes || lead.Notes || null,
          status: "new",
        }));

      await storage.importLeads(validLeads);
      res.json({ message: "Leads imported successfully", count: validLeads.length });
    } catch (error) {
      console.error("Error importing leads:", error);
      res.status(500).json({ message: "Failed to import leads" });
    }
  });

  // Update lead status
  app.patch("/api/leads/:id/status", async (req: any, res) => {
    try {
      if (!await requireAdminRole(req, res)) return;
      
      const { id } = req.params;
      const { status } = req.body;
      
      const validStatuses = ["new", "contacted", "replied", "demo_booked", "won", "lost"];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be one of: new, contacted, replied, demo_booked, won, lost" });
      }
      
      await storage.updateLeadStatus(id, status);
      res.json({ message: "Lead status updated", id, status });
    } catch (error) {
      console.error("Error updating lead status:", error);
      res.status(500).json({ message: "Failed to update lead status" });
    }
  });

  // Get single lead
  app.get("/api/leads/:id", async (req: any, res) => {
    try {
      if (!requireAuth(req, res)) return;
      
      const { id } = req.params;
      const lead = await storage.getLeadById(id);
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      res.json(lead);
    } catch (error) {
      console.error("Error fetching lead:", error);
      res.status(500).json({ message: "Failed to fetch lead" });
    }
  });

  // Allowed fields for lead updates
  const allowedLeadUpdateFields = ['name', 'email', 'phone', 'city', 'state', 'country', 'notes', 'status'];

  // Update lead
  app.patch("/api/leads/:id", async (req: any, res) => {
    try {
      if (!await requireAdminRole(req, res)) return;
      
      const { id } = req.params;
      const updates = req.body;
      
      // Filter to only allowed fields
      const sanitizedUpdates: Record<string, any> = {};
      for (const field of allowedLeadUpdateFields) {
        if (updates[field] !== undefined) {
          sanitizedUpdates[field] = updates[field];
        }
      }
      
      // Check if any valid fields were provided
      if (Object.keys(sanitizedUpdates).length === 0) {
        return res.status(400).json({ 
          message: "No valid fields provided. Allowed fields: " + allowedLeadUpdateFields.join(", ") 
        });
      }
      
      // Validate status if included
      if (sanitizedUpdates.status) {
        const validStatuses = ["new", "contacted", "replied", "demo_booked", "won", "lost"];
        if (!validStatuses.includes(sanitizedUpdates.status)) {
          return res.status(400).json({ message: "Invalid status" });
        }
      }
      
      const updatedLead = await storage.updateLead(id, sanitizedUpdates);
      if (!updatedLead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      res.json(updatedLead);
    } catch (error) {
      console.error("Error updating lead:", error);
      res.status(500).json({ message: "Failed to update lead" });
    }
  });

  // Clinic routes
  app.get("/api/clinics", isAuthenticated, async (req, res) => {
    try {
      const clinics = await storage.getAllClinics();
      res.json(clinics);
    } catch (error) {
      console.error("Error fetching clinics:", error);
      res.status(500).json({ message: "Failed to fetch clinics" });
    }
  });

  app.post("/api/clinics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const clinicData = insertClinicSchema.parse({
        ...req.body,
        ownerId: userId,
      });
      const clinic = await storage.createClinic(clinicData);
      res.json(clinic);
    } catch (error) {
      console.error("Error creating clinic:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid clinic data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create clinic" });
    }
  });

  // Upload clinic logo with comprehensive error handling
  app.post("/api/clinics/:id/logo", isAuthenticated, (req, res) => {
    upload.single("logo")(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File size exceeds 5MB limit' });
          }
          return res.status(400).json({ message: `Upload error: ${err.message}` });
        }
        return res.status(400).json({ message: err.message || 'Invalid file upload' });
      }
      
      try {
        const { id } = req.params;
        
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        const logoUrl = `/uploads/${req.file.filename}`;
        const updatedClinic = await storage.updateClinic(id, { logoUrl });
        
        if (!updatedClinic) {
          fs.unlinkSync(req.file.path);
          return res.status(404).json({ message: "Clinic not found" });
        }
        
        res.json(updatedClinic);
      } catch (error) {
        if (req.file) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (cleanupError) {
            console.error("Error cleaning up file:", cleanupError);
          }
        }
        console.error("Error uploading logo:", error);
        res.status(500).json({ message: "Failed to upload logo" });
      }
    });
  });

  app.get("/api/clinics/slug/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const clinic = await storage.getClinicBySlug(slug);

      if (!clinic) {
        return res.status(404).json({ message: "Clinic not found" });
      }

      res.json(clinic);
    } catch (error) {
      console.error("Error fetching clinic:", error);
      res.status(500).json({ message: "Failed to fetch clinic" });
    }
  });

  // Booking routes - INSTANT DEMO DELIVERY
  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking(bookingData);
      
      // Generate demo URL using request origin for correct production URLs
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:5000';
      const baseUrl = `${protocol}://${host}`;
      const demoUrl = `${baseUrl}/demo`;
      
      // Log the email that would be sent (email integration not configured)
      console.log("=== INSTANT DEMO EMAIL ===");
      console.log(`To: ${bookingData.email}`);
      console.log(`Subject: Your DentalLeadGenius Demo Access is Ready!`);
      console.log(`---`);
      console.log(`Hi ${bookingData.ownerName},`);
      console.log(``);
      console.log(`Thank you for your interest in DentalLeadGenius!`);
      console.log(``);
      console.log(`Your instant demo access is ready. Click below to explore the platform:`);
      console.log(`Demo Link: ${demoUrl}`);
      console.log(``);
      console.log(`Clinic: ${bookingData.clinicName}`);
      console.log(`State: ${bookingData.state || 'Not specified'}`);
      console.log(``);
      console.log(`No scheduling needed - explore at your own pace!`);
      console.log(``);
      console.log(`Best regards,`);
      console.log(`The DentalLeadGenius Team`);
      console.log("=== END EMAIL ===");
      
      res.json({ ...booking, demoUrl });
    } catch (error) {
      console.error("Error creating booking:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.get("/api/bookings", isAuthenticated, async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Patient booking routes
  app.post("/api/patient-bookings", async (req, res) => {
    try {
      const { insertPatientBookingSchema } = await import("@shared/schema");
      const bookingData = insertPatientBookingSchema.parse(req.body);
      const booking = await storage.createPatientBooking(bookingData);
      res.json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      console.error("Error creating patient booking:", error);
      res.status(500).json({ message: "Failed to create patient booking" });
    }
  });

  app.get("/api/patient-bookings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const bookings = await storage.getPatientBookingsForUser(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching patient bookings:", error);
      res.status(500).json({ message: "Failed to fetch patient bookings" });
    }
  });

  app.get("/api/patient-bookings/clinic/:clinicId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const clinic = await storage.getClinicById(req.params.clinicId);
      if (!clinic || clinic.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied to this clinic" });
      }
      
      const bookings = await storage.getPatientBookingsByClinic(req.params.clinicId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching clinic patient bookings:", error);
      res.status(500).json({ message: "Failed to fetch patient bookings" });
    }
  });

  app.patch("/api/patient-bookings/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const { status } = req.body;
      const validStatuses = ["pending", "confirmed", "cancelled", "completed"];
      
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be one of: pending, confirmed, cancelled, completed" });
      }
      
      const bookings = await storage.getPatientBookingsForUser(userId);
      const booking = bookings.find(b => b.id === req.params.id);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found or access denied" });
      }
      
      await storage.updatePatientBookingStatus(req.params.id, status);
      res.json({ message: "Status updated successfully" });
    } catch (error) {
      console.error("Error updating patient booking status:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  // Chatbot routes
  app.post("/api/chatbot/send", async (req, res) => {
    try {
      const { threadId, type, clinicId, message } = req.body;

      if (!type || !message) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      let currentThreadId = threadId;

      // Create new thread if needed
      if (!currentThreadId) {
        const newThread = await storage.createChatbotThread({
          type,
          clinicId: clinicId || null,
        });
        currentThreadId = newThread.id;
      }

      // Save user message
      await storage.createChatbotMessage({
        threadId: currentThreadId,
        role: "user",
        content: message,
      });

      // Get conversation history
      const messages = await storage.getChatbotMessages(currentThreadId);
      const conversationHistory = messages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

      // Get clinic name if patient chatbot
      let clinicName: string | undefined;
      if (type === "patient" && clinicId) {
        const clinic = await storage.getClinicById(clinicId);
        clinicName = clinic?.name;
      }

      // Generate AI response
      const aiResponse = await generateChatResponse(conversationHistory, type, clinicName);

      // Save assistant message
      await storage.createChatbotMessage({
        threadId: currentThreadId,
        role: "assistant",
        content: aiResponse,
      });

      res.json({
        threadId: currentThreadId,
        message: aiResponse,
      });
    } catch (error) {
      console.error("Error in chatbot:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  app.get("/api/chatbot/messages/:threadId", async (req, res) => {
    try {
      const { threadId } = req.params;
      const messages = await storage.getChatbotMessages(threadId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Outreach campaign routes
  app.get("/api/campaigns", async (req: any, res) => {
    try {
      if (!requireAuth(req, res)) return;
      
      const campaigns = await storage.getAllCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/campaigns", async (req: any, res) => {
    try {
      if (!await requireAdminRole(req, res)) return;
      
      const campaignData = req.body;
      const campaign = await storage.createCampaign(campaignData);
      res.json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  app.post("/api/campaigns/generate-draft", async (req: any, res) => {
    try {
      if (!requireAuth(req, res)) return;
      
      const { type } = req.body;

      if (!type || !["email", "sms", "whatsapp"].includes(type)) {
        return res.status(400).json({ message: "Invalid campaign type" });
      }

      const draft = await generateOutreachDraft(type);
      res.json(draft);
    } catch (error) {
      console.error("Error generating draft:", error);
      res.status(500).json({ message: "Failed to generate draft" });
    }
  });

  // Analytics route
  app.get("/api/analytics", async (req: any, res) => {
    try {
      if (!requireAuth(req, res)) return;
      
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });
  
  // Chatbot Analytics route
  app.get("/api/analytics/chatbot", async (req: any, res) => {
    try {
      if (!requireAuth(req, res)) return;
      
      const chatbotAnalytics = await storage.getChatbotAnalytics();
      res.json(chatbotAnalytics);
    } catch (error) {
      console.error("Error fetching chatbot analytics:", error);
      res.status(500).json({ message: "Failed to fetch chatbot analytics" });
    }
  });
  
  // Get specific clinic by ID (authenticated - returns full clinic data for owner)
  app.get("/api/clinics/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const clinic = await storage.getClinicById(req.params.id);
      if (!clinic) {
        return res.status(404).json({ message: "Clinic not found" });
      }
      
      // Check ownership
      if (clinic.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(clinic);
    } catch (error) {
      console.error("Error fetching clinic:", error);
      res.status(500).json({ message: "Failed to fetch clinic" });
    }
  });
  
  // Get clinic-specific analytics
  app.get("/api/analytics/clinic/:clinicId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const clinic = await storage.getClinicById(req.params.clinicId);
      if (!clinic || clinic.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied to this clinic" });
      }
      
      const analytics = await storage.getClinicAnalytics(req.params.clinicId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching clinic analytics:", error);
      res.status(500).json({ message: "Failed to fetch clinic analytics" });
    }
  });
  
  // Get chatbot threads for a specific clinic
  app.get("/api/chatbot/threads/clinic/:clinicId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const clinic = await storage.getClinicById(req.params.clinicId);
      if (!clinic || clinic.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied to this clinic" });
      }
      
      const threads = await storage.getChatbotThreadsByClinic(req.params.clinicId);
      res.json(threads);
    } catch (error) {
      console.error("Error fetching clinic chat threads:", error);
      res.status(500).json({ message: "Failed to fetch chat threads" });
    }
  });
  
  // ================== SEQUENCE ROUTES ==================
  
  // Get all sequences
  app.get("/api/sequences", async (req: any, res) => {
    try {
      if (!requireAuth(req, res)) return;
      const sequences = await storage.getAllSequences();
      res.json(sequences);
    } catch (error) {
      console.error("Error fetching sequences:", error);
      res.status(500).json({ message: "Failed to fetch sequences" });
    }
  });
  
  // Get sequence by ID with steps
  app.get("/api/sequences/:id", async (req: any, res) => {
    try {
      if (!requireAuth(req, res)) return;
      const sequence = await storage.getSequenceById(req.params.id);
      if (!sequence) {
        return res.status(404).json({ message: "Sequence not found" });
      }
      const steps = await storage.getSequenceSteps(req.params.id);
      res.json({ ...sequence, steps });
    } catch (error) {
      console.error("Error fetching sequence:", error);
      res.status(500).json({ message: "Failed to fetch sequence" });
    }
  });
  
  // Create a new sequence
  app.post("/api/sequences", async (req: any, res) => {
    try {
      if (!requireAuth(req, res)) return;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const sequenceData = insertSequenceSchema.parse({
        ...req.body,
        ownerId: userId,
      });
      const sequence = await storage.createSequence(sequenceData);
      res.json(sequence);
    } catch (error) {
      console.error("Error creating sequence:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid sequence data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create sequence" });
    }
  });
  
  // Update a sequence - only allow updating specific fields (not ownerId)
  const updateSequenceSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.enum(["draft", "active", "paused"]).optional(),
  });
  
  app.patch("/api/sequences/:id", async (req: any, res) => {
    try {
      if (!requireAuth(req, res)) return;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Validate the update data - this excludes ownerId and other sensitive fields
      const updateData = updateSequenceSchema.parse(req.body);
      
      // Verify ownership before updating
      const existingSequence = await storage.getSequenceById(req.params.id);
      if (!existingSequence) {
        return res.status(404).json({ message: "Sequence not found" });
      }
      if (existingSequence.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const sequence = await storage.updateSequence(req.params.id, updateData);
      res.json(sequence);
    } catch (error) {
      console.error("Error updating sequence:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid update data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update sequence" });
    }
  });
  
  // Delete a sequence
  app.delete("/api/sequences/:id", async (req: any, res) => {
    try {
      if (!requireAuth(req, res)) return;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Verify ownership before deleting
      const existingSequence = await storage.getSequenceById(req.params.id);
      if (!existingSequence) {
        return res.status(404).json({ message: "Sequence not found" });
      }
      if (existingSequence.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteSequence(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting sequence:", error);
      res.status(500).json({ message: "Failed to delete sequence" });
    }
  });
  
  // Create a sequence step
  app.post("/api/sequences/:id/steps", async (req: any, res) => {
    try {
      if (!requireAuth(req, res)) return;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Verify ownership of the sequence before adding a step
      const sequence = await storage.getSequenceById(req.params.id);
      if (!sequence) {
        return res.status(404).json({ message: "Sequence not found" });
      }
      if (sequence.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const stepData = insertSequenceStepSchema.parse({
        ...req.body,
        sequenceId: req.params.id,
      });
      const step = await storage.createSequenceStep(stepData);
      res.json(step);
    } catch (error) {
      console.error("Error creating sequence step:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid step data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create step" });
    }
  });
  
  // Update a sequence step - only allow updating specific fields
  const updateSequenceStepSchema = z.object({
    channel: z.enum(["email", "sms", "whatsapp"]).optional(),
    subject: z.string().optional(),
    message: z.string().optional(),
    delayDays: z.number().int().min(0).optional(),
    order: z.number().int().min(0).optional(),
  });
  
  app.patch("/api/sequences/:sequenceId/steps/:stepId", async (req: any, res) => {
    try {
      if (!requireAuth(req, res)) return;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Validate the update data
      const updateData = updateSequenceStepSchema.parse(req.body);
      
      // Verify ownership of the sequence
      const sequence = await storage.getSequenceById(req.params.sequenceId);
      if (!sequence) {
        return res.status(404).json({ message: "Sequence not found" });
      }
      if (sequence.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const step = await storage.updateSequenceStep(req.params.stepId, updateData);
      res.json(step);
    } catch (error) {
      console.error("Error updating sequence step:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid update data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update step" });
    }
  });
  
  // Delete a sequence step
  app.delete("/api/sequences/:sequenceId/steps/:stepId", async (req: any, res) => {
    try {
      if (!requireAuth(req, res)) return;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Verify ownership of the sequence before deleting a step
      const sequence = await storage.getSequenceById(req.params.sequenceId);
      if (!sequence) {
        return res.status(404).json({ message: "Sequence not found" });
      }
      if (sequence.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteSequenceStep(req.params.stepId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting sequence step:", error);
      res.status(500).json({ message: "Failed to delete step" });
    }
  });
  
  // Get sequence enrollments
  app.get("/api/sequences/:id/enrollments", async (req: any, res) => {
    try {
      if (!requireAuth(req, res)) return;
      const enrollments = await storage.getSequenceEnrollments(req.params.id);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });
  
  // Enroll a lead in a sequence
  app.post("/api/sequences/:id/enroll", async (req: any, res) => {
    try {
      if (!requireAuth(req, res)) return;
      const enrollmentData = insertSequenceEnrollmentSchema.parse({
        sequenceId: req.params.id,
        leadId: req.body.leadId,
        status: "active",
        currentStepOrder: 0,
      });
      const enrollment = await storage.createSequenceEnrollment(enrollmentData);
      res.json(enrollment);
    } catch (error) {
      console.error("Error enrolling lead:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid enrollment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to enroll lead" });
    }
  });
  
  // Update enrollment status
  app.patch("/api/enrollments/:id/status", async (req: any, res) => {
    try {
      if (!requireAuth(req, res)) return;
      await storage.updateSequenceEnrollmentStatus(req.params.id, req.body.status);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating enrollment status:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
