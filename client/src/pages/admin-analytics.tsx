import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, Calendar, TrendingUp, CheckCircle2, XCircle, Bot, MessagesSquare, UserCheck, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Analytics {
  leadsImported: number;
  leadsContacted: number;
  replies: number;
  demosBooked: number;
  won: number;
  lost: number;
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

export default function AdminAnalytics() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

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

  const { data: analytics, isLoading } = useQuery<Analytics>({
    queryKey: ["/api/analytics"],
    enabled: isAuthenticated,
  });
  
  const { data: chatbotAnalytics, isLoading: chatbotLoading } = useQuery<ChatbotAnalytics>({
    queryKey: ["/api/analytics/chatbot"],
    enabled: isAuthenticated,
  });

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2" data-testid="text-page-title">
          Analytics Dashboard
        </h1>
        <p className="text-muted-foreground">
          Track your lead generation performance and conversion metrics
        </p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card data-testid="card-leads-imported">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Imported</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="stat-leads-imported">
                {analytics?.leadsImported || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total leads in system</p>
            </CardContent>
          </Card>

          <Card data-testid="card-leads-contacted">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Contacted</CardTitle>
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="stat-leads-contacted">
                {analytics?.leadsContacted || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Outreach messages sent
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-replies">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Replies</CardTitle>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="stat-replies">
                {analytics?.replies || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Engaged conversations
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-demos-booked">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Demos Booked</CardTitle>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="stat-demos-booked">
                {analytics?.demosBooked || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Scheduled appointments
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-won">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Won</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600" data-testid="stat-won">
                {analytics?.won || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Converted clients</p>
            </CardContent>
          </Card>

          <Card data-testid="card-lost">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lost</CardTitle>
              <XCircle className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600" data-testid="stat-lost">
                {analytics?.lost || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Closed opportunities</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lead Funnel Chart */}
      {!isLoading && analytics && (
        <div className="grid lg:grid-cols-2 gap-6 mt-8">
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
                    data={[
                      { stage: "Imported", count: analytics.leadsImported, fill: "#0284c7" },
                      { stage: "Contacted", count: analytics.leadsContacted, fill: "#0891b2" },
                      { stage: "Replied", count: analytics.replies, fill: "#2563eb" },
                      { stage: "Demos", count: analytics.demosBooked, fill: "#0d9488" },
                      { stage: "Won", count: analytics.won, fill: "#16a34a" },
                    ]}
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

          <Card data-testid="card-outcome-chart">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Lead Outcomes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Won", value: analytics.won || 1, fill: "#22c55e" },
                        { name: "Lost", value: analytics.lost || 1, fill: "#ef4444" },
                        { name: "In Progress", value: Math.max(0, (analytics.leadsImported - analytics.won - analytics.lost)) || 1, fill: "#3b82f6" },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                    </Pie>
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
              <div className="flex justify-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Won</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Lost</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>In Progress</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chatbot Analytics Section */}
      <Separator className="my-8" />
      
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

          <Card data-testid="card-patient-bookings">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Patient Bookings</CardTitle>
              <Calendar className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600" data-testid="stat-patient-bookings">
                {chatbotAnalytics?.patientBookingsFromChat || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Appointments from chatbot
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-user-messages">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">User Messages</CardTitle>
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="stat-user-messages">
                {chatbotAnalytics?.userMessages || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Messages from visitors
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-ai-responses">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Responses</CardTitle>
              <Bot className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="stat-ai-responses">
                {chatbotAnalytics?.aiMessages || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                AI assistant replies
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
