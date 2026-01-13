-- ============================================
-- APEX TRAINING SUITE - Comprehensive LMS
-- Migration: 20260113000000_training_suite.sql
-- ============================================
-- Features:
-- - Learning Paths (Tracks)
-- - Enhanced Courses & Sections
-- - Quizzes & Exams
-- - Certificates
-- - Resources Library
-- - License Tracking
-- - CE Credits
-- - Gamification (Achievements, Streaks)
-- ============================================

-- ============================================
-- NEW ENUMS
-- ============================================

CREATE TYPE track_type AS ENUM (
  'new_agent',
  'licensing',
  'product',
  'sales',
  'leadership',
  'compliance'
);

CREATE TYPE question_type AS ENUM (
  'multiple_choice',
  'true_false',
  'multiple_select',
  'short_answer'
);

CREATE TYPE resource_type AS ENUM (
  'pdf',
  'document',
  'spreadsheet',
  'video',
  'audio',
  'link',
  'image'
);

CREATE TYPE resource_category AS ENUM (
  'forms',
  'scripts',
  'presentations',
  'guides',
  'carrier_materials',
  'compliance',
  'marketing',
  'state_licensing'
);

-- ============================================
-- TRAINING TRACKS (Learning Paths)
-- ============================================

CREATE TABLE training_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  thumbnail TEXT,
  track_type track_type NOT NULL,
  rank_requirement agent_rank,
  estimated_hours DECIMAL(5,1),
  is_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tracks_type ON training_tracks(track_type);
CREATE INDEX idx_tracks_active ON training_tracks(is_active);

-- Link courses to tracks (many-to-many)
CREATE TABLE track_courses (
  track_id UUID NOT NULL REFERENCES training_tracks(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  PRIMARY KEY (track_id, course_id)
);

CREATE INDEX idx_track_courses_track ON track_courses(track_id);
CREATE INDEX idx_track_courses_course ON track_courses(course_id);

-- ============================================
-- ENHANCE EXISTING COURSES TABLE
-- ============================================

ALTER TABLE courses ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_name TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_avatar TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS skill_level TEXT DEFAULT 'beginner';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS prerequisites JSONB DEFAULT '[]';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS learning_objectives JSONB DEFAULT '[]';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add unique constraint on slug after populating existing rows
-- Will need to update existing courses to have slugs first

CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_featured ON courses(is_featured);

-- ============================================
-- COURSE SECTIONS (Modules within courses)
-- ============================================

CREATE TABLE course_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sections_course ON course_sections(course_id);

-- ============================================
-- ENHANCE EXISTING LESSONS TABLE
-- ============================================

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES course_sections(id) ON DELETE SET NULL;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_preview BOOLEAN DEFAULT false;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_lessons_section ON lessons(section_id);

-- ============================================
-- QUIZZES & EXAMS
-- ============================================

CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70,
  time_limit_minutes INTEGER,
  max_attempts INTEGER DEFAULT 3,
  shuffle_questions BOOLEAN DEFAULT true,
  show_correct_answers BOOLEAN DEFAULT true,
  is_certification_exam BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quizzes_lesson ON quizzes(lesson_id);
CREATE INDEX idx_quizzes_course ON quizzes(course_id);

CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_type question_type NOT NULL,
  question_text TEXT NOT NULL,
  explanation TEXT,
  points INTEGER DEFAULT 1,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quiz_questions_quiz ON quiz_questions(quiz_id);

CREATE TABLE quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  "order" INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_quiz_answers_question ON quiz_answers(question_id);

CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  percentage INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  time_taken_seconds INTEGER,
  answers JSONB NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quiz_attempts_agent ON quiz_attempts(agent_id);
CREATE INDEX idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_completed ON quiz_attempts(completed_at);

-- ============================================
-- CERTIFICATES
-- ============================================

CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  track_id UUID REFERENCES training_tracks(id) ON DELETE SET NULL,
  quiz_attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE SET NULL,
  certificate_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  pdf_url TEXT,
  verification_url TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_certificates_agent ON certificates(agent_id);
CREATE INDEX idx_certificates_number ON certificates(certificate_number);
CREATE INDEX idx_certificates_course ON certificates(course_id);
CREATE INDEX idx_certificates_track ON certificates(track_id);

-- ============================================
-- RESOURCES LIBRARY
-- ============================================

CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  resource_type resource_type NOT NULL,
  resource_category resource_category NOT NULL,
  file_url TEXT,
  file_name TEXT,
  file_size_bytes INTEGER,
  external_url TEXT,
  thumbnail TEXT,
  tags JSONB DEFAULT '[]',
  is_downloadable BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  rank_requirement agent_rank,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resources_category ON resources(resource_category);
CREATE INDEX idx_resources_type ON resources(resource_type);
CREATE INDEX idx_resources_active ON resources(is_active);

-- Track resource downloads
CREATE TABLE resource_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resource_downloads_resource ON resource_downloads(resource_id);
CREATE INDEX idx_resource_downloads_agent ON resource_downloads(agent_id);

-- ============================================
-- INSURANCE LICENSING TRACKER
-- ============================================

CREATE TABLE agent_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  state_code CHAR(2) NOT NULL,
  license_type TEXT NOT NULL,
  license_number TEXT,
  issued_date DATE,
  expiration_date DATE,
  ce_credits_required INTEGER,
  ce_credits_completed INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(agent_id, state_code, license_type)
);

