"use client"

import Link from "next/link"
import { ArrowRightIcon, BookOpenIcon, CheckCircle2Icon, RocketIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress"

interface ResumeHeroCardProps {
  resumeLesson: { title: string; slug: string }
  moduleName: string
  lessonPosition: number
  moduleLessonCount: number
  moduleCompletedCount: number
  variant: "start" | "resume" | "complete"
}

const VARIANT_CONFIG = {
  start: {
    icon: RocketIcon,
    headline: "Start your C++ journey",
    buttonLabel: "Start Learning",
  },
  resume: {
    icon: BookOpenIcon,
    headline: "Pick up where you left off",
    buttonLabel: "Continue",
  },
  complete: {
    icon: CheckCircle2Icon,
    headline: "Curriculum complete!",
    buttonLabel: "Review",
  },
} as const

export function ResumeHeroCard({
  resumeLesson,
  moduleName,
  lessonPosition,
  moduleLessonCount,
  moduleCompletedCount,
  variant,
}: ResumeHeroCardProps) {
  const config = VARIANT_CONFIG[variant]
  const Icon = config.icon
  const modulePercent =
    moduleLessonCount > 0
      ? Math.round((moduleCompletedCount / moduleLessonCount) * 100)
      : 0

  return (
    <Card className="bg-linear-to-r from-primary/5 to-card shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="size-5 text-primary" />
          <CardTitle className="text-lg font-semibold">
            {config.headline}
          </CardTitle>
        </div>
        <CardDescription className="text-base">
          {variant === "start" && (
            <>
              Begin with <span className="font-medium text-foreground">{resumeLesson.title}</span> in {moduleName}
            </>
          )}
          {variant === "resume" && (
            <span className="font-medium text-foreground">{resumeLesson.title}</span>
          )}
          {variant === "complete" && (
            <>You&apos;ve completed the entire C++ curriculum. Revisit any lesson to reinforce your knowledge.</>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {variant === "resume" && (
          <>
            <div className="flex items-center gap-2">
              <Badge variant="outline" noAnimate>
                {moduleName} &middot; Lesson {lessonPosition} of {moduleLessonCount}
              </Badge>
            </div>
            <Progress value={modulePercent}>
              <ProgressLabel>Module progress</ProgressLabel>
              <ProgressValue>{() => `${modulePercent}%`}</ProgressValue>
            </Progress>
          </>
        )}
        <div>
          <Button render={<Link href={`/lessons/${resumeLesson.slug}`} />} size="lg">
            {config.buttonLabel}
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
