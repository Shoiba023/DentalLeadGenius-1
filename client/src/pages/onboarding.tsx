import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Building2, 
  Clock,
  Phone,
  Globe,
  MapPin,
  Stethoscope,
  Mail,
  MessageSquare,
  Loader2,
  Zap,
  Sparkles
} from "lucide-react";
import { SiGmail, SiTwilio } from "react-icons/si";

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
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Phoenix", label: "Arizona (AZ)" },
];

const STEPS = [
  { id: 1, title: "Clinic Info", icon: Building2 },
  { id: 2, title: "Services & Hours", icon: Stethoscope },
  { id: 3, title: "Connect Channels", icon: MessageSquare },
];

export default function Onboarding() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Clinic Info
  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [clinicWebsite, setClinicWebsite] = useState("");
  const [clinicTimezone, setClinicTimezone] = useState("America/New_York");
  
  // Step 2: Services & Hours
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [businessHours, setBusinessHours] = useState("Mon-Fri: 9:00 AM - 5:00 PM\nSat: 9:00 AM - 1:00 PM\nSun: Closed");
  
  // Step 3: Connect Channels
  const [emailProvider, setEmailProvider] = useState<string>("");
  const [smsEnabled, setSmsEnabled] = useState(false);

  // Fetch user's clinics
  const { data: clinics, isLoading: clinicsLoading } = useQuery<any[]>({
    queryKey: ["/api/clinics"],
  });

  // Pre-fill with existing clinic data if available
  useEffect(() => {
    if (clinics && clinics.length > 0) {
      const clinic = clinics[0];
      if (clinic.name) setClinicName(clinic.name);
    }
  }, [clinics]);

  // Save clinic mutation
  const saveClinicMutation = useMutation({
    mutationFn: async (data: any) => {
      if (clinics && clinics.length > 0) {
        return apiRequest("PUT", `/api/clinics/${clinics[0].id}`, data);
      } else {
        return apiRequest("POST", "/api/clinics", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinics"] });
    },
  });

  // Complete onboarding mutation
  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      const clinicData = {
        name: clinicName,
        address: clinicAddress,
        phone: clinicPhone,
        website: clinicWebsite,
        timezone: clinicTimezone,
        services: selectedServices,
        businessHours: businessHours,
        emailProvider: emailProvider,
        smsEnabled: smsEnabled,
      };
      
      if (clinics && clinics.length > 0) {
        return apiRequest("POST", `/api/clinics/${clinics[0].id}/onboarding`, clinicData);
      } else {
        return apiRequest("POST", "/api/clinics/quick-setup", clinicData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinics"] });
      toast({
        title: "Setup Complete!",
        description: "Your clinic is ready to start generating leads.",
      });
      setTimeout(() => navigate("/dashboard"), 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete setup",
        variant: "destructive",
      });
    },
  });

  const toggleService = (service: string) => {
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!clinicName.trim()) {
        toast({ title: "Required", description: "Please enter your clinic name", variant: "destructive" });
        return;
      }
    }
    if (currentStep === 2) {
      if (selectedServices.length === 0) {
        toast({ title: "Required", description: "Please select at least one service", variant: "destructive" });
        return;
      }
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboardingMutation.mutate();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progressPercent = (currentStep / 3) * 100;

  if (clinicsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            <Zap className="h-4 w-4" />
            Quick Setup (3 min)
          </div>
          <h1 className="text-2xl font-bold mb-2" data-testid="text-onboarding-title">
            Set Up Your Clinic
          </h1>
          <p className="text-muted-foreground">
            Complete these 3 quick steps to start generating leads
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            {STEPS.map((step) => (
              <div 
                key={step.id}
                className={`flex items-center gap-2 ${
                  step.id === currentStep ? 'text-primary font-medium' : 
                  step.id < currentStep ? 'text-green-600' : 'text-muted-foreground'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  step.id < currentStep ? 'bg-green-100 text-green-600 dark:bg-green-900/30' :
                  step.id === currentStep ? 'bg-primary text-primary-foreground' : 
                  'bg-muted'
                }`}>
                  {step.id < currentStep ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <span className="hidden sm:inline text-sm">{step.title}</span>
              </div>
            ))}
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <Card>
          {/* Step 1: Clinic Info */}
          {currentStep === 1 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Clinic Information
                </CardTitle>
                <CardDescription>
                  Tell us about your dental practice
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Clinic Name *</Label>
                  <Input
                    id="name"
                    placeholder="Bright Smile Dental"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    data-testid="input-clinic-name"
                  />
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
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
                      Website
                    </Label>
                    <Input
                      id="website"
                      placeholder="https://yourpractice.com"
                      value={clinicWebsite}
                      onChange={(e) => setClinicWebsite(e.target.value)}
                      data-testid="input-clinic-website"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
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
                        <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 2: Services & Hours */}
          {currentStep === 2 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  Services & Hours
                </CardTitle>
                <CardDescription>
                  Select the services you offer and your business hours
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Services Offered *</Label>
                  <p className="text-sm text-muted-foreground">Click to select your services</p>
                  <div className="flex flex-wrap gap-2">
                    {DENTAL_SERVICES.map((service) => (
                      <Badge
                        key={service}
                        variant={selectedServices.includes(service) ? "default" : "outline"}
                        className="cursor-pointer px-3 py-1.5 text-sm"
                        onClick={() => toggleService(service)}
                        data-testid={`badge-service-${service.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {selectedServices.includes(service) && (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        )}
                        {service}
                      </Badge>
                    ))}
                  </div>
                  {selectedServices.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hours" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Business Hours
                  </Label>
                  <Textarea
                    id="hours"
                    placeholder="Mon-Fri: 9:00 AM - 5:00 PM"
                    value={businessHours}
                    onChange={(e) => setBusinessHours(e.target.value)}
                    rows={4}
                    data-testid="textarea-business-hours"
                  />
                </div>
              </CardContent>
            </>
          )}

          {/* Step 3: Connect Channels */}
          {currentStep === 3 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Connect Channels
                </CardTitle>
                <CardDescription>
                  Set up email and SMS for automated outreach (optional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email Connection */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Connection
                  </Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setEmailProvider(emailProvider === 'gmail' ? '' : 'gmail')}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                        emailProvider === 'gmail' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover-elevate'
                      }`}
                      data-testid="button-connect-gmail"
                    >
                      <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <SiGmail className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Gmail</div>
                        <div className="text-xs text-muted-foreground">Connect your Gmail</div>
                      </div>
                      {emailProvider === 'gmail' && (
                        <CheckCircle className="h-5 w-5 text-primary ml-auto" />
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setEmailProvider(emailProvider === 'resend' ? '' : 'resend')}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                        emailProvider === 'resend' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover-elevate'
                      }`}
                      data-testid="button-connect-resend"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Resend</div>
                        <div className="text-xs text-muted-foreground">Professional emails</div>
                      </div>
                      {emailProvider === 'resend' && (
                        <CheckCircle className="h-5 w-5 text-primary ml-auto" />
                      )}
                    </button>
                  </div>
                </div>

                {/* SMS/Phone Connection */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    SMS Connection
                  </Label>
                  <button
                    type="button"
                    onClick={() => setSmsEnabled(!smsEnabled)}
                    className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                      smsEnabled 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover-elevate'
                    }`}
                    data-testid="button-connect-twilio"
                  >
                    <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <SiTwilio className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Twilio SMS</div>
                      <div className="text-xs text-muted-foreground">Send SMS to leads automatically</div>
                    </div>
                    {smsEnabled && (
                      <CheckCircle className="h-5 w-5 text-primary ml-auto" />
                    )}
                  </button>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">You can set these up later</p>
                      <p className="text-xs text-muted-foreground">
                        Email and SMS connections can be configured anytime from your settings
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between p-6 pt-0 gap-3">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={completeOnboardingMutation.isPending}
              data-testid="button-next"
            >
              {completeOnboardingMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {currentStep === 3 ? (
                <>
                  Complete Setup
                  <CheckCircle className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Skip option */}
        <div className="text-center mt-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm text-muted-foreground hover:text-foreground"
            data-testid="button-skip-onboarding"
          >
            Skip for now, I'll set up later
          </button>
        </div>
      </div>
    </div>
  );
}
