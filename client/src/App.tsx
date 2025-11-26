import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Demo from "@/pages/demo";
import AdminAnalytics from "@/pages/admin-analytics";
import AdminLeads from "@/pages/admin-leads";
import AdminOutreach from "@/pages/admin-outreach";
import AdminClinics from "@/pages/admin-clinics";
import AdminClinicDashboard from "@/pages/admin-clinic-dashboard";
import AdminPatientBookings from "@/pages/admin-patient-bookings";
import AdminSequences from "@/pages/admin-sequences";
import ClinicPage from "@/pages/clinic-page";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  // Redirect to login if trying to access admin routes while not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated && location.startsWith("/admin")) {
      window.location.href = "/api/login";
    }
  }, [isLoading, isAuthenticated, location]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Public routes that work for BOTH authenticated and unauthenticated users
  // These pages should always show without the admin sidebar
  if (location === "/demo" || location.startsWith("/clinic/")) {
    return (
      <Switch>
        <Route path="/demo" component={Demo} />
        <Route path="/clinic/:slug" component={ClinicPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Landing page for unauthenticated users
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/demo" component={Demo} />
        <Route path="/clinic/:slug" component={ClinicPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Authenticated admin routes with sidebar
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-auto bg-muted/10">
            <Switch>
              <Route path="/" component={AdminAnalytics} />
              <Route path="/admin" component={AdminAnalytics} />
              <Route path="/admin/leads" component={AdminLeads} />
              <Route path="/admin/outreach" component={AdminOutreach} />
              <Route path="/admin/sequences" component={AdminSequences} />
              <Route path="/admin/clinics" component={AdminClinics} />
              <Route path="/admin/clinics/:id" component={AdminClinicDashboard} />
              <Route path="/admin/patient-bookings" component={AdminPatientBookings} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
