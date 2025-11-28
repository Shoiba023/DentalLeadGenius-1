import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, ArrowLeft, CreditCard, Shield, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface PricingPackage {
  id: string;
  name: string;
  description: string;
  setupFee: number;
  monthlyFee: number;
  features: string[];
  clinicLimit: number;
  popular: boolean;
}

export default function PricingPage() {
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<PricingPackage | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [formData, setFormData] = useState({
    clinicName: "",
    ownerName: "",
    email: "",
  });

  const { data: packages, isLoading } = useQuery<PricingPackage[]>({
    queryKey: ["/api/pricing"],
  });

  const checkoutMutation = useMutation({
    mutationFn: async (data: { packageId: string; clinicName: string; ownerName: string; email: string }) => {
      const response = await apiRequest("POST", "/api/checkout/create-session", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Checkout failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSelectPackage = (pkg: PricingPackage) => {
    setSelectedPackage(pkg);
    setCheckoutOpen(true);
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) return;

    checkoutMutation.mutate({
      packageId: selectedPackage.id,
      ...formData,
    });
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(cents);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="link-back-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="sm" data-testid="button-login">
              Log In
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get started with DentalLeadGenius and transform your patient acquisition with AI-powered automation.
          </p>
        </div>

        <div className="flex items-center justify-center gap-6 mb-12">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>Secure payment</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="w-4 h-4" />
            <span>All major cards accepted</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="w-4 h-4" />
            <span>Instant access</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {packages?.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative flex flex-col ${pkg.popular ? "border-primary shadow-lg scale-105" : ""}`}
              data-testid={`card-package-${pkg.id}`}
            >
              {pkg.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                <CardDescription className="min-h-[60px]">{pkg.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="mb-6">
                  <div className="text-3xl font-bold">{formatPrice(pkg.monthlyFee)}<span className="text-lg font-normal text-muted-foreground">/month</span></div>
                  <div className="text-sm text-muted-foreground">+ {formatPrice(pkg.setupFee)} one-time setup fee</div>
                </div>
                <ul className="space-y-3">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  size="lg"
                  variant={pkg.popular ? "default" : "outline"}
                  onClick={() => handleSelectPackage(pkg)}
                  data-testid={`button-select-${pkg.id}`}
                >
                  Get Started
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12 text-muted-foreground">
          <p>All plans include a 30-day money-back guarantee. No questions asked.</p>
          <p className="mt-2">
            Have questions?{" "}
            <a href="mailto:support@dentalleadgenius.com" className="text-primary hover:underline">
              Contact our sales team
            </a>
          </p>
        </div>
      </main>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Order</DialogTitle>
            <DialogDescription>
              {selectedPackage && (
                <span>
                  {selectedPackage.name}: {formatPrice(selectedPackage.setupFee)} setup + {formatPrice(selectedPackage.monthlyFee)}/month
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCheckout} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clinicName">Clinic Name</Label>
              <Input
                id="clinicName"
                placeholder="Bright Smile Dental"
                value={formData.clinicName}
                onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                required
                data-testid="input-clinic-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerName">Your Name</Label>
              <Input
                id="ownerName"
                placeholder="Dr. John Smith"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                required
                data-testid="input-owner-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@brightsmile.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                data-testid="input-email"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={checkoutMutation.isPending}
              data-testid="button-proceed-checkout"
            >
              {checkoutMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Proceed to Checkout
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Secure payment powered by Stripe. Your card details are encrypted.
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
