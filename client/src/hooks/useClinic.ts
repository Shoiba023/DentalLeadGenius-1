import { useQuery } from "@tanstack/react-query";
import type { Clinic } from "@shared/schema";

interface SessionResponse {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isAdmin: boolean;
  } | null;
  clinics: Clinic[];
  selectedClinicId: string | null;
  isAuthenticated: boolean;
}

export function useClinic() {
  const { data: session, isLoading } = useQuery<SessionResponse>({
    queryKey: ["/api/auth/session"],
  });

  const clinics = session?.clinics || [];
  const selectedClinicId = session?.selectedClinicId || null;
  const currentClinic = clinics.find((c) => c.id === selectedClinicId) || null;

  return {
    clinics,
    selectedClinicId,
    currentClinic,
    isLoading,
  };
}
