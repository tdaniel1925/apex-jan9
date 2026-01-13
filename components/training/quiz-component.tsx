'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  HelpCircle,
  Send,
  RotateCcw,
  Trophy,
  AlertTriangle
} from 'lucide-react';
import type { Quiz, QuizQuestion, QuizAnswer, QuizAttempt } from '@/lib/types/training';

interface QuizComponentProps {
  quiz: Quiz & {
    attempts_used?: number;
    questions: (QuizQuestion & { answers: QuizAnswer[] })[];
  };
  onComplete: (attempt: QuizAttempt) => void;
  onCancel?: () => void;
}

interface UserAnswer {
  question_id: string;
  selected_answers: string[];
}

export function QuizComponent({ quiz, onComplete, onCancel }: QuizComponentProps) {
  const [currentStep, setCurrentStep] = useState<'intro' | 'quiz' | 'review' | 'results'>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Map<string, string[]>>(new Map());
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [quizResults, setQuizResults] = useState<{
    show_correct_answers?: boolean;
    questions?: Array<{
      id: string;
      explanation?: string;
      answers: Array<{ id: string; answer_text: string; is_correct: boolean }>;
    }>;
  } | null>(null);

  // Shuffle questions if needed
  const questions = useMemo(() => {
    if (quiz.shuffle_questions) {
      return [...quiz.questions].sort(() => Math.random() - 0.5);
    }
    return quiz.questions;
  }, [quiz.questions, quiz.shuffle_questions]);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const answeredCount = userAnswers.size;
  const progress = (answeredCount / totalQuestions) * 100;

  // Check if max attempts reached
  const attemptsRemaining = quiz.max_attempts
    ? quiz.max_attempts - (quiz.attempts_used || 0)
    : null;
  const canTakeQuiz = attemptsRemaining === null || attemptsRemaining > 0;

  // Timer effect
  useEffect(() => {
    if (currentStep !== 'quiz' || !quiz.time_limit_minutes || timeRemaining === null) return;

    if (timeRemaining <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [currentStep, timeRemaining, quiz.time_limit_minutes]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startQuiz = () => {
    const now = new Date().toISOString();
    setStartedAt(now);
    if (quiz.time_limit_minutes) {
      setTimeRemaining(quiz.time_limit_minutes * 60);
    }
    setCurrentStep('quiz');
  };

  const handleAnswerSelect = (answerId: string) => {
    if (!currentQuestion) return;

    const questionId = currentQuestion.id;
    const currentAnswers = userAnswers.get(questionId) || [];
    const questionType = currentQuestion.question_type;

    let newAnswers: string[];

    if (questionType === 'multiple_select') {
      // Toggle selection for multiple select
      if (currentAnswers.includes(answerId)) {
        newAnswers = currentAnswers.filter(id => id !== answerId);
      } else {
        newAnswers = [...currentAnswers, answerId];
      }
    } else {
      // Single selection for multiple_choice and true_false
      newAnswers = [answerId];
    }

    setUserAnswers(new Map(userAnswers.set(questionId, newAnswers)));
  };

  const toggleFlagged = () => {
    if (!currentQuestion) return;
    const newFlagged = new Set(flaggedQuestions);
    if (newFlagged.has(currentQuestion.id)) {
      newFlagged.delete(currentQuestion.id);
    } else {
      newFlagged.add(currentQuestion.id);
    }
    setFlaggedQuestions(newFlagged);
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentQuestionIndex(index);
    }
  };

  const handleReview = () => {
    setCurrentStep('review');
  };

  const handleSubmit = useCallback(async () => {
    if (submitting || !startedAt) return;
    setSubmitting(true);

    try {
      const answersArray: UserAnswer[] = [];
      questions.forEach(q => {
        answersArray.push({
          question_id: q.id,
          selected_answers: userAnswers.get(q.id) || [],
        });
      });

      const res = await fetch(`/api/training/quizzes/${quiz.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          started_at: startedAt,
          answers: answersArray,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAttempt(data.attempt);
        setQuizResults(data.quiz);
        setCurrentStep('results');
        onComplete(data.attempt);
      } else {
        const error = await res.json();
        console.error('Quiz submission failed:', error);
        alert(error.error || 'Failed to submit quiz');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [submitting, startedAt, questions, userAnswers, quiz.id, onComplete]);

  // Intro Screen
  if (currentStep === 'intro') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            {quiz.title}
          </CardTitle>
          {quiz.description && (
            <CardDescription>{quiz.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quiz Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Questions</p>
              <p className="font-semibold">{totalQuestions}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Passing Score</p>
              <p className="font-semibold">{quiz.passing_score}%</p>
            </div>
            {quiz.time_limit_minutes && (
              <div>
                <p className="text-sm text-muted-foreground">Time Limit</p>
                <p className="font-semibold">{quiz.time_limit_minutes} minutes</p>
              </div>
            )}
            {quiz.max_attempts && (
              <div>
                <p className="text-sm text-muted-foreground">Attempts</p>
                <p className="font-semibold">
                  {quiz.attempts_used || 0} / {quiz.max_attempts} used
                </p>
              </div>
            )}
          </div>

          {/* Warnings */}
          {!canTakeQuiz && (
            <div className="flex items-center gap-2 p-4 bg-red-50 text-red-800 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span>You have used all available attempts for this quiz.</span>
            </div>
          )}

          {quiz.time_limit_minutes && canTakeQuiz && (
            <div className="flex items-center gap-2 p-4 bg-yellow-50 text-yellow-800 rounded-lg">
              <Clock className="h-5 w-5" />
              <span>
                This quiz has a time limit. Once started, you cannot pause the timer.
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button onClick={startQuiz} disabled={!canTakeQuiz} className="flex-1">
              {canTakeQuiz ? 'Start Quiz' : 'No Attempts Remaining'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Quiz Screen
  if (currentStep === 'quiz' && currentQuestion) {
    const selectedAnswers = userAnswers.get(currentQuestion.id) || [];
    const isFlagged = flaggedQuestions.has(currentQuestion.id);
    const isMultiSelect = currentQuestion.question_type === 'multiple_select';

    return (
      <Card>
        {/* Header with Timer */}
        <CardHeader className="pb-4 border-b">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">{quiz.title}</p>
              <CardTitle className="text-lg">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </CardTitle>
            </div>
            {timeRemaining !== null && (
              <div className={`flex items-center gap-2 font-mono text-lg ${
                timeRemaining < 60 ? 'text-red-600' : timeRemaining < 300 ? 'text-yellow-600' : ''
              }`}>
                <Clock className="h-5 w-5" />
                {formatTime(timeRemaining)}
              </div>
            )}
          </div>
          <Progress value={progress} className="h-2 mt-2" />
        </CardHeader>

        <CardContent className="py-6 space-y-6">
          {/* Question */}
          <div className="space-y-4">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="shrink-0">
                {currentQuestion.question_type === 'true_false' ? 'True/False' :
                  currentQuestion.question_type === 'multiple_select' ? 'Select All' :
                    'Multiple Choice'}
              </Badge>
              {currentQuestion.points && currentQuestion.points > 1 && (
                <Badge variant="secondary">{currentQuestion.points} pts</Badge>
              )}
            </div>
            <p className="text-lg font-medium">{currentQuestion.question_text}</p>
            {isMultiSelect && (
              <p className="text-sm text-muted-foreground">Select all that apply</p>
            )}
          </div>

          {/* Answers */}
          <div className="space-y-3">
            {currentQuestion.answers
              .sort((a, b) => a.order - b.order)
              .map(answer => {
                const isSelected = selectedAnswers.includes(answer.id);

                return (
                  <button
                    key={answer.id}
                    onClick={() => handleAnswerSelect(answer.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/25'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isMultiSelect ? (
                        <Checkbox checked={isSelected} />
                      ) : (
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-primary' : 'border-muted-foreground/50'
                        }`}>
                          {isSelected && (
                            <div className="w-3 h-3 rounded-full bg-primary" />
                          )}
                        </div>
                      )}
                      <span>{answer.answer_text}</span>
                    </div>
                  </button>
                );
              })}
          </div>

          {/* Question Navigation Dots */}
          <div className="flex flex-wrap gap-1 justify-center py-2">
            {questions.map((q, i) => {
              const isAnswered = userAnswers.has(q.id);
              const isFlagged = flaggedQuestions.has(q.id);
              const isCurrent = i === currentQuestionIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => goToQuestion(i)}
                  className={`w-8 h-8 rounded-md text-xs font-medium transition-colors ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground'
                      : isAnswered
                        ? 'bg-green-100 text-green-800'
                        : 'bg-muted hover:bg-muted/80'
                  } ${isFlagged ? 'ring-2 ring-yellow-500' : ''}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </CardContent>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFlagged}
              className={isFlagged ? 'text-yellow-600' : ''}
            >
              <Flag className={`h-4 w-4 mr-1 ${isFlagged ? 'fill-yellow-600' : ''}`} />
              {isFlagged ? 'Flagged' : 'Flag'}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => goToQuestion(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            {currentQuestionIndex < totalQuestions - 1 ? (
              <Button onClick={() => goToQuestion(currentQuestionIndex + 1)}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleReview}>
                Review & Submit
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Review Screen
  if (currentStep === 'review') {
    const unanswered = questions.filter(q => !userAnswers.has(q.id) || userAnswers.get(q.id)!.length === 0);

    return (
      <Card>
        <CardHeader>
          <CardTitle>Review Your Answers</CardTitle>
          <CardDescription>
            Review your answers before submitting. You can go back to change any answer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Answered</p>
              <p className="font-semibold text-green-600">{answeredCount} / {totalQuestions}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Flagged</p>
              <p className="font-semibold text-yellow-600">{flaggedQuestions.size}</p>
            </div>
          </div>

          {/* Warnings */}
          {unanswered.length > 0 && (
            <div className="flex items-start gap-2 p-4 bg-yellow-50 text-yellow-800 rounded-lg">
              <AlertTriangle className="h-5 w-5 mt-0.5" />
              <div>
                <p className="font-medium">Unanswered Questions</p>
                <p className="text-sm">
                  You have {unanswered.length} unanswered question{unanswered.length > 1 ? 's' : ''}.
                  These will be marked as incorrect.
                </p>
              </div>
            </div>
          )}

          {/* Question List */}
          <div className="space-y-2">
            {questions.map((q, i) => {
              const isAnswered = userAnswers.has(q.id) && userAnswers.get(q.id)!.length > 0;
              const isFlagged = flaggedQuestions.has(q.id);

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentQuestionIndex(i);
                    setCurrentStep('quiz');
                  }}
                  className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isAnswered ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate">{q.question_text}</span>
                    {isFlagged && <Flag className="h-4 w-4 text-yellow-600 fill-yellow-600" />}
                    {isAnswered ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setCurrentStep('quiz')}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Quiz
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? (
                'Submitting...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Quiz
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Results Screen
  if (currentStep === 'results' && attempt) {
    const passed = attempt.passed;

    return (
      <Card>
        <CardContent className="pt-8 space-y-6">
          {/* Result Icon */}
          <div className="text-center">
            {passed ? (
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
                <Trophy className="h-10 w-10 text-green-600" />
              </div>
            ) : (
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-4">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
            )}
            <h2 className="text-2xl font-bold">
              {passed ? 'Congratulations!' : 'Keep Practicing'}
            </h2>
            <p className="text-muted-foreground">
              {passed
                ? 'You passed the quiz!'
                : `You needed ${quiz.passing_score}% to pass.`}
            </p>
          </div>

          {/* Score */}
          <div className="text-center">
            <div className={`text-5xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
              {attempt.score}%
            </div>
            <p className="text-muted-foreground">Your Score</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg text-center">
            <div>
              <p className="text-2xl font-bold">{totalQuestions}</p>
              <p className="text-sm text-muted-foreground">Questions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {Math.round((attempt.score / 100) * totalQuestions)}
              </p>
              <p className="text-sm text-muted-foreground">Correct</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {totalQuestions - Math.round((attempt.score / 100) * totalQuestions)}
              </p>
              <p className="text-sm text-muted-foreground">Incorrect</p>
            </div>
          </div>

          {/* Show Correct Answers (if enabled) */}
          {quizResults?.show_correct_answers && quizResults.questions && (
            <div className="space-y-3 pt-4 border-t">
              <h3 className="font-semibold">Review Answers</h3>
              {quizResults.questions.map((q, i) => {
                const userAnswer = userAnswers.get(q.id) || [];
                const correctAnswers = q.answers.filter(a => a.is_correct);

                return (
                  <div key={q.id} className="p-4 rounded-lg border">
                    <p className="font-medium mb-2">
                      {i + 1}. {questions.find(qq => qq.id === q.id)?.question_text}
                    </p>
                    <div className="space-y-1 text-sm">
                      {q.answers.map(a => {
                        const isSelected = userAnswer.includes(a.id);
                        const isCorrect = a.is_correct;

                        return (
                          <div
                            key={a.id}
                            className={`flex items-center gap-2 ${
                              isCorrect ? 'text-green-700' : isSelected ? 'text-red-700' : ''
                            }`}
                          >
                            {isCorrect ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : isSelected ? (
                              <XCircle className="h-4 w-4 text-red-600" />
                            ) : (
                              <div className="w-4 h-4" />
                            )}
                            <span>{a.answer_text}</span>
                            {isSelected && <Badge variant="outline" className="text-xs">Your answer</Badge>}
                          </div>
                        );
                      })}
                    </div>
                    {q.explanation && (
                      <p className="mt-2 text-sm text-muted-foreground bg-muted p-2 rounded">
                        <strong>Explanation:</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {!passed && attemptsRemaining !== null && attemptsRemaining > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentStep('intro');
                  setUserAnswers(new Map());
                  setFlaggedQuestions(new Set());
                  setStartedAt(null);
                  setTimeRemaining(null);
                  setAttempt(null);
                  setQuizResults(null);
                  setCurrentQuestionIndex(0);
                }}
                className="flex-1"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again ({attemptsRemaining - 1} attempts left)
              </Button>
            )}
            {onCancel && (
              <Button onClick={onCancel} className="flex-1">
                Continue
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

export default QuizComponent;
