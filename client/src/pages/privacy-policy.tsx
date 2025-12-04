import { Link } from "wouter";
import { ArrowLeft, Shield, Lock, Mail, Database, UserCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import logoFull from "@/assets/logo/logo-full.png";
import { SITE_NAME } from "@shared/config";
import { Footer } from "@/components/footer";

export default function PrivacyPolicy() {
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
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4" data-testid="text-privacy-title">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: December 2024</p>
          </div>

          <div className="prose prose-lg max-w-none dark:prose-invert">
            <Card className="mb-8">
              <CardContent className="p-8">
                <p className="text-lg text-muted-foreground mb-6">
                  At {SITE_NAME}, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our AI-powered lead generation platform for dental clinics.
                </p>
              </CardContent>
            </Card>

            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">1. Information We Collect</h2>
              </div>
              <div className="pl-13 space-y-4">
                <p className="text-muted-foreground">We collect the following types of information to provide and improve our services:</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong className="text-foreground">Personal Information:</strong> Name, email address, phone number</li>
                  <li><strong className="text-foreground">Clinic Information:</strong> Clinic name, address, city, state, country</li>
                  <li><strong className="text-foreground">Business Data:</strong> Google Maps URL, website URL, ratings, review counts</li>
                  <li><strong className="text-foreground">Usage Data:</strong> How you interact with our platform, campaign performance metrics</li>
                  <li><strong className="text-foreground">Communication Data:</strong> Messages sent through our chatbots and email campaigns</li>
                </ul>
              </div>
            </section>

            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">2. Why We Collect Your Data</h2>
              </div>
              <div className="pl-13 space-y-4">
                <p className="text-muted-foreground">We use your information for the following purposes:</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong className="text-foreground">Lead Generation:</strong> To help dental clinics discover and connect with potential patients</li>
                  <li><strong className="text-foreground">Automation:</strong> To power AI-driven email campaigns, chatbots, and follow-up sequences</li>
                  <li><strong className="text-foreground">Communication:</strong> To send transactional emails, demo invitations, and service updates</li>
                  <li><strong className="text-foreground">Analytics:</strong> To measure campaign performance and improve our services</li>
                  <li><strong className="text-foreground">Customer Support:</strong> To respond to inquiries and provide technical assistance</li>
                </ul>
              </div>
            </section>

            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">3. How We Store Your Data</h2>
              </div>
              <div className="pl-13 space-y-4">
                <p className="text-muted-foreground">Your data security is our priority:</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong className="text-foreground">Secure Databases:</strong> All data is stored in encrypted, secure PostgreSQL databases</li>
                  <li><strong className="text-foreground">SSL/TLS Encryption:</strong> All data transmission is protected with industry-standard encryption</li>
                  <li><strong className="text-foreground">Access Controls:</strong> Strict access controls limit who can view or modify your data</li>
                  <li><strong className="text-foreground">Regular Backups:</strong> Automated backups ensure data recovery in case of incidents</li>
                  <li><strong className="text-foreground">Secure Hosting:</strong> Our platform is hosted on Replit's secure infrastructure</li>
                </ul>
              </div>
            </section>

            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">4. Third-Party Services</h2>
              </div>
              <div className="pl-13 space-y-4">
                <p className="text-muted-foreground">We use trusted third-party services to operate our platform:</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong className="text-foreground">Resend:</strong> For secure, verified email delivery. Resend only processes emails on our behalf and does not store or sell your data.</li>
                  <li><strong className="text-foreground">Replit Hosting:</strong> Our platform infrastructure provider, ensuring reliable and secure hosting.</li>
                  <li><strong className="text-foreground">Stripe:</strong> For secure payment processing. We do not store credit card information.</li>
                  <li><strong className="text-foreground">OpenAI:</strong> For AI-powered chatbot responses. Conversations are processed securely.</li>
                </ul>
                <Card className="bg-muted/50 mt-4">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground font-medium">
                      <strong className="text-foreground">Important:</strong> We never sell, rent, or share your personal data with third parties for marketing purposes.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">5. HIPAA Compliance</h2>
              </div>
              <div className="pl-13 space-y-4">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-6">
                    <p className="text-muted-foreground">
                      {SITE_NAME} is designed with healthcare privacy in mind. While our platform handles business contact information for dental clinics (not protected health information), we follow HIPAA-friendly practices:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
                      <li>We do not collect, store, or process patient medical records</li>
                      <li>Clinic communications are handled with care and confidentiality</li>
                      <li>Our systems follow industry best practices for data protection</li>
                      <li>Access to sensitive data is strictly controlled and logged</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-4 italic">
                      Note: If you require a Business Associate Agreement (BAA) for your practice, please contact us directly.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">6. Your Right to Delete Data</h2>
              </div>
              <div className="pl-13 space-y-4">
                <p className="text-muted-foreground">You have the right to request deletion of your personal data at any time:</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Email us at <a href="mailto:info@dentalleadgenius.com" className="text-primary hover:underline">info@dentalleadgenius.com</a> with your deletion request</li>
                  <li>We will process your request within 30 days</li>
                  <li>Upon deletion, all your personal data will be permanently removed from our systems</li>
                  <li>Some data may be retained for legal compliance purposes (e.g., billing records)</li>
                </ul>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">7. Contact Us</h2>
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground mb-4">
                    If you have any questions about this Privacy Policy or our data practices, please contact us:
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
