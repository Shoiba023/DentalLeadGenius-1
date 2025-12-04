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
  CalendarCheck
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { Link } from "wouter";
import logoFull from "@/assets/logo/logo-full.png";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/**
 * LANDING PAGE - CONVERSION FOCUSED
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
 */

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* ============================================
          MINIMAL STICKY HEADER
          - Logo + Single CTA only
          - No distracting navigation links
          ============================================ */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6">
          <div className="flex h-16 items-center justify-between">
            <Link href="/">
              <img 
                src={logoFull} 
                alt="DentalLeadGenius" 
                className="h-8 md:h-9 w-auto cursor-pointer object-contain"
                data-testid="link-logo"
              />
            </Link>
            
            <Button asChild data-testid="button-book-demo-header">
              <a href="#book-demo">
                <Calendar className="h-4 w-4 mr-2" />
                Book a Free Demo
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* ============================================
          SECTION 1: HERO
          Psychology: Clear value proposition + urgency
          Single CTA: Book a Free Demo
          ============================================ */}
      <section className="relative py-16 md:py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Main H1 Headline - Benefit focused */}
              <h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight"
                data-testid="text-hero-headline"
              >
                Stop Losing Patients — <br className="hidden sm:block" />
                <span className="text-primary">Let AI Convert Every Lead For You</span>
              </h1>

              {/* Subheadline - Clear benefit statement */}
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                DentalLeadGenius is your clinic's 24/7 AI receptionist that instantly replies to patients, 
                follows up every lead, and turns missed calls into booked appointments — 
                <span className="font-medium text-foreground"> without hiring extra staff.</span>
              </p>
            </motion.div>

            {/* Benefit Bullets - Outcome focused */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid sm:grid-cols-2 gap-4 mt-10 text-left max-w-2xl"
            >
              {[
                { icon: PhoneOff, text: "Recover patients from missed calls automatically" },
                { icon: UserCheck, text: "Turn website visitors into booked appointments" },
                { icon: CalendarCheck, text: "Reactivate inactive and no-show patients" },
                { icon: TrendingUp, text: "Grow monthly revenue without overloading your front desk" }
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <item.icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm md:text-base text-foreground/90">{item.text}</span>
                </div>
              ))}
            </motion.div>

            {/* Primary CTA - Book a Free Demo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-10"
            >
              <Button
                size="lg"
                className="gap-2 px-8 py-6 text-base md:text-lg font-semibold shadow-lg shadow-primary/25"
                asChild
                data-testid="button-book-demo-hero"
              >
                <a href="#book-demo">
                  <Calendar className="h-5 w-5" />
                  Book a Free Demo
                </a>
              </Button>
              <p className="mt-4 text-sm text-muted-foreground">
                No credit card required • Free 15-minute consultation
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 2: WHO THIS IS FOR
          Psychology: Audience clarity + problem agitation
          ============================================ */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
                Built For Dental Clinics That Are Tired Of...
              </h2>
              <p className="text-lg text-muted-foreground">
                Sound familiar? You're not alone.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  icon: PhoneOff,
                  title: "Missing calls during busy hours",
                  description: "Every unanswered call is a potential $3,000+ patient walking away to a competitor."
                },
                {
                  icon: Clock,
                  title: "Slow follow-up on inquiries",
                  description: "By the time you call back, they've already booked elsewhere. Speed wins."
                },
                {
                  icon: Users,
                  title: "Front desk overwhelmed",
                  description: "Your team is stretched thin answering the same questions over and over."
                },
                {
                  icon: TrendingUp,
                  title: "Inconsistent patient flow",
                  description: "Some weeks are packed, others are empty. No predictable growth system."
                }
              ].map((problem, index) => (
                <Card key={index} className="border-destructive/20 bg-destructive/5">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                        <problem.icon className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{problem.title}</h3>
                        <p className="text-sm text-muted-foreground">{problem.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-10">
              <p className="text-lg font-medium text-foreground">
                There's a better way. Let AI handle the repetitive work so you can focus on patient care.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 3: MAIN BENEFITS (Not Features)
          Psychology: "What's in it for me?"
          ============================================ */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
              What You Actually Get
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real results, not just software features.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center">
              <CardContent className="p-8">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Phone className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Never Miss Another Patient</h3>
                <p className="text-muted-foreground">
                  Every missed call gets an instant follow-up. Every inquiry gets a response in seconds, not hours. 
                  <span className="font-medium text-foreground"> More calls answered = more appointments booked.</span>
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-8">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Automatic Lead Nurturing</h3>
                <p className="text-muted-foreground">
                  AI follows up with every lead until they book — or politely decline. 
                  <span className="font-medium text-foreground"> No more leads falling through the cracks.</span>
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-8">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">24/7 Patient Support</h3>
                <p className="text-muted-foreground">
                  AI answers patient questions, handles appointment requests, and qualifies leads around the clock. 
                  <span className="font-medium text-foreground"> Your receptionist gets to breathe.</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 4: HOW IT WORKS
          Psychology: Simple 3-step process reduces friction
          ============================================ */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in 3 simple steps. No tech skills required.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "1",
                  title: "Book Your Demo",
                  description: "Schedule a free 15-minute call. We'll show you exactly how DentalLeadGenius works for your clinic."
                },
                {
                  step: "2",
                  title: "We Set Everything Up",
                  description: "Our team configures the AI for your clinic — your branding, your services, your voice. Takes just 48 hours."
                },
                {
                  step: "3",
                  title: "Watch Leads Roll In",
                  description: "AI starts working 24/7, capturing leads, following up, and booking appointments automatically."
                }
              ].map((item, index) => (
                <div key={index} className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-4">
                      {item.step}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                  </div>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-7 left-[calc(50%+3rem)] w-[calc(100%-6rem)]">
                      <ArrowRight className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Mid-page CTA */}
            <div className="text-center mt-12">
              <Button
                size="lg"
                className="gap-2 px-8 py-6 text-base font-semibold"
                asChild
                data-testid="button-book-demo-mid"
              >
                <a href="#book-demo">
                  <Calendar className="h-5 w-5" />
                  Book a Free Demo
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 5: SOCIAL PROOF & TRUST
          Psychology: Social validation + risk reversal
          NOTE: Testimonials are placeholders - replace with real ones
          ============================================ */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
              Trusted By Dental Practices Across North America
            </h2>
            <p className="text-lg text-muted-foreground">
              See what other clinic owners are saying.
            </p>
          </div>

          {/* Testimonials - PLACEHOLDER: Replace with real testimonials */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            {/* Testimonial 1 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-foreground mb-4">
                  "We were missing 30% of calls during lunch. Now AI handles those instantly. 
                  Last month we booked 12 extra appointments just from missed call follow-ups. 
                  That's over $15,000 in new revenue."
                </p>
                <div>
                  <p className="font-semibold">Dr. Sarah Chen</p>
                  <p className="text-sm text-muted-foreground">Bright Smile Dental, Los Angeles, CA</p>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 2 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-foreground mb-4">
                  "My front desk was drowning in follow-up calls. Now the AI handles 80% of patient 
                  questions automatically. My team can finally focus on in-person care instead of 
                  playing phone tag."
                </p>
                <div>
                  <p className="font-semibold">Dr. Michael Rodriguez</p>
                  <p className="text-sm text-muted-foreground">Family Dental Care, Houston, TX</p>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 3 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-foreground mb-4">
                  "We reactivated over 50 patients who hadn't visited in 2+ years. The AI sent 
                  personalized follow-ups and booked them back in. Best ROI on any marketing 
                  we've ever done."
                </p>
                <div>
                  <p className="font-semibold">Dr. Emily Watson</p>
                  <p className="text-sm text-muted-foreground">Premier Dental Group, Toronto, ON</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trust Badges */}
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center text-center p-4">
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm font-medium">HIPAA-Friendly</p>
                <p className="text-xs text-muted-foreground">Secure workflows</p>
              </div>
              
              <div className="flex flex-col items-center text-center p-4">
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                  <CheckCircle2 className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium">No Long Contracts</p>
                <p className="text-xs text-muted-foreground">Cancel anytime</p>
              </div>
              
              <div className="flex flex-col items-center text-center p-4">
                <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-2">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-sm font-medium">24/7 AI Support</p>
                <p className="text-xs text-muted-foreground">Always available</p>
              </div>
              
              <div className="flex flex-col items-center text-center p-4">
                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center mb-2">
                  <Zap className="h-6 w-6 text-orange-600" />
                </div>
                <p className="text-sm font-medium">48-Hour Setup</p>
                <p className="text-xs text-muted-foreground">Quick onboarding</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 6: FAQ
          Psychology: Objection handling
          ============================================ */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
              Common Questions
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-3">
              <AccordionItem value="item-1" className="border rounded-lg px-6 bg-background">
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  How does DentalLeadGenius help my clinic get more patients?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  The AI instantly responds to every inquiry, follows up on missed calls, and nurtures 
                  leads until they book. Most clinics see 3-10x more booked appointments from the same 
                  amount of traffic because no lead falls through the cracks.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border rounded-lg px-6 bg-background">
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  Do I need any technical skills to use this?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  No. We handle all the setup. You just log in to see your leads and appointments. 
                  If you can check email, you can use DentalLeadGenius.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border rounded-lg px-6 bg-background">
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  Will this replace my front desk staff?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  No — it supports them. The AI handles repetitive tasks like answering FAQs, 
                  following up on leads, and booking basic appointments. Your team can focus on 
                  in-person patient care instead of phone tag.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border rounded-lg px-6 bg-background">
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  How quickly can I get started?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  After your demo call, we can have your AI system live within 48 hours. 
                  Most clinics start seeing new leads the same week.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border rounded-lg px-6 bg-background">
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  Is my patient data secure?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  Yes. All data is encrypted and we follow HIPAA-friendly practices. 
                  Your patient information is never shared or sold. You maintain full control.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="border rounded-lg px-6 bg-background">
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  What if it doesn't work for my clinic?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  We offer a risk-free demo so you can see exactly how it works before committing. 
                  No long-term contracts — if you're not seeing results, you can cancel anytime.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 7: FINAL CTA
          Psychology: Urgency + low-friction action
          ============================================ */}
      <section id="book-demo" className="py-16 md:py-24 bg-primary/5">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
              Ready To Stop Losing Patients?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Book a free 15-minute demo. See exactly how DentalLeadGenius can help your clinic 
              capture more leads and book more appointments — without adding staff.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <Button
                size="lg"
                className="gap-2 px-10 py-6 text-lg font-semibold shadow-lg shadow-primary/25 w-full sm:w-auto"
                asChild
                data-testid="button-book-demo-final"
              >
                <Link href="/demo">
                  <Calendar className="h-5 w-5" />
                  Book a Free Demo
                </Link>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              No credit card required • Free consultation • No obligation
            </p>

            {/* Quick contact option */}
            <div className="mt-8 pt-8 border-t border-border/50">
              <p className="text-sm text-muted-foreground mb-4">
                Prefer to talk to someone right away?
              </p>
              <a 
                href="tel:+12505742162" 
                className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
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
      <footer className="py-8 border-t">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img 
                src={logoFull} 
                alt="DentalLeadGenius" 
                className="h-6 w-auto object-contain"
              />
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
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
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} DentalLeadGenius
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
