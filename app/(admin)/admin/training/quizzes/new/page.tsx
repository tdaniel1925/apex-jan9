'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  CheckCircle2,
  Save,
  HelpCircle,
  AlertCircle
} from 'lucide-react';

interface Answer {
  id: string;
  answer_text: string;
  is_correct: boolean;
}

interface Question {
  id: string;
  question_type: 'multiple_choice' | 'true_false' | 'multiple_select';
  question_text: string;
  explanation?: string;
  points: number;
  answers: Answer[];
}

export default function NewQuizPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quiz settings
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [passingScore, setPassingScore] = useState(70);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | null>(null);
  const [maxAttempts, setMaxAttempts] = useState<number | null>(3);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(true);
  const [isCertificationExam, setIsCertificationExam] = useState(false);

  // Questions
  const [questions, setQuestions] = useState<Question[]>([]);

  const addQuestion = (type: 'multiple_choice' | 'true_false' | 'multiple_select') => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      question_type: type,
      question_text: '',
      points: 1,
      answers: type === 'true_false'
        ? [
          { id: crypto.randomUUID(), answer_text: 'True', is_correct: false },
          { id: crypto.randomUUID(), answer_text: 'False', is_correct: false },
        ]
        : [
          { id: crypto.randomUUID(), answer_text: '', is_correct: false },
          { id: crypto.randomUUID(), answer_text: '', is_correct: false },
        ],
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q =>
      q.id === questionId ? { ...q, ...updates } : q
    ));
  };

  const deleteQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const addAnswer = (questionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id !== questionId) return q;
      return {
        ...q,
        answers: [...q.answers, {
          id: crypto.randomUUID(),
          answer_text: '',
          is_correct: false,
        }],
      };
    }));
  };

  const updateAnswer = (questionId: string, answerId: string, updates: Partial<Answer>) => {
    setQuestions(questions.map(q => {
      if (q.id !== questionId) return q;

      // For single-select questions, ensure only one answer is correct
      if (updates.is_correct && q.question_type !== 'multiple_select') {
        return {
          ...q,
          answers: q.answers.map(a => ({
            ...a,
            is_correct: a.id === answerId,
            ...(a.id === answerId ? updates : {}),
          })),
        };
      }

      return {
        ...q,
        answers: q.answers.map(a =>
          a.id === answerId ? { ...a, ...updates } : a
        ),
      };
    }));
  };

  const deleteAnswer = (questionId: string, answerId: string) => {
    setQuestions(questions.map(q => {
      if (q.id !== questionId) return q;
      return {
        ...q,
        answers: q.answers.filter(a => a.id !== answerId),
      };
    }));
  };

  const validateQuiz = (): string | null => {
    if (!title.trim()) return 'Quiz title is required';
    if (questions.length === 0) return 'At least one question is required';

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        return `Question ${i + 1} text is required`;
      }

      const hasCorrect = q.answers.some(a => a.is_correct);
      if (!hasCorrect) {
        return `Question ${i + 1} must have at least one correct answer`;
      }

      for (let j = 0; j < q.answers.length; j++) {
        if (!q.answers[j].answer_text.trim()) {
          return `Question ${i + 1}, Answer ${j + 1} text is required`;
        }
      }
    }

    return null;
  };

  const handleSave = async () => {
    const validationError = validateQuiz();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        title,
        description: description || undefined,
        passing_score: passingScore,
        time_limit_minutes: timeLimitMinutes || undefined,
        max_attempts: maxAttempts || undefined,
        shuffle_questions: shuffleQuestions,
        show_correct_answers: showCorrectAnswers,
        is_certification_exam: isCertificationExam,
        questions: questions.map((q, i) => ({
          question_type: q.question_type,
          question_text: q.question_text,
          explanation: q.explanation || undefined,
          points: q.points,
          order: i,
          answers: q.answers.map((a, j) => ({
            answer_text: a.answer_text,
            is_correct: a.is_correct,
            order: j,
          })),
        })),
      };

      const res = await fetch('/api/admin/training/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push('/admin/training/quizzes');
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to create quiz');
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      setError('Failed to create quiz');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/training/quizzes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Create Quiz</h1>
          <p className="text-muted-foreground">
            Build a new quiz with questions and answers
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Quiz'}
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-800">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Quiz Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Settings</CardTitle>
          <CardDescription>
            Configure the basic quiz information and behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Quiz Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Life Insurance Fundamentals Quiz"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passing_score">Passing Score (%)</Label>
              <Input
                id="passing_score"
                type="number"
                min={0}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this quiz covers..."
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="time_limit">Time Limit (minutes)</Label>
              <Input
                id="time_limit"
                type="number"
                min={1}
                value={timeLimitMinutes || ''}
                onChange={(e) => setTimeLimitMinutes(e.target.value ? Number(e.target.value) : null)}
                placeholder="No limit"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_attempts">Max Attempts</Label>
              <Input
                id="max_attempts"
                type="number"
                min={1}
                value={maxAttempts || ''}
                onChange={(e) => setMaxAttempts(e.target.value ? Number(e.target.value) : null)}
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Shuffle Questions</Label>
                <p className="text-sm text-muted-foreground">
                  Randomize question order for each attempt
                </p>
              </div>
              <Switch
                checked={shuffleQuestions}
                onCheckedChange={setShuffleQuestions}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Show Correct Answers</Label>
                <p className="text-sm text-muted-foreground">
                  Display correct answers after submission
                </p>
              </div>
              <Switch
                checked={showCorrectAnswers}
                onCheckedChange={setShowCorrectAnswers}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Certification Exam</Label>
                <p className="text-sm text-muted-foreground">
                  Issues a certificate upon passing
                </p>
              </div>
              <Switch
                checked={isCertificationExam}
                onCheckedChange={setIsCertificationExam}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Questions</CardTitle>
              <CardDescription>
                {questions.length} question{questions.length !== 1 ? 's' : ''} added
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => addQuestion('multiple_choice')}>
                <Plus className="h-4 w-4 mr-1" />
                Multiple Choice
              </Button>
              <Button variant="outline" size="sm" onClick={() => addQuestion('true_false')}>
                <Plus className="h-4 w-4 mr-1" />
                True/False
              </Button>
              <Button variant="outline" size="sm" onClick={() => addQuestion('multiple_select')}>
                <Plus className="h-4 w-4 mr-1" />
                Select All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No questions added yet.</p>
              <p className="text-sm">Click a button above to add your first question.</p>
            </div>
          ) : (
            questions.map((question, qIndex) => (
              <QuestionCard
                key={question.id}
                question={question}
                index={qIndex}
                onUpdate={(updates) => updateQuestion(question.id, updates)}
                onDelete={() => deleteQuestion(question.id)}
                onAddAnswer={() => addAnswer(question.id)}
                onUpdateAnswer={(answerId, updates) => updateAnswer(question.id, answerId, updates)}
                onDeleteAnswer={(answerId) => deleteAnswer(question.id, answerId)}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Bottom Save Button */}
      {questions.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Quiz'}
          </Button>
        </div>
      )}
    </div>
  );
}