CREATE INDEX idx_licenses_agent ON agent_licenses(agent_id);
CREATE INDEX idx_licenses_expiration ON agent_licenses(expiration_date);
CREATE INDEX idx_licenses_status ON agent_licenses(status);

-- ============================================
-- CE CREDIT TRACKING
-- ============================================

CREATE TABLE ce_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  license_id UUID REFERENCES agent_licenses(id) ON DELETE SET NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  credit_hours DECIMAL(4,1) NOT NULL,
  credit_type TEXT NOT NULL,
  provider TEXT,
  completion_date DATE NOT NULL,
  certificate_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ce_credits_agent ON ce_credits(agent_id);
CREATE INDEX idx_ce_credits_license ON ce_credits(license_id);

-- ============================================
-- ENHANCE EXISTING PROGRESS TRACKING
-- ============================================

ALTER TABLE course_progress ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0;
ALTER TABLE course_progress ADD COLUMN IF NOT EXISTS last_position_seconds INTEGER DEFAULT 0;
ALTER TABLE course_progress ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE course_progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- COURSE ENROLLMENTS
-- ============================================

CREATE TABLE course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ,
  progress_percentage INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  certificate_id UUID REFERENCES certificates(id) ON DELETE SET NULL,

  UNIQUE(agent_id, course_id)
);

CREATE INDEX idx_enrollments_agent ON course_enrollments(agent_id);
CREATE INDEX idx_enrollments_course ON course_enrollments(course_id);

-- ============================================
-- TRACK ENROLLMENTS (Learning Paths)
-- ============================================

CREATE TABLE track_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES training_tracks(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  progress_percentage INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  certificate_id UUID REFERENCES certificates(id) ON DELETE SET NULL,

  UNIQUE(agent_id, track_id)
);

CREATE INDEX idx_track_enrollments_agent ON track_enrollments(agent_id);
CREATE INDEX idx_track_enrollments_track ON track_enrollments(track_id);

-- ============================================
-- GAMIFICATION - ACHIEVEMENTS
-- ============================================

CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  points INTEGER DEFAULT 0,
  badge_color TEXT DEFAULT 'blue',
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE agent_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(agent_id, achievement_id)
);

CREATE INDEX idx_agent_achievements_agent ON agent_achievements(agent_id);

-- ============================================
-- GAMIFICATION - LEARNING STREAKS
-- ============================================

CREATE TABLE learning_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  total_points INTEGER DEFAULT 0,
  total_lessons_completed INTEGER DEFAULT 0,
  total_courses_completed INTEGER DEFAULT 0,
  total_time_spent_seconds INTEGER DEFAULT 0,

  UNIQUE(agent_id)
);

CREATE INDEX idx_learning_streaks_agent ON learning_streaks(agent_id);

-- ============================================
-- SEED DEFAULT ACHIEVEMENTS
-- ============================================

INSERT INTO achievements (code, title, description, icon, points, badge_color, category) VALUES
  ('first_lesson', 'First Steps', 'Complete your first lesson', '🎯', 10, 'green', 'learning'),
  ('first_course', 'Course Complete', 'Complete your first course', '📚', 50, 'blue', 'learning'),
  ('streak_3', 'Consistent Learner', 'Learn 3 days in a row', '🔥', 25, 'orange', 'streaks'),
  ('streak_7', 'Week Warrior', 'Learn 7 days in a row', '💪', 75, 'orange', 'streaks'),
  ('streak_30', 'Monthly Master', 'Learn 30 days in a row', '🏆', 300, 'gold', 'streaks'),
  ('quiz_perfect', 'Perfect Score', 'Score 100% on a quiz', '💯', 25, 'purple', 'quizzes'),
  ('quiz_master', 'Quiz Master', 'Pass 10 quizzes', '🧠', 100, 'purple', 'quizzes'),
  ('certified', 'Certified', 'Earn your first certificate', '🎓', 100, 'gold', 'certificates'),
  ('early_bird', 'Early Bird', 'Complete a lesson before 7 AM', '🌅', 15, 'yellow', 'special'),
  ('night_owl', 'Night Owl', 'Complete a lesson after 11 PM', '🦉', 15, 'indigo', 'special'),
  ('speed_learner', 'Speed Learner', 'Complete 5 lessons in one day', '⚡', 50, 'cyan', 'learning'),
  ('track_complete', 'Path Finder', 'Complete a learning path', '🗺️', 200, 'emerald', 'tracks')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- TRIGGER: UPDATE updated_at TIMESTAMPS
