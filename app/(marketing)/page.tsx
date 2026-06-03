import { createServerClient } from "@/lib/supabase/server";
import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { BentoGrid } from "./components/BentoGrid";
import { CurriculumTabs } from "./components/CurriculumTabs";
import { FAQ } from "./components/FAQ";
import { FinalCTA } from "./components/FinalCTA";
import { Footer } from "./components/Footer";
import { GridBackground } from "./components/GridBackground";

export default async function HomePage() {
  const supabase = createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const isSignedIn = !!session;

  return (
    <>
      <GridBackground />
      <Nav isSignedIn={isSignedIn} />
      <main>
        <Hero isSignedIn={isSignedIn} />
        <BentoGrid />
        <CurriculumTabs />
        <FAQ />
        <FinalCTA isSignedIn={isSignedIn} />
      </main>
      <Footer />
    </>
  );
}
