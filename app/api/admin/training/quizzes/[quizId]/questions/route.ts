/**
 * Admin Quiz Questions API
 * POST - Add a new question to a quiz
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import type { QuizQuestion, QuizAnswer } from '@/lib/types/training';

// Answer schema
const answerSchema = z.object({
  answer_text: z.string().min(1).max(500),
  is_correct: z.boolean(),
  order: z.number().int().min(0).optional(),
});

// Create question schema
const createQuestionSchema = z.object({
  question_type: z.enum(['multiple_choice', 'true_false', 'multiple_select', 'short_answer']),
  question_text: z.string().min(1).max(2000),
  explanation: z.string().max(2000).optional(),
  points: z.number().int().min(1).default(1),
  order: z.number().int().min(0).optional(),
  answers: z.array(answerSchema).min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const { quizId } = await params;
    const supabase = createAdminClient();
    const body = await request.json();
    const parseResult = createQuestionSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    const { answers, ...questionData } = parseResult.data;

    // Verify quiz exists
    const { data: quiz } = await supabase
      .from('quizzes')
      .select('id')
      .eq('id', quizId)
      .single() as unknown as { data: { id: string } | null };

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Get next order if not provided
    let order = questionData.order;
    if (order === undefined) {
      const { data: lastQuestion } = await supabase
        .from('quiz_questions')
        .select('order')
        .eq('quiz_id', quizId)
        .order('order', { ascending: false })
        .limit(1)
        .single() as unknown as { data: { order: number } | null };
      order = (lastQuestion?.order || 0) + 1;
    }

    // Create question
    const { data: question, error: createError } = await supabase
      .from('quiz_questions')
      .insert({
        quiz_id: quizId,
        ...questionData,
        order,
      } as never)
      .select()
      .single() as unknown as { data: QuizQuestion | null; error: unknown };

    if (createError || !question) {
      console.error('Question create error:', createError);
      return serverErrorResponse();
    }

    // Create answers
    const answerData = answers.map((a, i) => ({
      question_id: question.id,
      answer_text: a.answer_text,
      is_correct: a.is_correct,
      order: a.order ?? i,
    }));

    const { data: createdAnswers, error: answersError } = await supabase
      .from('quiz_answers')
      .insert(answerData as never)
      .select() as unknown as { data: QuizAnswer[] | null; error: unknown };

    if (answersError) {
      console.error('Answers create error:', answersError);
    }

    return NextResponse.json({
      question: {
        ...question,
        answers: createdAnswers || [],
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Admin question POST error:', error);
    return serverErrorResponse();
  }
}
