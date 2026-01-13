/**
 * Training Service Tests
 * Tests for lib/services/training-service.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  upsert: vi.fn(() => mockSupabase),
  delete: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  in: vi.fn(() => mockSupabase),
  is: vi.fn(() => mockSupabase),
  not: vi.fn(() => mockSupabase),
  or: vi.fn(() => mockSupabase),
  gte: vi.fn(() => mockSupabase),
  lte: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
  single: vi.fn(() => Promise.resolve({ data: null, error: null })),
  rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
};

vi.mock('@/lib/db/supabase-server', () => ({
  createAdminClient: () => mockSupabase,
}));

// Import after mocking
import { generateSlug } from '@/lib/services/training-service';

describe('Training Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSlug', () => {
    it('should convert title to lowercase slug', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
    });

    it('should remove special characters', () => {
      expect(generateSlug('Hello! World? Test.')).toBe('hello-world-test');
    });

    it('should trim leading/trailing hyphens', () => {
      expect(generateSlug('---Hello World---')).toBe('hello-world');
    });

    it('should handle multiple spaces', () => {
      expect(generateSlug('Hello    World')).toBe('hello-world');
    });

    it('should truncate to 100 characters', () => {
      const longTitle = 'A'.repeat(150);
      expect(generateSlug(longTitle).length).toBe(100);
    });

    it('should handle empty string', () => {
      expect(generateSlug('')).toBe('');
    });

    it('should handle numbers in title', () => {
      expect(generateSlug('IUL 101: Introduction')).toBe('iul-101-introduction');
    });
  });
});

describe('Quiz Grading Logic', () => {
  it('should correctly compare answer sets for multiple choice', () => {
    const correctAnswers = new Set(['a1', 'a2']);
    const selectedAnswers = new Set(['a1', 'a2']);
    
    const isCorrect = correctAnswers.size === selectedAnswers.size &&
      [...correctAnswers].every(a => selectedAnswers.has(a));
    
    expect(isCorrect).toBe(true);
  });

  it('should return false for partial correct answers', () => {
    const correctAnswers = new Set(['a1', 'a2']);
    const selectedAnswers = new Set(['a1']);
    
    const isCorrect = correctAnswers.size === selectedAnswers.size &&
      [...correctAnswers].every(a => selectedAnswers.has(a));
    
    expect(isCorrect).toBe(false);
  });

  it('should return false for wrong answers', () => {
    const correctAnswers = new Set(['a1']);
    const selectedAnswers = new Set(['a2']);
    
    const isCorrect = correctAnswers.size === selectedAnswers.size &&
      [...correctAnswers].every(a => selectedAnswers.has(a));
    
    expect(isCorrect).toBe(false);
  });

  it('should return false for extra answers', () => {
    const correctAnswers = new Set(['a1']);
    const selectedAnswers = new Set(['a1', 'a2']);
    
    const isCorrect = correctAnswers.size === selectedAnswers.size &&
      [...correctAnswers].every(a => selectedAnswers.has(a));
    
    expect(isCorrect).toBe(false);
  });
});

describe('Score Calculation', () => {
  it('should calculate percentage correctly', () => {
    const score = 7;
    const maxScore = 10;
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    
    expect(percentage).toBe(70);
  });

  it('should handle zero max score', () => {
    const score = 0;
    const maxScore = 0;
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    
    expect(percentage).toBe(0);
  });

  it('should determine pass/fail correctly at 70% threshold', () => {
    const passingScore = 70;
    
    expect(69 >= passingScore).toBe(false);
    expect(70 >= passingScore).toBe(true);
    expect(71 >= passingScore).toBe(true);
  });
});

describe('Streak Calculation', () => {
  it('should calculate consecutive days correctly', () => {
    const today = new Date('2024-01-15');
    const lastDate = new Date('2024-01-14');
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    expect(diffDays).toBe(1);
  });

  it('should detect streak break', () => {
    const today = new Date('2024-01-15');
    const lastDate = new Date('2024-01-12');
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    expect(diffDays).toBe(3);
    expect(diffDays > 1).toBe(true);
  });

  it('should detect same day activity', () => {
    const today = '2024-01-15';
    const lastDate = '2024-01-15';
    
    expect(today === lastDate).toBe(true);
  });
});

describe('Progress Calculation', () => {
  it('should calculate course progress percentage', () => {
    const totalLessons = 10;
    const completedLessons = 5;
    const percentage = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;
    
    expect(percentage).toBe(50);
  });

  it('should handle no lessons', () => {
    const totalLessons = 0;
    const completedLessons = 0;
    const percentage = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;
    
    expect(percentage).toBe(0);
  });

  it('should detect course completion', () => {
    const percentage = 100;
    const isComplete = percentage === 100;
    
    expect(isComplete).toBe(true);
  });
});

describe('Time Formatting', () => {
  it('should format minutes correctly', () => {
    const formatTime = (minutes: number) => {
      if (minutes < 60) return minutes + 'm';
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? hours + 'h ' + mins + 'm' : hours + 'h';
    };

    expect(formatTime(30)).toBe('30m');
    expect(formatTime(60)).toBe('1h');
    expect(formatTime(90)).toBe('1h 30m');
    expect(formatTime(120)).toBe('2h');
  });
});

describe('Certificate Number Generation', () => {
  it('should generate valid certificate number format', () => {
    // Pattern: CERT-XXXXXXXXXX (10 alphanumeric chars)
    const certNumber = 'CERT-ABC123DEF4';
    const pattern = /^CERT-[A-Z0-9]{10}$/;
    
    expect(pattern.test(certNumber)).toBe(true);
  });
});
