'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  BookOpen,
  Users,
  Award,
  Trophy,
  TrendingUp,
  Clock,
  CheckCircle,
  Loader2,
  RefreshCw,
  Search,
  GraduationCap,
  Target,
} from 'lucide-react';
import { COURSE_CATEGORY_LABELS, type CourseCategory } from '@/lib/types/training';
import { Progress } from '@/components/ui/progress';

interface AnalyticsData {
  overall: {
    total_courses: number;
    total_lessons: number;
    total_enrollments: number;
    completed_enrollments: number;
    completion_rate: number;
    total_certificates: number;
    total_quiz_attempts: number;
    quiz_pass_rate: number;
  };
  period: {
    days: number;
    enrollments: number;
    completions: number;
    certificates: number;
  };
  top_courses: {
    id: string;
    title: string;
    count: number;
  }[];
  recent_activity: {
    agent_name: string;
    lesson_title: string;
    course_title: string;
    completed_at: string;
  }[];
  achievement_distribution: {
    id: string;
    title: string;
    count: number;
  }[];
}

interface AgentProgress {
  id: string;
  agent_id: string;
  course_id: string;
  enrolled_at: string;
  progress_percentage: number;
  completed_at: string | null;
  agent: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    agent_code: string;
  } | null;
  course: {
    id: string;
    title: string;
    category: string;
  } | null;
}

export default function TrainingAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [agentProgress, setAgentProgress] = useState<AgentProgress[]>([]);
  const [progressTotal, setProgressTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isProgressLoading, setIsProgressLoading] = useState(false);
  const [period, setPeriod] = useState('30');
  const [progressSearch, setProgressSearch] = useState('');
  const [completedFilter, setCompletedFilter] = useState<string>('all');

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/training/analytics?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  const fetchProgress = useCallback(async () => {
    setIsProgressLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '20',
        offset: '0',
        sort_by: 'enrolled_at',
        sort_order: 'desc',
      });

      if (progressSearch) {
        params.append('search', progressSearch);
      }

      if (completedFilter !== 'all') {
        params.append('completed', completedFilter === 'completed' ? 'true' : 'false');
      }

      const res = await fetch(`/api/admin/training/progress?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAgentProgress(data.enrollments);
        setProgressTotal(data.total);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setIsProgressLoading(false);
    }
  }, [progressSearch, completedFilter]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading && !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/training">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Training Analytics</h1>
            <p className="text-muted-foreground">
              Monitor agent learning progress and engagement
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchAnalytics} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.overall.total_courses || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.overall.total_lessons || 0} lessons total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.overall.total_enrollments || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics?.period.enrollments || 0} in last {analytics?.period.days || 30} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.overall.completion_rate || 0}%</div>
            <Progress value={analytics?.overall.completion_rate || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates Issued</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.overall.total_certificates || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics?.period.certificates || 0} in last {analytics?.period.days || 30} days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Period Stats & Quiz Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Period Activity
            </CardTitle>
            <CardDescription>
              Last {analytics?.period.days || 30} days
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">New Enrollments</span>
              <span className="font-medium">{analytics?.period.enrollments || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Course Completions</span>
              <span className="font-medium">{analytics?.period.completions || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Certificates Issued</span>
              <span className="font-medium">{analytics?.period.certificates || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Quiz Performance
            </CardTitle>
            <CardDescription>
              Overall quiz statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Attempts</span>
              <span className="font-medium">{analytics?.overall.total_quiz_attempts || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pass Rate</span>
              <span className="font-medium">{analytics?.overall.quiz_pass_rate || 0}%</span>
            </div>
            <Progress value={analytics?.overall.quiz_pass_rate || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Course Completions
            </CardTitle>
            <CardDescription>
              Total completed courses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">
              {analytics?.overall.completed_enrollments || 0}
            </div>
            <div className="text-sm text-muted-foreground">
              out of {analytics?.overall.total_enrollments || 0} enrollments
            </div>
            <Progress
              value={analytics?.overall.total_enrollments
                ? ((analytics?.overall.completed_enrollments || 0) / analytics.overall.total_enrollments) * 100
                : 0}
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Top Courses & Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Courses</CardTitle>
            <CardDescription>
              Most enrolled courses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.top_courses && analytics.top_courses.length > 0 ? (
              <div className="space-y-3">
                {analytics.top_courses.slice(0, 5).map((course, index) => (
                  <div key={course.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-100 text-gray-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium truncate max-w-[200px]">
                        {course.title}
                      </span>
                    </div>
                    <Badge variant="secondary">{course.count} enrolled</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No enrollment data yet
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest lesson completions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.recent_activity && analytics.recent_activity.length > 0 ? (
              <div className="space-y-3">
                {analytics.recent_activity.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.agent_name || 'Unknown Agent'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        Completed &ldquo;{activity.lesson_title}&rdquo;
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {activity.completed_at && formatDate(activity.completed_at)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Achievement Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Achievement Distribution
          </CardTitle>
          <CardDescription>
            How many agents have earned each achievement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics?.achievement_distribution && analytics.achievement_distribution.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {analytics.achievement_distribution.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <span className="text-sm font-medium">{achievement.title}</span>
                  <Badge>{achievement.count} earned</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No achievements earned yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Agent Progress Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Agent Progress</CardTitle>
              <CardDescription>
                Individual agent enrollment and progress
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search agents..."
                  value={progressSearch}
                  onChange={(e) => setProgressSearch(e.target.value)}
                  className="pl-8 w-[200px]"
                />
              </div>
              <Select value={completedFilter} onValueChange={setCompletedFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isProgressLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : agentProgress.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No enrollment data found
                    </TableCell>
                  </TableRow>
                ) : (
                  agentProgress.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {enrollment.agent?.first_name} {enrollment.agent?.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {enrollment.agent?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {enrollment.course?.title || 'Unknown Course'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {enrollment.course?.category
                            ? COURSE_CATEGORY_LABELS[enrollment.course.category as CourseCategory]
                            : 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={enrollment.progress_percentage}
                            className="w-[80px]"
                          />
                          <span className="text-sm">
                            {enrollment.progress_percentage}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDateShort(enrollment.enrolled_at)}
                      </TableCell>
                      <TableCell>
                        {enrollment.completed_at ? (
                          <Badge className="bg-green-100 text-green-800">
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            In Progress
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {progressTotal > 20 && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Showing 20 of {progressTotal} enrollments
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
