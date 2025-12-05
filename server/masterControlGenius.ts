import { storage } from "./storage";

interface BudgetConfig {
  weeklyCredits: number;
  monthlyEmailBudget: number;
  dailyEmailLimit: number;
  pauseThreshold: number;
  hardStopThreshold: number;
}

interface ModuleStatus {
  name: string;
  status: 'running' | 'paused' | 'stopped' | 'error';
  lastCycle: Date | null;
  cycleInterval: number;
  emailsSent: number;
  leadsProcessed: number;
  errors: number;
}

interface MasterState {
  isActive: boolean;
  startedAt: Date | null;
  budget: BudgetConfig;
  modules: {
    leadScraper: ModuleStatus;
    nurtureEngine: ModuleStatus;
    demoBookingBot: ModuleStatus;
    closerBot: ModuleStatus;
    revenueEngine: ModuleStatus;
    clientSuccessBot: ModuleStatus;
  };
  dailyStats: {
    date: string;
    totalEmailsSent: number;
    totalLeadsScraped: number;
    totalDemosBooked: number;
    totalDeals: number;
    revenue: number;
  };
  alerts: Array<{ timestamp: Date; level: 'info' | 'warning' | 'critical'; message: string }>;
}

const DEFAULT_BUDGET: BudgetConfig = {
  weeklyCredits: 80,
  monthlyEmailBudget: 100,
  dailyEmailLimit: 1666,
  pauseThreshold: 0.70,
  hardStopThreshold: 1.0
};

let masterState: MasterState = {
  isActive: false,
  startedAt: null,
  budget: DEFAULT_BUDGET,
  modules: {
    leadScraper: { name: 'Lead Scraper Engine', status: 'stopped', lastCycle: null, cycleInterval: 600000, emailsSent: 0, leadsProcessed: 0, errors: 0 },
    nurtureEngine: { name: 'Nurture & Warm Lead Engine', status: 'stopped', lastCycle: null, cycleInterval: 120000, emailsSent: 0, leadsProcessed: 0, errors: 0 },
    demoBookingBot: { name: 'Demo Booking Bot', status: 'stopped', lastCycle: null, cycleInterval: 60000, emailsSent: 0, leadsProcessed: 0, errors: 0 },
    closerBot: { name: 'Closer Bot (Sales AI)', status: 'stopped', lastCycle: null, cycleInterval: 60000, emailsSent: 0, leadsProcessed: 0, errors: 0 },
    revenueEngine: { name: 'Revenue Engine', status: 'stopped', lastCycle: null, cycleInterval: 300000, emailsSent: 0, leadsProcessed: 0, errors: 0 },
    clientSuccessBot: { name: 'Client Success Bot', status: 'stopped', lastCycle: null, cycleInterval: 86400000, emailsSent: 0, leadsProcessed: 0, errors: 0 }
  },
  dailyStats: {
    date: new Date().toISOString().split('T')[0],
    totalEmailsSent: 0,
    totalLeadsScraped: 0,
    totalDemosBooked: 0,
    totalDeals: 0,
    revenue: 0
  },
  alerts: []
};

let masterInterval: NodeJS.Timeout | null = null;

function log(message: string, level: 'info' | 'warning' | 'critical' = 'info') {
  const timestamp = new Date().toISOString();
  console.log(`[MASTER] ${message}`);
  masterState.alerts.push({ timestamp: new Date(), level, message });
  if (masterState.alerts.length > 100) {
    masterState.alerts = masterState.alerts.slice(-100);
  }
}

export function getMasterStatus(): MasterState {
  return { ...masterState };
}

export function getBudgetStatus(): { 
  dailyUsed: number; 
  dailyLimit: number; 
  percentUsed: number; 
  isPaused: boolean;
  isHardStopped: boolean;
} {
  const dailyUsed = masterState.dailyStats.totalEmailsSent;
  const dailyLimit = masterState.budget.dailyEmailLimit;
  const percentUsed = dailyUsed / dailyLimit;
  
  return {
    dailyUsed,
    dailyLimit,
    percentUsed,
    isPaused: percentUsed >= masterState.budget.pauseThreshold,
    isHardStopped: percentUsed >= masterState.budget.hardStopThreshold
  };
}

export function canSendEmail(): boolean {
  const budget = getBudgetStatus();
  if (budget.isHardStopped) {
    log('HARD STOP: Daily email limit reached (100%)', 'critical');
    return false;
  }
  if (budget.isPaused) {
    log('AUTO-PAUSE: 70% of daily limit reached', 'warning');
    return false;
  }
  return true;
}

export function recordEmailSent(module: keyof MasterState['modules']) {
  masterState.dailyStats.totalEmailsSent++;
  masterState.modules[module].emailsSent++;
  
  const budget = getBudgetStatus();
  if (budget.percentUsed >= 0.5 && budget.percentUsed < 0.51) {
    log('Budget alert: 50% of daily email limit used', 'info');
  }
  if (budget.percentUsed >= 0.7 && budget.percentUsed < 0.71) {
    log('Budget warning: 70% of daily email limit used - AUTO-PAUSE triggered', 'warning');
  }
}

