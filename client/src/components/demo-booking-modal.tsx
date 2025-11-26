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
import { Loader2, CheckCircle2 } from "lucide-react";

interface DemoBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

  const bookingMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/bookings", data);
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Demo Booked Successfully!",
        description: "We'll contact you shortly to confirm your appointment.",
      });
      setTimeout(() => {
        onOpenChange(false);
        setSubmitted(false);
        setFormData({
          clinicName: "",
          ownerName: "",
          email: "",
          phone: "",
          state: "",
          preferredTime: "",
          notes: "",
        });
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    bookingMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <DialogTitle className="text-2xl mb-2">Thank You!</DialogTitle>
            <DialogDescription className="text-base">
              Your demo has been booked. We'll be in touch shortly!
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" data-testid="modal-demo-booking">
        <DialogHeader>
          <DialogTitle>Book Your Free Demo</DialogTitle>
          <DialogDescription>
            Fill out the form below and we'll schedule a personalized demonstration of
            DentalLeadGenius.
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                required
                data-testid="input-phone"
              />
            </div>
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
            <Label htmlFor="preferredTime">Preferred Time</Label>
            <Input
              id="preferredTime"
              placeholder="e.g., Monday 2-4 PM"
              value={formData.preferredTime}
              onChange={(e) => handleChange("preferredTime", e.target.value)}
              data-testid="input-preferred-time"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
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
                Booking...
              </>
            ) : (
              "Book Demo"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
