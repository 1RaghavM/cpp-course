"use client"

import * as React from "react"
import Link from "next/link"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
} from "@tanstack/react-table"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CircleCheckIcon,
  EllipsisVerticalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react"

export const exerciseSchema = z.object({
  id: z.number(),
  exerciseId: z.string(),
  lessonId: z.string(),
  header: z.string(),
  difficulty: z.string(),
  status: z.string(),
})

type ExerciseRow = z.infer<typeof exerciseSchema>

export interface ExerciseModuleGroup {
  module: string
  exercises: ExerciseRow[]
}

function ActionsCell({
  row,
  table,
}: {
  row: Row<ExerciseRow>
  table: ReturnType<typeof useReactTable<ExerciseRow>>
}) {
  const isDone = row.original.status === "Done"

  async function toggleComplete() {
    const newState = isDone ? "in_progress" : "completed"
    const res = await fetch(`/api/progress/${row.original.lessonId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: newState }),
    })
    if (!res.ok) return

    const newStatus = isDone ? "Not Completed" : "Done"
    const meta = table.options.meta as {
      updateRowStatus?: (id: number, status: string) => void
    } | undefined
    meta?.updateRowStatus?.(row.original.id, newStatus)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          />
        }
      >
        <EllipsisVerticalIcon className="size-4" />
        <span className="sr-only">Open menu</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={toggleComplete}>
          {isDone ? "Mark as incomplete" : "Mark as complete"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const columns: ColumnDef<ExerciseRow>[] = [
  {
    accessorKey: "header",
    header: "Exercise",
    cell: ({ row }) => (
      <Link
        href={`/exercises/${row.original.exerciseId}`}
        className="text-foreground hover:underline"
      >
        {row.original.header}
      </Link>
    ),
  },
  {
    accessorKey: "difficulty",
    header: "Difficulty",
    cell: ({ row }) => {
      const difficulty = row.original.difficulty
      if (difficulty === "challenge") {
        return (
          <Badge
            variant="secondary"
            className="bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
          >
            Challenge
          </Badge>
        )
      }
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Practice
        </Badge>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      if (status === "Done") {
        return (
          <Badge
            variant="secondary"
            className="bg-green-500/15 text-green-600 dark:bg-green-500/20 dark:text-green-400"
          >
            <CircleCheckIcon className="size-3" />
            Done
          </Badge>
        )
      }
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Not Completed
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => <ActionsCell row={row} table={table} />,
  },
]

function ModuleTable({ group }: { group: ExerciseModuleGroup }) {
  const [data, setData] = React.useState(() => group.exercises)

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id.toString(),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
    meta: {
      updateRowStatus(id: number, status: string) {
        setData((prev) =>
          prev.map((row) => (row.id === id ? { ...row, status } : row))
        )
      },
    },
  })

  const completedCount = data.filter((d) => d.status === "Done").length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-foreground">{group.module}</h2>
          <span className="text-sm text-muted-foreground">
            {completedCount}/{data.length} completed
          </span>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-16 text-center">
                  No exercises.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">First page</span>
            <ChevronsLeftIcon />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Previous page</span>
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Next page</span>
            <ChevronRightIcon />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Last page</span>
            <ChevronsRightIcon />
          </Button>
        </div>
      )}
    </div>
  )
}

export function ExercisesDataTable({ groups }: { groups: ExerciseModuleGroup[] }) {
  if (groups.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center text-muted-foreground">
        Complete some lessons to unlock exercises.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <ModuleTable key={group.module} group={group} />
      ))}
    </div>
  )
}
