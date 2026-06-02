/**
 * TypeScript types for the cpproad database schema.
 * Manually written to match infra/supabase/migrations/001_schema.sql exactly.
 *
 * Regenerate with: npx supabase gen types typescript --local > lib/supabase/types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      chapters: {
        Row: {
          id: number;
          number: string;
          learncpp_title: string;
          my_title: string | null;
          sort_order: number;
        };
        Insert: {
          id: number;
          number: string;
          learncpp_title: string;
          my_title?: string | null;
          sort_order: number;
        };
        Update: {
          id?: number;
          number?: string;
          learncpp_title?: string;
          my_title?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      lessons: {
        Row: {
          id: string;
          chapter_id: number;
          number: string;
          slug: string;
          learncpp_title: string;
          learncpp_url: string;
          my_title: string | null;
          summary_md: string | null;
          summary_generated_at: string | null;
          summary_model: string | null;
          tags: string[];
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          chapter_id: number;
          number: string;
          slug: string;
          learncpp_title: string;
          learncpp_url: string;
          my_title?: string | null;
          summary_md?: string | null;
          summary_generated_at?: string | null;
          summary_model?: string | null;
          tags?: string[];
          sort_order: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          chapter_id?: number;
          number?: string;
          slug?: string;
          learncpp_title?: string;
          learncpp_url?: string;
          my_title?: string | null;
          summary_md?: string | null;
          summary_generated_at?: string | null;
          summary_model?: string | null;
          tags?: string[];
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      exercises: {
        Row: {
          id: string;
          lesson_id: string;
          title: string;
          prompt_md: string;
          starter_code: string;
          solution_code: string | null;
          difficulty: string;
          sort_order: number;
          generated_at: string;
          generated_model: string | null;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          title: string;
          prompt_md: string;
          starter_code: string;
          solution_code?: string | null;
          difficulty?: string;
          sort_order: number;
          generated_at?: string;
          generated_model?: string | null;
        };
        Update: {
          id?: string;
          lesson_id?: string;
          title?: string;
          prompt_md?: string;
          starter_code?: string;
          solution_code?: string | null;
          difficulty?: string;
          sort_order?: number;
          generated_at?: string;
          generated_model?: string | null;
        };
        Relationships: [];
      };
      test_cases: {
        Row: {
          id: string;
          exercise_id: string;
          label: string;
          is_sample: boolean;
          stdin: string;
          expected_stdout: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          exercise_id: string;
          label: string;
          is_sample?: boolean;
          stdin?: string;
          expected_stdout: string;
          sort_order: number;
        };
        Update: {
          id?: string;
          exercise_id?: string;
          label?: string;
          is_sample?: boolean;
          stdin?: string;
          expected_stdout?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      submissions: {
        Row: {
          id: string;
          user_id: string;
          exercise_id: string;
          mode: string;
          language_std: string;
          source_code: string;
          status: string;
          stdout: string | null;
          stderr: string | null;
          compile_output: string | null;
          exit_code: number | null;
          wall_time_ms: number | null;
          test_results: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          exercise_id: string;
          mode: string;
          language_std?: string;
          source_code: string;
          status: string;
          stdout?: string | null;
          stderr?: string | null;
          compile_output?: string | null;
          exit_code?: number | null;
          wall_time_ms?: number | null;
          test_results?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          exercise_id?: string;
          mode?: string;
          language_std?: string;
          source_code?: string;
          status?: string;
          stdout?: string | null;
          stderr?: string | null;
          compile_output?: string | null;
          exit_code?: number | null;
          wall_time_ms?: number | null;
          test_results?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      progress: {
        Row: {
          user_id: string;
          lesson_id: string;
          state: string;
          first_visit_at: string | null;
          completed_at: string | null;
          last_visit_at: string;
          last_code_snippet: string | null;
        };
        Insert: {
          user_id: string;
          lesson_id: string;
          state?: string;
          first_visit_at?: string | null;
          completed_at?: string | null;
          last_visit_at?: string;
          last_code_snippet?: string | null;
        };
        Update: {
          user_id?: string;
          lesson_id?: string;
          state?: string;
          first_visit_at?: string | null;
          completed_at?: string | null;
          last_visit_at?: string;
          last_code_snippet?: string | null;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string | null;
          title: string | null;
          created_at: string;
          updated_at: string;
          status: string;
          context: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id?: string | null;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
          status?: string;
          context?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          lesson_id?: string | null;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
          status?: string;
          context?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: string;
          content: string;
          hint_tier: number | null;
          tokens_in: number | null;
          tokens_out: number | null;
          cached_tokens_in: number | null;
          model: string | null;
          feedback: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: string;
          content: string;
          hint_tier?: number | null;
          tokens_in?: number | null;
          tokens_out?: number | null;
          cached_tokens_in?: number | null;
          model?: string | null;
          feedback?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: string;
          content?: string;
          hint_tier?: number | null;
          tokens_in?: number | null;
          tokens_out?: number | null;
          cached_tokens_in?: number | null;
          model?: string | null;
          feedback?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      token_usage: {
        Row: {
          id: number;
          user_id: string | null;
          call_type: string;
          model: string;
          tokens_in: number;
          tokens_out: number;
          cached_in: number;
          cost_usd_micro: number;
          lesson_id: string | null;
          conversation_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id?: string | null;
          call_type: string;
          model: string;
          tokens_in: number;
          tokens_out: number;
          cached_in?: number;
          cost_usd_micro: number;
          lesson_id?: string | null;
          conversation_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string | null;
          call_type?: string;
          model?: string;
          tokens_in?: number;
          tokens_out?: number;
          cached_in?: number;
          cost_usd_micro?: number;
          lesson_id?: string | null;
          conversation_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      onboarding: {
        Row: {
          user_id: string;
          background: string;
          motivation: string;
          start_module: string;
          fast_track: boolean;
          placement_taken: boolean;
          placement_score: number | null;
          weekly_goal: number | null;
          created_at: string | null;
        };
        Insert: {
          user_id: string;
          background: string;
          motivation: string;
          start_module: string;
          fast_track?: boolean;
          placement_taken?: boolean;
          placement_score?: number | null;
          weekly_goal?: number | null;
          created_at?: string | null;
        };
        Update: {
          user_id?: string;
          background?: string;
          motivation?: string;
          start_module?: string;
          fast_track?: boolean;
          placement_taken?: boolean;
          placement_score?: number | null;
          weekly_goal?: number | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      user_stats: {
        Row: {
          user_id: string;
          streak_days: number;
          last_active_date: string | null;
          weekly_goal: number | null;
          display_name: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          streak_days?: number;
          last_active_date?: string | null;
          weekly_goal?: number | null;
          display_name?: string | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          streak_days?: number;
          last_active_date?: string | null;
          weekly_goal?: number | null;
          display_name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      notes: {
        Row: {
          user_id: string;
          lesson_id: string;
          content: string;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          lesson_id: string;
          content?: string;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          lesson_id?: string;
          content?: string;
          updated_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      playground_state: {
        Row: {
          user_id: string;
          source_code: string;
          stdin: string;
          language_std: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          source_code: string;
          stdin?: string;
          language_std?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          source_code?: string;
          stdin?: string;
          language_std?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// ---------------------------------------------------------------------------
// Convenience aliases (Row types)
// ---------------------------------------------------------------------------

export type Chapter = Database["public"]["Tables"]["chapters"]["Row"];
export type Lesson = Database["public"]["Tables"]["lessons"]["Row"];
export type Exercise = Database["public"]["Tables"]["exercises"]["Row"];
export type TestCase = Database["public"]["Tables"]["test_cases"]["Row"];
export type Submission = Database["public"]["Tables"]["submissions"]["Row"];
export type Progress = Database["public"]["Tables"]["progress"]["Row"];
export type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type TokenUsage = Database["public"]["Tables"]["token_usage"]["Row"];
export type Onboarding = Database["public"]["Tables"]["onboarding"]["Row"];
export type UserStats = Database["public"]["Tables"]["user_stats"]["Row"];
export type Note = Database["public"]["Tables"]["notes"]["Row"];
export type PlaygroundState = Database["public"]["Tables"]["playground_state"]["Row"];

// ---------------------------------------------------------------------------
// Typed Supabase client alias — properly typed with the Database schema.
// ---------------------------------------------------------------------------

export type AppSupabaseClient = import("@supabase/supabase-js").SupabaseClient<Database>;
