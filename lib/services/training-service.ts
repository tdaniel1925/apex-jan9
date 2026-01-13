/**
 * Training Service
 * Business logic for the comprehensive LMS
 */

import { createAdminClient } from '@/lib/db/supabase-server';
import { nanoid } from 'nanoid';
import type {
  Course,
  CourseWithProgress,
  CourseEnrollment,
  CourseProgress,
  CourseProgressUpdate,
  TrainingTrack,
  TrackWithCourses,
  TrackEnrollment,
  TrackCourse,
  Quiz,
  QuizWithQuestions,
  QuizQuestion,
  QuizAnswer,
  QuizAttempt,
  QuizAttemptAnswer,
  Certificate,
  Resource,
  AgentLicense,
  CECredit,
  Achievement,
  AgentAchievement,
  LearningStreak,
  AgentTrainingStats,
  RecentActivity,
  Lesson,
  CourseSection,
} from '@/lib/types/training';

// Helper interface for track courses with embedded course data
interface TrackCourseWithCourse extends TrackCourse {
  courses: Course | null;
}

// ============================================
// COURSE OPERATIONS
// ============================================

export async function getCoursesForAgent(agentId: string): Promise<CourseWithProgress[]> {
  const supabase = createAdminClient();

  // Get all published courses
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('*')
    .eq('status', 'published')
    .order('order', { ascending: true });

  if (coursesError) throw coursesError;

  // Get agent's enrollments
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from('course_enrollments')
    .select('*')
    .eq('agent_id', agentId);

  if (enrollmentsError) throw enrollmentsError;

  // Get lesson counts per course
  const { data: lessonCounts, error: lessonError } = await supabase
    .from('lessons')
    .select('course_id');

  if (lessonError) throw lessonError;

  // Get completed lesson counts per course for this agent
  const { data: progress, error: progressError } = await supabase
    .from('course_progress')
    .select('course_id, lesson_id')
    .eq('agent_id', agentId)
    .eq('completed', true);

  if (progressError) throw progressError;

  // Build course list with progress
  const enrollmentMap = new Map(enrollments?.map((e: CourseEnrollment) => [e.course_id, e]) || []);
  const courseLessonCounts = new Map<string, number>();
  const courseCompletedCounts = new Map<string, number>();

  lessonCounts?.forEach((l: { course_id: string }) => {
    courseLessonCounts.set(l.course_id, (courseLessonCounts.get(l.course_id) || 0) + 1);
  });

  progress?.forEach((p: { course_id: string }) => {
    courseCompletedCounts.set(p.course_id, (courseCompletedCounts.get(p.course_id) || 0) + 1);
  });

  return (courses || []).map((course: Course) => ({
    ...course,
    enrollment: enrollmentMap.get(course.id) || null,
    lessons_count: courseLessonCounts.get(course.id) || 0,
    completed_lessons_count: courseCompletedCounts.get(course.id) || 0,
  }));
}

export async function getCourseWithLessons(courseId: string, agentId?: string): Promise<CourseWithProgress | null> {
  const supabase = createAdminClient();

  // Get course
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single() as unknown as { data: Course | null; error: unknown };

  if (courseError || !course) return null;

  // Get sections
  const { data: sections, error: sectionsError } = await supabase
    .from('course_sections')
    .select('*')
    .eq('course_id', courseId)
    .order('order', { ascending: true });

  if (sectionsError) throw sectionsError;

  // Get lessons
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('order', { ascending: true });

  if (lessonsError) throw lessonsError;

  // Get quizzes for lessons
  const { data: quizzes, error: quizzesError } = await supabase
    .from('quizzes')
    .select('*')
    .eq('course_id', courseId)
    .eq('is_active', true);

  if (quizzesError) throw quizzesError;

  let enrollment = null;
  let progressMap = new Map<string, CourseProgress>();

  if (agentId) {
    // Get enrollment
    const { data: enrollmentData } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('agent_id', agentId)
      .eq('course_id', courseId)
      .single();

    enrollment = enrollmentData;

    // Get progress
    const { data: progressData } = await supabase
      .from('course_progress')
      .select('*')
      .eq('agent_id', agentId)
      .eq('course_id', courseId);

    progressData?.forEach((p: CourseProgress) => progressMap.set(p.lesson_id, p));
  }

  // Map quizzes to lessons
  const lessonQuizMap = new Map(quizzes?.filter((q: Quiz) => q.lesson_id).map((q: Quiz) => [q.lesson_id, q]) || []);

  // Build sections with lessons
  const sectionsWithLessons = (sections || []).map((section: CourseSection) => ({
    ...section,
    lessons: (lessons || [])
      .filter((l: Lesson) => l.section_id === section.id)
      .map((lesson: Lesson) => ({
        ...lesson,
        progress: progressMap.get(lesson.id) || null,
        quiz: lessonQuizMap.get(lesson.id) || null,
      })),
  }));

  // Lessons without sections
  const orphanLessons = (lessons || [])
    .filter((l: Lesson) => !l.section_id)
    .map((lesson: Lesson) => ({
      ...lesson,
      progress: progressMap.get(lesson.id) || null,
      quiz: lessonQuizMap.get(lesson.id) || null,
    }));

  return {
    ...course,
    enrollment,
    lessons_count: lessons?.length || 0,
    completed_lessons_count: Array.from(progressMap.values()).filter(p => p.completed).length,
    sections: sectionsWithLessons.length > 0 ? sectionsWithLessons : undefined,
  };
}

