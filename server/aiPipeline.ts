import { startMasterControl, stopMasterControl, getMasterStatus, getDailyReport } from "./masterControlGenius";
import { startLeadScraper, stopLeadScraper, getScraperStatus } from "./module1LeadScraper";
import { startAutonomousMode, stopAutonomousMode, getAutonomousStatus } from "./geniusAutonomous";
import { startDemoBot, stopDemoBot, getDemoBotStatus } from "./module3DemoBookingBot";
import { startCloserBot, stopCloserBot, getCloserBotStatus } from "./module4CloserBot";
import { startRevenueEngine, stopRevenueEngine, getRevenueStatus } from "./module5RevenueEngine";
import { startClientSuccessBot, stopClientSuccessBot, getClientSuccessStatus } from "./moduleClientSuccess";

interface PipelineStatus {
  isRunning: boolean;
  startedAt: Date | null;
  modules: {
    master: { status: string };
    leadScraper: { status: string; leadsScraped: number };
    nurtureEngine: { status: string; emailsSent: number };
    demoBot: { status: string; demosBooked: number };
    closerBot: { status: string; dealsWon: number; revenue: number };
    revenueEngine: { status: string; mrr: number };
    clientSuccess: { status: string; activeClients: number };
  };
  uptime: string;
}

let pipelineStartedAt: Date | null = null;
let isPipelineRunning = false;

function log(message: string) {
  console.log(`[PIPELINE] ${message}`);
}

function formatUptime(startDate: Date): string {
  const diff = Date.now() - startDate.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

export async function startFullPipeline(): Promise<{ success: boolean; message: string; details: string[] }> {
  if (isPipelineRunning) {
    return { success: false, message: 'Pipeline already running', details: [] };
  }

  log('═══════════════════════════════════════════════════════════════');
  log('           STARTING FULL AI SALES PIPELINE                    ');
  log('═══════════════════════════════════════════════════════════════');
  
  const details: string[] = [];
  const errors: string[] = [];

  try {
    const masterResult = await startMasterControl();
    details.push(`✅ Master Control: ${masterResult.message}`);
  } catch (error) {
    errors.push(`❌ Master Control failed: ${error}`);
  }

  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    const scraperResult = await startLeadScraper();
    details.push(`✅ Module 1 (Lead Scraper): ${scraperResult.message}`);
  } catch (error) {
    errors.push(`❌ Lead Scraper failed: ${error}`);
  }

  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    const nurtureResult = await startAutonomousMode();
    details.push(`✅ Module 2 (Nurture Engine): ${nurtureResult.message}`);
  } catch (error) {
    errors.push(`❌ Nurture Engine failed: ${error}`);
  }

  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    const demoResult = await startDemoBot();
    details.push(`✅ Module 3 (Demo Booking): ${demoResult.message}`);
  } catch (error) {
    errors.push(`❌ Demo Bot failed: ${error}`);
  }

  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    const closerResult = await startCloserBot();
    details.push(`✅ Module 4 (Closer Bot): ${closerResult.message}`);
  } catch (error) {
    errors.push(`❌ Closer Bot failed: ${error}`);
  }

  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    const revenueResult = await startRevenueEngine();
    details.push(`✅ Module 5 (Revenue Engine): ${revenueResult.message}`);
  } catch (error) {
    errors.push(`❌ Revenue Engine failed: ${error}`);
  }

  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    const successResult = await startClientSuccessBot();
    details.push(`✅ Bonus (Client Success): ${successResult.message}`);
  } catch (error) {
    errors.push(`❌ Client Success failed: ${error}`);
  }

  isPipelineRunning = true;
  pipelineStartedAt = new Date();

  log('═══════════════════════════════════════════════════════════════');
  log('           🚀 FULL AI PIPELINE ACTIVE 24/7 🚀                  ');
  log('═══════════════════════════════════════════════════════════════');
  log('');
  log('Pipeline Flow:');
  log('  Lead Scraper → Nurture Engine → Demo Bot → Closer → Revenue');
  log('');
  log('Cycle Intervals:');
  log('  • Lead Scraper:     Every 10 minutes');
  log('  • Nurture Engine:   Every 2 minutes');
  log('  • Demo Bot:         Every 1 minute');
  log('  • Closer Bot:       Every 1 minute');
  log('  • Revenue Engine:   Every 5 minutes');
  log('  • Client Success:   Every 24 hours');
  log('');
  log('Budget Controls:');
  log('  • Daily email limit: 1,666');
  log('  • Auto-pause at 70%');
  log('  • Hard stop at 100%');
  log('═══════════════════════════════════════════════════════════════');

  return {
    success: errors.length === 0,
    message: errors.length === 0 ? 'Full AI Pipeline started successfully!' : `Pipeline started with ${errors.length} errors`,
    details: [...details, ...errors]
  };
}

export async function stopFullPipeline(): Promise<{ success: boolean; message: string }> {
  if (!isPipelineRunning) {
    return { success: false, message: 'Pipeline not running' };
  }

  log('Stopping all pipeline modules...');

  await stopClientSuccessBot();
  await stopRevenueEngine();
  await stopCloserBot();
  await stopDemoBot();
  await stopAutonomousMode();
  await stopLeadScraper();
  await stopMasterControl();

  isPipelineRunning = false;
  pipelineStartedAt = null;

  log('🛑 Full AI Pipeline stopped');
  return { success: true, message: 'Full AI Pipeline stopped' };
}

