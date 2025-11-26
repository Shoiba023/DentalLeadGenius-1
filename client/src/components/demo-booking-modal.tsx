import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle2, ExternalLink, Copy } from "lucide-react";

interface DemoBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEMO_URL = "/demo";

export function DemoBookingModal({ open, onOpenChange }: DemoBookingModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    clinicName: "",
    ownerName: "",
    email: "",
    phone: "",
    state: "",
    preferredTime: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  interface BookingData {
    clinicName: string;
    ownerName: string;
    email: string;
    phone?: string;
    state?: string;
    preferredTime?: string;
    notes?: string;
  }

  const bookingMutation = useMutation({
    mutationFn: async (data: BookingData) => {
      return await apiRequest("POST", "/api/bookings", data);
    },
    onSuccess: () => {
      toast({
        title: "Instant Access Granted!",
        description: "Redirecting you to the demo...",
      });
      // Immediately redirect to demo page in same tab
      window.location.href = DEMO_URL;
    },
    onError: (error: Error) => {
      toast({
        title: "Request Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Sanitize empty strings to undefined so Zod treats them as optional
    const sanitizedData = {
      clinicName: formData.clinicName.trim(),
      ownerName: formData.ownerName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || undefined,
      state: formData.state || undefined,
      preferredTime: formData.preferredTime.trim() || undefined,
      notes: formData.notes.trim() || undefined,
    };
    bookingMutation.mutate(sanitizedData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setSubmitted(false);
      setCopied(false);
      setFormData({
        clinicName: "",
        ownerName: "",
        email: "",
        phone: "",
        state: "",
        preferredTime: "",
        notes: "",
      });
    }, 300);
  };

  const handleCopyLink = () => {
    const fullUrl = window.location.origin + DEMO_URL;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast({
      title: "Link Copied!",
      description: "Demo link copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenDemo = () => {
    window.open(DEMO_URL, "_blank");
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <DialogTitle className="text-2xl mb-2">You're In!</DialogTitle>
            <DialogDescription className="text-base mb-6">
              Your instant demo access is ready. We've also sent the link to{" "}
              <span className="font-medium text-foreground">{formData.email}</span>
            </DialogDescription>
            
            <div className="w-full space-y-3">
              <Button 
                className="w-full gap-2" 
                onClick={handleOpenDemo}
                data-testid="button-access-demo"
              >
                <ExternalLink className="h-4 w-4" />
                Access Demo Now
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={handleCopyLink}
                data-testid="button-copy-demo-link"
              >
                <Copy className="h-4 w-4" />
                {copied ? "Copied!" : "Copy Demo Link"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              No scheduling needed - explore at your own pace!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg" data-testid="modal-demo-booking">
        <DialogHeader>
          <DialogTitle>Get Instant Demo Access</DialogTitle>
          <DialogDescription>
            Fill out the form below and get immediate access to explore
            DentalLeadGenius - no waiting, no scheduling needed!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clinicName">Clinic Name *</Label>
            <Input
              id="clinicName"
              value={formData.clinicName}
              onChange={(e) => handleChange("clinicName", e.target.value)}
              required
              data-testid="input-clinic-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerName">Your Name *</Label>
            <Input
              id="ownerName"
              value={formData.ownerName}
              onChange={(e) => handleChange("ownerName", e.target.value)}
              required
              data-testid="input-owner-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="any@email.com"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
              data-testid="input-email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="For priority support"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              data-testid="input-phone"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Select value={formData.state} onValueChange={(val) => handleChange("state", val)}>
              <SelectTrigger data-testid="select-state">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CA">California</SelectItem>
                <SelectItem value="TX">Texas</SelectItem>
                <SelectItem value="FL">Florida</SelectItem>
                <SelectItem value="NY">New York</SelectItem>
                <SelectItem value="IL">Illinois</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">What are you hoping to achieve? (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Tell us about your clinic and goals..."
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={3}
              data-testid="textarea-notes"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={bookingMutation.isPending}
            data-testid="button-submit-booking"
          >
            {bookingMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Getting Your Access...
              </>
            ) : (
              "Get Instant Access"
            )}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            We accept all email addresses - personal or business!
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
