/**
 * GENIUS Autonomous Controller
 * 
 * Phase-2 Ultra Optimization Mode:
 * - Full automation with zero-touch scheduling
 * - Continuous improvement loops
 * - Daily performance reporting
 * - Error-recovery + retry logic
 * - Smart throttling to protect sender reputation
 */

import {
  startGeniusEngine,
  stopGeniusEngine,
  runGeniusCycle,
  getGeniusStatus,
  getGeniusStats,
  generateDailyReport,
  getPhase2Stats,
  GENIUS_CONFIG,
} from "./geniusEngine";
import {
  initializePhase2,
  runDailyOptimization,
  updateLeadStatuses,
} from "./geniusOptimizer";
import { db } from "./db";
import { geniusLeads, geniusEmailSends } from "@shared/schema";
import { sql, desc, eq, and, lt, isNull } from "drizzle-orm";

// ============================================================================
// AUTONOMOUS MODE CONFIGURATION
// ============================================================================

const AUTONOMOUS_CONFIG = {
  CYCLE_INTERVAL_MS: 2 * 60 * 1000,
  OPTIMIZATION_INTERVAL_MS: 6 * 60 * 60 * 1000,
  STATUS_UPDATE_INTERVAL_MS: 30 * 60 * 1000,
  REPORT_INTERVAL_MS: 24 * 60 * 60 * 1000,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 30 * 1000,
  LEAD_QUEUE_THRESHOLD: 500,
};

let autonomousInterval: NodeJS.Timeout | null = null;
let optimizationInterval: NodeJS.Timeout | null = null;
let statusUpdateInterval: NodeJS.Timeout | null = null;
let reportInterval: NodeJS.Timeout | null = null;
let isAutonomousMode = false;
let lastCycleError: string | null = null;
let consecutiveErrors = 0;

// ============================================================================
// AUTONOMOUS MODE CONTROL
// ============================================================================

/**
 * Start GENIUS in full autonomous mode with Phase-2 optimization
 */
export async function startAutonomousMode(): Promise<{
  success: boolean;
  message: string;
  status: any;
}> {
  if (isAutonomousMode) {
    return {
      success: false,
      message: "GENIUS is already running in autonomous mode",
      status: await getAutonomousStatus(),
    };
  }

  console.log("[GENIUS] Starting Phase-2 Ultra Optimization Mode...");

  try {
    await initializePhase2();
    console.log("[GENIUS] Phase-2 templates and send windows initialized");

    await runDailyOptimization();
    console.log("[GENIUS] Initial lead scoring complete");

    await startGeniusEngine();
    console.log("[GENIUS] Engine started");

    autonomousInterval = setInterval(runAutonomousCycle, AUTONOMOUS_CONFIG.CYCLE_INTERVAL_MS);

    optimizationInterval = setInterval(async () => {
      try {
        console.log("[GENIUS] Running scheduled optimization...");
        await runDailyOptimization();
        console.log("[GENIUS] Scheduled optimization complete");
      } catch (error) {
        console.error("[GENIUS] Optimization error:", error);
      }
    }, AUTONOMOUS_CONFIG.OPTIMIZATION_INTERVAL_MS);

    statusUpdateInterval = setInterval(async () => {
      try {
        await updateLeadStatuses();
        console.log("[GENIUS] Lead statuses updated (hot/dead)");
      } catch (error) {
        console.error("[GENIUS] Status update error:", error);
      }
    }, AUTONOMOUS_CONFIG.STATUS_UPDATE_INTERVAL_MS);

    reportInterval = setInterval(async () => {
      try {
        const report = await generateDailyReport();
        console.log("[GENIUS] Daily Report:", JSON.stringify(report, null, 2));
      } catch (error) {
        console.error("[GENIUS] Report generation error:", error);
      }
    }, AUTONOMOUS_CONFIG.REPORT_INTERVAL_MS);

    isAutonomousMode = true;
    consecutiveErrors = 0;
    lastCycleError = null;

    console.log("[GENIUS] Autonomous mode ACTIVE");
    console.log("[GENIUS] Configuration:");
    console.log(`  - Daily email limit: ${GENIUS_CONFIG.DAILY_EMAIL_LIMIT}`);
    console.log(`  - Monthly budget: $${GENIUS_CONFIG.MONTHLY_EMAIL_BUDGET_CENTS / 100}`);
    console.log(`  - Pause threshold: ${GENIUS_CONFIG.PAUSE_THRESHOLD_PERCENT}%`);
    console.log(`  - Cycle interval: ${AUTONOMOUS_CONFIG.CYCLE_INTERVAL_MS / 1000}s`);

    return {
      success: true,
      message: "GENIUS Phase-2 Ultra Optimization Mode activated",
      status: await getAutonomousStatus(),
    };
  } catch (error) {
    console.error("[GENIUS] Failed to start autonomous mode:", error);
    return {
      success: false,
      message: `Failed to start: ${error instanceof Error ? error.message : "Unknown error"}`,
      status: await getAutonomousStatus(),
    };
  }
}

