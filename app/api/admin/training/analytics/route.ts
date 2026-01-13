/**
 * Admin Training Analytics API
 * GET - Get training analytics and stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, serverErrorResponse } from '@/lib/auth/admin-auth';

interface EnrollmentRow { course_id: string; courses: { title: string } | null }
interface ProgressRow {
  completed_at: string | null;
  agent: { first_name: string; last_name: string } | null;
  lesson: { title: string } | null;
  course: { title: string } | null;
}
interface AchievementRow { achievement_id: string; achievement: { title: string } | null }

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days

    const periodDate = new Date();
    periodDate.setDate(periodDate.getDate() - parseInt(period));
    const periodISO = periodDate.toISOString();

    // Overall stats
    const { count: totalCourses } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published') as unknown as { count: number | null };

    const { count: totalLessons } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true }) as unknown as { count: number | null };

    const { count: totalEnrollments } = await supabase
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true }) as unknown as { count: number | null };

    const { count: completedEnrollments } = await supabase
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })
      .not('completed_at', 'is', null) as unknown as { count: number | null };

    const { count: totalCertificates } = await supabase
      .from('certificates')
      .select('*', { count: 'exact', head: true }) as unknown as { count: number | null };

    const { count: totalQuizAttempts } = await supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true }) as unknown as { count: number | null };

    const { count: passedQuizAttempts } = await supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('passed', true) as unknown as { count: number | null };

    // Period stats
    const { count: periodEnrollments } = await supabase
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })
      .gte('enrolled_at', periodISO) as unknown as { count: number | null };

    const { count: periodCompletions } = await supabase
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })
      .gte('completed_at', periodISO) as unknown as { count: number | null };

    const { count: periodCertificates } = await supabase
      .from('certificates')
      .select('*', { count: 'exact', head: true })
      .gte('issued_at', periodISO) as unknown as { count: number | null };

    // Top courses by enrollment
    const { data: topCourses } = await supabase
      .from('course_enrollments')
      .select('course_id, courses(id, title)')
      .order('enrolled_at', { ascending: false })
      .limit(100) as unknown as { data: EnrollmentRow[] | null };

    const courseEnrollmentCounts = new Map<string, { title: string; count: number }>();
    topCourses?.forEach(e => {
      const courseId = e.course_id;
      const existing = courseEnrollmentCounts.get(courseId);
      if (existing) {
        existing.count++;
      } else {
        courseEnrollmentCounts.set(courseId, {
          title: e.courses?.title || 'Unknown',
          count: 1,
        });
      }
    });

    const topCoursesRanked = Array.from(courseEnrollmentCounts.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Recent activity
    const { data: recentProgress } = await supabase
      .from('course_progress')
      .select('completed_at, agent:agents(first_name, last_name), lesson:lessons(title), course:courses(title)')
      .eq('completed', true)
      .order('completed_at', { ascending: false })
      .limit(20) as unknown as { data: ProgressRow[] | null };

    // Achievement stats
    const { data: achievementCounts } = await supabase
      .from('agent_achievements')
      .select('achievement_id, achievement:achievements(title, code)') as unknown as { data: AchievementRow[] | null };

    const achievementStats = new Map<string, { title: string; count: number }>();
    achievementCounts?.forEach(aa => {
      const achievementId = aa.achievement_id;
      const existing = achievementStats.get(achievementId);
      if (existing) {
        existing.count++;
      } else {
        achievementStats.set(achievementId, {
          title: aa.achievement?.title || 'Unknown',
          count: 1,
        });
      }
    });

    const achievementDistribution = Array.from(achievementStats.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      overall: {
        total_courses: totalCourses || 0,
        total_lessons: totalLessons || 0,
        total_enrollments: totalEnrollments || 0,
        completed_enrollments: completedEnrollments || 0,
        completion_rate: totalEnrollments
          ? Math.round(((completedEnrollments || 0) / totalEnrollments) * 100)
          : 0,
        total_certificates: totalCertificates || 0,
        total_quiz_attempts: totalQuizAttempts || 0,
        quiz_pass_rate: totalQuizAttempts
          ? Math.round(((passedQuizAttempts || 0) / (totalQuizAttempts || 1)) * 100)
          : 0,
      },
      period: {
        days: parseInt(period),
        enrollments: periodEnrollments || 0,
        completions: periodCompletions || 0,
        certificates: periodCertificates || 0,
      },
      top_courses: topCoursesRanked,
      recent_activity: (recentProgress || []).map(p => ({
        agent_name: `${p.agent?.first_name || ''} ${p.agent?.last_name || ''}`.trim(),
        lesson_title: p.lesson?.title,
        course_title: p.course?.title,
        completed_at: p.completed_at,
      })),
      achievement_distribution: achievementDistribution,
    });
  } catch (error) {
    console.error('Admin training analytics error:', error);
    return serverErrorResponse();
  }
}
