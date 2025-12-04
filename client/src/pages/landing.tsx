import { MessageSquare, Users, Building2, BarChart3, Phone, Calendar, Play, Menu, X, Mail, HelpCircle, ChevronRight, Globe, ShieldCheck, BadgeCheck, CheckCircle2, MailCheck, Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChatbotWidget } from "@/components/chatbot-widget";
import { DemoRequestForm } from "@/components/demo-request-form";
import { useState } from "react";
import { Link } from "wouter";
import { SiWhatsapp } from "react-icons/si";
import heroImage from "@assets/generated_images/modern_dental_clinic_hero_image.png";
import logoFull from "@/assets/logo/logo-full.png";
import logoIcon from "@/assets/logo/icon.png";
import { SITE_NAME } from "@shared/config";
import { Footer } from "@/components/footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const ADMIN_WHATSAPP = "1234567890"; // Replace with actual admin WhatsApp
  const ADMIN_PHONE = "1234567890"; // Replace with actual admin phone

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/">
                <img 
                  src={logoFull} 
                  alt="DentalLeadGenius" 
                  className="h-9 md:h-10 w-auto cursor-pointer object-contain"
                  data-testid="link-logo"
                />
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </a>
                <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Testimonials
                </a>
                <Link href="/demo">
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    Demo
                  </span>
                </Link>
                <Link href="/pricing">
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    Pricing
                  </span>
                </Link>
              </nav>
            </div>
            
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" asChild data-testid="button-login-nav">
                <Link href="/login">Log in to Dashboard</Link>
              </Button>
              <Button variant="outline" asChild data-testid="button-view-demo-nav">
                <Link href="/demo">
                  <Play className="h-4 w-4 mr-2" />
                  View Demo
                </Link>
              </Button>
              <Button asChild data-testid="button-get-access-nav">
                <Link href="/demo">
                  Try Live Demo
                </Link>
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <nav className="flex flex-col gap-4">
                <a href="#features" className="text-sm" onClick={() => setMobileMenuOpen(false)}>
                  Features
                </a>
                <a href="#testimonials" className="text-sm" onClick={() => setMobileMenuOpen(false)}>
                  Testimonials
                </a>
                <Link href="/demo">
                  <span className="text-sm cursor-pointer" onClick={() => setMobileMenuOpen(false)}>
                    Demo
                  </span>
                </Link>
                <Link href="/pricing">
                  <span className="text-sm cursor-pointer" onClick={() => setMobileMenuOpen(false)}>
                    Pricing
                  </span>
                </Link>
                <div className="flex flex-col gap-2 pt-2">
                  <Button variant="ghost" asChild>
                    <Link href="/login">Log in to Dashboard</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/demo">
                      <Play className="h-4 w-4 mr-2" />
                      View Demo
                    </Link>
                  </Button>
                  <Button asChild onClick={() => setMobileMenuOpen(false)}>
                    <Link href="/demo">
                      Try Live Demo
                    </Link>
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Modern dental clinic"
            className="w-full h-full object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-primary/5" />
        </div>

        <div className="container mx-auto px-6 py-20 relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Animated Hero Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="space-y-6"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">AI-Powered Patient Conversion</span>
              </motion.div>

              {/* H1 Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight"
                data-testid="text-hero-headline"
              >
                Stop Losing Patients —{" "}
                <span className="text-primary">Let AI Convert</span> Every Lead For You
              </motion.h1>

              {/* Subheading */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
              >
                Your clinic's 24/7 AI receptionist that instantly replies, books appointments, 
                follows up leads, and turns missed opportunities into real patients.
              </motion.p>
            </motion.div>

            {/* Bullet Points */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid sm:grid-cols-2 gap-x-8 gap-y-3 mt-10 text-left"
            >
              {[
                "Missed call follow-up → booked appointment",
                "AI nurtures & converts new patient leads",
                "Reactivates inactive/no-show patients",
                "Zero human effort — 100% automated"
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm sm:text-base text-foreground/90">{item}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
            >
              <Button
                size="lg"
                className="gap-2 px-8 py-6 text-base font-semibold shadow-lg shadow-primary/25"
                asChild
                data-testid="button-book-demo-hero"
              >
                <Link href="/demo">
                  <Calendar className="h-5 w-5" />
                  Book a Free Demo
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 px-8 py-6 text-base font-semibold border-2"
                asChild
                data-testid="button-try-free-hero"
              >
                <Link href="/signup">
                  <Play className="h-5 w-5" />
                  Try It Free
                </Link>
              </Button>
            </motion.div>

            {/* Trust indicator */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="mt-8 text-sm text-muted-foreground"
            >
              Trusted by 500+ dental clinics across USA & Canada
            </motion.p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" data-testid="text-features-headline">
              Everything You Need to Scale Your Dental Practice
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful tools designed specifically for dental clinic lead generation
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover-elevate" data-testid="card-feature-chatbot">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">AI Sales Chatbot</h3>
                <p className="text-muted-foreground">
                  Human-like conversations that persuade clinic owners, answer questions,
                  and book demos automatically 24/7.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-leads">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Lead Management</h3>
                <p className="text-muted-foreground">
                  Import leads via CSV, track status, automate follow-ups, and manage
                  outreach campaigns with daily send limits.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-multi-tenant">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Multi-Clinic Platform</h3>
                <p className="text-muted-foreground">
                  Each clinic gets branded subpages, patient chatbots, and appointment
                  booking - all managed from one dashboard.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section id="testimonials" className="py-24">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-3xl font-bold mb-8">Trusted by Dental Professionals</h2>
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-lg mb-4">
                      "DentalLeadGenius transformed how we find new patients. The AI
                      chatbot books qualified demos while we focus on patient care. Game
                      changer!"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20" />
                      <div>
                        <p className="font-semibold">Dr. Sarah Chen</p>
                        <p className="text-sm text-muted-foreground">
                          Bright Smile Dental, CA
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-lg mb-4">
                      "We went from 5 leads per month to 50+ qualified conversations. The
                      ROI is incredible and the team loves the automated follow-ups."
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20" />
                      <div>
                        <p className="font-semibold">Dr. Michael Rodriguez</p>
                        <p className="text-sm text-muted-foreground">
                          Family Dental Care, TX
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <BarChart3 className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-4xl font-bold text-primary">10x</p>
                  <p className="text-sm text-muted-foreground">More Qualified Leads</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-4xl font-bold text-primary">500+</p>
                  <p className="text-sm text-muted-foreground">Dental Clinics</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <MessageSquare className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-4xl font-bold text-primary">24/7</p>
                  <p className="text-sm text-muted-foreground">AI Assistance</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center p-4">
              <div className="h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                <ShieldCheck className="h-7 w-7 text-green-600" />
              </div>
              <h4 className="font-semibold text-sm mb-1">Secure & Encrypted</h4>
              <p className="text-xs text-muted-foreground">256-bit SSL Protection</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4">
              <div className="h-14 w-14 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
                <BadgeCheck className="h-7 w-7 text-blue-600" />
              </div>
              <h4 className="font-semibold text-sm mb-1">30-Day Money-Back</h4>
              <p className="text-xs text-muted-foreground">Full Refund Guarantee</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4">
              <div className="h-14 w-14 rounded-full bg-purple-500/10 flex items-center justify-center mb-3">
                <CheckCircle2 className="h-7 w-7 text-purple-600" />
              </div>
              <h4 className="font-semibold text-sm mb-1">Trusted by 500+</h4>
              <p className="text-xs text-muted-foreground">Dental Clinics</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4">
              <div className="h-14 w-14 rounded-full bg-orange-500/10 flex items-center justify-center mb-3">
                <MailCheck className="h-7 w-7 text-orange-600" />
              </div>
              <h4 className="font-semibold text-sm mb-1">Verified Domain</h4>
              <p className="text-xs text-muted-foreground">Email Delivery</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section id="pricing" className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" data-testid="text-pricing-headline">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your clinic. Start growing today with AI-powered lead generation.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="hover-elevate" data-testid="card-pricing-essential">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">Essential</CardTitle>
                <CardDescription>Perfect for single clinics</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div>
                  <span className="text-4xl font-bold">$497</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-xs text-muted-foreground">+ $1,997 one-time setup</p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>1 Clinic</li>
                  <li>AI Sales Chatbot</li>
                  <li>Email Campaigns</li>
                  <li>Lead Management</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="hover-elevate border-primary relative" data-testid="card-pricing-growth">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">Growth</CardTitle>
                <CardDescription>For growing practices</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div>
                  <span className="text-4xl font-bold text-primary">$997</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-xs text-muted-foreground">+ $2,997 one-time setup</p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>Up to 3 Clinics</li>
                  <li>Everything in Essential</li>
                  <li>Multi-Channel Outreach</li>
                  <li>Priority Support</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="hover-elevate" data-testid="card-pricing-elite">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">Elite</CardTitle>
                <CardDescription>Enterprise solution</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div>
                  <span className="text-4xl font-bold">$1,497</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-xs text-muted-foreground">+ $4,997 one-time setup</p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>Unlimited Clinics</li>
                  <li>Everything in Growth</li>
                  <li>White-Label Branding</li>
                  <li>Dedicated Account Manager</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-10">
            <Button size="lg" asChild data-testid="button-view-pricing">
              <Link href="/pricing">
                View Full Pricing Details
                <ChevronRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
              <HelpCircle className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-4xl font-bold mb-4" data-testid="text-faq-headline">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about DentalLeadGenius
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="border rounded-lg px-6" data-testid="faq-item-1">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  What is DentalLeadGenius?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  DentalLeadGenius is an AI-powered automation platform designed exclusively for dental clinics. It generates patient leads, sends automated email campaigns, answers patient questions, and boosts appointment bookings 24/7.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border rounded-lg px-6" data-testid="faq-item-2">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  How does DentalLeadGenius help my clinic?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Our AI system works like a smart, always-available receptionist — responding instantly, following up with patients, and converting leads into booked appointments automatically.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border rounded-lg px-6" data-testid="faq-item-3">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  Do I need technical skills to use it?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  No. DentalLeadGenius is 100% beginner-friendly. You simply start your campaign and the AI handles the rest.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border rounded-lg px-6" data-testid="faq-item-4">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  How many patients can this system bring?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Most clinics see 3x to 10x more leads depending on city and demand.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border rounded-lg px-6" data-testid="faq-item-5">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  Is this software safe and secure?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes. All data is encrypted and never shared. Clinics retain full control over their information.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="border rounded-lg px-6" data-testid="faq-item-6">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  Does DentalLeadGenius replace my staff?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  No. It supports your staff by handling repetitive tasks like email replies, FAQs, and follow-ups.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7" className="border rounded-lg px-6" data-testid="faq-item-7">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  Can I customize the emails and campaigns?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes. Emails, automations, and templates are fully customizable.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8" className="border rounded-lg px-6" data-testid="faq-item-8">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  Do I need to install anything?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  No installation required. The system is fully web-based and works on mobile, tablet, and desktop.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-9" className="border rounded-lg px-6" data-testid="faq-item-9">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  Does it work for multi-location clinics?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes. You can manage multiple branches and their leads independently.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-10" className="border rounded-lg px-6" data-testid="faq-item-10">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  How fast can I see results?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Clinics start receiving leads within 24–48 hours.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-11" className="border rounded-lg px-6" data-testid="faq-item-11">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  What is the cost?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-3">We offer three flexible plans: Essential ($497/month + $1,997 setup), Growth ($997/month + $2,997 setup), and Elite ($1,497/month + $4,997 setup) for unlimited clinics.</p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="#pricing">
                      View Pricing Plans Above
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </a>
                  </Button>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-12" className="border rounded-lg px-6" data-testid="faq-item-12">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  How do I get support?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-4">Our team is here to help you succeed. Reach out anytime:</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-foreground">Phone:</span>
                        <a href="tel:+12505742162" className="ml-2 text-primary hover:underline">250-574-2162</a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-foreground">Email:</span>
                        <a href="mailto:info@dentalleadgenius.com" className="ml-2 text-primary hover:underline">info@dentalleadgenius.com</a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Globe className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-foreground">Website:</span>
                        <a href="https://smartai-partners.io" target="_blank" rel="noopener noreferrer" className="ml-2 text-primary hover:underline">smartai-partners.io</a>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section with Demo Request Form */}
      <section id="book-demo" className="py-24 bg-primary/5">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold">
                Ready to Transform Your Lead Generation?
              </h2>
              <p className="text-xl text-muted-foreground">
                Join hundreds of dental clinics already growing with {SITE_NAME}. 
                Fill out the form and our team will contact you within 24 hours.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Personalized Demo</p>
                    <p className="text-sm text-muted-foreground">See features tailored to your clinic</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Quick Response</p>
                    <p className="text-sm text-muted-foreground">We'll contact you within 24 hours</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">No Commitment</p>
                    <p className="text-sm text-muted-foreground">Free consultation with our experts</p>
                  </div>
                </div>
              </div>
              <div className="pt-4">
                <p className="text-sm text-muted-foreground">
                  Want to see the AI in action first?{" "}
                  <Link 
                    href="/demo"
                    className="text-primary hover:underline font-medium"
                    data-testid="link-instant-access"
                  >
                    Try our live AI demo
                  </Link>
                </p>
              </div>
            </div>
            <DemoRequestForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Chatbot Widget - Auto-opens after 10 seconds, auto-minimizes after another 10 seconds */}
      <ChatbotWidget type="sales" />
    </div>
  );
}