interface QuestionCardProps {
  question: Question;
  index: number;
  onUpdate: (updates: Partial<Question>) => void;
  onDelete: () => void;
  onAddAnswer: () => void;
  onUpdateAnswer: (answerId: string, updates: Partial<Answer>) => void;
  onDeleteAnswer: (answerId: string) => void;
}

function QuestionCard({
  question,
  index,
  onUpdate,
  onDelete,
  onAddAnswer,
  onUpdateAnswer,
  onDeleteAnswer,
}: QuestionCardProps) {
  const typeLabels = {
    multiple_choice: 'Multiple Choice',
    true_false: 'True/False',
    multiple_select: 'Select All That Apply',
  };

  return (
    <div className="border rounded-lg p-4 space-y-4">
      {/* Question Header */}
      <div className="flex items-start gap-3">
        <div className="cursor-move text-muted-foreground">
          <GripVertical className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{typeLabels[question.question_type]}</Badge>
            <span className="text-sm text-muted-foreground">Question {index + 1}</span>
            <div className="flex-1" />
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>

          {/* Question Text */}
          <Textarea
            value={question.question_text}
            onChange={(e) => onUpdate({ question_text: e.target.value })}
            placeholder="Enter your question..."
            rows={2}
          />

          {/* Points */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Points:</Label>
              <Input
                type="number"
                min={1}
                value={question.points}
                onChange={(e) => onUpdate({ points: Number(e.target.value) })}
                className="w-20"
              />
            </div>
          </div>

          {/* Answers */}
          <div className="space-y-2">
            <Label className="text-sm">
              Answers {question.question_type === 'multiple_select' && '(select all correct)'}
            </Label>
            {question.answers.map((answer, aIndex) => (
              <div key={answer.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateAnswer(answer.id, { is_correct: !answer.is_correct })}
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    answer.is_correct
                      ? 'border-green-600 bg-green-100'
                      : 'border-muted-foreground/50 hover:border-green-600'
                  }`}
                >
                  {answer.is_correct && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                </button>
                <Input
                  value={answer.answer_text}
                  onChange={(e) => onUpdateAnswer(answer.id, { answer_text: e.target.value })}
                  placeholder={`Answer ${aIndex + 1}`}
                  className="flex-1"
                  disabled={question.question_type === 'true_false'}
                />
                {question.question_type !== 'true_false' && question.answers.length > 2 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteAnswer(answer.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {question.question_type !== 'true_false' && (
              <Button variant="outline" size="sm" onClick={onAddAnswer}>
                <Plus className="h-4 w-4 mr-1" />
                Add Answer
              </Button>
            )}
          </div>

          {/* Explanation */}
          <div className="space-y-2">
            <Label className="text-sm">Explanation (shown after answer)</Label>
            <Textarea
              value={question.explanation || ''}
              onChange={(e) => onUpdate({ explanation: e.target.value })}
              placeholder="Explain why the correct answer is correct..."
              rows={2}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
