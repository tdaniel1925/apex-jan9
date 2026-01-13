'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Trophy,
  Flame,
  Star,
  Award,
  BookOpen,
  Target,
  Zap,
  Calendar,
  TrendingUp,
  Medal,
  Crown,
  Lock
} from 'lucide-react';
import type { Achievement, LearningStreak } from '@/lib/types/training';

interface TrainingStats {
  courses_completed: number;
  lessons_completed: number;
  quizzes_passed: number;
  certificates_earned: number;
  total_time_minutes: number;
  current_streak: number;
  longest_streak: number;
  total_points: number;
  achievements: (Achievement & { earned_at?: string })[];
}

// Achievement definitions with icons and colors
const ACHIEVEMENT_ICONS: Record<string, React.ReactNode> = {
  first_course: <BookOpen className="h-6 w-6" />,
  first_quiz: <Target className="h-6 w-6" />,
  streak_7: <Flame className="h-6 w-6" />,
  streak_30: <Flame className="h-6 w-6" />,
  quiz_master: <Zap className="h-6 w-6" />,
  quick_learner: <TrendingUp className="h-6 w-6" />,
  completionist: <Trophy className="h-6 w-6" />,
  certificate_collector: <Award className="h-6 w-6" />,
  perfect_score: <Star className="h-6 w-6" />,
  dedicated_learner: <Calendar className="h-6 w-6" />,
};

const ACHIEVEMENT_COLORS: Record<string, string> = {
  bronze: 'from-amber-700 to-amber-500',
  silver: 'from-gray-400 to-gray-300',
  gold: 'from-yellow-500 to-yellow-400',
  platinum: 'from-purple-500 to-purple-400',
};

// All possible achievements (to show locked ones too)
const ALL_ACHIEVEMENTS = [
  {
    code: 'first_course',
    title: 'First Steps',
    description: 'Complete your first course',
    points: 100,
    badge_color: 'bronze',
  },
  {
    code: 'first_quiz',
    title: 'Quiz Taker',
    description: 'Pass your first quiz',
    points: 50,
    badge_color: 'bronze',
  },
  {
    code: 'streak_7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day learning streak',
    points: 200,
    badge_color: 'silver',
  },
  {
    code: 'streak_30',
    title: 'Monthly Champion',
    description: 'Maintain a 30-day learning streak',
    points: 500,
    badge_color: 'gold',
  },
  {
    code: 'quiz_master',
    title: 'Quiz Master',
    description: 'Pass 10 quizzes',
    points: 300,
    badge_color: 'silver',
  },
  {
    code: 'perfect_score',
    title: 'Perfectionist',
    description: 'Score 100% on a quiz',
    points: 150,
    badge_color: 'gold',
  },
  {
    code: 'certificate_collector',
    title: 'Certified Pro',
    description: 'Earn 5 certificates',
    points: 400,
    badge_color: 'gold',
  },
  {
    code: 'completionist',
    title: 'Completionist',
    description: 'Complete all courses in a learning path',
    points: 500,
    badge_color: 'platinum',
  },
  {
    code: 'dedicated_learner',
    title: 'Dedicated Learner',
    description: 'Spend 10 hours learning',
    points: 250,
    badge_color: 'silver',
  },
];

export default function AchievementsPage() {
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/training/stats');
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

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const earnedAchievementCodes = new Set(
    stats?.achievements?.map(a => a.code) || []
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/training">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Achievements</h1>
          <p className="text-muted-foreground">
            Your learning milestones and rewards
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/20 p-2">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats?.total_points || 0}</p>
                <p className="text-sm text-muted-foreground">Total Points</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-orange-500/20 p-2">
                <Flame className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats?.current_streak || 0}</p>
                <p className="text-sm text-muted-foreground">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-muted p-2">
                <Medal className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-3xl font-bold">{earnedAchievementCodes.size}</p>
                <p className="text-sm text-muted-foreground">Achievements</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-muted p-2">
                <Crown className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats?.longest_streak || 0}</p>
                <p className="text-sm text-muted-foreground">Longest Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Learning Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Courses Completed</span>
              <span className="font-semibold">{stats?.courses_completed || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Lessons Completed</span>
              <span className="font-semibold">{stats?.lessons_completed || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Quizzes Passed</span>
              <span className="font-semibold">{stats?.quizzes_passed || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Certificates Earned</span>
              <span className="font-semibold">{stats?.certificates_earned || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Time Invested</span>
              <span className="font-semibold">{formatTime(stats?.total_time_minutes || 0)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Streak Calendar</CardTitle>
            <CardDescription>
              Keep learning daily to maintain your streak!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-red-500 mb-4">
                <div className="text-white">
                  <Flame className="h-10 w-10" />
                </div>
              </div>
              <p className="text-4xl font-bold">{stats?.current_streak || 0} Days</p>
              <p className="text-sm text-muted-foreground">Current Streak</p>
              {stats?.current_streak && stats.current_streak > 0 && (
                <p className="text-sm text-orange-600 mt-2">
                  Keep it going! Don&apos;t break the chain.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements Grid */}
      <Card>
        <CardHeader>
          <CardTitle>All Achievements</CardTitle>
          <CardDescription>
            {earnedAchievementCodes.size} of {ALL_ACHIEVEMENTS.length} unlocked
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {ALL_ACHIEVEMENTS.map(achievement => {
              const isEarned = earnedAchievementCodes.has(achievement.code);
              const earnedData = stats?.achievements?.find(a => a.code === achievement.code);

              return (
                <div
                  key={achievement.code}
                  className={`relative p-4 rounded-lg border-2 transition-all ${
                    isEarned
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-muted bg-muted/30 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Badge Icon */}
                    <div className={`relative flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                      isEarned
                        ? `bg-gradient-to-br ${ACHIEVEMENT_COLORS[achievement.badge_color] || 'from-gray-400 to-gray-300'}`
                        : 'bg-muted'
                    }`}>
                      {isEarned ? (
                        <span className="text-white">
                          {ACHIEVEMENT_ICONS[achievement.code] || <Star className="h-6 w-6" />}
                        </span>
                      ) : (
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>

                    {/* Achievement Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold ${!isEarned && 'text-muted-foreground'}`}>
                        {achievement.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {achievement.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={isEarned ? 'default' : 'outline'} className="text-xs">
                          {achievement.points} pts
                        </Badge>
                        {isEarned && earnedData?.earned_at && (
                          <span className="text-xs text-muted-foreground">
                            Earned {new Date(earnedData.earned_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      {earnedAchievementCodes.size < ALL_ACHIEVEMENTS.length && (
        <Card className="bg-gradient-to-r from-primary/10 to-blue-500/10">
          <CardContent className="py-6 text-center">
            <p className="text-lg font-semibold mb-2">
              Keep learning to unlock more achievements!
            </p>
            <p className="text-muted-foreground mb-4">
              {ALL_ACHIEVEMENTS.length - earnedAchievementCodes.size} achievements remaining
            </p>
            <Link href="/dashboard/training/courses">
              <Button>Continue Learning</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
