import { MessageSquare, Users, Building2, BarChart3, Phone, Calendar, Play, Menu, X, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChatbotWidget } from "@/components/chatbot-widget";
import { DemoAccessModal } from "@/components/demo-access-modal";
import { useState } from "react";
import { Link } from "wouter";
import { SiWhatsapp } from "react-icons/si";
import heroImage from "@assets/generated_images/modern_dental_clinic_hero_image.png";
import logoFull from "@/assets/logo/logo-full.png";
import logoIcon from "@/assets/logo/icon.png";

export default function Landing() {
  const [showDemoModal, setShowDemoModal] = useState(false);
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
              <Button onClick={() => setShowDemoModal(true)} data-testid="button-get-access-nav">
                Get Instant Access
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
                  <Button onClick={() => { setShowDemoModal(true); setMobileMenuOpen(false); }}>
                    Get Instant Access
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Modern dental clinic"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/50" />
        </div>

        <div className="container mx-auto px-6 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1
                className="text-5xl lg:text-7xl font-bold leading-tight"
                data-testid="text-hero-headline"
              >
                Generate{" "}
                <span className="text-primary">10x More</span> Quality Dental Leads
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl">
                AI-powered lead generation platform that automates outreach, gets more
                clients, and helps dental clinics grow their practice with intelligent
                chatbots and multi-channel campaigns.
              </p>

              {/* Contact Buttons */}
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="gap-2 px-6"
                  onClick={() => setShowDemoModal(true)}
                  data-testid="button-book-demo-hero"
                >
                  <Calendar className="h-5 w-5" />
                  Get Instant Access
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 px-6"
                  asChild
                  data-testid="button-whatsapp"
                >
                  <a
                    href={`https://wa.me/${ADMIN_WHATSAPP}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <SiWhatsapp className="h-5 w-5" />
                    WhatsApp
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 px-6"
                  asChild
                  data-testid="button-sms"
                >
                  <a href={`sms:${ADMIN_PHONE}`}>
                    <Phone className="h-5 w-5" />
                    Send SMS
                  </a>
                </Button>
              </div>
            </div>

            <div className="relative lg:block hidden">
              <div className="absolute -inset-4 bg-primary/10 rounded-2xl blur-3xl" />
              <img
                src={heroImage}
                alt="Dental clinic interface"
                className="relative rounded-2xl shadow-2xl"
              />
            </div>
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

      {/* CTA Section */}
      <section className="py-24 bg-primary/5">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Lead Generation?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join hundreds of dental clinics already growing with DentalLeadGenius
          </p>
          <Button
            size="lg"
            className="px-8"
            onClick={() => setShowDemoModal(true)}
            data-testid="button-book-demo-cta"
          >
            <Calendar className="h-5 w-5 mr-2" />
            Get Instant Access
          </Button>
        </div>
      </section>

      {/* Chatbot Widget - Auto-opens after 10 seconds, auto-minimizes after another 10 seconds */}
      <ChatbotWidget type="sales" />

      {/* Demo Access Modal */}
      <DemoAccessModal open={showDemoModal} onOpenChange={setShowDemoModal} />
    </div>
  );
}
