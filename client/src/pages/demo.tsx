import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MessageSquare, 
  Send, 
  Bot,
  User,
  Loader2,
  Sparkles,
  Phone,
  Calendar,
  Megaphone,
  HeartPulse,
  ArrowRight,
  CheckCircle2,
  Zap
} from "lucide-react";
import logoFull from "@/assets/logo/logo-full.png";
import { SITE_NAME } from "@shared/config";

type DemoMode = "receptionist" | "treatment" | "recall" | "marketing";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface DemoModeApiData {
  id: string;
  name: string;
  description: string;
}

interface DemoMetadata {
  title: string;
  modes: DemoModeApiData[];
  initialMessage: string;
}

const MODE_ICONS: Record<DemoMode, typeof Phone> = {
  receptionist: Phone,
  treatment: HeartPulse,
  recall: Calendar,
  marketing: Megaphone,
};

const MODE_COLORS: Record<DemoMode, string> = {
  receptionist: "bg-blue-500",
  treatment: "bg-green-500",
  recall: "bg-amber-500",
  marketing: "bg-purple-500",
};

type PaymentType = "monthly" | "setup";

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  setup: string;
  features: string[];
  monthlyLink: string;
  onetimeLink: string;
  highlight: boolean;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: "essential",
    name: "Essential",
    price: "$497",
    setup: "$1,997",
    features: [
      "AI Sales Chatbot",
      "Lead Management Dashboard",
      "Email Outreach",
      "Up to 500 leads/month",
    ],
    monthlyLink: "https://buy.stripe.com/dRm8wQ2zr9m0fdh3WU0ZW02",
    onetimeLink: "https://buy.stripe.com/dRmeVea1T41GfdheBy0ZW01",
    highlight: false,
  },
  {
    id: "growth",
    name: "Growth",
    price: "$997",
    setup: "$2,997",
    features: [
      "Everything in Essential",
      "Multi-Channel (Email, SMS, WhatsApp)",
      "Automated Follow-ups",
      "Up to 2,000 leads/month",
    ],
    monthlyLink: "https://buy.stripe.com/5kQ8wQ2zr2XC3uzeBy0ZW04",
    onetimeLink: "https://buy.stripe.com/eVq9AUa1T7dS7KP8da0ZW03",
    highlight: true,
  },
  {
    id: "elite",
    name: "Elite",
    price: "$1,497",
    setup: "$4,997",
    features: [
      "Everything in Growth",
      "Multi-Clinic Support",
      "Patient AI Chatbots",
      "Unlimited leads",
    ],
    monthlyLink: "https://buy.stripe.com/eVq9AU1vn1Tye9d9he0ZW05",
    onetimeLink: "https://buy.stripe.com/4gMfZi6PHaq49SXctq0ZW06",
    highlight: false,
  },
];

interface PaymentToggleProps {
  planId: string;
  selected: PaymentType;
  onChange: (type: PaymentType) => void;
}

