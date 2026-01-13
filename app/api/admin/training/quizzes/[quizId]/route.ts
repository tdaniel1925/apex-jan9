/**
 * Admin Quiz Detail API
 * GET - Get quiz details with questions
 * PUT - Update quiz
 * DELETE - Delete quiz
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import type { Quiz, QuizQuestion, QuizAnswer } from '@/lib/types/training';

// Update quiz schema
const updateQuizSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  passing_score: z.number().int().min(0).max(100).optional(),
  time_limit_minutes: z.number().int().min(1).nullable().optional(),
  max_attempts: z.number().int().min(1).nullable().optional(),
  shuffle_questions: z.boolean().optional(),
  show_correct_answers: z.boolean().optional(),
  is_certification_exam: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

interface QuizAttemptRow { passed: boolean; score: number; max_score: number | null }

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { quizId } = await params;
    const supabase = createAdminClient();

    // Get quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single() as unknown as { data: Quiz | null; error: unknown };

    if (quizError || !quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Get questions with answers
    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order', { ascending: true }) as unknown as { data: QuizQuestion[] | null };

    const questionIds = questions?.map(q => q.id) || [];

    const { data: answers } = await supabase
      .from('quiz_answers')
      .select('*')
      .in('question_id', questionIds)
      .order('order', { ascending: true }) as unknown as { data: QuizAnswer[] | null };

    // Map answers to questions
    const answerMap = new Map<string, QuizAnswer[]>();
    answers?.forEach(a => {
      const existing = answerMap.get(a.question_id) || [];
      existing.push(a);
      answerMap.set(a.question_id, existing);
    });

    const questionsWithAnswers = (questions || []).map(q => ({
      ...q,
      answers: answerMap.get(q.id) || [],
    }));

    // Get attempt stats
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('passed, score, max_score')
      .eq('quiz_id', quizId) as unknown as { data: QuizAttemptRow[] | null };

    const stats = {
      total_attempts: attempts?.length || 0,
      passed_attempts: attempts?.filter(a => a.passed).length || 0,
      average_score: attempts?.length
        ? Math.round(
            attempts.reduce((sum, a) => sum + (a.max_score ? (a.score / a.max_score) * 100 : 0), 0) /
            attempts.length
          )
        : 0,
    };

    return NextResponse.json({
      quiz: {
        ...quiz,
        questions: questionsWithAnswers,
        stats,
      },
    });
  } catch (error) {
    console.error('Admin quiz GET error:', error);
    return serverErrorResponse();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { quizId } = await params;
    const supabase = createAdminClient();
    const body = await request.json();
    const parseResult = updateQuizSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    const updates = {
      ...parseResult.data,
      updated_at: new Date().toISOString(),
    };

    const { data: quiz, error: updateError } = await supabase
      .from('quizzes')
      .update(updates as never)
      .eq('id', quizId)
      .select()
      .single() as unknown as { data: Quiz | null; error: unknown };

    if (updateError) {
      console.error('Quiz update error:', updateError);
      return serverErrorResponse();
    }

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error('Admin quiz PUT error:', error);
    return serverErrorResponse();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { quizId } = await params;
    const supabase = createAdminClient();

    // Check if quiz has attempts
    const { count: attempts } = await supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quizId) as unknown as { count: number | null };

    if (attempts && attempts > 0) {
      return badRequestResponse(
        'Cannot delete quiz with existing attempts. Deactivate it instead.'
      );
    }

    const { error: deleteError } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizId);

    if (deleteError) {
      console.error('Quiz delete error:', deleteError);
      return serverErrorResponse();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin quiz DELETE error:', error);
    return serverErrorResponse();
  }
}
