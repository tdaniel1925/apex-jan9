'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipBack,
  SkipForward,
  CheckCircle2,
  FileText
} from 'lucide-react';
import type { Lesson, Quiz, QuizQuestion, QuizAnswer, QuizAttempt } from '@/lib/types/training';
import { QuizComponent } from './quiz-component';

interface LessonPlayerProps {
  lesson: Lesson;
  onComplete: () => void;
  onProgress: (position: number, completed: boolean) => void;
  initialPosition?: number;
}

export function LessonPlayer({ lesson, onComplete, onProgress, initialPosition = 0 }: LessonPlayerProps) {
  const contentType = lesson.content_type;

  switch (contentType) {
    case 'video':
      return (
        <VideoPlayer
          lesson={lesson}
          onComplete={onComplete}
          onProgress={onProgress}
          initialPosition={initialPosition}
        />
      );
    case 'audio':
      return (
        <AudioPlayer
          lesson={lesson}
          onComplete={onComplete}
          onProgress={onProgress}
          initialPosition={initialPosition}
        />
      );
    case 'text':
      return (
        <TextContent
          lesson={lesson}
          onComplete={onComplete}
        />
      );
    case 'pdf':
      return (
        <PdfViewer
          lesson={lesson}
          onComplete={onComplete}
        />
      );
    case 'quiz':
      return (
        <LessonQuiz lesson={lesson} onComplete={onComplete} />
      );
    default:
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Unknown content type: {contentType}
            </p>
          </CardContent>
        </Card>
      );
  }
}

// Video Player Component
interface VideoPlayerProps {
  lesson: Lesson;
  onComplete: () => void;
  onProgress: (position: number, completed: boolean) => void;
  initialPosition: number;
}