/**
 * Stop autonomous mode
 */
export async function stopAutonomousMode(): Promise<{
  success: boolean;
  message: string;
}> {
  if (!isAutonomousMode) {
    return {
      success: false,
      message: "GENIUS is not running in autonomous mode",
    };
  }

  if (autonomousInterval) {
    clearInterval(autonomousInterval);
    autonomousInterval = null;
  }
  if (optimizationInterval) {
    clearInterval(optimizationInterval);
    optimizationInterval = null;
  }
  if (statusUpdateInterval) {
    clearInterval(statusUpdateInterval);
    statusUpdateInterval = null;
  }
  if (reportInterval) {
    clearInterval(reportInterval);
    reportInterval = null;
  }

  await stopGeniusEngine();
  isAutonomousMode = false;

  console.log("[GENIUS] Autonomous mode STOPPED");

  return {
    success: true,
    message: "GENIUS autonomous mode stopped",
  };
}

// ============================================================================
// AUTONOMOUS CYCLE EXECUTION
// ============================================================================

/**
 * Run a single autonomous cycle with error recovery
 */
async function runAutonomousCycle(): Promise<void> {
  try {
    const status = await getGeniusStatus();

    if (!status.isRunning) {
      console.log("[GENIUS] Engine not running, restarting...");
      await startGeniusEngine();
    }

    if (status.isPaused) {
      if (status.pauseReason?.includes("threshold")) {
        console.log("[GENIUS] Budget threshold reached, skipping cycle");
        return;
      }
    }

    const leadQueue = await checkLeadQueue();
    if (leadQueue.active < AUTONOMOUS_CONFIG.LEAD_QUEUE_THRESHOLD) {
      console.log(`[GENIUS] Lead queue low (${leadQueue.active}), requesting more from HELPER`);
      await requestLeadsFromHelper(AUTONOMOUS_CONFIG.LEAD_QUEUE_THRESHOLD - leadQueue.active);
    }

    const result = await runGeniusCycle();
    console.log(`[GENIUS] Cycle complete: ${result.emailsSent} emails sent`);

    consecutiveErrors = 0;
    lastCycleError = null;

  } catch (error) {
    consecutiveErrors++;
    lastCycleError = error instanceof Error ? error.message : "Unknown error";
    console.error(`[GENIUS] Cycle error (${consecutiveErrors}/${AUTONOMOUS_CONFIG.MAX_RETRIES}):`, error);

    if (consecutiveErrors >= AUTONOMOUS_CONFIG.MAX_RETRIES) {
      console.error("[GENIUS] Max retries reached, entering recovery mode...");
      await enterRecoveryMode();
    }
  }
}

/**
 * Check current lead queue status
 */
async function checkLeadQueue(): Promise<{
  active: number;
  completed: number;
  paused: number;
}> {
  const [result] = await db.select({
    active: sql<number>`count(*) filter (where status = 'active')::int`,
    completed: sql<number>`count(*) filter (where status = 'completed')::int`,
    paused: sql<number>`count(*) filter (where status = 'paused')::int`,
  }).from(geniusLeads);

  return {
    active: result?.active || 0,
    completed: result?.completed || 0,
    paused: result?.paused || 0,
  };
}

/**
 * Request leads from HELPER agent (placeholder for external integration)
 */
async function requestLeadsFromHelper(count: number): Promise<void> {
  console.log(`[GENIUS] Requesting ${count} leads from HELPER agent...`);
  console.log("[GENIUS] Note: HELPER integration pending - leads can be imported via API");
}

/**
 * Enter recovery mode after repeated failures
 */