function PaymentToggle({ planId, selected, onChange }: PaymentToggleProps) {
  return (
    <div className="w-full mb-4">
      <div className="relative flex items-center bg-muted rounded-full p-1 h-11">
        <div
          className={`absolute h-9 rounded-full bg-primary shadow-md transition-all duration-300 ease-out ${
            selected === "monthly" ? "left-1 w-[calc(50%-4px)]" : "left-[calc(50%+2px)] w-[calc(50%-4px)]"
          }`}
        />
        
        <button
          type="button"
          onClick={() => onChange("monthly")}
          className={`relative z-10 flex-1 h-9 text-sm font-medium rounded-full transition-colors duration-200 ${
            selected === "monthly"
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          data-testid={`toggle-monthly-${planId}`}
        >
          Monthly Subscription
        </button>
        
        <button
          type="button"
          onClick={() => onChange("setup")}
          className={`relative z-10 flex-1 h-9 text-sm font-medium rounded-full transition-colors duration-200 ${
            selected === "setup"
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          data-testid={`toggle-setup-${planId}`}
        >
          One-Time Setup Fee
        </button>
      </div>
    </div>
  );
}

export default function Demo() {
  const [mode, setMode] = useState<DemoMode>("receptionist");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [selectedPaymentTypes, setSelectedPaymentTypes] = useState<Record<string, PaymentType>>({
    essential: "monthly",
    growth: "monthly",
    elite: "monthly",
  });

  const handlePaymentTypeChange = (planId: string, type: PaymentType) => {
    setSelectedPaymentTypes(prev => ({
      ...prev,
      [planId]: type,
    }));
  };

  const handleCheckout = (plan: PricingPlan) => {
    const paymentType = selectedPaymentTypes[plan.id] || "monthly";
    window.location.href = paymentType === "monthly" ? plan.monthlyLink : plan.onetimeLink;
  };

  const getButtonText = (planId: string, planName: string) => {
    const paymentType = selectedPaymentTypes[planId] || "monthly";
    return paymentType === "monthly" 
      ? `Start ${planName} — Monthly` 
      : `Pay ${planName} Setup Fee`;
  };

  const { data: demoMetadata, isLoading: isLoadingDemo } = useQuery<DemoMetadata>({
    queryKey: ["/api/demo"],
  });

  useEffect(() => {
    if (demoMetadata && messages.length === 0) {
      setMessages([{
        id: "initial",
        role: "assistant",
        content: demoMetadata.initialMessage,
      }]);
    }
  }, [demoMetadata, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/ai", {
        message,
        mode,
        sessionId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply,
        },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "The demo AI is momentarily unavailable. Please try again in a few seconds.",
        },
      ]);
    },
  });

  const handleSend = () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || sendMessageMutation.isPending) return;

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmedInput,
      },
    ]);
    setInputValue("");
    sendMessageMutation.mutate(trimmedInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleModeChange = (newMode: DemoMode) => {
    setMode(newMode);
    setSessionId(null);
    setMessages([
      {
        id: "mode-change",
        role: "assistant",
        content: getModeWelcomeMessage(newMode),
      },
    ]);
  };

  const getModeWelcomeMessage = (selectedMode: DemoMode): string => {
    switch (selectedMode) {
      case "receptionist":
        return "Hello! I'm your AI Receptionist. I can help schedule appointments, answer patient questions, verify insurance, and handle emergencies. How can I assist you today?";
      case "treatment":
        return "Hi there! I'm your AI Treatment Planner. I can explain dental procedures like cleanings, fillings, root canals, implants, and more in simple terms. What would you like to know about?";
      case "recall":
        return "Hello! I'm your AI Recall System. I specialize in bringing back patients who haven't visited in a while. Let me show you how I'd reach out to inactive patients with gentle, motivating messages.";
      case "marketing":
        return "Hi! I'm your AI Marketing Agent. I can help create promotional campaigns, special offers, and marketing messages to attract new patients. What kind of campaign would you like to explore?";
      default:
        return "Hello! How can I help you today?";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <img 
              src={logoFull} 
              alt={SITE_NAME} 
              className="h-8 w-auto cursor-pointer" 
              data-testid="link-home-logo"
            />
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-1 hidden sm:flex">
              <Sparkles className="h-3 w-3" />
              Live Demo
            </Badge>
            <Button variant="outline" size="sm" asChild>
              <Link href="/pricing" data-testid="link-pricing-header">View Pricing</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/login" data-testid="link-login-header">Login</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl">
        {/* Title Section */}
        <div className="text-center mb-8">
          <Badge className="mb-4" variant="outline">
            <Bot className="h-3 w-3 mr-1" />
            Interactive AI Demo
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" data-testid="text-demo-title">
            {isLoadingDemo ? (
              <Skeleton className="h-10 w-80 mx-auto" />
            ) : (
              demoMetadata?.title || "AI Dental Receptionist — Live Demo"
            )}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
            This is a simulation of what {SITE_NAME} can do for your dental practice.
            Try different AI modes and see how our technology can transform your clinic.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {isLoadingDemo ? (
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-9 w-24" />
              ))}
            </div>
          ) : (
            demoMetadata?.modes.map((modeData) => {
              const modeKey = modeData.id as DemoMode;
              const Icon = MODE_ICONS[modeKey];
              const isActive = mode === modeKey;
              return (
                <Button
                  key={modeKey}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleModeChange(modeKey)}
                  className={`gap-2 ${isActive ? "" : "hover:bg-muted"}`}
                  data-testid={`button-mode-${modeKey}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{modeData.name}</span>
                  <span className="sm:hidden">{modeData.name.split(" ")[0]}</span>
                </Button>
              );
            })
          )}
        </div>

        {/* Chat Interface */}
        <Card className="mb-12 shadow-lg border-2">
          <CardHeader className="border-b bg-muted/30 py-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full ${MODE_COLORS[mode]} flex items-center justify-center`}>
                {(() => {
                  const Icon = MODE_ICONS[mode];
                  return <Icon className="h-5 w-5 text-white" />;
                })()}
              </div>
              <div>
                <CardTitle className="text-lg">
                  {demoMetadata?.modes.find(m => m.id === mode)?.name || "AI Assistant"}
                </CardTitle>
                <CardDescription>
                  {demoMetadata?.modes.find(m => m.id === mode)?.description || "Ready to help"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          {/* Messages Area */}
          <CardContent className="p-0">
            <div className="h-[400px] overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <div className={`h-8 w-8 rounded-full ${MODE_COLORS[mode]} flex items-center justify-center flex-shrink-0`}>
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                    data-testid={`message-${message.role}-${message.id}`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === "user" && (
                    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              {sendMessageMutation.isPending && (
                <div className="flex gap-3 justify-start">
                  <div className={`h-8 w-8 rounded-full ${MODE_COLORS[mode]} flex items-center justify-center flex-shrink-0`}>
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-muted rounded-2xl px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>

          {/* Input Area */}
          <CardFooter className="border-t p-4">
            <div className="flex gap-3 w-full">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Press Enter to send)"
                className="min-h-[44px] max-h-[120px] resize-none flex-1"
                disabled={sendMessageMutation.isPending}
                data-testid="input-chat-message"
              />
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || sendMessageMutation.isPending}
                size="icon"
                className="h-11 w-11"
                data-testid="button-send-message"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Pricing CTA Section */}
        <section className="py-12 border-t">
          <div className="text-center mb-10">
            <Badge className="mb-4" variant="outline">
              <Zap className="h-3 w-3 mr-1" />
              Get Started Today
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3" data-testid="text-pricing-heading">
              Ready to plug this AI into your clinic?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Choose a plan and get started with {SITE_NAME}. Transform your practice with AI-powered automation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PRICING_PLANS.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative flex flex-col ${plan.highlight ? "border-primary border-2 shadow-lg" : ""}`}
                data-testid={`card-plan-${plan.id}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl" data-testid={`text-plan-name-${plan.id}`}>
                    {plan.name}
                  </CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">
                      {selectedPaymentTypes[plan.id] === "monthly" ? plan.price : plan.setup}
                    </span>
                    <span className="text-muted-foreground">
                      {selectedPaymentTypes[plan.id] === "monthly" ? "/month" : " one-time"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedPaymentTypes[plan.id] === "monthly" 
                      ? `+ ${plan.setup} one-time setup`
                      : `Then ${plan.price}/month subscription`
                    }
                  </p>
                </CardHeader>
                <CardContent className="pb-4 flex-1">
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 pt-4 border-t">
                  <PaymentToggle
                    planId={plan.id}
                    selected={selectedPaymentTypes[plan.id] || "monthly"}
                    onChange={(type) => handlePaymentTypeChange(plan.id, type)}
                  />
                  <Button 
                    className="w-full gap-2" 
                    variant="default"
                    size="lg"
                    onClick={() => handleCheckout(plan)}
                    data-testid={`button-checkout-${plan.id}`}
                  >
                    {getButtonText(plan.id, plan.name)}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground mb-4">
              Not sure which plan is right for you?
            </p>
            <Button variant="outline" asChild>
              <Link href="/pricing" data-testid="link-compare-plans">
                Compare All Plans
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-8">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-muted-foreground">
            {SITE_NAME} — AI-Powered Lead Generation for Dental Clinics
          </p>
        </div>
      </footer>
    </div>
  );
}
