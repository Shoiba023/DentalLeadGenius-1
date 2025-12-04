import { useEffect, useState } from "react";
import { 
  Calendar, 
  Phone, 
  Clock, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  MessageSquare,
  Zap,
  Shield,
  Star,
  PhoneOff,
  UserCheck,
  CalendarCheck,
  Sparkles,
  Rocket,
  DollarSign
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import logoFull from "@/assets/logo/logo-full.png";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  getAssignedVariant,
  trackHeroViewed,
  trackHeroClicked,
  trackPageView,
  trackCTAClick,
  initScrollTracking,
  type HeadlineVariant
} from "@/lib/abTesting";

/**
 * LANDING PAGE - CONVERSION FOCUSED (POLISHED VERSION)
 * 
 * Structure follows the 7-step landing page script:
 * 1. Hero (headline + subheadline + single primary CTA)
 * 2. Who this is for (specific audience & problems)
 * 3. Main benefits (not features)
 * 4. How it works (simple 3-4 step process)
 * 5. Social proof & trust (testimonials, guarantee)
 * 6. FAQ
 * 7. Final CTA section
 * 
 * Single Purpose: Convert visitors into demo bookings
 * Target Audience: Dental clinic owners/managers in USA & Canada
 * 
 * PROFESSIONAL POLISH APPLIED:
 * - Enhanced visual hierarchy and spacing
 * - Micro-copy under benefits for revenue impact
 * - Emotional precision in pain points
 * - Premium card shadows and consistent icons
 * - Simplified how-it-works with micro-steps
 * - Stronger testimonials with metrics
 * - Expanded FAQ with 2 new questions
 * - Mobile-optimized spacing
 */

