"use client"

import * as React from "react"
import {
  AudioWaveform,
  Box,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  User2,
  Facebook
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar(
  props: React.ComponentProps<typeof Sidebar> & { tenantId: string }
) {
  const { tenantId, ...sidebarProps } = props;

  // This is sample data.
  const data = {
    user: {
      name: "Shamim Hossain",
      email: "m@example.com",
      avatar: "https://i.pravatar.cc/150?img=4",
    },
    teams: [
      {
        name: "Acme Inc",
        logo: GalleryVerticalEnd,
        plan: "Enterprise",
      },
      {
        name: "Acme Corp.",
        logo: AudioWaveform,
        plan: "Startup",
      },
      {
        name: "Evil Corp.",
        logo: Command,
        plan: "Free",
      },
    ],
    navMain: [
      {
        title: "Facebook",
        url: "#",
        icon: Box,
        isActive: true,
        items: [
          {
            title: "Connections",
            url: `/app/${tenantId}/connections`,
          },
        ],
      },
      {
        title: "Users",
        url: "#",
        icon: User2,
        items: [
          {
            title: "List Users",
            url: `/app/${tenantId}/users`,
          },
          {
            title: "Role & Permissions",
            url: `/app/${tenantId}/role-permissions`,
          },
        ],
      },
    ],
    projects: [
      {
        name: "Design Engineering",
        url: "#",
        icon: Frame,
      },
      {
        name: "Sales & Marketing",
        url: "#",
        icon: PieChart,
      },
      {
        name: "Travel",
        url: "#",
        icon: Map,
      },
    ],
  };
  
  return (
    <Sidebar collapsible="icon" {...sidebarProps}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
