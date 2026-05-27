"use client";

import { createBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const supabase = createBrowserClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="rounded-lg border border-border bg-elevated px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:border-border-subtle hover:bg-hover hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Signing out…" : "Log out"}
    </button>
  );
}
