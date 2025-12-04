import { Link } from "wouter";
import { ArrowLeft, FileText, UserCheck, Bot, CreditCard, RefreshCw, Ban, Scale, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import logoFull from "@/assets/logo/logo-full.png";
import { SITE_NAME } from "@shared/config";
import { Footer } from "@/components/footer";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6">
          <div className="flex h-16 items-center justify-between">
            <Link href="/">
              <img 
                src={logoFull} 
                alt={SITE_NAME}
                className="h-9 md:h-10 w-auto cursor-pointer object-contain"
                data-testid="link-logo"
              />
            </Link>
            <Button variant="ghost" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-6">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4" data-testid="text-terms-title">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: December 2024</p>
          </div>

          <div className="prose prose-lg max-w-none dark:prose-invert">
            <Card className="mb-8">
              <CardContent className="p-8">
                <p className="text-lg text-muted-foreground mb-0">
                  Welcome to {SITE_NAME}. By accessing or using our AI-powered lead generation platform for dental clinics, you agree to be bound by these Terms of Service. Please read them carefully before using our services.
                </p>
              </CardContent>
            </Card>

            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">1. User Responsibilities</h2>
              </div>
              <div className="pl-13 space-y-4">
                <p className="text-muted-foreground">By using {SITE_NAME}, you agree to:</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong className="text-foreground">Provide Accurate Information:</strong> You must provide truthful and accurate clinic information, including name, address, contact details, and business credentials.</li>
                  <li><strong className="text-foreground">Maintain Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</li>
                  <li><strong className="text-foreground">Comply with Laws:</strong> You agree to use the platform in compliance with all applicable local, state, and federal laws and regulations.</li>
                  <li><strong className="text-foreground">Authorized Use:</strong> You confirm that you have the authority to act on behalf of the dental clinic(s) you register.</li>
                </ul>
              </div>
            </section>

            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">2. AI Services Disclaimer</h2>
              </div>
              <div className="pl-13 space-y-4">
                <Card className="bg-muted/50">
                  <CardContent className="p-6">
                    <p className="text-muted-foreground mb-4">
                      <strong className="text-foreground">Important Notice:</strong> The AI-powered features of {SITE_NAME}, including chatbots and automated responses, are for informational and business communication purposes only.
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                      <li>AI responses are <strong className="text-foreground">not medical advice</strong> and should not be treated as such</li>
                      <li>AI responses are <strong className="text-foreground">not legal advice</strong> and do not constitute professional counsel</li>
                      <li>The platform facilitates business communications and lead generation only</li>
                      <li>Users should consult qualified professionals for medical or legal matters</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Scale className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">3. Limitation of Liability</h2>
              </div>
              <div className="pl-13 space-y-4">
                <p className="text-muted-foreground">{SITE_NAME} and its operators shall not be liable for:</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Any medical outcomes or patient-related decisions made based on platform communications</li>
                  <li>Legal consequences arising from user actions or campaign content</li>
                  <li>Loss of business, revenue, or data due to service interruptions</li>
                  <li>Third-party actions or content shared through the platform</li>
                  <li>Inaccuracies in AI-generated content or responses</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Our total liability is limited to the amount paid by you for the services in the 12 months preceding the claim.
                </p>
              </div>
            </section>

            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">4. Subscription & Payment Terms</h2>
              </div>
              <div className="pl-13 space-y-4">
                <p className="text-muted-foreground">Our pricing structure includes:</p>
                
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <h4 className="font-semibold mb-2">Essential</h4>
                        <p className="text-2xl font-bold text-primary">$497<span className="text-sm text-muted-foreground">/mo</span></p>
                        <p className="text-sm text-muted-foreground">+ $1,997 setup fee</p>
                      </div>
                      <div className="text-center">
                        <h4 className="font-semibold mb-2">Growth</h4>
                        <p className="text-2xl font-bold text-primary">$997<span className="text-sm text-muted-foreground">/mo</span></p>
                        <p className="text-sm text-muted-foreground">+ $2,997 setup fee</p>
                      </div>
                      <div className="text-center">
                        <h4 className="font-semibold mb-2">Elite</h4>
                        <p className="text-2xl font-bold text-primary">$1,497<span className="text-sm text-muted-foreground">/mo</span></p>
                        <p className="text-sm text-muted-foreground">+ $4,997 setup fee</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong className="text-foreground">Setup Fees:</strong> One-time fees are non-refundable after 30 days and cover platform onboarding, configuration, and training.</li>
                  <li><strong className="text-foreground">Monthly Subscriptions:</strong> Billed monthly in advance. Access continues until the end of the billing period.</li>
                  <li><strong className="text-foreground">Automatic Renewal:</strong> Subscriptions renew automatically unless cancelled before the renewal date.</li>
                  <li><strong className="text-foreground">Payment Methods:</strong> We accept major credit cards via Stripe secure payment processing.</li>
                </ul>
              </div>
            </section>

            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">5. Refund & Cancellation Policy</h2>
              </div>
              <div className="pl-13 space-y-4">
                <Card className="bg-green-500/10 border-green-500/20">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">30-Day Money-Back Guarantee</h4>
                    <p className="text-muted-foreground">
                      We offer a full refund within the first 30 days of your subscription if you're not satisfied with our service. Simply contact our support team to request a refund.
                    </p>
                  </CardContent>
                </Card>
                
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
                  <li><strong className="text-foreground">Refund Window:</strong> 30 days from the date of initial payment for both setup fees and first monthly payment</li>
                  <li><strong className="text-foreground">After 30 Days:</strong> Monthly fees are non-refundable, but you may cancel future billing</li>
                  <li><strong className="text-foreground">Cancellation:</strong> You may cancel your subscription at any time. Access continues until the end of your current billing period.</li>
                  <li><strong className="text-foreground">Data Export:</strong> Upon cancellation, you may request an export of your data within 30 days</li>
                </ul>
              </div>
            </section>

            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">6. Intellectual Property</h2>
              </div>
              <div className="pl-13 space-y-4">
                <p className="text-muted-foreground">Ownership and rights:</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong className="text-foreground">Platform Ownership:</strong> {SITE_NAME}, including its software, design, features, and branding, is owned by us and protected by intellectual property laws.</li>
                  <li><strong className="text-foreground">Your Content:</strong> You retain ownership of content you upload (clinic info, campaign text). By using our platform, you grant us a license to use this content to provide our services.</li>
                  <li><strong className="text-foreground">Restrictions:</strong> You may not copy, modify, distribute, or reverse-engineer any part of our platform without written permission.</li>
                  <li><strong className="text-foreground">Trademarks:</strong> Our name, logo, and branding are protected trademarks and may not be used without authorization.</li>
                </ul>
              </div>
            </section>

            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Ban className="h-5 w-5 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold m-0">7. Prohibited Activities</h2>
              </div>
              <div className="pl-13 space-y-4">
                <p className="text-muted-foreground">The following activities are strictly prohibited:</p>
                <Card className="bg-destructive/5 border-destructive/20">
                  <CardContent className="p-6">
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                      <li><strong className="text-foreground">Spam:</strong> Sending unsolicited bulk emails or messages to recipients who have not opted in</li>
                      <li><strong className="text-foreground">Misuse:</strong> Using the platform for illegal, fraudulent, or harmful purposes</li>
                      <li><strong className="text-foreground">False Information:</strong> Providing misleading clinic or contact information</li>
                      <li><strong className="text-foreground">Harassment:</strong> Using the platform to harass, threaten, or abuse others</li>
                      <li><strong className="text-foreground">Data Scraping:</strong> Automated collection of data from our platform without permission</li>
                      <li><strong className="text-foreground">Security Violations:</strong> Attempting to breach, hack, or compromise platform security</li>
                      <li><strong className="text-foreground">Reselling:</strong> Reselling or sublicensing access to the platform without authorization</li>
                    </ul>
                  </CardContent>
                </Card>
                <p className="text-muted-foreground mt-4">
                  Violation of these terms may result in immediate account termination without refund.
                </p>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">8. Contact Us</h2>
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground mb-4">
                    If you have any questions about these Terms of Service, please contact us:
                  </p>
                  <div className="space-y-2">
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <a href="mailto:info@dentalleadgenius.com" className="text-primary hover:underline">info@dentalleadgenius.com</a>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
