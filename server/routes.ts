// Referenced from javascript_log_in_with_replit blueprint
import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateChatResponse, generateOutreachDraft } from "./openai";
import { insertLeadSchema, insertClinicSchema, insertBookingSchema } from "@shared/schema";
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
  // Serve uploaded files
  app.use("/uploads", express.static(uploadDir));
  
  // Auth middleware
  await setupAuth(app);

  // Auth routes
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

  // Lead routes
  app.get("/api/leads", isAuthenticated, async (req, res) => {
    try {
      const leads = await storage.getAllLeads();
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post("/api/leads/import", isAuthenticated, async (req, res) => {
    try {
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

  app.post("/api/clinics", isAuthenticated, async (req, res) => {
    try {
      const clinicData = insertClinicSchema.parse(req.body);
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

  // Booking routes
  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking(bookingData);
      res.json(booking);
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
  app.get("/api/campaigns", isAuthenticated, async (req, res) => {
    try {
      const campaigns = await storage.getAllCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/campaigns", isAuthenticated, async (req, res) => {
    try {
      const campaignData = req.body;
      const campaign = await storage.createCampaign(campaignData);
      res.json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  app.post("/api/campaigns/generate-draft", isAuthenticated, async (req, res) => {
    try {
      const { type } = req.body;

      if (!type || !["email", "sms"].includes(type)) {
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
  app.get("/api/analytics", isAuthenticated, async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
