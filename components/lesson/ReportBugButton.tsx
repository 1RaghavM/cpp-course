"use client";

import { useCallback, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
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
        className="inline-flex items-center justify-center rounded-md px-3 h-8 text-sm text-secondary hover:bg-hover hover:text-primary transition-colors"
        title="Report a bug"
      >
        <BugIcon />
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end" sideOffset={8}>
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-primary">Report a Bug</h3>
            <p className="text-xs text-muted mt-0.5">
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
                    <FieldLabel className="text-xs text-secondary">Category</FieldLabel>
                    <select
                      value={field.value}
                      onChange={field.onChange}
                      className="h-8 w-full rounded-md border border-border bg-elevated px-2 text-xs text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
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
                    <FieldLabel className="text-xs text-secondary">Description</FieldLabel>
                    <textarea
                      {...field}
                      placeholder="Describe what happened and what you expected..."
                      rows={4}
                      className="w-full rounded-md border border-border bg-elevated px-3 py-2 text-xs text-primary placeholder:text-muted resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"
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

function BugIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path
        fillRule="evenodd"
        d="M6.56 1.14a.75.75 0 01.177 1.045 3.989 3.989 0 00-.464.86c.467.34.893.738 1.27 1.18a6.531 6.531 0 014.914 0 5.96 5.96 0 011.271-1.18 3.989 3.989 0 00-.464-.86.75.75 0 011.222-.869c.259.365.458.77.59 1.204.076.248.124.503.143.762a.75.75 0 01-.2.575 5.42 5.42 0 00-1.16 1.088c.346.59.594 1.242.72 1.934h1.073a2.5 2.5 0 011.864.836.75.75 0 11-1.118 1 1 1 0 00-.746-.336h-.727a6.472 6.472 0 01-.083 1.392l.834.482a1 1 0 01.365 1.366.75.75 0 11-1.299-.75l-.32-.554a6.525 6.525 0 01-.753 1.442l.596.596a1 1 0 010 1.414.75.75 0 11-1.06-1.06l-.404-.405a6.494 6.494 0 01-6.88 0l-.404.405a.75.75 0 11-1.06 1.06 1 1 0 010-1.414l.596-.596a6.525 6.525 0 01-.753-1.442l-.32.554a.75.75 0 11-1.3-.75 1 1 0 01.366-1.366l.834-.482a6.472 6.472 0 01-.083-1.392h-.727a1 1 0 00-.746.336.75.75 0 11-1.118-1 2.5 2.5 0 011.864-.836h1.073a6.49 6.49 0 01.72-1.934 5.42 5.42 0 00-1.16-1.088.75.75 0 01-.2-.575c.02-.259.067-.514.143-.762a4.74 4.74 0 01.59-1.204.75.75 0 011.045-.177zM10 5.502a4.99 4.99 0 00-4.5 2.823V10.5a4.5 4.5 0 109 0V8.325A4.99 4.99 0 0010 5.502z"
        clipRule="evenodd"
      />
    </svg>
  );
}
