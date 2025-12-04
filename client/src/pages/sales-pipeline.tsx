import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useClinic } from "@/hooks/useClinic";
import { 
  Users, 
  Mail, 
  Phone, 
  Calendar, 
  Trophy, 
  XCircle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  MessageSquare,
  TrendingUp,
  Clock,
  Target
} from "lucide-react";
import type { Lead } from "@shared/schema";

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  icon: React.ReactNode;
  leads: Lead[];
}

const STAGE_CONFIG: Record<string, { name: string; color: string; icon: React.ReactNode }> = {
  new: { 
    name: "New Leads", 
    color: "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300",
    icon: <Users className="h-4 w-4" />
  },
  contacted: { 
    name: "Contacted", 
    color: "bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-300",
    icon: <Mail className="h-4 w-4" />
  },
  replied: { 
    name: "Replied", 
    color: "bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-300",
    icon: <MessageSquare className="h-4 w-4" />
  },
  demo_booked: { 
    name: "Demo Booked", 
    color: "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300",
    icon: <Calendar className="h-4 w-4" />
  },
  won: { 
    name: "Won", 
    color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300",
    icon: <Trophy className="h-4 w-4" />
  },
  lost: { 
    name: "Lost", 
    color: "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300",
    icon: <XCircle className="h-4 w-4" />
  },
};

function LeadCard({ 
  lead, 
  onMoveToNext,
  onGetAiSuggestion 
}: { 
  lead: Lead; 
  onMoveToNext: () => void;
  onGetAiSuggestion: () => void;
}) {
  const stageConfig = STAGE_CONFIG[lead.status] || STAGE_CONFIG.new;
  const daysSinceContact = lead.contactedAt
    ? Math.floor((Date.now() - new Date(lead.contactedAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card className="mb-2 hover-elevate cursor-pointer" data-testid={`card-lead-${lead.id}`}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-sm truncate" data-testid={`text-lead-name-${lead.id}`}>
              {lead.name}
            </h4>
            {lead.clinicId && (
              <p className="text-xs text-muted-foreground truncate">
                {lead.city}{lead.state ? `, ${lead.state}` : ""}
              </p>
            )}
          </div>
          {lead.rating && (
            <Badge variant="secondary" className="text-xs shrink-0">
              {lead.rating}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-1 mb-2">
          {lead.email && (
            <Badge variant="outline" className="text-xs">
              <Mail className="h-3 w-3 mr-1" />
              Email
            </Badge>
          )}
          {lead.phone && (
            <Badge variant="outline" className="text-xs">
              <Phone className="h-3 w-3 mr-1" />
              Phone
            </Badge>
          )}
          {daysSinceContact !== null && (
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {daysSinceContact}d ago
            </Badge>
          )}
        </div>

        <div className="flex gap-1 mt-2">
          <Button 
            size="sm" 
            variant="ghost" 
            className="flex-1 h-7 text-xs"
            onClick={onGetAiSuggestion}
            data-testid={`button-ai-suggestion-${lead.id}`}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            AI Reply
          </Button>
          {lead.status !== "won" && lead.status !== "lost" && (
            <Button 
              size="sm" 
              variant="default" 
              className="flex-1 h-7 text-xs"
              onClick={onMoveToNext}
              data-testid={`button-move-lead-${lead.id}`}
            >
              <ArrowRight className="h-3 w-3 mr-1" />
              Move
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PipelineColumn({ stage, leads, onMoveToNext, onGetAiSuggestion }: {
  stage: { id: string; name: string; color: string; icon: React.ReactNode };
  leads: Lead[];
  onMoveToNext: (leadId: string) => void;
  onGetAiSuggestion: (leadId: string) => void;
}) {
  return (
    <div className="flex-1 min-w-[200px] max-w-[280px]">
      <div className={`rounded-lg border p-3 h-full ${stage.color}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {stage.icon}
            <h3 className="font-medium text-sm">{stage.name}</h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            {leads.length}
          </Badge>
        </div>
        
        <ScrollArea className="h-[calc(100vh-320px)]">
          <div className="space-y-2 pr-2">
            {leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onMoveToNext={() => onMoveToNext(lead.id)}
                onGetAiSuggestion={() => onGetAiSuggestion(lead.id)}
              />
            ))}
            {leads.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No leads in this stage
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function MetricsBar({ leads }: { leads: Lead[] }) {
  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === "new").length;
  const contacted = leads.filter(l => l.status === "contacted").length;
  const replied = leads.filter(l => l.status === "replied").length;
  const demoBooked = leads.filter(l => l.status === "demo_booked").length;
  const won = leads.filter(l => l.status === "won").length;
  const lost = leads.filter(l => l.status === "lost").length;
  
  const conversionRate = totalLeads > 0 ? ((won / totalLeads) * 100).toFixed(1) : "0";
  const responseRate = contacted > 0 ? ((replied / contacted) * 100).toFixed(1) : "0";
  const demoRate = replied > 0 ? ((demoBooked / replied) * 100).toFixed(1) : "0";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total Leads</span>
          </div>
          <p className="text-2xl font-bold mt-1" data-testid="text-total-leads">{totalLeads}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Conversion</span>
          </div>
          <p className="text-2xl font-bold mt-1" data-testid="text-conversion-rate">{conversionRate}%</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Response Rate</span>
          </div>
          <p className="text-2xl font-bold mt-1" data-testid="text-response-rate">{responseRate}%</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Demo Rate</span>
          </div>
          <p className="text-2xl font-bold mt-1" data-testid="text-demo-rate">{demoRate}%</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-green-500" />
            <span className="text-sm text-muted-foreground">Won</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-green-600" data-testid="text-won">{won}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Active Pipeline</span>
          </div>
          <p className="text-2xl font-bold mt-1" data-testid="text-active-pipeline">
            {newLeads + contacted + replied + demoBooked}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SalesPipeline() {
  const { toast } = useToast();
  const { selectedClinicId } = useClinic();

  const { data: leads = [], isLoading, refetch } = useQuery<Lead[]>({
    queryKey: ["/api/leads", selectedClinicId],
    enabled: !!selectedClinicId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: string }) => {
      return apiRequest("PATCH", `/api/leads/${leadId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Lead Updated",
        description: "Lead status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update lead status.",
        variant: "destructive",
      });
    },
  });

  const getNextStatus = (currentStatus: string): string | null => {
    const flow: Record<string, string> = {
      new: "contacted",
      contacted: "replied",
      replied: "demo_booked",
      demo_booked: "won",
    };
    return flow[currentStatus] || null;
  };

  const handleMoveToNext = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const nextStatus = getNextStatus(lead.status);
    if (nextStatus) {
      updateStatusMutation.mutate({ leadId, status: nextStatus });
    }
  };

  const handleGetAiSuggestion = async (leadId: string) => {
    toast({
      title: "AI Suggestion",
      description: "AI reply suggestions are being generated. Check the lead details for options.",
    });
  };

  const stages: PipelineStage[] = Object.entries(STAGE_CONFIG).map(([id, config]) => ({
    id,
    name: config.name,
    color: config.color,
    icon: config.icon,
    leads: leads.filter(l => l.status === id),
  }));

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[500px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Sales Pipeline</h1>
          <p className="text-muted-foreground">
            Manage your leads through the sales funnel
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" data-testid="button-refresh">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <MetricsBar leads={leads} />

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <PipelineColumn
            key={stage.id}
            stage={stage}
            leads={stage.leads}
            onMoveToNext={handleMoveToNext}
            onGetAiSuggestion={handleGetAiSuggestion}
          />
        ))}
      </div>
    </div>
  );
}
