import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Calendar
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!session?.isAuthenticated) {
    setLocation("/login");
    return null;
  }

  const stats = [
    {
      title: "Total Leads",
      value: analytics?.leadsImported || 0,
      icon: Users,
      description: "Leads imported into system",
    },
    {
      title: "Contacted",
      value: analytics?.leadsContacted || 0,
      icon: Mail,
      description: "Leads reached out to",
    },
    {
      title: "Demos Booked",
      value: analytics?.demosBooked || 0,
      icon: Calendar,
      description: "Demo sessions scheduled",
    },
    {
      title: "Won",
      value: analytics?.won || 0,
      icon: TrendingUp,
      description: "Converted customers",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold" data-testid="text-admin-dashboard-title">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Welcome, {session.user?.firstName || session.user?.email}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid={`text-stat-${stat.title.toLowerCase().replace(' ', '-')}`}>
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/admin/leads")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Manage Leads
              </CardTitle>
              <CardDescription>
                Import, view, and manage your dental clinic leads
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/admin/clinics")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Clinics
              </CardTitle>
              <CardDescription>
                Manage multi-tenant clinic profiles and branding
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/admin/outreach")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Outreach Campaigns
              </CardTitle>
              <CardDescription>
                Create and manage email/SMS campaigns
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}
