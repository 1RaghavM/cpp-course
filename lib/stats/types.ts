export interface ChapterProgressEntry {
  chapterId: number;
  chapterTitle: string;
  completed: number;
  total: number;
}

export interface WeeklySubmissionEntry {
  week: string;
  passed: number;
  failed: number;
}

export interface StatsResponse {
  totalLessons: number;
  lessonsCompleted: number;
  lessonsInProgress: number;
  lessonsSkipped: number;
  streakDays: number;
  weeklyGoal: number | null;
  lessonsCompletedThisWeek: number;
  chapterProgress: ChapterProgressEntry[];
  activityData: Record<string, number>;

  totalSubmissions: number;
  totalRuns: number;
  passedSubmissions: number;
  failedSubmissions: number;
  compileErrors: number;
  successRate: number;
  weeklySubmissions: WeeklySubmissionEntry[];

  tutorConversations: number;
  tutorMessages: number;
  notesWritten: number;
  totalTimeMinutes: number;
}
