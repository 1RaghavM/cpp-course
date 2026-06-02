"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { motion, useReducedMotion } from "motion/react";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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

interface ProfilePageProps {
  email: string;
  userInitial: string;
  displayName: string | null;
  streakDays: number;
  weeklyGoal: number | null;
  totalCompleted: number;
  totalLessons: number;
  lessonsCompletedThisWeek: number;
  background: string | null;
  motivation: string | null;
}

const BACKGROUND_LABELS: Record<string, string> = {
  new: "Complete beginner",
  other_lang: "Experience in other languages",
  some_cpp: "Some C++ experience",
};

const MOTIVATION_LABELS: Record<string, string> = {
  interviews: "Interview prep",
  school: "University / school",
  gamedev: "Game development",
  systems: "Systems programming",
  competitive: "Competitive programming",
  curious: "Just curious",
};

const WEEKLY_GOAL_OPTIONS = [
  { value: "2", label: "2 lessons / week" },
  { value: "3", label: "3 lessons / week" },
  { value: "5", label: "5 lessons / week" },
  { value: "7", label: "7 lessons / week" },
];

export function ProfilePage({
  email,
  userInitial,
  displayName: initialDisplayName,
  streakDays,
  weeklyGoal: initialWeeklyGoal,
  totalCompleted,
  totalLessons,
  lessonsCompletedThisWeek,
  background,
  motivation,
}: ProfilePageProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();

  const [displayName, setDisplayName] = useState(initialDisplayName ?? "");
  const [weeklyGoal, setWeeklyGoal] = useState<string>(
    initialWeeklyGoal?.toString() ?? "",
  );
  const [savingName, setSavingName] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const nameIsDirty = displayName !== (initialDisplayName ?? "");
  const goalIsDirty = weeklyGoal !== (initialWeeklyGoal?.toString() ?? "");

  async function handleSaveName() {
    setSavingName(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: displayName || null }),
      });
      if (!res.ok) throw new Error();
      toast.success("Display name updated");
      router.refresh();
    } catch {
      toast.error("Failed to update display name");
    } finally {
      setSavingName(false);
    }
  }

  async function handleSaveGoal() {
    setSavingGoal(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weeklyGoal: weeklyGoal ? Number(weeklyGoal) : null }),
      });
      if (!res.ok) throw new Error();
      toast.success("Weekly goal updated");
      router.refresh();
    } catch {
      toast.error("Failed to update weekly goal");
    } finally {
      setSavingGoal(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) throw new Error();
      const supabase = createBrowserClient();
      await supabase.auth.signOut();
      router.push("/login");
    } catch {
      toast.error("Failed to delete account");
      setDeleting(false);
    }
  }

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07 } },
  };

  const itemVariants = reducedMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, y: 12 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
        },
      };

  const completionPercent = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;
  const weeklyPercent =
    initialWeeklyGoal && initialWeeklyGoal > 0
      ? Math.min(100, Math.round((lessonsCompletedThisWeek / initialWeeklyGoal) * 100))
      : 0;

  return (
    <div className="mx-auto w-full max-w-[800px] px-6 py-8">
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Breadcrumb */}
        <motion.div variants={itemVariants}>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Profile</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-primary">Profile</h1>
        </motion.div>

        {/* Section 1: Identity */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Identity</CardTitle>
              <CardDescription>Your name and email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar size="lg" className="size-16 text-lg">
                  <AvatarFallback>{userInitial}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-primary">{displayName || "No name set"}</p>
                  <p className="text-sm text-muted-foreground">{email}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="display-name">Display name</Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Add a display name"
                  maxLength={50}
                />
              </div>
              {nameIsDirty && (
                <Button onClick={handleSaveName} disabled={savingName}>
                  {savingName ? "Saving..." : "Save name"}
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Section 2: Learning Preferences */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Learning preferences</CardTitle>
              <CardDescription>Your goals and background</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="weekly-goal">Weekly goal</Label>
                <Select value={weeklyGoal} onValueChange={setWeeklyGoal}>
                  <SelectTrigger id="weekly-goal" className="w-full sm:w-[240px]">
                    <SelectValue placeholder="Select a goal" />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKLY_GOAL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {goalIsDirty && (
                <Button onClick={handleSaveGoal} disabled={savingGoal}>
                  {savingGoal ? "Saving..." : "Save goal"}
                </Button>
              )}
              <Separator />
              <div className="space-y-3">
                <div>
                  <Label className="text-muted-foreground">Starting level</Label>
                  <div className="mt-1">
                    <Badge variant="secondary">
                      {background ? (BACKGROUND_LABELS[background] ?? background) : "Not set"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Motivation</Label>
                  <div className="mt-1">
                    <Badge variant="secondary">
                      {motivation ? (MOTIVATION_LABELS[motivation] ?? motivation) : "Not set"}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Set during onboarding</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section 3: Stats Overview */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Stats</CardTitle>
              <CardDescription>Your learning progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Streak</Label>
                  <div className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 23c-3.866 0-7-3.134-7-7 0-2.692 1.475-5.598 3.434-8.12a.75.75 0 011.232.028C11.01 9.817 12 11.7 12 11.7s2.25-3.6 3.75-5.4a.75.75 0 011.248.06C18.664 9.1 19 12.05 19 16c0 3.866-3.134 7-7 7z" />
                    </svg>
                    <span className="text-2xl font-bold tabular-nums text-primary">{streakDays}</span>
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Total completed</Label>
                  <p className="text-2xl font-bold tabular-nums text-primary">
                    {totalCompleted}
                    <span className="text-sm font-normal text-muted-foreground"> / {totalLessons}</span>
                  </p>
                  <Progress value={completionPercent} className="h-2" />
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">This week</Label>
                  <p className="text-2xl font-bold tabular-nums text-primary">
                    {lessonsCompletedThisWeek}
                    <span className="text-sm font-normal text-muted-foreground">
                      {" / "}
                      {initialWeeklyGoal ?? "—"}
                    </span>
                  </p>
                  {initialWeeklyGoal && <Progress value={weeklyPercent} className="h-2" />}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section 4: Account Actions */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>Change your account password</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <Link href="/update-password">Change password</Link>
              </Button>
            </CardContent>
            <Separator className="mx-6" />
            <CardHeader>
              <CardTitle className="text-destructive">Delete account</CardTitle>
              <CardDescription>
                Permanently delete your account and all your learning data. This cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={deleting}>
                    {deleting ? "Deleting..." : "Delete account"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your account, all progress, submissions,
                      conversations, and learning data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete my account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
