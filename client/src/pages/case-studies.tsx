import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/footer";
import { Menu, X, Play, TrendingUp, Phone, Clock, UserCheck, Calendar, MessageSquare, ArrowRight, CheckCircle2, Star, Quote, Users, Building2, Target, Zap } from "lucide-react";
import { useState } from "react";
import logoFull from "@/assets/logo/logo-full.png";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

export default function CaseStudies() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const caseStudies = [
    {
      id: 1,
      clinicName: "Kelowna Dental Centre",
      location: "Kelowna, BC",
      challenge: "Kelowna Dental Centre was struggling with inconsistent patient flow and losing potential patients due to missed calls during busy hours. Their front desk team was overwhelmed, and many after-hours inquiries went unanswered.",
      solution: "We implemented our AI receptionist to handle all incoming inquiries 24/7, combined with automated follow-up sequences that re-engaged leads who hadn't booked within 48 hours. The system also launched a patient reactivation campaign targeting those who hadn't visited in over 12 months.",
      results: [
        { metric: "42%", label: "Increase in Monthly Booked Appointments", icon: Calendar },
        { metric: "63%", label: "Reduction in Missed-Call Loss", icon: Phone },
        { metric: "28%", label: "Reactivation of Inactive Patients", icon: UserCheck }
      ],
      testimonialQuote: "DentalLeadGenius transformed how we handle patient inquiries. We're booking more appointments than ever, and our team can focus on in-office care.",
      testimonialAuthor: "Dr. Sarah Chen",
      testimonialRole: "Owner, Kelowna Dental Centre",
      image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&h=400&fit=crop"
    },
    {
      id: 2,
      clinicName: "BrightSmiles Family Dentistry",
      location: "Vancouver, BC",
      challenge: "BrightSmiles was experiencing a low response rate for new patient inquiries. Leads were going cold because follow-up emails were delayed, and the team lacked a systematic approach to nurturing potential patients through the decision-making process.",
      solution: "We deployed our AI lead nurturing workflow that automatically engages new inquiries within minutes. The system sends personalized follow-up sequences, answers common questions via chatbot, and follows up at optimal times based on lead behavior.",
      results: [
        { metric: "35%", label: "More New Patient Consultations", icon: Users },
        { metric: "50%", label: "Faster Lead Response Time", icon: Clock },
        { metric: "22%", label: "Higher Treatment Acceptance Rate", icon: TrendingUp }
      ],
      testimonialQuote: "The speed at which leads are now contacted has been a game-changer. Patients feel valued, and our consultation bookings have never been higher.",
      testimonialAuthor: "Dr. Michael Torres",
      testimonialRole: "Lead Dentist, BrightSmiles Family Dentistry",
      image: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&h=400&fit=crop"
    }
  ];

  const testimonials = [
    {
      name: "Dr. Jennifer Lee",
      clinic: "Maple Ridge Dental Group",
      location: "Maple Ridge, BC",
      quote: "We were skeptical about AI at first, but DentalLeadGenius proved us wrong. Our patient acquisition cost dropped by 40%, and we're seeing a steady stream of qualified leads every week. The ROI has been incredible.",
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face",
      rating: 5
    },
    {
      name: "Dr. Robert Patel",
      clinic: "Downtown Dental Studio",
      location: "Victoria, BC",
      quote: "The automated follow-up system alone has recovered dozens of patients who would have otherwise gone to competitors. It's like having a tireless team member working 24/7 to grow our practice.",
      avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop&crop=face",
      rating: 5
    },
    {
      name: "Dr. Amanda Wright",
      clinic: "Coastal Family Dentistry",
      location: "Nanaimo, BC",
      quote: "What impressed me most was how quickly we were up and running. Within 48 hours, our AI chatbot was booking appointments and answering patient questions. The onboarding team was fantastic.",
      avatar: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100&h=100&fit=crop&crop=face",
      rating: 5
    },
    {
      name: "Dr. David Kim",
      clinic: "Summit Dental Care",
      location: "Kamloops, BC",
      quote: "DentalLeadGenius helped us reactivate over 150 dormant patients in just three months. Many hadn't visited in years but came back thanks to the personalized outreach campaigns. Highly recommend!",
      avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=100&h=100&fit=crop&crop=face",
      rating: 5
    }
  ];

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
                <Link href="/#features">
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer" data-testid="link-features">
                    Features
                  </span>
                </Link>
                <Link href="/case-studies">
                  <span className="text-sm text-foreground font-medium cursor-pointer" data-testid="link-case-studies">
                    Case Studies
                  </span>
                </Link>
                <Link href="/blog">
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer" data-testid="link-blog">
                    Blog
                  </span>
                </Link>
                <Link href="/about">
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer" data-testid="link-about">
                    About
                  </span>
                </Link>
                <Link href="/pricing">
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer" data-testid="link-pricing">
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
              <Button asChild data-testid="button-get-started-nav">
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
                <Link href="/#features">
                  <span className="text-sm cursor-pointer" onClick={() => setMobileMenuOpen(false)} data-testid="mobile-link-features">
                    Features
                  </span>
                </Link>
                <Link href="/case-studies">
                  <span className="text-sm font-medium cursor-pointer" onClick={() => setMobileMenuOpen(false)} data-testid="mobile-link-case-studies">
                    Case Studies
                  </span>
                </Link>
                <Link href="/blog">
                  <span className="text-sm cursor-pointer" onClick={() => setMobileMenuOpen(false)} data-testid="mobile-link-blog">
                    Blog
                  </span>
                </Link>
                <Link href="/about">
                  <span className="text-sm cursor-pointer" onClick={() => setMobileMenuOpen(false)} data-testid="mobile-link-about">
                    About
                  </span>
                </Link>
                <Link href="/pricing">
                  <span className="text-sm cursor-pointer" onClick={() => setMobileMenuOpen(false)} data-testid="mobile-link-pricing">
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
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            >
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Proven Success Stories</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6" data-testid="text-page-title">
              Real Results for Real Dental Clinics
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover how dental practices across Canada are transforming their patient acquisition with AI-powered automation.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-8 bg-primary/5 border-y">
        <div className="container mx-auto px-6">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              { value: "150+", label: "Dental Clinics Served" },
              { value: "42%", label: "Avg. Appointment Increase" },
              { value: "24/7", label: "AI Availability" },
              { value: "98%", label: "Client Satisfaction" }
            ].map((stat, index) => (
              <motion.div key={stat.label} variants={fadeInUp} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary" data-testid={`text-stat-value-${index + 1}`}>
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Case Studies Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div className="text-center mb-16" variants={fadeInUp}>
              <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-case-studies-title">
                Featured Case Studies
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See the measurable impact DentalLeadGenius has made for practices like yours
              </p>
            </motion.div>

            <div className="space-y-16">
              {caseStudies.map((study, index) => (
                <motion.div key={study.id} variants={fadeInUp}>
                  <Card className="overflow-hidden">
                    <div className={`grid lg:grid-cols-2 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                      {/* Image Side */}
                      <div className={`relative h-64 lg:h-auto ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                        <img 
                          src={study.image} 
                          alt={study.clinicName}
                          className="w-full h-full object-cover"
                          data-testid={`img-case-study-${study.id}`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/20" />
                        <div className="absolute bottom-4 left-4 lg:bottom-6 lg:left-6">
                          <div className="flex items-center gap-2 text-white">
                            <Building2 className="h-5 w-5" />
                            <span className="font-semibold">{study.clinicName}</span>
                          </div>
                          <div className="text-white/80 text-sm mt-1">{study.location}</div>
                        </div>
                      </div>

                      {/* Content Side */}
                      <CardContent className={`p-6 lg:p-10 ${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                        <div className="space-y-6">
                          {/* Challenge */}
                          <div>
                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
                              <Target className="h-5 w-5" />
                              <span className="font-semibold text-sm uppercase tracking-wide">The Challenge</span>
                            </div>
                            <p className="text-muted-foreground" data-testid={`text-challenge-${study.id}`}>
                              {study.challenge}
                            </p>
                          </div>

                          {/* Solution */}
                          <div>
                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                              <Zap className="h-5 w-5" />
                              <span className="font-semibold text-sm uppercase tracking-wide">Our Solution</span>
                            </div>
                            <p className="text-muted-foreground" data-testid={`text-solution-${study.id}`}>
                              {study.solution}
                            </p>
                          </div>

                          {/* Results */}
                          <div>
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-4">
                              <TrendingUp className="h-5 w-5" />
                              <span className="font-semibold text-sm uppercase tracking-wide">The Results</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              {study.results.map((result, resultIndex) => (
                                <div 
                                  key={result.label} 
                                  className="text-center p-4 rounded-lg bg-muted/50"
                                  data-testid={`text-result-${study.id}-${resultIndex + 1}`}
                                >
                                  <result.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                                  <div className="text-2xl font-bold text-primary">{result.metric}</div>
                                  <div className="text-xs text-muted-foreground mt-1">{result.label}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Quote */}
                          <div className="pt-4 border-t">
                            <div className="flex gap-4">
                              <Quote className="h-8 w-8 text-primary/30 flex-shrink-0" />
                              <div>
                                <p className="italic text-muted-foreground mb-2">"{study.testimonialQuote}"</p>
                                <div className="font-semibold">{study.testimonialAuthor}</div>
                                <div className="text-sm text-muted-foreground">{study.testimonialRole}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div className="text-center mb-16" variants={fadeInUp}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Client Testimonials</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-testimonials-title">
                What Dentists Are Saying
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Hear directly from dental professionals who have transformed their practices
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <motion.div key={testimonial.name} variants={fadeInUp}>
                  <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-6">
                      {/* Rating */}
                      <div className="flex gap-1 mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>

                      {/* Quote */}
                      <p className="text-muted-foreground mb-6 leading-relaxed" data-testid={`text-testimonial-${index + 1}`}>
                        "{testimonial.quote}"
                      </p>

                      {/* Author */}
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-muted">
                          <img 
                            src={testimonial.avatar} 
                            alt={testimonial.name}
                            className="w-full h-full object-cover"
                            data-testid={`img-testimonial-${index + 1}`}
                          />
                        </div>
                        <div>
                          <div className="font-semibold" data-testid={`text-testimonial-name-${index + 1}`}>
                            {testimonial.name}
                          </div>
                          <div className="text-sm text-muted-foreground">{testimonial.clinic}</div>
                          <div className="text-xs text-muted-foreground">{testimonial.location}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary/5">
        <div className="container mx-auto px-6">
          <motion.div 
            className="text-center max-w-3xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Become Our Next Success Story?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join 150+ dental clinics already growing with AI-powered patient acquisition. 
              See how DentalLeadGenius can transform your practice.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild data-testid="button-cta-demo">
                <Link href="/demo">
                  <Play className="h-5 w-5 mr-2" />
                  Access Free Demo
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild data-testid="button-cta-pricing">
                <Link href="/pricing">
                  View Pricing Plans
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