export function recordLeadScraped() {
  masterState.dailyStats.totalLeadsScraped++;
  masterState.modules.leadScraper.leadsProcessed++;
}

export function recordDemoBooked() {
  masterState.dailyStats.totalDemosBooked++;
  masterState.modules.demoBookingBot.leadsProcessed++;
}

export function recordDealClosed(amount: number) {
  masterState.dailyStats.totalDeals++;
  masterState.dailyStats.revenue += amount;
  masterState.modules.closerBot.leadsProcessed++;
}

export function updateModuleStatus(module: keyof MasterState['modules'], status: ModuleStatus['status']) {
  masterState.modules[module].status = status;
  masterState.modules[module].lastCycle = new Date();
}

export function recordModuleError(module: keyof MasterState['modules']) {
  masterState.modules[module].errors++;
  masterState.modules[module].status = 'error';
  log(`Module error: ${masterState.modules[module].name}`, 'warning');
}

async function runMasterCycle() {
  const today = new Date().toISOString().split('T')[0];
  if (masterState.dailyStats.date !== today) {
    log('New day detected - resetting daily stats', 'info');
    masterState.dailyStats = {
      date: today,
      totalEmailsSent: 0,
      totalLeadsScraped: 0,
      totalDemosBooked: 0,
      totalDeals: 0,
      revenue: 0
    };
    Object.keys(masterState.modules).forEach(key => {
      const moduleKey = key as keyof MasterState['modules'];
      masterState.modules[moduleKey].emailsSent = 0;
      masterState.modules[moduleKey].leadsProcessed = 0;
    });
  }

  const budget = getBudgetStatus();
  if (budget.isHardStopped) {
    log('Master cycle: All modules paused - daily limit reached', 'warning');
    Object.keys(masterState.modules).forEach(key => {
      const moduleKey = key as keyof MasterState['modules'];
      if (masterState.modules[moduleKey].status === 'running') {
        masterState.modules[moduleKey].status = 'paused';
      }
    });
  }

  const activeModules = Object.values(masterState.modules).filter(m => m.status === 'running').length;
  const errorModules = Object.values(masterState.modules).filter(m => m.status === 'error').length;
  
  if (errorModules > 2) {
    log(`Critical: ${errorModules} modules in error state`, 'critical');
  }

  log(`Master cycle: ${activeModules}/6 modules active, ${budget.percentUsed.toFixed(1)}% budget used`);
}

export async function startMasterControl(): Promise<{ success: boolean; message: string }> {
  if (masterState.isActive) {
    return { success: false, message: 'Master Control already running' };
  }

  log('Starting MASTER CONTROL GENIUS...', 'info');
  masterState.isActive = true;
  masterState.startedAt = new Date();

  masterInterval = setInterval(runMasterCycle, 60000);
  await runMasterCycle();

  log('MASTER CONTROL GENIUS activated - overseeing all AI modules', 'info');
  return { success: true, message: 'Master Control GENIUS activated' };
}

export async function stopMasterControl(): Promise<{ success: boolean; message: string }> {
  if (!masterState.isActive) {
    return { success: false, message: 'Master Control not running' };
  }

  if (masterInterval) {
    clearInterval(masterInterval);
    masterInterval = null;
  }

  masterState.isActive = false;
  log('MASTER CONTROL GENIUS stopped', 'info');
  return { success: true, message: 'Master Control stopped' };
}

export function getDailyReport(): string {
  const stats = masterState.dailyStats;
  const budget = getBudgetStatus();
  
  return `
═══════════════════════════════════════════════════════
           MASTER CONTROL GENIUS - DAILY REPORT
═══════════════════════════════════════════════════════
Date: ${stats.date}
Status: ${masterState.isActive ? '🟢 ACTIVE' : '🔴 STOPPED'}

📊 DAILY METRICS
───────────────────────────────────────────────────────
Leads Scraped:     ${stats.totalLeadsScraped}
Emails Sent:       ${stats.totalEmailsSent} / ${budget.dailyLimit} (${(budget.percentUsed * 100).toFixed(1)}%)
Demos Booked:      ${stats.totalDemosBooked}
Deals Closed:      ${stats.totalDeals}
Revenue:           $${stats.revenue.toFixed(2)}

🤖 MODULE STATUS
───────────────────────────────────────────────────────
${Object.entries(masterState.modules).map(([key, mod]) => 
  `${mod.status === 'running' ? '🟢' : mod.status === 'paused' ? '🟡' : mod.status === 'error' ? '🔴' : '⚪'} ${mod.name}: ${mod.status.toUpperCase()}`
).join('\n')}

💰 BUDGET STATUS
───────────────────────────────────────────────────────
Daily Emails:      ${budget.dailyUsed} / ${budget.dailyLimit}
Budget Used:       ${(budget.percentUsed * 100).toFixed(1)}%
Auto-Pause:        ${budget.isPaused ? '🟡 ACTIVE' : '🟢 OK'}
Hard Stop:         ${budget.isHardStopped ? '🔴 ACTIVE' : '🟢 OK'}
═══════════════════════════════════════════════════════
`;
}
