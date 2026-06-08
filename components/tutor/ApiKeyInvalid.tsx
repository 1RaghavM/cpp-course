"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ApiKeyInvalidProps {
  preview: string;
  onKeyUpdated: () => void;
  onKeyRemoved: () => void;
}

type Status = "idle" | "validating" | "removing" | "error" | "rate-limited";

export default function ApiKeyInvalid({ preview, onKeyUpdated, onKeyRemoved }: ApiKeyInvalidProps) {
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleUpdate(e: React.FormEvent) {
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
        onKeyUpdated();
        return;
      }

      const data = await res.json();
      const code = data?.error?.code;

      if (code === "RATE_LIMITED") {
        setStatus("rate-limited");
      } else {
        setStatus("error");
        setErrorMessage(data?.error?.message ?? "This key doesn't appear to work.");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  }

  async function handleRemove() {
    setStatus("removing");
    try {
      const res = await fetch("/api/profile/api-key", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      if (res.ok) {
        onKeyRemoved();
      }
    } catch {
      setStatus("idle");
    }
  }

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col items-center px-6 py-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-warning/10">
              <AlertTriangle className="size-6 text-warning" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Your API key is no longer working
            </h2>
            <p className="text-sm text-muted-foreground">
              Key: <code className="rounded bg-muted px-1">{preview}</code>
            </p>
            <p className="text-sm text-muted-foreground">
              This usually means the key was revoked or deleted in Google AI Studio. Please enter a
              new key to continue using the tutor.
            </p>
          </div>

          <form onSubmit={handleUpdate} className="space-y-3">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your new API key"
              autoComplete="off"
              spellCheck={false}
              disabled={status === "validating" || status === "removing"}
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

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={
                  !apiKey.trim() ||
                  status === "validating" ||
                  status === "removing" ||
                  status === "rate-limited"
                }
              >
                {status === "validating" ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="size-4" />
                    Checking...
                  </span>
                ) : (
                  "Update key"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleRemove}
                disabled={status === "validating" || status === "removing"}
              >
                {status === "removing" ? <Spinner className="size-4" /> : "Remove key"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ScrollArea>
  );
}
