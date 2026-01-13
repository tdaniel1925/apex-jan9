'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  PlayCircle,
  FileText,
  CheckCircle,
  Lock,
  Award,
} from 'lucide-react';
import type { CourseWithProgress, LessonWithProgress } from '@/lib/types/training';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const [course, setCourse] = useState<CourseWithProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await fetch(`/api/training/courses/${courseId}`);
        if (res.ok) {
          const data = await res.json();
          setCourse(data.course || null);
        }
      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [courseId]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const res = await fetch(`/api/training/courses/${courseId}/enroll`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setCourse(prev => prev ? { ...prev, enrollment: data.enrollment } : null);
      }
    } catch (error) {
      console.error('Error enrolling:', error);
    } finally {
      setEnrolling(false);
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <PlayCircle className="h-4 w-4" />;
      case 'text':
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'quiz':
        return <Award className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/training/courses">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Course Not Found</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              This course could not be found. It may have been removed or is not yet published.
            </p>
            <Link href="/dashboard/training/courses">
              <Button className="mt-4">Browse Courses</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isEnrolled = !!course.enrollment;
  const isComplete = course.enrollment?.completed_at !== null;
  const progress = course.enrollment?.progress_percentage || 0;

  // Flatten lessons from sections
  const allLessons: LessonWithProgress[] = course.sections
    ?.flatMap(s => s.lessons) || [];

  // Find next incomplete lesson
  const nextLesson = allLessons.find(l => !l.progress?.completed);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/training/courses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{course.title}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline">
              {course.category}
            </Badge>
            <Badge variant="outline">
              {course.skill_level}
            </Badge>
            {course.is_required && (
              <Badge variant="destructive">Required</Badge>
            )}
            {isComplete && (
              <Badge className="bg-green-600">Completed</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Course Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>About This Course</CardTitle>
          <CardDescription>{course.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{course.estimated_minutes} minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span>{course.lessons_count} lessons</span>
            </div>
            {course.instructor_name && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Instructor:</span>
                <span>{course.instructor_name}</span>
              </div>
            )}
          </div>

          {course.learning_objectives && course.learning_objectives.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-2">What you'll learn:</h4>
              <ul className="space-y-1">
                {course.learning_objectives.map((objective, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isEnrolled && (
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium">Your Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                {course.completed_lessons_count} of {course.lessons_count} lessons completed
              </p>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            {!isEnrolled ? (
              <Button onClick={handleEnroll} disabled={enrolling}>
                {enrolling ? 'Enrolling...' : 'Enroll Now'}
              </Button>
            ) : nextLesson ? (
              <Link href={`/dashboard/training/courses/${course.id}/lesson/${nextLesson.id}`}>
                <Button>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Continue Learning
                </Button>
              </Link>
            ) : (
              <Button variant="outline" disabled>
                <CheckCircle className="h-4 w-4 mr-2" />
                Course Completed
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Course Content */}
      <Card>
        <CardHeader>
          <CardTitle>Course Content</CardTitle>
          <CardDescription>
            {course.sections?.length || 0} sections • {course.lessons_count} lessons
          </CardDescription>
        </CardHeader>
        <CardContent>
          {course.sections && course.sections.length > 0 ? (
            <Accordion type="multiple" className="w-full">
              {course.sections.map((section, sectionIndex) => (
                <AccordionItem key={section.id} value={section.id}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground text-sm">
                        Section {sectionIndex + 1}
                      </span>
                      <span className="font-medium">{section.title}</span>
                      <span className="text-sm text-muted-foreground">
                        ({section.lessons.length} lessons)
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pl-4">
                      {section.lessons.map((lesson, lessonIndex) => {
                        const isLessonComplete = lesson.progress?.completed;
                        const canAccess = isEnrolled || lesson.is_preview;

                        return (
                          <div
                            key={lesson.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border ${
                              isLessonComplete ? 'bg-green-50 border-green-200' : ''
                            }`}
                          >
                            {isLessonComplete ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : canAccess ? (
                              getContentTypeIcon(lesson.content_type)
                            ) : (
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={canAccess ? '' : 'text-muted-foreground'}>
                                  {lessonIndex + 1}. {lesson.title}
                                </span>
                                {lesson.is_preview && !isEnrolled && (
                                  <Badge variant="secondary" className="text-xs">
                                    Preview
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {lesson.content_type} • {lesson.duration_minutes} min
                              </span>
                            </div>
                            {canAccess && (
                              <Link href={`/dashboard/training/courses/${course.id}/lesson/${lesson.id}`}>
                                <Button variant="ghost" size="sm">
                                  {isLessonComplete ? 'Review' : 'Start'}
                                </Button>
                              </Link>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Course content is being prepared. Check back soon!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
