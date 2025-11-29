import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, Mail, MessageSquare, Clock, Trash2, Play, Pause, ArrowRight, Sparkles } from "lucide-react";

interface SequenceStep {
  id: string;
  sequenceId: string;
  stepOrder: number;
  channel: string;
  subject?: string;
  message: string;
  delayDays: number;
  delayHours: number;
}

interface Sequence {
  id: string;
  name: string;
  description?: string;
  status: string;
  ownerId?: string;
  createdAt: string;
  steps?: SequenceStep[];
}

export default function AdminSequences() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState<Sequence | null>(null);
  const [isAddStepOpen, setIsAddStepOpen] = useState(false);
  const [newSequence, setNewSequence] = useState({ name: "", description: "" });
  const [newStep, setNewStep] = useState({
    channel: "email",
    subject: "",
    message: "",
    delayDays: 0,
    delayHours: 0,
    stepOrder: 1,
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

  const { data: sequences = [], isLoading } = useQuery<Sequence[]>({
    queryKey: ["/api/sequences"],
    enabled: isAuthenticated,
  });

  const { data: sequenceDetail, isLoading: detailLoading } = useQuery<Sequence>({
    queryKey: ["/api/sequences", selectedSequence?.id],
    enabled: isAuthenticated && !!selectedSequence?.id,
  });

  const createSequenceMutation = useMutation({
    mutationFn: async (data: typeof newSequence) => {
      return await apiRequest("POST", "/api/sequences", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sequences"] });
      toast({
        title: "Sequence Created",
        description: "Your follow-up sequence has been created.",
      });
      setIsCreateOpen(false);
      setNewSequence({ name: "", description: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSequenceStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/sequences/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sequences"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sequences", selectedSequence?.id] });
      toast({
        title: "Status Updated",
        description: "Sequence status has been updated.",
      });
    },
  });

  const deleteSequenceMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/sequences/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sequences"] });
      setSelectedSequence(null);
      toast({
        title: "Sequence Deleted",
        description: "The sequence has been deleted.",
      });
    },
  });

  const addStepMutation = useMutation({
    mutationFn: async (data: typeof newStep) => {
      return await apiRequest("POST", `/api/sequences/${selectedSequence?.id}/steps`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sequences", selectedSequence?.id] });
      toast({
        title: "Step Added",
        description: "New step has been added to the sequence.",
      });
      setIsAddStepOpen(false);
      setNewStep({
        channel: "email",
        subject: "",
        message: "",
        delayDays: 0,
        delayHours: 0,
        stepOrder: (sequenceDetail?.steps?.length || 0) + 1,
      });
    },
  });

  const deleteStepMutation = useMutation({
    mutationFn: async (stepId: string) => {
      return await apiRequest("DELETE", `/api/sequences/${selectedSequence?.id}/steps/${stepId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sequences", selectedSequence?.id] });
      toast({
        title: "Step Deleted",
        description: "The step has been removed from the sequence.",
      });
    },
  });

  const seedDefaultSequenceMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/sequences/seed-default");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sequences"] });
      toast({
        title: "Default Sequence Created",
        description: "The 'Smart Lead Conversion Sequence' has been created with 9 pre-written steps.",
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

  const handleCreateSequence = (e: React.FormEvent) => {
    e.preventDefault();
    createSequenceMutation.mutate(newSequence);
  };

  const handleAddStep = (e: React.FormEvent) => {
    e.preventDefault();
    addStepMutation.mutate({
      ...newStep,
      stepOrder: (sequenceDetail?.steps?.length || 0) + 1,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-600 text-white" data-testid={`badge-status-${status}`}>Active</Badge>;
      case "paused":
        return <Badge variant="secondary" data-testid={`badge-status-${status}`}>Paused</Badge>;
      default:
        return <Badge variant="outline" data-testid={`badge-status-${status}`}>Draft</Badge>;
    }
  };

  const getChannelIcon = (channel: string) => {
    return channel === "email" ? <Mail className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />;
  };

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            Follow-up Sequences
          </h1>
          <p className="text-muted-foreground mt-1">
            Create automated outreach sequences for your leads
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-create-sequence">
              <Plus className="h-4 w-4" />
              Create Sequence
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Sequence</DialogTitle>
              <DialogDescription>
                Set up an automated follow-up sequence for your leads.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSequence} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Sequence Name *</Label>
                <Input
                  id="name"
                  value={newSequence.name}
                  onChange={(e) => setNewSequence((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="New Patient Welcome Series"
                  data-testid="input-sequence-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newSequence.description}
                  onChange={(e) => setNewSequence((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this sequence is for..."
                  data-testid="input-sequence-description"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createSequenceMutation.isPending}
                data-testid="button-submit-sequence"
              >
                {createSequenceMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Sequence"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sequences List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Your Sequences</h2>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sequences.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Sequences Yet</h3>
                <p className="text-muted-foreground mb-4" data-testid="text-empty-sequences">
                  Create your first automated follow-up sequence.
                </p>
                <Button
                  onClick={() => seedDefaultSequenceMutation.mutate()}
                  disabled={seedDefaultSequenceMutation.isPending}
                  className="gap-2"
                  data-testid="button-seed-default-sequence"
                >
                  {seedDefaultSequenceMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Use Smart Lead Conversion Template
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sequences.map((seq) => (
                <Card
                  key={seq.id}
                  className={`cursor-pointer hover-elevate ${selectedSequence?.id === seq.id ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSelectedSequence(seq)}
                  data-testid={`card-sequence-${seq.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold" data-testid={`text-sequence-name-${seq.id}`}>
                        {seq.name}
                      </h3>
                      {getStatusBadge(seq.status)}
                    </div>
                    {seq.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {seq.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sequence Detail / Builder */}
        <div className="lg:col-span-2">
          {selectedSequence ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle data-testid="text-selected-sequence-name">
                      {sequenceDetail?.name || selectedSequence.name}
                    </CardTitle>
                    <CardDescription>
                      {sequenceDetail?.description || selectedSequence.description || "No description"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(sequenceDetail?.status || selectedSequence.status)}
                    {(sequenceDetail?.status || selectedSequence.status) === "draft" && (
                      <Button
                        size="sm"
                        onClick={() => updateSequenceStatusMutation.mutate({ id: selectedSequence.id, status: "active" })}
                        data-testid="button-activate-sequence"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Activate
                      </Button>
                    )}
                    {(sequenceDetail?.status || selectedSequence.status) === "active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateSequenceStatusMutation.mutate({ id: selectedSequence.id, status: "paused" })}
                        data-testid="button-pause-sequence"
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                    )}
                    {(sequenceDetail?.status || selectedSequence.status) === "paused" && (
                      <Button
                        size="sm"
                        onClick={() => updateSequenceStatusMutation.mutate({ id: selectedSequence.id, status: "active" })}
                        data-testid="button-resume-sequence"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Resume
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Sequence Steps</h3>
                  <Dialog open={isAddStepOpen} onOpenChange={setIsAddStepOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-1" data-testid="button-add-step">
                        <Plus className="h-4 w-4" />
                        Add Step
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Sequence Step</DialogTitle>
                        <DialogDescription>
                          Configure what message to send and when.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddStep} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Channel</Label>
                          <Select
                            value={newStep.channel}
                            onValueChange={(value) => setNewStep((prev) => ({ ...prev, channel: value }))}
                          >
                            <SelectTrigger data-testid="select-channel">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="sms">SMS</SelectItem>
                              <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {newStep.channel === "email" && (
                          <div className="space-y-2">
                            <Label htmlFor="subject">Subject Line</Label>
                            <Input
                              id="subject"
                              value={newStep.subject}
                              onChange={(e) => setNewStep((prev) => ({ ...prev, subject: e.target.value }))}
                              placeholder="Following up on your dental care..."
                              data-testid="input-step-subject"
                            />
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="message">Message *</Label>
                          <Textarea
                            id="message"
                            value={newStep.message}
                            onChange={(e) => setNewStep((prev) => ({ ...prev, message: e.target.value }))}
                            required
                            placeholder="Hi {{name}}, I wanted to follow up..."
                            rows={4}
                            data-testid="input-step-message"
                          />
                          <p className="text-xs text-muted-foreground">
                            Use {"{{name}}"}, {"{{email}}"} for personalization
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="delayDays">Wait Days</Label>
                            <Input
                              id="delayDays"
                              type="number"
                              min={0}
                              value={newStep.delayDays}
                              onChange={(e) => setNewStep((prev) => ({ ...prev, delayDays: parseInt(e.target.value) || 0 }))}
                              data-testid="input-delay-days"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="delayHours">Wait Hours</Label>
                            <Input
                              id="delayHours"
                              type="number"
                              min={0}
                              max={23}
                              value={newStep.delayHours}
                              onChange={(e) => setNewStep((prev) => ({ ...prev, delayHours: parseInt(e.target.value) || 0 }))}
                              data-testid="input-delay-hours"
                            />
                          </div>
                        </div>
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={addStepMutation.isPending}
                          data-testid="button-submit-step"
                        >
                          {addStepMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            "Add Step"
                          )}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {detailLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !sequenceDetail?.steps?.length ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground" data-testid="text-no-steps">
                      No steps yet. Add your first step to start building the sequence.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4" data-testid="div-sequence-steps">
                    {sequenceDetail.steps.map((step, index) => (
                      <div key={step.id}>
                        {index > 0 && (
                          <div className="flex items-center justify-center py-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              Wait {step.delayDays > 0 ? `${step.delayDays} day${step.delayDays > 1 ? "s" : ""}` : ""}{" "}
                              {step.delayHours > 0 ? `${step.delayHours} hour${step.delayHours > 1 ? "s" : ""}` : ""}
                              {step.delayDays === 0 && step.delayHours === 0 && "immediately"}
                              <ArrowRight className="h-4 w-4" />
                            </div>
                          </div>
                        )}
                        <Card data-testid={`card-step-${step.id}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-muted">
                                  {getChannelIcon(step.channel)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium">Step {step.stepOrder}</span>
                                    <Badge variant="outline" className="capitalize">
                                      {step.channel}
                                    </Badge>
                                  </div>
                                  {step.subject && (
                                    <p className="text-sm font-medium">{step.subject}</p>
                                  )}
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {step.message}
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteStepMutation.mutate(step.id)}
                                data-testid={`button-delete-step-${step.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <Separator />
              <CardFooter className="pt-4 justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteSequenceMutation.mutate(selectedSequence.id)}
                  disabled={deleteSequenceMutation.isPending}
                  data-testid="button-delete-sequence"
                >
                  {deleteSequenceMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete Sequence
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Select a Sequence</h3>
                <p className="text-muted-foreground" data-testid="text-select-sequence">
                  Click on a sequence from the list to view and edit its steps.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
