import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  Building2, 
  MessageSquare, 
  Rocket, 
  Sparkles,
  Clock,
  Phone,
  Globe,
  MapPin,
  Stethoscope,
  Bot,
  Target,
  Star,
  Users,
  TrendingUp,
  Loader2
} from "lucide-react";

type OnboardingProgress = {
  id: string;
  clinicId: string;
  userId: string;
  currentStage: number;
  welcomeCompleted: boolean;
  welcomeCompletedAt: string | null;
  setupCompleted: boolean;
  setupCompletedAt: string | null;
  chatbotCompleted: boolean;
  chatbotCompletedAt: string | null;
  optimizationCompleted: boolean;
  optimizationCompletedAt: string | null;
  completedAt: string | null;
  clinicAddress: string | null;
  clinicPhone: string | null;
  clinicWebsite: string | null;
  clinicTimezone: string | null;
  businessHours: string | null;
  services: string[] | null;
  chatbotEnabled: boolean | null;
  chatbotGreeting: string | null;
  chatbotTone: string | null;
  chatbotFocusServices: string[] | null;
  autoFollowupEnabled: boolean | null;
  leadScoringEnabled: boolean | null;
  reviewRequestsEnabled: boolean | null;
  referralProgramEnabled: boolean | null;
  targetLeadsPerMonth: number | null;
};

const STAGES = [
  { 
    id: 1, 
    title: "Welcome", 
    description: "Get started with your dashboard",
    icon: Sparkles,
    color: "bg-blue-500"
  },
  { 
    id: 2, 
    title: "Clinic Setup", 
    description: "Configure your clinic details",
    icon: Building2,
    color: "bg-green-500"
  },
  { 
    id: 3, 
    title: "AI Chatbot", 
    description: "Activate your AI assistant",
    icon: MessageSquare,
    color: "bg-purple-500"
  },
  { 
    id: 4, 
    title: "Optimization", 
    description: "Enable growth automations",
    icon: Rocket,
    color: "bg-amber-500"
  },
];

const DENTAL_SERVICES = [
  "General Dentistry",
  "Cosmetic Dentistry",
  "Orthodontics",
  "Dental Implants",
  "Periodontics",
  "Endodontics",
  "Pediatric Dentistry",
  "Oral Surgery",
  "Teeth Whitening",
  "Veneers",
  "Crowns & Bridges",
  "Dentures",
];

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
];

const CHATBOT_TONES = [
  { value: "professional", label: "Professional & Formal" },
  { value: "friendly", label: "Friendly & Warm" },
  { value: "casual", label: "Casual & Approachable" },
  { value: "empathetic", label: "Empathetic & Caring" },
];