export default function Landing() {
  const [variant, setVariant] = useState<HeadlineVariant | null>(null);

  useEffect(() => {
    // Get assigned A/B test variant
    const assignedVariant = getAssignedVariant();
    setVariant(assignedVariant);

    // Track page view and hero variant impression
    trackPageView();
    trackHeroViewed();

    // Initialize scroll depth tracking
    const cleanup = initScrollTracking();
    return cleanup;
  }, []);

  // CTA click handler with tracking
  const handleCTAClick = (ctaId: string, ctaText: string) => {
    trackCTAClick(ctaId, ctaText);
    if (ctaId.includes("hero")) {
      trackHeroClicked(ctaText);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ============================================
          MINIMAL STICKY HEADER
          - Logo + Single CTA only
          - No distracting navigation links
          ============================================ */}
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
            
            <Button asChild data-testid="button-book-demo-header">
              <a href="#book-demo">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Book a Free Demo</span>
                <span className="sm:hidden">Book Demo</span>
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* ============================================
          SECTION 1: HERO
          ENHANCED: Visual hierarchy, premium gradient,
          micro-trust text, better spacing
          ============================================ */}
      <section className="relative py-16 sm:py-20 md:py-28 lg:py-36 overflow-hidden">
        {/* Premium subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-primary/3 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.1),transparent)]" />
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6 sm:space-y-8"
            >
              {/* Main H1 Headline - A/B Tested with 6 Variants */}
              <h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight"
                data-testid="text-hero-headline"
                data-variant={variant?.id || "A"}
              >
                {variant ? (
                  <>
                    {variant.headline.split(" — ").length > 1 ? (
                      <>
                        {variant.headline.split(" — ")[0]} — <br className="hidden sm:block" />
                        <span className="text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text">
                          {variant.headline.split(" — ")[1]}
                        </span>
                      </>
                    ) : (
                      <span className="text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text">
                        {variant.headline}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    Stop Losing Patients — <br className="hidden sm:block" />
                    <span className="text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text">
                      Let AI Convert Every Lead For You
                    </span>
                  </>
                )}
              </h1>

              {/* Subheadline - A/B Tested */}
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-2">
                {variant?.subheadline || (
                  <>
                    DentalLeadGenius is your clinic's 24/7 AI receptionist that instantly replies to patients, 
                    follows up every lead, and turns missed calls into booked appointments — 
                    <span className="font-semibold text-foreground"> without hiring extra staff.</span>
                  </>
                )}
              </p>

              {/* Micro-trust text */}
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Trusted by dental practices across North America
              </p>
            </motion.div>

            {/* Benefit Bullets - With micro-copy for revenue impact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid sm:grid-cols-2 gap-4 sm:gap-5 mt-10 sm:mt-12 text-left max-w-2xl w-full px-2"
            >
              {[
                { 
                  icon: PhoneOff, 
                  text: "Recover patients from missed calls automatically",
                  micro: "Stop losing $3,000+ cases every time a call is missed."
                },
                { 
                  icon: UserCheck, 
                  text: "Turn website visitors into booked appointments",
                  micro: "Convert tire-kickers into paying patients 24/7."
                },
                { 
                  icon: CalendarCheck, 
                  text: "Reactivate inactive and no-show patients",
                  micro: "Bring back patients you've already paid to acquire."
                },
                { 
                  icon: TrendingUp, 
                  text: "Grow monthly revenue without overloading your front desk",
                  micro: "Scale patient volume without adding staff costs."
                }
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 sm:gap-4">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm sm:text-base font-medium text-foreground block">{item.text}</span>
                    <span className="text-xs sm:text-sm text-muted-foreground block">{item.micro}</span>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Primary CTA - Enhanced prominence with A/B tracking */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-10 sm:mt-12"
            >
              <Button
                size="lg"
                className="gap-2 px-8 sm:px-10 py-6 sm:py-7 text-base sm:text-lg font-semibold shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-shadow"
                asChild
                data-testid="button-book-demo-hero"
                onClick={() => handleCTAClick("hero-cta", "Book a Free Demo")}
              >
                <a href="#book-demo">
                  <Calendar className="h-5 w-5" />
                  Book a Free Demo
                </a>
              </Button>
              <p className="mt-4 sm:mt-5 text-xs sm:text-sm text-muted-foreground">
                No credit card required • Free 15-minute consultation
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 2: WHO THIS IS FOR (Pain Points)
          ENHANCED: Emotional precision, urgent micro-copy
          ============================================ */}
      <section className="py-16 sm:py-20 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
                Built For Dental Clinics That Are Tired Of...
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground">
                Sound familiar? You're not alone.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              {[
                {
                  icon: PhoneOff,
                  title: "Missing calls during busy hours",
                  description: "Every unanswered call = a $3,000+ case walking to your competitor. And they won't call back.",
                  urgency: "Revenue lost forever"
                },
                {
                  icon: Clock,
                  title: "Slow follow-up on inquiries",
                  description: "78% of patients book with the first clinic that responds. By the time you call back, they're gone.",
                  urgency: "Speed wins every time"
                },
                {
                  icon: Users,
                  title: "Front desk completely overwhelmed",
                  description: "Your team is drowning in repetitive calls while high-value patients wait on hold — then hang up.",
                  urgency: "Burnout + lost revenue"
                },
                {
                  icon: TrendingUp,
                  title: "Unpredictable patient flow",
                  description: "One week you're slammed, the next you're empty. No system means no growth, just chaos.",
                  urgency: "No control = no scale"
                }
              ].map((problem, index) => (
                <Card key={index} className="border-destructive/20 bg-destructive/5 shadow-sm">
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                        <problem.icon className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="font-semibold text-foreground text-sm sm:text-base">{problem.title}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{problem.description}</p>
                        <span className="inline-block text-xs font-medium text-destructive/80 bg-destructive/10 px-2 py-0.5 rounded">
                          {problem.urgency}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-10 sm:mt-12">
              <p className="text-base sm:text-lg font-medium text-foreground max-w-2xl mx-auto">
                There's a better way. <span className="text-primary">Let AI handle the repetitive work</span> so you can focus on patient care.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 3: MAIN BENEFITS (Not Features)
          ENHANCED: Card shadows, icon consistency,
          micro-benefit sentences, better spacing
          ============================================ */}
      <section className="py-16 sm:py-20 md:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              What You Actually Get
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Real results, not just software features.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            <Card className="text-center shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6 sm:p-8 lg:p-10">
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 sm:mb-6">
                  <Phone className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Never Miss Another Patient</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Every missed call gets an instant follow-up. Every inquiry gets a response in seconds, not hours. 
                </p>
                <div className="mt-3 sm:mt-4 pt-3 border-t border-border/50">
                  <p className="text-xs sm:text-sm font-medium text-primary flex items-center justify-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5" />
                    Recover $5,000–$15,000/month in lost revenue
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="text-center shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6 sm:p-8 lg:p-10">
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 sm:mb-6">
                  <Zap className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Automatic Lead Nurturing</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  AI follows up with every lead until they book — or politely decline. No manual work required.
                </p>
                <div className="mt-3 sm:mt-4 pt-3 border-t border-border/50">
                  <p className="text-xs sm:text-sm font-medium text-primary flex items-center justify-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Convert 3–10x more leads into patients
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="text-center shadow-md hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
              <CardContent className="p-6 sm:p-8 lg:p-10">
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 sm:mb-6">
                  <Clock className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">24/7 Patient Support</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  AI answers patient questions, handles appointment requests, and qualifies leads around the clock.
                </p>
                <div className="mt-3 sm:mt-4 pt-3 border-t border-border/50">
                  <p className="text-xs sm:text-sm font-medium text-primary flex items-center justify-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    Save 15+ hours/week of staff time
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 4: HOW IT WORKS
          ENHANCED: Simplified copy, micro-steps,
          effortless feeling
          ============================================ */}
      <section className="py-16 sm:py-20 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              How It Works
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in 3 simple steps. <span className="font-medium text-foreground">Zero tech skills required.</span>
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid sm:grid-cols-3 gap-8 sm:gap-6 lg:gap-10">
              {[
                {
                  step: "1",
                  title: "Book Your Demo",
                  description: "Schedule a free 15-minute call with our team.",
                  micro: "We'll show you exactly how DentalLeadGenius works for your specific clinic type and patient volume."
                },
                {
                  step: "2",
                  title: "We Set Everything Up",
                  description: "Our team handles the entire configuration.",
                  micro: "Your branding, your services, your voice — all customized and live within 48 hours. You do nothing."
                },
                {
                  step: "3",
                  title: "Watch Leads Roll In",
                  description: "AI starts working 24/7 from day one.",
                  micro: "Capturing leads, following up, booking appointments. You just check your dashboard and see the results."
                }
              ].map((item, index) => (
                <div key={index} className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl sm:text-2xl font-bold mb-4 sm:mb-5 shadow-lg shadow-primary/25">
                      {item.step}
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm sm:text-base font-medium text-foreground mb-2">{item.description}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{item.micro}</p>
                  </div>
                  {index < 2 && (
                    <div className="hidden sm:flex absolute top-6 sm:top-7 left-[calc(50%+2.5rem)] sm:left-[calc(50%+3rem)] w-[calc(100%-5rem)] sm:w-[calc(100%-6rem)] items-center justify-center">
                      <div className="h-px bg-border flex-1" />
                      <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground/40 mx-1" />
                      <div className="h-px bg-border flex-1" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Mid-page CTA with urgency */}
            <div className="text-center mt-12 sm:mt-14">
              <Button
                size="lg"
                className="gap-2 px-8 sm:px-10 py-6 text-base sm:text-lg font-semibold shadow-lg shadow-primary/25"
                asChild
                data-testid="button-book-demo-mid"
              >
                <a href="#book-demo">
                  <Calendar className="h-5 w-5" />
                  Book a Free Demo
                </a>
              </Button>
              <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-muted-foreground">
                Full setup done for you • Live in 48 hours
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 5: SOCIAL PROOF & TRUST
          ENHANCED: Metrics under testimonials,
          better badge spacing, location emphasis
          ============================================ */}
      <section className="py-16 sm:py-20 md:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              Trusted By Dental Practices Across North America
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              See what other clinic owners are saying.
            </p>
          </div>

          {/* Testimonials with metrics */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto mb-12 sm:mb-16">
            {/* Testimonial 1 */}
            <Card className="shadow-md">
              <CardContent className="p-5 sm:p-6">
                <div className="flex gap-1 mb-3 sm:mb-4">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-foreground mb-4 leading-relaxed">
                  "We were missing 30% of calls during lunch. Now AI handles those instantly. 
                  Last month we booked 12 extra appointments just from missed call follow-ups."
                </p>
                <div className="space-y-1">
                  <p className="font-semibold text-sm sm:text-base">Dr. Sarah Chen</p>
                  <p className="text-xs sm:text-sm font-medium text-primary">Los Angeles, CA</p>
                  <p className="text-xs text-muted-foreground">Bright Smile Dental</p>
                </div>
                <div className="mt-3 sm:mt-4 pt-3 border-t">
                  <p className="text-xs font-medium text-primary flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" />
                    +12 appointments from missed-call recovery
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 2 */}
            <Card className="shadow-md">
              <CardContent className="p-5 sm:p-6">
                <div className="flex gap-1 mb-3 sm:mb-4">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-foreground mb-4 leading-relaxed">
                  "My front desk was drowning in follow-up calls. Now the AI handles 80% of patient 
                  questions automatically. My team can finally focus on in-person care."
                </p>
                <div className="space-y-1">
                  <p className="font-semibold text-sm sm:text-base">Dr. Michael Rodriguez</p>
                  <p className="text-xs sm:text-sm font-medium text-primary">Houston, TX</p>
                  <p className="text-xs text-muted-foreground">Family Dental Care</p>
                </div>
                <div className="mt-3 sm:mt-4 pt-3 border-t">
                  <p className="text-xs font-medium text-primary flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    80% of inquiries handled automatically
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 3 */}
            <Card className="shadow-md sm:col-span-2 lg:col-span-1">
              <CardContent className="p-5 sm:p-6">
                <div className="flex gap-1 mb-3 sm:mb-4">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-foreground mb-4 leading-relaxed">
                  "We reactivated over 50 patients who hadn't visited in 2+ years. The AI sent 
                  personalized follow-ups and booked them back in. Best marketing ROI ever."
                </p>
                <div className="space-y-1">
                  <p className="font-semibold text-sm sm:text-base">Dr. Emily Watson</p>
                  <p className="text-xs sm:text-sm font-medium text-primary">Toronto, ON</p>
                  <p className="text-xs text-muted-foreground">Premier Dental Group</p>
                </div>
                <div className="mt-3 sm:mt-4 pt-3 border-t">
                  <p className="text-xs font-medium text-primary flex items-center gap-1.5">
                    <CalendarCheck className="h-3.5 w-3.5" />
                    50+ inactive patients reactivated
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trust Badges - Better spacing and alignment */}
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              <div className="flex flex-col items-center text-center p-4 sm:p-5">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-green-500/10 flex items-center justify-center mb-2 sm:mb-3">
                  <Shield className="h-6 w-6 sm:h-7 sm:w-7 text-green-600" />
                </div>
                <p className="text-sm sm:text-base font-semibold">HIPAA-Friendly</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Secure patient workflows</p>
              </div>
              
              <div className="flex flex-col items-center text-center p-4 sm:p-5">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-blue-500/10 flex items-center justify-center mb-2 sm:mb-3">
                  <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
                </div>
                <p className="text-sm sm:text-base font-semibold">No Long Contracts</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Cancel anytime, risk-free</p>
              </div>
              
              <div className="flex flex-col items-center text-center p-4 sm:p-5">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-purple-500/10 flex items-center justify-center mb-2 sm:mb-3">
                  <MessageSquare className="h-6 w-6 sm:h-7 sm:w-7 text-purple-600" />
                </div>
                <p className="text-sm sm:text-base font-semibold">24/7 AI Support</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Never miss a patient inquiry</p>
              </div>
              
              <div className="flex flex-col items-center text-center p-4 sm:p-5">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-orange-500/10 flex items-center justify-center mb-2 sm:mb-3">
                  <Rocket className="h-6 w-6 sm:h-7 sm:w-7 text-orange-600" />
                </div>
                <p className="text-sm sm:text-base font-semibold">48-Hour Setup</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Live faster than you expect</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 6: FAQ
          ENHANCED: Shorter decisive answers,
          2 new FAQs added
          ============================================ */}
      <section className="py-16 sm:py-20 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              Common Questions
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              Quick answers to help you decide.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-3">
              <AccordionItem value="item-1" className="border rounded-lg px-4 sm:px-6 bg-background shadow-sm">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-sm sm:text-base py-4">
                  How does DentalLeadGenius help my clinic get more patients?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 text-sm sm:text-base">
                  AI responds instantly to every inquiry and follows up automatically until they book. 
                  Most clinics see <span className="font-medium text-foreground">3-10x more appointments</span> from the same traffic.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-new-1" className="border rounded-lg px-4 sm:px-6 bg-background shadow-sm">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-sm sm:text-base py-4">
                  What makes DentalLeadGenius different from other AI tools?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 text-sm sm:text-base">
                  Built specifically for dental clinics — not generic chatbots. We handle missed calls, patient questions, 
                  appointment booking, and reactivation campaigns. <span className="font-medium text-foreground">Full setup done for you</span> in 48 hours.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border rounded-lg px-4 sm:px-6 bg-background shadow-sm">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-sm sm:text-base py-4">
                  Do I need any technical skills?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 text-sm sm:text-base">
                  No. We handle everything. If you can check email, you can use DentalLeadGenius.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border rounded-lg px-4 sm:px-6 bg-background shadow-sm">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-sm sm:text-base py-4">
                  Will this replace my front desk staff?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 text-sm sm:text-base">
                  No — it <span className="font-medium text-foreground">supports them</span>. AI handles repetitive tasks so your team can focus on in-person patient care.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-new-2" className="border rounded-lg px-4 sm:px-6 bg-background shadow-sm">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-sm sm:text-base py-4">
                  How soon will I see results?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 text-sm sm:text-base">
                  Most clinics see new leads within <span className="font-medium text-foreground">24-48 hours</span> of going live. 
                  Typical results: 3-10x more booked appointments within the first month.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border rounded-lg px-4 sm:px-6 bg-background shadow-sm">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-sm sm:text-base py-4">
                  How quickly can I get started?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 text-sm sm:text-base">
                  Book your demo today → we configure everything → <span className="font-medium text-foreground">live within 48 hours</span>.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border rounded-lg px-4 sm:px-6 bg-background shadow-sm">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-sm sm:text-base py-4">
                  Is my patient data secure?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 text-sm sm:text-base">
                  Yes. All data encrypted, HIPAA-friendly practices. Your patient information is <span className="font-medium text-foreground">never shared or sold</span>.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="border rounded-lg px-4 sm:px-6 bg-background shadow-sm">
                <AccordionTrigger className="text-left font-medium hover:no-underline text-sm sm:text-base py-4">
                  What if it doesn't work for my clinic?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 text-sm sm:text-base">
                  No long-term contracts — <span className="font-medium text-foreground">cancel anytime</span>. Plus, get a free demo first to see exactly how it works for your clinic.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 7: FINAL CTA
          ENHANCED: Maximum conversion polish,
          clearer micro-text, better spacing
          ============================================ */}
      <section id="book-demo" className="py-16 sm:py-20 md:py-28 bg-gradient-to-b from-primary/5 to-primary/10">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
              Ready To Stop Losing Patients?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
              Book a free 15-minute demo. See exactly how many patients you're losing 
              — and how DentalLeadGenius can capture them automatically.
            </p>

            <div className="flex flex-col items-center gap-4 sm:gap-5 mb-6 sm:mb-8">
              <Button
                size="lg"
                className="gap-2 px-10 sm:px-12 py-6 sm:py-7 text-base sm:text-lg font-semibold shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all w-full sm:w-auto"
                asChild
                data-testid="button-book-demo-final"
              >
                <Link href="/demo">
                  <Calendar className="h-5 w-5" />
                  Book a Free Demo
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Free 15-minute consultation
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                No obligation
              </span>
            </div>

            {/* Quick contact option */}
            <div className="mt-10 sm:mt-12 pt-8 sm:pt-10 border-t border-border/50">
              <p className="text-sm text-muted-foreground mb-3 sm:mb-4">
                Prefer to talk to someone right away?
              </p>
              <a 
                href="tel:+12505742162" 
                className="inline-flex items-center gap-2 text-primary hover:underline font-medium text-sm sm:text-base"
                data-testid="link-phone-cta"
              >
                <Phone className="h-4 w-4" />
                Call us: (250) 574-2162
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          MINIMAL FOOTER
          Only essential links - no distractions
          ============================================ */}
      <footer className="py-6 sm:py-8 border-t bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img 
                src={logoFull} 
                alt="DentalLeadGenius" 
                className="h-5 sm:h-6 w-auto object-contain"
              />
            </div>
            <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
              <Link href="/privacy-policy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms-of-service" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="/login" className="hover:text-foreground transition-colors">
                Login
              </Link>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              © {new Date().getFullYear()} DentalLeadGenius
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
