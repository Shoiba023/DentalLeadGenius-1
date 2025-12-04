import { Link } from "wouter";
import { Phone, Mail, Globe, Headphones, Shield, FileText, Lock } from "lucide-react";
import logoFull from "@/assets/logo/logo-full.png";
import { SITE_NAME } from "@shared/config";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-1">
            <Link href="/">
              <img 
                src={logoFull} 
                alt={SITE_NAME}
                className="h-8 w-auto cursor-pointer object-contain mb-4"
                data-testid="footer-logo"
              />
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              AI-powered lead generation platform for dental clinics. Generate 10x more qualified leads with intelligent automation.
            </p>
            <p className="text-xs text-muted-foreground">
              We are available to assist dental clinics across USA & Canada.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/demo" className="text-muted-foreground hover:text-foreground transition-colors">
                  Live Demo
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  Security & Compliance
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-muted-foreground hover:text-foreground transition-colors">
                  Sign Up
                </Link>
              </li>
              <li>
                <a 
                  href="https://dentalleadgenius.com/support" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Support Portal
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <a 
                  href="mailto:info@dentalleadgenius.com" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-email"
                >
                  info@dentalleadgenius.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <a 
                  href="tel:+12505742162" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-phone"
                >
                  +1 (250) 574-2162
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <a 
                  href="https://smartAIpartners.io" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-website"
                >
                  smartAIpartners.io
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Headphones className="h-4 w-4 text-primary" />
                <a 
                  href="https://dentalleadgenius.com/support" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-support"
                >
                  Support Portal
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} {SITE_NAME}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <Link href="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <span>|</span>
            <Link href="/terms-of-service" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <span>|</span>
            <Link href="/security" className="hover:text-foreground transition-colors">Security & Compliance</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
