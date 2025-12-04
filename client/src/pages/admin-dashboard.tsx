import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Building2, 
  TrendingUp, 
  MessageSquare,
  LogOut,
  LayoutDashboard,
  UserPlus,
  Mail,
  Calendar,
  Sparkles,
  ArrowRight,
  BarChart3,
  Zap,
  Settings
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { StatCard, StatsGrid } from "@/components/ui/premium-stats";
import { PageLoading } from "@/components/ui/premium-loading";

interface SessionData {
  isAuthenticated: boolean;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
}

interface AnalyticsData {
  leadsImported: number;
  leadsContacted: number;
  replies: number;
  demosBooked: number;
  won: number;
  lost: number;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: session, isLoading } = useQuery<SessionData>({
    queryKey: ["/api/auth/session"],
  });

  const { data: analytics } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
    enabled: !!session?.isAuthenticated,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      toast({ title: "Logged out successfully" });
      setLocation("/login");
    },
  });

  if (isLoading) {
    return <PageLoading title="Loading Dashboard" />;
  }

  if (!session?.isAuthenticated) {
    setLocation("/login");
    return null;
  }

  const quickActions = [
    {
      title: "Manage Leads",
      description: "Import, view, and manage your dental clinic leads",
      icon: UserPlus,
      path: "/admin/leads",
      color: "text-blue-500"
    },
    {
      title: "Clinics",
      description: "Manage multi-tenant clinic profiles and branding",
      icon: Building2,
      path: "/admin/clinics",
      color: "text-teal-500"
    },
    {
      title: "Outreach Campaigns",
      description: "Create and manage email/SMS campaigns",
      icon: MessageSquare,
      path: "/admin/outreach",
      color: "text-purple-500"
    },
    {
      title: "Patient Bookings",
      description: "View and manage appointment requests",
      icon: Calendar,
      path: "/admin/patient-bookings",
      color: "text-orange-500"
    },
    {
      title: "Analytics",
      description: "Deep-dive into performance metrics",
      icon: BarChart3,
      path: "/admin/analytics",
      color: "text-green-500"
    },
    {
      title: "Sequences",
      description: "Automated follow-up workflows",
      icon: Zap,
      path: "/admin/sequences",
      color: "text-amber-500"
    },
  ];

  const userName = session.user?.firstName || session.user?.email?.split('@')[0] || 'Admin';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-premium">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold" data-testid="text-admin-dashboard-title">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {userName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/admin/users")}
              data-testid="button-manage-users"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Overview</h2>
          </div>
          
          <StatsGrid columns={4}>
            <StatCard
              title="Total Leads"
              value={(analytics?.leadsImported || 0).toLocaleString()}
              description="Leads imported into system"
              icon={Users}
              variant="gradient"
              trend={{ value: 12, isPositive: true }}
            />
            <StatCard
              title="Contacted"
              value={(analytics?.leadsContacted || 0).toLocaleString()}
              description="Leads reached out to"
              icon={Mail}
              trend={{ value: 8, isPositive: true }}
            />
            <StatCard
              title="Demos Booked"
              value={(analytics?.demosBooked || 0).toLocaleString()}
              description="Demo sessions scheduled"
              icon={Calendar}
              trend={{ value: 15, isPositive: true }}
            />
            <StatCard
              title="Won"
              value={(analytics?.won || 0).toLocaleString()}
              description="Converted customers"
              icon={TrendingUp}
              variant="glass"
              trend={{ value: 23, isPositive: true }}
            />
          </StatsGrid>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Quick Actions</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/admin/analytics")}>
              View All Analytics
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => (
              <Card 
                key={action.path}
                className="hover-elevate cursor-pointer transition-all duration-200 group shadow-premium"
                onClick={() => setLocation(action.path)}
                data-testid={`card-action-${action.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <CardHeader className="flex flex-row items-start gap-4">
                  <div className={`h-12 w-12 rounded-xl bg-muted flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0 ${action.color}`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                      {action.title}
                      <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {action.description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="pt-4">
          <Card className="glass-card overflow-hidden">
            <div className="p-6 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl gradient-accent flex items-center justify-center glow-primary">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">AI-Powered Outreach</h3>
                  <p className="text-sm text-muted-foreground">
                    Automate your lead engagement with intelligent email campaigns
                  </p>
                </div>
              </div>
              <Button 
                className="btn-premium gradient-primary text-white border-0"
                onClick={() => setLocation("/admin/outreach")}
              >
                Launch Campaign
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}