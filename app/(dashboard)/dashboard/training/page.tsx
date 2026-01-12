'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, PlayCircle, FileText, Award, Clock, CheckCircle } from 'lucide-react';

export default function TrainingPage() {
  // Placeholder training courses
  const courses = [
    {
      id: 1,
      title: 'Getting Started with Apex',
      description: 'Learn the basics of the Apex platform and how to get started.',
      duration: '30 min',
      lessons: 5,
      completed: 5,
      category: 'Onboarding',
    },
    {
      id: 2,
      title: 'IUL Sales Mastery',
      description: 'Advanced techniques for selling Indexed Universal Life insurance.',
      duration: '2 hours',
      lessons: 12,
      completed: 4,
      category: 'Sales',
    },
    {
      id: 3,
      title: 'Recruiting & Team Building',
      description: 'How to recruit and build a successful team of agents.',
      duration: '1.5 hours',
      lessons: 8,
      completed: 0,
      category: 'Leadership',
    },
    {
      id: 4,
      title: 'Carrier Product Training',
      description: 'Deep dive into products from Columbus Life, AIG, F+G, and more.',
      duration: '3 hours',
      lessons: 15,
      completed: 2,
      category: 'Products',
    },
    {
      id: 5,
      title: 'Compliance Essentials',
      description: 'Stay compliant with insurance regulations and best practices.',
      duration: '45 min',
      lessons: 6,
      completed: 6,
      category: 'Compliance',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Training Portal</h1>
        <p className="text-muted-foreground">
          Build your skills and grow your business with our training courses.
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">of 5 courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lessons Completed</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">17</div>
            <p className="text-xs text-muted-foreground">of 46 lessons</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Invested</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.5 hrs</div>
            <p className="text-xs text-muted-foreground">learning time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Course List */}
      <Card>
        <CardHeader>
          <CardTitle>Available Courses</CardTitle>
          <CardDescription>Continue your learning journey</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {courses.map((course) => {
            const progress = Math.round((course.completed / course.lessons) * 100);
            const isComplete = progress === 100;

            return (
              <div
                key={course.id}
                className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="rounded-lg bg-primary/10 p-3">
                  {isComplete ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <PlayCircle className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{course.title}</h3>
                    <Badge variant="outline">{course.category}</Badge>
                    {isComplete && (
                      <Badge variant="default" className="bg-green-600">
                        Completed
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {course.description}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {course.duration}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {course.lessons} lessons
                    </span>
                  </div>
                  {!isComplete && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>{course.completed} of {course.lessons} completed</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                </div>
                <Button variant={isComplete ? 'outline' : 'default'}>
                  {isComplete ? 'Review' : progress > 0 ? 'Continue' : 'Start'}
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Coming Soon */}
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>New courses being developed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-dashed p-4 text-center">
              <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/50" />
              <h4 className="mt-2 font-medium">Advanced Annuity Strategies</h4>
              <p className="text-sm text-muted-foreground">Coming Q2 2026</p>
            </div>
            <div className="rounded-lg border border-dashed p-4 text-center">
              <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/50" />
              <h4 className="mt-2 font-medium">AI Copilot Mastery</h4>
              <p className="text-sm text-muted-foreground">Coming Q2 2026</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