// ============================================
// ENROLLMENT OPERATIONS
// ============================================

export async function enrollInCourse(agentId: string, courseId: string): Promise<CourseEnrollment> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('course_enrollments')
    .upsert({
      agent_id: agentId,
      course_id: courseId,
      enrolled_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
    } as never, {
      onConflict: 'agent_id,course_id',
    })
    .select()
    .single() as unknown as { data: CourseEnrollment | null; error: unknown };

  if (error) throw error;
  return data as CourseEnrollment;
}

export async function enrollInTrack(agentId: string, trackId: string): Promise<TrackEnrollment> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('track_enrollments')
    .upsert({
      agent_id: agentId,
      track_id: trackId,
      enrolled_at: new Date().toISOString(),
    } as never, {
      onConflict: 'agent_id,track_id',
    })
    .select()
    .single() as unknown as { data: TrackEnrollment | null; error: unknown };

  if (error) throw error;

  // Also enroll in all track courses
  const { data: trackCourses } = await supabase
    .from('track_courses')
    .select('course_id')
    .eq('track_id', trackId) as unknown as { data: { course_id: string }[] | null; error: unknown };

  if (trackCourses) {
    for (const tc of trackCourses) {
      await enrollInCourse(agentId, tc.course_id);
    }
  }

  return data as TrackEnrollment;
}

// ============================================
// PROGRESS OPERATIONS
// ============================================

export async function updateLessonProgress(
  agentId: string,
  courseId: string,
  lessonId: string,
  update: CourseProgressUpdate
): Promise<CourseProgress> {
  const supabase = createAdminClient();

  // Ensure enrolled
  await enrollInCourse(agentId, courseId);

  // Upsert progress
  const { data, error } = await supabase
    .from('course_progress')
    .upsert({
      agent_id: agentId,
      course_id: courseId,
      lesson_id: lessonId,
      ...update,
      updated_at: new Date().toISOString(),
    } as never, {
      onConflict: 'agent_id,lesson_id',
    })
    .select()
    .single() as unknown as { data: CourseProgress | null; error: unknown };

  if (error) throw error;

  // Update enrollment last accessed
  await supabase
    .from('course_enrollments')
    .update({ last_accessed_at: new Date().toISOString() } as never)
    .eq('agent_id', agentId)
    .eq('course_id', courseId);

  // If lesson completed, update course progress and check for completion
  if (update.completed) {
    await updateCourseProgress(agentId, courseId);
    await updateLearningStreak(agentId);
    await checkAchievements(agentId, 'lesson_completed');
  }

  return data as CourseProgress;
}

