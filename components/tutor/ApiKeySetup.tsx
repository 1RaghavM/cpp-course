"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, ExternalLink, Key } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ApiKeySetupProps {
  onKeySaved: () => void;
}

type Status = "idle" | "validating" | "error" | "rate-limited";

export default function ApiKeySetup({ onKeySaved }: ApiKeySetupProps) {
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = apiKey.trim();
    if (!trimmed) return;

    setStatus("validating");
    setErrorMessage("");

    try {
      const res = await fetch("/api/profile/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: trimmed }),
      });

      if (res.ok) {
        onKeySaved();
        return;
      }

      const data = await res.json();
      const code = data?.error?.code;

      if (code === "RATE_LIMITED") {
        setStatus("rate-limited");
      } else {
        setStatus("error");
        setErrorMessage(
          data?.error?.message ??
            "This key doesn't appear to work. Double-check that you copied the full key from Google AI Studio.",
        );
      }
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col items-center px-6 py-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
              <Key className="size-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Set up your AI Tutor</h2>
            <p className="text-sm text-muted-foreground">
              The tutor is powered by Google&apos;s Gemini AI. To use it, you&apos;ll need your own
              free API key. Your key is encrypted and stored securely.
            </p>
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium text-foreground">How to get your API key</p>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="font-medium text-foreground">1.</span>
                <span>
                  Go to{" "}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    Google AI Studio
                    <ExternalLink className="size-3" />
                  </a>
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-foreground">2.</span>
                <span>Sign in with your Google account</span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-foreground">3.</span>
                <span>Click &quot;Create API Key&quot;</span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-foreground">4.</span>
                <span>
                  Copy the key (it starts with <code className="rounded bg-muted px-1">AIza</code>)
                </span>
              </li>
            </ol>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your API key here"
              autoComplete="off"
              spellCheck={false}
              disabled={status === "validating"}
            />

            {status === "error" && (
              <Alert className="bg-error/10 border-error/20 text-error">
                <AlertCircle className="size-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {status === "rate-limited" && (
              <Alert className="bg-warning/10 border-warning/20 text-warning">
                <AlertCircle className="size-4" />
                <AlertDescription>Too many attempts. Please try again in an hour.</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!apiKey.trim() || status === "validating" || status === "rate-limited"}
            >
              {status === "validating" ? (
                <span className="flex items-center gap-2">
                  <Spinner className="size-4" />
                  Checking your key...
                </span>
              ) : (
                "Save key"
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Your key is encrypted with AES-256 and only used to power your tutor sessions. You can
            remove it anytime from your{" "}
            <a href="/dashboard/profile" className="text-primary hover:underline">
              profile
            </a>
            .
          </p>
        </div>
      </div>
    </ScrollArea>
  );
}
