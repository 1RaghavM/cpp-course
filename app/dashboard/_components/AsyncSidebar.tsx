import { AppSidebar } from "@/components/app-sidebar";
import { fetchNavData } from "@/lib/dashboard/fetch-nav-data";

/**
 * Async server component that fetches navigation data and renders the sidebar.
 * Designed to be wrapped in a Suspense boundary so that the rest of the layout
 * (including the page's loading.tsx skeleton) renders immediately.
 */
export async function AsyncSidebar() {
  const { resumeSlug } = await fetchNavData();
  return <AppSidebar variant="inset" resumeLessonSlug={resumeSlug} />;
}