export async function updateCourseProgress(agentId: string, courseId: string): Promise<void> {
  const supabase = createAdminClient();

  // Get total lessons
  const { count: totalLessons } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId);

  // Get completed lessons
  const { count: completedLessons } = await supabase
    .from('course_progress')
    .select('*', { count: 'exact', head: true })
    .eq('agent_id', agentId)
    .eq('course_id', courseId)
    .eq('completed', true);

  const percentage = totalLessons ? Math.round(((completedLessons || 0) / totalLessons) * 100) : 0;
  const isComplete = percentage === 100;

  // Update enrollment
  await supabase
    .from('course_enrollments')
    .update({
      progress_percentage: percentage,
      completed_at: isComplete ? new Date().toISOString() : null,
    } as never)
    .eq('agent_id', agentId)
    .eq('course_id', courseId);

  // If course complete, check for certification exam and achievements
  if (isComplete) {
    await checkAchievements(agentId, 'course_completed');

    // Check if course has a final exam that needs passing for certificate
    const { data: courseQuiz } = await supabase
      .from('quizzes')
      .select('*')
      .eq('course_id', courseId)
      .is('lesson_id', null)
      .eq('is_certification_exam', true)
      .single();

    if (!courseQuiz) {
      // No exam required, auto-issue certificate
      await issueCertificate(agentId, courseId, null);
    }
  }
}

// ============================================
// TRACK OPERATIONS
// ============================================

export async function getTracksForAgent(agentId: string): Promise<TrackWithCourses[]> {
  const supabase = createAdminClient();

  // Get all active tracks
  const { data: tracks, error: tracksError } = await supabase
    .from('training_tracks')
    .select('*')
    .eq('is_active', true)
    .order('order', { ascending: true });

  if (tracksError) throw tracksError;

  // Get track-course relationships
  const { data: trackCourses, error: tcError } = await supabase
    .from('track_courses')
    .select('*, courses(*)')
    .order('order', { ascending: true });

  if (tcError) throw tcError;

  // Get enrollments
  const { data: enrollments } = await supabase
    .from('track_enrollments')
    .select('*')
    .eq('agent_id', agentId);

  // Get course enrollments
  const { data: courseEnrollments } = await supabase
    .from('course_enrollments')
    .select('*')
    .eq('agent_id', agentId);

  const enrollmentMap = new Map(enrollments?.map((e: TrackEnrollment) => [e.track_id, e]) || []);
  const courseEnrollmentMap = new Map(courseEnrollments?.map((e: CourseEnrollment) => [e.course_id, e]) || []);

  // Build tracks with courses
  return (tracks || []).map((track: TrainingTrack) => {
    const courses: CourseWithProgress[] = ((trackCourses as TrackCourseWithCourse[] | null) || [])
      .filter((tc: TrackCourseWithCourse) => tc.track_id === track.id && tc.courses !== null)
      .map((tc: TrackCourseWithCourse) => ({
        ...(tc.courses as Course),
        enrollment: courseEnrollmentMap.get(tc.course_id) || null,
        lessons_count: 0,
        completed_lessons_count: 0,
      }));

    const completedCourses = courses.filter((c: CourseWithProgress) => c.enrollment?.completed_at).length;

    return {
      ...track,
      courses,
      enrollment: enrollmentMap.get(track.id) || null,
      total_courses: courses.length,
      completed_courses: completedCourses,
    } as TrackWithCourses;
  });
}

// ============================================
// QUIZ OPERATIONS
// ============================================

export async function getQuizWithQuestions(quizId: string): Promise<QuizWithQuestions | null> {
  const supabase = createAdminClient();

  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .single() as unknown as { data: Quiz | null; error: unknown };

  if (quizError || !quiz) return null;

  const { data: questions, error: questionsError } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('order', { ascending: true });

  if (questionsError) throw questionsError;

  const questionIds = questions?.map((q: QuizQuestion) => q.id) || [];

  const { data: answers, error: answersError } = await supabase
    .from('quiz_answers')
    .select('*')
    .in('question_id', questionIds)
    .order('order', { ascending: true });

  if (answersError) throw answersError;

  const answerMap = new Map<string, QuizAnswer[]>();
  (answers as QuizAnswer[] | null)?.forEach((a: QuizAnswer) => {
    const existing = answerMap.get(a.question_id) || [];
    existing.push(a);
    answerMap.set(a.question_id, existing);
  });

  return {
    ...quiz,
    questions: ((questions as QuizQuestion[] | null) || []).map((q: QuizQuestion) => ({
      ...q,
      answers: answerMap.get(q.id) || [],
    })),
  } as QuizWithQuestions;
}

