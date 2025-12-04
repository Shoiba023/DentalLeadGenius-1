import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, Globe, Headphones, MapPin, CheckCircle2, ArrowLeft } from "lucide-react";
import logoFull from "@/assets/logo/logo-full.png";
import { SITE_NAME } from "@shared/config";
import { Footer } from "@/components/footer";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  clinicName: z.string().min(2, "Clinic name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function Contact() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      clinicName: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      return await apiRequest("POST", "/api/contact", data);
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Message Sent",
        description: "Thank you for contacting us. We'll get back to you within 24 hours.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormData) => {
    submitMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
            <Button variant="ghost" asChild data-testid="button-back-home">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-contact-headline">
                Contact Us
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Have questions about {SITE_NAME}? We're here to help dental clinics succeed.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              <div className="space-y-8">
                <Card data-testid="card-contact-info">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Headphones className="h-5 w-5 text-primary" />
                      Get in Touch
                    </CardTitle>
                    <CardDescription>
                      We are available to assist dental clinics across USA & Canada.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Phone</p>
                        <a 
                          href="tel:+12505742162" 
                          className="text-muted-foreground hover:text-primary transition-colors"
                          data-testid="link-phone"
                        >
                          +1 (250) 574-2162
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Email</p>
                        <a 
                          href="mailto:info@dentalleadgenius.com" 
                          className="text-muted-foreground hover:text-primary transition-colors"
                          data-testid="link-email"
                        >
                          info@dentalleadgenius.com
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Globe className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Website</p>
                        <a 
                          href="https://smartAIpartners.io" 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                          data-testid="link-website"
                        >
                          smartAIpartners.io
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Headphones className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Support Portal</p>
                        <a 
                          href="https://dentalleadgenius.com/support" 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                          data-testid="link-support"
                        >
                          dentalleadgenius.com/support
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <MapPin className="h-5 w-5 text-primary" />
                      <p className="text-sm">
                        We are available to assist dental clinics across USA & Canada.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card data-testid="card-contact-form">
                <CardHeader>
                  <CardTitle>Send Us a Message</CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you within 24 hours.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {submitted ? (
                    <div className="text-center py-8 space-y-4">
                      <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-xl font-semibold">Message Sent!</h3>
                      <p className="text-muted-foreground">
                        Thank you for reaching out. We'll get back to you within 24 hours.
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSubmitted(false);
                          form.reset();
                        }}
                        data-testid="button-send-another"
                      >
                        Send Another Message
                      </Button>
                    </div>
                  ) : (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Your Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Dr. John Smith" 
                                  {...field} 
                                  data-testid="input-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="clinicName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Clinic Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Bright Smile Dental" 
                                  {...field} 
                                  data-testid="input-clinic-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email"
                                  placeholder="doctor@clinic.com" 
                                  {...field} 
                                  data-testid="input-email"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input 
                                  type="tel"
                                  placeholder="+1 (555) 123-4567" 
                                  {...field} 
                                  data-testid="input-phone"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Message</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Tell us about your clinic and how we can help..."
                                  className="min-h-[120px] resize-none"
                                  {...field} 
                                  data-testid="input-message"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={submitMutation.isPending}
                          data-testid="button-submit-contact"
                        >
                          {submitMutation.isPending ? "Sending..." : "Send Message"}
                        </Button>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
