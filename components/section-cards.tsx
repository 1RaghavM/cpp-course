"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrendingUpIcon, FlameIcon, BookOpenIcon, ClockIcon } from "lucide-react"

interface SectionCardsProps {
  totalLessons: number
  totalCompleted: number
  inProgressCount: number
  streakDays: number
  lessonsCompletedThisWeek: number
  weeklyGoal: number | null
}

export function SectionCards({
  totalLessons,
  totalCompleted,
  inProgressCount,
  streakDays,
  lessonsCompletedThisWeek,
  weeklyGoal,
}: SectionCardsProps) {
  const completionPercent =
    totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0

  const weeklyTarget = weeklyGoal ?? 5
  const weeklyRemaining = Math.max(0, weeklyTarget - lessonsCompletedThisWeek)

  const estimatedMinutes = totalCompleted * 15
  const remainingLessons = totalLessons - totalCompleted - inProgressCount

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Weekly Progress</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {lessonsCompletedThisWeek} / {weeklyTarget}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon />
              {lessonsCompletedThisWeek >= weeklyTarget ? "Goal met" : `${weeklyRemaining} to go`}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {lessonsCompletedThisWeek >= weeklyTarget
              ? "Weekly goal reached!"
              : `${weeklyRemaining} more to hit your goal`}
            <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Weekly goal: {weeklyTarget} lessons
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Day Streak</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {streakDays}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <FlameIcon />
              {streakDays > 0 ? "Active" : "Start today"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {streakDays > 0 ? "Keep it going!" : "Complete a lesson to start"}
            <FlameIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Consecutive days of learning
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Lessons Completed</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalCompleted}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <BookOpenIcon />
              {completionPercent}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {inProgressCount > 0
              ? `${inProgressCount} in progress, ${remainingLessons} not started`
              : `${totalCompleted} of ${totalLessons} total lessons`}
            <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Across the full C++ curriculum
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Time Invested</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {estimatedMinutes >= 60
              ? `${(estimatedMinutes / 60).toFixed(1)}h`
              : `${estimatedMinutes} min`}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <ClockIcon />
              {totalCompleted} lessons
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            ~{Math.round((totalLessons * 15) / 60)}h estimated for full curriculum
            <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">Based on ~15 min per lesson</div>
        </CardFooter>
      </Card>
    </div>
  )
}
