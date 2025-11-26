import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Users, 
  Building2, 
  BarChart3, 
  Send, 
  Clock, 
  Calendar,
  CheckCircle2,
  ArrowRight,
  Play,
  Sparkles
} from "lucide-react";

export default function Demo() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <span className="text-xl font-bold cursor-pointer" data-testid="link-home">
              DentalLeadGenius
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Live Demo
            </Badge>
            <Button asChild data-testid="button-login-demo">
              <a href="/api/login">Login to Dashboard</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 border-b">
        <div className="container mx-auto px-6 text-center">
          <Badge className="mb-4" variant="outline">Interactive Demo</Badge>
          <h1 className="text-4xl lg:text-5xl font-bold mb-4" data-testid="text-demo-title">
            Explore DentalLeadGenius
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            See how our AI-powered platform helps dental clinics generate 10x more quality leads
            with intelligent automation and multi-channel outreach.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild data-testid="button-start-trial">
              <a href="/api/login">
                <Play className="h-4 w-4 mr-2" />
                Start Free Trial
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/#features">View Features</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Demo Tabs */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto gap-2">
              <TabsTrigger value="overview" className="py-3" data-testid="tab-overview">
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="leads" className="py-3" data-testid="tab-leads">
                <Users className="h-4 w-4 mr-2" />
                Leads
              </TabsTrigger>
              <TabsTrigger value="outreach" className="py-3" data-testid="tab-outreach">
                <Send className="h-4 w-4 mr-2" />
                Outreach
              </TabsTrigger>
              <TabsTrigger value="chatbot" className="py-3" data-testid="tab-chatbot">
                <MessageSquare className="h-4 w-4 mr-2" />
                AI Chatbot
              </TabsTrigger>
              <TabsTrigger value="clinics" className="py-3" data-testid="tab-clinics">
                <Building2 className="h-4 w-4 mr-2" />
                Multi-Clinic
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Leads</CardDescription>
                    <CardTitle className="text-3xl">2,847</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-green-500">+12% from last month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Demos Booked</CardDescription>
                    <CardTitle className="text-3xl">156</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-green-500">+8% from last month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Conversion Rate</CardDescription>
                    <CardTitle className="text-3xl">5.5%</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-green-500">+2.1% from last month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Active Campaigns</CardDescription>
                    <CardTitle className="text-3xl">12</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">Across 3 channels</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Platform Highlights</CardTitle>
                  <CardDescription>Key features that drive results</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">AI Sales Chatbot</h4>
                        <p className="text-sm text-muted-foreground">
                          24/7 lead qualification and demo booking
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Send className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Multi-Channel Outreach</h4>
                        <p className="text-sm text-muted-foreground">
                          Email, SMS, and WhatsApp campaigns
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Automated Sequences</h4>
                        <p className="text-sm text-muted-foreground">
                          Follow-up campaigns on autopilot
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leads" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lead Management</CardTitle>
                  <CardDescription>Import, track, and convert leads efficiently</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                          SC
                        </div>
                        <div>
                          <p className="font-medium">Smile Care Dental</p>
                          <p className="text-sm text-muted-foreground">contact@smilecare.com</p>
                        </div>
                      </div>
                      <Badge>Demo Booked</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                          FD
                        </div>
                        <div>
                          <p className="font-medium">Family Dentistry</p>
                          <p className="text-sm text-muted-foreground">info@familydentistry.com</p>
                        </div>
                      </div>
                      <Badge variant="secondary">Replied</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                          BD
                        </div>
                        <div>
                          <p className="font-medium">Bright Dental Group</p>
                          <p className="text-sm text-muted-foreground">hello@brightdental.com</p>
                        </div>
                      </div>
                      <Badge variant="outline">Contacted</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">CSV Import</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Bulk import thousands of leads
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Auto-detect column mapping
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Duplicate detection
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Status Tracking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        New → Contacted → Replied → Won
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Custom notes and tags
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Activity timeline
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="outreach" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Multi-Channel Campaigns</CardTitle>
                  <CardDescription>Reach leads across email, SMS, and WhatsApp</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Email Campaign</h4>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Introduction to DentalLeadGenius
                      </p>
                      <div className="text-sm">
                        <p>Sent: 1,247</p>
                        <p>Opened: 423 (34%)</p>
                        <p>Replied: 89 (7%)</p>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">SMS Campaign</h4>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Quick demo invite
                      </p>
                      <div className="text-sm">
                        <p>Sent: 856</p>
                        <p>Delivered: 821 (96%)</p>
                        <p>Replied: 156 (18%)</p>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">WhatsApp</h4>
                        <Badge variant="outline">Paused</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Follow-up sequence
                      </p>
                      <div className="text-sm">
                        <p>Sent: 234</p>
                        <p>Read: 201 (86%)</p>
                        <p>Replied: 67 (29%)</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI-Generated Messages</CardTitle>
                  <CardDescription>Let AI craft personalized outreach</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm italic">
                      "Hi Dr. Smith, I noticed your practice has been growing rapidly. 
                      Many clinics like yours are using DentalLeadGenius to automate 
                      lead generation and book 10x more demos. Would you like instant 
                      access to see how it works for Family Dental Care?"
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Generated by AI • Personalized for each lead
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chatbot" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Sales Chatbot</CardTitle>
                    <CardDescription>For your website visitors</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <div className="flex gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex-shrink-0" />
                        <div className="bg-background rounded-lg p-2 text-sm">
                          Hi! I'm Sarah from DentalLeadGenius. How can I help you today?
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <div className="bg-primary text-primary-foreground rounded-lg p-2 text-sm">
                          What's your pricing?
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex-shrink-0" />
                        <div className="bg-background rounded-lg p-2 text-sm">
                          Great question! We have 3 packages starting at $1,997 setup + $497/month...
                        </div>
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        24/7 lead qualification
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Answers pricing questions
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Books demos instantly
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Patient Chatbot</CardTitle>
                    <CardDescription>For your clinic's patients</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <div className="flex gap-2">
                        <div className="h-8 w-8 rounded-full bg-green-500/20 flex-shrink-0" />
                        <div className="bg-background rounded-lg p-2 text-sm">
                          Welcome to Smile Dental! How can I help you today?
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <div className="bg-green-500 text-white rounded-lg p-2 text-sm">
                          I need to book a cleaning
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-8 w-8 rounded-full bg-green-500/20 flex-shrink-0" />
                        <div className="bg-background rounded-lg p-2 text-sm">
                          I'd be happy to help! What date works best for you?
                        </div>
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Answers dental questions
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Books appointments
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Custom clinic branding
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="clinics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Multi-Clinic Management</CardTitle>
                  <CardDescription>Manage multiple clinics from one dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-3">
                        <Building2 className="h-6 w-6 text-blue-500" />
                      </div>
                      <h4 className="font-semibold">Smile Care Dental</h4>
                      <p className="text-sm text-muted-foreground mb-2">Los Angeles, CA</p>
                      <Badge variant="secondary">156 patients</Badge>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="h-12 w-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-3">
                        <Building2 className="h-6 w-6 text-green-500" />
                      </div>
                      <h4 className="font-semibold">Family Dentistry</h4>
                      <p className="text-sm text-muted-foreground mb-2">Houston, TX</p>
                      <Badge variant="secondary">89 patients</Badge>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="h-12 w-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
                        <Building2 className="h-6 w-6 text-purple-500" />
                      </div>
                      <h4 className="font-semibold">Bright Smile NYC</h4>
                      <p className="text-sm text-muted-foreground mb-2">New York, NY</p>
                      <Badge variant="secondary">234 patients</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Branded Pages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Custom logo and colors
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Unique URL for each clinic
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Patient chatbot included
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Appointment System</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Online booking widget
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Appointment tracking
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Per-clinic analytics
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t bg-muted/30">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join hundreds of dental clinics already growing with DentalLeadGenius
          </p>
          <Button size="lg" asChild data-testid="button-start-free-trial">
            <a href="/api/login">
              Start Free Trial
              <ArrowRight className="h-4 w-4 ml-2" />
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}
