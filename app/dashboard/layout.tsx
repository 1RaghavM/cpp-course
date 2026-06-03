import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { PageTransition } from "@/components/dashboard/PageTransition";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AsyncSidebar } from "@/app/dashboard/_components/AsyncSidebar";
import { SidebarSkeleton } from "@/app/dashboard/_components/SidebarSkeleton";

export const dynamic = "force-dynamic";

/**
 * Dashboard layout is now synchronous — no data fetching here.
 *
 * The sidebar fetches its own data inside a Suspense boundary, so the
 * page content (and its loading.tsx skeleton) renders immediately while
 * sidebar data streams in.
 *
 * SiteHeader is entirely client-side (usePathname) and needs no server data.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <Suspense fallback={<SidebarSkeleton />}>
        <AsyncSidebar />
      </Suspense>
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <PageTransition>{children}</PageTransition>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
