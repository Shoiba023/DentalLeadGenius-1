import { Home, Users, Send, Building2, BarChart3, LogOut, Calendar, Clock, UserPlus } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";

const adminMenuItems = [
  {
    title: "Analytics",
    url: "/dashboard",
    icon: BarChart3,
  },
  {
    title: "Leads",
    url: "/dashboard/leads",
    icon: Users,
  },
  {
    title: "Outreach",
    url: "/dashboard/outreach",
    icon: Send,
  },
  {
    title: "Sequences",
    url: "/dashboard/sequences",
    icon: Clock,
  },
  {
    title: "Clinics",
    url: "/dashboard/clinics",
    icon: Building2,
  },
  {
    title: "Patient Bookings",
    url: "/dashboard/patient-bookings",
    icon: Calendar,
  },
  {
    title: "Users",
    url: "/dashboard/users",
    icon: UserPlus,
  },
];

const clinicMenuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: BarChart3,
  },
  {
    title: "Leads",
    url: "/dashboard/leads",
    icon: Users,
  },
  {
    title: "Outreach",
    url: "/dashboard/outreach",
    icon: Send,
  },
  {
    title: "Patient Bookings",
    url: "/dashboard/patient-bookings",
    icon: Calendar,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth() as { user: User | undefined };
  
  const menuItems = user?.role === 'clinic' ? clinicMenuItems : adminMenuItems;

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold px-4 py-6">
            DentalLeadGenius
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.profileImageUrl || ""} />
            <AvatarFallback>
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" data-testid="text-user-name">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full gap-2"
          asChild
          data-testid="button-logout"
        >
          <a href="/api/logout">
            <LogOut className="h-4 w-4" />
            Logout
          </a>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
