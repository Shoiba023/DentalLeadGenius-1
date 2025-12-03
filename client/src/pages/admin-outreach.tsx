import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  ExternalLink, 
  Mail, 
  MessageSquare, 
  Phone,
  Facebook,
  Instagram,
  Youtube,
  Info,
  Pencil,
  Calendar,
  Users,
  RefreshCw,
  X,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";
import { SiTiktok } from "react-icons/si";
import { format } from "date-fns";

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
  targetUrl?: string;
  mediaUrl?: string;
  hashtags?: string;
  createdAt: string;
}

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  status: string;
  source?: string;
  syncStatus?: string;
  marketingOptIn?: boolean;
}

interface CampaignLead {
  id: string;
  campaignId: string;
  leadId: string;
  status: string;
  sentAt?: string;
  errorMessage?: string;
  lead: Lead;
}

interface Clinic {
  id: string;
  name: string;
  city?: string;
  state?: string;
}

const CAMPAIGN_TYPES = [
  { value: "email", label: "Email", icon: Mail, category: "traditional" },
  { value: "sms", label: "SMS", icon: Phone, category: "traditional" },
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare, category: "traditional" },
  { value: "facebook_post", label: "Facebook Post", icon: Facebook, category: "social" },
  { value: "instagram_post", label: "Instagram Post", icon: Instagram, category: "social" },
  { value: "youtube_post", label: "YouTube Community Post", icon: Youtube, category: "social" },
  { value: "tiktok_caption", label: "TikTok Caption", icon: SiTiktok, category: "social" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
  { value: "ready", label: "Ready", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "active", label: "Active", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  { value: "paused", label: "Paused", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  { value: "completed", label: "Completed", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  { value: "archived", label: "Archived", color: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200" },
];

function isSocialType(type: string): boolean {
  return ["facebook_post", "instagram_post", "youtube_post", "tiktok_caption"].includes(type);
}

function getCampaignTypeInfo(type: string) {
  return CAMPAIGN_TYPES.find(t => t.value === type) || CAMPAIGN_TYPES[0];
}

function getStatusInfo(status: string) {
  return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
}

function formatHashtags(hashtagsString: string): string {
  return hashtagsString
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
    .join(" ");
}

function formatSocialPostText(campaign: Campaign, platform: string): string {
  let text = campaign.message;

  if (platform === "facebook" || platform === "instagram") {
    if (campaign.hashtags) {
      text += `\n\n${formatHashtags(campaign.hashtags)}`;
    }
    if (campaign.targetUrl) {
      text += platform === "instagram" 
        ? `\n\nLink in bio: ${campaign.targetUrl}`
        : `\n\n${campaign.targetUrl}`;
    }
  } else if (platform === "youtube") {
    if (campaign.targetUrl) {
      text += `\n\n${campaign.targetUrl}`;
    }
  } else if (platform === "tiktok") {
    if (campaign.hashtags) {
      text += `\n\n${formatHashtags(campaign.hashtags)}`;
    }
  }

  return text;
}

export default function AdminOutreach() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Campaign>>({});
  const [showLeadsPanel, setShowLeadsPanel] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "email",
    subject: "",
    message: "",
    dailyLimit: 50,
    status: "draft",
    targetUrl: "",
    mediaUrl: "",
    hashtags: "",
    clinicId: "",
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

  const { data: clinics = [], isLoading: isLoadingClinics } = useQuery<Clinic[]>({
    queryKey: ["/api/clinics"],
    enabled: isAuthenticated,
  });

  const { data: campaignLeads = [], isLoading: isLoadingLeads, refetch: refetchLeads } = useQuery<CampaignLead[]>({
    queryKey: ["/api/campaigns", selectedCampaign?.id, "leads"],
    enabled: !!selectedCampaign?.id && showLeadsPanel,
  });

  const autoLoadLeadsMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await apiRequest("POST", `/api/campaigns/${campaignId}/auto-load-leads`);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", selectedCampaign?.id, "leads"] });
      toast({
        title: "Leads Loaded",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Load Leads",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendToLeadsMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await apiRequest("POST", `/api/campaigns/${campaignId}/send-to-leads`);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", selectedCampaign?.id, "leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Campaign Sent",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Send Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeLeadMutation = useMutation({
    mutationFn: async ({ campaignId, leadId }: { campaignId: string; leadId: string }) => {
      return await apiRequest("DELETE", `/api/campaigns/${campaignId}/leads/${leadId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", selectedCampaign?.id, "leads"] });
      toast({
        title: "Lead Removed",
        description: "Lead has been removed from the campaign.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Remove Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/campaigns", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Campaign Created",
        description: "Your campaign has been created successfully.",
      });
      setFormData({
        name: "",
        type: "email",
        subject: "",
        message: "",
        dailyLimit: 50,
        status: "draft",
        targetUrl: "",
        mediaUrl: "",
        hashtags: "",
        clinicId: "",
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

  const updateCampaignMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Campaign> }) => {
      return await apiRequest("PUT", `/api/campaigns/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Campaign Updated",
        description: "Your campaign has been updated successfully.",
      });
      setIsEditing(false);
      setIsDetailModalOpen(false);
      setSelectedCampaign(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
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

  const handleCopyToClipboard = async (platform: string, campaign: Campaign) => {
    const text = formatSocialPostText(campaign, platform);
    await navigator.clipboard.writeText(text);
    setCopiedPlatform(platform);
    toast({
      title: "Copied!",
      description: `Content copied for ${platform}. Paste it into your ${platform} post.`,
    });
    setTimeout(() => setCopiedPlatform(null), 2000);
  };

  const handleOpenDetail = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setEditFormData({
      message: campaign.message,
      targetUrl: campaign.targetUrl || "",
      mediaUrl: campaign.mediaUrl || "",
      hashtags: campaign.hashtags || "",
      status: campaign.status,
      subject: campaign.subject || "",
    });
    setIsEditing(false);
    setShowLeadsPanel(false);
    setIsDetailModalOpen(true);
  };

  const getLeadStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "pending":
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const pendingLeadsCount = campaignLeads.filter(cl => cl.status === "pending").length;
  const sentLeadsCount = campaignLeads.filter(cl => cl.status === "sent").length;
  const failedLeadsCount = campaignLeads.filter(cl => cl.status === "failed").length;

  const handleSaveEdit = () => {
    if (selectedCampaign) {
      updateCampaignMutation.mutate({
        id: selectedCampaign.id,
        data: editFormData,
      });
    }
  };

  if (authLoading || !isAuthenticated) {
    return null;
  }

  const isSocialCampaign = isSocialType(formData.type);
  const TypeIcon = getCampaignTypeInfo(formData.type).icon;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2" data-testid="text-page-title">
          Campaign Hub
        </h1>
        <p className="text-muted-foreground">
          Create and manage multi-channel campaigns including email, SMS, WhatsApp, and social media content
        </p>
      </div>

      {/* Safety Note */}
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <strong>Social campaigns</strong> currently help you prepare and copy content. 
          Real auto-posting to Facebook, Instagram, YouTube, or TikTok will only be added later 
          via their official APIs and within their policy limits to avoid spam.
        </AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Create Campaign Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TypeIcon className="h-5 w-5" />
              Create New Campaign
            </CardTitle>
            <CardDescription>
              {isSocialCampaign 
                ? "Create social media content to copy and post manually"
                : "Create automated outreach campaigns"
              }
            </CardDescription>
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
                  placeholder="e.g., Holiday Promotion 2024"
                  required
                  data-testid="input-campaign-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinicId">Select Clinic *</Label>
                <Select
                  value={formData.clinicId}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, clinicId: val }))
                  }
                  required
                >
                  <SelectTrigger data-testid="select-clinic-id">
                    <SelectValue placeholder={isLoadingClinics ? "Loading clinics..." : "Select a clinic"} />
                  </SelectTrigger>
                  <SelectContent>
                    {clinics.map((clinic) => (
                      <SelectItem key={clinic.id} value={clinic.id}>
                        {clinic.name}{clinic.city || clinic.state ? ` (${[clinic.city, clinic.state].filter(Boolean).join(", ")})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Traditional</div>
                      {CAMPAIGN_TYPES.filter(t => t.category === "traditional").map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                      <Separator className="my-1" />
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Social Media</div>
                      {CAMPAIGN_TYPES.filter(t => t.category === "social").map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val) =>
                      setFormData((prev) => ({ ...prev, status: val }))
                    }
                  >
                    <SelectTrigger data-testid="select-campaign-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                    placeholder="Your attention-grabbing subject line"
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
                  placeholder={isSocialCampaign 
                    ? "Write your social media post content..."
                    : "Your message will include an unsubscribe footer automatically..."
                  }
                  data-testid="textarea-message"
                />
              </div>

              {/* Social Media Specific Fields */}
              {isSocialCampaign && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="targetUrl">Target URL (Landing Page)</Label>
                    <Input
                      id="targetUrl"
                      type="url"
                      value={formData.targetUrl}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, targetUrl: e.target.value }))
                      }
                      placeholder="https://your-clinic.com/special-offer"
                      data-testid="input-target-url"
                    />
                    <p className="text-xs text-muted-foreground">
                      Link to your clinic page or landing page
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mediaUrl">Media URL (Optional)</Label>
                    <Input
                      id="mediaUrl"
                      type="url"
                      value={formData.mediaUrl}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, mediaUrl: e.target.value }))
                      }
                      placeholder="https://example.com/image.jpg"
                      data-testid="input-media-url"
                    />
                    <p className="text-xs text-muted-foreground">
                      Image or video URL to use in your post
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hashtags">Hashtags (comma-separated)</Label>
                    <Input
                      id="hashtags"
                      value={formData.hashtags}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, hashtags: e.target.value }))
                      }
                      placeholder="dental, smile, health, dentist"
                      data-testid="input-hashtags"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter hashtags without #, separated by commas
                    </p>
                  </div>
                </>
              )}

              {/* Traditional Campaign Fields */}
              {!isSocialCampaign && (
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
              )}

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
            <div className="space-y-3">
              {campaigns.map((campaign) => {
                const typeInfo = getCampaignTypeInfo(campaign.type);
                const statusInfo = getStatusInfo(campaign.status);
                const TypeIconComponent = typeInfo.icon;
                const isSocial = isSocialType(campaign.type);

                return (
                  <Card 
                    key={campaign.id} 
                    className="hover-elevate cursor-pointer transition-all"
                    data-testid={`card-campaign-${campaign.id}`}
                    onClick={() => handleOpenDetail(campaign)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="p-2 rounded-md bg-muted shrink-0">
                            <TypeIconComponent className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{campaign.name}</h3>
                            <p className="text-sm text-muted-foreground">{typeInfo.label}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(campaign.createdAt), "MMM d, yyyy")}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={statusInfo.color}>
                            {statusInfo.label}
                          </Badge>
                          {!isSocial && (
                            <span className="text-xs text-muted-foreground">
                              {campaign.sentToday}/{campaign.dailyLimit} today
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Campaign Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedCampaign && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const Icon = getCampaignTypeInfo(selectedCampaign.type).icon;
                      return <Icon className="h-5 w-5" />;
                    })()}
                    <div>
                      <DialogTitle>{selectedCampaign.name}</DialogTitle>
                      <DialogDescription>
                        {getCampaignTypeInfo(selectedCampaign.type).label} - Created {format(new Date(selectedCampaign.createdAt), "MMMM d, yyyy")}
                      </DialogDescription>
                    </div>
                  </div>
                  <Badge className={getStatusInfo(selectedCampaign.status).color}>
                    {getStatusInfo(selectedCampaign.status).label}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {isEditing ? (
                  /* Edit Mode */
                  <div className="space-y-4">
                    {selectedCampaign.type === "email" && (
                      <div className="space-y-2">
                        <Label>Subject Line</Label>
                        <Input
                          value={editFormData.subject || ""}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, subject: e.target.value }))}
                          data-testid="input-edit-subject"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Message</Label>
                      <Textarea
                        value={editFormData.message || ""}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, message: e.target.value }))}
                        rows={6}
                        data-testid="textarea-edit-message"
                      />
                    </div>

                    {isSocialType(selectedCampaign.type) && (
                      <>
                        <div className="space-y-2">
                          <Label>Target URL</Label>
                          <Input
                            value={editFormData.targetUrl || ""}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, targetUrl: e.target.value }))}
                            data-testid="input-edit-target-url"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Media URL</Label>
                          <Input
                            value={editFormData.mediaUrl || ""}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, mediaUrl: e.target.value }))}
                            data-testid="input-edit-media-url"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Hashtags</Label>
                          <Input
                            value={editFormData.hashtags || ""}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, hashtags: e.target.value }))}
                            data-testid="input-edit-hashtags"
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={editFormData.status || "draft"}
                        onValueChange={(val) => setEditFormData(prev => ({ ...prev, status: val }))}
                      >
                        <SelectTrigger data-testid="select-edit-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div className="space-y-4">
                    {selectedCampaign.subject && (
                      <div>
                        <Label className="text-muted-foreground">Subject Line</Label>
                        <p className="mt-1 font-medium">{selectedCampaign.subject}</p>
                      </div>
                    )}

                    <div>
                      <Label className="text-muted-foreground">Message</Label>
                      <p className="mt-1 whitespace-pre-wrap bg-muted p-3 rounded-md text-sm">
                        {selectedCampaign.message}
                      </p>
                    </div>

                    {isSocialType(selectedCampaign.type) && (
                      <>
                        {selectedCampaign.targetUrl && (
                          <div>
                            <Label className="text-muted-foreground">Target URL</Label>
                            <a 
                              href={selectedCampaign.targetUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="mt-1 flex items-center gap-1 text-primary hover:underline"
                            >
                              {selectedCampaign.targetUrl}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}

                        {selectedCampaign.mediaUrl && (
                          <div>
                            <Label className="text-muted-foreground">Media URL</Label>
                            <a 
                              href={selectedCampaign.mediaUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="mt-1 flex items-center gap-1 text-primary hover:underline"
                            >
                              {selectedCampaign.mediaUrl}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}

                        {selectedCampaign.hashtags && (
                          <div>
                            <Label className="text-muted-foreground">Hashtags</Label>
                            <p className="mt-1 text-primary">
                              {formatHashtags(selectedCampaign.hashtags)}
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {!isSocialType(selectedCampaign.type) && (
                      <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                        <div>
                          <Label className="text-muted-foreground">Sent Today</Label>
                          <p className="text-lg font-semibold">
                            {selectedCampaign.sentToday} / {selectedCampaign.dailyLimit}
                          </p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Total Sent</Label>
                          <p className="text-lg font-semibold">{selectedCampaign.totalSent}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Daily Limit</Label>
                          <p className="text-lg font-semibold">{selectedCampaign.dailyLimit}</p>
                        </div>
                      </div>
                    )}

                    {/* Campaign Leads Section - Only for email campaigns */}
                    {selectedCampaign.type === "email" && (
                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-muted-foreground flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Campaign Leads
                          </Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowLeadsPanel(!showLeadsPanel)}
                            data-testid="button-toggle-leads"
                          >
                            {showLeadsPanel ? "Hide" : "Show"} Leads
                          </Button>
                        </div>

                        {showLeadsPanel && (
                          <div className="space-y-3">
                            {/* Lead Stats */}
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-yellow-500" />
                                {pendingLeadsCount} pending
                              </span>
                              <span className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                {sentLeadsCount} sent
                              </span>
                              {failedLeadsCount > 0 && (
                                <span className="flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3 text-red-500" />
                                  {failedLeadsCount} failed
                                </span>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => autoLoadLeadsMutation.mutate(selectedCampaign.id)}
                                disabled={autoLoadLeadsMutation.isPending}
                                data-testid="button-auto-load-leads"
                              >
                                {autoLoadLeadsMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                )}
                                Auto-Load Synced Leads
                              </Button>
                              
                              <Button
                                size="sm"
                                onClick={() => sendToLeadsMutation.mutate(selectedCampaign.id)}
                                disabled={sendToLeadsMutation.isPending || pendingLeadsCount === 0}
                                data-testid="button-send-to-leads"
                              >
                                {sendToLeadsMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <Send className="h-4 w-4 mr-2" />
                                )}
                                Send to {pendingLeadsCount} Leads
                              </Button>
                            </div>

                            {/* Leads List */}
                            {isLoadingLeads ? (
                              <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                              </div>
                            ) : campaignLeads.length === 0 ? (
                              <div className="text-center py-4 text-muted-foreground text-sm">
                                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>No leads linked to this campaign yet.</p>
                                <p className="text-xs mt-1">Click "Auto-Load Synced Leads" to add leads from your Lead Library.</p>
                              </div>
                            ) : (
                              <ScrollArea className="h-48 rounded-md border">
                                <div className="p-2 space-y-1">
                                  {campaignLeads.map((cl) => (
                                    <div
                                      key={cl.id}
                                      className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted"
                                      data-testid={`campaign-lead-${cl.id}`}
                                    >
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        {getLeadStatusIcon(cl.status)}
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-sm truncate">{cl.lead.name}</p>
                                          <p className="text-xs text-muted-foreground truncate">
                                            {cl.lead.email || "No email"} 
                                            {cl.lead.city && ` • ${cl.lead.city}`}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {cl.status === "sent" && cl.sentAt && (
                                          <span className="text-xs text-muted-foreground">
                                            {format(new Date(cl.sentAt), "MMM d")}
                                          </span>
                                        )}
                                        {cl.status === "pending" && (
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-6 w-6"
                                            onClick={() => removeLeadMutation.mutate({
                                              campaignId: selectedCampaign.id,
                                              leadId: cl.leadId
                                            })}
                                            data-testid={`button-remove-lead-${cl.id}`}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Copy Buttons for Social Campaigns */}
                {isSocialType(selectedCampaign.type) && !isEditing && (
                  <div className="pt-4 border-t">
                    <Label className="text-muted-foreground mb-3 block">Copy for Platform</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedCampaign.type === "facebook_post" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleCopyToClipboard("facebook", selectedCampaign)}
                          data-testid="button-copy-facebook"
                        >
                          {copiedPlatform === "facebook" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          <Facebook className="h-4 w-4" />
                          Copy for Facebook
                        </Button>
                      )}
                      {selectedCampaign.type === "instagram_post" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleCopyToClipboard("instagram", selectedCampaign)}
                          data-testid="button-copy-instagram"
                        >
                          {copiedPlatform === "instagram" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          <Instagram className="h-4 w-4" />
                          Copy for Instagram
                        </Button>
                      )}
                      {selectedCampaign.type === "youtube_post" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleCopyToClipboard("youtube", selectedCampaign)}
                          data-testid="button-copy-youtube"
                        >
                          {copiedPlatform === "youtube" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          <Youtube className="h-4 w-4" />
                          Copy for YouTube
                        </Button>
                      )}
                      {selectedCampaign.type === "tiktok_caption" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleCopyToClipboard("tiktok", selectedCampaign)}
                          data-testid="button-copy-tiktok"
                        >
                          {copiedPlatform === "tiktok" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          <SiTiktok className="h-4 w-4" />
                          Copy for TikTok
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      data-testid="button-cancel-edit"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveEdit}
                      disabled={updateCampaignMutation.isPending}
                      data-testid="button-save-edit"
                    >
                      {updateCampaignMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setIsDetailModalOpen(false)}
                      data-testid="button-close-detail"
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="gap-2"
                      data-testid="button-edit-campaign"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
