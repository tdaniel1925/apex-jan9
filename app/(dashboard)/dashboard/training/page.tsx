'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CourseCard, TrackCard, StatsCards } from '@/components/training';
import { BookOpen, GraduationCap, FileText, Award, ChevronRight } from 'lucide-react';
import type { CourseWithProgress, TrackWithCourses, AgentTrainingStats } from '@/lib/types/training';

export default function TrainingPage() {
  const t = useTranslations('training');
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [tracks, setTracks] = useState<TrackWithCourses[]>([]);
  const [stats, setStats] = useState<AgentTrainingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [coursesRes, tracksRes, statsRes] = await Promise.all([
          fetch('/api/training/courses'),
          fetch('/api/training/tracks'),
          fetch('/api/training/stats'),
        ]);

        if (coursesRes.ok) {
          const data = await coursesRes.json();
          setCourses(data.courses || []);
        }

        if (tracksRes.ok) {
          const data = await tracksRes.json();
          setTracks(data.tracks || []);
        }

        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data.stats || null);
        }
      } catch (error) {
        console.error('Error fetching training data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Get in-progress courses (enrolled but not completed)
  const inProgressCourses = courses.filter(
    c => c.enrollment && !c.enrollment.completed_at
  );

  // Get featured courses
  const featuredCourses = courses.filter(c => c.is_featured).slice(0, 3);

  // Get required courses that aren't completed
  const requiredCourses = courses.filter(
    c => c.is_required && (!c.enrollment || !c.enrollment.completed_at)
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('portalTitle')}</h1>
          <p className="text-muted-foreground">
            {t('portalDescription')}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('portalTitle')}</h1>
          <p className="text-muted-foreground">
            {t('portalDescription')}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/training/certificates">
            <Button variant="outline" size="sm">
              <Award className="h-4 w-4 mr-2" />
              {t('myCertificates')}
            </Button>
          </Link>
          <Link href="/dashboard/training/resources">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              {t('resources')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && <StatsCards stats={stats} />}

      {/* Continue Learning Section */}
      {inProgressCourses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {t('continueLearning')}
            </CardTitle>
            <CardDescription>{t('pickUpWhereYouLeftOff')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {inProgressCourses.slice(0, 3).map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Required Courses Alert */}
      {requiredCourses.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">{t('requiredTraining')}</CardTitle>
            <CardDescription className="text-orange-700">
              {t('completeToStayCompliant')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {requiredCourses.slice(0, 3).map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="courses" className="gap-2">
            <BookOpen className="h-4 w-4" />
            {t('courses')}
          </TabsTrigger>
          <TabsTrigger value="tracks" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            {t('learningPaths')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          {featuredCourses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('featuredCourses')}</CardTitle>
                <CardDescription>{t('recommendedForSuccess')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {featuredCourses.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('allCourses')}</CardTitle>
                <CardDescription>{t('coursesAvailable', { count: courses.length })}</CardDescription>
              </div>
              <Link href="/dashboard/training/courses">
                <Button variant="outline" size="sm">
                  {t('viewAll')}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {courses.slice(0, 5).map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
              {courses.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  {t('noCoursesYet')}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracks" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {tracks.map(track => (
              <TrackCard key={track.id} track={track} />
            ))}
            {tracks.length === 0 && (
              <Card className="md:col-span-2">
                <CardContent className="py-8 text-center text-muted-foreground">
                  {t('noPathsYet')}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
