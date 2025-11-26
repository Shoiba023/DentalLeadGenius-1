import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Building2, ExternalLink, Copy, Upload, ImageIcon } from "lucide-react";

interface Clinic {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  brandColor: string;
  createdAt: string;
}

export default function AdminClinics() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [uploadingLogoFor, setUploadingLogoFor] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    brandColor: "#3B82F6",
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

  const { data: clinics = [], isLoading } = useQuery<Clinic[]>({
    queryKey: ["/api/clinics"],
    enabled: isAuthenticated,
  });

  const createClinicMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/clinics", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinics"] });
      toast({
        title: "Clinic Created",
        description: "The clinic has been created successfully.",
      });
      setIsCreateOpen(false);
      setFormData({ name: "", slug: "", brandColor: "#3B82F6" });
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async ({ clinicId, file }: { clinicId: string; file: File }) => {
      const formData = new FormData();
      formData.append("logo", file);
      
      const response = await fetch(`/api/clinics/${clinicId}/logo`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinics"] });
      toast({
        title: "Logo Uploaded",
        description: "Clinic logo has been uploaded successfully.",
      });
      setUploadingLogoFor(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadingLogoFor(null);
    },
  });

  const handleLogoUpload = (clinicId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    setUploadingLogoFor(clinicId);
    uploadLogoMutation.mutate({ clinicId, file });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createClinicMutation.mutate(formData);
  };

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setFormData((prev) => ({ ...prev, name, slug }));
  };

  const copyClinicUrl = (slug: string) => {
    const url = `${window.location.origin}/clinic/${slug}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "URL Copied",
      description: "Clinic URL has been copied to clipboard.",
    });
  };

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2" data-testid="text-page-title">
            Clinic Management
          </h1>
          <p className="text-muted-foreground">
            Create and manage multi-tenant clinic accounts
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-create-clinic">
              <Plus className="h-4 w-4" />
              Create Clinic
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Clinic</DialogTitle>
              <DialogDescription>
                Add a new clinic to the platform with a unique subdomain and branding.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Clinic Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  placeholder="Bright Smile Dental"
                  data-testid="input-clinic-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Clinic Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  required
                  placeholder="bright-smile-dental"
                  data-testid="input-clinic-slug"
                />
                <p className="text-xs text-muted-foreground">
                  Clinic URL: /clinic/{formData.slug || "your-clinic-slug"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brandColor">Brand Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="brandColor"
                    type="color"
                    value={formData.brandColor}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, brandColor: e.target.value }))
                    }
                    className="h-10 w-20"
                    data-testid="input-brand-color"
                  />
                  <Input
                    value={formData.brandColor}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, brandColor: e.target.value }))
                    }
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createClinicMutation.isPending}
                data-testid="button-submit-clinic"
              >
                {createClinicMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Clinic"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Clinics Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : clinics.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Clinics Yet</h3>
            <p className="text-muted-foreground mb-4" data-testid="text-empty-clinics">
              Create your first clinic to get started with multi-tenant management.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Clinic
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clinics.map((clinic) => (
            <Card key={clinic.id} className="hover-elevate" data-testid={`card-clinic-${clinic.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 mb-2">
                      {clinic.logoUrl ? (
                        <img 
                          src={clinic.logoUrl} 
                          alt={clinic.name}
                          className="h-8 w-8 rounded-md object-cover"
                        />
                      ) : (
                        <div
                          className="h-8 w-8 rounded-md flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: clinic.brandColor }}
                        >
                          {clinic.name[0]}
                        </div>
                      )}
                      {clinic.name}
                    </CardTitle>
                    <Badge variant="outline">/clinic/{clinic.slug}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  <input
                    ref={(el) => { fileInputRefs.current[clinic.id] = el; }}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoUpload(clinic.id, e)}
                    className="hidden"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => fileInputRefs.current[clinic.id]?.click()}
                    disabled={uploadingLogoFor === clinic.id}
                    data-testid={`button-upload-logo-${clinic.id}`}
                  >
                    {uploadingLogoFor === clinic.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Upload className="h-3 w-3" />
                    )}
                    Logo
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1"
                    asChild
                    data-testid={`button-view-clinic-${clinic.id}`}
                  >
                    <a href={`/clinic/${clinic.slug}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                      View Page
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1"
                    onClick={() => copyClinicUrl(clinic.slug)}
                    data-testid={`button-copy-url-${clinic.id}`}
                  >
                    <Copy className="h-3 w-3" />
                    Copy URL
                  </Button>
                </div>
                <div className="pt-2 border-t text-xs text-muted-foreground">
                  Created {new Date(clinic.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
