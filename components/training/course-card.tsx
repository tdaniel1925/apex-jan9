'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, BookOpen, PlayCircle, CheckCircle } from 'lucide-react';
import type { CourseWithProgress } from '@/lib/types/training';

interface CourseCardProps {
  course: CourseWithProgress;
}

export function CourseCard({ course }: CourseCardProps) {
  const progress = course.enrollment?.progress_percentage || 0;
  const isComplete = course.enrollment?.completed_at !== null;
  const isEnrolled = !!course.enrollment;

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      onboarding: 'bg-blue-100 text-blue-800',
      products: 'bg-purple-100 text-purple-800',
      sales: 'bg-green-100 text-green-800',
      recruiting: 'bg-orange-100 text-orange-800',
      compliance: 'bg-red-100 text-red-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getSkillBadgeColor = (level: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800',
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-primary/10 p-3 shrink-0">
            {isComplete ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : progress > 0 ? (
              <PlayCircle className="h-6 w-6 text-primary" />
            ) : (
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">{course.title}</h3>
              {isComplete && (
                <Badge className="bg-green-600 hover:bg-green-700">Completed</Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline" className={getCategoryColor(course.category)}>
                {course.category}
              </Badge>
              <Badge variant="outline" className={getSkillBadgeColor(course.skill_level)}>
                {course.skill_level}
              </Badge>
              {course.is_required && (
                <Badge variant="destructive">Required</Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {course.description}
            </p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {course.estimated_minutes} min
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {course.lessons_count} lessons
              </span>
            </div>

            {isEnrolled && !isComplete && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>{course.completed_lessons_count} of {course.lessons_count} completed</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            <Link href={`/dashboard/training/courses/${course.id}`}>
              <Button
                variant={isComplete ? 'outline' : 'default'}
                size="sm"
                className="w-full sm:w-auto"
              >
                {isComplete ? 'Review' : isEnrolled ? 'Continue' : 'Start Course'}
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
