/**
 * Public Onboarding Page - Post-Payment Redirect
 * 
 * Stripe checkout should redirect to this page after successful payment: /onboarding
 * This page collects clinic details to set up branded dashboard and AI chatbot.
 */

import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Upload, ArrowLeft, Sparkles, MessageSquare, Bell, Lock } from "lucide-react";
import logoFull from "@/assets/logo/logo-full.png";
import { SUPPORT_EMAIL } from "@shared/config";

interface OnboardingFormData {
  clinicName: string;
  brandName: string;
  clinicLogo: File | null;
  doctorName: string;
  contactEmail: string;
  whatsappNumber: string;
  clinicWebsite: string;
  countryCity: string;
  timeZone: string;
  planPurchased: string;
  topServices: string;
  preferredSlug: string;
  preferredChannel: string;
  existingBookingLink: string;
  specialNotes: string;
}

export default function PublicOnboardingPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [logoFileName, setLogoFileName] = useState<string>("");
  const [formData, setFormData] = useState<OnboardingFormData>({
    clinicName: "",
    brandName: "",
    clinicLogo: null,
    doctorName: "",
    contactEmail: "",
    whatsappNumber: "",
    clinicWebsite: "",
    countryCity: "",
    timeZone: "",
    planPurchased: "",
    topServices: "",
    preferredSlug: "",
    preferredChannel: "",
    existingBookingLink: "",
    specialNotes: "",
  });

  const handleInputChange = (field: keyof OnboardingFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, clinicLogo: file }));
      setLogoFileName(file.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Log all form values for debugging
    console.log("Onboarding Form Submitted:", {
      ...formData,
      clinicLogo: formData.clinicLogo ? {
        name: formData.clinicLogo.name,
        size: formData.clinicLogo.size,
        type: formData.clinicLogo.type,
      } : null,
    });

    // Show success state
    setIsSubmitted(true);

    // Future: POST to /api/onboarding
    // const submitOnboarding = async () => {
    //   const formDataToSend = new FormData();
    //   Object.entries(formData).forEach(([key, value]) => {
    //     if (value instanceof File) {
    //       formDataToSend.append(key, value);
    //     } else if (value) {
    //       formDataToSend.append(key, value);
    //     }
    //   });
    //   await fetch('/api/onboarding', {
    //     method: 'POST',
    //     body: formDataToSend,
    //   });
    // };
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">Thank You!</CardTitle>
            <CardDescription className="text-base mt-2">
              Your onboarding form has been received. Our team will set up your branded DentalLeadGenius dashboard and AI chatbot within 24–48 hours and send your secure login link via email and WhatsApp.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline" className="mt-4" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="link-back-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={logoFull} alt="DentalLeadGenius" className="h-12 md:h-14 w-auto object-contain" />
        </div>

        {/* Hero Section */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Payment Successful – Welcome to DentalLeadGenius
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your subscription is complete! We now need your clinic details to set up your branded dashboard and AI chatbot.
          </p>
        </div>

        {/* What Happens Next Box */}
        <Card className="mb-10">
          <CardHeader>
            <CardTitle className="text-lg">What happens next?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <span>We will create a branded clinic dashboard for your practice</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-primary" />
                </div>
                <span>Configure your AI chatbot with your services and branding</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4 text-primary" />
                </div>
                <span>Activate outreach campaigns and appointment reminders</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4 text-primary" />
                </div>
                <span>Send you a secure login link within 24–48 hours</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Onboarding Form */}
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Clinic Setup</CardTitle>
            <CardDescription>
              Fill in the details below so we can personalize your experience. Fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Clinic / Practice Name */}
              <div className="space-y-2">
                <Label htmlFor="clinicName">Clinic / Practice Name *</Label>
                <Input
                  id="clinicName"
                  placeholder="e.g., Bright Smile Dental Clinic"
                  value={formData.clinicName}
                  onChange={(e) => handleInputChange("clinicName", e.target.value)}
                  required
                  data-testid="input-clinic-name"
                />
              </div>

              {/* Brand / Company Name */}
              <div className="space-y-2">
                <Label htmlFor="brandName">Brand / Company Name (optional)</Label>
                <Input
                  id="brandName"
                  placeholder="e.g., Bright Smile Healthcare Group"
                  value={formData.brandName}
                  onChange={(e) => handleInputChange("brandName", e.target.value)}
                  data-testid="input-brand-name"
                />
              </div>

              {/* Clinic Logo Upload */}
              <div className="space-y-2">
                <Label htmlFor="clinicLogo">Clinic Logo *</Label>
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="clinicLogo"
                    className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover-elevate"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Choose File</span>
                  </label>
                  <span className="text-sm text-muted-foreground">
                    {logoFileName || "PNG or JPG only"}
                  </span>
                </div>
                <Input
                  id="clinicLogo"
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                  required
                  data-testid="input-clinic-logo"
                />
              </div>

              {/* Doctor / Owner Name */}
              <div className="space-y-2">
                <Label htmlFor="doctorName">Doctor / Owner Name *</Label>
                <Input
                  id="doctorName"
                  placeholder="e.g., Dr. Sarah Johnson"
                  value={formData.doctorName}
                  onChange={(e) => handleInputChange("doctorName", e.target.value)}
                  required
                  data-testid="input-doctor-name"
                />
              </div>

              {/* Best Contact Email */}
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Best Contact Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="e.g., dr.sarah@brightsmile.com"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                  required
                  data-testid="input-contact-email"
                />
              </div>

              {/* WhatsApp / Mobile Number */}
              <div className="space-y-2">
                <Label htmlFor="whatsappNumber">WhatsApp / Mobile Number *</Label>
                <Input
                  id="whatsappNumber"
                  type="tel"
                  placeholder="e.g., +1 555 123 4567"
                  value={formData.whatsappNumber}
                  onChange={(e) => handleInputChange("whatsappNumber", e.target.value)}
                  required
                  data-testid="input-whatsapp-number"
                />
                <p className="text-xs text-muted-foreground">Include country code (e.g., +1 for US, +44 for UK)</p>
              </div>

              {/* Clinic Website */}
              <div className="space-y-2">
                <Label htmlFor="clinicWebsite">Clinic Website (optional)</Label>
                <Input
                  id="clinicWebsite"
                  type="url"
                  placeholder="e.g., https://www.brightsmile.com"
                  value={formData.clinicWebsite}
                  onChange={(e) => handleInputChange("clinicWebsite", e.target.value)}
                  data-testid="input-clinic-website"
                />
              </div>

              {/* Clinic Country & City */}
              <div className="space-y-2">
                <Label htmlFor="countryCity">Clinic Country & City *</Label>
                <Input
                  id="countryCity"
                  placeholder="e.g., New York, USA"
                  value={formData.countryCity}
                  onChange={(e) => handleInputChange("countryCity", e.target.value)}
                  required
                  data-testid="input-country-city"
                />
              </div>

              {/* Time Zone */}
              <div className="space-y-2">
                <Label htmlFor="timeZone">Time Zone *</Label>
                <Input
                  id="timeZone"
                  placeholder="e.g., EST, PST, GMT+5:30"
                  value={formData.timeZone}
                  onChange={(e) => handleInputChange("timeZone", e.target.value)}
                  required
                  data-testid="input-timezone"
                />
              </div>

              {/* Plan Purchased */}
              <div className="space-y-2">
                <Label htmlFor="planPurchased">Plan Purchased *</Label>
                <Select
                  value={formData.planPurchased}
                  onValueChange={(value) => handleInputChange("planPurchased", value)}
                  required
                >
                  <SelectTrigger data-testid="select-plan-purchased">
                    <SelectValue placeholder="Select your plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="essential">Essential Package</SelectItem>
                    <SelectItem value="growth">Growth Package</SelectItem>
                    <SelectItem value="elite">Elite Package</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Top Services You Want to Promote */}
              <div className="space-y-2">
                <Label htmlFor="topServices">Top Services You Want to Promote</Label>
                <Textarea
                  id="topServices"
                  placeholder="e.g., Teeth Whitening, Invisalign, Dental Implants, Root Canal Treatment"
                  value={formData.topServices}
                  onChange={(e) => handleInputChange("topServices", e.target.value)}
                  rows={3}
                  data-testid="input-top-services"
                />
              </div>

              {/* Preferred Clinic URL / Slug */}
              <div className="space-y-2">
                <Label htmlFor="preferredSlug">Preferred Clinic URL / Slug *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/clinic/</span>
                  <Input
                    id="preferredSlug"
                    placeholder="brightsmile"
                    value={formData.preferredSlug}
                    onChange={(e) => handleInputChange("preferredSlug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    required
                    data-testid="input-preferred-slug"
                  />
                </div>
                <p className="text-xs text-muted-foreground">This will be your public clinic page URL (e.g., /clinic/brightsmile)</p>
              </div>

              {/* Preferred Contact Channel */}
              <div className="space-y-2">
                <Label htmlFor="preferredChannel">Preferred Contact Channel</Label>
                <Select
                  value={formData.preferredChannel}
                  onValueChange={(value) => handleInputChange("preferredChannel", value)}
                >
                  <SelectTrigger data-testid="select-preferred-channel">
                    <SelectValue placeholder="How should we contact you?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="phone">Phone Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Existing Booking Link */}
              <div className="space-y-2">
                <Label htmlFor="existingBookingLink">Existing Booking Link (optional)</Label>
                <Input
                  id="existingBookingLink"
                  type="url"
                  placeholder="e.g., https://calendly.com/brightsmile"
                  value={formData.existingBookingLink}
                  onChange={(e) => handleInputChange("existingBookingLink", e.target.value)}
                  data-testid="input-existing-booking-link"
                />
              </div>

              {/* Special Notes / Custom Requests */}
              <div className="space-y-2">
                <Label htmlFor="specialNotes">Special Notes / Custom Requests (optional)</Label>
                <Textarea
                  id="specialNotes"
                  placeholder="Any special requirements or customizations you'd like for your dashboard or chatbot..."
                  value={formData.specialNotes}
                  onChange={(e) => handleInputChange("specialNotes", e.target.value)}
                  rows={4}
                  data-testid="input-special-notes"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                data-testid="button-submit-onboarding"
              >
                Complete Onboarding & Submit Details
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Questions? Contact us at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">
            {SUPPORT_EMAIL}
          </a>
        </p>
      </main>
    </div>
  );
}
