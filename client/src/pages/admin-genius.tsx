import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Play,
  Square,
  Pause,
  RefreshCw,
  Mail,
  Users,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Target,
  ChevronRight,
  Upload,
  FileUp,
  Settings,
  BarChart3,
  Send,
  Eye,
  MousePointerClick,
  Flame,
  Skull,
  Star,
  Timer,
  Sparkles,
} from "lucide-react";

interface GeniusStatus {
  isRunning: boolean;
  isPaused: boolean;
  pauseReason: string;
  lastCycleAt: string | null;
  emailsSentToday: number;
  dailyLimit: number;
  remainingToday: number;
}

interface GeniusStats {
  leads: {
    total: number;
    active: number;
    completed: number;
    paused: number;
    byDay: Record<number, number>;
  };
  emails: {
    totalSent: number;
    sentToday: number;
    opens: number;
    clicks: number;
    bounces: number;
  };
  budget: {
    emailsSentThisMonth: number;
    estimatedCostCents: number;
    monthlyLimitCents: number;
    percentUsed: number;
  };
}

interface GeniusConfig {
  dailyEmailLimit: number;
  monthlyBudgetCents: number;
  weeklyReplitBudgetCents: number;
  pauseThresholdPercent: number;
  demoLink: string;
  sequenceDays: number;
}

interface DailyReport {
  date: string;
  leads: { imported: number; total: number };
  emails: { sent: number; openRate: number; clickRate: number; bounceRate: number };
  demos: { booked: number };
  budget: { emailCostCents: number; percentOfMonthlyLimit: number };
  alerts: string[];
}

interface Phase2Status {
  phase2Active: boolean;
  optimization: {
    leads: {
      total: number;
      byScore: Record<string, number>;
      hot: number;
      dead: number;
      premium: number;
      high: number;
      standard: number;
      low: number;
    };
    templates: {
      totalVariants: number;
      bestPerforming: { day: number; variantId: number; openRate: string } | null;
      worstPerforming: { day: number; variantId: number; openRate: string } | null;
    };
    sendWindows: {
      morning: { sent: number; opens: number };
      midday: { sent: number; opens: number };
      afternoon: { sent: number; opens: number };
    };
  };
}

interface LeadSegments {
  bySegment: Array<{ segment: string | null; count: number; avgScore: string | null }>;
  byClinicType: Array<{ clinicType: string | null; count: number; avgScore: string | null }>;
  byStatus: Array<{ isHot: boolean | null; isDead: boolean | null; count: number }>;
}

