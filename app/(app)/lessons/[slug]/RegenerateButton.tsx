"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface RegenerateButtonProps {
  slug: string;
}

/**
 * Client component that calls the regenerate API endpoint and
 * refreshes the page to show the new content.
 */
export function RegenerateButton({ slug }: RegenerateButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegenerate() {
    if (
      !confirm(
        "This will regenerate the lesson summary and exercises. Existing exercises and their submissions will be deleted. Continue?",
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/lessons/${slug}/regenerate`, {
        method: "POST",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Regeneration failed");
      }

      // Refresh the page to show regenerated content
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRegenerate}
        disabled={loading}
      >
        {loading ? "Regenerating..." : "Regenerate this lesson"}
      </Button>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