export async function getPipelineStatus(): Promise<PipelineStatus> {
  const masterStatus = getMasterStatus();
  const scraperStatus = getScraperStatus();
  const nurtureStatus = await getAutonomousStatus();
  const demoStatus = getDemoBotStatus();
  const closerStatus = getCloserBotStatus();
  const revenueStatus = getRevenueStatus();
  const successStatus = getClientSuccessStatus();

  return {
    isRunning: isPipelineRunning,
    startedAt: pipelineStartedAt,
    modules: {
      master: { status: masterStatus.isActive ? 'running' : 'stopped' },
      leadScraper: { 
        status: scraperStatus.isRunning ? 'running' : 'stopped',
        leadsScraped: scraperStatus.totalScraped
      },
      nurtureEngine: { 
        status: nurtureStatus.isAutonomous ? 'running' : 'stopped',
        emailsSent: nurtureStatus.phase2Stats?.emailsSentToday || 0
      },
      demoBot: { 
        status: demoStatus.isRunning ? 'running' : 'stopped',
        demosBooked: demoStatus.demosBooked
      },
      closerBot: { 
        status: closerStatus.isRunning ? 'running' : 'stopped',
        dealsWon: closerStatus.dealsWon,
        revenue: closerStatus.totalRevenue
      },
      revenueEngine: { 
        status: revenueStatus.isRunning ? 'running' : 'stopped',
        mrr: revenueStatus.totalMRR
      },
      clientSuccess: { 
        status: successStatus.isRunning ? 'running' : 'stopped',
        activeClients: successStatus.activeClients
      }
    },
    uptime: pipelineStartedAt ? formatUptime(pipelineStartedAt) : '0h 0m'
  };
}

export function getPipelineReport(): string {
  const status = getPipelineStatus();
  const masterReport = getDailyReport();
  
  return `
╔═══════════════════════════════════════════════════════════════════╗
║             🤖 FULL AI SALES PIPELINE - STATUS REPORT             ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  STATUS: ${status.isRunning ? '🟢 ACTIVE 24/7' : '🔴 STOPPED'}                                        ║
║  UPTIME: ${status.uptime.padEnd(10)}                                           ║
║                                                                   ║
╠═══════════════════════════════════════════════════════════════════╣
║                          MODULE STATUS                            ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  MODULE 1 - Lead Scraper:      ${status.modules.leadScraper.status === 'running' ? '🟢' : '🔴'} ${status.modules.leadScraper.status.toUpperCase().padEnd(8)}              ║
║     └─ Leads scraped today:    ${String(status.modules.leadScraper.leadsScraped).padEnd(10)}               ║
║                                                                   ║
║  MODULE 2 - Nurture Engine:    ${status.modules.nurtureEngine.status === 'running' ? '🟢' : '🔴'} ${status.modules.nurtureEngine.status.toUpperCase().padEnd(8)}              ║
║     └─ Emails sent today:      ${String(status.modules.nurtureEngine.emailsSent).padEnd(10)}               ║
║                                                                   ║
║  MODULE 3 - Demo Booking Bot:  ${status.modules.demoBot.status === 'running' ? '🟢' : '🔴'} ${status.modules.demoBot.status.toUpperCase().padEnd(8)}              ║
║     └─ Demos booked:           ${String(status.modules.demoBot.demosBooked).padEnd(10)}               ║
║                                                                   ║
║  MODULE 4 - Closer Bot:        ${status.modules.closerBot.status === 'running' ? '🟢' : '🔴'} ${status.modules.closerBot.status.toUpperCase().padEnd(8)}              ║
║     └─ Deals closed:           ${String(status.modules.closerBot.dealsWon).padEnd(10)}               ║
║     └─ Revenue:                $${String(status.modules.closerBot.revenue).padEnd(9)}               ║
║                                                                   ║
║  MODULE 5 - Revenue Engine:    ${status.modules.revenueEngine.status === 'running' ? '🟢' : '🔴'} ${status.modules.revenueEngine.status.toUpperCase().padEnd(8)}              ║
║     └─ Monthly recurring:      $${String(status.modules.revenueEngine.mrr).padEnd(9)}               ║
║                                                                   ║
║  BONUS - Client Success:       ${status.modules.clientSuccess.status === 'running' ? '🟢' : '🔴'} ${status.modules.clientSuccess.status.toUpperCase().padEnd(8)}              ║
║     └─ Active clients:         ${String(status.modules.clientSuccess.activeClients).padEnd(10)}               ║
║                                                                   ║
╠═══════════════════════════════════════════════════════════════════╣
║                         PIPELINE FLOW                             ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║   [SCRAPER] ──▶ [NURTURE] ──▶ [DEMO] ──▶ [CLOSER] ──▶ [REVENUE]  ║
║      ↓10m        ↓2m          ↓1m        ↓1m          ↓5m        ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝

${masterReport}
`;
}
