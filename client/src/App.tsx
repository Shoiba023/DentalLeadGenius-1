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
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Pricing from "@/pages/pricing";
import PaymentSuccess from "@/pages/payment-success";
import Contact from "@/pages/contact";
import ClinicDashboardPage from "@/pages/clinic-dashboard";
import AdminAnalytics from "@/pages/admin-analytics";
import AdminLeads from "@/pages/admin-leads";
import AdminOutreach from "@/pages/admin-outreach";
import AdminClinics from "@/pages/admin-clinics";
import AdminClinicDashboard from "@/pages/admin-clinic-dashboard";
import AdminPatientBookings from "@/pages/admin-patient-bookings";
import AdminSequences from "@/pages/admin-sequences";
import AdminUsers from "@/pages/admin-users";
import ClinicPage from "@/pages/clinic-page";
import Onboarding from "@/pages/onboarding";
import PublicOnboarding from "@/pages/public-onboarding";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import Security from "@/pages/security";
import Blog from "@/pages/blog";
import BlogArticle from "@/pages/blog-article";

function DashboardHome() {
  const { user } = useAuth();
  
  if (user?.role === 'clinic') {
    return <ClinicDashboardPage />;
  }
  
  return <AdminAnalytics />;
}

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [location] = useLocation();

  // Redirect to login if trying to access dashboard routes while not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated && location.startsWith("/dashboard")) {
      window.location.href = "/login";
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

  // Check if current path is a public route (no sidebar needed)
  const isLandingRoute = location === "/" || location === "";
  const isDemoRoute = location === "/demo" || location.startsWith("/demo/") || location.startsWith("/demo?");
  const isLoginRoute = location === "/login" || location.startsWith("/login");
  const isSignupRoute = location === "/signup" || location.startsWith("/signup");
  const isPricingRoute = location === "/pricing" || location.startsWith("/pricing");
  const isPaymentRoute = location.startsWith("/payment/");
  const isClinicRoute = location.startsWith("/clinic/");
  const isPublicOnboardingRoute = location === "/onboarding" || location.startsWith("/onboarding");
  const isContactRoute = location === "/contact" || location.startsWith("/contact");
  const isPrivacyRoute = location === "/privacy-policy";
  const isTermsRoute = location === "/terms-of-service";
  const isSecurityRoute = location === "/security";
  const isBlogRoute = location === "/blog" || location.startsWith("/blog/");
  
  // Public routes - always show without sidebar (for both authenticated and unauthenticated users)
  const isPublicRoute = isLandingRoute || isDemoRoute || isLoginRoute || isSignupRoute || isPricingRoute || isPaymentRoute || isClinicRoute || isPublicOnboardingRoute || isContactRoute || isPrivacyRoute || isTermsRoute || isSecurityRoute || isBlogRoute;
  
  if (isPublicRoute) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/demo" component={Demo} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/payment/success" component={PaymentSuccess} />
        <Route path="/onboarding" component={PublicOnboarding} />
        <Route path="/contact" component={Contact} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/terms-of-service" component={TermsOfService} />
        <Route path="/security" component={Security} />
        <Route path="/blog" component={Blog} />
        <Route path="/blog/:slug" component={BlogArticle} />
        <Route path="/clinic/:slug" component={ClinicPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Dashboard routes require authentication
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/demo" component={Demo} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/payment/success" component={PaymentSuccess} />
        <Route path="/onboarding" component={PublicOnboarding} />
        <Route path="/contact" component={Contact} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/terms-of-service" component={TermsOfService} />
        <Route path="/security" component={Security} />
        <Route path="/blog" component={Blog} />
        <Route path="/blog/:slug" component={BlogArticle} />
        <Route path="/clinic/:slug" component={ClinicPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Authenticated dashboard routes with sidebar
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
              <Route path="/dashboard" component={DashboardHome} />
              <Route path="/dashboard/leads" component={AdminLeads} />
              <Route path="/dashboard/outreach" component={AdminOutreach} />
              <Route path="/dashboard/sequences" component={AdminSequences} />
              <Route path="/dashboard/clinics" component={AdminClinics} />
              <Route path="/dashboard/clinics/:id" component={AdminClinicDashboard} />
              <Route path="/dashboard/patient-bookings" component={AdminPatientBookings} />
              <Route path="/dashboard/users" component={AdminUsers} />
              <Route path="/dashboard/onboarding" component={Onboarding} />
              <Route path="/demo" component={Demo} />
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
