import { useState } from "react";
import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Clinic } from "@shared/schema";

interface SessionResponse {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isAdmin: boolean;
  };
  clinics: Clinic[];
  selectedClinicId: string | null;
}

export function ClinicSwitcher() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const { data: session, isLoading } = useQuery<SessionResponse>({
    queryKey: ["/api/auth/session"],
  });

  const switchClinicMutation = useMutation({
    mutationFn: async (clinicId: string) => {
      return apiRequest("POST", "/api/auth/switch-clinic", { clinicId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sequences"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: "Clinic Switched",
        description: "You are now viewing a different clinic's data.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to switch clinic. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Button variant="outline" className="w-full justify-start gap-2" disabled>
        <Building2 className="h-4 w-4" />
        Loading...
      </Button>
    );
  }

  const clinics = session?.clinics || [];
  const selectedClinicId = session?.selectedClinicId;
  const currentClinic = clinics.find((c) => c.id === selectedClinicId);

  if (clinics.length === 0) {
    return null;
  }

  if (clinics.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium truncate">{clinics[0].name}</span>
      </div>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between gap-2"
          data-testid="button-clinic-switcher"
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {currentClinic?.name || "Select Clinic"}
            </span>
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[220px]" align="start">
        <DropdownMenuLabel>Switch Clinic</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {clinics.map((clinic) => (
          <DropdownMenuItem
            key={clinic.id}
            onClick={() => {
              if (clinic.id !== selectedClinicId) {
                switchClinicMutation.mutate(clinic.id);
              }
              setOpen(false);
            }}
            className="flex items-center justify-between"
            data-testid={`clinic-option-${clinic.id}`}
          >
            <span className="truncate">{clinic.name}</span>
            {clinic.id === selectedClinicId && (
              <Check className="h-4 w-4 shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
