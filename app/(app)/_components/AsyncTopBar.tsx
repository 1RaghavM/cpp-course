import { TopBar } from "@/components/layout/TopBar";
import { fetchNavData } from "@/lib/dashboard/fetch-nav-data";

/**
 * Async server component that fetches navigation data and renders the TopBar.
 * Designed to be wrapped in a Suspense boundary so that the page content
 * (and its loading.tsx skeleton) renders immediately.
 */
export async function AsyncTopBar({
  userEmail,
  userInitial,
}: {
  userEmail: string;
  userInitial: string;
}) {
  const { resumeSlug, streakDays } = await fetchNavData();

  return (
    <TopBar
      streakDays={streakDays}
      resumeLessonSlug={resumeSlug}
      userEmail={userEmail}
      userInitial={userInitial}
    />
  );
}
