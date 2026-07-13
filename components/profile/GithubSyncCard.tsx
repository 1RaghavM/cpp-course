"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ExternalLink } from "lucide-react";

interface GithubSyncCardProps {
  connected: boolean;
  login: string;
  repoFullName: string;
}

export function GithubSyncCard({
  connected: initialConnected,
  login,
  repoFullName,
}: GithubSyncCardProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [connected, setConnected] = useState(initialConnected);
  const [removing, setRemoving] = useState(false);

  // Surface the OAuth callback result once, then clean the URL.
  useEffect(() => {
    const status = params.get("github");
    if (status === "connected") toast.success("GitHub connected");
    else if (status === "error") toast.error("Couldn't connect GitHub. Please try again.");
    if (status) router.replace("/dashboard/profile");
  }, [params, router]);

  async function handleDisconnect() {
    setRemoving(true);
    try {
      const res = await fetch("/api/github", { method: "DELETE" });
      if (!res.ok) throw new Error();
      setConnected(false);
      toast.success("GitHub disconnected");
    } catch {
      toast.error("Failed to disconnect");
    } finally {
      setRemoving(false);
    }
  }

  if (!connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>GitHub sync</CardTitle>
          <CardDescription>Auto-commit your passed solutions to GitHub</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Connect GitHub and every solution you pass is committed to a public{" "}
            <code className="rounded bg-muted px-1">cpproad-submissions</code> repo — so your
            progress shows on your contribution graph.
          </p>
          <Button render={<a href="/api/github/connect" />}>Connect GitHub</Button>
        </CardContent>
      </Card>
    );
  }

  const repoUrl = `https://github.com/${repoFullName}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>GitHub sync</CardTitle>
        <CardDescription>Passed solutions are committed automatically</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">@{login}</p>
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              {repoFullName}
              <ExternalLink className="size-3" />
            </a>
          </div>
          <Badge variant="secondary">Connected</Badge>
        </div>

        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="outline" disabled={removing} />}>
            {removing ? <Spinner className="size-4" /> : "Disconnect"}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect GitHub?</AlertDialogTitle>
              <AlertDialogDescription>
                New solutions will stop syncing. Your existing repo and commits are kept.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDisconnect}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Disconnect
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
