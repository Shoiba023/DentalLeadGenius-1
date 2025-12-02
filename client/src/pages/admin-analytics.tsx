import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Building2, Calendar, TrendingUp, CheckCircle2, XCircle, Bot, MessagesSquare, UserCheck, BarChart3, Mail, Send, Clock, AlertCircle, Filter, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format } from "date-fns";
import type { Clinic, Lead, OutreachCampaign } from "@shared/schema";

interface DashboardStats {
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
}

interface RecentLead extends Lead {
  clinicName: string | null;
}

interface CampaignWithStats extends OutreachCampaign {
  clinicName: string | null;
}

interface ChatbotAnalytics {
  totalConversations: number;
  salesConversations: number;
  patientConversations: number;
  totalMessages: number;
  userMessages: number;
  aiMessages: number;
  patientBookingsFromChat: number;
  averageMessagesPerConversation: number;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-500",
  contacted: "bg-yellow-500",
  warm: "bg-orange-500",
  replied: "bg-purple-500",
  demo_booked: "bg-teal-500",
  won: "bg-green-500",
  lost: "bg-gray-500",
};

const statusLabels: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  warm: "Warm",
  replied: "Replied",
  demo_booked: "Demo Booked",
  won: "Won",
  lost: "Lost",
};

const campaignStatusColors: Record<string, string> = {
  draft: "secondary",
  ready: "outline",
  active: "default",
  paused: "secondary",
  completed: "default",
  archived: "secondary",
};

