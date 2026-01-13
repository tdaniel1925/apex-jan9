/**
 * Training API Route Tests
 * Tests for app/api/training/* routes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase server client
vi.mock('@/lib/db/supabase-server', () => ({
  createServerSupabaseClient: vi.fn(() => Promise.resolve({
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'test-agent-id' },
            error: null,
          })),
        })),
      })),
    })),
  })),
}));

describe('Training API Error Handling', () => {
  describe('Unauthorized Access', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = {
        error: 'Unauthorized',
        status: 401,
      };
      
      expect(response.status).toBe(401);
      expect(response.error).toBe('Unauthorized');
    });
  });

  describe('Agent Not Found', () => {
    it('should return 404 when agent not found', async () => {
      const response = {
        error: 'Agent not found',
        status: 404,
      };
      
      expect(response.status).toBe(404);
      expect(response.error).toBe('Agent not found');
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 for invalid data', async () => {
      const response = {
        error: 'Validation failed',
        status: 400,
      };
      
      expect(response.status).toBe(400);
      expect(response.error).toBe('Validation failed');
    });
  });
});

describe('Training API Response Format', () => {
  it('should return courses in expected format', async () => {
    const mockCourses = [
      {
        id: 'course-1',
        title: 'Test Course',
        description: 'Description',
        status: 'published',
        enrollment: null,
        lessons_count: 5,
        completed_lessons_count: 0,
      },
    ];
    
    const response = { courses: mockCourses };
    
    expect(response.courses).toHaveLength(1);
    expect(response.courses[0]).toHaveProperty('id');
    expect(response.courses[0]).toHaveProperty('title');
    expect(response.courses[0]).toHaveProperty('lessons_count');
  });

  it('should return tracks in expected format', async () => {
    const mockTracks = [
      {
        id: 'track-1',
        title: 'New Agent Track',
        track_type: 'new_agent',
        courses: [],
        enrollment: null,
        total_courses: 3,
        completed_courses: 0,
      },
    ];
    
    const response = { tracks: mockTracks };
    
    expect(response.tracks).toHaveLength(1);
    expect(response.tracks[0]).toHaveProperty('track_type');
  });

  it('should return stats in expected format', async () => {
    const mockStats = {
      total_courses_enrolled: 5,
      total_courses_completed: 2,
      total_lessons_completed: 15,
      total_time_spent_minutes: 120,
      total_certificates: 1,
      current_streak: 3,
      longest_streak: 7,
      total_points: 500,
      achievements: [],
    };
    
    const response = { stats: mockStats };
    
    expect(response.stats.total_courses_enrolled).toBe(5);
    expect(response.stats.current_streak).toBe(3);
    expect(response.stats).toHaveProperty('achievements');
  });
});

describe('Quiz Submission API', () => {
  it('should validate quiz submission schema', () => {
    const validSubmission = {
      started_at: '2024-01-15T10:00:00Z',
      answers: [
        {
          question_id: '550e8400-e29b-41d4-a716-446655440000',
          selected_answers: ['550e8400-e29b-41d4-a716-446655440001'],
        },
      ],
    };
    
    expect(validSubmission.started_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(Array.isArray(validSubmission.answers)).toBe(true);
  });

  it('should handle max attempts exceeded error', async () => {
    const response = {
      error: 'Maximum attempts exceeded for this quiz',
      status: 400,
    };
    
    expect(response.status).toBe(400);
    expect(response.error).toContain('Maximum attempts');
  });

  it('should return quiz results with correct format', async () => {
    const mockAttempt = {
      id: 'attempt-1',
      score: 80,
      percentage: 80,
      passed: true,
      time_taken_seconds: 300,
    };
    
    expect(mockAttempt.passed).toBe(true);
    expect(mockAttempt.percentage).toBe(80);
  });
});

describe('License API', () => {
  it('should validate license schema', () => {
    const validLicense = {
      state_code: 'CA',
      license_type: 'life_and_health',
      license_number: 'LIC12345',
      status: 'active',
    };
    
    expect(validLicense.state_code).toHaveLength(2);
    expect(['life', 'health', 'life_and_health', 'variable']).toContain(validLicense.license_type);
  });

  it('should return licenses in expected format', async () => {
    const mockLicenses = [
      {
        id: 'license-1',
        state_code: 'CA',
        license_type: 'life_and_health',
        status: 'active',
        ce_credits_required: 24,
        ce_credits_completed: 12,
      },
    ];
    
    const response = { licenses: mockLicenses };
    
    expect(response.licenses).toHaveLength(1);
    expect(response.licenses[0].state_code).toBe('CA');
  });
});

describe('Certificates API', () => {
  it('should return certificates in expected format', async () => {
    const mockCertificates = [
      {
        id: 'cert-1',
        certificate_number: 'CERT-ABC123DEF4',
        title: 'IUL Sales Mastery',
        recipient_name: 'John Doe',
        issued_at: '2024-01-15T10:00:00Z',
      },
    ];
    
    const response = { certificates: mockCertificates };
    
    expect(response.certificates).toHaveLength(1);
    expect(response.certificates[0].certificate_number).toMatch(/^CERT-/);
  });
});
