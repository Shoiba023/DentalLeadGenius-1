import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import logoFull from "@/assets/logo/logo-full.png";
import { FormError, FormAlert, PasswordStrength } from "@/components/ui/form-error";
import { signupFormSchema, validateForm } from "@/lib/formValidation";

export default function Signup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    clinicName: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const signupMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/auth/signup", {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        clinicName: data.clinicName,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Account created!",
        description: "Welcome to DentalLeadGenius. Redirecting to pricing...",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      
      if (data.redirectTo) {
        window.location.href = data.redirectTo;
      } else {
        setLocation("/pricing");
      }
    },
    onError: (error: Error) => {
      setError(error.message || "Failed to create account");
      toast({
        title: "Signup failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const validation = validateForm(signupFormSchema, formData);
    if (!validation.success) {
      const newFieldErrors: Record<string, string> = {};
      for (const [field, messages] of Object.entries(validation.errors)) {
        newFieldErrors[field] = messages[0];
      }
      setFieldErrors(newFieldErrors);
      setError("Please fix the errors below");
      return;
    }

    signupMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <img src={logoFull} alt="DentalLeadGenius" className="h-10 w-auto object-contain" />
          </div>
          <CardTitle data-testid="text-signup-title">Create Your Account</CardTitle>
          <CardDescription>
            Start generating more dental leads with AI-powered automation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <FormAlert type="error" message={error} data-testid="text-signup-error" />
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={fieldErrors.firstName ? "border-destructive" : ""}
                  data-testid="input-signup-firstname"
                />
                <FormError message={fieldErrors.firstName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Smith"
                  value={formData.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={fieldErrors.lastName ? "border-destructive" : ""}
                  data-testid="input-signup-lastname"
                />
                <FormError message={fieldErrors.lastName} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinicName">Clinic Name</Label>
              <Input
                id="clinicName"
                name="clinicName"
                placeholder="Bright Smile Dental"
                value={formData.clinicName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={fieldErrors.clinicName ? "border-destructive" : ""}
                data-testid="input-signup-clinic"
              />
              <FormError message={fieldErrors.clinicName} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={fieldErrors.email ? "border-destructive" : ""}
                data-testid="input-signup-email"
              />
              <FormError message={fieldErrors.email} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={fieldErrors.password ? "border-destructive" : ""}
                data-testid="input-signup-password"
              />
              <FormError message={fieldErrors.password} />
              <PasswordStrength password={formData.password} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                className={fieldErrors.confirmPassword ? "border-destructive" : ""}
                data-testid="input-signup-confirm-password"
              />
              <FormError message={fieldErrors.confirmPassword} />
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={signupMutation.isPending}
              data-testid="button-signup-submit"
            >
              {signupMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline" data-testid="link-login">
              Log in
            </Link>
          </div>
          <div className="text-center text-xs text-muted-foreground">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
