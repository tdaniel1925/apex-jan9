/**
 * Quiz Submission API
 * POST /api/training/quizzes/[quizId]/submit - Submit quiz answers
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { submitQuizAttempt, getQuizWithQuestions } from '@/lib/services/training-service';
import { ApiErrors, apiSuccess, handleZodError } from '@/lib/api/response';

const submitSchema = z.object({
  started_at: z.string().datetime(),
  answers: z.array(z.object({
    question_id: z.string().uuid(),
    selected_answers: z.array(z.string().uuid()),
  })),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return ApiErrors.unauthorized();
    }

    // Get agent by user_id
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single() as unknown as { data: { id: string } | null; error: unknown };

    if (agentError || !agent) {
      return ApiErrors.notFound('Agent');
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = submitSchema.safeParse(body);

    if (!parseResult.success) {
      return handleZodError(parseResult.error);
    }

    const { started_at, answers } = parseResult.data;

    const attempt = await submitQuizAttempt(
      agent.id,
      quizId,
      answers,
      started_at
    );

    // Get quiz details for response (with explanations now visible)
    const quiz = await getQuizWithQuestions(quizId);

    return apiSuccess({
      attempt,
      quiz: quiz ? {
        show_correct_answers: quiz.show_correct_answers,
        questions: quiz.show_correct_answers ? quiz.questions.map(q => ({
          id: q.id,
          explanation: q.explanation,
          answers: q.answers.map(a => ({
            id: a.id,
            answer_text: a.answer_text,
            is_correct: a.is_correct,
          })),
        })) : undefined,
      } : null,
    });

  } catch (error) {
    console.error('Error in quiz submission API:', error);

    if (error instanceof Error && error.message === 'Maximum attempts exceeded') {
      return ApiErrors.badRequest('Maximum attempts exceeded for this quiz');
    }

    return ApiErrors.internal();
  }
}