export default function Onboarding() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  // Setup form state
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [clinicWebsite, setClinicWebsite] = useState("");
  const [clinicTimezone, setClinicTimezone] = useState("America/New_York");
  const [businessHours, setBusinessHours] = useState("Mon-Fri: 9:00 AM - 5:00 PM");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  
  // Chatbot form state
  const [chatbotEnabled, setChatbotEnabled] = useState(true);
  const [chatbotGreeting, setChatbotGreeting] = useState("Hi! Welcome to our dental practice. How can I help you today?");
  const [chatbotTone, setChatbotTone] = useState("friendly");
  const [chatbotFocusServices, setChatbotFocusServices] = useState<string[]>([]);
  
  // Optimization form state
  const [autoFollowupEnabled, setAutoFollowupEnabled] = useState(true);
  const [leadScoringEnabled, setLeadScoringEnabled] = useState(true);
  const [reviewRequestsEnabled, setReviewRequestsEnabled] = useState(true);
  const [referralProgramEnabled, setReferralProgramEnabled] = useState(false);
  const [targetLeadsPerMonth, setTargetLeadsPerMonth] = useState(50);

  // Fetch onboarding progress
  const { data: progressData, isLoading } = useQuery<{ hasOnboarding: boolean; progress?: OnboardingProgress }>({
    queryKey: ["/api/onboarding/progress"],
  });

  // Fetch user's clinics
  const { data: clinics } = useQuery<any[]>({
    queryKey: ["/api/clinics"],
  });

  // Initialize onboarding mutation
  const initializeMutation = useMutation({
    mutationFn: async (clinicId: string) => {
      return apiRequest("/api/onboarding/initialize", "POST", { clinicId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/progress"] });
      toast({
        title: "Onboarding Started",
        description: "Let's get your clinic set up!",
      });
    },
  });

  // Complete welcome stage mutation
  const completeWelcomeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/onboarding/complete-welcome", "POST", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/progress"] });
      toast({
        title: "Welcome Complete!",
        description: "Now let's set up your clinic details.",
      });
    },
  });

  // Complete setup stage mutation
  const completeSetupMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/onboarding/complete-setup", "POST", {
        clinicAddress,
        clinicPhone,
        clinicWebsite,
        clinicTimezone,
        businessHours,
        services: selectedServices,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/progress"] });
      toast({
        title: "Clinic Setup Complete!",
        description: "Now let's activate your AI chatbot.",
      });
    },
  });

  // Complete chatbot stage mutation
  const completeChatbotMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/onboarding/complete-chatbot", "POST", {
        chatbotEnabled,
        chatbotGreeting,
        chatbotTone,
        chatbotFocusServices,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/progress"] });
      toast({
        title: "AI Chatbot Activated!",
        description: "Final step: optimize your growth settings.",
      });
    },
  });

  // Complete optimization stage mutation
  const completeOptimizationMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/onboarding/complete-optimization", "POST", {
        autoFollowupEnabled,
        leadScoringEnabled,
        reviewRequestsEnabled,
        referralProgramEnabled,
        targetLeadsPerMonth,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/progress"] });
      toast({
        title: "Setup Complete!",
        description: "Your clinic is ready to generate leads!",
      });
      setTimeout(() => navigate("/dashboard"), 1500);
    },
  });

  // Auto-initialize for new users with clinics
  useEffect(() => {
    if (!isLoading && !progressData?.hasOnboarding && clinics && clinics.length > 0) {
      initializeMutation.mutate(clinics[0].id);
    }
  }, [isLoading, progressData, clinics]);

  // Prefill form data from progress
  useEffect(() => {
    if (progressData?.progress) {
      const p = progressData.progress;
      if (p.clinicAddress) setClinicAddress(p.clinicAddress);
      if (p.clinicPhone) setClinicPhone(p.clinicPhone);
      if (p.clinicWebsite) setClinicWebsite(p.clinicWebsite);
      if (p.clinicTimezone) setClinicTimezone(p.clinicTimezone);
      if (p.businessHours) setBusinessHours(p.businessHours);
      if (p.services) setSelectedServices(p.services);
      if (p.chatbotEnabled !== null) setChatbotEnabled(p.chatbotEnabled);
      if (p.chatbotGreeting) setChatbotGreeting(p.chatbotGreeting);
      if (p.chatbotTone) setChatbotTone(p.chatbotTone);
      if (p.chatbotFocusServices) setChatbotFocusServices(p.chatbotFocusServices);
      if (p.autoFollowupEnabled !== null) setAutoFollowupEnabled(p.autoFollowupEnabled);
      if (p.leadScoringEnabled !== null) setLeadScoringEnabled(p.leadScoringEnabled);
      if (p.reviewRequestsEnabled !== null) setReviewRequestsEnabled(p.reviewRequestsEnabled);
      if (p.referralProgramEnabled !== null) setReferralProgramEnabled(p.referralProgramEnabled);
      if (p.targetLeadsPerMonth !== null) setTargetLeadsPerMonth(p.targetLeadsPerMonth);
    }
  }, [progressData]);

  const progress = progressData?.progress;
  const currentStage = progress?.currentStage || 1;
  const progressPercent = progress?.completedAt ? 100 : ((currentStage - 1) / 4) * 100;

  const toggleService = (service: string) => {
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const toggleChatbotService = (service: string) => {
    setChatbotFocusServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If onboarding is complete, redirect to dashboard
  if (progress?.completedAt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Onboarding Complete!</CardTitle>
            <CardDescription>
              Your clinic is all set up and ready to generate leads.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate("/dashboard")}
              className="w-full"
              data-testid="button-go-to-dashboard"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no clinic exists, prompt to create one
  if (!clinics || clinics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-10 w-10 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Create Your Clinic</CardTitle>
            <CardDescription>
              You need to create a clinic before starting the onboarding process.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate("/dashboard/clinics")}
              className="w-full"
              data-testid="button-create-clinic"
            >
              Create Clinic
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to DentalLeadGenius</h1>
          <p className="text-muted-foreground">
            Let's get your clinic set up in just a few steps
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-muted-foreground">Onboarding Progress</span>
            <span className="text-sm font-medium">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Stage Indicators */}
        <div className="flex justify-between mb-8">
          {STAGES.map((stage) => {
            const isCompleted = 
              (stage.id === 1 && progress?.welcomeCompleted) ||
              (stage.id === 2 && progress?.setupCompleted) ||
              (stage.id === 3 && progress?.chatbotCompleted) ||
              (stage.id === 4 && progress?.optimizationCompleted);
            const isCurrent = currentStage === stage.id;
            
            return (
              <div 
                key={stage.id} 
                className={`flex flex-col items-center ${isCurrent ? 'opacity-100' : 'opacity-60'}`}
              >
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    isCompleted 
                      ? 'bg-green-500 text-white' 
                      : isCurrent 
                        ? stage.color + ' text-white'
                        : 'bg-muted'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <stage.icon className="h-6 w-6" />
                  )}
                </div>
                <span className={`text-xs font-medium ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {stage.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Stage Content */}
        <Card>
          {/* Stage 1: Welcome */}
          {currentStage === 1 && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="h-10 w-10 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Welcome to Your Dashboard!</CardTitle>
                <CardDescription className="text-base">
                  We're excited to help {clinics?.[0]?.name || "your clinic"} grow with AI-powered lead generation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <Bot className="h-8 w-8 text-purple-500 shrink-0" />
                    <div>
                      <h3 className="font-semibold">AI Chatbot</h3>
                      <p className="text-sm text-muted-foreground">Engage visitors and book appointments 24/7</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <Target className="h-8 w-8 text-green-500 shrink-0" />
                    <div>
                      <h3 className="font-semibold">Smart Lead Tracking</h3>
                      <p className="text-sm text-muted-foreground">Score and prioritize your best leads</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <MessageSquare className="h-8 w-8 text-blue-500 shrink-0" />
                    <div>
                      <h3 className="font-semibold">Multi-Channel Outreach</h3>
                      <p className="text-sm text-muted-foreground">Email, SMS, and WhatsApp automation</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-amber-500 shrink-0" />
                    <div>
                      <h3 className="font-semibold">Growth Analytics</h3>
                      <p className="text-sm text-muted-foreground">Track conversions and ROI in real-time</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <Button 
                    size="lg"
                    onClick={() => completeWelcomeMutation.mutate()}
                    disabled={completeWelcomeMutation.isPending}
                    data-testid="button-continue-welcome"
                  >
                    {completeWelcomeMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Let's Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* Stage 2: Clinic Setup */}
          {currentStage === 2 && (
            <>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Clinic Setup</CardTitle>
                    <CardDescription>Configure your clinic's basic information</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="address" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Clinic Address
                    </Label>
                    <Input
                      id="address"
                      placeholder="123 Main St, City, State 12345"
                      value={clinicAddress}
                      onChange={(e) => setClinicAddress(e.target.value)}
                      data-testid="input-clinic-address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      placeholder="(555) 123-4567"
                      value={clinicPhone}
                      onChange={(e) => setClinicPhone(e.target.value)}
                      data-testid="input-clinic-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Website (optional)
                    </Label>
                    <Input
                      id="website"
                      placeholder="https://yourpractice.com"
                      value={clinicWebsite}
                      onChange={(e) => setClinicWebsite(e.target.value)}
                      data-testid="input-clinic-website"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Timezone
                    </Label>
                    <Select value={clinicTimezone} onValueChange={setClinicTimezone}>
                      <SelectTrigger data-testid="select-timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hours" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Business Hours
                  </Label>
                  <Textarea
                    id="hours"
                    placeholder="Mon-Fri: 9:00 AM - 5:00 PM&#10;Sat: 9:00 AM - 1:00 PM&#10;Sun: Closed"
                    value={businessHours}
                    onChange={(e) => setBusinessHours(e.target.value)}
                    rows={3}
                    data-testid="textarea-business-hours"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Services Offered
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {DENTAL_SERVICES.map((service) => (
                      <Badge
                        key={service}
                        variant={selectedServices.includes(service) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleService(service)}
                        data-testid={`badge-service-${service.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {selectedServices.includes(service) && <CheckCircle className="h-3 w-3 mr-1" />}
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={() => completeSetupMutation.mutate()}
                    disabled={completeSetupMutation.isPending}
                    data-testid="button-continue-setup"
                  >
                    {completeSetupMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* Stage 3: AI Chatbot Activation */}
          {currentStage === 3 && (
            <>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>AI Chatbot Activation</CardTitle>
                    <CardDescription>Customize your AI assistant for patient engagement</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bot className="h-8 w-8 text-purple-500" />
                    <div>
                      <h3 className="font-semibold">Enable AI Chatbot</h3>
                      <p className="text-sm text-muted-foreground">Let AI engage visitors on your clinic page</p>
                    </div>
                  </div>
                  <Switch
                    checked={chatbotEnabled}
                    onCheckedChange={setChatbotEnabled}
                    data-testid="switch-chatbot-enabled"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="greeting">Greeting Message</Label>
                  <Textarea
                    id="greeting"
                    placeholder="Enter your chatbot's greeting message..."
                    value={chatbotGreeting}
                    onChange={(e) => setChatbotGreeting(e.target.value)}
                    rows={3}
                    data-testid="textarea-chatbot-greeting"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone">Conversation Tone</Label>
                  <Select value={chatbotTone} onValueChange={setChatbotTone}>
                    <SelectTrigger data-testid="select-chatbot-tone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHATBOT_TONES.map((tone) => (
                        <SelectItem key={tone.value} value={tone.value}>{tone.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Focus Services (AI will highlight these)</Label>
                  <div className="flex flex-wrap gap-2">
                    {(selectedServices.length > 0 ? selectedServices : DENTAL_SERVICES.slice(0, 6)).map((service) => (
                      <Badge
                        key={service}
                        variant={chatbotFocusServices.includes(service) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleChatbotService(service)}
                        data-testid={`badge-focus-${service.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {chatbotFocusServices.includes(service) && <Star className="h-3 w-3 mr-1" />}
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={() => completeChatbotMutation.mutate()}
                    disabled={completeChatbotMutation.isPending}
                    data-testid="button-continue-chatbot"
                  >
                    {completeChatbotMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* Stage 4: Growth Optimization */}
          {currentStage === 4 && (
            <>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                    <Rocket className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle>Growth Optimization</CardTitle>
                    <CardDescription>Configure automation settings to maximize your results</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-6 w-6 text-blue-500" />
                      <div>
                        <h3 className="font-semibold">Automated Follow-ups</h3>
                        <p className="text-sm text-muted-foreground">Send automatic follow-up messages to leads</p>
                      </div>
                    </div>
                    <Switch
                      checked={autoFollowupEnabled}
                      onCheckedChange={setAutoFollowupEnabled}
                      data-testid="switch-auto-followup"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Target className="h-6 w-6 text-green-500" />
                      <div>
                        <h3 className="font-semibold">Lead Scoring</h3>
                        <p className="text-sm text-muted-foreground">Automatically prioritize hot leads</p>
                      </div>
                    </div>
                    <Switch
                      checked={leadScoringEnabled}
                      onCheckedChange={setLeadScoringEnabled}
                      data-testid="switch-lead-scoring"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Star className="h-6 w-6 text-amber-500" />
                      <div>
                        <h3 className="font-semibold">Review Requests</h3>
                        <p className="text-sm text-muted-foreground">Request reviews after completed visits</p>
                      </div>
                    </div>
                    <Switch
                      checked={reviewRequestsEnabled}
                      onCheckedChange={setReviewRequestsEnabled}
                      data-testid="switch-review-requests"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="h-6 w-6 text-purple-500" />
                      <div>
                        <h3 className="font-semibold">Referral Program</h3>
                        <p className="text-sm text-muted-foreground">Encourage patient referrals</p>
                      </div>
                    </div>
                    <Switch
                      checked={referralProgramEnabled}
                      onCheckedChange={setReferralProgramEnabled}
                      data-testid="switch-referral-program"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target">Monthly Lead Target</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="target"
                      type="number"
                      min={10}
                      max={500}
                      value={targetLeadsPerMonth}
                      onChange={(e) => setTargetLeadsPerMonth(parseInt(e.target.value) || 50)}
                      className="w-24"
                      data-testid="input-target-leads"
                    />
                    <span className="text-muted-foreground">leads per month</span>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={() => completeOptimizationMutation.mutate()}
                    disabled={completeOptimizationMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                    data-testid="button-complete-onboarding"
                  >
                    {completeOptimizationMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Complete Setup
                    <CheckCircle className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        {/* Skip Link */}
        <div className="text-center mt-6">
          <Button 
            variant="ghost" 
            className="text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/dashboard")}
            data-testid="button-skip-onboarding"
          >
            Skip for now and go to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
