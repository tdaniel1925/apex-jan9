'use client';

import { useEffect, useState, use, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Circle,
  BookOpen,
  Video,
  FileText,
  Music,
  HelpCircle,
  List
} from 'lucide-react';
import { LessonPlayer } from '@/components/training/lesson-player';
import type { Course, Lesson, CourseSection } from '@/lib/types/training';

interface CourseWithLessons extends Course {
  sections: (CourseSection & { lessons: Lesson[] })[];
  lessons: Lesson[];
}

interface LessonProgress {
  completed: boolean;
  last_position_seconds: number;
}

const contentTypeIcons: Record<string, React.ReactNode> = {
  video: <Video className="h-4 w-4" />,
  text: <FileText className="h-4 w-4" />,
  pdf: <FileText className="h-4 w-4" />,
  audio: <Music className="h-4 w-4" />,
  quiz: <HelpCircle className="h-4 w-4" />,
};

export default function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = use(params);
  const router = useRouter();

  const [course, setCourse] = useState<CourseWithLessons | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch course details
        const courseRes = await fetch(`/api/training/courses/${courseId}`);
        if (courseRes.ok) {
          const courseData = await courseRes.json();
          setCourse(courseData.course || null);

          // Build list of completed lessons from course progress
          if (courseData.progress) {
            const completed = new Set<string>();
            courseData.progress.forEach((p: { lesson_id: string; completed: boolean }) => {
              if (p.completed) completed.add(p.lesson_id);
            });
            setCompletedLessons(completed);
          }
        }

        // Fetch specific lesson (the course endpoint should include it, but we may need the progress)
        // For now, find the lesson from the course data
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [courseId, lessonId]);

  // Find current lesson from course data
  useEffect(() => {
    if (!course) return;

    // Get all lessons in order
    const allLessons = getAllLessons(course);
    const currentLesson = allLessons.find(l => l.id === lessonId);
    setLesson(currentLesson || null);

    // Check if this lesson is completed
    if (completedLessons.has(lessonId)) {
      setProgress({ completed: true, last_position_seconds: 0 });
    }
  }, [course, lessonId, completedLessons]);

  // Get all lessons in order (respecting sections)
  const getAllLessons = (course: CourseWithLessons): Lesson[] => {
    const lessons: Lesson[] = [];

    // Add section lessons first
    if (course.sections) {
      course.sections
        .sort((a, b) => a.order - b.order)
        .forEach(section => {
          if (section.lessons) {
            lessons.push(...section.lessons.sort((a, b) => a.order - b.order));
          }
        });
    }

    // Add standalone lessons
    if (course.lessons) {
      const sectionLessonIds = new Set(lessons.map(l => l.id));
      course.lessons
        .filter(l => !sectionLessonIds.has(l.id))
        .sort((a, b) => a.order - b.order)
        .forEach(l => lessons.push(l));
    }

    return lessons;
  };

  const allLessons = course ? getAllLessons(course) : [];
  const currentIndex = allLessons.findIndex(l => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // Calculate course progress
  const completedCount = allLessons.filter(l => completedLessons.has(l.id)).length;
  const courseProgress = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0;

  const handleComplete = useCallback(async () => {
    try {
      await fetch('/api/training/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          lesson_id: lessonId,
          completed: true,
        }),
      });

      setCompletedLessons(prev => new Set([...prev, lessonId]));
      setProgress({ completed: true, last_position_seconds: 0 });
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    }
  }, [courseId, lessonId]);

  const handleProgress = useCallback(async (position: number, completed: boolean) => {
    try {
      await fetch('/api/training/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          lesson_id: lessonId,
          completed,
          last_position_seconds: Math.floor(position),
        }),
      });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }, [courseId, lessonId]);

  const navigateToLesson = (lesson: Lesson) => {
    router.push(`/dashboard/training/courses/${courseId}/lessons/${lesson.id}`);
  };

  if (loading) {
    return (
      <div className="flex gap-6">
        <div className="flex-1 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="aspect-video" />
          <Skeleton className="h-24" />
        </div>
        <div className="w-80 hidden lg:block">
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!course || !lesson) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/training/courses/${courseId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Lesson Not Found</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              The lesson you&apos;re looking for doesn&apos;t exist.
            </p>
            <Link href={`/dashboard/training/courses/${courseId}`}>
              <Button className="mt-4">Back to Course</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isComplete = completedLessons.has(lessonId);

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-4 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/training/courses/${courseId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <p className="text-sm text-muted-foreground">{course.title}</p>
              <h1 className="text-xl font-bold">{lesson.title}</h1>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            <List className="h-5 w-5" />
          </Button>
        </div>

        {/* Lesson Content */}
        <LessonPlayer
          lesson={lesson}
          onComplete={handleComplete}
          onProgress={handleProgress}
          initialPosition={progress?.last_position_seconds || 0}
        />

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4">
          {prevLesson ? (
            <Button variant="outline" onClick={() => navigateToLesson(prevLesson)}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous: {prevLesson.title.slice(0, 30)}{prevLesson.title.length > 30 ? '...' : ''}
            </Button>
          ) : (
            <div />
          )}

          {nextLesson ? (
            <Button onClick={() => navigateToLesson(nextLesson)}>
              Next: {nextLesson.title.slice(0, 30)}{nextLesson.title.length > 30 ? '...' : ''}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Link href={`/dashboard/training/courses/${courseId}`}>
              <Button>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Finish Course
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Sidebar - Course Outline */}
      <div className={`w-80 flex-shrink-0 ${showSidebar ? 'block' : 'hidden'} lg:block`}>
        <Card className="sticky top-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Course Progress</span>
              <span className="text-sm font-normal text-muted-foreground">
                {completedCount}/{allLessons.length}
              </span>
            </CardTitle>
            <Progress value={courseProgress} className="h-2" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {course.sections && course.sections.length > 0 ? (
                // Render with sections
                course.sections
                  .sort((a, b) => a.order - b.order)
                  .map(section => (
                    <div key={section.id} className="space-y-1">
                      <h4 className="font-medium text-sm text-muted-foreground pt-2">
                        {section.title}
                      </h4>
                      {section.lessons
                        ?.sort((a, b) => a.order - b.order)
                        .map(l => (
                          <LessonListItem
                            key={l.id}
                            lesson={l}
                            isActive={l.id === lessonId}
                            isComplete={completedLessons.has(l.id)}
                            onClick={() => navigateToLesson(l)}
                          />
                        ))}
                    </div>
                  ))
              ) : (
                // Render flat list
                allLessons.map(l => (
                  <LessonListItem
                    key={l.id}
                    lesson={l}
                    isActive={l.id === lessonId}
                    isComplete={completedLessons.has(l.id)}
                    onClick={() => navigateToLesson(l)}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface LessonListItemProps {
  lesson: Lesson;
  isActive: boolean;
  isComplete: boolean;
  onClick: () => void;
}

function LessonListItem({ lesson, isActive, isComplete, onClick }: LessonListItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 text-sm transition-colors ${
        isActive
          ? 'bg-primary/10 text-primary'
          : 'hover:bg-muted'
      }`}
    >
      {isComplete ? (
        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
      ) : (
        <Circle className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      )}
      <span className="flex-1 truncate">{lesson.title}</span>
      <span className="flex-shrink-0 text-muted-foreground">
        {contentTypeIcons[lesson.content_type]}
      </span>
      {lesson.duration_minutes && (
        <span className="flex-shrink-0 text-xs text-muted-foreground">
          {lesson.duration_minutes}m
        </span>
      )}
    </button>
  );
}
