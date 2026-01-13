/**
 * Admin Quizzes API
 * GET - List all quizzes
 * POST - Create a new quiz
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import type { Quiz } from '@/lib/types/training';

// Query params schema
const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  course_id: z.string().uuid().optional(),
  is_certification_exam: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

// Answer schema for questions
const answerSchema = z.object({
  answer_text: z.string().min(1).max(500),
  is_correct: z.boolean(),
  order: z.number().int().min(0).optional(),
});

// Question schema
const questionSchema = z.object({
  question_type: z.enum(['multiple_choice', 'true_false', 'multiple_select', 'short_answer']),
  question_text: z.string().min(1).max(2000),
  explanation: z.string().max(2000).optional(),
  points: z.number().int().min(1).default(1),
  order: z.number().int().min(0).optional(),
  answers: z.array(answerSchema).min(1),
});

// Create quiz schema
const createQuizSchema = z.object({
  lesson_id: z.string().uuid().optional(),
  course_id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  passing_score: z.number().int().min(0).max(100).default(70),
  time_limit_minutes: z.number().int().min(1).optional(),
  max_attempts: z.number().int().min(1).optional(),
  shuffle_questions: z.boolean().default(true),
  show_correct_answers: z.boolean().default(true),
  is_certification_exam: z.boolean().default(false),
  is_active: z.boolean().default(true),
  questions: z.array(questionSchema).optional(),
});

interface QuizRow { quiz_id: string }
interface QuizWithRelations extends Quiz {
  course?: { id: string; title: string } | null;
  lesson?: { id: string; title: string } | null;
}

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const supabase = createAdminClient();
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parseResult = querySchema.safeParse(searchParams);

    if (!parseResult.success) {
      return badRequestResponse('Invalid query parameters', parseResult.error.flatten());
    }

    const { limit, offset, course_id, is_certification_exam, search } = parseResult.data;

    // Build query
    let query = supabase
      .from('quizzes')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (course_id) {
      query = query.eq('course_id', course_id);
    }

    if (is_certification_exam !== undefined) {
      query = query.eq('is_certification_exam', is_certification_exam);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: quizzes, error, count } = await query as unknown as {
      data: Quiz[] | null;
      error: unknown;
      count: number | null
    };

    if (error) {
      console.error('Quizzes fetch error:', error);
      return serverErrorResponse();
    }

    // Get question counts per quiz
    const quizIds = (quizzes || []).map(q => q.id);
    const { data: questionCounts } = await supabase
      .from('quiz_questions')
      .select('quiz_id')
      .in('quiz_id', quizIds) as unknown as { data: QuizRow[] | null };

    const quizQuestionCounts = new Map<string, number>();
    questionCounts?.forEach(q => {
      quizQuestionCounts.set(q.quiz_id, (quizQuestionCounts.get(q.quiz_id) || 0) + 1);
    });

    // Get attempt counts per quiz
    const { data: attemptCounts } = await supabase
      .from('quiz_attempts')
      .select('quiz_id')
      .in('quiz_id', quizIds) as unknown as { data: QuizRow[] | null };

    const quizAttemptCounts = new Map<string, number>();
    attemptCounts?.forEach(a => {
      quizAttemptCounts.set(a.quiz_id, (quizAttemptCounts.get(a.quiz_id) || 0) + 1);
    });

    // Enrich quizzes
    const quizzesWithCounts = (quizzes || []).map(quiz => ({
      ...quiz,
      questions_count: quizQuestionCounts.get(quiz.id) || 0,
      attempts_count: quizAttemptCounts.get(quiz.id) || 0,
    }));

    return NextResponse.json({
      quizzes: quizzesWithCounts,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Admin quizzes GET error:', error);
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const parseResult = createQuizSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten());
    }

    const { questions, ...quizData } = parseResult.data;

    // Create quiz
    const { data: quiz, error: createError } = await supabase
      .from('quizzes')
      .insert(quizData as never)
      .select()
      .single() as unknown as { data: Quiz | null; error: unknown };

    if (createError || !quiz) {
      console.error('Quiz create error:', createError);
      return serverErrorResponse();
    }

    // Add questions if provided
    if (questions && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const { answers, ...questionData } = questions[i];

        // Create question
        const { data: question, error: questionError } = await supabase
          .from('quiz_questions')
          .insert({
            quiz_id: quiz.id,
            ...questionData,
            order: questionData.order ?? i,
          } as never)
          .select()
          .single() as unknown as { data: { id: string } | null; error: unknown };

        if (questionError || !question) {
          console.error('Question create error:', questionError);
          continue;
        }

        // Create answers
        if (answers && answers.length > 0) {
          const answerData = answers.map((a, j) => ({
            question_id: question.id,
            answer_text: a.answer_text,
            is_correct: a.is_correct,
            order: a.order ?? j,
          }));

          await supabase.from('quiz_answers').insert(answerData as never);
        }
      }
    }

    return NextResponse.json({ quiz }, { status: 201 });
  } catch (error) {
    console.error('Admin quizzes POST error:', error);
    return serverErrorResponse();
  }
}