async function enterRecoveryMode(): Promise<void> {
  console.log("[GENIUS] Entering recovery mode...");

  if (autonomousInterval) {
    clearInterval(autonomousInterval);
  }

  console.log("[GENIUS] Waiting before retry...");
  await new Promise(resolve => setTimeout(resolve, AUTONOMOUS_CONFIG.RETRY_DELAY_MS));

  consecutiveErrors = 0;

  try {
    await startGeniusEngine();
    autonomousInterval = setInterval(runAutonomousCycle, AUTONOMOUS_CONFIG.CYCLE_INTERVAL_MS);
    console.log("[GENIUS] Recovery successful, resuming autonomous operation");
  } catch (error) {
    console.error("[GENIUS] Recovery failed:", error);
  }
}

// ============================================================================
// STATUS AND REPORTING
// ============================================================================

/**
 * Get comprehensive autonomous mode status
 */
export async function getAutonomousStatus(): Promise<{
  isAutonomous: boolean;
  engineStatus: any;
  phase2Stats: any;
  leadQueue: any;
  performance: {
    consecutiveErrors: number;
    lastError: string | null;
    cycleIntervalMs: number;
  };
  configuration: typeof AUTONOMOUS_CONFIG;
}> {
  const engineStatus = await getGeniusStatus();
  const phase2Stats = await getPhase2Stats();
  const leadQueue = await checkLeadQueue();

  return {
    isAutonomous: isAutonomousMode,
    engineStatus,
    phase2Stats,
    leadQueue,
    performance: {
      consecutiveErrors,
      lastError: lastCycleError,
      cycleIntervalMs: AUTONOMOUS_CONFIG.CYCLE_INTERVAL_MS,
    },
    configuration: AUTONOMOUS_CONFIG,
  };
}

/**
 * Generate performance summary for autonomous operation
 */
export async function generateAutonomousReport(): Promise<{
  timestamp: string;
  mode: string;
  engine: any;
  phase2: any;
  leads: any;
  emails: any;
  budget: any;
  health: {
    status: "healthy" | "warning" | "critical";
    issues: string[];
  };
}> {
  const stats = await getGeniusStats();
  const phase2 = await getPhase2Stats();
  const status = await getGeniusStatus();
  const leadQueue = await checkLeadQueue();

  const issues: string[] = [];
  let healthStatus: "healthy" | "warning" | "critical" = "healthy";

  if (consecutiveErrors > 0) {
    issues.push(`${consecutiveErrors} consecutive errors`);
    healthStatus = consecutiveErrors >= 2 ? "critical" : "warning";
  }

  if (stats.budget.percentUsed >= GENIUS_CONFIG.PAUSE_THRESHOLD_PERCENT) {
    issues.push(`Budget at ${stats.budget.percentUsed}%`);
    healthStatus = "warning";
  }

  if (leadQueue.active < 100) {
    issues.push("Low lead queue");
    healthStatus = healthStatus === "critical" ? "critical" : "warning";
  }

  const bounceRate = stats.emails.totalSent > 0 
    ? (stats.emails.bounces / stats.emails.totalSent) * 100 
    : 0;
  if (bounceRate > 5) {
    issues.push(`High bounce rate: ${bounceRate.toFixed(1)}%`);
    healthStatus = "warning";
  }

  return {
    timestamp: new Date().toISOString(),
    mode: isAutonomousMode ? "Phase-2 Ultra Optimization" : "Standby",
    engine: {
      running: status.isRunning,
      paused: status.isPaused,
      pauseReason: status.pauseReason,
    },
    phase2: {
      hotLeads: phase2.leads.hot,
      deadLeads: phase2.leads.dead,
      premiumLeads: phase2.leads.premium,
      templateVariants: phase2.templates.totalVariants,
    },
    leads: {
      active: leadQueue.active,
      completed: leadQueue.completed,
      total: stats.leads.total,
    },
    emails: {
      sentToday: status.emailsSentToday,
      totalSent: stats.emails.totalSent,
      opens: stats.emails.opens,
      clicks: stats.emails.clicks,
      openRate: stats.emails.totalSent > 0 
        ? ((stats.emails.opens / stats.emails.totalSent) * 100).toFixed(1) + "%" 
        : "0%",
      clickRate: stats.emails.totalSent > 0 
        ? ((stats.emails.clicks / stats.emails.totalSent) * 100).toFixed(1) + "%" 
        : "0%",
    },
    budget: {
      used: `$${(stats.budget.estimatedCostCents / 100).toFixed(2)}`,
      limit: `$${(GENIUS_CONFIG.MONTHLY_EMAIL_BUDGET_CENTS / 100).toFixed(2)}`,
      percentUsed: stats.budget.percentUsed,
    },
    health: {
      status: healthStatus,
      issues,
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  isAutonomousMode,
  AUTONOMOUS_CONFIG,
};
