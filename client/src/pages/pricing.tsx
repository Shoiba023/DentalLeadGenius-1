import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Check, 
  ArrowLeft, 
  CreditCard, 
  Shield, 
  Zap, 
  Calendar,
  TrendingUp,
  Phone,
  MessageSquare,
  Users,
  Clock,
  Star,
  ArrowRight,
  CheckCircle2,
  X,
  Sparkles
} from "lucide-react";
import logoFull from "@/assets/logo/logo-full.png";
import { SITE_NAME, SUPPORT_EMAIL } from "@shared/config";
import { Footer } from "@/components/footer";

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
    monthly: "https://buy.stripe.com/eVq9AU1vn1Tye9d9he0ZW05",
    setup: "https://buy.stripe.com/4gMfZi6PHaq49SXctq0ZW06",
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

type PaymentType = "monthly" | "setup";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const tierROI = {
  essential: {
    statement: "Recover 2-5 lost patients monthly",
    value: "$6,000-$15,000/year in recovered revenue",
    icon: TrendingUp
  },
  growth: {
    statement: "Convert 5-15 more leads monthly", 
    value: "$15,000-$45,000/year in new revenue",
    icon: Users
  },
  elite: {
    statement: "Full practice automation",
    value: "$50,000+/year in growth + time savings",
    icon: Zap
  }
};

const tierFAQs: Record<string, Array<{ q: string; a: string }>> = {
  essential: [
    { q: "Is this enough for a solo practice?", a: "Absolutely. Essential covers all the fundamentals - AI chatbot, lead capture, and basic automation. Perfect for practices handling 10-30 new patient inquiries per month." },
    { q: "Can I upgrade later?", a: "Yes, upgrade anytime with no penalty. We'll pro-rate your current plan and apply it to your new tier." },
    { q: "What if I need more than 1 clinic?", a: "Essential supports 1 location. For multi-location practices, Growth or Elite plans include 3-5 clinic licenses." }
  ],
  growth: [
    { q: "What's included in priority support?", a: "Direct access to our support team with 4-hour response guarantee during business hours. Plus dedicated onboarding assistance." },
    { q: "How does multi-channel outreach work?", a: "We automate follow-ups across email, SMS, and social channels based on lead preferences and engagement patterns." },
    { q: "Can I customize the AI responses?", a: "Yes, we train your AI on your specific services, pricing, and brand voice during the setup process." }
  ],
  elite: [
    { q: "What does 'dedicated account manager' mean?", a: "You get a named contact who knows your practice inside-out. Monthly strategy calls, quarterly reviews, and proactive optimization." },
    { q: "Is custom integration included?", a: "Yes, we integrate with your existing systems - practice management software, CRMs, and scheduling tools at no extra cost." },
    { q: "What's the white-label option?", a: "Your patients see your branding everywhere. The chatbot, emails, and booking pages all match your clinic's identity." }
  ]
};

const comparisonFeatures = [
  { feature: "AI Chatbot", essential: true, growth: true, elite: true },
  { feature: "Lead Capture Forms", essential: true, growth: true, elite: true },
  { feature: "Basic Analytics", essential: true, growth: true, elite: true },
  { feature: "Email Follow-ups", essential: "3-step", growth: "5-step", elite: "Unlimited" },
  { feature: "SMS Automation", essential: false, growth: true, elite: true },
  { feature: "Multi-Channel Outreach", essential: false, growth: true, elite: true },
  { feature: "Patient Reactivation", essential: false, growth: true, elite: true },
  { feature: "Advanced Analytics", essential: false, growth: true, elite: true },
  { feature: "A/B Testing", essential: false, growth: false, elite: true },
  { feature: "Custom Integrations", essential: false, growth: false, elite: true },
  { feature: "White-Label Branding", essential: false, growth: false, elite: true },
  { feature: "Dedicated Account Manager", essential: false, growth: false, elite: true },
  { feature: "Clinic Locations", essential: "1", growth: "3", elite: "5" },
  { feature: "Support", essential: "Email", growth: "Priority", elite: "24/7 Dedicated" },
];

