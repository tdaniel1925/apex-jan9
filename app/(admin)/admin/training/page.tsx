'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen,
  HelpCircle,
  Award,
  FolderOpen,
  Plus,
  Users,
  TrendingUp,
  Clock,
  BarChart3
} from 'lucide-react';

interface TrainingStats {
  totalCourses: number;
  publishedCourses: number;
  totalQuizzes: number;
  totalResources: number;
  totalEnrollments: number;
  completionRate: number;
  avgQuizScore: number;
}

export default function AdminTrainingPage() {
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/training/analytics');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats || null);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const sections = [
    {
      title: 'Courses',
      description: 'Manage training courses, lessons, and content',
      icon: BookOpen,
      href: '/admin/training/courses',
      stats: stats ? `${stats.publishedCourses} published, ${stats.totalCourses} total` : null,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      title: 'Quizzes & Exams',
      description: 'Create and manage quizzes and certification exams',
      icon: HelpCircle,
      href: '/admin/training/quizzes',
      stats: stats ? `${stats.totalQuizzes} quizzes` : null,
      color: 'text-purple-600 bg-purple-100',
    },
    {
      title: 'Resources',
      description: 'Upload and organize training resources',
      icon: FolderOpen,
      href: '/admin/training/resources',
      stats: stats ? `${stats.totalResources} resources` : null,
      color: 'text-green-600 bg-green-100',
    },
    {
      title: 'Certificates',
      description: 'View and manage issued certificates',
      icon: Award,
      href: '/admin/training/certificates',
      stats: null,
      color: 'text-yellow-600 bg-yellow-100',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Training Management</h1>
          <p className="text-muted-foreground">
            Create and manage courses, quizzes, and training resources
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/training/courses/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Course
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">{stats.totalEnrollments}</span>
              </div>
              <p className="text-sm text-muted-foreground">Total Enrollments</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">{stats.completionRate}%</span>
              </div>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">{stats.avgQuizScore}%</span>
              </div>
              <p className="text-sm text-muted-foreground">Avg. Quiz Score</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">{stats.totalCourses}</span>
              </div>
              <p className="text-sm text-muted-foreground">Total Courses</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {sections.map(section => (
          <Link key={section.title} href={section.href}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className={`rounded-lg p-3 ${section.color}`}>
                    <section.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle>{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              {section.stats && (
                <CardContent>
                  <Badge variant="secondary">{section.stats}</Badge>
                </CardContent>
              )}
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/training/courses/new">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Button>
            </Link>
            <Link href="/admin/training/quizzes/new">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Quiz
              </Button>
            </Link>
            <Link href="/admin/training/resources/upload">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Upload Resource
              </Button>
            </Link>
            <Link href="/admin/training/analytics">
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
