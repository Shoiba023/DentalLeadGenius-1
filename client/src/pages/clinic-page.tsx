import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChatbotWidget } from "@/components/chatbot-widget";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Phone, Mail, MapPin, Clock } from "lucide-react";

interface Clinic {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  brandColor: string;
}

export default function ClinicPage() {
  const [, params] = useRoute("/clinic/:slug");
  const slug = params?.slug;

  const { data: clinic, isLoading } = useQuery<Clinic>({
    queryKey: ["/api/clinics/slug", slug],
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Clinic Not Found</h1>
          <p className="text-muted-foreground">
            The clinic you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header
        className="py-4 px-6 border-b"
        style={{ backgroundColor: `${clinic.brandColor}10` }}
      >
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: clinic.brandColor }}
            >
              {clinic.name[0]}
            </div>
            <h1 className="text-2xl font-bold" data-testid="text-clinic-name">
              {clinic.name}
            </h1>
          </div>
          <Button
            style={{ backgroundColor: clinic.brandColor }}
            className="text-white"
            data-testid="button-book-appointment"
          >
            Book Appointment
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className="py-20 px-6"
        style={{ backgroundColor: `${clinic.brandColor}05` }}
      >
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-5xl font-bold mb-6">
            Welcome to {clinic.name}
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Providing exceptional dental care with a focus on patient comfort and
            cutting-edge treatments. Your smile is our priority.
          </p>
          <Button
            size="lg"
            style={{ backgroundColor: clinic.brandColor }}
            className="text-white"
          >
            Schedule Your Visit
          </Button>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Our Services</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover-elevate">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-3">General Dentistry</h3>
                <p className="text-muted-foreground">
                  Routine checkups, cleanings, fillings, and preventive care to keep
                  your smile healthy.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-3">Cosmetic Dentistry</h3>
                <p className="text-muted-foreground">
                  Teeth whitening, veneers, and smile makeovers for a confident,
                  beautiful smile.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-3">Dental Implants</h3>
                <p className="text-muted-foreground">
                  Permanent tooth replacement solutions that look and feel natural.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl font-bold text-center mb-12">Visit Us</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-semibold mb-1">Address</p>
                    <p className="text-muted-foreground">
                      123 Main Street
                      <br />
                      Suite 100
                      <br />
                      San Francisco, CA 94102
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-semibold mb-1">Phone</p>
                    <p className="text-muted-foreground">(555) 123-4567</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-semibold mb-1">Email</p>
                    <p className="text-muted-foreground">
                      info@{clinic.slug}.com
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-semibold mb-3">Office Hours</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Monday - Friday:</span>
                        <span className="font-medium">8:00 AM - 6:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Saturday:</span>
                        <span className="font-medium">9:00 AM - 2:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sunday:</span>
                        <span className="font-medium">Closed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Patient Chatbot Widget */}
      <ChatbotWidget
        type="patient"
        clinicId={clinic.id}
        clinicName={clinic.name}
        brandColor={clinic.brandColor}
        autoOpen={false}
      />
    </div>
  );
}