-- ============================================

CREATE OR REPLACE FUNCTION update_training_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tracks_updated_at
  BEFORE UPDATE ON training_tracks
  FOR EACH ROW EXECUTE FUNCTION update_training_updated_at();

CREATE TRIGGER trigger_quizzes_updated_at
  BEFORE UPDATE ON quizzes
  FOR EACH ROW EXECUTE FUNCTION update_training_updated_at();

CREATE TRIGGER trigger_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION update_training_updated_at();

CREATE TRIGGER trigger_licenses_updated_at
  BEFORE UPDATE ON agent_licenses
  FOR EACH ROW EXECUTE FUNCTION update_training_updated_at();

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE training_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ce_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_streaks ENABLE ROW LEVEL SECURITY;

-- Training Tracks: Anyone can view active tracks
CREATE POLICY "Anyone can view active tracks"
  ON training_tracks FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage tracks"
  ON training_tracks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM agents a
      WHERE a.user_id = auth.uid()
      AND a.rank IN ('regional_mga', 'national_mga', 'executive_mga', 'premier_mga')
    )
  );

-- Track Courses: Anyone can view
CREATE POLICY "Anyone can view track courses"
  ON track_courses FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage track courses"
  ON track_courses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM agents a
      WHERE a.user_id = auth.uid()
      AND a.rank IN ('regional_mga', 'national_mga', 'executive_mga', 'premier_mga')
    )
  );

-- Course Sections: Anyone can view
CREATE POLICY "Anyone can view course sections"
  ON course_sections FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage course sections"
  ON course_sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM agents a
      WHERE a.user_id = auth.uid()
      AND a.rank IN ('regional_mga', 'national_mga', 'executive_mga', 'premier_mga')
    )
  );

-- Quizzes: Anyone can view active quizzes
CREATE POLICY "Anyone can view active quizzes"
  ON quizzes FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage quizzes"
  ON quizzes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM agents a
      WHERE a.user_id = auth.uid()
      AND a.rank IN ('regional_mga', 'national_mga', 'executive_mga', 'premier_mga')
    )
  );

-- Quiz Questions: Anyone can view
CREATE POLICY "Anyone can view quiz questions"
  ON quiz_questions FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage quiz questions"
  ON quiz_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM agents a
      WHERE a.user_id = auth.uid()
      AND a.rank IN ('regional_mga', 'national_mga', 'executive_mga', 'premier_mga')
    )
  );

-- Quiz Answers: Anyone can view
CREATE POLICY "Anyone can view quiz answers"
  ON quiz_answers FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage quiz answers"
  ON quiz_answers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM agents a
      WHERE a.user_id = auth.uid()
      AND a.rank IN ('regional_mga', 'national_mga', 'executive_mga', 'premier_mga')
    )
  );

-- Quiz Attempts: Agents can view/create their own
CREATE POLICY "Agents can view own quiz attempts"
  ON quiz_attempts FOR SELECT
  USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

CREATE POLICY "Agents can create quiz attempts"
  ON quiz_attempts FOR INSERT
  WITH CHECK (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all quiz attempts"
  ON quiz_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agents a
      WHERE a.user_id = auth.uid()
      AND a.rank IN ('regional_mga', 'national_mga', 'executive_mga', 'premier_mga')
    )
  );

-- Certificates: Agents can view their own, admins can view all
CREATE POLICY "Agents can view own certificates"
  ON certificates FOR SELECT
  USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage certificates"
  ON certificates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM agents a
      WHERE a.user_id = auth.uid()
      AND a.rank IN ('regional_mga', 'national_mga', 'executive_mga', 'premier_mga')
    )
  );

-- Resources: Anyone can view active resources
CREATE POLICY "Anyone can view active resources"
  ON resources FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage resources"
  ON resources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM agents a
      WHERE a.user_id = auth.uid()
      AND a.rank IN ('regional_mga', 'national_mga', 'executive_mga', 'premier_mga')
    )
  );

