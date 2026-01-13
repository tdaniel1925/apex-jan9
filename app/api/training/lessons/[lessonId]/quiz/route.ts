/**
 * Lesson Quiz API
 * GET /api/training/lessons/[lessonId]/quiz - Get quiz associated with a lesson
 */

import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { getQuizWithQuestions } from '@/lib/services/training-service';
import { ApiErrors, apiSuccess } from '@/lib/api/response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return ApiErrors.unauthorized();
    }

    // Get agent by user_id (verify they exist)
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single() as unknown as { data: { id: string } | null; error: unknown };

    if (agentError || !agent) {
      return ApiErrors.notFound('Agent');
    }

    // Find quiz associated with this lesson
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id')
      .eq('lesson_id', lessonId)
      .single() as unknown as { data: { id: string } | null; error: unknown };

    if (quizError || !quiz) {
      return ApiErrors.notFound('Quiz for this lesson');
    }

    // Get full quiz with questions
    const fullQuiz = await getQuizWithQuestions(quiz.id);

    if (!fullQuiz) {
      return ApiErrors.notFound('Quiz');
    }

    // Get previous attempts count
    const { count: attemptCount } = await supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agent.id)
      .eq('quiz_id', quiz.id) as unknown as { count: number | null };

    // Hide correct answers from the response
    const sanitizedQuiz = {
      ...fullQuiz,
      attempts_used: attemptCount || 0,
      questions: fullQuiz.questions.map(q => ({
        ...q,
        answers: q.answers.map(a => ({
          id: a.id,
          answer_text: a.answer_text,
          order: a.order,
          // is_correct is NOT included
        })),
        // explanation is hidden until after submission
        explanation: undefined,
      })),
    };

    return apiSuccess({ quiz: sanitizedQuiz });

  } catch (error) {
    console.error('Error in lesson quiz API:', error);
    return ApiErrors.internal();
  }
}
