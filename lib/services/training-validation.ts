/**
 * Training Progress Validation Service
 * Ensures compliance requirements are met before marking lessons complete
 *
 * Phase 2 - Issue #12: Training Progress Completion Validation
 */

import { createAdminClient } from '@/lib/db/supabase-server';
import type { Lesson, Quiz, QuizAttempt, CourseProgress } from '@/lib/types/training';

// Minimum percentage of video that must be watched
const MIN_VIDEO_WATCH_PERCENTAGE = 0.90; // 90%

// Minimum percentage of text content duration that must be spent
const MIN_TEXT_READ_PERCENTAGE = 0.80; // 80%

export interface ValidationResult {
  allowed: boolean;
  reason?: string;
  requirements?: {
    type: 'video_watch_time' | 'quiz_passing' | 'text_read_time';
    required: number | string;
    current: number | string;
  };
}

/**
 * Validate if a lesson can be marked as completed
 */
export async function validateLessonCompletion(
  agentId: string,
  lessonId: string,
  timeSpentSeconds?: number,
  quizScore?: number
): Promise<ValidationResult> {
  const supabase = createAdminClient();

  // Get lesson details
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .single() as unknown as { data: Lesson | null; error: unknown };

  if (lessonError || !lesson) {
    return {
      allowed: false,
      reason: 'Lesson not found',
    };
  }

  // VALIDATION 1: Video watch time
  if (lesson.content_type === 'video' && lesson.duration_minutes > 0) {
    const requiredSeconds = lesson.duration_minutes * 60 * MIN_VIDEO_WATCH_PERCENTAGE;
    const watchedSeconds = timeSpentSeconds || 0;

    if (watchedSeconds < requiredSeconds) {
      return {
        allowed: false,
        reason: `You must watch at least ${Math.floor(MIN_VIDEO_WATCH_PERCENTAGE * 100)}% of the video to complete this lesson.`,
        requirements: {
          type: 'video_watch_time',
          required: `${Math.floor(requiredSeconds / 60)} minutes`,
          current: `${Math.floor(watchedSeconds / 60)} minutes`,
        },
      };
    }
  }

  // VALIDATION 2: Text/PDF read time
  if ((lesson.content_type === 'text' || lesson.content_type === 'pdf') && lesson.duration_minutes > 0) {
    const requiredSeconds = lesson.duration_minutes * 60 * MIN_TEXT_READ_PERCENTAGE;
    const spentSeconds = timeSpentSeconds || 0;

    if (spentSeconds < requiredSeconds) {
      return {
        allowed: false,
        reason: `You must spend at least ${Math.floor(requiredSeconds / 60)} minutes reading this content to complete the lesson.`,
        requirements: {
          type: 'text_read_time',
          required: `${Math.floor(requiredSeconds / 60)} minutes`,
          current: `${Math.floor(spentSeconds / 60)} minutes`,
        },
      };
    }
  }

  // VALIDATION 3: Quiz passing score
  // Check if this lesson has an associated quiz
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('*')
    .eq('lesson_id', lessonId)
    .eq('is_active', true)
    .single() as unknown as { data: Quiz | null; error: unknown };

  if (quiz && !quizError) {
    // Get agent's best quiz attempt for this quiz
    const { data: attempts, error: attemptsError } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('agent_id', agentId)
      .eq('quiz_id', quiz.id)
      .order('score', { ascending: false })
      .limit(1) as unknown as { data: QuizAttempt[] | null; error: unknown };

    if (attemptsError) {
      return {
        allowed: false,
        reason: 'Unable to verify quiz completion',
      };
    }

    const bestAttempt = attempts?.[0];

    // Check if they have a passing score
    if (!bestAttempt || bestAttempt.score < quiz.passing_score) {
      return {
        allowed: false,
        reason: `You must pass the quiz with a score of at least ${quiz.passing_score}% to complete this lesson.`,
        requirements: {
          type: 'quiz_passing',
          required: `${quiz.passing_score}%`,
          current: bestAttempt ? `${bestAttempt.score}%` : '0%',
        },
      };
    }
  }

  // All validations passed
  return {
    allowed: true,
  };
}

/**
 * Validate course completion requirements
 * Ensures all required lessons are completed
 */
export async function validateCourseCompletion(
  agentId: string,
  courseId: string
): Promise<ValidationResult> {
  const supabase = createAdminClient();

  // Get all lessons for this course
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('id, title')
    .eq('course_id', courseId);

  if (lessonsError || !lessons) {
    return {
      allowed: false,
      reason: 'Unable to verify course lessons',
    };
  }

  // Get agent's progress for all lessons
  const { data: progress, error: progressError } = await supabase
    .from('course_progress')
    .select('lesson_id, completed')
    .eq('agent_id', agentId)
    .eq('course_id', courseId)
    .eq('completed', true);

  if (progressError) {
    return {
      allowed: false,
      reason: 'Unable to verify course progress',
    };
  }

  const completedLessonIds = new Set(progress?.map((p: CourseProgress) => p.lesson_id) || []);

  // Check if all lessons are completed
  const incompleteLessons = lessons.filter((l: Lesson) => !completedLessonIds.has(l.id));

  if (incompleteLessons.length > 0) {
    return {
      allowed: false,
      reason: `You must complete all ${lessons.length} lessons to finish this course. ${incompleteLessons.length} lesson(s) remaining.`,
    };
  }

  return {
    allowed: true,
  };
}

/**
 * Check if agent can attempt a quiz
 * Validates max attempts limit
 */
export async function validateQuizAttempt(
  agentId: string,
  quizId: string
): Promise<ValidationResult> {
  const supabase = createAdminClient();

  // Get quiz details
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .single() as unknown as { data: Quiz | null; error: unknown };

  if (quizError || !quiz) {
    return {
      allowed: false,
      reason: 'Quiz not found',
    };
  }

  // If no max attempts limit, allow
  if (!quiz.max_attempts) {
    return { allowed: true };
  }

  // Check how many attempts agent has made
  const { data: attempts, error: attemptsError } = await supabase
    .from('quiz_attempts')
    .select('id')
    .eq('agent_id', agentId)
    .eq('quiz_id', quizId);

  if (attemptsError) {
    return {
      allowed: false,
      reason: 'Unable to verify quiz attempts',
    };
  }

  const attemptCount = attempts?.length || 0;

  if (attemptCount >= quiz.max_attempts) {
    return {
      allowed: false,
      reason: `Maximum attempts (${quiz.max_attempts}) exceeded for this quiz.`,
      requirements: {
        type: 'quiz_passing',
        required: `Max ${quiz.max_attempts} attempts`,
        current: `${attemptCount} attempts used`,
      },
    };
  }

  return {
    allowed: true,
  };
}

/**
 * Log compliance validation for audit trail
 */
export async function logComplianceValidation(
  agentId: string,
  lessonId: string,
  validationResult: ValidationResult
): Promise<void> {
  const supabase = createAdminClient();

  await supabase.from('admin_audit_log').insert({
    user_id: agentId,
    action: 'training_validation',
    resource_type: 'lesson',
    resource_id: lessonId,
    changes: {
      validation_result: validationResult,
      timestamp: new Date().toISOString(),
    },
  } as never);
}
