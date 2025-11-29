import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, User, Mail, Phone, Clock, FileText } from "lucide-react";
import { format } from "date-fns";

interface PatientBooking {
  id: string;
  clinicId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  appointmentType: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
}

export default function AdminPatientBookings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to view patient bookings.",
        variant: "destructive",
      });
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: bookings = [], isLoading } = useQuery<PatientBooking[]>({
    queryKey: ["/api/patient-bookings"],
    enabled: isAuthenticated,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/patient-bookings/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patient-bookings"] });
      toast({
        title: "Status Updated",
        description: "Booking status has been updated successfully.",
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "missed":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2" data-testid="text-page-title">
            Patient Bookings
          </h1>
          <p className="text-muted-foreground">
            Manage appointment requests from patient chatbots
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Patient Bookings Yet</h3>
            <p className="text-muted-foreground" data-testid="text-empty-bookings">
              Patient appointment requests will appear here once they interact with clinic chatbots.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="hover-elevate" data-testid={`card-booking-${booking.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 mb-2">
                      <User className="h-5 w-5" />
                      {booking.patientName}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {booking.patientEmail}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {booking.patientPhone}
                      </span>
                    </div>
                  </div>
                  <Badge className={getStatusColor(booking.status)}>
                    {booking.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                  {booking.appointmentType && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Type:</span>
                      <span>{booking.appointmentType}</span>
                    </div>
                  )}
                  {booking.preferredDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Preferred Date:</span>
                      <span>{booking.preferredDate}</span>
                    </div>
                  )}
                  {booking.preferredTime && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Preferred Time:</span>
                      <span>{booking.preferredTime}</span>
                    </div>
                  )}
                </div>
                
                {booking.notes && (
                  <div className="text-sm">
                    <span className="font-medium">Notes:</span>
                    <p className="text-muted-foreground mt-1">{booking.notes}</p>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Requested: {format(new Date(booking.createdAt), "PPp")}
                </div>

                <div className="flex gap-2 flex-wrap">
                  {booking.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: booking.id, status: "confirmed" })}
                        disabled={updateStatusMutation.isPending}
                        data-testid={`button-confirm-${booking.id}`}
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({ id: booking.id, status: "cancelled" })}
                        disabled={updateStatusMutation.isPending}
                        data-testid={`button-cancel-${booking.id}`}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  {booking.status === "confirmed" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: booking.id, status: "completed" })}
                        disabled={updateStatusMutation.isPending}
                        data-testid={`button-complete-${booking.id}`}
                      >
                        Mark Completed
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({ id: booking.id, status: "missed" })}
                        disabled={updateStatusMutation.isPending}
                        data-testid={`button-missed-${booking.id}`}
                      >
                        Mark Missed
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
