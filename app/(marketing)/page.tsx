import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { CurriculumTabs } from "./components/CurriculumTabs";
import { FinalCTA } from "./components/FinalCTA";
import { Footer } from "./components/Footer";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Features />
        <CurriculumTabs />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
