# Profile Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full profile page at `/profile` showing user identity, learning preferences, stats, and account management (password change + account deletion).

**Architecture:** Server component fetches all user data (user_stats, onboarding, progress counts) and passes props to a single client component. The client component renders four stacked Card sections. A new `DELETE /api/account` route handles account deletion with FK-safe cascading deletes. The TopBar avatar dropdown gets a "Profile" link.

**Tech Stack:** Next.js 14 App Router, Supabase (Postgres + Auth), shadcn/ui (Card, Avatar, Input, Label, Select, Badge, Button, Progress, Separator, Breadcrumb, AlertDialog, Sonner), motion/react for entry animation.

---

## File Structure

| File | Responsibility |
|---|---|
| `components/ui/alert-dialog.tsx` | shadcn AlertDialog primitive (installed) |
| `app/api/profile/route.ts` | PATCH handler — updates display_name and weekly_goal in user_stats |
| `app/api/account/route.ts` | DELETE handler — cascading delete of all user data + auth user |
| `app/(app)/profile/page.tsx` | Server component — data fetching, props assembly |
| `components/profile/ProfilePage.tsx` | Client component — all four card sections, form state, save/delete logic |
| `components/layout/TopBar.tsx` | Modified — add "Profile" link to avatar dropdown |

---

### Task 1: Install AlertDialog shadcn component

**Files:**
- Create: `components/ui/alert-dialog.tsx`

- [ ] **Step 1: Install alert-dialog**

```bash
npx shadcn@latest add alert-dialog
```

Expected: `components/ui/alert-dialog.tsx` is created.

- [ ] **Step 2: Verify the file exists**

```bash
ls components/ui/alert-dialog.tsx
```

Expected: file listed.

- [ ] **Step 3: Commit**

```bash
git add components/ui/alert-dialog.tsx
git commit -m "chore: install shadcn alert-dialog component"
```

---

### Task 2: Create PATCH /api/profile route

**Files:**
- Create: `app/api/profile/route.ts`

This route updates `display_name` and/or `weekly_goal` in the `user_stats` table. Follows the same auth pattern as `app/api/onboarding/route.ts`.

- [ ] **Step 1: Create the route handler**

Create `app/api/profile/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

const VALID_WEEKLY_GOALS = [2, 3, 5, 7] as const;

interface ProfileUpdate {
  displayName?: string | null;
  weeklyGoal?: number | null;
}

function isValidUpdate(body: unknown): body is ProfileUpdate {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;

  if ("displayName" in b && b.displayName !== null && typeof b.displayName !== "string") {
    return false;
  }
  if (typeof b.displayName === "string" && b.displayName.length > 50) {
    return false;
  }

  if ("weeklyGoal" in b && b.weeklyGoal !== null) {
    if (!VALID_WEEKLY_GOALS.includes(b.weeklyGoal as (typeof VALID_WEEKLY_GOALS)[number])) {
      return false;
    }
  }

  return "displayName" in b || "weeklyGoal" in b;
}

export async function PATCH(request: NextRequest) {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.session.user.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isValidUpdate(body)) {
    return NextResponse.json({ error: "Invalid profile update" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if ("displayName" in body) updates.display_name = body.displayName?.trim() || null;
  if ("weeklyGoal" in body) updates.weekly_goal = body.weeklyGoal;

  const { error } = await supabase
    .from("user_stats")
    .update(updates)
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Verify the file compiles**

```bash
npx tsc --noEmit app/api/profile/route.ts 2>&1 || true
```

Check for type errors. If `tsc` flags imports, run `npm run build` to verify within the Next.js context.

- [ ] **Step 3: Commit**

```bash
git add app/api/profile/route.ts
git commit -m "feat: add PATCH /api/profile route for display name and weekly goal updates"
```

---

### Task 3: Create DELETE /api/account route

**Files:**
- Create: `app/api/account/route.ts`

Deletes all user data in FK-safe order, then deletes the auth user via service role client.

- [ ] **Step 1: Create the route handler**

Create `app/api/account/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createRouteClient, createServiceClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

