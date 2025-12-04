import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Footer } from "@/components/footer";
import { Menu, X, Play, Target, Lightbulb, Heart, Shield, CheckCircle2, Zap, Clock, Lock, Users, Sparkles, Building2 } from "lucide-react";
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

export default function About() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const founders = [
    {
      name: "Mohammad Ali",
      title: "AI Automation Strategist & Dental Growth Specialist",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      bio: "With over 5 years of experience in business administration and digital marketing, Mohammad has pioneered AI workflow engineering solutions for healthcare practices. His expertise in lead generation strategy and AI pipeline development has helped numerous dental clinics transform their patient acquisition processes. Mohammad's vision for DentalLeadGenius stems from his deep understanding of how technology can bridge the gap between dental practices and potential patients, creating seamless communication channels that convert leads into loyal patients."
    },
    {
      name: "Shoiba Ali",
      title: "AI Automation Strategist & Dental Growth Specialist",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face",
      bio: "Shoiba brings 5+ years of expertise in business administration and clinic automation to DentalLeadGenius. Her background in patient communication optimization and AI-driven marketing strategies has been instrumental in developing systems that truly understand dental practice needs. Shoiba's focus on creating ethical, results-driven automation ensures that every clinic using DentalLeadGenius sees measurable improvements in patient engagement and conversion rates while maintaining the personal touch that healthcare demands."
    }
  ];

  const teamMembers = [
    {
      name: "Alex Chen",
      role: "AI Automation Engineer",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
      bio: "Specializes in building intelligent chatbot systems and automation pipelines that seamlessly integrate with dental practice management software."
    },
    {
      name: "Sarah Mitchell",
      role: "Outreach & Lead Specialist",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face",
      bio: "Expert in multi-channel marketing strategies, helping clinics maximize their patient acquisition through targeted email, SMS, and social campaigns."
    },
    {
      name: "David Thompson",
      role: "Client Success Manager",
      image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face",
      bio: "Dedicated to ensuring every clinic achieves their growth goals with personalized onboarding, training, and ongoing strategic support."
    }
  ];

  const trustPoints = [
    {
      icon: CheckCircle2,
      title: "Transparent Workflows",
      description: "Every automated action is logged and visible. You always know exactly what's happening with your leads and campaigns."
    },
    {
      icon: Zap,
      title: "Measurable Results",
      description: "Real-time analytics and detailed reporting show exactly how many leads are being captured, nurtured, and converted."
    },
    {
      icon: Clock,
      title: "Fast Onboarding",
      description: "Get up and running in under 48 hours. Our team handles setup so you can focus on what matters most—your patients."
    },
    {
      icon: Lock,
      title: "Secure & HIPAA-Friendly",
      description: "Enterprise-grade security with encrypted communications and data handling practices designed for healthcare compliance."
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
                <Link href="/#testimonials">
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer" data-testid="link-testimonials">
                    Testimonials
                  </span>
                </Link>
                <Link href="/blog">
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer" data-testid="link-blog">
                    Blog
                  </span>
                </Link>
                <Link href="/about">
                  <span className="text-sm text-foreground font-medium cursor-pointer" data-testid="link-about">
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
                <Link href="/#testimonials">
                  <span className="text-sm cursor-pointer" onClick={() => setMobileMenuOpen(false)} data-testid="mobile-link-testimonials">
                    Testimonials
                  </span>
                </Link>
                <Link href="/blog">
                  <span className="text-sm cursor-pointer" onClick={() => setMobileMenuOpen(false)} data-testid="mobile-link-blog">
                    Blog
                  </span>
                </Link>
                <Link href="/about">
                  <span className="text-sm font-medium cursor-pointer" onClick={() => setMobileMenuOpen(false)} data-testid="mobile-link-about">
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
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Meet Our Team</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6" data-testid="text-page-title">
              About DentalLeadGenius™
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're on a mission to transform how dental clinics attract and convert patients through the power of AI automation.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Statement Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <motion.div 
            className="max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div className="text-center mb-12" variants={fadeInUp}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6" data-testid="text-mission-title">
                Our Mission
              </h2>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card className="border-0 shadow-lg bg-card">
                <CardContent className="p-8 md:p-12">
                  <div className="grid md:grid-cols-3 gap-8 mb-8">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                        <Lightbulb className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="font-semibold mb-2">Innovation</h3>
                      <p className="text-sm text-muted-foreground">Leveraging cutting-edge AI to solve real problems</p>
                    </div>
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                        <Heart className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="font-semibold mb-2">Ethics</h3>
                      <p className="text-sm text-muted-foreground">Building trust through transparency and integrity</p>
                    </div>
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
                        <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="font-semibold mb-2">Reliability</h3>
                      <p className="text-sm text-muted-foreground">24/7 systems you can count on</p>
                    </div>
                  </div>
                  <p className="text-lg text-center leading-relaxed text-muted-foreground" data-testid="text-mission-statement">
                    At DentalLeadGenius, we believe every dental clinic deserves access to enterprise-level marketing automation. 
                    Our AI-powered platform helps practices of all sizes capture more leads, nurture patient relationships, 
                    and convert inquiries into booked appointments—all while maintaining the personal touch that healthcare demands. 
                    We're committed to ethical automation that enhances, not replaces, the human connection between dentists and their patients.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Founders Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div className="text-center mb-16" variants={fadeInUp}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Leadership</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-founders-title">
                Meet Our Founders
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                The visionaries behind DentalLeadGenius, combining expertise in AI automation and dental practice growth
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {founders.map((founder, index) => (
                <motion.div key={founder.name} variants={fadeInUp}>
                  <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-8">
                      <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-32 h-32 rounded-full overflow-hidden mb-4 ring-4 ring-primary/10">
                          <img 
                            src={founder.image} 
                            alt={founder.name}
                            className="w-full h-full object-cover"
                            data-testid={`img-founder-${index + 1}`}
                          />
                        </div>
                        <h3 className="text-xl font-bold" data-testid={`text-founder-name-${index + 1}`}>
                          {founder.name}
                        </h3>
                        <p className="text-sm text-primary font-medium mt-1" data-testid={`text-founder-title-${index + 1}`}>
                          {founder.title}
                        </p>
                      </div>
                      <p className="text-muted-foreground leading-relaxed text-sm" data-testid={`text-founder-bio-${index + 1}`}>
                        {founder.bio}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
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
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Our Team</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-team-title">
                The Team Behind the Platform
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Dedicated professionals committed to your clinic's success
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {teamMembers.map((member, index) => (
                <motion.div key={member.name} variants={fadeInUp}>
                  <Card className="h-full text-center hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-6">
                      <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 ring-4 ring-muted">
                        <img 
                          src={member.image} 
                          alt={member.name}
                          className="w-full h-full object-cover"
                          data-testid={`img-team-${index + 1}`}
                        />
                      </div>
                      <h3 className="text-lg font-semibold" data-testid={`text-team-name-${index + 1}`}>
                        {member.name}
                      </h3>
                      <p className="text-sm text-primary font-medium mb-3" data-testid={`text-team-role-${index + 1}`}>
                        {member.role}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid={`text-team-bio-${index + 1}`}>
                        {member.bio}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Trust Us Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div className="text-center mb-16" variants={fadeInUp}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Trust & Security</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-trust-title">
                Why Trust DentalLeadGenius?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Built for healthcare, designed for results, secured for peace of mind
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {trustPoints.map((point, index) => (
                <motion.div key={point.title} variants={fadeInUp}>
                  <Card className="h-full text-center hover:shadow-lg transition-shadow duration-300 border-2 hover:border-primary/20">
                    <CardContent className="p-6">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                        <point.icon className="h-7 w-7 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2" data-testid={`text-trust-point-${index + 1}`}>
                        {point.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {point.description}
                      </p>
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
              Ready to Transform Your Practice?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join hundreds of dental clinics already growing with AI-powered automation. 
              Schedule a free demo and see the difference for yourself.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild data-testid="button-cta-demo">
                <Link href="/demo">
                  <Play className="h-5 w-5 mr-2" />
                  Book Your Free Demo
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild data-testid="button-cta-pricing">
                <Link href="/pricing">
                  View Pricing
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
