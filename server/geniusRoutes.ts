/**
 * GENIUS System API Routes
 * 
 * Provides endpoints for:
 * - Lead import (HELPER)
 * - Engine control (start/stop/pause)
 * - Reporting and statistics
 * - Budget monitoring
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import {
  importGeniusLead,
  bulkImportGeniusLeads,
  startGeniusEngine,
  stopGeniusEngine,
  pauseGeniusEngine,
  resumeGeniusEngine,
  runGeniusCycle,
  getGeniusStatus,
  getGeniusStats,
  generateDailyReport,
  getPhase2Stats,
  initializePhase2,
  runDailyOptimization,
  updateLeadStatuses,
  GENIUS_CONFIG,
} from "./geniusEngine";
import {
  startAutonomousMode,
  stopAutonomousMode,
  getAutonomousStatus,
  generateAutonomousReport,
} from "./geniusAutonomous";
import { 
  geniusTemplateVariants, 
  geniusSendWindows, 
  geniusDomainHealth,
  geniusResponseQueue,
} from "@shared/schema";
import { db } from "./db";
import { geniusLeads, geniusEmailSends } from "@shared/schema";
import { desc, sql } from "drizzle-orm";

const router = Router();

// ============================================================================
// MIDDLEWARE - Authentication Check
// ============================================================================

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated?.() || !req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated?.() || !req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (!(req.user as any).isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// ============================================================================
// LEAD IMPORT ENDPOINTS (HELPER Agent)
// ============================================================================

// Schema for single lead import
const singleLeadSchema = z.object({
  email: z.string().email(),
  dentistName: z.string().optional(),
  clinicName: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
});

// Schema for bulk import
const bulkImportSchema = z.object({
  leads: z.array(singleLeadSchema).min(1).max(500),
});

/**
 * POST /api/genius/import-lead
 * Import a single lead into the GENIUS system
 */
