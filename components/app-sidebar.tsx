"use client"

import * as React from "react"
import Link from "next/link"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  BookOpenIcon,
  CodeIcon,
  BarChart3Icon,
  Settings2Icon,
  CircleHelpIcon,
  SearchIcon,
  NotebookPenIcon,
  TerminalSquareIcon,
  MapIcon,
} from "lucide-react"

const data = {
  user: {
    name: "Raghav",
    email: "raghavmehta091@gmail.com",
    avatar: "",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Lessons",
      url: "/lessons",
      icon: <BookOpenIcon />,
    },
    {
      title: "Exercises",
      url: "/exercises",
      icon: <CodeIcon />,
    },
    {
      title: "Stats",
      url: "/stats",
      icon: <BarChart3Icon />,
    },
  ],
  documents: [
    {
      name: "Curriculum",
      url: "/curriculum",
      icon: <MapIcon />,
    },
    {
      name: "Notes",
      url: "/dashboard",
      icon: <NotebookPenIcon />,
    },
    {
      name: "Playground",
      url: "/playground",
      icon: <TerminalSquareIcon />,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard",
      icon: <Settings2Icon />,
    },
    {
      title: "Help",
      url: "/dashboard",
      icon: <CircleHelpIcon />,
    },
    {
      title: "Search",
      url: "/dashboard",
      icon: <SearchIcon />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<Link href="/dashboard" />}
            >
              <img src="/fulllogo-Photoroom.png" alt="cpproad" className="h-10 w-auto" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
