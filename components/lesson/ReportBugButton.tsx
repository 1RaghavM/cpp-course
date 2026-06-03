"use client";

import { useCallback, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Bug } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";

const bugReportSchema = z.object({
  category: z.enum(["ui", "code_execution", "lesson_content", "tutor", "other"]),
  description: z.string().min(10, "Please describe the issue in at least 10 characters.").max(2000),
});

type BugReportValues = z.infer<typeof bugReportSchema>;

const CATEGORIES = [
  { value: "ui", label: "UI / Layout" },
  { value: "code_execution", label: "Code Execution" },
  { value: "lesson_content", label: "Lesson Content" },
  { value: "tutor", label: "Tutor" },
  { value: "other", label: "Other" },
] as const;

interface ReportBugButtonProps {
  lessonId: string;
}

export function ReportBugButton({ lessonId }: ReportBugButtonProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<BugReportValues>({
    resolver: zodResolver(bugReportSchema),
    defaultValues: {
      category: "ui",
      description: "",
    },
  });

  const onSubmit = useCallback(
    async (data: BugReportValues) => {
      setSubmitting(true);
      try {
        const res = await fetch("/api/bug-reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, lesson_id: lessonId }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? "Failed to submit report");
        }

        toast.success("Bug report submitted. Thanks for helping us improve!");
        form.reset();
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setSubmitting(false);
      }
    },
    [lessonId, form],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="inline-flex items-center justify-center rounded-md px-3 h-8 text-sm text-muted-foreground hover:bg-hover hover:text-primary transition-colors"
        title="Report a bug"
      >
        <Bug className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end" sideOffset={8}>
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Report a Bug</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Found something broken? Let us know.
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup className="gap-3">
              <Controller
                name="category"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel className="text-xs text-muted-foreground">Category</FieldLabel>
                    <select
                      value={field.value}
                      onChange={field.onChange}
                      className="h-8 w-full rounded-md border border-border bg-elevated px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="description"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel className="text-xs text-muted-foreground">Description</FieldLabel>
                    <textarea
                      {...field}
                      placeholder="Describe what happened and what you expected..."
                      rows={4}
                      className="w-full rounded-md border border-border bg-elevated px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="w-full"
              >
                {submitting ? "Submitting..." : "Submit Report"}
              </Button>
            </FieldGroup>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  );
}

