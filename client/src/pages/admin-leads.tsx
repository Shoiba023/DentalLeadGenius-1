import { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Upload, Search, Loader2, User, Mail, Phone, Star, Check, Users, TrendingUp, Calendar, Sparkles, MapPin, Save, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard, StatsGrid } from "@/components/ui/premium-stats";
import { PageLoading, SkeletonTable } from "@/components/ui/premium-loading";
import Papa from "papaparse";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  status: string;
  notes?: string;
  websiteUrl?: string;
  rating?: string;
  reviewCount?: number;
  source?: string;
  syncStatus?: string;
  marketingOptIn?: boolean;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  replied: "bg-purple-100 text-purple-800",
  demo_booked: "bg-green-100 text-green-800",
  won: "bg-green-600 text-white",
  lost: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  replied: "Replied",
  demo_booked: "Demo Booked",
  won: "Won",
  lost: "Lost",
};

export default function AdminLeads() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});

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

  const leadsQueryKey = ["/api/leads"];
  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: leadsQueryKey,
    enabled: isAuthenticated,
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: any[]) => {
      return await apiRequest("POST", "/api/leads/import", { leads: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Leads Imported",
        description: "CSV file has been successfully imported.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/leads/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Status Updated",
        description: "Lead status has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Lead> }) => {
      return await apiRequest("PATCH", `/api/leads/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Lead Updated",
        description: "Lead details have been saved.",
      });
      setSelectedLead(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setEditForm({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      city: lead.city,
      state: lead.state,
      country: lead.country,
      notes: lead.notes || "",
    });
  };

  const handleSaveLead = () => {
    if (!selectedLead) return;
    updateLeadMutation.mutate({ id: selectedLead.id, updates: editForm });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        uploadMutation.mutate(results.data);
      },
      error: (error) => {
        toast({
          title: "Parse Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      searchQuery === "" ||
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.includes(searchQuery);

    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesState = stateFilter === "all" || lead.state === stateFilter;

    return matchesSearch && matchesStatus && matchesState;
  });

  const uniqueStates = Array.from(new Set(leads.map((l) => l.state).filter(Boolean)));

  const stats = useMemo(() => {
    const total = leads.length;
    const newLeads = leads.filter(l => l.status === "new").length;
    const contacted = leads.filter(l => l.status === "contacted").length;
    const demoBooked = leads.filter(l => l.status === "demo_booked").length;
    const won = leads.filter(l => l.status === "won").length;
    const conversionRate = total > 0 ? ((won / total) * 100).toFixed(1) : "0";
    return { total, newLeads, contacted, demoBooked, won, conversionRate };
  }, [leads]);

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shadow-premium">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-page-title">
              Lead Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Import, track, and manage your dental clinic leads
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            data-testid="input-csv-upload"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="gap-2"
            data-testid="button-upload-csv"
          >
            {uploadMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Import CSV
          </Button>
        </div>
      </div>

      <StatsGrid columns={4}>
        <StatCard
          title="Total Leads"
          value={stats.total.toLocaleString()}
          icon={Users}
          variant="gradient"
        />
        <StatCard
          title="New Leads"
          value={stats.newLeads.toLocaleString()}
          description="Awaiting contact"
          icon={Sparkles}
        />
        <StatCard
          title="Demo Booked"
          value={stats.demoBooked.toLocaleString()}
          description="Ready for demo"
          icon={Calendar}
        />
        <StatCard
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          description={`${stats.won} won deals`}
          icon={TrendingUp}
          variant="glass"
        />
      </StatsGrid>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-leads"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
                <SelectItem value="demo_booked">Demo Booked</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>

            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger data-testid="select-state-filter">
                <SelectValue placeholder="Filter by state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {uniqueStates.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card className="shadow-premium">
        <CardContent className="p-0">
          {isLoading ? (
            <SkeletonTable rows={8} />
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground" data-testid="text-empty-state">
                No leads found. Import a CSV file to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow 
                      key={lead.id} 
                      data-testid={`row-lead-${lead.id}`}
                      className="cursor-pointer hover-elevate"
                      onClick={() => handleLeadClick(lead)}
                    >
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>{lead.email || "—"}</TableCell>
                      <TableCell>{lead.phone || "—"}</TableCell>
                      <TableCell>
                        {lead.city && lead.state
                          ? `${lead.city}, ${lead.state}`
                          : lead.state || lead.city || "—"}
                      </TableCell>
                      <TableCell>
                        {lead.rating ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span>{lead.rating}</span>
                            {lead.reviewCount && (
                              <span className="text-muted-foreground text-xs">
                                ({lead.reviewCount})
                              </span>
                            )}
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {lead.source === "maps-helper" ? (
                            <Badge variant="outline" className="text-xs">
                              Maps Helper
                            </Badge>
                          ) : lead.source === "manual" ? (
                            <Badge variant="secondary" className="text-xs">
                              Manual
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              {lead.source || "—"}
                            </Badge>
                          )}
                          {lead.syncStatus === "synced" && (
                            <Check className="h-3 w-3 text-green-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={lead.status}
                          onValueChange={(value) => 
                            updateStatusMutation.mutate({ id: lead.id, status: value })
                          }
                          disabled={updateStatusMutation.isPending}
                        >
                          <SelectTrigger 
                            className="w-[140px]" 
                            data-testid={`select-status-${lead.id}`}
                          >
                            <Badge
                              className={statusColors[lead.status] || ""}
                              data-testid={`badge-status-${lead.status}`}
                            >
                              {statusLabels[lead.status] || lead.status}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="replied">Replied</SelectItem>
                            <SelectItem value="demo_booked">Demo Booked</SelectItem>
                            <SelectItem value="won">Won</SelectItem>
                            <SelectItem value="lost">Lost</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        Showing {filteredLeads.length} of {leads.length} leads
      </div>

      <Sheet open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <SheetContent className="sm:max-w-[500px]" data-testid="sheet-lead-detail">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Lead Details
            </SheetTitle>
            <SheetDescription>
              View and edit lead information
            </SheetDescription>
          </SheetHeader>
          
          {selectedLead && (
            <div className="space-y-6 mt-6">
              <div className="flex items-center gap-2 mb-4">
                <Badge 
                  className={statusColors[selectedLead.status] || ""} 
                  data-testid="badge-lead-status"
                >
                  {statusLabels[selectedLead.status] || selectedLead.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Added {new Date(selectedLead.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name || ""}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                    data-testid="input-edit-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Email
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editForm.email || ""}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                    data-testid="input-edit-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Phone
                  </Label>
                  <Input
                    id="edit-phone"
                    value={editForm.phone || ""}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                    data-testid="input-edit-phone"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-city" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> City
                    </Label>
                    <Input
                      id="edit-city"
                      value={editForm.city || ""}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, city: e.target.value }))}
                      data-testid="input-edit-city"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-state">State</Label>
                    <Input
                      id="edit-state"
                      value={editForm.state || ""}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, state: e.target.value }))}
                      data-testid="input-edit-state"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-country">Country</Label>
                  <Input
                    id="edit-country"
                    value={editForm.country || ""}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, country: e.target.value }))}
                    data-testid="input-edit-country"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={editForm.notes || ""}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                    rows={4}
                    placeholder="Add notes about this lead..."
                    data-testid="input-edit-notes"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSaveLead}
                  className="flex-1 gap-2"
                  disabled={updateLeadMutation.isPending}
                  data-testid="button-save-lead"
                >
                  {updateLeadMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedLead(null)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