router.post("/import-lead", async (req: Request, res: Response) => {
  try {
    // Validate API key for external imports
    const apiKey = req.headers["x-api-key"] || req.headers["authorization"]?.replace("Bearer ", "");
    const expectedKey = process.env.IMPORT_API_KEY;
    
    // Allow authenticated users OR valid API key
    const isAuthenticated = req.isAuthenticated?.() && req.user;
    const hasValidApiKey = expectedKey && apiKey === expectedKey;
    
    if (!isAuthenticated && !hasValidApiKey) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const parsed = singleLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: parsed.error.issues,
      });
    }

    const result = await importGeniusLead(parsed.data);
    
    if (result.success) {
      return res.status(result.existing ? 200 : 201).json({
        success: true,
        leadId: result.leadId,
        existing: result.existing,
        message: result.existing 
          ? "Lead already exists in system" 
          : "Lead imported successfully",
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Lead import error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/genius/import-leads
 * Bulk import leads into the GENIUS system
 */
router.post("/import-leads", async (req: Request, res: Response) => {
  try {
    // Validate API key for external imports
    const apiKey = req.headers["x-api-key"] || req.headers["authorization"]?.replace("Bearer ", "");
    const expectedKey = process.env.IMPORT_API_KEY;
    
    // Allow authenticated users OR valid API key
    const isAuthenticated = req.isAuthenticated?.() && req.user;
    const hasValidApiKey = expectedKey && apiKey === expectedKey;
    
    if (!isAuthenticated && !hasValidApiKey) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const parsed = bulkImportSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: parsed.error.issues,
      });
    }

    const result = await bulkImportGeniusLeads(parsed.data.leads);
    
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Bulk import error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ============================================================================
// ENGINE CONTROL ENDPOINTS (Admin only)
// ============================================================================

/**
 * GET /api/genius/status
 * Get current GENIUS system status
 */
router.get("/status", requireAuth, async (req: Request, res: Response) => {
  try {
    const status = await getGeniusStatus();
    return res.json(status);
  } catch (error) {
    console.error("Status error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/genius/stats
 * Get detailed GENIUS statistics
 */
router.get("/stats", requireAuth, async (req: Request, res: Response) => {
  try {
    const stats = await getGeniusStats();
    return res.json(stats);
  } catch (error) {
    console.error("Stats error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/genius/start
 * Start the GENIUS automation engine
 */
router.post("/start", requireAdmin, async (req: Request, res: Response) => {
  try {
    const intervalMinutes = req.body.intervalMinutes || 10;
    const result = startGeniusEngine(intervalMinutes);
    return res.json(result);
  } catch (error) {
    console.error("Start error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/genius/stop
 * Stop the GENIUS automation engine
 */
router.post("/stop", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = stopGeniusEngine();
    return res.json(result);
  } catch (error) {
    console.error("Stop error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/genius/pause
 * Pause the GENIUS engine
 */
router.post("/pause", requireAdmin, async (req: Request, res: Response) => {
  try {
    const reason = req.body.reason || "Manually paused by admin";
    const result = pauseGeniusEngine(reason);
    return res.json(result);
  } catch (error) {
    console.error("Pause error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/genius/resume
 * Resume the GENIUS engine
 */
router.post("/resume", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = resumeGeniusEngine();
    return res.json(result);
  } catch (error) {
    console.error("Resume error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/genius/run-now
 * Trigger a manual cycle
 */
router.post("/run-now", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await runGeniusCycle();
    return res.json(result);
  } catch (error) {
    console.error("Run-now error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ============================================================================
// REPORTING ENDPOINTS
// ============================================================================

/**
 * GET /api/genius/report
 * Generate daily report
 */
router.get("/report", requireAuth, async (req: Request, res: Response) => {
  try {
    const report = await generateDailyReport();
    return res.json(report);
  } catch (error) {
    console.error("Report error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/genius/leads
 * Get leads in the GENIUS system with pagination
 */
router.get("/leads", requireAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = (page - 1) * limit;

    const leads = await db.select()
      .from(geniusLeads)
      .orderBy(desc(geniusLeads.createdAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db.select({
      total: sql<number>`count(*)::int`,
    }).from(geniusLeads);

    return res.json({
      leads,
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Leads error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/genius/email-sends
 * Get recent email sends with pagination
 */
router.get("/email-sends", requireAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = (page - 1) * limit;

    const sends = await db.select()
      .from(geniusEmailSends)
      .orderBy(desc(geniusEmailSends.sentAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db.select({
      total: sql<number>`count(*)::int`,
    }).from(geniusEmailSends);

    return res.json({
      sends,
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Email sends error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/genius/config
 * Get GENIUS configuration (for UI display)
 */
router.get("/config", requireAuth, async (req: Request, res: Response) => {
  return res.json({
    dailyEmailLimit: GENIUS_CONFIG.DAILY_EMAIL_LIMIT,
    monthlyBudgetCents: GENIUS_CONFIG.MONTHLY_EMAIL_BUDGET_CENTS,
    weeklyReplitBudgetCents: GENIUS_CONFIG.WEEKLY_REPLIT_BUDGET_CENTS,
    pauseThresholdPercent: GENIUS_CONFIG.PAUSE_THRESHOLD_PERCENT,
    demoLink: GENIUS_CONFIG.DEMO_LINK,
    sequenceDays: GENIUS_CONFIG.SEQUENCE_DAYS,
  });
});

// ============================================================================
// PHASE-2 OPTIMIZATION ENDPOINTS
// ============================================================================

/**
 * GET /api/genius/phase2/status
 * Get PHASE-2 optimization status and statistics
 */
router.get("/phase2/status", requireAuth, async (req: Request, res: Response) => {
  try {
    const phase2Stats = await getPhase2Stats();
    const status = await getGeniusStatus();
    
    return res.json({
      phase2Active: true,
      engineStatus: status,
      optimization: phase2Stats,
    });
  } catch (error) {
    console.error("PHASE-2 status error:", error);
    return res.status(500).json({ error: "Failed to get PHASE-2 status" });
  }
});

/**
 * POST /api/genius/phase2/initialize
 * Initialize PHASE-2 optimization (template variants, send windows, etc.)
 */
router.post("/phase2/initialize", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await initializePhase2();
    return res.json({
      success: true,
      message: "PHASE-2 optimization initialized",
      ...result,
    });
  } catch (error) {
    console.error("PHASE-2 initialize error:", error);
    return res.status(500).json({ error: "Failed to initialize PHASE-2" });
  }
});

/**
 * POST /api/genius/phase2/optimize
 * Run daily optimization cycle (re-score leads, update hot/dead, analyze templates)
 */
router.post("/phase2/optimize", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await runDailyOptimization();
    return res.json({
      success: true,
      message: "Daily optimization complete",
      ...result,
    });
  } catch (error) {
    console.error("PHASE-2 optimize error:", error);
    return res.status(500).json({ error: "Failed to run optimization" });
  }
});

/**
 * POST /api/genius/phase2/update-lead-statuses
 * Update hot/dead lead statuses based on engagement
 */
router.post("/phase2/update-lead-statuses", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await updateLeadStatuses();
    return res.json({
      success: true,
      message: "Lead statuses updated",
      hotMarked: result.hotMarked,
      deadMarked: result.deadMarked,
    });
  } catch (error) {
    console.error("Update lead statuses error:", error);
    return res.status(500).json({ error: "Failed to update lead statuses" });
  }
});

/**
 * GET /api/genius/phase2/templates
 * Get all template variants with performance metrics
 */
router.get("/phase2/templates", requireAuth, async (req: Request, res: Response) => {
  try {
    const templates = await db.select()
      .from(geniusTemplateVariants)
      .orderBy(geniusTemplateVariants.day, geniusTemplateVariants.variantId);
    
    return res.json({ templates });
  } catch (error) {
    console.error("Templates error:", error);
    return res.status(500).json({ error: "Failed to get templates" });
  }
});

/**
 * GET /api/genius/phase2/send-windows
 * Get send window performance by timezone cluster
 */
router.get("/phase2/send-windows", requireAuth, async (req: Request, res: Response) => {
  try {
    const windows = await db.select()
      .from(geniusSendWindows)
      .orderBy(geniusSendWindows.timezoneCluster, geniusSendWindows.windowLabel);
    
    return res.json({ windows });
  } catch (error) {
    console.error("Send windows error:", error);
    return res.status(500).json({ error: "Failed to get send windows" });
  }
});

/**
 * GET /api/genius/phase2/domain-health
 * Get domain health and deliverability metrics
 */
router.get("/phase2/domain-health", requireAuth, async (req: Request, res: Response) => {
  try {
    const domains = await db.select().from(geniusDomainHealth);
    
    return res.json({ domains });
  } catch (error) {
    console.error("Domain health error:", error);
    return res.status(500).json({ error: "Failed to get domain health" });
  }
});

/**
 * GET /api/genius/phase2/response-queue
 * Get pending automated responses
 */
router.get("/phase2/response-queue", requireAuth, async (req: Request, res: Response) => {
  try {
    const queue = await db.select()
      .from(geniusResponseQueue)
      .orderBy(desc(geniusResponseQueue.priority), geniusResponseQueue.scheduledFor);
    
    return res.json({ queue });
  } catch (error) {
    console.error("Response queue error:", error);
    return res.status(500).json({ error: "Failed to get response queue" });
  }
});

/**
 * GET /api/genius/phase2/lead-segments
 * Get lead distribution by score and segment
 */
router.get("/phase2/lead-segments", requireAuth, async (req: Request, res: Response) => {
  try {
    // By segment
    const bySegment = await db.select({
      segment: geniusLeads.prioritySegment,
      count: sql<number>`count(*)::int`,
      avgScore: sql<number>`avg(lead_score)::numeric(3,1)`,
    })
      .from(geniusLeads)
      .groupBy(geniusLeads.prioritySegment);

    // By clinic type
    const byClinicType = await db.select({
      clinicType: geniusLeads.clinicType,
      count: sql<number>`count(*)::int`,
      avgScore: sql<number>`avg(lead_score)::numeric(3,1)`,
    })
      .from(geniusLeads)
      .groupBy(geniusLeads.clinicType);

    // Hot vs normal vs dead
    const byStatus = await db.select({
      isHot: geniusLeads.isHot,
      isDead: geniusLeads.isDead,
      count: sql<number>`count(*)::int`,
    })
      .from(geniusLeads)
      .groupBy(geniusLeads.isHot, geniusLeads.isDead);

    return res.json({
      bySegment,
      byClinicType,
      byStatus,
    });
  } catch (error) {
    console.error("Lead segments error:", error);
    return res.status(500).json({ error: "Failed to get lead segments" });
  }
});

// ============================================================================
// AUTONOMOUS MODE ENDPOINTS
// ============================================================================

/**
 * GET /api/genius/autonomous/status
 * Get autonomous mode status
 */
router.get("/autonomous/status", requireAuth, async (req: Request, res: Response) => {
  try {
    const status = await getAutonomousStatus();
    return res.json(status);
  } catch (error) {
    console.error("Autonomous status error:", error);
    return res.status(500).json({ error: "Failed to get autonomous status" });
  }
});

/**
 * POST /api/genius/autonomous/start
 * Start GENIUS in full autonomous mode with Phase-2 optimization
 */
router.post("/autonomous/start", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await startAutonomousMode();
    return res.json(result);
  } catch (error) {
    console.error("Autonomous start error:", error);
    return res.status(500).json({ error: "Failed to start autonomous mode" });
  }
});

/**
 * POST /api/genius/autonomous/stop
 * Stop autonomous mode
 */
router.post("/autonomous/stop", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await stopAutonomousMode();
    return res.json(result);
  } catch (error) {
    console.error("Autonomous stop error:", error);
    return res.status(500).json({ error: "Failed to stop autonomous mode" });
  }
});

/**
 * GET /api/genius/autonomous/report
 * Get comprehensive autonomous performance report
 */
router.get("/autonomous/report", requireAuth, async (req: Request, res: Response) => {
  try {
    const report = await generateAutonomousReport();
    return res.json(report);
  } catch (error) {
    console.error("Autonomous report error:", error);
    return res.status(500).json({ error: "Failed to generate report" });
  }
});

export default router;
