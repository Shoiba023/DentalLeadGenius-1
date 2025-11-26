import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, Calendar, TrendingUp, CheckCircle2, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Analytics {
  leadsImported: number;
  leadsContacted: number;
  replies: number;
  demosBooked: number;
  won: number;
  lost: number;
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
    </div>
  );
}
