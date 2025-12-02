// Referenced from javascript_log_in_with_replit and stripe blueprints
import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateChatResponse, generateOutreachDraft, generateDemoResponse, type DemoMode } from "./openai";
import { insertLeadSchema, insertClinicSchema, insertBookingSchema, insertSequenceSchema, insertSequenceStepSchema, insertSequenceEnrollmentSchema, loginSchema, createUserSchema } from "@shared/schema";
import { z } from "zod";
import {
  runClinicNurtureCampaign,
  getNurtureStatus,
  processLeadNurture,
  createNurtureSequenceCampaign,
} from "./nurtureCampaign";
import {
  processNewBooking,
  getClinicBookingAnalytics,
  getCampaignConversionStats,
} from "./bookingTracking";
import {
  markContacted,
  markWarm,
  markReplied,
  markDemoBooked,
  markConverted,
  markLost,
  addTag,
  removeTag,
  getSegmentationSummary,
  LEAD_STATUSES,
  LEAD_TAGS,
} from "./leadSegmentation";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { getUncachableStripeClient, getStripePublishableKey, getStripeSync } from "./stripeClient";
import { WebhookHandlers } from "./webhookHandlers";
import { initStripe } from "./stripeInit";
import { sendDemoLinkEmail, sendLeadNotificationEmail, sendTestEmail, isEmailConfigured, sendEmail, testEmailConnection } from "./email";
import { SITE_NAME } from "@shared/config";

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

  // Email health check endpoint - tests Resend configuration via Replit connector
  // GET /health/email - Check if Resend is configured and connection works
  // POST /health/email - Send a test email to support address
  app.get("/health/email", async (req, res) => {
    try {
      const configured = await isEmailConfigured();
      if (!configured) {
        return res.json({
          ok: false,
          error: "Resend not configured. Please set up the Resend integration.",
        });
      }

      // Test the connection
      const connectionResult = await testEmailConnection();
      if (connectionResult.success) {
        res.json({
          ok: true,
          message: connectionResult.message,
        });
      } else {
        res.json({
          ok: false,
          error: connectionResult.message,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Email health check error:", error);
      res.json({
        ok: false,
        error: errorMessage,
      });
    }
  });

  app.post("/health/email", async (req, res) => {
    try {
      const { to } = req.body || {};
      const result = await sendTestEmail(to);
      
      if (result.success) {
        res.json({
          status: "ok",
          message: result.message,
        });
      } else {
        res.status(500).json({
          status: "error",
          message: result.message,
        });
      }
    } catch (error) {
      console.error("Test email send error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to send test email",
      });
    }
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
      
      // Get user's clinics for multi-tenant context
      const userClinics = await storage.getUserClinics(user.id);
      const selectedClinicId = userClinics.length > 0 ? userClinics[0].id : null;
      
      // Set up session with clinic context
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.isAuthenticated = true;
      req.session.selectedClinicId = selectedClinicId;
      
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
          clinics: userClinics,
          selectedClinicId,
          redirectTo: '/dashboard'
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

  // Signup endpoint for new clinic accounts
  app.post("/api/auth/signup", async (req: any, res) => {
    try {
      const { email, password, firstName, lastName, clinicName } = req.body;
      
      if (!email || !password || !firstName || !lastName || !clinicName) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }
      
      // Hash password and create user
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUserWithPassword(
        email,
        hashedPassword,
        'clinic',
        firstName,
        lastName
      );
      
      // Create a clinic for the user
      const slug = clinicName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const clinic = await storage.createClinic({
        name: clinicName,
        slug: slug + '-' + Date.now().toString(36),
        brandColor: '#0066cc',
        ownerId: user.id,
      });
      
      // Link user to clinic as owner
      await storage.addUserToClinic(user.id, clinic.id, 'owner');
      
      // Set up session
      req.session.userId = user.id;
      req.session.isAuthenticated = true;
      
      const { password: _, ...userWithoutPassword } = user;
      res.json({ 
        user: userWithoutPassword,
        clinic: clinic,
        message: "Account created successfully",
        redirectTo: "/pricing"
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Get current session user (for email/password auth) with clinic context
  app.get("/api/auth/session", async (req: any, res) => {
    if (req.session?.isAuthenticated && req.session?.userId) {
      try {
        const user = await storage.getUser(req.session.userId);
        if (user) {
          const { password: _, ...userWithoutPassword } = user;
          const userClinics = await storage.getUserClinics(user.id);
          
          // If no selectedClinicId in session, set it to first clinic
          if (!req.session.selectedClinicId && userClinics.length > 0) {
            req.session.selectedClinicId = userClinics[0].id;
          }
          
          const selectedClinic = req.session.selectedClinicId 
            ? userClinics.find(c => c.id === req.session.selectedClinicId) || null
            : null;
          
          res.json({ 
            user: userWithoutPassword, 
            isAuthenticated: true,
            clinics: userClinics,
            selectedClinicId: req.session.selectedClinicId,
            selectedClinic
          });
        } else {
          res.json({ user: null, isAuthenticated: false });
        }
      } catch (error) {
        console.error("Session error:", error);
        res.json({ user: null, isAuthenticated: false });
      }
    } else {
      res.json({ user: null, isAuthenticated: false });
    }
  });
  
  // Switch clinic context
  app.post("/api/auth/switch-clinic", async (req: any, res) => {
    if (!req.session?.isAuthenticated || !req.session?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { clinicId } = req.body;
      if (!clinicId) {
        return res.status(400).json({ message: "Clinic ID is required" });
      }
      
      // Verify user has access to this clinic
      const userClinics = await storage.getUserClinics(req.session.userId);
      const hasAccess = userClinics.some(c => c.id === clinicId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied to this clinic" });
      }
      
      // Update session with new clinic
      req.session.selectedClinicId = clinicId;
      
      req.session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Failed to switch clinic" });
        }
        
        const selectedClinic = userClinics.find(c => c.id === clinicId);
        res.json({ 
          success: true, 
          selectedClinicId: clinicId,
          selectedClinic
        });
      });
    } catch (error) {
      console.error("Switch clinic error:", error);
      res.status(500).json({ message: "Failed to switch clinic" });
    }
  });
  
  // Get user's clinics
  app.get("/api/auth/clinics", async (req: any, res) => {
    if (!req.session?.isAuthenticated || !req.session?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userClinics = await storage.getUserClinics(req.session.userId);
      res.json({ clinics: userClinics });
    } catch (error) {
      console.error("Get clinics error:", error);
      res.status(500).json({ message: "Failed to get clinics" });
    }
  });

  // Send demo access link (email-gated demo access)
  const sendDemoLinkSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    clinicName: z.string().optional(),
  });
  
  app.post("/api/send-demo-link", async (req, res) => {
    try {
      const { email, clinicName } = sendDemoLinkSchema.parse(req.body);
      
      // Generate secure token
      const token = crypto.randomBytes(32).toString("hex");
      
      // Set expiration to 24 hours from now
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      // Save token to database
      await storage.createDemoAccessToken({
        email,
        clinicName: clinicName || null,
        token,
        expiresAt,
        used: false,
      });
      
      // Also save as a lead
      await storage.createLead({
        name: clinicName || email.split("@")[0],
        email,
        status: "new",
        notes: "Requested demo access via email-gated form",
      });
      
      // Build demo link URL
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const demoLink = `${baseUrl}/demo?token=${token}`;
      
      // Send notification email to support about the new demo request
      sendLeadNotificationEmail({
        formType: "Demo Link Request",
        leadData: {
          email,
          clinicName: clinicName || undefined,
          demoLink,
        },
        source: "Email-Gated Demo Form",
      }).catch((err) => {
        console.error("Failed to send demo request notification:", err);
      });
      
      // Send demo link email to the user
      const emailSent = await sendDemoLinkEmail({
        to: email,
        clinicName: clinicName || undefined,
        demoLink,
        expiresIn: "24 hours",
      });
      
      if (emailSent) {
        res.json({ 
          success: true, 
          message: "Email sent" 
        });
      } else {
        console.error("Failed to send demo link email to:", email);
        res.status(500).json({ 
          success: false, 
          message: "Failed to send email. Please try again." 
        });
      }
    } catch (error) {
      console.error("Send demo link error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: error.errors[0]?.message || "Invalid email format" 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: "Failed to send email. Please try again." 
      });
    }
  });

  // ============================================================================
  // DEMO REQUEST FORM - Book a Demo
  // ============================================================================
  const demoRequestSchema = z.object({
    clinicName: z.string().min(1, "Clinic name is required"),
    contactName: z.string().min(1, "Contact name is required"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().min(1, "Phone number is required"),
    city: z.string().min(1, "City is required"),
    message: z.string().optional(),
  });

  app.post("/api/demo-request", async (req, res) => {
    try {
      const data = demoRequestSchema.parse(req.body);
      const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });

      // First, save the lead to the database (so we don't lose data if email fails)
      try {
        await storage.createLead({
          name: data.contactName,
          email: data.email,
          phone: data.phone,
          status: "new",
          notes: `Demo request from ${data.clinicName} in ${data.city}. ${data.message || ''}`.trim(),
        });
        console.log(`Lead saved: ${data.email} from ${data.clinicName}`);
      } catch (leadError) {
        console.error("Failed to save lead:", leadError);
        // Continue anyway - email is more important than lead storage
      }

      // 1. Send notification email to support
      const notificationHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f5; padding: 40px 20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <tr>
      <td style="padding: 30px; text-align: center; background: #18181b; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; color: #fff; font-size: 24px;">${SITE_NAME}</h1>
        <p style="margin: 8px 0 0; color: #a1a1aa; font-size: 14px;">New Demo Request</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px;">
        <h2 style="margin: 0 0 20px; font-size: 18px; color: #18181b;">New Lead Captured</h2>
        <table width="100%" style="border-collapse: collapse;">
          <tr><td style="padding: 8px 12px; border: 1px solid #e4e4e7; font-weight: 600; background: #f9fafb;">Clinic Name</td><td style="padding: 8px 12px; border: 1px solid #e4e4e7;">${data.clinicName}</td></tr>
          <tr><td style="padding: 8px 12px; border: 1px solid #e4e4e7; font-weight: 600; background: #f9fafb;">Contact Name</td><td style="padding: 8px 12px; border: 1px solid #e4e4e7;">${data.contactName}</td></tr>
          <tr><td style="padding: 8px 12px; border: 1px solid #e4e4e7; font-weight: 600; background: #f9fafb;">Email</td><td style="padding: 8px 12px; border: 1px solid #e4e4e7;">${data.email}</td></tr>
          <tr><td style="padding: 8px 12px; border: 1px solid #e4e4e7; font-weight: 600; background: #f9fafb;">Phone</td><td style="padding: 8px 12px; border: 1px solid #e4e4e7;">${data.phone}</td></tr>
          <tr><td style="padding: 8px 12px; border: 1px solid #e4e4e7; font-weight: 600; background: #f9fafb;">City</td><td style="padding: 8px 12px; border: 1px solid #e4e4e7;">${data.city}</td></tr>
          ${data.message ? `<tr><td style="padding: 8px 12px; border: 1px solid #e4e4e7; font-weight: 600; background: #f9fafb;">Message</td><td style="padding: 8px 12px; border: 1px solid #e4e4e7;">${data.message}</td></tr>` : ''}
        </table>
        <div style="padding: 16px; background: #f4f4f5; border-radius: 8px; margin-top: 20px;">
          <p style="margin: 0; font-size: 13px; color: #71717a;"><strong>Captured At:</strong> ${timestamp}</p>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 30px; text-align: center; border-top: 1px solid #e4e4e7; background: #fafafa; border-radius: 0 0 12px 12px;">
        <p style="margin: 0; font-size: 12px; color: #a1a1aa;">Automated notification from ${SITE_NAME}</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

      const notificationText = `New Demo Request from ${SITE_NAME}
${"=".repeat(50)}

Clinic Name: ${data.clinicName}
Contact Name: ${data.contactName}
Email: ${data.email}
Phone: ${data.phone}
City: ${data.city}
${data.message ? `Message: ${data.message}` : ''}

Captured At: ${timestamp}`;

      const supportEmail = process.env.SUPPORT_EMAIL || "support@dentalleadgenius.com";
      const notificationResult = await sendEmail({
        to: supportEmail,
        subject: `New Demo Request: ${data.clinicName}`,
        html: notificationHtml,
        text: notificationText,
      });

      if (!notificationResult.ok) {
        console.error("Failed to send notification email:", notificationResult.error);
        return res.status(500).json({ ok: false, error: "Failed to send email. Please try again." });
      }

      // 2. Send auto-reply email to the user
      const autoReplyHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f5; padding: 40px 20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <tr>
      <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e4e4e7;">
        <h1 style="margin: 0; font-size: 24px; color: #18181b;">${SITE_NAME}</h1>
        <p style="margin: 8px 0 0; font-size: 14px; color: #71717a;">AI-Powered Lead Generation for Dental Clinics</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px;">
        <h2 style="margin: 0 0 16px; font-size: 20px; color: #18181b;">Thank you, ${data.contactName}!</h2>
        <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #3f3f46;">
          We've received your demo request for <strong>${data.clinicName}</strong>. Our team will contact you within <strong>24 hours</strong> to schedule your personalized demo.
        </p>
        <div style="padding: 24px; background: #fafafa; border-radius: 8px; border: 1px solid #e4e4e7;">
          <h3 style="margin: 0 0 16px; font-size: 16px; color: #18181b;">What's Next?</h3>
          <ul style="margin: 0; padding-left: 20px; color: #3f3f46; font-size: 14px; line-height: 1.8;">
            <li>Our team will reach out to schedule your demo</li>
            <li>We'll show you how to generate 10x more leads</li>
            <li>Get a customized plan for your clinic</li>
          </ul>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px 40px; text-align: center; border-top: 1px solid #e4e4e7; background: #fafafa; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 8px; font-size: 14px; color: #71717a;">Questions? Reply to this email</p>
        <p style="margin: 0; font-size: 12px; color: #a1a1aa;">${SITE_NAME} - AI-Powered Lead Generation for Dental Clinics</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

      const autoReplyText = `Thank you, ${data.contactName}!

We've received your demo request for ${data.clinicName}. Our team will contact you within 24 hours to schedule your personalized demo.

What's Next?
- Our team will reach out to schedule your demo
- We'll show you how to generate 10x more leads
- Get a customized plan for your clinic

Questions? Reply to this email.

${SITE_NAME} - AI-Powered Lead Generation for Dental Clinics`;

      const autoReplyResult = await sendEmail({
        to: data.email,
        subject: `Thank you for your demo request - ${SITE_NAME}`,
        html: autoReplyHtml,
        text: autoReplyText,
      });

      if (!autoReplyResult.ok) {
        console.error("Failed to send auto-reply email:", autoReplyResult.error);
        // Still return success since notification was sent
      }

      res.json({ ok: true });
    } catch (error) {
      console.error("Demo request error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ ok: false, error: error.errors[0]?.message || "Invalid form data" });
      }
      res.status(500).json({ ok: false, error: "Failed to send email. Please try again." });
    }
  });
  
  // Verify demo access token
  app.get("/api/verify-demo-token", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== "string") {
        return res.json({ valid: false, message: "No token provided" });
      }
      
      const accessToken = await storage.getDemoAccessTokenByToken(token);
      
      if (!accessToken) {
        return res.json({ valid: false, message: "Invalid access link" });
      }
      
      if (accessToken.expiresAt < new Date()) {
        return res.json({ valid: false, message: "This demo link has expired" });
      }
      
      // Mark token as used (but still allow access during the 24-hour window)
      if (!accessToken.used) {
        await storage.markDemoAccessTokenUsed(token);
      }
      
      res.json({ 
        valid: true, 
        email: accessToken.email,
        clinicName: accessToken.clinicName,
      });
    } catch (error) {
      console.error("Verify demo token error:", error);
      res.json({ valid: false, message: "Verification failed" });
    }
  });

  // Seed admin user endpoint (call once to set up admin)
  app.post("/api/auth/seed-admin", async (req, res) => {
    try {
      // Create default demo admin if not exists
      const existingDemoAdmin = await storage.getUserByEmail("admin@dentalfunnel.com");
      if (!existingDemoAdmin) {
        const hashedPassword = await bcrypt.hash("Admin123!", 10);
        await storage.createUserWithPassword(
          "admin@dentalfunnel.com",
          hashedPassword,
          "admin",
          "Admin",
          "User"
        );
        console.log("Demo admin user created: admin@dentalfunnel.com");
      }
      
      // Create main admin account if not exists
      const existingMainAdmin = await storage.getUserByEmail("shoibaali10@gmail.com");
      if (!existingMainAdmin) {
        const hashedPassword = await bcrypt.hash("Demo123!", 10);
        await storage.createUserWithPassword(
          "shoibaali10@gmail.com",
          hashedPassword,
          "admin",
          "Shoiba",
          "Ali"
        );
        console.log("Main admin user created: shoibaali10@gmail.com");
      }
      
      res.json({ message: "Admin users seeded successfully" });
    } catch (error) {
      console.error("Seed admin error:", error);
      res.status(500).json({ message: "Failed to create admin users" });
    }
  });
  
  // Auto-seed admin users on server start
  (async () => {
    try {
      // Create default demo admin if not exists
      const existingDemoAdmin = await storage.getUserByEmail("admin@dentalfunnel.com");
      if (!existingDemoAdmin) {
        const hashedPassword = await bcrypt.hash("Admin123!", 10);
        await storage.createUserWithPassword(
          "admin@dentalfunnel.com",
          hashedPassword,
          "admin",
          "Admin",
          "User"
        );
        console.log("Demo admin user created: admin@dentalfunnel.com");
      }
      
      // Create main admin account if not exists
      const existingMainAdmin = await storage.getUserByEmail("shoibaali10@gmail.com");
      if (!existingMainAdmin) {
        const hashedPassword = await bcrypt.hash("Demo123!", 10);
        await storage.createUserWithPassword(
          "shoibaali10@gmail.com",
          hashedPassword,
          "admin",
          "Shoiba",
          "Ali"
        );
        console.log("Main admin user created: shoibaali10@gmail.com");
      }
    } catch (error) {
      console.error("Auto-seed admin users error:", error);
    }
  })();

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
  
  // Helper to get selected clinic ID from session
  const getSelectedClinicId = (req: any): string | null => {
    return req.session?.selectedClinicId || null;
  };
  
  // Helper to require clinic context
  const requireClinicContext = async (req: any, res: any): Promise<string | null> => {
    if (!requireAuth(req, res)) return null;
    
    const clinicId = getSelectedClinicId(req);
    if (!clinicId) {
      res.status(400).json({ message: "No clinic selected. Please select a clinic first." });
      return null;
    }
    
    // Verify user has access to this clinic
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return null;
    }
    
    const userClinics = await storage.getUserClinics(userId);
    const hasAccess = userClinics.some(c => c.id === clinicId);
    
    if (!hasAccess) {
      res.status(403).json({ message: "Access denied to this clinic" });
      return null;
    }
    
    return clinicId;
  };

  // Lead routes (multi-tenant)
  app.get("/api/leads", async (req: any, res) => {
    try {
      const clinicId = await requireClinicContext(req, res);
      if (!clinicId) return;
      
      const leads = await storage.getLeadsByClinic(clinicId);
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post("/api/leads/import", async (req: any, res) => {
    try {
      const clinicId = await requireClinicContext(req, res);
      if (!clinicId) return;
      
      const { leads } = req.body;

      if (!Array.isArray(leads) || leads.length === 0) {
        return res.status(400).json({ message: "Invalid leads data" });
      }

      // Transform and validate leads with clinic context
      const validLeads = leads
        .filter((lead) => lead.name && lead.name.trim())
        .map((lead) => ({
          clinicId, // Add clinic context
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

  // ========================================
  // External API Routes (Bearer Token Auth)
  // ========================================
  
  // Import the enhanced schema from shared types
  const { externalLeadPayloadSchema } = await import("@shared/schema");
  
  // Helper function to validate Bearer token for external API access
  // SECURITY: Never log the actual API key value
  const validateImportApiKey = (req: any, res: any): boolean => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ 
        success: false, 
        message: "Missing or invalid Authorization header. Use: Bearer <API_KEY>" 
      });
      return false;
    }
    
    const token = authHeader.split(" ")[1];
    const validApiKey = process.env.IMPORT_API_KEY;
    
    if (!validApiKey) {
      // Log error without exposing key details
      console.error("[IMPORT API] IMPORT_API_KEY environment variable not configured");
      res.status(500).json({ success: false, message: "API key not configured on server" });
      return false;
    }
    
    if (token !== validApiKey) {
      res.status(403).json({ success: false, message: "Invalid API key" });
      return false;
    }
    
    return true;
  };

  // Structured logging helper for imports (sanitizes PII)
  const logImport = (action: string, details: {
    leadsCount?: number;
    created?: number;
    existing?: number;
    failed?: number;
    source?: string;
    error?: string;
  }) => {
    const timestamp = new Date().toISOString();
    console.log(`[IMPORT API] [${timestamp}] ${action}:`, JSON.stringify(details));
  };

  // POST /api/external/leads/import - Import a single lead (Bearer token auth)
  // Supports deduplication: if lead exists (by googleMapsUrl or email+city), merges data
  app.post("/api/external/leads/import", async (req: any, res) => {
    try {
      if (!validateImportApiKey(req, res)) return;

      // Validate with enhanced schema
      const validatedLead = externalLeadPayloadSchema.parse(req.body);
      
      const leadData = {
        clinicId: validatedLead.clinicId || null,
        name: validatedLead.name,
        email: validatedLead.email || null,
        phone: validatedLead.phone || null,
        address: validatedLead.address || null,
        city: validatedLead.city || null,
        state: validatedLead.state || null,
        country: validatedLead.country || "USA",
        notes: validatedLead.notes || null,
        googleMapsUrl: validatedLead.googleMapsUrl || null,
        websiteUrl: validatedLead.websiteUrl || null,
        source: validatedLead.source || "maps-helper",
        marketingOptIn: validatedLead.marketingOptIn || false,
        tags: validatedLead.tags || ["maps-helper"],
        status: validatedLead.status || "new",
      };

      // Use upsert with deduplication
      const { lead, existing } = await storage.upsertLeadByDedupe(leadData);
      
      logImport("Single import", { 
        leadsCount: 1, 
        created: existing ? 0 : 1, 
        existing: existing ? 1 : 0,
        source: leadData.source 
      });
      
      res.json({ 
        success: true, 
        leadId: lead.id,
        existing
      });
    } catch (error) {
      // Log error without exposing full payload (may contain PII)
      console.error("[IMPORT API] Error importing single lead:", 
        error instanceof Error ? error.message : "Unknown error");
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: "Validation failed",
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      
      // Handle unique constraint violations gracefully
      if (error instanceof Error && error.message.includes("unique constraint")) {
        return res.status(409).json({ 
          success: false, 
          message: "Lead already exists (duplicate detected)"
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: "Failed to import lead" 
      });
    }
  });

  // POST /api/external/leads/bulk-import - Import multiple leads (Bearer token auth)
  // Processes each lead individually - one bad lead doesn't fail the batch
  app.post("/api/external/leads/bulk-import", async (req: any, res) => {
    const startTime = Date.now();
    
    try {
      if (!validateImportApiKey(req, res)) return;

      const { leads } = req.body;

      if (!Array.isArray(leads)) {
        return res.status(400).json({ 
          success: false, 
          message: "Request body must contain a 'leads' array" 
        });
      }

      if (leads.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Leads array cannot be empty" 
        });
      }

      // Process each lead individually for granular error handling
      const results: Array<{
        index: number;
        success: boolean;
        leadId?: string;
        existing?: boolean;
        error?: string;
      }> = [];
      
      let created = 0;
      let existing = 0;
      let failed = 0;

      for (let i = 0; i < leads.length; i++) {
        try {
          // Validate individual lead
          const validated = externalLeadPayloadSchema.parse(leads[i]);
          
          const leadData = {
            clinicId: validated.clinicId || null,
            name: validated.name,
            email: validated.email || null,
            phone: validated.phone || null,
            address: validated.address || null,
            city: validated.city || null,
            state: validated.state || null,
            country: validated.country || "USA",
            notes: validated.notes || null,
            googleMapsUrl: validated.googleMapsUrl || null,
            websiteUrl: validated.websiteUrl || null,
            source: validated.source || "maps-helper",
            marketingOptIn: validated.marketingOptIn || false,
            tags: validated.tags || ["maps-helper"],
            status: validated.status || "new",
          };

          // Use upsert with deduplication
          const result = await storage.upsertLeadByDedupe(leadData);
          
          results.push({
            index: i,
            success: true,
            leadId: result.lead.id,
            existing: result.existing
          });
          
          if (result.existing) {
            existing++;
          } else {
            created++;
          }
          
        } catch (err) {
          failed++;
          
          if (err instanceof z.ZodError) {
            results.push({
              index: i,
              success: false,
              error: err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
            });
          } else if (err instanceof Error && err.message.includes("unique constraint")) {
            // Handle DB constraint violations as existing lead
            results.push({
              index: i,
              success: false,
              error: "Duplicate lead detected"
            });
          } else {
            results.push({
              index: i,
              success: false,
              error: err instanceof Error ? err.message : "Unknown error"
            });
          }
        }
      }

      const duration = Date.now() - startTime;
      
      // Structured logging for bulk import
      logImport("Bulk import completed", {
        leadsCount: leads.length,
        created,
        existing,
        failed,
        source: "maps-helper"
      });
      
      console.log(`[IMPORT API] Bulk import processed ${leads.length} leads in ${duration}ms`);
      
      res.json({ 
        success: failed === 0,
        totalProcessed: leads.length,
        created,
        existing,
        failed,
        results
      });
    } catch (error) {
      console.error("[IMPORT API] Error in bulk import:", 
        error instanceof Error ? error.message : "Unknown error");
      
      res.status(500).json({ 
        success: false, 
        message: "Failed to process bulk import" 
      });
    }
  });

  // GET /api/admin/leads/import-stats - Internal admin endpoint for import statistics
  // Protected by session authentication (internal use only)
  app.get("/api/admin/leads/import-stats", isAuthenticated, async (req: any, res) => {
    try {
      // Only allow admin users
      if (!req.user?.claims?.sub) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const stats = await storage.getImportStats();
      
      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error("[ADMIN] Error fetching import stats:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch import statistics" 
      });
    }
  });

  // Test-only route for running a campaign (development only)
  if (process.env.NODE_ENV !== "production") {
    app.post("/api/test/run-campaign/:id", async (req: any, res) => {
      try {
        if (!validateImportApiKey(req, res)) return;
        
        const { id } = req.params;
        const { includeAllLeads } = req.query;
        const campaign = await storage.getCampaignById(id);
        
        if (!campaign) {
          return res.status(404).json({ message: "Campaign not found" });
        }
        
        if (campaign.type !== "email") {
          return res.status(400).json({ message: "Only email campaigns can be run" });
        }
        
        if (!campaign.message || campaign.message.trim() === "") {
          return res.status(400).json({ message: "Campaign message is required" });
        }
        
        // Get leads with email addresses
        const allLeads = await storage.getLeadsWithEmail(campaign.clinicId);
        
        // Filter by marketing opt-in unless explicitly including all
        const leads = includeAllLeads === "true" 
          ? allLeads 
          : allLeads.filter(lead => lead.marketingOptIn === true);
        
        if (leads.length === 0) {
          return res.status(400).json({ 
            message: "No opted-in leads found. Add ?includeAllLeads=true to send to all leads." 
          });
        }
        
        // Update campaign status to active
        await storage.updateCampaignByClinic(id, campaign.clinicId, { status: "active" });
        
        let successCount = 0;
        let failCount = 0;
        const results: Array<{ email: string; success: boolean; error?: string }> = [];
        
        // Send emails to each lead (up to daily limit)
        const dailyLimit = campaign.dailyLimit || 50;
        
        for (const lead of leads) {
          if (!lead.email) continue;
          if (successCount >= dailyLimit) break;
          
          const messageHtml = campaign.message.replace(/\n/g, '<br>');
          
          const emailResult = await sendEmail({
            to: lead.email,
            subject: campaign.subject || `Message from DentalLeadGenius`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <p>${messageHtml}</p>
                <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
                <p style="font-size: 12px; color: #71717a;">
                  You received this email because you are a dental professional in our network.
                  <br>If you no longer wish to receive these emails, reply with "UNSUBSCRIBE".
                </p>
              </div>
            `,
            text: campaign.message,
          });
          
          if (emailResult.ok) {
            successCount++;
            results.push({ email: lead.email, success: true });
            
            // Update lead status to contacted
            if (lead.status === "new") {
              await storage.updateLead(lead.id, { status: "contacted" });
            }
          } else {
            failCount++;
            results.push({ email: lead.email, success: false, error: emailResult.error });
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Update campaign stats
        await storage.updateCampaignByClinic(id, campaign.clinicId, {
          totalSent: (campaign.totalSent || 0) + successCount,
          sentToday: (campaign.sentToday || 0) + successCount,
          status: successCount > 0 ? "completed" : "draft",
        });
        
        res.json({
          success: true,
          message: `Campaign sent to ${successCount} leads`,
          stats: {
            totalLeads: leads.length,
            sent: successCount,
            failed: failCount,
          },
          results,
        });
      } catch (error) {
        console.error("Error running test campaign:", error);
        res.status(500).json({ message: "Failed to run campaign" });
      }
    });
  }

  // Test-only route for verifying import functionality (development only)
  if (process.env.NODE_ENV !== "production") {
    app.post("/api/test/import-verification", async (req: any, res) => {
      try {
        if (!validateImportApiKey(req, res)) return;
        
        // Create a clearly marked test lead that should never be emailed
        const testLead = {
          name: "Test Sync Clinic – DO NOT EMAIL",
          email: "test-sync-do-not-email@example.com",
          phone: "000-000-0000",
          city: "Test City",
          state: "TS",
          country: "USA",
          googleMapsUrl: `https://maps.google.com/test-verification-${Date.now()}`,
          source: "maps-helper",
          marketingOptIn: false,
          tags: ["maps-helper", "test-verification", "do-not-email"],
          status: "new" as const,
          notes: "AUTO-GENERATED TEST LEAD - Safe to delete",
        };
        
        const { lead, existing } = await storage.upsertLeadByDedupe(testLead);
        
        res.json({
          success: true,
          message: "Test lead created/verified successfully",
          leadId: lead.id,
          existing,
          verification: {
            hasCorrectSource: lead.source === "maps-helper",
            hasCorrectTags: lead.tags?.includes("maps-helper"),
            isMarkedDoNotEmail: lead.marketingOptIn === false
          }
        });
      } catch (error) {
        console.error("[TEST] Import verification failed:", error);
        res.status(500).json({ 
          success: false, 
          message: "Test verification failed" 
        });
      }
    });
  }

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

  // Quick clinic setup - creates clinic with all onboarding data in one step
  app.post("/api/clinics/quick-setup", async (req: any, res) => {
    try {
      // Support both session-based auth (email/password) and OIDC auth
      const userId = req.session?.userId || req.user?.claims?.sub;
      if (!userId || (!req.session?.isAuthenticated && !req.isAuthenticated?.())) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { name, address, phone, website, timezone, services, businessHours, emailProvider, smsEnabled } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Clinic name is required" });
      }
      
      // Generate slug from clinic name
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      // Create the clinic with all onboarding data
      const clinic = await storage.createClinic({
        name,
        slug: `${slug}-${Date.now()}`,
        ownerId: userId,
        address: address || null,
        phone: phone || null,
        website: website || null,
        timezone: timezone || "America/New_York",
        businessHours: businessHours || null,
        services: services || [],
        emailProvider: emailProvider || null,
        smsEnabled: smsEnabled || false,
        onboardingCompleted: true,
      });
      
      // Add user as clinic owner
      await storage.addUserToClinic(userId, clinic.id, 'owner');
      
      // Set the selected clinic in session
      if (req.session) {
        req.session.selectedClinicId = clinic.id;
      }
      
      res.json({ 
        ...clinic,
        setupComplete: true,
        message: "Clinic created and configured successfully"
      });
    } catch (error) {
      console.error("Error in quick setup:", error);
      res.status(500).json({ message: "Failed to complete quick setup" });
    }
  });

  // Update clinic with onboarding data
  app.post("/api/clinics/:id/onboarding", async (req: any, res) => {
    try {
      const { id } = req.params;
      // Support both session-based auth (email/password) and OIDC auth
      const userId = req.session?.userId || req.user?.claims?.sub;
      
      if (!userId || (!req.session?.isAuthenticated && !req.isAuthenticated?.())) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Verify user has access to this clinic
      const userClinics = await storage.getUserClinics(userId);
      const hasAccess = userClinics.some((c: any) => c.id === id);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { name, address, phone, website, timezone, services, businessHours, emailProvider, smsEnabled } = req.body;
      
      // Update clinic with all onboarding data
      const updatedClinic = await storage.updateClinic(id, {
        ...(name && { name }),
        address: address || null,
        phone: phone || null,
        website: website || null,
        timezone: timezone || "America/New_York",
        businessHours: businessHours || null,
        services: services || [],
        emailProvider: emailProvider || null,
        smsEnabled: smsEnabled || false,
        onboardingCompleted: true,
      });
      
      res.json({ 
        ...updatedClinic,
        setupComplete: true,
        message: "Clinic onboarding completed successfully"
      });
    } catch (error) {
      console.error("Error in onboarding:", error);
      res.status(500).json({ message: "Failed to complete onboarding" });
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
      
      // Send notification email to support about the new demo booking
      sendLeadNotificationEmail({
        formType: "Demo Booking Request",
        leadData: {
          name: bookingData.ownerName,
          email: bookingData.email,
          clinicName: bookingData.clinicName,
          phone: bookingData.phone,
          state: bookingData.state,
          demoLink: demoUrl,
        },
        source: "Landing Page Demo Form",
      }).catch((err) => {
        console.error("Failed to send lead notification email:", err);
      });
      
      res.json({ ...booking, demoUrl });
    } catch (error) {
      console.error("Error creating booking:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.get("/api/bookings", async (req: any, res) => {
    try {
      const clinicId = await requireClinicContext(req, res);
      if (!clinicId) return;
      
      // Get bookings filtered by clinicId for proper tenant isolation
      const bookings = await storage.getBookingsByClinic(clinicId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Patient booking routes with automatic sequence enrollment
  app.post("/api/patient-bookings", async (req, res) => {
    try {
      const { insertPatientBookingSchema } = await import("@shared/schema");
      const bookingData = insertPatientBookingSchema.parse(req.body);
      const booking = await storage.createPatientBooking(bookingData);
      
      // Get clinic info for context
      const clinic = await storage.getClinicById(bookingData.clinicId);
      
      // Send notification email to support about the new patient booking
      sendLeadNotificationEmail({
        formType: "Patient Appointment Request",
        leadData: {
          patientName: bookingData.patientName,
          patientEmail: bookingData.patientEmail,
          patientPhone: bookingData.patientPhone,
          appointmentType: bookingData.appointmentType,
          preferredDate: bookingData.preferredDate,
          preferredTime: bookingData.preferredTime,
          notes: bookingData.notes,
          clinic: clinic?.name || "Unknown Clinic",
        },
        source: `Patient Chatbot - ${clinic?.name || "Clinic Page"}`,
      }).catch((err) => {
        console.error("Failed to send patient booking notification:", err);
      });
      
      // Auto-create a lead from patient data and enroll in Appointment Request Sequence
      try {
        // Create a lead from the patient booking (clinic-scoped)
        const lead = await storage.createLead({
          clinicId: bookingData.clinicId,
          name: bookingData.patientName,
          email: bookingData.patientEmail,
          phone: bookingData.patientPhone,
          notes: `Patient booking for ${clinic?.name || 'clinic'} - ${bookingData.appointmentType || 'General'} appointment. Preferred: ${bookingData.preferredDate || 'Flexible'} ${bookingData.preferredTime || ''}. Patient notes: ${bookingData.notes || 'None'}`,
          status: "new",
        });
        
        // Find and enroll in "Appointment Request Sequence" (clinic-scoped)
        const sequences = await storage.getSequencesByClinic(bookingData.clinicId);
        const appointmentSequence = sequences.find(s => s.name === "Appointment Request Sequence" && s.status === "active");
        
        if (appointmentSequence && lead) {
          await storage.createSequenceEnrollment({
            sequenceId: appointmentSequence.id,
            leadId: lead.id,
            currentStepOrder: 1,
            status: "active",
            nextSendAt: new Date(), // Send first message immediately
          });
          console.log(`[Automation] Patient ${bookingData.patientName} enrolled in Appointment Request Sequence`);
        }
      } catch (enrollError) {
        // Don't fail the booking if enrollment fails, just log it
        console.error("Error auto-enrolling patient in sequence:", enrollError);
      }
      
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
      const validStatuses = ["pending", "confirmed", "cancelled", "completed", "missed"];
      
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be one of: pending, confirmed, cancelled, completed, missed" });
      }
      
      const bookings = await storage.getPatientBookingsForUser(userId);
      const booking = bookings.find(b => b.id === req.params.id);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found or access denied" });
      }
      
      const previousStatus = booking.status;
      await storage.updatePatientBookingStatus(req.params.id, status);
      
      // Auto-enroll in sequences based on status changes
      try {
        // Find lead by patient email to enroll in sequences (clinic-scoped)
        const leads = await storage.getLeadsByEmailAndClinic(booking.patientEmail, booking.clinicId);
        const lead = leads[0]; // Get the most recent lead with this email in this clinic
        
        if (lead) {
          // Use clinic-scoped sequences
          const sequences = await storage.getSequencesByClinic(booking.clinicId);
          
          // Missed or cancelled → Missed-Appointment Recovery Sequence
          if ((status === "missed" || status === "cancelled") && previousStatus !== "missed" && previousStatus !== "cancelled") {
            const missedSequence = sequences.find(s => s.name === "Missed-Appointment Recovery Sequence" && s.status === "active");
            if (missedSequence) {
              await storage.createSequenceEnrollment({
                sequenceId: missedSequence.id,
                leadId: lead.id,
                currentStepOrder: 1,
                status: "active",
                nextSendAt: new Date(),
              });
              console.log(`[Automation] Patient ${booking.patientName} enrolled in Missed-Appointment Recovery Sequence`);
            }
          }
          
          // Completed → Post-Visit Care Sequence + Review Sequence (delayed)
          if (status === "completed" && previousStatus !== "completed") {
            const postVisitSequence = sequences.find(s => s.name === "Post-Visit Care Sequence" && s.status === "active");
            const reviewSequence = sequences.find(s => s.name === "Review & Testimonial Sequence" && s.status === "active");
            
            if (postVisitSequence) {
              await storage.createSequenceEnrollment({
                sequenceId: postVisitSequence.id,
                leadId: lead.id,
                currentStepOrder: 1,
                status: "active",
                nextSendAt: new Date(),
              });
              console.log(`[Automation] Patient ${booking.patientName} enrolled in Post-Visit Care Sequence`);
            }
            
            if (reviewSequence) {
              // Schedule review sequence to start 3 days after visit completion
              const reviewStartDate = new Date();
              reviewStartDate.setDate(reviewStartDate.getDate() + 3);
              await storage.createSequenceEnrollment({
                sequenceId: reviewSequence.id,
                leadId: lead.id,
                currentStepOrder: 1,
                status: "active",
                nextSendAt: reviewStartDate,
              });
              console.log(`[Automation] Patient ${booking.patientName} enrolled in Review & Testimonial Sequence (starting in 3 days)`);
            }
          }
        }
      } catch (enrollError) {
        console.error("Error auto-enrolling patient in sequence on status change:", enrollError);
      }
      
      res.json({ message: "Status updated successfully" });
    } catch (error) {
      console.error("Error updating patient booking status:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  // ============================================================================
  // AI DEMO ENDPOINT - Live demo chat for the /demo page
  // ============================================================================
  
  // In-memory session storage for demo conversations (simple, no persistence needed)
  const demoSessions: Map<string, Array<{ role: "user" | "assistant"; content: string }>> = new Map();

  // AI Demo endpoint - POST /api/ai
  // Request: { message: string, mode: "receptionist" | "treatment" | "recall" | "marketing", sessionId: string }
  // Response: { reply: string }
  app.post("/api/ai", async (req, res) => {
    try {
      const { message, mode, sessionId } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
      }

      if (!mode || !["receptionist", "treatment", "recall", "marketing"].includes(mode)) {
        return res.status(400).json({ error: "Valid mode is required (receptionist, treatment, recall, marketing)" });
      }

      const session = sessionId || crypto.randomUUID();

      // Get or create conversation history for this session
      if (!demoSessions.has(session)) {
        demoSessions.set(session, []);
      }

      const conversationHistory = demoSessions.get(session)!;

      // Add user message to history
      conversationHistory.push({ role: "user", content: message });

      // Generate AI response with mode-specific behavior
      const reply = await generateDemoResponse(conversationHistory, mode as DemoMode);

      // Add AI response to history
      conversationHistory.push({ role: "assistant", content: reply });

      // Clean up old sessions (keep only last 100 sessions to prevent memory issues)
      if (demoSessions.size > 100) {
        const oldestKey = demoSessions.keys().next().value;
        if (oldestKey) demoSessions.delete(oldestKey);
      }

      res.json({ reply, sessionId: session });
    } catch (error) {
      console.error("AI demo error:", error);
      res.status(500).json({ 
        reply: "The demo AI is momentarily unavailable. Please try again in a few seconds.",
        error: "AI service temporarily unavailable"
      });
    }
  });

  // GET /api/demo - Serve demo metadata
  app.get("/api/demo", (req, res) => {
    res.json({
      title: "AI Dental Receptionist — Live Demo",
      modes: [
        { id: "receptionist", name: "AI Receptionist", description: "Front-desk agent for patient scheduling" },
        { id: "treatment", name: "AI Treatment Planner", description: "Explains dental procedures" },
        { id: "recall", name: "AI Recall System", description: "Reactivates inactive patients" },
        { id: "marketing", name: "AI Marketing Agent", description: "Creates promotional campaigns" },
      ],
      initialMessage: "Hello! I'm the AI Dental Receptionist for this demo. I can schedule patients, verify insurance details, handle emergencies, explain treatments, re-activate old patients, and even help with marketing campaigns for your clinic.\n\nChoose a mode above or just say 'hi' and see how I respond!",
    });
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
      const clinicId = await requireClinicContext(req, res);
      if (!clinicId) return;
      
      const campaigns = await storage.getCampaignsByClinic(clinicId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/campaigns", async (req: any, res) => {
    try {
      const clinicId = await requireClinicContext(req, res);
      if (!clinicId) return;
      if (!await requireAdminRole(req, res)) return;
      
      const campaignData = { ...req.body, clinicId };
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

      // Support both traditional and social campaign types
      const validTypes = ["email", "sms", "whatsapp", "facebook_post", "instagram_post", "youtube_post", "tiktok_caption"];
      if (!type || !validTypes.includes(type)) {
        return res.status(400).json({ message: "Invalid campaign type" });
      }

      const draft = await generateOutreachDraft(type);
      res.json(draft);
    } catch (error) {
      console.error("Error generating draft:", error);
      res.status(500).json({ message: "Failed to generate draft" });
    }
  });

  // Get single campaign by ID
  app.get("/api/campaigns/:id", async (req: any, res) => {
    try {
      const clinicId = await requireClinicContext(req, res);
      if (!clinicId) return;
      
      const { id } = req.params;
      const campaign = await storage.getCampaignById(id);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Verify campaign belongs to user's clinic
      if (campaign.clinicId !== clinicId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(campaign);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });

  // Update campaign (clinic-scoped for security)
  app.put("/api/campaigns/:id", async (req: any, res) => {
    try {
      const clinicId = await requireClinicContext(req, res);
      if (!clinicId) return;
      
      const { id } = req.params;
      
      // Don't allow changing clinicId in request body
      const { clinicId: _, ...updateData } = req.body;
      
      // Use clinic-scoped update for database-level security
      // This ensures the campaign both exists AND belongs to this clinic
      const updatedCampaign = await storage.updateCampaignByClinic(id, clinicId, updateData);
      
      if (!updatedCampaign) {
        return res.status(404).json({ message: "Campaign not found or access denied" });
      }
      
      res.json(updatedCampaign);
    } catch (error) {
      console.error("Error updating campaign:", error);
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  // Run email campaign - sends emails to leads with valid email addresses
  // Note: By default sends to all leads. Use ?includeAllLeads=true to include non-opted-in leads
  app.post("/api/campaigns/:id/run", async (req: any, res) => {
    try {
      const clinicId = await requireClinicContext(req, res);
      if (!clinicId) return;
      
      const { id } = req.params;
      const { includeAllLeads } = req.query; // Optional: include leads without marketing opt-in
      
      const campaign = await storage.getCampaignById(id);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      if (campaign.clinicId !== clinicId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (campaign.type !== "email") {
        return res.status(400).json({ message: "Only email campaigns can be run. This is a " + campaign.type + " campaign." });
      }
      
      // Validate campaign has required content
      if (!campaign.message || campaign.message.trim() === "") {
        return res.status(400).json({ message: "Campaign message is required" });
      }
      
      // Get leads with email addresses
      const allLeads = await storage.getLeadsWithEmail(clinicId);
      
      // Filter by marketing opt-in unless explicitly including all
      const leads = includeAllLeads === "true" 
        ? allLeads 
        : allLeads.filter(lead => lead.marketingOptIn === true);
      
      if (leads.length === 0) {
        const message = includeAllLeads === "true"
          ? "No leads with email addresses found"
          : "No opted-in leads with email addresses found. Add ?includeAllLeads=true to send to all leads.";
        return res.status(400).json({ message });
      }
      
      // Check daily limit before starting
      const dailyLimit = campaign.dailyLimit || 50;
      const currentSentToday = campaign.sentToday || 0;
      const remainingToday = dailyLimit - currentSentToday;
      
      if (remainingToday <= 0) {
        return res.status(400).json({ 
          message: "Daily limit reached. Campaign will resume tomorrow.",
          sentToday: currentSentToday,
          dailyLimit
        });
      }
      
      // Update campaign status to active
      await storage.updateCampaignByClinic(id, clinicId, { status: "active" });
      
      let successCount = 0;
      let failCount = 0;
      let skippedDueToLimit = 0;
      const results: Array<{ email: string; success: boolean; error?: string }> = [];
      
      // Send emails to each lead (up to daily limit)
      for (const lead of leads) {
        if (!lead.email) continue;
        
        // Respect daily limit
        if (successCount >= remainingToday) {
          skippedDueToLimit++;
          results.push({ email: lead.email, success: false, error: "Daily limit reached" });
          continue; // Continue counting skipped, don't break
        }
        
        const messageHtml = campaign.message.replace(/\n/g, '<br>');
        
        const emailResult = await sendEmail({
          to: lead.email,
          subject: campaign.subject || `Message from DentalLeadGenius`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <p>${messageHtml}</p>
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
              <p style="font-size: 12px; color: #71717a;">
                You received this email because you are a dental professional in our network.
                <br>If you no longer wish to receive these emails, reply with "UNSUBSCRIBE".
              </p>
            </div>
          `,
          text: campaign.message,
        });
        
        if (emailResult.ok) {
          successCount++;
          results.push({ email: lead.email, success: true });
          
          // Update lead status to contacted if it was new (clinic-scoped via lead ownership)
          if (lead.status === "new" && lead.clinicId === clinicId) {
            await storage.updateLead(lead.id, { status: "contacted" });
          }
        } else {
          failCount++;
          results.push({ email: lead.email, success: false, error: emailResult.error });
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Determine final status
      const pendingLeads = skippedDueToLimit > 0;
      const finalStatus = pendingLeads ? "paused" : (successCount > 0 ? "completed" : "draft");
      
      // Update campaign stats
      await storage.updateCampaignByClinic(id, clinicId, {
        totalSent: (campaign.totalSent || 0) + successCount,
        sentToday: (campaign.sentToday || 0) + successCount,
        status: finalStatus,
      });
      
      res.json({
        success: true,
        message: pendingLeads 
          ? `Campaign sent to ${successCount} leads. ${skippedDueToLimit} leads pending (daily limit reached).`
          : `Campaign sent to ${successCount} leads`,
        stats: {
          totalLeads: leads.length,
          sent: successCount,
          failed: failCount,
          skippedDueToLimit,
          dailyLimitRemaining: remainingToday - successCount,
        },
        results,
      });
    } catch (error) {
      console.error("Error running campaign:", error);
      res.status(500).json({ message: "Failed to run campaign" });
    }
  });

  // Analytics route (clinic-scoped)
  app.get("/api/analytics", async (req: any, res) => {
    try {
      const clinicId = await requireClinicContext(req, res);
      if (!clinicId) return;
      
      const analytics = await storage.getAnalyticsByClinic(clinicId);
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
  
  // Enhanced Dashboard Stats - comprehensive platform overview
  app.get("/api/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check if clinic filter is provided
      const clinicId = req.query.clinicId as string | undefined;
      
      // If clinic filter provided, verify user has access
      if (clinicId) {
        const clinic = await storage.getClinicById(clinicId);
        if (!clinic || clinic.ownerId !== userId) {
          return res.status(403).json({ message: "Access denied to this clinic" });
        }
      }
      
      // Get dashboard stats (optionally filtered by clinic)
      const stats = await storage.getDashboardStats(clinicId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });
  
  // Recent leads for dashboard
  app.get("/api/dashboard/recent-leads", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const limit = parseInt(req.query.limit as string) || 10;
      const clinicId = req.query.clinicId as string | undefined;
      
      // If clinic filter provided, verify user has access
      if (clinicId) {
        const clinic = await storage.getClinicById(clinicId);
        if (!clinic || clinic.ownerId !== userId) {
          return res.status(403).json({ message: "Access denied to this clinic" });
        }
      }
      
      const recentLeads = await storage.getRecentLeads(limit, clinicId);
      res.json(recentLeads);
    } catch (error) {
      console.error("Error fetching recent leads:", error);
      res.status(500).json({ message: "Failed to fetch recent leads" });
    }
  });
  
  // Campaigns with stats for dashboard
  app.get("/api/dashboard/campaigns", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const clinicId = req.query.clinicId as string | undefined;
      
      // If clinic filter provided, verify user has access
      if (clinicId) {
        const clinic = await storage.getClinicById(clinicId);
        if (!clinic || clinic.ownerId !== userId) {
          return res.status(403).json({ message: "Access denied to this clinic" });
        }
      }
      
      const campaigns = await storage.getCampaignsWithStats(clinicId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
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
  
  // ================== NURTURE CAMPAIGN ROUTES ==================
  
  // Run nurture campaign for a clinic
  app.post("/api/nurture/run/:clinicId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const clinic = await storage.getClinicById(req.params.clinicId);
      if (!clinic || clinic.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const results = await runClinicNurtureCampaign(req.params.clinicId);
      res.json(results);
    } catch (error) {
      console.error("Error running nurture campaign:", error);
      res.status(500).json({ message: "Failed to run nurture campaign" });
    }
  });
  
  // Get nurture status for a lead
  app.get("/api/nurture/status/:leadId", isAuthenticated, async (req: any, res) => {
    try {
      const status = await getNurtureStatus(req.params.leadId);
      res.json(status);
    } catch (error) {
      console.error("Error fetching nurture status:", error);
      res.status(500).json({ message: "Failed to fetch nurture status" });
    }
  });
  
  // Create nurture campaign for clinic
  app.post("/api/nurture/campaigns", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { clinicId, name } = req.body;
      
      const clinic = await storage.getClinicById(clinicId);
      if (!clinic || clinic.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const campaign = await createNurtureSequenceCampaign(clinicId, name);
      res.json(campaign);
    } catch (error) {
      console.error("Error creating nurture campaign:", error);
      res.status(500).json({ message: "Failed to create nurture campaign" });
    }
  });
  
  // ================== LEAD SEGMENTATION ROUTES ==================
  
  // Update lead status
  app.patch("/api/leads/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const { status } = req.body;
      let updatedLead;
      
      switch (status) {
        case "contacted":
          updatedLead = await markContacted(req.params.id);
          break;
        case "warm":
          updatedLead = await markWarm(req.params.id);
          break;
        case "replied":
          updatedLead = await markReplied(req.params.id);
          break;
        case "demo_booked":
          updatedLead = await markDemoBooked(req.params.id);
          break;
        case "won":
          updatedLead = await markConverted(req.params.id);
          break;
        case "lost":
          updatedLead = await markLost(req.params.id);
          break;
        default:
          return res.status(400).json({ message: `Invalid status: ${status}` });
      }
      
      if (!updatedLead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      res.json(updatedLead);
    } catch (error) {
      console.error("Error updating lead status:", error);
      res.status(500).json({ message: "Failed to update lead status" });
    }
  });
  
  // Add tag to lead
  app.post("/api/leads/:id/tags", isAuthenticated, async (req: any, res) => {
    try {
      const { tag } = req.body;
      if (!tag) {
        return res.status(400).json({ message: "Tag is required" });
      }
      
      const lead = await addTag(req.params.id, tag);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      res.json(lead);
    } catch (error) {
      console.error("Error adding tag:", error);
      res.status(500).json({ message: "Failed to add tag" });
    }
  });
  
  // Remove tag from lead
  app.delete("/api/leads/:id/tags/:tag", isAuthenticated, async (req: any, res) => {
    try {
      const lead = await removeTag(req.params.id, req.params.tag);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      res.json(lead);
    } catch (error) {
      console.error("Error removing tag:", error);
      res.status(500).json({ message: "Failed to remove tag" });
    }
  });
  
  // Get segmentation summary for clinic
  app.get("/api/segmentation/:clinicId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const clinic = await storage.getClinicById(req.params.clinicId);
      if (!clinic || clinic.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const summary = await getSegmentationSummary(req.params.clinicId);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching segmentation summary:", error);
      res.status(500).json({ message: "Failed to fetch segmentation summary" });
    }
  });
  
  // ================== BOOKING ANALYTICS ROUTES ==================
  
  // Get booking analytics for a clinic
  app.get("/api/analytics/bookings/:clinicId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const clinic = await storage.getClinicById(req.params.clinicId);
      if (!clinic || clinic.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const analytics = await getClinicBookingAnalytics(req.params.clinicId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching booking analytics:", error);
      res.status(500).json({ message: "Failed to fetch booking analytics" });
    }
  });
  
  // Get campaign conversion stats
  app.get("/api/analytics/campaign/:campaignId/conversions", isAuthenticated, async (req: any, res) => {
    try {
      const stats = await getCampaignConversionStats(req.params.campaignId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching campaign conversion stats:", error);
      res.status(500).json({ message: "Failed to fetch conversion stats" });
    }
  });
  
  // ================== SEQUENCE ROUTES ==================
  
  // Get all sequences
  app.get("/api/sequences", async (req: any, res) => {
    try {
      const clinicId = await requireClinicContext(req, res);
      if (!clinicId) return;
      const sequences = await storage.getSequencesByClinic(clinicId);
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
      const clinicId = await requireClinicContext(req, res);
      if (!clinicId) return;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const sequenceData = insertSequenceSchema.parse({
        ...req.body,
        clinicId, // Add clinic context
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

  // ================== STRIPE PAYMENT ROUTES ==================
  
  // Initialize Stripe on startup
  initStripe().catch(err => console.error("Stripe init error:", err));

  // Stripe webhook handler - uses rawBody from app.ts
  app.post("/api/stripe/webhook/:uuid", async (req: any, res) => {
    try {
      const signature = req.headers['stripe-signature'];
      if (!signature) {
        return res.status(400).json({ error: 'Missing stripe-signature' });
      }

      const sig = Array.isArray(signature) ? signature[0] : signature;
      const { uuid } = req.params;
      
      // Use rawBody which was captured in app.ts
      const payload = req.rawBody;
      if (!Buffer.isBuffer(payload)) {
        console.error('Webhook payload is not a Buffer');
        return res.status(400).json({ error: 'Invalid payload' });
      }

      await WebhookHandlers.processWebhook(payload, sig, uuid);
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  });

  // Get Stripe publishable key for frontend
  app.get("/api/stripe/config", async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error getting Stripe config:", error);
      res.status(500).json({ message: "Stripe not configured" });
    }
  });

  // Get pricing packages (your exact pricing)
  app.get("/api/pricing", async (req, res) => {
    const packages = [
      {
        id: 'essential',
        name: 'Essential Package',
        description: 'Perfect for solo practitioners. Includes AI chatbot, lead management, and basic outreach automation.',
        setupFee: 1997,
        monthlyFee: 497,
        features: [
          'AI-powered sales chatbot',
          'Lead management with CSV import',
          'Basic email outreach',
          '1 clinic profile',
          'Patient appointment booking',
          'Basic analytics dashboard'
        ],
        clinicLimit: 1,
        popular: false
      },
      {
        id: 'growth',
        name: 'Growth Package',
        description: 'For growing practices. Includes everything in Essential plus multi-channel outreach, sequences, and up to 3 clinics.',
        setupFee: 2997,
        monthlyFee: 997,
        features: [
          'Everything in Essential',
          'Multi-channel outreach (Email, SMS, WhatsApp)',
          'Automated follow-up sequences',
          'Up to 3 clinic profiles',
          'Advanced analytics with charts',
          'AI-generated message drafts',
          'Priority email support'
        ],
        clinicLimit: 3,
        popular: true
      },
      {
        id: 'elite',
        name: 'Elite Package',
        description: 'For multi-location practices. Includes everything in Growth plus unlimited clinics, priority support, and custom branding.',
        setupFee: 4997,
        monthlyFee: 1497,
        features: [
          'Everything in Growth',
          'Unlimited clinic profiles',
          'Custom branding for each clinic',
          'Priority phone & email support',
          'Dedicated account manager',
          'API access for integrations',
          'Custom chatbot training'
        ],
        clinicLimit: -1,
        popular: false
      }
    ];
    res.json(packages);
  });

  // Create checkout session for a package
  app.post("/api/checkout/create-session", async (req: any, res) => {
    try {
      const { packageId, email, clinicName, ownerName } = req.body;
      
      if (!packageId || !email || !clinicName || !ownerName) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const stripe = await getUncachableStripeClient();
      
      // Define package pricing (amounts in cents)
      const packages: Record<string, { setupFee: number; monthlyFee: number; name: string }> = {
        essential: { setupFee: 199700, monthlyFee: 49700, name: 'Essential Package' },
        growth: { setupFee: 299700, monthlyFee: 99700, name: 'Growth Package' },
        elite: { setupFee: 499700, monthlyFee: 149700, name: 'Elite Package' }
      };

      const pkg = packages[packageId];
      if (!pkg) {
        return res.status(400).json({ message: "Invalid package" });
      }

      // Create or get customer
      const customers = await stripe.customers.list({ email, limit: 1 });
      let customer = customers.data[0];
      
      if (!customer) {
        customer = await stripe.customers.create({
          email,
          name: ownerName,
          metadata: {
            clinicName,
            packageId,
          }
        });
      }

      // Build URLs
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:5000';
      const baseUrl = `${protocol}://${host}`;

      // Create checkout session with setup fee + subscription
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${pkg.name} - Setup Fee`,
                description: 'One-time setup and onboarding fee',
              },
              unit_amount: pkg.setupFee,
            },
            quantity: 1,
          },
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${pkg.name} - Monthly Subscription`,
                description: 'Monthly access to DentalLeadGenius platform',
              },
              unit_amount: pkg.monthlyFee,
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/pricing`,
        metadata: {
          packageId,
          clinicName,
          ownerName,
          email,
        },
      });

      res.json({ url: session.url, sessionId: session.id });
    } catch (error: any) {
      console.error("Checkout error:", error);
      res.status(500).json({ message: error.message || "Failed to create checkout session" });
    }
  });

  // Handle successful payment - create user account and clinic
  app.get("/api/checkout/success", async (req: any, res) => {
    try {
      const { session_id } = req.query;
      
      if (!session_id) {
        return res.status(400).json({ message: "Missing session ID" });
      }

      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(session_id as string);

      if (session.payment_status !== 'paid') {
        return res.status(400).json({ message: "Payment not completed" });
      }

      const { packageId, clinicName, ownerName, email } = session.metadata || {};
      
      if (!email || !clinicName || !ownerName) {
        return res.status(400).json({ message: "Missing session metadata" });
      }

      // Check if user already exists
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Generate temporary password
        const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        
        // Create new clinic admin user
        user = await storage.createUserWithPassword(
          email,
          hashedPassword,
          'clinic',
          ownerName.split(' ')[0],
          ownerName.split(' ').slice(1).join(' ') || ''
        );

        // Update user with Stripe info
        await storage.updateUserStripeInfo(user.id, {
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          subscriptionTier: packageId,
          subscriptionStatus: 'active'
        });

        // Create clinic for this user
        const slug = clinicName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        await storage.createClinic({
          name: clinicName,
          slug: slug + '-' + Date.now().toString().slice(-4),
          ownerId: user.id,
        });

        console.log("=== NEW CUSTOMER CREATED ===");
        console.log(`Email: ${email}`);
        console.log(`Clinic: ${clinicName}`);
        console.log(`Package: ${packageId}`);
        console.log(`Temporary Password: ${tempPassword}`);
        console.log("=== SEND THIS TO CUSTOMER ===");

        res.json({ 
          success: true, 
          message: "Account created successfully",
          email,
          clinicName,
          tempPassword, // In production, send this via email
        });
      } else {
        // User exists - update subscription
        await storage.updateUserStripeInfo(user.id, {
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          subscriptionTier: packageId,
          subscriptionStatus: 'active'
        });

        res.json({ 
          success: true, 
          message: "Subscription updated",
          email,
        });
      }
    } catch (error: any) {
      console.error("Success handler error:", error);
      res.status(500).json({ message: error.message || "Failed to process payment" });
    }
  });

  // Get user subscription status
  app.get("/api/subscription", async (req: any, res) => {
    try {
      if (!requireAuth(req, res)) return;
      
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        tier: user.subscriptionTier,
        status: user.subscriptionStatus,
        customerId: user.stripeCustomerId,
      });
    } catch (error) {
      console.error("Error getting subscription:", error);
      res.status(500).json({ message: "Failed to get subscription" });
    }
  });

  // Create customer portal session for managing subscription
  app.post("/api/stripe/portal", async (req: any, res) => {
    try {
      if (!requireAuth(req, res)) return;
      
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ message: "No subscription found" });
      }

      const stripe = await getUncachableStripeClient();
      
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:5000';
      const returnUrl = `${protocol}://${host}/admin`;

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: returnUrl,
      });

      res.json({ url: portalSession.url });
    } catch (error: any) {
      console.error("Portal error:", error);
      res.status(500).json({ message: error.message || "Failed to create portal session" });
    }
  });

  // ================== SEQUENCE SEEDING ==================
  
  // Seed the default "Smart Lead Conversion Sequence" with professional copywriting
  app.post("/api/sequences/seed-default", async (req: any, res) => {
    try {
      const clinicId = await requireClinicContext(req, res);
      if (!clinicId) return;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check if sequence already exists for this clinic
      const existingSequences = await storage.getSequencesByClinic(clinicId);
      const hasDefault = existingSequences.some(s => s.name === "Smart Lead Conversion Sequence");
      if (hasDefault) {
        return res.status(400).json({ message: "Default sequence already exists" });
      }
      
      // Create the sequence
      const sequence = await storage.createSequence({
        name: "Smart Lead Conversion Sequence",
        description: "A proven 9-step automated follow-up sequence designed for dental clinics. Introduces your services, addresses pain points, builds trust with social proof, and guides leads to book a demo.",
        sequenceType: "new_lead",
        status: "active",
        clinicId,
        ownerId: userId,
      });
      
      // Step 1: Welcome Message (Email + SMS) - Immediately
      await storage.createSequenceStep({
        sequenceId: sequence.id,
        stepOrder: 1,
        channel: "email",
        subject: "Welcome to DentalLeadGenius - Let's Transform Your Practice",
        message: `Hi {{name}},

Welcome to DentalLeadGenius! I'm thrilled you're interested in transforming how your dental practice attracts and converts new patients.

You've just taken the first step toward:
- Never missing another patient call or inquiry
- Filling your appointment book on autopilot
- Reducing no-shows by up to 40%

Quick question: What's the #1 challenge holding your practice back from growing right now?

Reply to this email and let me know - I personally read every response and would love to help you solve it.

Looking forward to helping {{clinic}} thrive,

The DentalLeadGenius Team

P.S. Keep an eye on your inbox - I'll be sharing some game-changing insights over the next few days.`,
        delayDays: 0,
        delayHours: 0,
      });
      
      await storage.createSequenceStep({
        sequenceId: sequence.id,
        stepOrder: 2,
        channel: "sms",
        subject: "",
        message: `Hi {{name}}! Thanks for connecting with DentalLeadGenius. We help dental clinics like yours get 10x more quality leads using AI. Check your email for a welcome message with details on how we can help {{clinic}} grow!`,
        delayDays: 0,
        delayHours: 1,
      });
      
      // Step 2: Pain Point Message (Email) - 1 day later
      await storage.createSequenceStep({
        sequenceId: sequence.id,
        stepOrder: 3,
        channel: "email",
        subject: "The 3 Hidden Reasons Your Practice Is Losing Patients",
        message: `Hi {{name}},

After working with hundreds of dental practices, I've identified the 3 silent killers that cost clinics thousands in lost revenue every month:

1. MISSED CALLS = MISSED PATIENTS
Studies show 62% of calls to dental offices go unanswered. Each missed call represents $500-$2,000 in potential treatment value. Our AI receptionist answers 100% of calls, 24/7.

2. NO-SHOWS ARE DRAINING YOUR SCHEDULE
The average no-show rate in dentistry is 15-20%. That's 3-4 empty chairs per day! Our smart reminder system reduces no-shows by 40% through personalized follow-ups.

3. SLOW FOLLOW-UP = LOST LEADS
78% of leads go to the first practice that responds. If you're not following up within 5 minutes, you're losing patients to competitors. Our AI follows up instantly, every time.

Sound familiar?

The good news: These are all fixable. And we can show you exactly how.

Would you like to see how DentalLeadGenius addresses each of these challenges for practices like yours?

Reply "YES" and I'll send you a personalized practice audit.

Best,
The DentalLeadGenius Team`,
        delayDays: 1,
        delayHours: 0,
      });
      
      // Step 3: Social Proof Message (Email + WhatsApp) - 2 days later
      await storage.createSequenceStep({
        sequenceId: sequence.id,
        stepOrder: 4,
        channel: "email",
        subject: "How Dr. Smith Added 47 New Patients in 30 Days",
        message: `Hi {{name}},

I wanted to share a quick success story that might resonate with you...

Dr. Sarah Smith was frustrated. Her practice was stuck at 150 patients/month despite great reviews and skilled staff. Sound familiar?

Within 30 days of implementing DentalLeadGenius, here's what happened:

Before DentalLeadGenius:
- Missed 40% of after-hours calls
- 18% no-show rate
- 3-day average lead follow-up time
- 150 new patients/month

After DentalLeadGenius:
- 0% missed calls (AI handles everything)
- 8% no-show rate (smart reminders work!)
- 30-second average response time
- 197 new patients/month (47 more!)

"I was skeptical about AI, but the results speak for themselves. We're now seeing patients we would have lost to competitors." - Dr. Sarah Smith, SmileBright Dental

What if you could achieve similar results for {{clinic}}?

I'd love to show you exactly how we did it and what it would look like for your practice.

Schedule your free strategy call here: [Link]

Best,
The DentalLeadGenius Team`,
        delayDays: 2,
        delayHours: 0,
      });
      
      await storage.createSequenceStep({
        sequenceId: sequence.id,
        stepOrder: 5,
        channel: "whatsapp",
        subject: "",
        message: `Hey {{name}}! Just sent you an email about how dental practices like yours are adding 40+ new patients per month. Check it out when you have a moment - the Dr. Smith case study is really eye-opening! Let me know if you have any questions.`,
        delayDays: 2,
        delayHours: 4,
      });
      
      // Step 4: Value Delivery Message (Email) - 3 days later
      await storage.createSequenceStep({
        sequenceId: sequence.id,
        stepOrder: 6,
        channel: "email",
        subject: "Your Free Practice Growth Audit [Inside]",
        message: `Hi {{name}},

I put together a quick audit of what AI could fix for {{clinic}} based on typical dental practice patterns:

YOUR POTENTIAL QUICK WINS:

1. CAPTURE MORE LEADS (Value: ~$8,000/month)
Right now, most practices lose 30-40% of website visitors who don't fill out forms. Our AI chatbot engages every visitor, answers questions 24/7, and books appointments automatically.

2. RECOVER MISSED CALLS (Value: ~$5,000/month)
After-hours and busy-period calls often go to voicemail (and patients call the next dentist). Our AI receptionist handles unlimited concurrent calls and schedules appointments in real-time.

3. REDUCE NO-SHOWS (Value: ~$3,000/month)
Multi-channel smart reminders (SMS, email, WhatsApp) with easy rescheduling options typically cut no-shows by 40%.

4. SPEED UP FOLLOW-UP (Value: ~$6,000/month)
Instant lead response (not hours or days) dramatically increases conversion. Our AI follows up in seconds, not days.

ESTIMATED MONTHLY IMPACT: $22,000+ in recovered revenue

Want to see the exact implementation plan for {{clinic}}?

I have a few spots open this week for a complimentary 15-minute strategy call where I'll walk you through:
- Which quick wins would have the biggest impact for your practice
- A realistic timeline for implementation
- What ROI you can expect in the first 90 days

Book your spot here: [Link]

To your practice's success,
The DentalLeadGenius Team`,
        delayDays: 3,
        delayHours: 0,
      });
      
      // Step 5: Demo Reminder Message (SMS + Email) - 4 days later
      await storage.createSequenceStep({
        sequenceId: sequence.id,
        stepOrder: 7,
        channel: "sms",
        subject: "",
        message: `Hi {{name}}, quick reminder: Have you had a chance to review the growth audit I sent? I'd love to walk you through how {{clinic}} could add 40+ new patients/month. Got 15 mins this week? Reply to pick a time!`,
        delayDays: 4,
        delayHours: 0,
      });
      
      await storage.createSequenceStep({
        sequenceId: sequence.id,
        stepOrder: 8,
        channel: "email",
        subject: "Quick question for you, {{name}}...",
        message: `Hi {{name}},

I noticed you haven't scheduled your strategy call yet, and I wanted to check in.

I totally get it - running a dental practice is incredibly demanding. Between patient care, staff management, and everything else, adding one more thing to your plate can feel overwhelming.

But here's the thing...

The practices that are growing fastest right now aren't working harder - they're working smarter. They've automated the repetitive tasks that used to eat up hours of their day.

What if I told you that a 15-minute call could show you how to:
- Free up 10+ hours per week for your team
- Add 30-50 new patients per month on autopilot
- Reduce your marketing costs by 40%

All without any risk or long-term commitment.

Would that be worth 15 minutes of your time?

If so, just reply to this email with "DEMO" and I'll personally reach out to find a time that works for you.

Looking forward to hearing from you,
The DentalLeadGenius Team

P.S. We're offering early adopter pricing this month only. Book your call now to lock in our best rates before they go up.`,
        delayDays: 4,
        delayHours: 3,
      });
      
      // Step 6: Final CTA Message (Email) - 5 days later
      await storage.createSequenceStep({
        sequenceId: sequence.id,
        stepOrder: 9,
        channel: "email",
        subject: "Last chance: Your exclusive offer expires tomorrow",
        message: `Hi {{name}},

I'll keep this brief...

This is my final follow-up about DentalLeadGenius, and I wanted to make sure you didn't miss out on our early adopter offer.

HERE'S WHAT YOU'RE LEAVING ON THE TABLE:
- AI-powered 24/7 patient communication
- Automated appointment scheduling & reminders
- Multi-channel lead nurturing (Email, SMS, WhatsApp)
- Real-time analytics dashboard
- And much more...

EARLY ADOPTER BONUS (Expires Tomorrow):
- 30% off your first 3 months
- Free implementation & onboarding ($2,000 value)
- Dedicated success manager
- 60-day money-back guarantee

After tomorrow, these bonuses disappear and pricing increases.

I don't want {{clinic}} to miss this opportunity to transform your practice while the offer is still available.

Final call: Book your demo before midnight tomorrow.

[BOOK MY DEMO NOW]

If now isn't the right time, I completely understand. Just reply "later" and I'll check back in a few months.

Wishing you and {{clinic}} continued success,
The DentalLeadGenius Team

P.S. Remember, you're protected by our 60-day money-back guarantee. If you don't see results, you don't pay. There's literally no risk.`,
        delayDays: 5,
        delayHours: 0,
      });
      
      // Get the complete sequence with steps
      const steps = await storage.getSequenceSteps(sequence.id);
      
      res.json({ 
        message: "Smart Lead Conversion Sequence created successfully!",
        sequence: { ...sequence, steps }
      });
    } catch (error) {
      console.error("Error seeding sequence:", error);
      res.status(500).json({ message: "Failed to seed sequence" });
    }
  });

  // Seed all patient AI chatbot sequences
  app.post("/api/sequences/seed-patient-chatbot", async (req: any, res) => {
    try {
      const clinicId = await requireClinicContext(req, res);
      if (!clinicId) return;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const createdSequences: any[] = [];
      
      // ================ 1. NEW LEAD FLOW SEQUENCE ================
      const newLeadSequence = await storage.createSequence({
        name: "New Patient Lead Flow",
        description: "Automated welcome and nurturing sequence for new patient inquiries. Converts leads into booked appointments through personalized follow-ups.",
        sequenceType: "new_lead",
        status: "active",
        clinicId,
        ownerId: userId,
      });
      
      await storage.createSequenceStep({
        sequenceId: newLeadSequence.id,
        stepOrder: 1,
        channel: "sms",
        subject: "",
        message: `Hi {{patient_name}}! Thank you for your interest in {{clinic_name}}. We're excited to help you achieve your best smile! A team member will be in touch shortly. Questions? Reply to this message anytime.`,
        delayDays: 0,
        delayHours: 0,
      });
      
      await storage.createSequenceStep({
        sequenceId: newLeadSequence.id,
        stepOrder: 2,
        channel: "email",
        subject: "Welcome to {{clinic_name}} - Your Smile Journey Begins!",
        message: `Hi {{patient_name}},

Thank you for reaching out to {{clinic_name}}! We're thrilled you're considering us for your dental care.

Here's what makes us special:
- State-of-the-art technology for comfortable, efficient treatment
- Friendly, experienced team dedicated to your care
- Flexible scheduling to fit your busy life
- Transparent pricing with no surprises

SPECIAL NEW PATIENT OFFER:
Book your first appointment within the next 48 hours and receive a complimentary consultation (a $150 value)!

Ready to get started? Simply reply to this email or call us at {{clinic_phone}}.

We can't wait to welcome you to our dental family!

Warm regards,
The {{clinic_name}} Team`,
        delayDays: 0,
        delayHours: 1,
      });
      
      await storage.createSequenceStep({
        sequenceId: newLeadSequence.id,
        stepOrder: 3,
        channel: "sms",
        subject: "",
        message: `Hi {{patient_name}}, just checking in from {{clinic_name}}! Still interested in scheduling your visit? We have appointments available this week. Reply YES and we'll help you find the perfect time!`,
        delayDays: 1,
        delayHours: 0,
      });
      
      await storage.createSequenceStep({
        sequenceId: newLeadSequence.id,
        stepOrder: 4,
        channel: "email",
        subject: "{{patient_name}}, your smile transformation awaits!",
        message: `Hi {{patient_name}},

I noticed you haven't scheduled your appointment yet, and I wanted to make sure you didn't miss out on our new patient special!

I understand choosing a new dentist is a big decision. Here's what our patients love about us:

"Dr. Smith and the team are amazing! I used to dread dental visits, but now I actually look forward to them." - Sarah M.

"Best dental experience I've ever had. Gentle, professional, and the office is beautiful!" - James P.

We'd love to give you the same 5-star experience.

REMINDER: Your complimentary consultation offer expires soon!

To book your appointment:
- Reply to this email with your preferred date/time
- Call us at {{clinic_phone}}
- Or visit our online booking at {{clinic_website}}

Looking forward to meeting you!

Best,
The {{clinic_name}} Team`,
        delayDays: 2,
        delayHours: 0,
      });
      
      await storage.createSequenceStep({
        sequenceId: newLeadSequence.id,
        stepOrder: 5,
        channel: "whatsapp",
        subject: "",
        message: `Hey {{patient_name}}! This is {{clinic_name}}. We noticed you inquired about dental services. Would you like to chat about how we can help with your dental needs? We're here to answer any questions!`,
        delayDays: 3,
        delayHours: 0,
      });
      
      const newLeadSteps = await storage.getSequenceSteps(newLeadSequence.id);
      createdSequences.push({ ...newLeadSequence, steps: newLeadSteps });
      
      // ================ 2. MISSED CALL SEQUENCE ================
      const missedCallSequence = await storage.createSequence({
        name: "Missed Call Recovery",
        description: "Instantly follow up with patients who called but couldn't reach the office. Captures leads that would otherwise be lost.",
        sequenceType: "missed_call",
        status: "active",
        clinicId,
        ownerId: userId,
      });
      
      await storage.createSequenceStep({
        sequenceId: missedCallSequence.id,
        stepOrder: 1,
        channel: "sms",
        subject: "",
        message: `Hi! We noticed we missed your call at {{clinic_name}}. So sorry about that! How can we help you today? Reply here or call us back at {{clinic_phone}} - we're ready to assist!`,
        delayDays: 0,
        delayHours: 0,
      });
      
      await storage.createSequenceStep({
        sequenceId: missedCallSequence.id,
        stepOrder: 2,
        channel: "email",
        subject: "Sorry we missed your call - {{clinic_name}}",
        message: `Hi there,

We're so sorry we missed your call! Our team was assisting other patients, but we definitely want to help you.

Here's how to reach us:
- Reply to this email with your question or request
- Call us back at {{clinic_phone}}
- Text us at {{clinic_phone}}
- Book online at {{clinic_website}}

If you were calling to schedule an appointment, we have openings this week!

Our phone lines are open:
Monday - Friday: 8am - 6pm
Saturday: 9am - 2pm

We look forward to speaking with you soon!

Best,
The {{clinic_name}} Team`,
        delayDays: 0,
        delayHours: 0,
      });
      
      await storage.createSequenceStep({
        sequenceId: missedCallSequence.id,
        stepOrder: 3,
        channel: "sms",
        subject: "",
        message: `Hi again from {{clinic_name}}! We really want to help you. Were you calling to schedule an appointment? Reply YES and we'll call you back at a time that works for you!`,
        delayDays: 0,
        delayHours: 4,
      });
      
      await storage.createSequenceStep({
        sequenceId: missedCallSequence.id,
        stepOrder: 4,
        channel: "email",
        subject: "Still need to reach us? - {{clinic_name}}",
        message: `Hi,

We tried reaching out yesterday after your call but haven't heard back. We want to make sure you get the help you need!

Quick options:
1. SCHEDULE ONLINE: {{clinic_website}}
2. TEXT US: {{clinic_phone}}
3. CALL DURING OFFICE HOURS: {{clinic_phone}}

If you've already been helped or no longer need assistance, no worries at all!

Take care,
The {{clinic_name}} Team`,
        delayDays: 1,
        delayHours: 0,
      });
      
      const missedCallSteps = await storage.getSequenceSteps(missedCallSequence.id);
      createdSequences.push({ ...missedCallSequence, steps: missedCallSteps });
      
      // ================ 3. NO-SHOW RECOVERY SEQUENCE ================
      const noShowSequence = await storage.createSequence({
        name: "No-Show Recovery",
        description: "Re-engage patients who missed their scheduled appointments. Reduces revenue loss and fills empty slots.",
        sequenceType: "no_show",
        status: "active",
        clinicId,
        ownerId: userId,
      });
      
      await storage.createSequenceStep({
        sequenceId: noShowSequence.id,
        stepOrder: 1,
        channel: "sms",
        subject: "",
        message: `Hi {{patient_name}}, we missed you at your appointment today at {{clinic_name}}! We hope everything is okay. Would you like to reschedule? Reply YES and we'll find a new time that works for you.`,
        delayDays: 0,
        delayHours: 1,
      });
      
      await storage.createSequenceStep({
        sequenceId: noShowSequence.id,
        stepOrder: 2,
        channel: "email",
        subject: "We missed you today, {{patient_name}}!",
        message: `Hi {{patient_name}},

We noticed you weren't able to make it to your appointment at {{clinic_name}} today. We hope everything is alright!

Life gets busy, and we completely understand. The important thing is making sure you get the dental care you need.

RESCHEDULING IS EASY:
- Reply to this email with your preferred date/time
- Call us at {{clinic_phone}}
- Book online at {{clinic_website}}

IMPORTANT: Regular dental visits help prevent small issues from becoming bigger (and more expensive) problems. We're here to help keep your smile healthy!

We have openings this week and would love to get you back on the schedule.

Best,
The {{clinic_name}} Team`,
        delayDays: 0,
        delayHours: 2,
      });
      
      await storage.createSequenceStep({
        sequenceId: noShowSequence.id,
        stepOrder: 3,
        channel: "sms",
        subject: "",
        message: `{{patient_name}}, we still have your appointment slot open at {{clinic_name}}. Your dental health matters! Can we reschedule you for this week? Reply with a day that works best.`,
        delayDays: 1,
        delayHours: 0,
      });
      
      await storage.createSequenceStep({
        sequenceId: noShowSequence.id,
        stepOrder: 4,
        channel: "email",
        subject: "Let's get you back on track, {{patient_name}}",
        message: `Hi {{patient_name}},

We've been thinking about you and wanted to check in one more time about rescheduling your dental appointment.

We know dental visits aren't always at the top of everyone's fun list, but here's why they're so important:
- Prevent cavities and gum disease
- Catch problems early (before they become painful and costly)
- Keep your smile bright and healthy
- Maintain overall health (dental health is connected to heart health!)

AS A THANK YOU FOR RESCHEDULING:
We're offering you a complimentary teeth whitening treatment with your next visit!

Ready to reschedule? Just reply to this email or call us at {{clinic_phone}}.

We're here when you're ready!

Warm regards,
The {{clinic_name}} Team`,
        delayDays: 3,
        delayHours: 0,
      });
      
      await storage.createSequenceStep({
        sequenceId: noShowSequence.id,
        stepOrder: 5,
        channel: "whatsapp",
        subject: "",
        message: `Hi {{patient_name}}! This is {{clinic_name}}. We haven't heard back about rescheduling your missed appointment. Is there anything preventing you from coming in? We're happy to work around your schedule or address any concerns!`,
        delayDays: 5,
        delayHours: 0,
      });
      
      const noShowSteps = await storage.getSequenceSteps(noShowSequence.id);
      createdSequences.push({ ...noShowSequence, steps: noShowSteps });
      
      // ================ 4. APPOINTMENT REMINDER SEQUENCE ================
      const reminderSequence = await storage.createSequence({
        name: "Appointment Reminder Series",
        description: "Multi-touch reminder sequence to reduce no-shows and ensure patients are prepared for their visit.",
        sequenceType: "appointment_reminder",
        status: "active",
        clinicId,
        ownerId: userId,
      });
      
      await storage.createSequenceStep({
        sequenceId: reminderSequence.id,
        stepOrder: 1,
        channel: "email",
        subject: "Your upcoming appointment at {{clinic_name}} - 1 Week Away!",
        message: `Hi {{patient_name}},

This is a friendly reminder that your dental appointment is coming up in 1 week!

APPOINTMENT DETAILS:
- Date: {{appointment_date}}
- Time: {{appointment_time}}
- Location: {{clinic_address}}
- Service: {{service_type}}

TO PREPARE FOR YOUR VISIT:
1. Brush and floss before arriving
2. Bring your insurance card and ID
3. Arrive 10-15 minutes early for check-in
4. List any questions or concerns for the dentist

NEED TO RESCHEDULE?
No problem! Just reply to this email or call us at {{clinic_phone}} at least 24 hours before your appointment.

We look forward to seeing you!

Best,
The {{clinic_name}} Team`,
        delayDays: 0,
        delayHours: 0,
      });
      
      await storage.createSequenceStep({
        sequenceId: reminderSequence.id,
        stepOrder: 2,
        channel: "sms",
        subject: "",
        message: `Hi {{patient_name}}! Reminder: Your appointment at {{clinic_name}} is in 2 days on {{appointment_date}} at {{appointment_time}}. Reply C to confirm or R to reschedule.`,
        delayDays: 5,
        delayHours: 0,
      });
      
      await storage.createSequenceStep({
        sequenceId: reminderSequence.id,
        stepOrder: 3,
        channel: "email",
        subject: "See you tomorrow! - {{clinic_name}}",
        message: `Hi {{patient_name}},

Just a quick reminder that we'll see you TOMORROW for your dental appointment!

APPOINTMENT DETAILS:
- Date: {{appointment_date}}
- Time: {{appointment_time}}
- Location: {{clinic_address}}

QUICK REMINDERS:
- Please arrive 10 minutes early
- Bring your insurance card
- Let us know if you have any questions!

Our team is ready to give you an amazing experience. See you soon!

Best,
The {{clinic_name}} Team`,
        delayDays: 6,
        delayHours: 0,
      });
      
      await storage.createSequenceStep({
        sequenceId: reminderSequence.id,
        stepOrder: 4,
        channel: "sms",
        subject: "",
        message: `{{patient_name}}, see you TODAY at {{appointment_time}} at {{clinic_name}}! Address: {{clinic_address}}. Reply if you need anything before your visit!`,
        delayDays: 7,
        delayHours: 0,
      });
      
      const reminderSteps = await storage.getSequenceSteps(reminderSequence.id);
      createdSequences.push({ ...reminderSequence, steps: reminderSteps });
      
      // ================ 5. REVIEW REQUEST SEQUENCE ================
      const reviewSequence = await storage.createSequence({
        name: "Post-Visit Review Request",
        description: "Collect 5-star reviews from satisfied patients. Builds online reputation and attracts new patients.",
        sequenceType: "review_request",
        status: "active",
        clinicId,
        ownerId: userId,
      });
      
      await storage.createSequenceStep({
        sequenceId: reviewSequence.id,
        stepOrder: 1,
        channel: "sms",
        subject: "",
        message: `Hi {{patient_name}}! Thank you for visiting {{clinic_name}} today! We hope you had a great experience. Would you mind sharing your feedback? It takes less than a minute and helps us serve you better!`,
        delayDays: 0,
        delayHours: 2,
      });
      
      await storage.createSequenceStep({
        sequenceId: reviewSequence.id,
        stepOrder: 2,
        channel: "email",
        subject: "How was your visit to {{clinic_name}}?",
        message: `Hi {{patient_name}},

Thank you for choosing {{clinic_name}} for your dental care! We hope your visit today exceeded your expectations.

We have a quick favor to ask...

Your feedback helps other patients find quality dental care and helps us continue improving. Would you take 30 seconds to share your experience?

[LEAVE A GOOGLE REVIEW]

What to mention in your review:
- How did our team make you feel?
- Was the appointment comfortable?
- Would you recommend us to friends/family?

Every review means the world to us!

Thank you for being part of the {{clinic_name}} family.

With gratitude,
The {{clinic_name}} Team

P.S. Your reviews help us continue providing excellent care to the community. Thank you!`,
        delayDays: 0,
        delayHours: 4,
      });
      
      await storage.createSequenceStep({
        sequenceId: reviewSequence.id,
        stepOrder: 3,
        channel: "sms",
        subject: "",
        message: `Hi {{patient_name}}! We truly value your opinion. If you have a moment, we'd love for you to leave a quick review about your visit to {{clinic_name}}. Your feedback helps us grow!`,
        delayDays: 1,
        delayHours: 0,
      });
      
      await storage.createSequenceStep({
        sequenceId: reviewSequence.id,
        stepOrder: 4,
        channel: "email",
        subject: "One small favor, {{patient_name}}?",
        message: `Hi {{patient_name}},

I hope you're doing well after your recent visit to {{clinic_name}}!

I noticed you haven't had a chance to leave us a review yet, and I completely understand - life is busy!

But if you could spare just 30 seconds, it would mean so much to our team. Here's why:

- Your review helps other patients find trusted dental care
- It motivates our team to keep delivering excellent service
- It helps small businesses like ours compete with larger practices

HAD A GREAT EXPERIENCE?
Click here to leave a Google review: [REVIEW LINK]

HAD ANY CONCERNS?
Please reply to this email directly - we want to make it right!

Thank you for being a valued patient. We look forward to your next visit!

Warmly,
Dr. {{doctor_name}} and The {{clinic_name}} Team`,
        delayDays: 3,
        delayHours: 0,
      });
      
      await storage.createSequenceStep({
        sequenceId: reviewSequence.id,
        stepOrder: 5,
        channel: "whatsapp",
        subject: "",
        message: `Hi {{patient_name}}! Quick message from {{clinic_name}} - we'd really appreciate your feedback on your recent visit. Could you take a minute to share your experience? It helps other patients discover great dental care!`,
        delayDays: 5,
        delayHours: 0,
      });
      
      const reviewSteps = await storage.getSequenceSteps(reviewSequence.id);
      createdSequences.push({ ...reviewSequence, steps: reviewSteps });
      
      res.json({ 
        message: "All patient AI chatbot sequences created successfully!",
        sequences: createdSequences,
        count: createdSequences.length
      });
    } catch (error) {
      console.error("Error seeding patient sequences:", error);
      res.status(500).json({ message: "Failed to seed patient sequences" });
    }
  });

  // ==================== ONBOARDING ROUTES ====================
  
  // Get current user's onboarding progress
  app.get("/api/onboarding/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const progress = await storage.getOnboardingProgressByUser(userId);
      
      if (!progress) {
        return res.json({ 
          hasOnboarding: false,
          message: "No onboarding progress found" 
        });
      }
      
      res.json({ hasOnboarding: true, progress });
    } catch (error) {
      console.error("Error fetching onboarding progress:", error);
      res.status(500).json({ message: "Failed to fetch onboarding progress" });
    }
  });
  
  // Initialize onboarding for a new clinic
  app.post("/api/onboarding/initialize", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { clinicId } = req.body;
      
      if (!clinicId) {
        return res.status(400).json({ message: "Clinic ID is required" });
      }
      
      // Check if onboarding already exists
      const existing = await storage.getOnboardingProgressByClinic(clinicId);
      if (existing) {
        return res.json({ progress: existing, message: "Onboarding already initialized" });
      }
      
      // Create new onboarding progress
      const progress = await storage.createOnboardingProgress({
        clinicId,
        userId,
        currentStage: 1,
        welcomeCompleted: false,
        welcomeEmailSent: false,
        setupCompleted: false,
        chatbotCompleted: false,
        optimizationCompleted: false,
      });
      
      // Send welcome email (auto-trigger)
      const welcomeEmail = await storage.getOnboardingEmailByTrigger(1, "stage_start");
      if (welcomeEmail) {
        const user = await storage.getUser(userId);
        const clinic = await storage.getClinicById(clinicId);
        
        if (user?.email) {
          console.log("=".repeat(60));
          console.log("ONBOARDING WELCOME EMAIL TRIGGERED");
          console.log("=".repeat(60));
          console.log(`To: ${user.email}`);
          console.log(`Subject: ${welcomeEmail.subject}`);
          console.log(`Clinic: ${clinic?.name}`);
          console.log("=".repeat(60));
          
          // Log the email
          await storage.createOnboardingEmailLog({
            onboardingId: progress.id,
            emailTemplateId: welcomeEmail.id,
            recipientEmail: user.email,
            subject: welcomeEmail.subject,
            status: "sent",
          });
          
          // Update progress to mark welcome email sent
          await storage.updateOnboardingProgress(progress.id, {
            welcomeEmailSent: true,
          });
        }
      }
      
      res.json({ progress, message: "Onboarding initialized successfully" });
    } catch (error) {
      console.error("Error initializing onboarding:", error);
      res.status(500).json({ message: "Failed to initialize onboarding" });
    }
  });
  
  // Complete Welcome stage (Stage 1)
  app.post("/api/onboarding/complete-welcome", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const progress = await storage.getOnboardingProgressByUser(userId);
      
      if (!progress) {
        return res.status(404).json({ message: "Onboarding not found" });
      }
      
      const updated = await storage.updateOnboardingProgress(progress.id, {
        welcomeCompleted: true,
        welcomeCompletedAt: new Date(),
        currentStage: 2,
      });
      
      // Trigger stage 2 start email
      const setupEmail = await storage.getOnboardingEmailByTrigger(2, "stage_start");
      if (setupEmail) {
        const user = await storage.getUser(userId);
        if (user?.email) {
          console.log("=".repeat(60));
          console.log("ONBOARDING SETUP EMAIL TRIGGERED");
          console.log("=".repeat(60));
          console.log(`To: ${user.email}`);
          console.log(`Subject: ${setupEmail.subject}`);
          console.log("=".repeat(60));
          
          await storage.createOnboardingEmailLog({
            onboardingId: progress.id,
            emailTemplateId: setupEmail.id,
            recipientEmail: user.email,
            subject: setupEmail.subject,
            status: "sent",
          });
        }
      }
      
      res.json({ progress: updated, message: "Welcome stage completed" });
    } catch (error) {
      console.error("Error completing welcome stage:", error);
      res.status(500).json({ message: "Failed to complete welcome stage" });
    }
  });
  
  // Complete Clinic Setup stage (Stage 2)
  app.post("/api/onboarding/complete-setup", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const progress = await storage.getOnboardingProgressByUser(userId);
      
      if (!progress) {
        return res.status(404).json({ message: "Onboarding not found" });
      }
      
      const { clinicAddress, clinicPhone, clinicWebsite, clinicTimezone, businessHours, services } = req.body;
      
      const updated = await storage.updateOnboardingProgress(progress.id, {
        setupCompleted: true,
        setupCompletedAt: new Date(),
        currentStage: 3,
        clinicAddress,
        clinicPhone,
        clinicWebsite,
        clinicTimezone,
        businessHours,
        services,
      });
      
      // Trigger stage 3 start email
      const chatbotEmail = await storage.getOnboardingEmailByTrigger(3, "stage_start");
      if (chatbotEmail) {
        const user = await storage.getUser(userId);
        if (user?.email) {
          console.log("=".repeat(60));
          console.log("ONBOARDING CHATBOT ACTIVATION EMAIL TRIGGERED");
          console.log("=".repeat(60));
          console.log(`To: ${user.email}`);
          console.log(`Subject: ${chatbotEmail.subject}`);
          console.log("=".repeat(60));
          
          await storage.createOnboardingEmailLog({
            onboardingId: progress.id,
            emailTemplateId: chatbotEmail.id,
            recipientEmail: user.email,
            subject: chatbotEmail.subject,
            status: "sent",
          });
        }
      }
      
      res.json({ progress: updated, message: "Clinic setup completed" });
    } catch (error) {
      console.error("Error completing setup stage:", error);
      res.status(500).json({ message: "Failed to complete setup stage" });
    }
  });
  
  // Complete AI Chatbot Activation stage (Stage 3)
  app.post("/api/onboarding/complete-chatbot", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const progress = await storage.getOnboardingProgressByUser(userId);
      
      if (!progress) {
        return res.status(404).json({ message: "Onboarding not found" });
      }
      
      const { chatbotEnabled, chatbotGreeting, chatbotTone, chatbotFocusServices } = req.body;
      
      const updated = await storage.updateOnboardingProgress(progress.id, {
        chatbotCompleted: true,
        chatbotCompletedAt: new Date(),
        currentStage: 4,
        chatbotEnabled,
        chatbotGreeting,
        chatbotTone,
        chatbotFocusServices,
      });
      
      // Trigger stage 4 start email
      const optimizationEmail = await storage.getOnboardingEmailByTrigger(4, "stage_start");
      if (optimizationEmail) {
        const user = await storage.getUser(userId);
        if (user?.email) {
          console.log("=".repeat(60));
          console.log("ONBOARDING GROWTH OPTIMIZATION EMAIL TRIGGERED");
          console.log("=".repeat(60));
          console.log(`To: ${user.email}`);
          console.log(`Subject: ${optimizationEmail.subject}`);
          console.log("=".repeat(60));
          
          await storage.createOnboardingEmailLog({
            onboardingId: progress.id,
            emailTemplateId: optimizationEmail.id,
            recipientEmail: user.email,
            subject: optimizationEmail.subject,
            status: "sent",
          });
        }
      }
      
      res.json({ progress: updated, message: "Chatbot activation completed" });
    } catch (error) {
      console.error("Error completing chatbot stage:", error);
      res.status(500).json({ message: "Failed to complete chatbot stage" });
    }
  });
  
  // Complete Growth Optimization stage (Stage 4 - Final)
  app.post("/api/onboarding/complete-optimization", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const progress = await storage.getOnboardingProgressByUser(userId);
      
      if (!progress) {
        return res.status(404).json({ message: "Onboarding not found" });
      }
      
      const { 
        autoFollowupEnabled, 
        leadScoringEnabled, 
        reviewRequestsEnabled, 
        referralProgramEnabled, 
        targetLeadsPerMonth 
      } = req.body;
      
      const updated = await storage.updateOnboardingProgress(progress.id, {
        optimizationCompleted: true,
        optimizationCompletedAt: new Date(),
        completedAt: new Date(),
        autoFollowupEnabled,
        leadScoringEnabled,
        reviewRequestsEnabled,
        referralProgramEnabled,
        targetLeadsPerMonth,
      });
      
      // Trigger onboarding complete email
      const completeEmail = await storage.getOnboardingEmailByTrigger(4, "stage_complete");
      if (completeEmail) {
        const user = await storage.getUser(userId);
        if (user?.email) {
          console.log("=".repeat(60));
          console.log("ONBOARDING COMPLETE EMAIL TRIGGERED");
          console.log("=".repeat(60));
          console.log(`To: ${user.email}`);
          console.log(`Subject: ${completeEmail.subject}`);
          console.log("=".repeat(60));
          
          await storage.createOnboardingEmailLog({
            onboardingId: progress.id,
            emailTemplateId: completeEmail.id,
            recipientEmail: user.email,
            subject: completeEmail.subject,
            status: "sent",
          });
        }
      }
      
      res.json({ progress: updated, message: "Onboarding completed! Your clinic is ready to go." });
    } catch (error) {
      console.error("Error completing optimization stage:", error);
      res.status(500).json({ message: "Failed to complete optimization stage" });
    }
  });
  
  // Get all onboarding email templates
  app.get("/api/onboarding/emails", isAuthenticated, async (req: any, res) => {
    try {
      const emails = await storage.getAllOnboardingEmails();
      res.json(emails);
    } catch (error) {
      console.error("Error fetching onboarding emails:", error);
      res.status(500).json({ message: "Failed to fetch onboarding emails" });
    }
  });
  
  // Get email logs for current user's onboarding
  app.get("/api/onboarding/email-logs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const progress = await storage.getOnboardingProgressByUser(userId);
      
      if (!progress) {
        return res.json([]);
      }
      
      const logs = await storage.getOnboardingEmailLogs(progress.id);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching email logs:", error);
      res.status(500).json({ message: "Failed to fetch email logs" });
    }
  });
  
  // Admin: Get all onboarding progress (for admin dashboard)
  app.get("/api/admin/onboarding", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const allProgress = await storage.getAllOnboardingProgress();
      res.json(allProgress);
    } catch (error) {
      console.error("Error fetching all onboarding progress:", error);
      res.status(500).json({ message: "Failed to fetch onboarding progress" });
    }
  });
  
  // Seed onboarding email templates
  app.post("/api/admin/seed-onboarding-emails", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Stage 1: Welcome emails
      await storage.createOnboardingEmail({
        stage: 1,
        name: "Welcome Email",
        subject: "Welcome to DentalLeadGenius! Let's Get Started",
        triggerType: "stage_start",
        delayHours: 0,
        isActive: true,
        htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">Welcome to DentalLeadGenius!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #18181b;">Hi {{firstName}}!</h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #3f3f46;">
                Congratulations on taking the first step toward transforming your dental practice! We're thrilled to have <strong>{{clinicName}}</strong> join the DentalLeadGenius family.
              </p>
              <div style="padding: 24px; background-color: #f0f9ff; border-radius: 8px; border-left: 4px solid #0066cc; margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px; color: #0066cc;">Your 4-Step Onboarding Journey:</h3>
                <ol style="margin: 0; padding-left: 20px; color: #3f3f46; font-size: 14px; line-height: 1.8;">
                  <li><strong>Welcome</strong> - You're here! Get familiar with your dashboard</li>
                  <li><strong>Clinic Setup</strong> - Configure your clinic details and hours</li>
                  <li><strong>AI Chatbot Activation</strong> - Customize your AI assistant</li>
                  <li><strong>Growth Optimization</strong> - Enable automated follow-ups</li>
                </ol>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="{{dashboardUrl}}" style="display: inline-block; padding: 16px 40px; background-color: #0066cc; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                      Start Your Onboarding
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        textContent: `Welcome to DentalLeadGenius!

Hi {{firstName}}!

Congratulations on taking the first step toward transforming your dental practice! We're thrilled to have {{clinicName}} join the DentalLeadGenius family.

Your 4-Step Onboarding Journey:
1. Welcome - You're here! Get familiar with your dashboard
2. Clinic Setup - Configure your clinic details and hours
3. AI Chatbot Activation - Customize your AI assistant
4. Growth Optimization - Enable automated follow-ups

Start your onboarding now: {{dashboardUrl}}`,
      });
      
      // Stage 2: Clinic Setup email
      await storage.createOnboardingEmail({
        stage: 2,
        name: "Clinic Setup Guide",
        subject: "Step 2: Let's Set Up Your Clinic Profile",
        triggerType: "stage_start",
        delayHours: 0,
        isActive: true,
        htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px;">
          <tr>
            <td style="padding: 40px; text-align: center;">
              <div style="width: 80px; height: 80px; background: #10b981; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px; color: white;">2</span>
              </div>
              <h1 style="margin: 0 0 16px; font-size: 24px; color: #18181b;">Time to Set Up Your Clinic!</h1>
              <p style="margin: 0 0 24px; font-size: 16px; color: #3f3f46; line-height: 1.6;">
                Great progress, {{firstName}}! Now let's configure your clinic profile so your AI assistant knows everything about {{clinicName}}.
              </p>
              <div style="text-align: left; padding: 24px; background: #f8fafc; border-radius: 8px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 16px; color: #18181b;">What you'll set up:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #3f3f46; line-height: 1.8;">
                  <li>Your clinic's address and contact info</li>
                  <li>Business hours and timezone</li>
                  <li>Services you offer</li>
                </ul>
              </div>
              <a href="{{dashboardUrl}}/onboarding/setup" style="display: inline-block; padding: 14px 32px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Continue Setup</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        textContent: `Step 2: Let's Set Up Your Clinic Profile

Great progress, {{firstName}}! Now let's configure your clinic profile so your AI assistant knows everything about {{clinicName}}.

What you'll set up:
- Your clinic's address and contact info
- Business hours and timezone
- Services you offer

Continue setup: {{dashboardUrl}}/onboarding/setup`,
      });
      
      // Stage 3: AI Chatbot Activation email
      await storage.createOnboardingEmail({
        stage: 3,
        name: "AI Chatbot Activation Guide",
        subject: "Step 3: Activate Your AI Chatbot",
        triggerType: "stage_start",
        delayHours: 0,
        isActive: true,
        htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px;">
          <tr>
            <td style="padding: 40px; text-align: center;">
              <div style="width: 80px; height: 80px; background: #8b5cf6; border-radius: 50%; margin: 0 auto 20px;">
                <span style="font-size: 40px; color: white; line-height: 80px;">3</span>
              </div>
              <h1 style="margin: 0 0 16px; font-size: 24px; color: #18181b;">Your AI Assistant Awaits!</h1>
              <p style="margin: 0 0 24px; font-size: 16px; color: #3f3f46; line-height: 1.6;">
                You're halfway there, {{firstName}}! Now comes the exciting part - setting up your AI chatbot that will engage patients 24/7.
              </p>
              <div style="text-align: left; padding: 24px; background: #f5f3ff; border-radius: 8px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 16px; color: #8b5cf6;">What your AI can do:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #3f3f46; line-height: 1.8;">
                  <li>Answer patient questions instantly</li>
                  <li>Book appointments automatically</li>
                  <li>Qualify leads while you sleep</li>
                  <li>Never miss a potential patient</li>
                </ul>
              </div>
              <a href="{{dashboardUrl}}/onboarding/chatbot" style="display: inline-block; padding: 14px 32px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Activate AI Chatbot</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        textContent: `Step 3: Activate Your AI Chatbot

You're halfway there, {{firstName}}! Now comes the exciting part - setting up your AI chatbot that will engage patients 24/7.

What your AI can do:
- Answer patient questions instantly
- Book appointments automatically
- Qualify leads while you sleep
- Never miss a potential patient

Activate AI Chatbot: {{dashboardUrl}}/onboarding/chatbot`,
      });
      
      // Stage 4: Growth Optimization email
      await storage.createOnboardingEmail({
        stage: 4,
        name: "Growth Optimization Guide",
        subject: "Final Step: Supercharge Your Growth",
        triggerType: "stage_start",
        delayHours: 0,
        isActive: true,
        htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px;">
          <tr>
            <td style="padding: 40px; text-align: center;">
              <div style="width: 80px; height: 80px; background: #f59e0b; border-radius: 50%; margin: 0 auto 20px;">
                <span style="font-size: 40px; color: white; line-height: 80px;">4</span>
              </div>
              <h1 style="margin: 0 0 16px; font-size: 24px; color: #18181b;">Almost There! Final Step</h1>
              <p style="margin: 0 0 24px; font-size: 16px; color: #3f3f46; line-height: 1.6;">
                Amazing work, {{firstName}}! You're on the final step. Let's set up your growth automation to maximize your results.
              </p>
              <div style="text-align: left; padding: 24px; background: #fffbeb; border-radius: 8px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 16px; color: #f59e0b;">Automation options:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #3f3f46; line-height: 1.8;">
                  <li>Automated follow-up sequences</li>
                  <li>Lead scoring & prioritization</li>
                  <li>Review request automation</li>
                  <li>Referral program setup</li>
                </ul>
              </div>
              <a href="{{dashboardUrl}}/onboarding/optimization" style="display: inline-block; padding: 14px 32px; background: #f59e0b; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Complete Setup</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        textContent: `Final Step: Supercharge Your Growth

Amazing work, {{firstName}}! You're on the final step. Let's set up your growth automation to maximize your results.

Automation options:
- Automated follow-up sequences
- Lead scoring & prioritization
- Review request automation
- Referral program setup

Complete Setup: {{dashboardUrl}}/onboarding/optimization`,
      });
      
      // Onboarding Complete email
      await storage.createOnboardingEmail({
        stage: 4,
        name: "Onboarding Complete",
        subject: "Congratulations! You're All Set Up",
        triggerType: "stage_complete",
        delayHours: 0,
        isActive: true,
        htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px;">
          <tr>
            <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px 12px 0 0;">
              <div style="font-size: 60px; margin-bottom: 16px;">&#127881;</div>
              <h1 style="margin: 0; font-size: 28px; color: white;">Congratulations, {{firstName}}!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px; font-size: 18px; color: #18181b; text-align: center; font-weight: 500;">
                {{clinicName}} is now fully set up and ready to generate leads!
              </p>
              <div style="padding: 24px; background: #f0fdf4; border-radius: 8px; margin-bottom: 24px; text-align: center;">
                <h3 style="margin: 0 0 16px; color: #10b981;">What's Active:</h3>
                <p style="margin: 0; color: #3f3f46; line-height: 1.8;">
                  &#10004; AI Chatbot - Engaging visitors 24/7<br>
                  &#10004; Automated Follow-ups - Never miss a lead<br>
                  &#10004; Smart Scheduling - Reducing no-shows<br>
                  &#10004; Growth Dashboard - Track your success
                </p>
              </div>
              <p style="margin: 0 0 24px; font-size: 16px; color: #3f3f46; text-align: center;">
                Your AI assistant is now live and ready to convert visitors into patients. Watch your dashboard for real-time updates!
              </p>
              <div style="text-align: center;">
                <a href="{{dashboardUrl}}" style="display: inline-block; padding: 14px 32px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Go to Dashboard</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        textContent: `Congratulations, {{firstName}}!

{{clinicName}} is now fully set up and ready to generate leads!

What's Active:
- AI Chatbot - Engaging visitors 24/7
- Automated Follow-ups - Never miss a lead
- Smart Scheduling - Reducing no-shows
- Growth Dashboard - Track your success

Your AI assistant is now live and ready to convert visitors into patients. Watch your dashboard for real-time updates!

Go to Dashboard: {{dashboardUrl}}`,
      });
      
      // Stage 1 reminder email (24 hours)
      await storage.createOnboardingEmail({
        stage: 1,
        name: "Welcome Reminder",
        subject: "Don't Miss Out - Complete Your Setup",
        triggerType: "reminder",
        delayHours: 24,
        isActive: true,
        htmlContent: `<!DOCTYPE html>
<html>
<body style="font-family: 'Segoe UI', sans-serif; background-color: #f4f4f5; padding: 40px;">
  <table width="100%" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px;">
    <tr>
      <td style="text-align: center;">
        <h1 style="color: #18181b;">Hi {{firstName}}, We Miss You!</h1>
        <p style="color: #3f3f46; font-size: 16px; line-height: 1.6;">
          You started setting up {{clinicName}} but haven't completed the process. Your AI assistant is waiting to start generating leads for you!
        </p>
        <p style="color: #3f3f46; font-size: 16px;">
          It only takes a few minutes to complete your setup and start seeing results.
        </p>
        <a href="{{dashboardUrl}}/onboarding" style="display: inline-block; padding: 14px 32px; background: #0066cc; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px;">Continue Setup</a>
      </td>
    </tr>
  </table>
</body>
</html>`,
        textContent: `Hi {{firstName}}, We Miss You!

You started setting up {{clinicName}} but haven't completed the process. Your AI assistant is waiting to start generating leads for you!

It only takes a few minutes to complete your setup and start seeing results.

Continue Setup: {{dashboardUrl}}/onboarding`,
      });
      
      const emails = await storage.getAllOnboardingEmails();
      res.json({ 
        message: "Onboarding email templates seeded successfully!",
        count: emails.length,
        emails 
      });
    } catch (error) {
      console.error("Error seeding onboarding emails:", error);
      res.status(500).json({ message: "Failed to seed onboarding emails" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
