'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { QuizComponent } from '@/components/training/quiz-component';
import type { Quiz, QuizQuestion, QuizAnswer, QuizAttempt } from '@/lib/types/training';

interface QuizWithQuestions extends Quiz {
  attempts_used?: number;
  questions: (QuizQuestion & { answers: QuizAnswer[] })[];
}

export default function QuizPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = use(params);
  const router = useRouter();

  const [quiz, setQuiz] = useState<QuizWithQuestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuiz() {
      try {
        const res = await fetch(`/api/training/quizzes/${quizId}`);
        if (res.ok) {
          const data = await res.json();
          setQuiz(data.quiz || null);
        } else {
          const err = await res.json();
          setError(err.error || 'Failed to load quiz');
        }
      } catch (error) {
        console.error('Error fetching quiz:', error);
        setError('Failed to load quiz');
      } finally {
        setLoading(false);
      }
    }
    fetchQuiz();
  }, [quizId]);

  const handleComplete = (attempt: QuizAttempt) => {
    // Quiz completed - could trigger certificate issuance, etc.
    console.log('Quiz completed:', attempt);
  };

  const handleCancel = () => {
    // Navigate back to the course or training page
    if (quiz?.course_id) {
      router.push(`/dashboard/training/courses/${quiz.course_id}`);
    } else if (quiz?.lesson_id) {
      // Find the course for this lesson and navigate there
      router.push('/dashboard/training');
    } else {
      router.push('/dashboard/training');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/training">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Quiz Not Found</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {error || 'The quiz you\'re looking for doesn\'t exist or you don\'t have access to it.'}
            </p>
            <Link href="/dashboard/training">
              <Button className="mt-4">Back to Training</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <p className="text-sm text-muted-foreground">Quiz</p>
          <h1 className="text-xl font-bold">{quiz.title}</h1>
        </div>
      </div>

      {/* Quiz Component */}
      <QuizComponent
        quiz={quiz}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </div>
  );
}
