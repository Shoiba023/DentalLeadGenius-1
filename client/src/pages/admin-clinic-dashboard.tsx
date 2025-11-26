import { useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Calendar,
  MessageSquare,
  Users,
  Bot,
  Clock,
  Mail,
  Phone,
  ExternalLink,
} from "lucide-react";

interface Clinic {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  brandColor: string;
  ownerId: string;
}

interface PatientBooking {
  id: string;
  clinicId: string;
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  preferredDate?: string;
  notes?: string;
  status: string;
  createdAt: string;
}

interface ChatThread {
  id: string;
  type: string;
  clinicId?: string;
  createdAt: string;
  messageCount?: number;
}

interface ClinicAnalytics {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  totalConversations: number;
  totalMessages: number;
}

export default function AdminClinicDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, params] = useRoute("/admin/clinics/:id");
  const clinicId = params?.id;

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

  const { data: clinic, isLoading: clinicLoading } = useQuery<Clinic>({
    queryKey: ["/api/clinics", clinicId],
    enabled: isAuthenticated && !!clinicId,
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<PatientBooking[]>({
    queryKey: ["/api/patient-bookings/clinic", clinicId],
    enabled: isAuthenticated && !!clinicId,
  });

  const { data: chatThreads = [], isLoading: threadsLoading } = useQuery<ChatThread[]>({
    queryKey: ["/api/chatbot/threads/clinic", clinicId],
    enabled: isAuthenticated && !!clinicId,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<ClinicAnalytics>({
    queryKey: ["/api/analytics/clinic", clinicId],
    enabled: isAuthenticated && !!clinicId,
  });

  if (authLoading || !isAuthenticated) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" data-testid={`badge-status-${status}`}>Pending</Badge>;
      case "confirmed":
        return <Badge className="bg-green-600 text-white" data-testid={`badge-status-${status}`}>Confirmed</Badge>;
      case "cancelled":
        return <Badge variant="destructive" data-testid={`badge-status-${status}`}>Cancelled</Badge>;
      case "completed":
        return <Badge className="bg-blue-600 text-white" data-testid={`badge-status-${status}`}>Completed</Badge>;
      default:
        return <Badge variant="outline" data-testid={`badge-status-${status}`}>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-8 space-y-8">
      {/* Back Navigation */}
      <div>
        <Link href="/admin/clinics">
          <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-to-clinics">
            <ArrowLeft className="h-4 w-4" />
            Back to Clinics
          </Button>
        </Link>
      </div>

      {/* Clinic Header */}
      {clinicLoading ? (
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-lg" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      ) : clinic ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {clinic.logoUrl ? (
              <img
                src={clinic.logoUrl}
                alt={`${clinic.name} logo`}
                className="h-16 w-16 rounded-lg object-cover"
                data-testid="img-clinic-logo"
              />
            ) : (
              <div
                className="h-16 w-16 rounded-lg flex items-center justify-center text-white font-bold text-2xl"
                style={{ backgroundColor: clinic.brandColor }}
                data-testid="div-clinic-logo-placeholder"
              >
                {clinic.name[0]}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-clinic-name">
                {clinic.name}
              </h1>
              <p className="text-muted-foreground">Clinic Dashboard</p>
            </div>
          </div>
          <Link href={`/clinic/${clinic.slug}`}>
            <Button variant="outline" className="gap-2" data-testid="button-view-public-page">
              <ExternalLink className="h-4 w-4" />
              View Public Page
            </Button>
          </Link>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Clinic not found or you don't have access.</p>
        </div>
      )}

      {/* Analytics Cards */}
      {analyticsLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card data-testid="card-total-bookings">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-bookings">
                {analytics?.totalBookings || 0}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-pending-bookings">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600" data-testid="stat-pending-bookings">
                {analytics?.pendingBookings || 0}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-confirmed-bookings">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="stat-confirmed-bookings">
                {analytics?.confirmedBookings || 0}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-clinic-conversations">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversations</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-clinic-conversations">
                {analytics?.totalConversations || 0}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-clinic-messages">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-clinic-messages">
                {analytics?.totalMessages || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Separator />

      {/* Tabs for Bookings and Chat History */}
      <Tabs defaultValue="bookings" className="space-y-4">
        <TabsList data-testid="tabs-clinic-dashboard">
          <TabsTrigger value="bookings" data-testid="tab-bookings">
            Patient Bookings
          </TabsTrigger>
          <TabsTrigger value="chats" data-testid="tab-chats">
            Chat History
          </TabsTrigger>
        </TabsList>

        {/* Patient Bookings Tab */}
        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-bookings-title">Patient Bookings</CardTitle>
              <CardDescription>
                Appointment requests from your clinic's chatbot
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" data-testid="text-no-bookings">
                  No patient bookings yet. Bookings will appear here when patients request appointments through your chatbot.
                </div>
              ) : (
                <Table data-testid="table-bookings">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Preferred Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id} data-testid={`row-booking-${booking.id}`}>
                        <TableCell className="font-medium" data-testid={`text-patient-name-${booking.id}`}>
                          {booking.patientName}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              {booking.patientEmail}
                            </span>
                            {booking.patientPhone && (
                              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {booking.patientPhone}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell data-testid={`text-preferred-date-${booking.id}`}>
                          {booking.preferredDate || "Not specified"}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(booking.status)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(booking.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat History Tab */}
        <TabsContent value="chats">
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-chats-title">Chat History</CardTitle>
              <CardDescription>
                Conversations from your clinic's patient chatbot
              </CardDescription>
            </CardHeader>
            <CardContent>
              {threadsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : chatThreads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" data-testid="text-no-chats">
                  No chat conversations yet. Conversations will appear here when patients use your chatbot.
                </div>
              ) : (
                <Table data-testid="table-chats">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Thread ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Messages</TableHead>
                      <TableHead>Started</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chatThreads.map((thread) => (
                      <TableRow key={thread.id} data-testid={`row-chat-${thread.id}`}>
                        <TableCell className="font-mono text-sm" data-testid={`text-thread-id-${thread.id}`}>
                          {thread.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" data-testid={`badge-type-${thread.id}`}>
                            {thread.type}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`text-message-count-${thread.id}`}>
                          {thread.messageCount || 0} messages
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(thread.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
