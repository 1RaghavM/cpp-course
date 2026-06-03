import { Skeleton } from "@/components/ui/skeleton";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar";

/**
 * Static skeleton that mirrors the AppSidebar layout while data loads.
 */
export function SidebarSkeleton() {
  return (
    <Sidebar collapsible="offcanvas" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="data-[slot=sidebar-menu-button]:p-1.5!">
              <Skeleton className="h-10 w-32" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              {/* Resume Learning button placeholder */}
              <SidebarMenuItem>
                <Skeleton className="h-8 w-full rounded-md" />
              </SidebarMenuItem>
            </SidebarMenu>
            <SidebarMenu>
              {/* Nav items: Dashboard, Lessons, Exercises */}
              {Array.from({ length: 3 }, (_, i) => (
                <SidebarMenuItem key={i}>
                  <Skeleton className="h-8 w-full rounded-md" />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Document items: Curriculum, Notes, Playground */}
              {Array.from({ length: 3 }, (_, i) => (
                <SidebarMenuItem key={i}>
                  <Skeleton className="h-8 w-full rounded-md" />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Skeleton className="h-10 w-full rounded-md" />
      </SidebarFooter>
    </Sidebar>
  );
}
