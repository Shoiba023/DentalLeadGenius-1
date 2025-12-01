import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Loader2, Building2, User, Mail, Phone, MapPin, MessageSquare } from "lucide-react";

interface DemoRequestFormProps {
  onSuccess?: () => void;
  className?: string;
}

export function DemoRequestForm({ onSuccess, className }: DemoRequestFormProps) {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    clinicName: "",
    contactName: "",
    email: "",
    phone: "",
    city: "",
    message: "",
  });

  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/demo-request", data);
      return response.json();
    },
    onSuccess: (result) => {
      if (result.ok) {
        setSubmitted(true);
        setFormData({
          clinicName: "",
          contactName: "",
          email: "",
          phone: "",
          city: "",
          message: "",
        });
        toast({
          title: "Request Submitted",
          description: "We'll contact you soon!",
        });
        onSuccess?.();
      } else {
        toast({
          title: "Submission Failed",
          description: result.error || "Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  if (submitted) {
    return (
      <Card className={className}>
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold" data-testid="text-demo-success-title">
              Thank you!
            </h3>
            <p className="text-muted-foreground max-w-sm" data-testid="text-demo-success-message">
              Your demo request is received. Our team will contact you soon.
            </p>
            <Button
              variant="outline"
              onClick={() => setSubmitted(false)}
              data-testid="button-submit-another"
            >
              Submit Another Request
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle data-testid="text-demo-form-title">Book a Demo</CardTitle>
        <CardDescription>
          Fill out the form below and our team will contact you to schedule a personalized demo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clinicName" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Clinic Name *
            </Label>
            <Input
              id="clinicName"
              placeholder="Your Dental Clinic"
              value={formData.clinicName}
              onChange={(e) => handleChange("clinicName", e.target.value)}
              required
              data-testid="input-clinic-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Contact Name *
            </Label>
            <Input
              id="contactName"
              placeholder="Dr. John Smith"
              value={formData.contactName}
              onChange={(e) => handleChange("contactName", e.target.value)}
              required
              data-testid="input-contact-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@clinic.com"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
              data-testid="input-email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone *
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              required
              data-testid="input-phone"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              City *
            </Label>
            <Input
              id="city"
              placeholder="New York"
              value={formData.city}
              onChange={(e) => handleChange("city", e.target.value)}
              required
              data-testid="input-city"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Message (optional)
            </Label>
            <Textarea
              id="message"
              placeholder="Tell us about your clinic and what you're looking for..."
              value={formData.message}
              onChange={(e) => handleChange("message", e.target.value)}
              rows={3}
              data-testid="input-message"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={submitMutation.isPending}
            data-testid="button-submit-demo"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Request Demo"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
