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
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Mail, CheckCircle2, Building2 } from "lucide-react";

interface DemoAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DemoAccessModal({ open, onOpenChange }: DemoAccessModalProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const sendDemoLinkMutation = useMutation({
    mutationFn: async (data: { email: string; clinicName?: string }) => {
      return await apiRequest("POST", "/api/send-demo-link", data);
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Check your email",
        description: "We've sent you a secure link to access the demo.",
      });
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
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }
    sendDemoLinkMutation.mutate({
      email: email.trim(),
      clinicName: clinicName.trim() || undefined,
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setEmail("");
      setClinicName("");
      setSubmitted(false);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {!submitted ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Get Demo Access</DialogTitle>
              <DialogDescription>
                Enter your email and we'll send you a secure link to access the full demo.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="demo-email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="demo-email"
                  type="email"
                  placeholder="you@clinic.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-demo-email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="demo-clinic" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Clinic Name <span className="text-muted-foreground text-sm">(optional)</span>
                </Label>
                <Input
                  id="demo-clinic"
                  type="text"
                  placeholder="Your Dental Clinic"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  data-testid="input-demo-clinic"
                />
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={sendDemoLinkMutation.isPending}
                data-testid="button-send-demo-link"
              >
                {sendDemoLinkMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Demo Link"
                )}
              </Button>
            </form>
            
            <p className="text-xs text-center text-muted-foreground mt-4">
              We'll email you a secure link that expires in 24 hours. No spam, ever.
            </p>
          </>
        ) : (
          <div className="py-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-xl mb-2">Check Your Email</DialogTitle>
            <DialogDescription className="mb-6">
              We've sent a demo access link to <strong>{email}</strong>. 
              Click the link in your email to explore the platform.
            </DialogDescription>
            <div className="space-y-3">
              <Button onClick={handleClose} className="w-full" data-testid="button-close-demo-modal">
                Got it
              </Button>
              <p className="text-xs text-muted-foreground">
                Didn't receive the email? Check your spam folder or try again.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
