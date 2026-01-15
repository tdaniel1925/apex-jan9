'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  Edit,
  GripVertical,
  Video,
  FileText,
  Music,
  HelpCircle,
  Eye
} from 'lucide-react';
import {
  COURSE_CATEGORY_LABELS,
  SKILL_LEVEL_LABELS,
  COURSE_STATUS_LABELS,
  type Course,
  type Lesson,
  type CourseSection,
  type ContentType,
} from '@/lib/types/training';

const courseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  category: z.enum(['onboarding', 'products', 'sales', 'recruiting', 'compliance'] as const),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced'] as const),
  instructor_name: z.string().max(100).optional(),
  estimated_minutes: z.number().min(0).max(9999).optional().nullable(),
  is_required: z.boolean(),
  is_featured: z.boolean(),
  learning_objectives: z.string().optional(),
});

const lessonSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content_type: z.enum(['video', 'audio', 'text', 'pdf', 'quiz'] as const),
  content_url: z.string().url().optional().or(z.literal('')),
  content_text: z.string().optional(),
  duration_minutes: z.number().min(0).max(999).optional().nullable(),
  is_preview: z.boolean(),
});

type CourseFormData = z.infer<typeof courseSchema>;
type LessonFormData = z.infer<typeof lessonSchema>;

interface CourseWithLessons extends Course {
  sections: (CourseSection & { lessons: Lesson[] })[];
  lessons: Lesson[];
}

const contentTypeIcons: Record<ContentType, React.ReactNode> = {
  video: <Video className="h-4 w-4" />,
  audio: <Music className="h-4 w-4" />,
  text: <FileText className="h-4 w-4" />,
  pdf: <FileText className="h-4 w-4" />,
  quiz: <HelpCircle className="h-4 w-4" />,
};

