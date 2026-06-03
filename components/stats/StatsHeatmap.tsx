"use client"

import { useCallback, useMemo, useRef, useState, useEffect } from "react"
import Heatmap, { type HeatmapData } from "@/components/8starlabs-ui/heatmap"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatsHeatmapProps {
  activityData: Record<string, number>
}

const WEEKS_IN_YEAR = 53
const DAY_LABEL_WIDTH = 36
const MIN_CELL = 10
const GAP = 3

export function StatsHeatmap({ activityData }: StatsHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [cellSize, setCellSize] = useState(0)

  const measure = useCallback(() => {
    if (!containerRef.current) return
    const width = containerRef.current.clientWidth
    const available = width - DAY_LABEL_WIDTH
    const size = Math.floor((available - GAP * (WEEKS_IN_YEAR - 1)) / WEEKS_IN_YEAR)
    setCellSize(Math.max(size, MIN_CELL))
  }, [])

  useEffect(() => {
    measure()
    const observer = new ResizeObserver(measure)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [measure])

  const { data, startDate, endDate, totalActions } = useMemo(() => {
    const year = new Date().getFullYear()
    const start = new Date(year, 0, 1)
    const end = new Date(year, 11, 31)

    const heatmapData: HeatmapData = []
    let total = 0

    const cursor = new Date(start)
    while (cursor <= end) {
      const dateStr = cursor.toISOString().slice(0, 10)
      const value = activityData[dateStr] ?? 0
      heatmapData.push({ date: dateStr, value })
      total += value
      cursor.setDate(cursor.getDate() + 1)
    }

    return {
      data: heatmapData,
      startDate: start,
      endDate: end,
      totalActions: total,
    }
  }, [activityData])

  return (
    <Card className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 motion-safe:fill-mode-both">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Activity</CardTitle>
        <p className="text-sm text-muted-foreground">
          {totalActions} actions tracked across {new Date().getFullYear()}. Each cell represents a day of learning activity.
        </p>
      </CardHeader>
      <CardContent>
        <div
          ref={containerRef}
          className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 motion-safe:fill-mode-both"
          style={{ animationDelay: "120ms" } as React.CSSProperties}
        >
          {cellSize > 0 && (
            <Heatmap
            data={data}
            startDate={startDate}
            endDate={endDate}
            colorMode="interpolate"
            interpolation="sqrt"
            cellSize={cellSize}
            gap={GAP}
            daysOfTheWeek="MWF"
            displayStyle="squares"
            valueDisplayFunction={(value) =>
              value > 0
                ? `${value} ${value === 1 ? "action" : "actions"}`
                : "No activity"
            }
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
