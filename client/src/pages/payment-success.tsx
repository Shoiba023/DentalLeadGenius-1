import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Copy, ArrowRight, Mail, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentResult {
  success: boolean;
  message: string;
  email?: string;
  clinicName?: string;
  tempPassword?: string;
}

export default function PaymentSuccessPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");

    if (!sessionId) {
      setError("No session ID found");
      setLoading(false);
      return;
    }

    fetch(`/api/checkout/success?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setResult(data);
        } else {
          setError(data.message || "Payment processing failed");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to process payment");
        setLoading(false);
      });
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Processing your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">:(</span>
            </div>
            <CardTitle className="text-xl">Payment Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => setLocation("/pricing")} className="w-full" data-testid="button-try-again">
              Try Again
            </Button>
            <Button variant="outline" onClick={() => setLocation("/")} className="w-full" data-testid="button-go-home">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Welcome to DentalLeadGenius!</CardTitle>
          <CardDescription>
            Your payment was successful. {result?.clinicName && `Clinic "${result.clinicName}" has been created.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {result?.tempPassword && (
            <div className="bg-muted p-4 rounded-lg space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Key className="w-4 h-4" />
                Your Login Credentials
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="font-mono" data-testid="text-email">{result.email}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(result.email!, "Email")}
                    data-testid="button-copy-email"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Temporary Password</div>
                    <div className="font-mono" data-testid="text-password">{result.tempPassword}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(result.tempPassword!, "Password")}
                    data-testid="button-copy-password"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Save these credentials - you'll need them to log in.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Link href="/login">
              <Button className="w-full" size="lg" data-testid="button-login-now">
                Log In Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full" data-testid="button-back-home">
                Back to Home
              </Button>
            </Link>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Need help? Contact us at support@dentalleadgenius.com</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
