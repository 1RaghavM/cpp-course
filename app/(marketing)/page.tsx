import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { BentoGrid } from "./components/BentoGrid";
import { CurriculumTabs } from "./components/CurriculumTabs";
import { FAQ } from "./components/FAQ";
import { FinalCTA } from "./components/FinalCTA";
import { Footer } from "./components/Footer";
import { GridBackground } from "./components/GridBackground";

export default function HomePage() {
  return (
    <>
      <GridBackground />
      <Nav />
      <main>
        <Hero />
        <BentoGrid />
        <CurriculumTabs />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