export async function submitQuizAttempt(
  agentId: string,
  quizId: string,
  answers: { question_id: string; selected_answers: string[] }[],
  startedAt: string
): Promise<QuizAttempt> {
  const supabase = createAdminClient();

  // Get quiz with questions and correct answers
  const quiz = await getQuizWithQuestions(quizId);
  if (!quiz) throw new Error('Quiz not found');

  // Check max attempts
  if (quiz.max_attempts) {
    const { count: attemptCount } = await supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .eq('quiz_id', quizId);

    if ((attemptCount || 0) >= quiz.max_attempts) {
      throw new Error('Maximum attempts exceeded');
    }
  }

  // Grade the quiz
  let score = 0;
  let maxScore = 0;
  const gradedAnswers: QuizAttemptAnswer[] = [];

  for (const question of quiz.questions) {
    maxScore += question.points;
    const submittedAnswer = answers.find(a => a.question_id === question.id);
    const correctAnswerIds = question.answers.filter(a => a.is_correct).map(a => a.id);

    let isCorrect = false;
    if (submittedAnswer) {
      const selectedSet = new Set(submittedAnswer.selected_answers);
      const correctSet = new Set(correctAnswerIds);
      isCorrect = selectedSet.size === correctSet.size &&
        [...selectedSet].every(s => correctSet.has(s));
    }

    if (isCorrect) {
      score += question.points;
    }

    gradedAnswers.push({
      question_id: question.id,
      selected_answers: submittedAnswer?.selected_answers || [],
      is_correct: isCorrect,
    });
  }

  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const passed = percentage >= quiz.passing_score;

  // Calculate time taken
  const startTime = new Date(startedAt).getTime();
  const endTime = Date.now();
  const timeTakenSeconds = Math.round((endTime - startTime) / 1000);

  // Save attempt
  const { data: attempt, error } = await supabase
    .from('quiz_attempts')
    .insert({
      agent_id: agentId,
      quiz_id: quizId,
      score,
      max_score: maxScore,
      percentage,
      passed,
      time_taken_seconds: timeTakenSeconds,
      answers: gradedAnswers,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
    } as never)
    .select()
    .single() as unknown as { data: QuizAttempt | null; error: unknown };

  if (error) throw error;
  const attemptData = attempt as QuizAttempt;

  // Check achievements
  if (passed) {
    await checkAchievements(agentId, 'quiz_passed', { percentage });
  }

  // If this is a certification exam and passed, issue certificate
  if (passed && quiz.is_certification_exam && quiz.course_id) {
    await issueCertificate(agentId, quiz.course_id, attemptData.id);
  }

  return attemptData;
}

// ============================================
// CERTIFICATE OPERATIONS
// ============================================

