import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowLeft, CreditCard, Shield, Zap } from "lucide-react";

const STRIPE_PAYMENT_LINKS: Record<string, { monthly: string; setup: string }> = {
  essential: {
    monthly: "https://buy.stripe.com/dRm8wQ2zr9m0fdh3WU0ZW02",
    setup: "https://buy.stripe.com/dRmeVea1T41GfdheBy0ZW01",
  },
  growth: {
    monthly: "https://buy.stripe.com/5kQ8wQ2zr2XC3uzeBy0ZW04",
    setup: "https://buy.stripe.com/eVq9AUa1T7dS7KP8da0ZW03",
  },
  elite: {
    monthly: "https://buy.stripe.com/4gMfZi6PHaq49SXctq0ZW06",
    setup: "https://buy.stripe.com/eVq9AU1vn1Tye9d9he0ZW05",
  },
};

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
  const { data: packages, isLoading } = useQuery<PricingPackage[]>({
    queryKey: ["/api/pricing"],
  });

  const handleSubscribe = (packageId: string) => {
    const links = STRIPE_PAYMENT_LINKS[packageId];
    if (links) {
      window.location.href = links.monthly;
    }
  };

  const handleSetupFee = (packageId: string) => {
    const links = STRIPE_PAYMENT_LINKS[packageId];
    if (links) {
      window.location.href = links.setup;
    }
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
              <CardFooter className="flex flex-col gap-2">
                <Button
                  className="w-full"
                  size="lg"
                  variant={pkg.popular ? "default" : "outline"}
                  onClick={() => handleSubscribe(pkg.id)}
                  data-testid={`button-subscribe-${pkg.id}`}
                >
                  Get Started - Monthly
                </Button>
                <Button
                  className="w-full"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSetupFee(pkg.id)}
                  data-testid={`button-setup-${pkg.id}`}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay Setup Fee
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
    </div>
  );
}