-- Resource Downloads: Agents can manage their own
CREATE POLICY "Agents can manage own resource downloads"
  ON resource_downloads FOR ALL
  USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

-- Agent Licenses: Agents can manage their own
CREATE POLICY "Agents can manage own licenses"
  ON agent_licenses FOR ALL
  USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all licenses"
  ON agent_licenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agents a
      WHERE a.user_id = auth.uid()
      AND a.rank IN ('regional_mga', 'national_mga', 'executive_mga', 'premier_mga')
    )
  );

-- CE Credits: Agents can manage their own
CREATE POLICY "Agents can manage own ce credits"
  ON ce_credits FOR ALL
  USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all ce credits"
  ON ce_credits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agents a
      WHERE a.user_id = auth.uid()
      AND a.rank IN ('regional_mga', 'national_mga', 'executive_mga', 'premier_mga')
    )
  );

-- Course Enrollments: Agents can manage their own
CREATE POLICY "Agents can manage own course enrollments"
  ON course_enrollments FOR ALL
  USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all course enrollments"
  ON course_enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agents a
      WHERE a.user_id = auth.uid()
      AND a.rank IN ('regional_mga', 'national_mga', 'executive_mga', 'premier_mga')
    )
  );

-- Track Enrollments: Agents can manage their own
CREATE POLICY "Agents can manage own track enrollments"
  ON track_enrollments FOR ALL
  USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all track enrollments"
  ON track_enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agents a
      WHERE a.user_id = auth.uid()
      AND a.rank IN ('regional_mga', 'national_mga', 'executive_mga', 'premier_mga')
    )
  );

-- Achievements: Anyone can view
CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage achievements"
  ON achievements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM agents a
      WHERE a.user_id = auth.uid()
      AND a.rank IN ('regional_mga', 'national_mga', 'executive_mga', 'premier_mga')
    )
  );

-- Agent Achievements: Agents can view their own
CREATE POLICY "Agents can view own achievements"
  ON agent_achievements FOR SELECT
  USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

CREATE POLICY "System can insert agent achievements"
  ON agent_achievements FOR INSERT
  WITH CHECK (true);

-- Learning Streaks: Agents can manage their own
CREATE POLICY "Agents can manage own streaks"
  ON learning_streaks FOR ALL
  USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all streaks"
  ON learning_streaks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agents a
      WHERE a.user_id = auth.uid()
      AND a.rank IN ('regional_mga', 'national_mga', 'executive_mga', 'premier_mga')
    )
  );

-- ============================================
-- HELPER FUNCTION: Get agent rank order
-- ============================================

CREATE OR REPLACE FUNCTION get_rank_order(rank_name agent_rank)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE rank_name
    WHEN 'pre_associate' THEN 1
    WHEN 'associate' THEN 2
    WHEN 'sr_associate' THEN 3
    WHEN 'agent' THEN 4
    WHEN 'sr_agent' THEN 5
    WHEN 'mga' THEN 6
    WHEN 'associate_mga' THEN 7
    WHEN 'senior_mga' THEN 8
    WHEN 'regional_mga' THEN 9
    WHEN 'national_mga' THEN 10
    WHEN 'executive_mga' THEN 11
    WHEN 'premier_mga' THEN 12
    ELSE 0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- COMPLETE
-- ============================================

COMMENT ON TABLE training_tracks IS 'Learning paths that group related courses together';
COMMENT ON TABLE course_sections IS 'Organize lessons into sections within a course';
COMMENT ON TABLE quizzes IS 'Quizzes and exams attached to lessons or courses';
COMMENT ON TABLE quiz_questions IS 'Questions for quizzes';
COMMENT ON TABLE quiz_answers IS 'Possible answers for quiz questions';
COMMENT ON TABLE quiz_attempts IS 'Record of agent quiz attempts';
COMMENT ON TABLE certificates IS 'Certificates earned by agents';
COMMENT ON TABLE resources IS 'Downloadable resources library';
COMMENT ON TABLE agent_licenses IS 'Insurance license tracking per state';
COMMENT ON TABLE ce_credits IS 'Continuing education credits tracking';
COMMENT ON TABLE course_enrollments IS 'Track agent enrollment in courses';
COMMENT ON TABLE track_enrollments IS 'Track agent enrollment in learning paths';
COMMENT ON TABLE achievements IS 'Gamification achievements';
COMMENT ON TABLE agent_achievements IS 'Achievements earned by agents';
COMMENT ON TABLE learning_streaks IS 'Track learning streaks and points';
