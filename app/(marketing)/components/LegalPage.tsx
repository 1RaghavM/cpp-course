import type { ReactNode } from "react";
import { createServerClient } from "@/lib/supabase/server";
import { Nav } from "./Nav";
import { Footer } from "./Footer";

export async function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  const supabase = createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <>
      <Nav isSignedIn={!!session} />
      <main className="legal-page">
        <article className="hp-container legal-doc">
          <h1>{title}</h1>
          <p className="legal-updated">Effective August 29, 2026</p>
          {children}
        </article>
      </main>
      <Footer isSignedIn={!!session} />
    </>
  );
}
