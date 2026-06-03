"use client"

import { useMemo } from "react"
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { STAGES } from "@/lib/dashboard/curriculum"
import type { Module, Stage } from "@/lib/dashboard/types"

interface CurriculumProgressCardProps {
  curriculum: Module[]
  progressMap: Record<string, string>
  totalCompleted: number
  totalLessons: number
}

interface ModuleStats {
  module: Module
  completed: number
  total: number
}

interface StageStats {
  id: Stage
  title: string
  completed: number
  total: number
  status: "active" | "completed" | "locked"
  modules: ModuleStats[]
}

const chartConfig = {
  completed: {
    label: "Completed",
    color: "var(--primary)",
  },
} satisfies ChartConfig

function computeStageStats(
  curriculum: Module[],
  progressMap: Record<string, string>,
): StageStats[] {
  let foundActive = false

  return STAGES.map((stage) => {
    const stageModules = curriculum.filter((m) => m.stage === stage.id)
    const modules: ModuleStats[] = stageModules.map((mod) => {
      const completed = mod.lessons.filter((l) => {
        const s = progressMap[l.id]
        return s === "completed" || s === "skipped"
      }).length
      return { module: mod, completed, total: mod.lessons.length }
    })

    const completed = modules.reduce((sum, m) => sum + m.completed, 0)
    const total = modules.reduce((sum, m) => sum + m.total, 0)

    let status: StageStats["status"]
    if (completed === total && total > 0) {
      status = "completed"
    } else if (!foundActive && completed < total) {
      status = "active"
      foundActive = true
    } else {
      status = "locked"
    }

    return { id: stage.id, title: stage.title, completed, total, status, modules }
  })
}

export function CurriculumProgressCard({
  curriculum,
  progressMap,
  totalCompleted,
  totalLessons,
}: CurriculumProgressCardProps) {
  const stageStats = useMemo(
    () => computeStageStats(curriculum, progressMap),
    [curriculum, progressMap],
  )

  const activeStageId = stageStats.find((s) => s.status === "active")?.id
  const completionPercent =
    totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0
  const endAngle = totalLessons > 0 ? (totalCompleted / totalLessons) * 360 : 0

  const chartData = [
    { name: "completed", value: totalCompleted, fill: "var(--color-completed)" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Curriculum Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-[1fr_auto]">
          {/* Left: Stage Accordion */}
          <Accordion
            multiple
            defaultValue={activeStageId ? [activeStageId] : []}
          >
            {stageStats.map((stage) => (
              <AccordionItem key={stage.id} value={stage.id}>
                <AccordionTrigger className="gap-3">
                  <div className="flex flex-1 items-center justify-between pr-2">
                    <span>{stage.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {stage.completed} / {stage.total}
                      </span>
                      <Badge
                        variant={
                          stage.status === "completed"
                            ? "outline"
                            : stage.status === "active"
                              ? "default"
                              : "secondary"
                        }
                        noAnimate
                      >
                        {stage.status === "completed"
                          ? "Completed"
                          : stage.status === "active"
                            ? "Active"
                            : "Locked"}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-3 pb-2">
                    {stage.modules.map((ms) => {
                      const pct =
                        ms.total > 0
                          ? Math.round((ms.completed / ms.total) * 100)
                          : 0
                      return (
                        <Progress key={ms.module.id} value={pct}>
                          <ProgressLabel>{ms.module.title}</ProgressLabel>
                          <ProgressValue>
                            {() => `${ms.completed} / ${ms.total}`}
                          </ProgressValue>
                        </Progress>
                      )
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Right: Radial Donut */}
          <div className="flex flex-col items-center justify-center gap-2">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[200px]"
            >
              <RadialBarChart
                data={chartData}
                startAngle={0}
                endAngle={endAngle}
                innerRadius={70}
                outerRadius={85}
              >
                <PolarGrid
                  gridType="circle"
                  radialLines={false}
                  stroke="none"
                  className="first:fill-muted last:fill-background"
                  polarRadius={[85, 70]}
                />
                <RadialBar dataKey="value" background cornerRadius={10} />
                <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-4xl font-bold"
                            >
                              {completionPercent}%
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground"
                            >
                              completed
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </PolarRadiusAxis>
              </RadialBarChart>
            </ChartContainer>
            <p className="text-sm text-muted-foreground tabular-nums">
              {totalCompleted} of {totalLessons} lessons
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
