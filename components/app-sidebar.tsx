"use client"

import * as React from "react"
import Image from "next/image"
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
  BookOpenIcon,
  CodeIcon,
  LayoutDashboardIcon,
  Settings2Icon,
  CircleHelpIcon,
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
      url: "/dashboard/lessons",
      icon: <BookOpenIcon />,
    },
    {
      title: "Exercises",
      url: "/dashboard/exercises",
      icon: <CodeIcon />,
    },
  ],
  documents: [
    {
      name: "Curriculum",
      url: "/dashboard/curriculum",
      icon: <MapIcon />,
    },
    {
      name: "Notes",
      url: "/dashboard/notes",
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
      url: "/dashboard/profile",
      icon: <Settings2Icon />,
    },
    {
      title: "Help",
      url: "/dashboard",
      icon: <CircleHelpIcon />,
    },
  ],
}

export function AppSidebar({
  resumeLessonSlug,
  ...props
}: React.ComponentProps<typeof Sidebar> & { resumeLessonSlug?: string | null }) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<Link href="/dashboard" />}
            >
              <Image src="/fulllogo-Photoroom.png" alt="cpproad" width={160} height={40} className="h-10 w-auto" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} resumeLessonSlug={resumeLessonSlug ?? null} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
