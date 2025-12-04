import { Link } from "wouter";
import { ArrowLeft, ShieldCheck, Lock, Server, Mail, FileCheck, Eye, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import logoFull from "@/assets/logo/logo-full.png";
import { SITE_NAME } from "@shared/config";
import { Footer } from "@/components/footer";

export default function Security() {
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
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4" data-testid="text-security-title">Security & Compliance</h1>
            <p className="text-muted-foreground">How we protect your data and maintain industry standards</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card className="hover-elevate">
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">SSL Secured</h3>
                <p className="text-sm text-muted-foreground">256-bit encryption protects all data in transit</p>
              </CardContent>
            </Card>
            
            <Card className="hover-elevate">
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">HTTPS Only</h3>
                <p className="text-sm text-muted-foreground">All communications encrypted end-to-end</p>
              </CardContent>
            </Card>
            
            <Card className="hover-elevate">
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                  <Server className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Secure Hosting</h3>
                <p className="text-sm text-muted-foreground">Enterprise-grade infrastructure on Replit</p>
              </CardContent>
            </Card>
            
            <Card className="hover-elevate">
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="font-semibold mb-2">HIPAA-Friendly</h3>
                <p className="text-sm text-muted-foreground">Healthcare privacy best practices</p>
              </CardContent>
            </Card>
          </div>

          <div className="prose prose-lg max-w-none dark:prose-invert">
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">SSL/TLS Encryption</h2>
              </div>
              <div className="pl-13 space-y-4">
                <p className="text-muted-foreground">
                  Our website and all API communications are secured with SSL/TLS encryption:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong className="text-foreground">256-bit Encryption:</strong> Industry-standard encryption protects all data transmitted between your browser and our servers</li>
                  <li><strong className="text-foreground">HTTPS Everywhere:</strong> All pages and API endpoints are served exclusively over HTTPS</li>
                  <li><strong className="text-foreground">Certificate Verification:</strong> Our SSL certificates are issued by trusted certificate authorities</li>
                  <li><strong className="text-foreground">Perfect Forward Secrecy:</strong> Even if encryption keys are compromised, past communications remain secure</li>
                </ul>
              </div>
            </section>

            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Server className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">Data Storage & Protection</h2>
              </div>
              <div className="pl-13 space-y-4">
                <p className="text-muted-foreground">
                  Your data is stored securely with multiple layers of protection:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong className="text-foreground">Encrypted Databases:</strong> All data at rest is encrypted using AES-256 encryption</li>
                  <li><strong className="text-foreground">Secure Infrastructure:</strong> Hosted on Replit's enterprise-grade cloud infrastructure</li>
                  <li><strong className="text-foreground">Access Controls:</strong> Role-based access ensures only authorized personnel can access sensitive data</li>
                  <li><strong className="text-foreground">Regular Backups:</strong> Automated daily backups with point-in-time recovery capability</li>
                  <li><strong className="text-foreground">Audit Logging:</strong> All data access and modifications are logged for security monitoring</li>
                </ul>
              </div>
            </section>

            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">Patient Data & Consent</h2>
              </div>
              <div className="pl-13 space-y-4">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-3">Our Data Collection Policy</h4>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                      <li><strong className="text-foreground">No Patient Data Without Consent:</strong> We do not store, process, or access patient medical records or protected health information (PHI)</li>
                      <li><strong className="text-foreground">Business Data Only:</strong> Our platform handles clinic business information, not patient treatment data</li>
                      <li><strong className="text-foreground">Marketing Opt-In Required:</strong> Leads are only enrolled in campaigns with explicit marketing consent</li>
                      <li><strong className="text-foreground">Easy Opt-Out:</strong> All email communications include unsubscribe options</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileCheck className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">Best Practices & Compliance</h2>
              </div>
              <div className="pl-13 space-y-4">
                <p className="text-muted-foreground">
                  We follow industry best practices for data processing and security:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong className="text-foreground">Security Reviews:</strong> Regular security assessments and vulnerability testing</li>
                  <li><strong className="text-foreground">Secure Development:</strong> Code reviews and security-focused development practices</li>
                  <li><strong className="text-foreground">Incident Response:</strong> Documented procedures for handling security incidents</li>
                  <li><strong className="text-foreground">Employee Training:</strong> All team members trained on data protection and privacy</li>
                  <li><strong className="text-foreground">Vendor Assessment:</strong> Third-party services are vetted for security compliance</li>
                </ul>
              </div>
            </section>

            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">HIPAA-Friendly Practices</h2>
              </div>
              <div className="pl-13 space-y-4">
                <Card className="bg-green-500/10 border-green-500/20">
                  <CardContent className="p-6">
                    <p className="text-muted-foreground mb-4">
                      While {SITE_NAME} focuses on business lead generation (not patient health records), we implement HIPAA-friendly practices to support healthcare industry standards:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                      <li>Encrypted data transmission and storage</li>
                      <li>Access controls and authentication requirements</li>
                      <li>Audit trails for data access and modifications</li>
                      <li>Secure communication channels for sensitive information</li>
                      <li>Regular security training for all team members</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-4 italic">
                      Note: {SITE_NAME} does not claim full HIPAA certification as we do not handle protected health information (PHI). Our practices align with healthcare industry security expectations.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">Email Security (Resend)</h2>
              </div>
              <div className="pl-13 space-y-4">
                <p className="text-muted-foreground">
                  We use Resend for secure, verified email delivery:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong className="text-foreground">Domain Verification:</strong> DKIM, SPF, and DMARC authentication for all outgoing emails</li>
                  <li><strong className="text-foreground">Encrypted Transmission:</strong> All emails are sent over encrypted connections</li>
                  <li><strong className="text-foreground">Delivery Tracking:</strong> Real-time monitoring of email delivery status</li>
                  <li><strong className="text-foreground">Anti-Spam Compliance:</strong> CAN-SPAM compliant with unsubscribe options</li>
                  <li><strong className="text-foreground">No Data Sharing:</strong> Resend processes emails on our behalf only and does not sell or share recipient data</li>
                </ul>
                <Card className="bg-muted/50 mt-4">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">
                      Our email domain <strong className="text-foreground">dentalleadgenius.com</strong> is fully verified with DNS records for maximum deliverability and security.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">Questions About Security?</h2>
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground mb-4">
                    We're committed to transparency about our security practices. If you have questions or concerns, please contact us:
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
