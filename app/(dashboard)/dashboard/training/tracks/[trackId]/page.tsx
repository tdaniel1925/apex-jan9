'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Trophy,
  GraduationCap,
  Shield,
  TrendingUp,
  Users,
  Target,
  CheckCircle2,
  Play,
  Lock,
  Award
} from 'lucide-react';
import type { TrackWithCourses, CourseWithProgress } from '@/lib/types/training';

const trackTypeIcons: Record<string, React.ReactNode> = {
  new_agent: <GraduationCap className="h-6 w-6" />,
  licensing: <Shield className="h-6 w-6" />,
  product: <BookOpen className="h-6 w-6" />,
  sales: <TrendingUp className="h-6 w-6" />,
  leadership: <Users className="h-6 w-6" />,
  compliance: <Target className="h-6 w-6" />,
};

export default function TrackDetailPage({ params }: { params: Promise<{ trackId: string }> }) {
  const { trackId } = use(params);
  const [track, setTrack] = useState<TrackWithCourses | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    async function fetchTrack() {
      try {
        const res = await fetch(`/api/training/tracks/${trackId}`);
        if (res.ok) {
          const data = await res.json();
          setTrack(data.track || null);
        }
      } catch (error) {
        console.error('Error fetching track:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchTrack();
  }, [trackId]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const res = await fetch(`/api/training/tracks/${trackId}/enroll`, {
        method: 'POST',
      });
      if (res.ok) {
        // Refresh track data
        const trackRes = await fetch(`/api/training/tracks/${trackId}`);
        if (trackRes.ok) {
          const data = await trackRes.json();
          setTrack(data.track || null);
        }
      }
    } catch (error) {
      console.error('Error enrolling:', error);
    } finally {
      setEnrolling(false);
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
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/training/tracks">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Learning Path Not Found</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              The learning path you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
            </p>
            <Link href="/dashboard/training/tracks">
              <Button className="mt-4">Browse Learning Paths</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isEnrolled = !!track.enrollment;
  const isComplete = !!track.enrollment?.completed_at;
  const progress = track.enrollment?.progress_percentage || 0;
  const courses = track.courses || [];
  const completedCourses = courses.filter(c => c.enrollment?.completed_at).length;
  const totalHours = track.estimated_hours || courses.reduce((sum, c) => sum + (c.estimated_minutes || 0), 0) / 60;

  // Find the next course to continue
  const nextCourse = courses.find(c =>
    c.enrollment && !c.enrollment.completed_at
  ) || courses.find(c => !c.enrollment);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/training/tracks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-primary">
              {trackTypeIcons[track.track_type]}
            </span>
            <Badge variant="outline" className="capitalize">
              {track.track_type.replace('_', ' ')}
            </Badge>
            {track.is_required && (
              <Badge variant="destructive">Required</Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{track.title}</h1>
        </div>
      </div>

      {/* Track Overview Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Description */}
            <div className="md:col-span-2 space-y-4">
              <p className="text-muted-foreground">{track.description}</p>

              {/* Stats Row */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span>{courses.length} courses</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>{totalHours.toFixed(1)} hours</span>
                </div>
                {isEnrolled && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>{completedCourses} of {courses.length} complete</span>
                  </div>
                )}
              </div>

              {/* Progress Bar (if enrolled) */}
              {isEnrolled && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Overall Progress</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>
              )}
            </div>

            {/* Action Panel */}
            <div className="space-y-4">
              {isComplete ? (
                <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                  <Trophy className="h-12 w-12 mx-auto text-green-600 mb-2" />
                  <h3 className="font-semibold text-green-800">Path Complete!</h3>
                  <p className="text-sm text-green-600 mb-3">
                    You&apos;ve completed this learning path
                  </p>
                  {track.enrollment?.certificate_id && (
                    <Link href="/dashboard/training/certificates">
                      <Button variant="outline" className="w-full">
                        <Award className="h-4 w-4 mr-2" />
                        View Certificate
                      </Button>
                    </Link>
                  )}
                </div>
              ) : isEnrolled ? (
                <div className="space-y-3">
                  {nextCourse && (
                    <Link href={`/dashboard/training/courses/${nextCourse.id}`}>
                      <Button className="w-full" size="lg">
                        <Play className="h-4 w-4 mr-2" />
                        Continue Learning
                      </Button>
                    </Link>
                  )}
                  <p className="text-xs text-center text-muted-foreground">
                    {completedCourses} of {courses.length} courses completed
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleEnroll}
                    disabled={enrolling}
                  >
                    {enrolling ? 'Enrolling...' : 'Start Learning Path'}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    {courses.length} courses • {totalHours.toFixed(1)} hours total
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Courses in this Path</h2>

        {courses.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No courses in this learning path yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {courses.map((course, index) => (
              <CourseListItem
                key={course.id}
                course={course}
                index={index}
                isEnrolled={isEnrolled}
                previousComplete={index === 0 || !!courses[index - 1]?.enrollment?.completed_at}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface CourseListItemProps {
  course: CourseWithProgress;
  index: number;
  isEnrolled: boolean;
  previousComplete: boolean;
}

function CourseListItem({ course, index, isEnrolled, previousComplete }: CourseListItemProps) {
  const isComplete = !!course.enrollment?.completed_at;
  const progress = course.enrollment?.progress_percentage || 0;
  const isLocked = isEnrolled && !previousComplete && !course.enrollment;

  return (
    <Card className={isLocked ? 'opacity-60' : ''}>
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          {/* Course Number */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
            isComplete
              ? 'bg-green-100 text-green-700'
              : isLocked
                ? 'bg-gray-100 text-gray-400'
                : 'bg-primary/10 text-primary'
          }`}>
            {isComplete ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : isLocked ? (
              <Lock className="h-4 w-4" />
            ) : (
              index + 1
            )}
          </div>

          {/* Course Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium truncate">{course.title}</h3>
              {course.is_required && (
                <Badge variant="outline" className="text-xs">Required</Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {course.estimated_minutes && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {course.estimated_minutes} min
                </span>
              )}
              {course.lessons_count !== undefined && (
                <span>{course.lessons_count} lessons</span>
              )}
              {course.enrollment && !isComplete && (
                <span className="text-primary">{progress}% complete</span>
              )}
            </div>
          </div>

          {/* Progress/Action */}
          <div className="flex-shrink-0">
            {isLocked ? (
              <Button variant="ghost" size="sm" disabled>
                <Lock className="h-4 w-4 mr-2" />
                Locked
              </Button>
            ) : (
              <Link href={`/dashboard/training/courses/${course.id}`}>
                <Button variant={isComplete ? 'ghost' : 'default'} size="sm">
                  {isComplete ? 'Review' : course.enrollment ? 'Continue' : 'Start'}
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Progress Bar (if in progress) */}
        {course.enrollment && !isComplete && progress > 0 && (
          <div className="mt-3 ml-14">
            <Progress value={progress} className="h-1.5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