export default function AdminGeniusPage() {
  const { toast } = useToast();
  const [bulkLeads, setBulkLeads] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery<GeniusStatus>({
    queryKey: ["/api/genius/status"],
    refetchInterval: 10000,
  });

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<GeniusStats>({
    queryKey: ["/api/genius/stats"],
    refetchInterval: 30000,
  });

  const { data: config } = useQuery<GeniusConfig>({
    queryKey: ["/api/genius/config"],
  });

  const { data: report } = useQuery<DailyReport>({
    queryKey: ["/api/genius/report"],
    refetchInterval: 60000,
  });

  const { data: phase2Status, refetch: refetchPhase2 } = useQuery<Phase2Status>({
    queryKey: ["/api/genius/phase2/status"],
    refetchInterval: 30000,
  });

  const { data: leadSegments, refetch: refetchSegments } = useQuery<LeadSegments>({
    queryKey: ["/api/genius/phase2/lead-segments"],
    refetchInterval: 30000,
  });

  const startMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/genius/start"),
    onSuccess: () => {
      toast({ title: "GENIUS engine started", description: "Email sequences are now running." });
      refetchStatus();
    },
    onError: () => {
      toast({ title: "Failed to start", variant: "destructive" });
    },
  });

  const stopMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/genius/stop"),
    onSuccess: () => {
      toast({ title: "GENIUS engine stopped", description: "Email sequences paused." });
      refetchStatus();
    },
    onError: () => {
      toast({ title: "Failed to stop", variant: "destructive" });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: (reason: string) => apiRequest("POST", "/api/genius/pause", { reason }),
    onSuccess: () => {
      toast({ title: "GENIUS engine paused" });
      refetchStatus();
    },
    onError: () => {
      toast({ title: "Failed to pause", variant: "destructive" });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/genius/resume"),
    onSuccess: () => {
      toast({ title: "GENIUS engine resumed" });
      refetchStatus();
    },
    onError: () => {
      toast({ title: "Failed to resume", variant: "destructive" });
    },
  });

  const runNowMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/genius/run-now"),
    onSuccess: (data: any) => {
      toast({ title: "Cycle complete", description: data.message });
      refetchStatus();
      refetchStats();
    },
    onError: () => {
      toast({ title: "Failed to run cycle", variant: "destructive" });
    },
  });

  const importLeadsMutation = useMutation({
    mutationFn: async (leads: Array<{ email: string; dentistName?: string; clinicName?: string }>) => {
      return apiRequest("POST", "/api/genius/import-leads", { leads });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Import complete",
        description: `${data.imported} imported, ${data.duplicates} duplicates, ${data.failed} failed`,
      });
      setBulkLeads("");
      refetchStats();
    },
    onError: () => {
      toast({ title: "Import failed", variant: "destructive" });
    },
  });

  const initPhase2Mutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/genius/phase2/initialize"),
    onSuccess: () => {
      toast({ title: "PHASE-2 initialized", description: "Template variants and send windows configured" });
      refetchPhase2();
    },
    onError: () => {
      toast({ title: "Failed to initialize PHASE-2", variant: "destructive" });
    },
  });

  const runOptimizationMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/genius/phase2/optimize"),
    onSuccess: (data: any) => {
      toast({ 
        title: "Optimization complete", 
        description: `Scored ${data.leadsScored || 0} leads, found ${data.hotMarked || 0} hot leads` 
      });
      refetchPhase2();
      refetchSegments();
    },
    onError: () => {
      toast({ title: "Optimization failed", variant: "destructive" });
    },
  });

  const updateStatusesMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/genius/phase2/update-lead-statuses"),
    onSuccess: (data: any) => {
      toast({ 
        title: "Lead statuses updated", 
        description: `${data.hotMarked || 0} hot, ${data.deadMarked || 0} dead` 
      });
      refetchSegments();
    },
    onError: () => {
      toast({ title: "Status update failed", variant: "destructive" });
    },
  });

  const handleBulkImport = () => {
    const lines = bulkLeads.split("\n").filter(line => line.trim());
    const leads = lines.map(line => {
      const parts = line.split(",").map(p => p.trim());
      return {
        email: parts[0],
        dentistName: parts[1] || undefined,
        clinicName: parts[2] || undefined,
      };
    });
    
    if (leads.length === 0) {
      toast({ title: "No leads to import", variant: "destructive" });
      return;
    }

    importLeadsMutation.mutate(leads);
  };

  const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Zap className="w-8 h-8 text-primary" />
              GENIUS Email Automation
            </h1>
            <p className="text-muted-foreground mt-1">
              7-day automated email sequences for dental lead conversion
            </p>
          </div>

          <div className="flex items-center gap-3">
            {status?.isRunning ? (
              <>
                <Badge variant="default" className="bg-green-500">
                  <span className="animate-pulse mr-1">●</span> Running
                </Badge>
                {status.isPaused ? (
                  <Button size="sm" onClick={() => resumeMutation.mutate()} disabled={resumeMutation.isPending}>
                    <Play className="w-4 h-4 mr-1" />
                    Resume
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => pauseMutation.mutate("Manual pause")} disabled={pauseMutation.isPending}>
                    <Pause className="w-4 h-4 mr-1" />
                    Pause
                  </Button>
                )}
                <Button size="sm" variant="destructive" onClick={() => stopMutation.mutate()} disabled={stopMutation.isPending}>
                  <Square className="w-4 h-4 mr-1" />
                  Stop
                </Button>
              </>
            ) : (
              <>
                <Badge variant="secondary">Stopped</Badge>
                <Button size="sm" onClick={() => startMutation.mutate()} disabled={startMutation.isPending}>
                  <Play className="w-4 h-4 mr-1" />
                  Start Engine
                </Button>
              </>
            )}
            <Button size="sm" variant="ghost" onClick={() => runNowMutation.mutate()} disabled={runNowMutation.isPending}>
              <RefreshCw className={`w-4 h-4 ${runNowMutation.isPending ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {report?.alerts && report.alerts.length > 0 && (
          <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                <div className="space-y-1">
                  {report.alerts.map((alert, i) => (
                    <p key={i} className="text-sm text-orange-800 dark:text-orange-200">{alert}</p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="card-daily-emails">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today&apos;s Emails</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status?.emailsSentToday || 0}</div>
              <Progress 
                value={((status?.emailsSentToday || 0) / (status?.dailyLimit || 1666)) * 100} 
                className="h-2 mt-2" 
              />
              <p className="text-xs text-muted-foreground mt-1">
                {status?.remainingToday || 0} remaining of {status?.dailyLimit || 1666}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-active-leads">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.leads.active || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.leads.total || 0} total · {stats?.leads.completed || 0} completed
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-engagement">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <Eye className="w-4 h-4" />
                {stats?.emails.opens || 0}
                <MousePointerClick className="w-4 h-4 ml-2" />
                {stats?.emails.clicks || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Opens · Clicks
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-budget">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.budget.percentUsed || 0}%</div>
              <Progress 
                value={stats?.budget.percentUsed || 0} 
                className={`h-2 mt-2 ${(stats?.budget.percentUsed || 0) >= 70 ? "[&>div]:bg-orange-500" : ""}`}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formatCents(stats?.budget.estimatedCostCents || 0)} of {formatCents(config?.monthlyBudgetCents || 10000)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sequence">Sequence Funnel</TabsTrigger>
            <TabsTrigger value="optimization" className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              PHASE-2
            </TabsTrigger>
            <TabsTrigger value="import">Import Leads</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>7-Day Email Sequence</CardTitle>
                  <CardDescription>Current lead distribution by sequence day</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[0, 1, 2, 3, 4, 5, 6].map(day => {
                      const count = stats?.leads.byDay[day] || 0;
                      const maxCount = Math.max(...Object.values(stats?.leads.byDay || { 0: 1 }), 1);
                      const percentage = (count / maxCount) * 100;
                      const labels = [
                        "Day 0: Warm-up",
                        "Day 1: Proof",
                        "Day 2: Fear",
                        "Day 3: Social Proof",
                        "Day 4: Objection Killer",
                        "Day 5: Urgency",
                        "Day 6: Final Call",
                      ];
                      return (
                        <div key={day} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{labels[day]}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Daily Report</CardTitle>
                  <CardDescription>{report?.date || new Date().toISOString().split("T")[0]}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Emails Sent</p>
                        <p className="text-xl font-bold">{report?.emails.sent || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Demos Booked</p>
                        <p className="text-xl font-bold text-green-600">{report?.demos.booked || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Open Rate</p>
                        <p className="text-xl font-bold">{(report?.emails.openRate || 0).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Click Rate</p>
                        <p className="text-xl font-bold">{(report?.emails.clickRate || 0).toFixed(1)}%</p>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">Daily Email Cost</p>
                      <p className="text-lg font-medium">{formatCents(report?.budget.emailCostCents || 0)}</p>
                      <p className="text-xs text-muted-foreground">
                        {(report?.budget.percentOfMonthlyLimit || 0).toFixed(1)}% of monthly budget
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sequence" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Sequence Templates</CardTitle>
                <CardDescription>7-day automated sales sequence for dental clinics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { day: 0, title: "Warm-up Trigger", subject: "Your clinic is losing 30–50 patients every month", goal: "Short 3-line hook email" },
                    { day: 1, title: "Proof Email", subject: "See how clinics get 40–60 new bookings monthly", goal: "Show AI receptionist benefits" },
                    { day: 2, title: "Fear Email", subject: "Missed calls = $300–$600 lost daily", goal: "Pain point: lost revenue" },
                    { day: 3, title: "Social Proof", subject: "How one clinic added $14,200/month with AI receptionist", goal: "Case study results" },
                    { day: 4, title: "Objection Killer", subject: '"We already have a receptionist" (Solved)', goal: "Address common objection" },
                    { day: 5, title: "Urgency", subject: "Final 24 hours for early pricing access", goal: "Create urgency" },
                    { day: 6, title: "Final Call", subject: "Last chance — installs in 3 minutes", goal: "Final reminder" },
                  ].map(template => (
                    <div key={template.day} className="flex items-start gap-4 p-4 border rounded-lg hover-elevate">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="font-bold text-primary">{template.day}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{template.title}</h4>
                          <Badge variant="outline" className="text-xs">Day {template.day}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          Subject: {template.subject}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{template.goal}</p>
                      </div>
                      <div className="text-muted-foreground">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="optimization" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  PHASE-2 Optimization Engine
                </h2>
                <p className="text-sm text-muted-foreground">
                  Lead scoring, template variants, send-time AI, hot/dead tracking
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => initPhase2Mutation.mutate()}
                  disabled={initPhase2Mutation.isPending}
                  data-testid="button-init-phase2"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  {initPhase2Mutation.isPending ? "Initializing..." : "Initialize"}
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => runOptimizationMutation.mutate()}
                  disabled={runOptimizationMutation.isPending}
                  data-testid="button-run-optimization"
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  {runOptimizationMutation.isPending ? "Running..." : "Run Optimization"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card data-testid="card-hot-leads">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Hot Leads</CardTitle>
                  <Flame className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {phase2Status?.optimization.leads.hot || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">High engagement, ready to convert</p>
                </CardContent>
              </Card>

              <Card data-testid="card-dead-leads">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Dead Leads</CardTitle>
                  <Skull className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-muted-foreground">
                    {phase2Status?.optimization.leads.dead || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">No engagement, marked inactive</p>
                </CardContent>
              </Card>

              <Card data-testid="card-premium-leads">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Premium Segment</CardTitle>
                  <Star className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {phase2Status?.optimization.leads.premium || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Score 8-10, highest priority</p>
                </CardContent>
              </Card>

              <Card data-testid="card-template-variants">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Template Variants</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {phase2Status?.optimization.templates.totalVariants || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">7 per day for A/B testing</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Lead Segmentation
                  </CardTitle>
                  <CardDescription>Distribution by priority segment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { label: "Premium (8-10)", count: phase2Status?.optimization.leads.premium || 0, color: "bg-yellow-500" },
                      { label: "High (6-7)", count: phase2Status?.optimization.leads.high || 0, color: "bg-green-500" },
                      { label: "Standard (4-5)", count: phase2Status?.optimization.leads.standard || 0, color: "bg-blue-500" },
                      { label: "Low (1-3)", count: phase2Status?.optimization.leads.low || 0, color: "bg-gray-400" },
                    ].map(seg => {
                      const total = phase2Status?.optimization.leads.total || 1;
                      const pct = (seg.count / total) * 100;
                      return (
                        <div key={seg.label} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{seg.label}</span>
                            <span className="font-medium">{seg.count} ({pct.toFixed(1)}%)</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full ${seg.color}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Separator className="my-4" />
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => updateStatusesMutation.mutate()}
                    disabled={updateStatusesMutation.isPending}
                    data-testid="button-update-statuses"
                  >
                    <RefreshCw className={`w-4 h-4 mr-1 ${updateStatusesMutation.isPending ? "animate-spin" : ""}`} />
                    Update Hot/Dead Statuses
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Timer className="w-5 h-5" />
                    Send Window Performance
                  </CardTitle>
                  <CardDescription>Best times for email delivery</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: "Morning (8:00 AM)", window: "morning", data: phase2Status?.optimization.sendWindows.morning },
                      { label: "Midday (11:30 AM)", window: "midday", data: phase2Status?.optimization.sendWindows.midday },
                      { label: "Afternoon (4:00 PM)", window: "afternoon", data: phase2Status?.optimization.sendWindows.afternoon },
                    ].map(w => {
                      const sent = w.data?.sent || 0;
                      const opens = w.data?.opens || 0;
                      const openRate = sent > 0 ? (opens / sent) * 100 : 0;
                      return (
                        <div key={w.window} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{w.label}</p>
                            <p className="text-xs text-muted-foreground">{sent} sent, {opens} opens</p>
                          </div>
                          <Badge variant={openRate > 25 ? "default" : "secondary"}>
                            {openRate.toFixed(1)}% open rate
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Send times randomized ±15 minutes to avoid spam filters
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Clinic Type Distribution</CardTitle>
                <CardDescription>Lead segmentation by practice type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {(leadSegments?.byClinicType || []).map((ct, idx) => (
                    <div key={idx} className="p-3 border rounded-lg text-center">
                      <p className="text-2xl font-bold">{ct.count}</p>
                      <p className="text-xs text-muted-foreground capitalize">{ct.clinicType || "Unknown"}</p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        Avg: {ct.avgScore || "N/A"}
                      </Badge>
                    </div>
                  ))}
                  {(!leadSegments?.byClinicType || leadSegments.byClinicType.length === 0) && (
                    <p className="col-span-full text-center text-muted-foreground py-6">
                      No clinic type data yet. Run optimization to score leads.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Import Leads
                </CardTitle>
                <CardDescription>
                  Add leads to the 7-day email sequence. Format: email, dentist name, clinic name (one per line)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="bulk-leads">Lead Data (CSV format)</Label>
                  <Textarea
                    id="bulk-leads"
                    placeholder="dr.smith@dentalclinic.com, Dr. Smith, Smile Dental Clinic
dr.johnson@familydental.com, Dr. Johnson, Family Dental Care"
                    value={bulkLeads}
                    onChange={e => setBulkLeads(e.target.value)}
                    className="h-40 font-mono text-sm mt-2"
                    data-testid="textarea-bulk-leads"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {bulkLeads.split("\n").filter(l => l.trim()).length} leads ready to import
                  </p>
                </div>
                <Button 
                  onClick={handleBulkImport} 
                  disabled={importLeadsMutation.isPending || !bulkLeads.trim()}
                  data-testid="button-import-leads"
                >
                  <FileUp className="w-4 h-4 mr-2" />
                  {importLeadsMutation.isPending ? "Importing..." : "Import Leads"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>External API Integration</CardTitle>
                <CardDescription>
                  Import leads programmatically using the GENIUS API
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg font-mono text-sm overflow-x-auto">
                    <p className="text-muted-foreground"># Single lead import</p>
                    <p>POST /api/genius/import-lead</p>
                    <p className="text-muted-foreground mt-2"># Bulk import (up to 500 leads)</p>
                    <p>POST /api/genius/import-leads</p>
                    <p className="text-muted-foreground mt-2"># Headers</p>
                    <p>Authorization: Bearer YOUR_API_KEY</p>
                    <p>Content-Type: application/json</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use your IMPORT_API_KEY to authenticate external imports from DentalMapsHelper or other lead sources.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  GENIUS Configuration
                </CardTitle>
                <CardDescription>Current budget and rate limits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground">Daily Email Limit</Label>
                      <p className="text-2xl font-bold">{config?.dailyEmailLimit || 1666}</p>
                      <p className="text-xs text-muted-foreground">Maximum emails sent per day</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Monthly Email Budget</Label>
                      <p className="text-2xl font-bold">{formatCents(config?.monthlyBudgetCents || 10000)}</p>
                      <p className="text-xs text-muted-foreground">Maximum monthly email spend</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground">Weekly Replit Budget</Label>
                      <p className="text-2xl font-bold">{formatCents(config?.weeklyReplitBudgetCents || 8000)}</p>
                      <p className="text-xs text-muted-foreground">Compute budget allocation</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Auto-Pause Threshold</Label>
                      <p className="text-2xl font-bold">{config?.pauseThresholdPercent || 70}%</p>
                      <p className="text-xs text-muted-foreground">Engine pauses when budget reaches this level</p>
                    </div>
                  </div>
                </div>
                <Separator className="my-6" />
                <div>
                  <Label className="text-muted-foreground">Demo Link</Label>
                  <p className="font-mono text-sm mt-1">{config?.demoLink}</p>
                  <p className="text-xs text-muted-foreground mt-1">Link included in all email CTAs</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engine Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Engine Running</span>
                    <Badge variant={status?.isRunning ? "default" : "secondary"}>
                      {status?.isRunning ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Paused</span>
                    <Badge variant={status?.isPaused ? "destructive" : "outline"}>
                      {status?.isPaused ? status.pauseReason || "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Last Cycle</span>
                    <span className="text-muted-foreground">
                      {status?.lastCycleAt
                        ? new Date(status.lastCycleAt).toLocaleTimeString()
                        : "Never"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Sequence Length</span>
                    <span className="text-muted-foreground">{config?.sequenceDays || 7} days</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