export default function AdminAnalytics() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedClinicId, setSelectedClinicId] = useState<string>("all");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  // Fetch clinics for filter dropdown
  const { data: clinics } = useQuery<Clinic[]>({
    queryKey: ["/api/clinics"],
    enabled: isAuthenticated,
  });

  // Fetch dashboard stats
  const { data: dashboardStats, isLoading: statsLoading, refetch: refetchStats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats", selectedClinicId],
    queryFn: async () => {
      const url = selectedClinicId === "all" 
        ? "/api/dashboard/stats"
        : `/api/dashboard/stats?clinicId=${selectedClinicId}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  // Fetch recent leads
  const { data: recentLeads, isLoading: leadsLoading } = useQuery<RecentLead[]>({
    queryKey: ["/api/dashboard/recent-leads", selectedClinicId],
    queryFn: async () => {
      const url = selectedClinicId === "all" 
        ? "/api/dashboard/recent-leads?limit=10"
        : `/api/dashboard/recent-leads?limit=10&clinicId=${selectedClinicId}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch recent leads");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  // Fetch campaigns
  const { data: campaigns, isLoading: campaignsLoading } = useQuery<CampaignWithStats[]>({
    queryKey: ["/api/dashboard/campaigns", selectedClinicId],
    queryFn: async () => {
      const url = selectedClinicId === "all" 
        ? "/api/dashboard/campaigns"
        : `/api/dashboard/campaigns?clinicId=${selectedClinicId}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  // Fetch chatbot analytics
  const { data: chatbotAnalytics, isLoading: chatbotLoading } = useQuery<ChatbotAnalytics>({
    queryKey: ["/api/analytics/chatbot"],
    enabled: isAuthenticated,
  });

  if (authLoading || !isAuthenticated) {
    return null;
  }

  const handleRefresh = () => {
    refetchStats();
  };

  // Prepare data for lead status pie chart
  const leadStatusData = dashboardStats ? [
    { name: "New", value: dashboardStats.leadsByStatus.new, fill: "#3b82f6" },
    { name: "Contacted", value: dashboardStats.leadsByStatus.contacted, fill: "#eab308" },
    { name: "Warm", value: dashboardStats.leadsByStatus.warm, fill: "#f97316" },
    { name: "Replied", value: dashboardStats.leadsByStatus.replied, fill: "#a855f7" },
    { name: "Demo Booked", value: dashboardStats.leadsByStatus.demo_booked, fill: "#14b8a6" },
    { name: "Won", value: dashboardStats.leadsByStatus.won, fill: "#22c55e" },
    { name: "Lost", value: dashboardStats.leadsByStatus.lost, fill: "#6b7280" },
  ].filter(item => item.value > 0) : [];

  // Prepare data for funnel chart
  const funnelData = dashboardStats ? [
    { stage: "New", count: dashboardStats.leadsByStatus.new, fill: "#3b82f6" },
    { stage: "Contacted", count: dashboardStats.leadsByStatus.contacted, fill: "#eab308" },
    { stage: "Warm", count: dashboardStats.leadsByStatus.warm, fill: "#f97316" },
    { stage: "Replied", count: dashboardStats.leadsByStatus.replied, fill: "#a855f7" },
    { stage: "Won", count: dashboardStats.leadsByStatus.won, fill: "#22c55e" },
  ] : [];

  return (
    <div className="p-8 space-y-8">
      {/* Header with Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2" data-testid="text-page-title">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track your lead generation performance and conversion metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
              <SelectTrigger className="w-[200px]" data-testid="select-clinic-filter">
                <SelectValue placeholder="All Clinics" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clinics</SelectItem>
                {clinics?.map((clinic) => (
                  <SelectItem key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="icon" onClick={handleRefresh} data-testid="button-refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overview Stats Cards */}
      {statsLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card data-testid="card-total-clinics">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clinics</CardTitle>
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="stat-total-clinics">
                {dashboardStats?.totalClinics || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Registered practices</p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-leads">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="stat-total-leads">
                {dashboardStats?.totalLeads || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All leads in system</p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-campaigns">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campaigns</CardTitle>
              <Mail className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="stat-total-campaigns">
                {dashboardStats?.totalCampaigns || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {dashboardStats?.activeCampaigns || 0} active
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-pending-bookings">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
              <Calendar className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600" data-testid="stat-pending-bookings">
                {dashboardStats?.pendingBookings || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting confirmation</p>
            </CardContent>
          </Card>

          <Card data-testid="card-won-leads">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Won</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600" data-testid="stat-won-leads">
                {dashboardStats?.leadsByStatus.won || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Converted customers</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      {!statsLoading && dashboardStats && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card data-testid="card-funnel-chart">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Lead Funnel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={funnelData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis type="category" dataKey="stage" className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-status-chart">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Leads by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadStatusData.length > 0 ? leadStatusData : [{ name: "No Data", value: 1, fill: "#e5e7eb" }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => leadStatusData.length > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ""}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
                {leadStatusData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span>{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Separator className="my-8" />

      {/* Campaigns Table */}
      <div>
        <h2 className="text-2xl font-bold mb-2" data-testid="text-campaigns-section-title">
          Campaign Performance
        </h2>
        <p className="text-muted-foreground mb-6">
          Track your email and outreach campaigns
        </p>
      </div>

      <Card data-testid="card-campaigns-table">
        <CardContent className="p-0">
          {campaignsLoading ? (
            <div className="p-6">
              <Skeleton className="h-48 w-full" />
            </div>
          ) : campaigns && campaigns.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Clinic</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                  <TableHead className="text-right">Today</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id} data-testid={`row-campaign-${campaign.id}`}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {campaign.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {campaign.clinicName || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={campaignStatusColors[campaign.status] as any || "secondary"} className="capitalize">
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {campaign.totalSent || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      {campaign.sentToday || 0}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {campaign.createdAt ? format(new Date(campaign.createdAt), "MMM d, yyyy") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No campaigns found</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* Recent Leads Table */}
      <div>
        <h2 className="text-2xl font-bold mb-2" data-testid="text-leads-section-title">
          Recent Leads
        </h2>
        <p className="text-muted-foreground mb-6">
          Latest leads added to the system
        </p>
      </div>

      <Card data-testid="card-recent-leads-table">
        <CardContent className="p-0">
          {leadsLoading ? (
            <div className="p-6">
              <Skeleton className="h-48 w-full" />
            </div>
          ) : recentLeads && recentLeads.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Clinic</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLeads.map((lead) => (
                  <TableRow key={lead.id} data-testid={`row-lead-${lead.id}`}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.clinicName || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.email || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={`${statusColors[lead.status]} text-white border-0`}
                      >
                        {statusLabels[lead.status] || lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground capitalize">
                      {lead.source?.replace("-", " ") || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.createdAt ? format(new Date(lead.createdAt), "MMM d, yyyy") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No leads found</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="my-8" />
      
      {/* Chatbot Analytics Section */}
      <div>
        <h2 className="text-2xl font-bold mb-2" data-testid="text-chatbot-section-title">
          Chatbot Performance
        </h2>
        <p className="text-muted-foreground mb-6">
          Track AI chatbot conversations and engagement metrics
        </p>
      </div>

      {chatbotLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card data-testid="card-total-conversations">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
              <Bot className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="stat-total-conversations">
                {chatbotAnalytics?.totalConversations || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                AI chat sessions started
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-sales-chats">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sales Chats</CardTitle>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600" data-testid="stat-sales-chats">
                {chatbotAnalytics?.salesConversations || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Homepage lead conversations
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-patient-chats">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Patient Chats</CardTitle>
              <UserCheck className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600" data-testid="stat-patient-chats">
                {chatbotAnalytics?.patientConversations || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Clinic page conversations
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-messages">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
              <MessagesSquare className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="stat-total-messages">
                {chatbotAnalytics?.totalMessages || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Avg {chatbotAnalytics?.averageMessagesPerConversation || 0} per chat
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
