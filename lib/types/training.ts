/**
 * Training Suite TypeScript Types
 * Comprehensive LMS for life insurance agent training
 */

// ============================================
// ENUMS
// ============================================

export type TrackType = 'new_agent' | 'licensing' | 'product' | 'sales' | 'leadership' | 'compliance';
export type QuestionType = 'multiple_choice' | 'true_false' | 'multiple_select' | 'short_answer';
export type ResourceType = 'pdf' | 'document' | 'spreadsheet' | 'video' | 'audio' | 'link' | 'image';
export type ResourceCategory = 'forms' | 'scripts' | 'presentations' | 'guides' | 'carrier_materials' | 'compliance' | 'marketing' | 'state_licensing';
export type CourseStatus = 'draft' | 'published' | 'archived';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';
export type LicenseStatus = 'active' | 'expired' | 'pending' | 'suspended';
export type ContentType = 'video' | 'pdf' | 'quiz' | 'text' | 'audio';
export type CourseCategory = 'onboarding' | 'products' | 'sales' | 'recruiting' | 'compliance';

// ============================================
// TRAINING TRACKS (Learning Paths)
// ============================================

export interface TrainingTrack {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  track_type: TrackType;
  rank_requirement: string | null;
  estimated_hours: number | null;
  is_required: boolean;
  is_active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface TrainingTrackInsert {
  title: string;
  slug: string;
  description?: string | null;
  thumbnail?: string | null;
  track_type: TrackType;
  rank_requirement?: string | null;
  estimated_hours?: number | null;
  is_required?: boolean;
  is_active?: boolean;
  order?: number;
}

export interface TrainingTrackUpdate {
  title?: string;
  slug?: string;
  description?: string | null;
  thumbnail?: string | null;
  track_type?: TrackType;
  rank_requirement?: string | null;
  estimated_hours?: number | null;
  is_required?: boolean;
  is_active?: boolean;
  order?: number;
}

export interface TrackCourse {
  track_id: string;
  course_id: string;
  order: number;
  is_required: boolean;
}

// ============================================
// COURSES (Enhanced)
// ============================================

export interface Course {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  category: CourseCategory;
  thumbnail: string | null;
  instructor_name: string | null;
  instructor_avatar: string | null;
  estimated_minutes: number;
  skill_level: SkillLevel;
  is_featured: boolean;
  is_required: boolean;
  prerequisites: string[];
  learning_objectives: string[];
  status: CourseStatus;
  order: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseInsert {
  title: string;
  slug?: string | null;
  description?: string | null;
  category: CourseCategory;
  thumbnail?: string | null;
  instructor_name?: string | null;
  instructor_avatar?: string | null;
  estimated_minutes?: number;
  skill_level?: SkillLevel;
  is_featured?: boolean;
  is_required?: boolean;
  prerequisites?: string[];
  learning_objectives?: string[];
  status?: CourseStatus;
  order?: number;
}

export interface CourseUpdate {
  title?: string;
  slug?: string | null;
  description?: string | null;
  category?: CourseCategory;
  thumbnail?: string | null;
  instructor_name?: string | null;
  instructor_avatar?: string | null;
  estimated_minutes?: number;
  skill_level?: SkillLevel;
  is_featured?: boolean;
  is_required?: boolean;
  prerequisites?: string[];
  learning_objectives?: string[];
  status?: CourseStatus;
  order?: number;
  published_at?: string | null;
}

// ============================================
// COURSE SECTIONS
// ============================================

export interface CourseSection {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order: number;
  created_at: string;
}

export interface CourseSectionInsert {
  course_id: string;
  title: string;
  description?: string | null;
  order?: number;
}

export interface CourseSectionUpdate {
  title?: string;
  description?: string | null;
  order?: number;
}

// ============================================
// LESSONS (Enhanced)
// ============================================

export interface Lesson {
  id: string;
  course_id: string;
  section_id: string | null;
  title: string;
  content_type: ContentType;
  content_url: string | null;
  content_text: string | null;
  duration_minutes: number;
  is_preview: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface LessonInsert {
  course_id: string;
  section_id?: string | null;
  title: string;
  content_type: ContentType;
  content_url?: string | null;
  content_text?: string | null;
  duration_minutes?: number;
  is_preview?: boolean;
  order?: number;
}

export interface LessonUpdate {
  section_id?: string | null;
  title?: string;
  content_type?: ContentType;
  content_url?: string | null;
  content_text?: string | null;
  duration_minutes?: number;
  is_preview?: boolean;
  order?: number;
}

// ============================================
// QUIZZES & EXAMS
// ============================================

export interface Quiz {
  id: string;
  lesson_id: string | null;
  course_id: string | null;
  title: string;
  description: string | null;
  passing_score: number;
  time_limit_minutes: number | null;
  max_attempts: number | null;
  shuffle_questions: boolean;
  show_correct_answers: boolean;
  is_certification_exam: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuizInsert {
  lesson_id?: string | null;
  course_id?: string | null;
  title: string;
  description?: string | null;
  passing_score?: number;
  time_limit_minutes?: number | null;
  max_attempts?: number | null;
  shuffle_questions?: boolean;
  show_correct_answers?: boolean;
  is_certification_exam?: boolean;
  is_active?: boolean;
}

export interface QuizUpdate {
  title?: string;
  description?: string | null;
  passing_score?: number;
  time_limit_minutes?: number | null;
  max_attempts?: number | null;
  shuffle_questions?: boolean;
  show_correct_answers?: boolean;
  is_certification_exam?: boolean;
  is_active?: boolean;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_type: QuestionType;
  question_text: string;
  explanation: string | null;
  points: number;
  order: number;
  created_at: string;
}

export interface QuizQuestionInsert {
  quiz_id: string;
  question_type: QuestionType;
  question_text: string;
  explanation?: string | null;
  points?: number;
  order?: number;
}

export interface QuizQuestionUpdate {
  question_type?: QuestionType;
  question_text?: string;
  explanation?: string | null;
  points?: number;
  order?: number;
}

export interface QuizAnswer {
  id: string;
  question_id: string;
  answer_text: string;
  is_correct: boolean;
  order: number;
}

export interface QuizAnswerInsert {
  question_id: string;
  answer_text: string;
  is_correct?: boolean;
  order?: number;
}

export interface QuizAnswerUpdate {
  answer_text?: string;
  is_correct?: boolean;
  order?: number;
}

export interface QuizAttemptAnswer {
  question_id: string;
  selected_answers: string[];
  is_correct: boolean;
}

export interface QuizAttempt {
  id: string;
  agent_id: string;
  quiz_id: string;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  time_taken_seconds: number | null;
  answers: QuizAttemptAnswer[];
  started_at: string;
  completed_at: string;
}

export interface QuizAttemptInsert {
  agent_id: string;
  quiz_id: string;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  time_taken_seconds?: number | null;
  answers: QuizAttemptAnswer[];
  started_at: string;
}

// ============================================
// CERTIFICATES
// ============================================

export interface Certificate {
  id: string;
  agent_id: string;
  course_id: string | null;
  track_id: string | null;
  quiz_attempt_id: string | null;
  certificate_number: string;
  title: string;
  recipient_name: string;
  issued_at: string;
  expires_at: string | null;
  pdf_url: string | null;
  verification_url: string | null;
  metadata: Record<string, unknown>;
}

export interface CertificateInsert {
  agent_id: string;
  course_id?: string | null;
  track_id?: string | null;
  quiz_attempt_id?: string | null;
  certificate_number: string;
  title: string;
  recipient_name: string;
  expires_at?: string | null;
  pdf_url?: string | null;
  verification_url?: string | null;
  metadata?: Record<string, unknown>;
}

// ============================================
// RESOURCES LIBRARY
// ============================================

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  resource_type: ResourceType;
  resource_category: ResourceCategory;
  file_url: string | null;
  file_name: string | null;
  file_size_bytes: number | null;
  external_url: string | null;
  thumbnail: string | null;
  tags: string[];
  is_downloadable: boolean;
  is_active: boolean;
  download_count: number;
  rank_requirement: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResourceInsert {
  title: string;
  description?: string | null;
  resource_type: ResourceType;
  resource_category: ResourceCategory;
  file_url?: string | null;
  file_name?: string | null;
  file_size_bytes?: number | null;
  external_url?: string | null;
  thumbnail?: string | null;
  tags?: string[];
  is_downloadable?: boolean;
  is_active?: boolean;
  rank_requirement?: string | null;
}

export interface ResourceUpdate {
  title?: string;
  description?: string | null;
  resource_type?: ResourceType;
  resource_category?: ResourceCategory;
  file_url?: string | null;
  file_name?: string | null;
  file_size_bytes?: number | null;
  external_url?: string | null;
  thumbnail?: string | null;
  tags?: string[];
  is_downloadable?: boolean;
  is_active?: boolean;
  rank_requirement?: string | null;
}

export interface ResourceDownload {
  id: string;
  resource_id: string;
  agent_id: string;
  downloaded_at: string;
}

// ============================================
// INSURANCE LICENSING
// ============================================

export interface AgentLicense {
  id: string;
  agent_id: string;
  state_code: string;
  license_type: string;
  license_number: string | null;
  issued_date: string | null;
  expiration_date: string | null;
  ce_credits_required: number | null;
  ce_credits_completed: number;
  status: LicenseStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentLicenseInsert {
  agent_id: string;
  state_code: string;
  license_type: string;
  license_number?: string | null;
  issued_date?: string | null;
  expiration_date?: string | null;
  ce_credits_required?: number | null;
  ce_credits_completed?: number;
  status?: LicenseStatus;
  notes?: string | null;
}

export interface AgentLicenseUpdate {
  state_code?: string;
  license_type?: string;
  license_number?: string | null;
  issued_date?: string | null;
  expiration_date?: string | null;
  ce_credits_required?: number | null;
  ce_credits_completed?: number;
  status?: LicenseStatus;
  notes?: string | null;
}

// ============================================
// CE CREDITS
// ============================================

export interface CECredit {
  id: string;
  agent_id: string;
  license_id: string | null;
  course_id: string | null;
  credit_hours: number;
  credit_type: string;
  provider: string | null;
  completion_date: string;
  certificate_number: string | null;
  created_at: string;
}

export interface CECreditInsert {
  agent_id: string;
  license_id?: string | null;
  course_id?: string | null;
  credit_hours: number;
  credit_type: string;
  provider?: string | null;
  completion_date: string;
  certificate_number?: string | null;
}

// ============================================
// PROGRESS TRACKING
// ============================================

export interface CourseProgress {
  id: string;
  agent_id: string;
  course_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
  quiz_score: number | null;
  time_spent_seconds: number;
  last_position_seconds: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseProgressInsert {
  agent_id: string;
  course_id: string;
  lesson_id: string;
  completed?: boolean;
  completed_at?: string | null;
  quiz_score?: number | null;
  time_spent_seconds?: number;
  last_position_seconds?: number;
  notes?: string | null;
}

export interface CourseProgressUpdate {
  completed?: boolean;
  completed_at?: string | null;
  quiz_score?: number | null;
  time_spent_seconds?: number;
  last_position_seconds?: number;
  notes?: string | null;
}

// ============================================
// ENROLLMENTS
// ============================================

export interface CourseEnrollment {
  id: string;
  agent_id: string;
  course_id: string;
  enrolled_at: string;
  last_accessed_at: string | null;
  progress_percentage: number;
  completed_at: string | null;
  certificate_id: string | null;
}

export interface CourseEnrollmentInsert {
  agent_id: string;
  course_id: string;
  last_accessed_at?: string | null;
  progress_percentage?: number;
  completed_at?: string | null;
  certificate_id?: string | null;
}

export interface CourseEnrollmentUpdate {
  last_accessed_at?: string | null;
  progress_percentage?: number;
  completed_at?: string | null;
  certificate_id?: string | null;
}

export interface TrackEnrollment {
  id: string;
  agent_id: string;
  track_id: string;
  enrolled_at: string;
  progress_percentage: number;
  completed_at: string | null;
  certificate_id: string | null;
}

export interface TrackEnrollmentInsert {
  agent_id: string;
  track_id: string;
  progress_percentage?: number;
  completed_at?: string | null;
  certificate_id?: string | null;
}

export interface TrackEnrollmentUpdate {
  progress_percentage?: number;
  completed_at?: string | null;
  certificate_id?: string | null;
}

// ============================================
// GAMIFICATION
// ============================================

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string | null;
  icon: string | null;
  points: number;
  badge_color: string;
  category: string;
  is_active: boolean;
  created_at: string;
}

export interface AgentAchievement {
  id: string;
  agent_id: string;
  achievement_id: string;
  earned_at: string;
}

export interface LearningStreak {
  id: string;
  agent_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  total_points: number;
  total_lessons_completed: number;
  total_courses_completed: number;
  total_time_spent_seconds: number;
}

export interface LearningStreakUpdate {
  current_streak?: number;
  longest_streak?: number;
  last_activity_date?: string | null;
  total_points?: number;
  total_lessons_completed?: number;
  total_courses_completed?: number;
  total_time_spent_seconds?: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface CourseWithProgress extends Course {
  enrollment?: CourseEnrollment | null;
  lessons_count: number;
  completed_lessons_count: number;
  sections?: CourseSectionWithLessons[];
}

export interface CourseSectionWithLessons extends CourseSection {
  lessons: LessonWithProgress[];
}

export interface LessonWithProgress extends Lesson {
  progress?: CourseProgress | null;
  quiz?: Quiz | null;
}

export interface TrackWithCourses extends TrainingTrack {
  courses: CourseWithProgress[];
  enrollment?: TrackEnrollment | null;
  total_courses: number;
  completed_courses: number;
}

export interface QuizWithQuestions extends Quiz {
  questions: QuizQuestionWithAnswers[];
}

export interface QuizQuestionWithAnswers extends QuizQuestion {
  answers: QuizAnswer[];
}

export interface AgentTrainingStats {
  total_courses_enrolled: number;
  total_courses_completed: number;
  total_lessons_completed: number;
  total_time_spent_minutes: number;
  total_certificates: number;
  current_streak: number;
  longest_streak: number;
  total_points: number;
  achievements: AgentAchievementWithDetails[];
  recent_activity: RecentActivity[];
}

export interface AgentAchievementWithDetails extends AgentAchievement {
  achievement: Achievement;
}

export interface RecentActivity {
  type: 'lesson_completed' | 'course_completed' | 'quiz_passed' | 'certificate_earned' | 'achievement_unlocked';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// FORM SCHEMAS (for validation)
// ============================================

export interface CreateCourseForm {
  title: string;
  description?: string;
  category: CourseCategory;
  skill_level: SkillLevel;
  instructor_name?: string;
  estimated_minutes?: number;
  is_required?: boolean;
  learning_objectives?: string[];
}

export interface CreateLessonForm {
  title: string;
  content_type: ContentType;
  content_url?: string;
  content_text?: string;
  duration_minutes?: number;
  is_preview?: boolean;
  section_id?: string;
}

export interface CreateQuizForm {
  title: string;
  description?: string;
  passing_score?: number;
  time_limit_minutes?: number;
  max_attempts?: number;
  shuffle_questions?: boolean;
  show_correct_answers?: boolean;
  is_certification_exam?: boolean;
}

export interface CreateQuestionForm {
  question_type: QuestionType;
  question_text: string;
  explanation?: string;
  points?: number;
  answers: {
    answer_text: string;
    is_correct: boolean;
  }[];
}

export interface SubmitQuizForm {
  quiz_id: string;
  answers: {
    question_id: string;
    selected_answers: string[];
  }[];
  started_at: string;
}

export interface CreateResourceForm {
  title: string;
  description?: string;
  resource_type: ResourceType;
  resource_category: ResourceCategory;
  file_url?: string;
  external_url?: string;
  tags?: string[];
  is_downloadable?: boolean;
  rank_requirement?: string;
}

export interface CreateLicenseForm {
  state_code: string;
  license_type: string;
  license_number?: string;
  issued_date?: string;
  expiration_date?: string;
  ce_credits_required?: number;
  notes?: string;
}

// ============================================
// CONSTANTS
// ============================================

export const TRACK_TYPE_LABELS: Record<TrackType, string> = {
  new_agent: 'New Agent',
  licensing: 'Licensing',
  product: 'Product Training',
  sales: 'Sales Training',
  leadership: 'Leadership',
  compliance: 'Compliance',
};

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: 'Multiple Choice',
  true_false: 'True/False',
  multiple_select: 'Multiple Select',
  short_answer: 'Short Answer',
};

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  pdf: 'PDF',
  document: 'Document',
  spreadsheet: 'Spreadsheet',
  video: 'Video',
  audio: 'Audio',
  link: 'Link',
  image: 'Image',
};

export const RESOURCE_CATEGORY_LABELS: Record<ResourceCategory, string> = {
  forms: 'Forms',
  scripts: 'Scripts',
  presentations: 'Presentations',
  guides: 'Guides',
  carrier_materials: 'Carrier Materials',
  compliance: 'Compliance',
  marketing: 'Marketing',
  state_licensing: 'State Licensing',
};

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
};

export const COURSE_CATEGORY_LABELS: Record<CourseCategory, string> = {
  onboarding: 'Onboarding',
  products: 'Products',
  sales: 'Sales',
  recruiting: 'Recruiting',
  compliance: 'Compliance',
};

export const LICENSE_STATUS_LABELS: Record<LicenseStatus, string> = {
  active: 'Active',
  expired: 'Expired',
  pending: 'Pending',
  suspended: 'Suspended',
};

export const US_STATES: { code: string; name: string }[] = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
];

export const LICENSE_TYPES = [
  { value: 'life', label: 'Life Insurance' },
  { value: 'health', label: 'Health Insurance' },
  { value: 'life_and_health', label: 'Life & Health Insurance' },
  { value: 'variable', label: 'Variable Life' },
  { value: 'property', label: 'Property Insurance' },
  { value: 'casualty', label: 'Casualty Insurance' },
];

export const CE_CREDIT_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'ethics', label: 'Ethics' },
  { value: 'annuity', label: 'Annuity' },
  { value: 'ltc', label: 'Long-Term Care' },
  { value: 'flood', label: 'Flood Insurance' },
  { value: 'aml', label: 'Anti-Money Laundering' },
];
