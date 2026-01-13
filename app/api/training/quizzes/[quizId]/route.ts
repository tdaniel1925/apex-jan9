/**
 * Quiz API
 * GET /api/training/quizzes/[quizId] - Get quiz with questions (answers hidden)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { getQuizWithQuestions } from '@/lib/services/training-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get agent by user_id (verify they exist)
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single() as unknown as { data: { id: string } | null; error: unknown };

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    const quiz = await getQuizWithQuestions(quizId);

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Get previous attempts count
    const { count: attemptCount } = await supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agent.id)
      .eq('quiz_id', quizId) as unknown as { count: number | null };

    // Hide correct answers from the response
    const sanitizedQuiz = {
      ...quiz,
      attempts_used: attemptCount || 0,
      questions: quiz.questions.map(q => ({
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

    return NextResponse.json({ quiz: sanitizedQuiz });

  } catch (error) {
    console.error('Error in quiz API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
