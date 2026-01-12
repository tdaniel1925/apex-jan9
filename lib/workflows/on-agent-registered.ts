/**
 * Workflow: On Agent Registered
 *
 * This workflow runs when a new agent completes registration.
 * It handles ALL downstream effects:
 * 1. Place agent in matrix (under sponsor with spillover)
 * 2. Create wallet
 * 3. Update sponsor's recruit counts
 * 4. Send welcome email
 * 5. Assign to onboarding course
 */

import { createAdminClient } from '../db/supabase-server';
import { Agent, MatrixPosition } from '../types/database';
import {
  findNextAvailablePosition,
  createMatrixPosition,
} from '../engines/matrix-engine';

export interface AgentRegisteredEvent {
  agent: Agent;
  sponsorId: string | null;
}

export interface AgentRegisteredResult {
  success: boolean;
  matrixPosition: string | null;
  errors: string[];
}

export async function onAgentRegistered(
  event: AgentRegisteredEvent
): Promise<AgentRegisteredResult> {
  const { agent, sponsorId } = event;
  const supabase = createAdminClient();
  const errors: string[] = [];
  let matrixPath: string | null = null;

  try {
    // ================================================
    // 1. PLACE IN MATRIX
    // ================================================
    if (sponsorId) {
      // Get all existing matrix positions
      const { data: existingPositions, error: positionsError } = await supabase
        .from('matrix_positions')
        .select('*');

      if (positionsError) {
        errors.push(`Failed to fetch matrix positions: ${positionsError.message}`);
      } else if (existingPositions) {
        // Find next available position under sponsor
        const placement = findNextAvailablePosition(
          existingPositions,
          sponsorId
        );

        if (placement) {
          const positionRecord = createMatrixPosition(agent.id, placement);

          const { error: insertError } = await supabase
            .from('matrix_positions')
            .insert(positionRecord as never);

          if (insertError) {
            errors.push(`Failed to create matrix position: ${insertError.message}`);
          } else {
            matrixPath = placement.path;
          }
        } else {
          // No position available - sponsor's downline is full
          errors.push('No available position in sponsor\'s matrix');
        }
      }
    } else {
      // No sponsor - this is a root agent
      // Check if there's already a root
      const { data: rootPosition, error: rootError } = await supabase
        .from('matrix_positions')
        .select('*')
        .eq('level', 0)
        .single();

      if (!rootPosition) {
        // Create root position
        const { error: insertError } = await supabase
          .from('matrix_positions')
          .insert({
            agent_id: agent.id,
            parent_id: null,
            position: 1,
            level: 0,
            path: '1',
          } as never);

        if (insertError) {
          errors.push(`Failed to create root position: ${insertError.message}`);
        } else {
          matrixPath = '1';
        }
      } else {
        errors.push('Root position already exists');
      }
    }

    // ================================================
    // 2. CREATE WALLET
    // ================================================
    const { error: walletError } = await supabase.from('wallets').insert({
      agent_id: agent.id,
      balance: 0,
      pending_balance: 0,
      lifetime_earnings: 0,
    } as never);

    if (walletError) {
      errors.push(`Failed to create wallet: ${walletError.message}`);
    }

    // ================================================
    // 3. UPDATE SPONSOR'S COUNTS
    // ================================================
    if (sponsorId) {
      // Increment personal_recruits_count
      const { error: updateError } = await supabase.rpc(
        'increment_sponsor_recruit_count' as never,
        { sponsor_id: sponsorId } as never
      );

      if (updateError) {
        errors.push(`Failed to update sponsor counts: ${updateError.message}`);
      }

      // Check if sponsor should be promoted
      const { data: sponsorData, error: sponsorError } = await supabase
        .from('agents')
        .select('*')
        .eq('id', sponsorId)
        .single();

      const sponsor = sponsorData as Agent | null;
      if (sponsor && !sponsorError) {
        const { shouldPromote } = await import('../engines/rank-engine');
        const promotion = shouldPromote(sponsor);

        if (promotion.shouldPromote && promotion.newRank) {
          // Update sponsor's rank
          const { error: rankError } = await supabase
            .from('agents')
            .update({ rank: promotion.newRank } as never)
            .eq('id', sponsorId);

          if (!rankError) {
            // Trigger rank changed workflow
            const { onRankChanged } = await import('./on-rank-changed');
            await onRankChanged({
              agent: { ...sponsor, rank: promotion.newRank },
              previousRank: sponsor.rank,
              newRank: promotion.newRank,
            });
          }
        }
      }
    }

    // ================================================
    // 4. ASSIGN ONBOARDING COURSE
    // ================================================
    const { data: onboardingCourse, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('category', 'onboarding')
      .eq('is_required', true)
      .order('order', { ascending: true })
      .limit(1)
      .single();

    const typedCourse = onboardingCourse as { id: string } | null;
    if (typedCourse && !courseError) {
      // Get first lesson
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', typedCourse.id)
        .order('order', { ascending: true })
        .limit(1)
        .single();

      const firstLesson = lessonData as { id: string } | null;
      if (firstLesson && !lessonError) {
        // Create progress record
        await supabase.from('course_progress').insert({
          agent_id: agent.id,
          course_id: typedCourse.id,
          lesson_id: firstLesson.id,
          completed: false,
          completed_at: null,
          quiz_score: null,
        } as never);
      }
    }

    // ================================================
    // 5. SEND WELCOME EMAIL
    // ================================================
    // TODO: Implement email service
    // await EmailService.sendWelcome(agent);

    // ================================================
    // 6. NOTIFY SPONSOR
    // ================================================
    // TODO: Implement notification service
    // if (sponsorId) {
    //   await NotificationService.sendNewRecruit(sponsorId, agent);
    // }

    return {
      success: errors.length === 0,
      matrixPosition: matrixPath,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      matrixPosition: null,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}