function VideoPlayer({ lesson, onComplete, onProgress, initialPosition }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      if (initialPosition > 0) {
        video.currentTime = initialPosition;
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      const newProgress = (video.currentTime / video.duration) * 100;
      setProgress(newProgress);

      // Mark complete at 90% watched
      if (newProgress >= 90 && !hasCompleted) {
        setHasCompleted(true);
        onComplete();
      }

      // Report progress every 10 seconds
      if (Math.floor(video.currentTime) % 10 === 0) {
        onProgress(video.currentTime, newProgress >= 90);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (!hasCompleted) {
        setHasCompleted(true);
        onComplete();
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [initialPosition, hasCompleted, onComplete, onProgress]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const seek = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, duration));
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * duration;
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Check if it's a YouTube embed
  const isYouTube = lesson.content_url?.includes('youtube.com') || lesson.content_url?.includes('youtu.be');

  if (isYouTube) {
    // Extract YouTube video ID
    const videoId = lesson.content_url?.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s]+)/)?.[1];
    return (
      <div className="space-y-4">
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?rel=0`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Watch the video above to complete this lesson.
          </p>
          <Button onClick={onComplete} variant={hasCompleted ? 'outline' : 'default'}>
            {hasCompleted ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                Completed
              </>
            ) : (
              'Mark as Complete'
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Video Element */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden group">
        <video
          ref={videoRef}
          src={lesson.content_url || ''}
          className="w-full h-full"
          onClick={togglePlay}
        />

        {/* Play Overlay */}
        {!isPlaying && (
          <div
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            onClick={togglePlay}
          >
            <div className="rounded-full bg-white/90 p-4">
              <Play className="h-8 w-8 text-primary" />
            </div>
          </div>
        )}

        {/* Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Progress Bar */}
          <div
            className="w-full h-1 bg-white/30 rounded-full cursor-pointer mb-3"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => seek(-10)}>
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={togglePlay}>
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => seek(10)}>
                <SkipForward className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={toggleMute}>
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <span className="text-white text-sm ml-2">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={toggleFullscreen}>
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Completion Status */}
      {hasCompleted && (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-medium">Lesson completed!</span>
        </div>
      )}
    </div>
  );
}

// Audio Player Component
interface AudioPlayerProps {
  lesson: Lesson;
  onComplete: () => void;
  onProgress: (position: number, completed: boolean) => void;
  initialPosition: number;
}

function AudioPlayer({ lesson, onComplete, onProgress, initialPosition }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      if (initialPosition > 0) {
        audio.currentTime = initialPosition;
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      const newProgress = (audio.currentTime / audio.duration) * 100;
      setProgress(newProgress);

      if (newProgress >= 90 && !hasCompleted) {
        setHasCompleted(true);
        onComplete();
      }

      if (Math.floor(audio.currentTime) % 10 === 0) {
        onProgress(audio.currentTime, newProgress >= 90);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (!hasCompleted) {
        setHasCompleted(true);
        onComplete();
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [initialPosition, hasCompleted, onComplete, onProgress]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pos * duration;
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardContent className="py-6">
        <audio ref={audioRef} src={lesson.content_url || ''} />

        <div className="space-y-4">
          {/* Waveform placeholder and controls */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-14 w-14 rounded-full"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
            </Button>

            <div className="flex-1 space-y-2">
              {/* Progress Bar */}
              <div
                className="w-full h-2 bg-muted rounded-full cursor-pointer"
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Time */}
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          {/* Completion Status */}
          {hasCompleted && (
            <div className="flex items-center gap-2 text-green-600 pt-2">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Lesson completed!</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Text Content Component
interface TextContentProps {
  lesson: Lesson;
  onComplete: () => void;
}

function TextContent({ lesson, onComplete }: TextContentProps) {
  const [hasCompleted, setHasCompleted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const content = contentRef.current;
      if (!content || hasCompleted) return;

      const { scrollTop, scrollHeight, clientHeight } = content;
      // Mark complete when scrolled to 80% of content
      if (scrollTop + clientHeight >= scrollHeight * 0.8) {
        setHasCompleted(true);
        onComplete();
      }
    };

    const content = contentRef.current;
    if (content) {
      content.addEventListener('scroll', handleScroll);
      // Also check if content is shorter than viewport
      if (content.scrollHeight <= content.clientHeight) {
        // Content fits without scrolling, mark complete after 10 seconds
        const timer = setTimeout(() => {
          if (!hasCompleted) {
            setHasCompleted(true);
            onComplete();
          }
        }, 10000);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      if (content) {
        content.removeEventListener('scroll', handleScroll);
      }
    };
  }, [hasCompleted, onComplete]);

  return (
    <Card>
      <CardContent className="py-6">
        <div
          ref={contentRef}
          className="prose prose-slate max-w-none max-h-[600px] overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: lesson.content_text || '<p>No content available.</p>' }}
        />

        <div className="mt-6 pt-4 border-t flex justify-between items-center">
          {hasCompleted ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Lesson completed!</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Read through the content above to complete this lesson.
            </p>
          )}
          {!hasCompleted && (
            <Button onClick={() => { setHasCompleted(true); onComplete(); }}>
              Mark as Complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// PDF Viewer Component
interface PdfViewerProps {
  lesson: Lesson;
  onComplete: () => void;
}

function PdfViewer({ lesson, onComplete }: PdfViewerProps) {
  const [hasCompleted, setHasCompleted] = useState(false);

  return (
    <Card>
      <CardContent className="py-6">
        {lesson.content_url ? (
          <div className="space-y-4">
            <div className="aspect-[8.5/11] bg-muted rounded-lg overflow-hidden">
              <iframe
                src={`${lesson.content_url}#view=FitH`}
                className="w-full h-full"
                title={lesson.title}
              />
            </div>

            <div className="flex justify-between items-center">
              {hasCompleted ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium">Lesson completed!</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Review the document above to complete this lesson.
                </p>
              )}
              {!hasCompleted && (
                <Button onClick={() => { setHasCompleted(true); onComplete(); }}>
                  Mark as Complete
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">PDF not available.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Lesson Quiz Component - Fetches and displays quiz for a lesson
interface LessonQuizProps {
  lesson: Lesson;
  onComplete: () => void;
}

interface QuizWithQuestions extends Quiz {
  attempts_used?: number;
  questions: (QuizQuestion & { answers: QuizAnswer[] })[];
}

function LessonQuiz({ lesson, onComplete }: LessonQuizProps) {
  const [quiz, setQuiz] = useState<QuizWithQuestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuiz() {
      if (!lesson.id) return;

      try {
        // First, we need to find the quiz associated with this lesson
        // The quiz API endpoint needs a quiz ID, not lesson ID
        // So we'll fetch through an endpoint that finds quiz by lesson_id
        const res = await fetch(`/api/training/lessons/${lesson.id}/quiz`);
        if (res.ok) {
          const data = await res.json();
          if (data.quiz) {
            setQuiz(data.quiz);
          } else {
            setError('No quiz associated with this lesson');
          }
        } else {
          const err = await res.json();
          setError(err.error || 'Failed to load quiz');
        }
      } catch (error) {
        console.error('Error fetching quiz:', error);
        setError('Failed to load quiz');
      } finally {
        setLoading(false);
      }
    }
    fetchQuiz();
  }, [lesson.id]);

  const handleComplete = (attempt: QuizAttempt) => {
    if (attempt.passed) {
      onComplete();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-12 w-12 bg-muted rounded-full mx-auto" />
            <div className="h-4 bg-muted rounded w-48 mx-auto" />
            <div className="h-3 bg-muted rounded w-64 mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !quiz) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold text-lg mb-2">Quiz: {lesson.title}</h3>
          <p className="text-muted-foreground mb-4">
            {error || 'Quiz not available for this lesson.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <QuizComponent
      quiz={quiz}
      onComplete={handleComplete}
    />
  );
}

export default LessonPlayer;
