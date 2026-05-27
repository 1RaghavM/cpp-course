-- Indexes for common lesson-page cache lookups (exercises, test cases, conversations).

CREATE INDEX idx_exercises_lesson_id ON exercises(lesson_id);
CREATE INDEX idx_test_cases_exercise_id ON test_cases(exercise_id);
CREATE INDEX idx_conversations_lesson_id ON conversations(lesson_id);