export default function PricingPage() {
  const { data: packages, isLoading } = useQuery<PricingPackage[]>({
    queryKey: ["/api/pricing"],
  });

  const [selectedPaymentTypes, setSelectedPaymentTypes] = useState<Record<string, PaymentType>>({
    essential: "monthly",
    growth: "monthly",
    elite: "monthly",
  });

  const handlePaymentTypeChange = (packageId: string, type: PaymentType) => {
    setSelectedPaymentTypes(prev => ({
      ...prev,
      [packageId]: type,
    }));
  };

  const handleCheckout = (packageId: string) => {
    const links = STRIPE_PAYMENT_LINKS[packageId];
    const paymentType = selectedPaymentTypes[packageId] || "monthly";
    if (links) {
      window.location.href = paymentType === "monthly" ? links.monthly : links.setup;
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
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href="/">
              <img 
                src={logoFull} 
                alt="DentalLeadGenius" 
                className="h-7 sm:h-8 md:h-9 w-auto cursor-pointer object-contain"
                data-testid="link-logo"
              />
            </Link>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild data-testid="link-back-home">
                <Link href="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Link>
              </Button>
              <Button variant="outline" asChild data-testid="button-login">
                <Link href="/login">Log In</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative py-16 sm:py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <motion.div 
              className="text-center max-w-3xl mx-auto"
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" data-testid="text-page-title">
                Simple, Transparent Pricing
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8">
                Choose the plan that fits your practice. All plans include a <span className="font-semibold text-foreground">30-day money-back guarantee</span>.
              </p>
              
              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span>HIPAA-Friendly</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  <span>Cancel Anytime</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>48-Hour Setup</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-8 sm:py-12">
          <div className="container mx-auto px-4 sm:px-6">
            <motion.div 
              className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              {packages?.map((pkg) => {
                const roi = tierROI[pkg.id as keyof typeof tierROI];
                const faqs = tierFAQs[pkg.id] || [];
                const ROIIcon = roi?.icon || TrendingUp;
                
                return (
                  <motion.div key={pkg.id} variants={fadeInUp}>
                    <Card
                      className={`relative flex flex-col h-full ${pkg.popular ? "border-primary shadow-xl ring-2 ring-primary/20" : "shadow-md"}`}
                      data-testid={`card-package-${pkg.id}`}
                    >
                      {pkg.popular && (
                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1">
                          Most Popular
                        </Badge>
                      )}
                      
                      <CardHeader className="pb-4">
                        <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                        <CardDescription className="min-h-[48px]">{pkg.description}</CardDescription>
                      </CardHeader>
                      
                      <CardContent className="flex-1 space-y-6">
                        {/* Pricing */}
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold">{formatPrice(pkg.monthlyFee)}</span>
                            <span className="text-muted-foreground">/month</span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            + {formatPrice(pkg.setupFee)} one-time setup
                          </div>
                        </div>
                        
                        {/* ROI Statement */}
                        {roi && (
                          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-primary font-medium mb-1">
                              <ROIIcon className="w-4 h-4" />
                              <span className="text-sm">{roi.statement}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{roi.value}</p>
                          </div>
                        )}
                        
                        {/* Features */}
                        <ul className="space-y-3">
                          {pkg.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        
                        {/* Tier FAQ */}
                        {faqs.length > 0 && (
                          <div className="pt-4 border-t">
                            <p className="text-sm font-medium mb-3">Common Questions</p>
                            <Accordion type="single" collapsible className="space-y-2">
                              {faqs.map((faq, idx) => (
                                <AccordionItem 
                                  key={idx} 
                                  value={`faq-${pkg.id}-${idx}`}
                                  className="border rounded-lg px-3 bg-muted/30"
                                >
                                  <AccordionTrigger className="text-left text-xs hover:no-underline py-3">
                                    {faq.q}
                                  </AccordionTrigger>
                                  <AccordionContent className="text-xs text-muted-foreground pb-3">
                                    {faq.a}
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                          </div>
                        )}
                      </CardContent>
                      
                      <CardFooter className="flex flex-col gap-3 pt-6">
                        {/* Payment Toggle */}
                        <div className="w-full">
                          <div className="relative flex items-center bg-muted rounded-full p-1 h-10">
                            <div
                              className={`absolute h-8 rounded-full bg-primary shadow-md transition-all duration-300 ease-out ${
                                selectedPaymentTypes[pkg.id] === "monthly" 
                                  ? "left-1 w-[calc(50%-4px)]" 
                                  : "left-[calc(50%+2px)] w-[calc(50%-4px)]"
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => handlePaymentTypeChange(pkg.id, "monthly")}
                              className={`relative z-10 flex-1 h-8 text-xs font-medium rounded-full transition-colors duration-200 ${
                                selectedPaymentTypes[pkg.id] === "monthly"
                                  ? "text-primary-foreground"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                              data-testid={`toggle-monthly-${pkg.id}`}
                            >
                              Monthly
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePaymentTypeChange(pkg.id, "setup")}
                              className={`relative z-10 flex-1 h-8 text-xs font-medium rounded-full transition-colors duration-200 ${
                                selectedPaymentTypes[pkg.id] === "setup"
                                  ? "text-primary-foreground"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                              data-testid={`toggle-setup-${pkg.id}`}
                            >
                              Setup Only
                            </button>
                          </div>
                        </div>
                        
                        <Button
                          className="w-full"
                          size="lg"
                          variant={pkg.popular ? "default" : "outline"}
                          onClick={() => handleCheckout(pkg.id)}
                          data-testid={`button-checkout-${pkg.id}`}
                        >
                          Get Started
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Compare Plans Table */}
        <section className="py-16 sm:py-20 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <div className="text-center mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold mb-3">Compare All Features</h2>
                <p className="text-muted-foreground">See exactly what's included in each plan</p>
              </div>
              
              <div className="max-w-5xl mx-auto overflow-x-auto">
                <table className="w-full border-collapse" data-testid="table-compare-plans">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-4 px-4 font-medium">Feature</th>
                      <th className="text-center py-4 px-4 font-medium">Essential</th>
                      <th className="text-center py-4 px-4 font-medium">
                        <span className="inline-flex items-center gap-1">
                          Growth
                          <Star className="w-4 h-4 text-primary fill-primary" />
                        </span>
                      </th>
                      <th className="text-center py-4 px-4 font-medium">Elite</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFeatures.map((row, idx) => (
                      <tr key={row.feature} className={idx % 2 === 0 ? "bg-background" : ""}>
                        <td className="py-3 px-4 text-sm">{row.feature}</td>
                        <td className="py-3 px-4 text-center">
                          {typeof row.essential === "boolean" ? (
                            row.essential ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
                            )
                          ) : (
                            <span className="text-sm">{row.essential}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center bg-primary/5">
                          {typeof row.growth === "boolean" ? (
                            row.growth ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
                            )
                          ) : (
                            <span className="text-sm font-medium">{row.growth}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {typeof row.elite === "boolean" ? (
                            row.elite ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
                            )
                          ) : (
                            <span className="text-sm">{row.elite}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </section>

        {/* General FAQ */}
        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <div className="text-center mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold mb-3">Frequently Asked Questions</h2>
                <p className="text-muted-foreground">Quick answers to common pricing questions</p>
              </div>
              
              <div className="max-w-3xl mx-auto">
                <Accordion type="single" collapsible className="space-y-3">
                  <AccordionItem value="faq-1" className="border rounded-lg px-4 sm:px-6 bg-background shadow-sm">
                    <AccordionTrigger className="text-left font-medium hover:no-underline text-sm sm:text-base py-4">
                      What's included in the setup fee?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4 text-sm">
                      Full implementation: AI training on your services, chatbot configuration, integration with your systems, branded templates, and a dedicated onboarding specialist. Most clinics are live within 48 hours.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="faq-2" className="border rounded-lg px-4 sm:px-6 bg-background shadow-sm">
                    <AccordionTrigger className="text-left font-medium hover:no-underline text-sm sm:text-base py-4">
                      Can I change plans later?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4 text-sm">
                      Absolutely. Upgrade anytime to access more features. Downgrade at any billing cycle. We'll pro-rate everything fairly.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="faq-3" className="border rounded-lg px-4 sm:px-6 bg-background shadow-sm">
                    <AccordionTrigger className="text-left font-medium hover:no-underline text-sm sm:text-base py-4">
                      Is there a contract or commitment?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4 text-sm">
                      No long-term contracts. Monthly billing, cancel anytime. We believe our results will keep you around, not a contract.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="faq-4" className="border rounded-lg px-4 sm:px-6 bg-background shadow-sm">
                    <AccordionTrigger className="text-left font-medium hover:no-underline text-sm sm:text-base py-4">
                      What's the money-back guarantee?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4 text-sm">
                      If you're not happy within the first 30 days, we'll refund your subscription fee. No questions asked. The setup fee is non-refundable as it covers implementation work.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="faq-5" className="border rounded-lg px-4 sm:px-6 bg-background shadow-sm">
                    <AccordionTrigger className="text-left font-medium hover:no-underline text-sm sm:text-base py-4">
                      Do you offer discounts for multiple locations?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4 text-sm">
                      Yes! Growth and Elite plans include multiple clinic licenses. For larger groups (6+ locations), contact us for enterprise pricing.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-primary/5 to-primary/10">
          <div className="container mx-auto px-4 sm:px-6">
            <motion.div 
              className="text-center max-w-3xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
                Not Sure Which Plan Is Right?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Access our free demo to see the AI in action. We'll help you find the perfect fit.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild data-testid="button-access-demo">
                  <Link href="/demo">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Access Free Demo
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild data-testid="button-contact">
                  <a href={`mailto:${SUPPORT_EMAIL}`}>
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Questions? Email Us
                  </a>
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mt-6">
                Or email us at <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">{SUPPORT_EMAIL}</a>
              </p>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
