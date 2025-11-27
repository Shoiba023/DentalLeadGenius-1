import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Send } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  type: string;
  subject?: string;
  message: string;
  status: string;
  dailyLimit: number;
  sentToday: number;
  totalSent: number;
  createdAt: string;
}

export default function AdminOutreach() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    type: "email",
    subject: "",
    message: "",
    dailyLimit: 50,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
    enabled: isAuthenticated,
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/campaigns", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Campaign Created",
        description: "Your outreach campaign has been created successfully.",
      });
      setFormData({
        name: "",
        type: "email",
        subject: "",
        message: "",
        dailyLimit: 50,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateDraftMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/campaigns/generate-draft", {
        type: formData.type,
      });
      return await response.json();
    },
    onSuccess: (data: { subject?: string; message: string }) => {
      setFormData((prev) => ({
        ...prev,
        subject: data.subject || prev.subject,
        message: data.message,
      }));
      toast({
        title: "Draft Generated",
        description: "AI has generated a personalized draft for you.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCampaignMutation.mutate(formData);
  };

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2" data-testid="text-page-title">
          Outreach Manager
        </h1>
        <p className="text-muted-foreground">
          Create and manage email, SMS, and WhatsApp campaigns with AI-generated drafts
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Create Campaign Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  data-testid="input-campaign-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, type: val }))
                  }
                >
                  <SelectTrigger data-testid="select-campaign-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.type === "email" && (
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, subject: e.target.value }))
                    }
                    data-testid="input-subject"
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="message">Message *</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => generateDraftMutation.mutate()}
                    disabled={generateDraftMutation.isPending}
                    data-testid="button-generate-draft"
                  >
                    {generateDraftMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    AI Generate
                  </Button>
                </div>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, message: e.target.value }))
                  }
                  rows={6}
                  required
                  placeholder="Your message will include an unsubscribe footer automatically..."
                  data-testid="textarea-message"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dailyLimit">Daily Send Limit</Label>
                <Input
                  id="dailyLimit"
                  type="number"
                  min="1"
                  max="500"
                  value={formData.dailyLimit}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      dailyLimit: parseInt(e.target.value),
                    }))
                  }
                  data-testid="input-daily-limit"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum messages to send per day (recommended: 50)
                </p>
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={createCampaignMutation.isPending}
                data-testid="button-create-campaign"
              >
                {createCampaignMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Create Campaign
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Campaigns List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Active Campaigns</h2>

          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ) : campaigns.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground" data-testid="text-empty-campaigns">
                  No campaigns yet. Create your first campaign to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            campaigns.map((campaign) => (
              <Card key={campaign.id} data-testid={`card-campaign-${campaign.id}`}>
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-lg">{campaign.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {campaign.type === "email" ? "Email Campaign" : campaign.type === "sms" ? "SMS Campaign" : "WhatsApp Campaign"}
                      </p>
                    </div>
                    <Badge
                      className={
                        campaign.status === "active"
                          ? "bg-green-100 text-green-800"
                          : ""
                      }
                    >
                      {campaign.status}
                    </Badge>
                  </div>

                  {campaign.subject && (
                    <p className="text-sm">
                      <span className="font-medium">Subject:</span> {campaign.subject}
                    </p>
                  )}

                  <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Sent Today</p>
                      <p className="text-lg font-semibold">
                        {campaign.sentToday} / {campaign.dailyLimit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Sent</p>
                      <p className="text-lg font-semibold">{campaign.totalSent}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Limit</p>
                      <p className="text-lg font-semibold">{campaign.dailyLimit}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
