"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ExternalLink } from "lucide-react";

interface ApiKeyCardProps {
  hasKey: boolean;
  preview: string;
  isValid: boolean;
}

export function ApiKeyCard({
  hasKey: initialHasKey,
  preview: initialPreview,
  isValid: initialIsValid,
}: ApiKeyCardProps) {
  const [hasKey, setHasKey] = useState(initialHasKey);
  const [preview, setPreview] = useState(initialPreview);
  const [isValid, setIsValid] = useState(initialIsValid);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");

  async function handleSaveKey(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = apiKey.trim();
    if (!trimmed) return;

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/profile/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: trimmed }),
      });

      if (res.ok) {
        const data = await res.json();
        setHasKey(true);
        setPreview(data.preview);
        setIsValid(true);
        setApiKey("");
        setUpdateOpen(false);
        toast.success("API key saved");
      } else {
        const data = await res.json();
        setError(data?.error?.message ?? "Failed to save key");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    setRemoving(true);
    try {
      const res = await fetch("/api/profile/api-key", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      if (res.ok) {
        setHasKey(false);
        setPreview("");
        setIsValid(false);
        toast.success("API key removed");
      } else {
        toast.error("Failed to remove key");
      }
    } catch {
      toast.error("Failed to remove key");
    } finally {
      setRemoving(false);
    }
  }

  if (!hasKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API Key</CardTitle>
          <CardDescription>Required for the AI tutor</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            No API key set. Add your Gemini API key to use the tutor. Get one free at{" "}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Google AI Studio
              <ExternalLink className="size-3" />
            </a>
          </p>
          <Dialog
            open={updateOpen}
            onOpenChange={(open) => {
              setUpdateOpen(open);
              if (!open) {
                setApiKey("");
                setError("");
              }
            }}
          >
            <DialogTrigger render={<Button />}>Add API key</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add API key</DialogTitle>
                <DialogDescription>
                  Paste your Gemini API key. It will be validated and encrypted.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveKey} className="space-y-3">
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIza..."
                  autoComplete="off"
                  spellCheck={false}
                  disabled={saving}
                />
                {error && (
                  <Alert className="bg-error/10 border-error/20 text-error">
                    <AlertCircle className="size-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={!apiKey.trim() || saving}>
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <Spinner className="size-4" />
                      Checking...
                    </span>
                  ) : (
                    "Save key"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Key</CardTitle>
        <CardDescription>Used for the AI tutor</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Google Gemini</p>
            <p className="text-sm text-muted-foreground">
              <code className="rounded bg-muted px-1">{preview}</code>
            </p>
          </div>
          <Badge variant={isValid ? "secondary" : "destructive"}>
            {isValid ? "Active" : "Invalid"}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          Used for the AI tutor. Get a new key at{" "}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            aistudio.google.com
            <ExternalLink className="size-3" />
          </a>
        </p>

        <div className="flex gap-2">
          <Dialog
            open={updateOpen}
            onOpenChange={(open) => {
              setUpdateOpen(open);
              if (!open) {
                setApiKey("");
                setError("");
              }
            }}
          >
            <DialogTrigger render={<Button variant="outline" />}>Update key</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update API key</DialogTitle>
                <DialogDescription>
                  Paste your new Gemini API key. It will be validated and encrypted.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveKey} className="space-y-3">
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIza..."
                  autoComplete="off"
                  spellCheck={false}
                  disabled={saving}
                />
                {error && (
                  <Alert className="bg-error/10 border-error/20 text-error">
                    <AlertCircle className="size-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={!apiKey.trim() || saving}>
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <Spinner className="size-4" />
                      Checking...
                    </span>
                  ) : (
                    "Save key"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="outline" disabled={removing} />}>
              {removing ? <Spinner className="size-4" /> : "Remove key"}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove your API key?</AlertDialogTitle>
                <AlertDialogDescription>
                  The tutor will be unavailable until you add a new key.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRemove}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Remove key
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
