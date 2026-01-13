'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Search,
  BookOpen,
  Clock,
  Trophy,
  GraduationCap,
  Shield,
  TrendingUp,
  Users,
  Target,
  CheckCircle2,
  Lock
} from 'lucide-react';
import type { TrackWithCourses } from '@/lib/types/training';

const trackTypeIcons: Record<string, React.ReactNode> = {
  new_agent: <GraduationCap className="h-5 w-5" />,
  licensing: <Shield className="h-5 w-5" />,
  product: <BookOpen className="h-5 w-5" />,
  sales: <TrendingUp className="h-5 w-5" />,
  leadership: <Users className="h-5 w-5" />,
  compliance: <Target className="h-5 w-5" />,
};

const trackTypeColors: Record<string, string> = {
  new_agent: 'bg-blue-100 text-blue-800',
  licensing: 'bg-purple-100 text-purple-800',
  product: 'bg-green-100 text-green-800',
  sales: 'bg-orange-100 text-orange-800',
  leadership: 'bg-pink-100 text-pink-800',
  compliance: 'bg-red-100 text-red-800',
};

export default function TracksPage() {
  const [tracks, setTracks] = useState<TrackWithCourses[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTracks() {
      try {
        const res = await fetch('/api/training/tracks');
        if (res.ok) {
          const data = await res.json();
          setTracks(data.tracks || []);
        }
      } catch (error) {
        console.error('Error fetching tracks:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchTracks();
  }, []);

  const filteredTracks = tracks.filter(track => {
    const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !selectedType || track.track_type === selectedType;
    return matchesSearch && matchesType;
  });

  const trackTypes = [...new Set(tracks.map(t => t.track_type))];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
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
          <h1 className="text-2xl font-bold tracking-tight">Learning Paths</h1>
          <p className="text-muted-foreground">
            Structured training tracks to advance your career
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search learning paths..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedType === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType(null)}
          >
            All
          </Button>
          {trackTypes.map(type => (
            <Button
              key={type}
              variant={selectedType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(type)}
              className="capitalize"
            >
              {type.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Tracks Grid */}
      {filteredTracks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Learning Paths Found</h3>
            <p className="text-muted-foreground">
              {searchQuery || selectedType
                ? 'Try adjusting your search or filters.'
                : 'No learning paths are available yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredTracks.map(track => {
            const progress = track.enrollment?.progress_percentage || 0;
            const isEnrolled = !!track.enrollment;
            const isComplete = !!track.enrollment?.completed_at;
            const courseCount = track.courses?.length || 0;

            return (
              <Card key={track.id} className="overflow-hidden">
                {/* Track Header with Type Badge */}
                <div className="relative h-32 bg-gradient-to-br from-primary/10 to-primary/5 p-4">
                  <div className="flex justify-between items-start">
                    <Badge className={trackTypeColors[track.track_type] || 'bg-gray-100 text-gray-800'}>
                      <span className="mr-1">{trackTypeIcons[track.track_type]}</span>
                      <span className="capitalize">{track.track_type.replace('_', ' ')}</span>
                    </Badge>
                    {track.is_required && (
                      <Badge variant="destructive">Required</Badge>
                    )}
                  </div>
                  {isComplete && (
                    <div className="absolute bottom-4 right-4">
                      <div className="rounded-full bg-green-500 p-2">
                        <Trophy className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  )}
                  {track.rank_requirement && !isEnrolled && (
                    <div className="absolute bottom-4 right-4">
                      <div className="rounded-full bg-gray-400 p-2">
                        <Lock className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  )}
                </div>

                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{track.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {track.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{courseCount} courses</span>
                    </div>
                    {track.estimated_hours && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{track.estimated_hours} hours</span>
                      </div>
                    )}
                  </div>

                  {/* Progress */}
                  {isEnrolled && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {isComplete ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" />
                              Complete
                            </span>
                          ) : (
                            `${progress}%`
                          )}
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  {/* Action Button */}
                  <Link href={`/dashboard/training/tracks/${track.id}`}>
                    <Button className="w-full" variant={isEnrolled ? 'default' : 'outline'}>
                      {isComplete ? 'View Certificate' : isEnrolled ? 'Continue Learning' : 'View Path'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