export default function EditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const router = useRouter();
  const [course, setCourse] = useState<CourseWithLessons | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [savingLesson, setSavingLesson] = useState(false);

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'onboarding',
      skill_level: 'beginner',
      instructor_name: '',
      estimated_minutes: 0,
      is_required: false,
      is_featured: false,
      learning_objectives: '',
    },
  });

  const lessonForm = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: '',
      content_type: 'video',
      content_url: '',
      content_text: '',
      duration_minutes: 0,
      is_preview: false,
    },
  });

  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await fetch(`/api/admin/training/courses/${courseId}`);
        if (res.ok) {
          const data = await res.json();
          const courseData = data.course;
          setCourse(courseData);

          // Populate form
          form.reset({
            title: courseData.title,
            description: courseData.description || '',
            category: courseData.category,
            skill_level: courseData.skill_level,
            instructor_name: courseData.instructor_name || '',
            estimated_minutes: courseData.estimated_minutes || 0,
            is_required: courseData.is_required,
            is_featured: courseData.is_featured,
            learning_objectives: (courseData.learning_objectives || []).join('\n'),
          });
        }
      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [courseId, form]);

  const onSubmit = async (data: CourseFormData) => {
    setSaving(true);
    try {
      const learningObjectives = data.learning_objectives
        ?.split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0) || [];

      const res = await fetch(`/api/admin/training/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          learning_objectives: learningObjectives,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setCourse(prev => prev ? { ...prev, ...result.course } : null);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to update course');
      }
    } catch (error) {
      console.error('Error updating course:', error);
      alert('Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    const isPublished = course?.status === 'published';
    try {
      const res = await fetch(`/api/admin/training/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: isPublished ? 'draft' : 'published',
          published_at: isPublished ? null : new Date().toISOString(),
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setCourse(prev => prev ? { ...prev, ...result.course } : null);
      }
    } catch (error) {
      console.error('Error publishing course:', error);
    }
  };

  const openLessonDialog = (lesson?: Lesson) => {
    if (lesson) {
      setEditingLesson(lesson);
      lessonForm.reset({
        title: lesson.title,
        content_type: lesson.content_type,
        content_url: lesson.content_url || '',
        content_text: lesson.content_text || '',
        duration_minutes: lesson.duration_minutes || 0,
        is_preview: lesson.is_preview,
      });
    } else {
      setEditingLesson(null);
      lessonForm.reset({
        title: '',
        content_type: 'video',
        content_url: '',
        content_text: '',
        duration_minutes: 0,
        is_preview: false,
      });
    }
    setLessonDialogOpen(true);
  };

  const onSaveLesson = async (data: LessonFormData) => {
    setSavingLesson(true);
    try {
      if (editingLesson) {
        // Update existing lesson
        const res = await fetch(`/api/admin/training/lessons/${editingLesson.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          const result = await res.json();
          setCourse(prev => {
            if (!prev) return null;
            const newLessons = prev.lessons.map(l =>
              l.id === editingLesson.id ? result.lesson : l
            );
            return { ...prev, lessons: newLessons };
          });
          setLessonDialogOpen(false);
        }
      } else {
        // Create new lesson
        const res = await fetch(`/api/admin/training/courses/${courseId}/lessons`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            order: (course?.lessons?.length || 0) + 1,
          }),
        });

        if (res.ok) {
          const result = await res.json();
          setCourse(prev => {
            if (!prev) return null;
            return {
              ...prev,
              lessons: [...(prev.lessons || []), result.lesson],
            };
          });
          setLessonDialogOpen(false);
        }
      }
    } catch (error) {
      console.error('Error saving lesson:', error);
    } finally {
      setSavingLesson(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    try {
      const res = await fetch(`/api/admin/training/lessons/${lessonId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setCourse(prev => {
          if (!prev) return null;
          return {
            ...prev,
            lessons: prev.lessons.filter(l => l.id !== lessonId),
          };
        });
      }
    } catch (error) {
      console.error('Error deleting lesson:', error);
    }
  };

  // Get all lessons in order
  const allLessons = course?.lessons || [];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-6">
        <Link href="/admin/training/courses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Course not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/training/courses">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
              <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                {COURSE_STATUS_LABELS[course.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground">Edit course details and lessons</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/training/courses/${courseId}`}>
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </Link>
          <Button
            variant={course.status === 'published' ? 'outline' : 'default'}
            onClick={handlePublish}
          >
            {course.status === 'published' ? 'Unpublish' : 'Publish'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Course Details</TabsTrigger>
          <TabsTrigger value="lessons">
            Lessons ({allLessons.length})
          </TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea className="min-h-[100px]" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="instructor_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instructor Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(COURSE_CATEGORY_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="skill_level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Skill Level</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(SKILL_LEVEL_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estimated_minutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Duration (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="is_required"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Required Course</FormLabel>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="is_featured"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Featured Course</FormLabel>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Learning Objectives */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Learning Objectives</CardTitle>
                    <CardDescription>One per line</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="learning_objectives"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea className="min-h-[100px]" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        {/* Lessons Tab */}
        <TabsContent value="lessons">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Lessons</CardTitle>
                <CardDescription>
                  {allLessons.length} lessons in this course
                </CardDescription>
              </div>
              <Button onClick={() => openLessonDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Lesson
              </Button>
            </CardHeader>
            <CardContent>
              {allLessons.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No lessons yet. Add your first lesson!
                  </p>
                  <Button onClick={() => openLessonDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lesson
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {allLessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <GripVertical className="h-4 w-4" />
                        <span className="text-sm w-6">{index + 1}.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {contentTypeIcons[lesson.content_type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{lesson.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {lesson.content_type} • {lesson.duration_minutes || 0} min
                          {lesson.is_preview && ' • Preview'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openLessonDialog(lesson)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteLesson(lesson.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Quizzes & Exams</CardTitle>
                <CardDescription>
                  Manage quizzes for this course
                </CardDescription>
              </div>
              <Link href={`/admin/training/quizzes/new?courseId=${courseId}`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Quiz
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-12">
                Quiz management coming soon. Use the Quiz Builder for now.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
            </DialogTitle>
            <DialogDescription>
              {editingLesson ? 'Update the lesson details' : 'Create a new lesson for this course'}
            </DialogDescription>
          </DialogHeader>

          <Form {...lessonForm}>
            <form onSubmit={lessonForm.handleSubmit(onSaveLesson)} className="space-y-4">
              <FormField
                control={lessonForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Introduction to IUL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={lessonForm.control}
                name="content_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="audio">Audio</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {['video', 'audio', 'pdf'].includes(lessonForm.watch('content_type')) && (
                <FormField
                  control={lessonForm.control}
                  name="content_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://youtube.com/watch?v=... or file URL"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        YouTube, Vimeo, or direct file URL
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {lessonForm.watch('content_type') === 'text' && (
                <FormField
                  control={lessonForm.control}
                  name="content_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter the lesson content (HTML supported)"
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={lessonForm.control}
                name="duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={lessonForm.control}
                name="is_preview"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Allow Preview</FormLabel>
                      <FormDescription>
                        Non-enrolled users can view this lesson
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLessonDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={savingLesson}>
                  {savingLesson ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Lesson'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