export async function DELETE() {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.session.user.id;

  const serviceClient = createServiceClient();

  const tablesToDelete = [
    "messages",
    "conversations",
    "submissions",
    "progress",
    "token_usage",
    "onboarding",
    "user_stats",
  ] as const;

  for (const table of tablesToDelete) {
    const col = table === "messages" ? "conversation_id" : "user_id";

    if (table === "messages") {
      const { data: convos } = await serviceClient
        .from("conversations")
        .select("id")
        .eq("user_id", userId);

      if (convos && convos.length > 0) {
        const convoIds = convos.map((c) => c.id);
        const { error } = await serviceClient
          .from("messages")
          .delete()
          .in("conversation_id", convoIds);

        if (error) {
          console.error(`Failed to delete ${table}:`, error);
          return NextResponse.json({ error: "Account deletion failed" }, { status: 500 });
        }
      }
      continue;
    }

    const { error } = await serviceClient.from(table).delete().eq("user_id", userId);

    if (error) {
      console.error(`Failed to delete ${table}:`, error);
      return NextResponse.json({ error: "Account deletion failed" }, { status: 500 });
    }
  }

  const { error: authError } = await serviceClient.auth.admin.deleteUser(userId);

  if (authError) {
    console.error("Failed to delete auth user:", authError);
    return NextResponse.json({ error: "Account deletion failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npm run build 2>&1 | tail -20
```

Check for type errors in the new route.

- [ ] **Step 3: Commit**

```bash
git add app/api/account/route.ts
git commit -m "feat: add DELETE /api/account route for full account deletion"
```

---

### Task 4: Create profile server component (page.tsx)

**Files:**
- Create: `app/(app)/profile/page.tsx`

Server component that fetches user_stats, onboarding, and progress counts, then renders the client component.

- [ ] **Step 1: Create the directory and page**

```bash
mkdir -p app/\(app\)/profile
```

Create `app/(app)/profile/page.tsx`:

```typescript
import { requireServerSession } from "@/lib/auth/require-auth";
import { ProfilePage } from "@/components/profile/ProfilePage";
import { computeWeeklyCompleted } from "@/lib/dashboard/resume";

export const dynamic = "force-dynamic";

export default async function ProfileRoute() {
  const { supabase, session } = await requireServerSession();

  const [statsResult, onboardingResult, progressResult] = await Promise.all([
    supabase.from("user_stats").select("display_name, streak_days, weekly_goal").single(),
    supabase.from("onboarding").select("background, motivation").single(),
    supabase
      .from("progress")
      .select("state, completed_at")
      .or("state.eq.completed,state.eq.skipped"),
  ]);

  const stats = statsResult.data as {
    display_name: string | null;
    streak_days: number;
    weekly_goal: number | null;
  } | null;

  const onboarding = onboardingResult.data as {
    background: string;
    motivation: string;
  } | null;

  const progressRows = (progressResult.data ?? []) as {
    state: string;
    completed_at: string | null;
  }[];

  const totalCompleted = progressRows.length;

  const today = new Date().toISOString().slice(0, 10);
  const weeklyRecords = progressRows
    .filter((r) => r.completed_at)
    .map((r) => ({ completedAt: r.completed_at! }));
  const lessonsCompletedThisWeek = computeWeeklyCompleted(weeklyRecords, today);

  const email = session.user.email ?? "";
  const userInitial = (email[0] ?? "?").toUpperCase();

  return (
    <ProfilePage
      email={email}
      userInitial={userInitial}
      displayName={stats?.display_name ?? null}
      streakDays={stats?.streak_days ?? 0}
      weeklyGoal={stats?.weekly_goal ?? null}
      totalCompleted={totalCompleted}
      totalLessons={345}
      lessonsCompletedThisWeek={lessonsCompletedThisWeek}
      background={onboarding?.background ?? null}
      motivation={onboarding?.motivation ?? null}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(app\)/profile/page.tsx
git commit -m "feat: add profile page server component with data fetching"
```

---

### Task 5: Create ProfilePage client component

**Files:**
- Create: `components/profile/ProfilePage.tsx`

Client component with all four card sections: Identity, Learning Preferences, Stats, Account.

- [ ] **Step 1: Create the component**

```bash
mkdir -p components/profile
```

Create `components/profile/ProfilePage.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify it compiles**

```bash
npm run build 2>&1 | tail -20
```

Check for import or type errors. AlertDialog exports depend on what shadcn generates — adjust import names if they differ (check `components/ui/alert-dialog.tsx` exports).

- [ ] **Step 3: Commit**

```bash
git add components/profile/ProfilePage.tsx
git commit -m "feat: add ProfilePage client component with all four sections"
```

---

### Task 6: Add "Profile" link to TopBar avatar dropdown

**Files:**
- Modify: `components/layout/TopBar.tsx:86-98`

Add a "Profile" link between the email display and the "Sign out" button in the existing hand-rolled dropdown.

- [ ] **Step 1: Add the Profile link**

In `components/layout/TopBar.tsx`, find this block (lines 86-98):

```tsx
{menuOpen && (
  <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-border bg-surface py-2 shadow-lg">
    <p className="truncate px-3 py-1.5 text-xs text-muted">{userEmail}</p>
    <hr className="my-1 border-border" />
    <button
      type="button"
      onClick={handleSignOut}
      className="w-full px-3 py-1.5 text-left text-xs text-secondary transition-colors hover:bg-hover hover:text-primary"
    >
      Sign out
    </button>
  </div>
)}
```

Replace with:

```tsx
{menuOpen && (
  <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-border bg-surface py-2 shadow-lg">
    <p className="truncate px-3 py-1.5 text-xs text-muted">{userEmail}</p>
    <hr className="my-1 border-border" />
    <Link
      href="/profile"
      onClick={() => setMenuOpen(false)}
      className="block w-full px-3 py-1.5 text-left text-xs text-secondary transition-colors hover:bg-hover hover:text-primary"
    >
      Profile
    </Link>
    <button
      type="button"
      onClick={handleSignOut}
      className="w-full px-3 py-1.5 text-left text-xs text-secondary transition-colors hover:bg-hover hover:text-primary"
    >
      Sign out
    </button>
  </div>
)}
```

Note: `Link` is already imported at the top of TopBar.tsx (`import Link from "next/link"`).

- [ ] **Step 2: Verify it compiles**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add components/layout/TopBar.tsx
git commit -m "feat: add Profile link to TopBar avatar dropdown"
```

---

### Task 7: Manual testing and final commit

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test the golden path**

1. Navigate to the dashboard
2. Click the avatar in the TopBar — verify "Profile" link appears between email and "Sign out"
3. Click "Profile" — verify `/profile` page loads with all four cards
4. Verify the breadcrumb shows "Dashboard > Profile" and the Dashboard link works
5. Edit the display name — verify "Save name" button appears only when changed
6. Click "Save name" — verify toast appears and name persists after page refresh
7. Change weekly goal via the Select dropdown — verify "Save goal" button appears
8. Click "Save goal" — verify toast and persistence
9. Verify background and motivation badges display correctly (read-only)
10. Verify stats card shows streak, total completed, and weekly progress
11. Click "Change password" — verify it navigates to `/update-password`
12. Click "Delete account" — verify AlertDialog opens with confirmation
13. Click "Cancel" in the dialog — verify it closes without action

- [ ] **Step 3: Test edge cases**

1. Clear the display name and save — verify it saves as null gracefully
2. Verify the page works when onboarding data is missing (badges show "Not set")
3. Verify the page works when user_stats row is missing (defaults to 0/null)
4. Check mobile layout — verify cards stack properly, stats go vertical

- [ ] **Step 4: Lint check**

```bash
npm run lint
npx prettier --check app/\(app\)/profile/ components/profile/ app/api/profile/ app/api/account/ components/layout/TopBar.tsx
```

Fix any issues. Then format:

```bash
npx prettier --write app/\(app\)/profile/ components/profile/ app/api/profile/ app/api/account/ components/layout/TopBar.tsx
```

- [ ] **Step 5: Final commit if any formatting changes**

```bash
git add -A
git commit -m "style: format profile page files"
```
