import { type Server } from "node:http";

import express, {
  type Express,
  type Request,
  Response,
  NextFunction,
} from "express";

import { registerRoutes } from "./routes";
import { startAutomation } from "./automatedOutreach";
import { startMarketingSync } from "./marketingSync";
import { startAutonomousMode, getAutonomousStatus } from "./geniusAutonomous";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

export default async function runApp(
  setup: (app: Express, server: Server) => Promise<void>,
) {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly run the final setup after setting up all the other routes so
  // the catch-all route doesn't interfere with the other routes
  await setup(app, server);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Full AI Sales Pipeline - 5 Modules + Master Control
    // Auto-start after 5 seconds to allow database connections to stabilize
    setTimeout(async () => {
      try {
        log("═══════════════════════════════════════════════════════════════", "PIPELINE");
        log("       🚀 STARTING FULL AI SALES PIPELINE                     ", "PIPELINE");
        log("═══════════════════════════════════════════════════════════════", "PIPELINE");
        
        const { startFullPipeline } = await import("./aiPipeline");
        const result = await startFullPipeline('low-cost');
        
        if (result.success) {
          log("✅ FULL AI PIPELINE ACTIVE 24/7", "PIPELINE");
          log("", "PIPELINE");
          log("Pipeline Flow:", "PIPELINE");
          log("  Lead Scraper → Nurture Engine → Demo Bot → Closer → Revenue", "PIPELINE");
          log("", "PIPELINE");
          log("Module Cycles:", "PIPELINE");
          log("  • Lead Scraper:     Every 10 minutes (75 cities)", "PIPELINE");
          log("  • Nurture Engine:   Every 2 minutes (7-day emails)", "PIPELINE");
          log("  • Demo Booking Bot: Every 1 minute (warm leads)", "PIPELINE");
          log("  • Closer Bot:       Every 1 minute (demos → deals)", "PIPELINE");
          log("  • Revenue Engine:   Every 5 minutes (invoices)", "PIPELINE");
          log("  • Client Success:   Every 24 hours (reports)", "PIPELINE");
          log("", "PIPELINE");
          log("Budget Controls:", "PIPELINE");
          log("  • Daily email limit: 1,666", "PIPELINE");
          log("  • Auto-pause at 70%", "PIPELINE");
          log("  • Hard stop at 100%", "PIPELINE");
          log("═══════════════════════════════════════════════════════════════", "PIPELINE");
        } else {
          log(`⚠️ Pipeline startup: ${result.message}`, "PIPELINE");
          result.details.forEach(d => log(`   ${d}`, "PIPELINE"));
        }
      } catch (error) {
        log(`❌ Pipeline startup error: ${error}`, "PIPELINE");
      }
    }, 5000);
  });
}