export async function issueCertificate(
  agentId: string,
  courseId: string | null,
  quizAttemptId: string | null,
  trackId: string | null = null
): Promise<Certificate> {
  const supabase = createAdminClient();

  // Get agent info for recipient name
  const { data: agent } = await supabase
    .from('agents')
    .select('first_name, last_name')
    .eq('id', agentId)
    .single() as unknown as { data: { first_name: string; last_name: string } | null };

  let title = 'Certificate of Completion';

  if (courseId) {
    const { data: course } = await supabase
      .from('courses')
      .select('title')
      .eq('id', courseId)
      .single() as unknown as { data: { title: string } | null };
    title = course?.title || title;
  }

  if (trackId) {
    const { data: track } = await supabase
      .from('training_tracks')
      .select('title')
      .eq('id', trackId)
      .single() as unknown as { data: { title: string } | null };
    title = track?.title || title;
  }

  const certificateNumber = `CERT-${nanoid(10).toUpperCase()}`;
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/certificates/verify/${certificateNumber}`;

  const { data: certificate, error } = await supabase
    .from('certificates')
    .insert({
      agent_id: agentId,
      course_id: courseId,
      track_id: trackId,
      quiz_attempt_id: quizAttemptId,
      certificate_number: certificateNumber,
      title,
      recipient_name: `${agent?.first_name || ''} ${agent?.last_name || ''}`.trim() || 'Agent',
      verification_url: verificationUrl,
    } as never)
    .select()
    .single() as unknown as { data: Certificate | null; error: unknown };

  if (error) throw error;
  const certData = certificate as Certificate;

  // Update enrollment with certificate
  if (courseId) {
    await supabase
      .from('course_enrollments')
      .update({ certificate_id: certData.id } as never)
      .eq('agent_id', agentId)
      .eq('course_id', courseId);
  }

  if (trackId) {
    await supabase
      .from('track_enrollments')
      .update({ certificate_id: certData.id } as never)
      .eq('agent_id', agentId)
      .eq('track_id', trackId);
  }

  await checkAchievements(agentId, 'certificate_earned');

  return certData;
}

export async function getAgentCertificates(agentId: string): Promise<Certificate[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('agent_id', agentId)
    .order('issued_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ============================================
// RESOURCE OPERATIONS
// ============================================

export async function getResources(
  agentRank: string,
  filters?: {
    category?: string;
    type?: string;
    search?: string;
  }
): Promise<Resource[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from('resources')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (filters?.category) {
    query = query.eq('resource_category', filters.category);
  }

  if (filters?.type) {
    query = query.eq('resource_type', filters.type);
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Filter by rank requirement
  // TODO: Implement rank comparison logic
  return data || [];
}

export async function recordResourceDownload(agentId: string, resourceId: string): Promise<void> {
  const supabase = createAdminClient();

  await supabase.from('resource_downloads').insert({
    agent_id: agentId,
    resource_id: resourceId,
  } as never);

  await supabase.rpc('increment_download_count' as never, { resource_id: resourceId } as never);
}

// ============================================
// LICENSE OPERATIONS
// ============================================

export async function getAgentLicenses(agentId: string): Promise<AgentLicense[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('agent_licenses')
    .select('*')
    .eq('agent_id', agentId)
    .order('state_code', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function upsertAgentLicense(
  agentId: string,
  license: Omit<AgentLicense, 'id' | 'agent_id' | 'created_at' | 'updated_at'>
): Promise<AgentLicense> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('agent_licenses')
    .upsert({
      agent_id: agentId,
      ...license,
    } as never, {
      onConflict: 'agent_id,state_code,license_type',
    })
    .select()
    .single() as unknown as { data: AgentLicense | null; error: unknown };

  if (error) throw error;
  return data as AgentLicense;
}

// ============================================
// GAMIFICATION OPERATIONS
// ============================================

export async function updateLearningStreak(agentId: string): Promise<LearningStreak> {
  const supabase = createAdminClient();

  const today = new Date().toISOString().split('T')[0];

  // Get or create streak record
  const { data: existing } = await supabase
    .from('learning_streaks')
    .select('*')
    .eq('agent_id', agentId)
    .single() as unknown as { data: LearningStreak | null };

  let currentStreak = 1;
  let longestStreak = existing?.longest_streak || 1;

  if (existing) {
    const lastDate = existing.last_activity_date;
    if (lastDate === today) {
      // Already updated today
      return existing;
    }

    const lastDateObj = new Date(lastDate || '');
    const todayObj = new Date(today);
    const diffDays = Math.floor((todayObj.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day
      currentStreak = existing.current_streak + 1;
    }
    // If diffDays > 1, streak resets to 1

    longestStreak = Math.max(currentStreak, existing.longest_streak);
  }

  const { data, error } = await supabase
    .from('learning_streaks')
    .upsert({
      agent_id: agentId,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_activity_date: today,
      total_lessons_completed: (existing?.total_lessons_completed || 0) + 1,
    } as never, {
      onConflict: 'agent_id',
    })
    .select()
    .single() as unknown as { data: LearningStreak | null; error: unknown };

  if (error) throw error;

  // Check streak achievements
  if (currentStreak === 3) {
    await awardAchievement(agentId, 'streak_3');
  } else if (currentStreak === 7) {
    await awardAchievement(agentId, 'streak_7');
  } else if (currentStreak === 30) {
    await awardAchievement(agentId, 'streak_30');
  }

  return data as LearningStreak;
}

export async function checkAchievements(
  agentId: string,
  event: 'lesson_completed' | 'course_completed' | 'quiz_passed' | 'certificate_earned',
  data?: Record<string, unknown>
): Promise<void> {
  const supabase = createAdminClient();

  switch (event) {
    case 'lesson_completed': {
      // Check for first lesson
      const { count: lessonCount } = await supabase
        .from('course_progress')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId)
        .eq('completed', true);

      if (lessonCount === 1) {
        await awardAchievement(agentId, 'first_lesson');
      }

      // Check for speed learner (5 lessons in one day)
      const today = new Date().toISOString().split('T')[0];
      const { count: todayCount } = await supabase
        .from('course_progress')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId)
        .eq('completed', true)
        .gte('completed_at', `${today}T00:00:00`)
        .lte('completed_at', `${today}T23:59:59`);

      if (todayCount === 5) {
        await awardAchievement(agentId, 'speed_learner');
      }

      // Check for early bird or night owl
      const hour = new Date().getHours();
      if (hour < 7) {
        await awardAchievement(agentId, 'early_bird');
      } else if (hour >= 23) {
        await awardAchievement(agentId, 'night_owl');
      }
      break;
    }

    case 'course_completed': {
      const { count: courseCount } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId)
        .not('completed_at', 'is', null);

      if (courseCount === 1) {
        await awardAchievement(agentId, 'first_course');
      }
      break;
    }

    case 'quiz_passed': {
      if (data?.percentage === 100) {
        await awardAchievement(agentId, 'quiz_perfect');
      }

      const { count: quizCount } = await supabase
        .from('quiz_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId)
        .eq('passed', true);

      if (quizCount === 10) {
        await awardAchievement(agentId, 'quiz_master');
      }
      break;
    }

    case 'certificate_earned': {
      const { count: certCount } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId);

      if (certCount === 1) {
        await awardAchievement(agentId, 'certified');
      }
      break;
    }
  }
}

export async function awardAchievement(agentId: string, achievementCode: string): Promise<void> {
  const supabase = createAdminClient();

  // Get achievement ID
  const { data: achievement } = await supabase
    .from('achievements')
    .select('id, points')
    .eq('code', achievementCode)
    .single() as unknown as { data: { id: string; points: number } | null };

  if (!achievement) return;

  // Check if already awarded
  const { data: existing } = await supabase
    .from('agent_achievements')
    .select('id')
    .eq('agent_id', agentId)
    .eq('achievement_id', achievement.id)
    .single() as unknown as { data: { id: string } | null };

  if (existing) return; // Already has this achievement

  // Award achievement
  await supabase
    .from('agent_achievements')
    .insert({
      agent_id: agentId,
      achievement_id: achievement.id,
    } as never);

  // Add points to streak record
  if (achievement.points > 0) {
    await supabase.rpc('add_points_to_streak' as never, {
      p_agent_id: agentId,
      p_points: achievement.points,
    } as never);
  }
}

// ============================================
// STATS OPERATIONS
// ============================================

export async function getAgentTrainingStats(agentId: string): Promise<AgentTrainingStats> {
  const supabase = createAdminClient();

  // Get enrollment counts
  const { count: enrolledCount } = await supabase
    .from('course_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('agent_id', agentId);

  const { count: completedCount } = await supabase
    .from('course_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('agent_id', agentId)
    .not('completed_at', 'is', null);

  const { count: lessonsCount } = await supabase
    .from('course_progress')
    .select('*', { count: 'exact', head: true })
    .eq('agent_id', agentId)
    .eq('completed', true);

  const { count: certCount } = await supabase
    .from('certificates')
    .select('*', { count: 'exact', head: true })
    .eq('agent_id', agentId);

  // Get streak data
  const { data: streak } = await supabase
    .from('learning_streaks')
    .select('*')
    .eq('agent_id', agentId)
    .single() as unknown as { data: LearningStreak | null };

  // Get achievements
  const { data: achievements } = await supabase
    .from('agent_achievements')
    .select('*, achievement:achievements(*)')
    .eq('agent_id', agentId)
    .order('earned_at', { ascending: false });

  // Get total time spent
  const { data: timeData } = await supabase
    .from('course_progress')
    .select('time_spent_seconds')
    .eq('agent_id', agentId) as unknown as { data: { time_spent_seconds: number }[] | null };

  const totalTimeSeconds = timeData?.reduce((acc: number, curr: { time_spent_seconds: number }) => acc + (curr.time_spent_seconds || 0), 0) || 0;

  return {
    total_courses_enrolled: enrolledCount || 0,
    total_courses_completed: completedCount || 0,
    total_lessons_completed: lessonsCount || 0,
    total_time_spent_minutes: Math.round(totalTimeSeconds / 60),
    total_certificates: certCount || 0,
    current_streak: streak?.current_streak || 0,
    longest_streak: streak?.longest_streak || 0,
    total_points: streak?.total_points || 0,
    achievements: achievements || [],
    recent_activity: [], // TODO: Implement recent activity feed
  };
}

// ============================================
// SLUG GENERATION
// ============================================

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}
