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

const menuItems = [
  {
    title: "Analytics",
    url: "/admin",
    icon: BarChart3,
  },
  {
    title: "Leads",
    url: "/admin/leads",
    icon: Users,
  },
  {
    title: "Outreach",
    url: "/admin/outreach",
    icon: Send,
  },
  {
    title: "Sequences",
    url: "/admin/sequences",
    icon: Clock,
  },
  {
    title: "Clinics",
    url: "/admin/clinics",
    icon: Building2,
  },
  {
    title: "Patient Bookings",
    url: "/admin/patient-bookings",
    icon: Calendar,
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: UserPlus,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth() as { user: User | undefined };

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
                    data-testid={`nav-${item.title.toLowerCase()}`}
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
