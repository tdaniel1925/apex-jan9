'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GraduationCap, BookOpen, CheckCircle, ChevronRight } from 'lucide-react';
import type { TrackWithCourses } from '@/lib/types/training';

interface TrackCardProps {
  track: TrackWithCourses;
}

export function TrackCard({ track }: TrackCardProps) {
  const isEnrolled = !!track.enrollment;
  const isComplete = track.enrollment?.completed_at !== null;
  const progress = track.enrollment?.progress_percentage || 0;

  const getTrackTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      new_agent: 'bg-blue-100 text-blue-800',
      licensing: 'bg-purple-100 text-purple-800',
      product: 'bg-green-100 text-green-800',
      sales: 'bg-orange-100 text-orange-800',
      leadership: 'bg-yellow-100 text-yellow-800',
      compliance: 'bg-red-100 text-red-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{track.title}</CardTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className={getTrackTypeColor(track.track_type)}>
                  {track.track_type.replace('_', ' ')}
                </Badge>
                {track.is_required && (
                  <Badge variant="destructive">Required</Badge>
                )}
                {isComplete && (
                  <Badge className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {track.description}
        </p>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            {track.total_courses} courses
          </span>
          {track.estimated_hours && (
            <span>{track.estimated_hours} hours</span>
          )}
        </div>

        {isEnrolled && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>{track.completed_courses} of {track.total_courses} courses completed</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <Link href={`/dashboard/training/tracks/${track.id}`}>
          <Button
            variant={isEnrolled ? 'default' : 'outline'}
            className="w-full"
          >
            {isComplete ? 'Review Path' : isEnrolled ? 'Continue Learning' : 'View Learning Path'}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
