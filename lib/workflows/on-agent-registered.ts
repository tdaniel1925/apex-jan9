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
  let effectiveSponsorId = sponsorId;

  try {
    // ================================================
    // 1. PLACE IN MATRIX
    // ================================================

    // If no sponsor provided, use FC Inc. (root) as the default sponsor
    if (!effectiveSponsorId) {
      const { data: fcAgent } = await supabase
        .from('agents')
        .select('id')
        .eq('agent_code', 'FC-INC-001')
        .single();

      if (fcAgent) {
        effectiveSponsorId = (fcAgent as { id: string }).id;
      }
    }

    if (effectiveSponsorId) {
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
          effectiveSponsorId
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
      // No sponsor AND no FC Inc. found - create legacy root position
      // This should only happen if FC Inc. hasn't been seeded yet
      const { data: rootPosition } = await supabase
        .from('matrix_positions')
        .select('*')
        .eq('level', 0)
        .single();

      if (!rootPosition) {
        // Create root position (legacy mode)
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
        errors.push('Root position already exists and no sponsor provided');
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
    try {
      const { sendWelcomeEmail } = await import('../email/email-service');

      // Get sponsor name for the email
      let sponsorName = 'Apex Affinity Group';
      if (sponsorId) {
        const { data: sponsorData } = await supabase
          .from('agents')
          .select('first_name, last_name')
          .eq('id', sponsorId)
          .single();

        if (sponsorData) {
          const typedSponsor = sponsorData as { first_name: string; last_name: string };
          sponsorName = `${typedSponsor.first_name} ${typedSponsor.last_name}`;
        }
      }

      const emailResult = await sendWelcomeEmail({
        to: agent.email,
        agentName: `${agent.first_name} ${agent.last_name}`,
        agentCode: agent.agent_code,
        sponsorName,
      });

      if (!emailResult.success) {
        errors.push(`Failed to send welcome email: ${emailResult.error}`);
      }
    } catch (emailError) {
      errors.push(`Email service error: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`);
    }

    // ================================================
    // 6. ENROLL IN DRIP CAMPAIGN
    // ================================================
    try {
      const { enrollAgentInDripCampaign } = await import('../services/drip-campaign-service');

      // Get the agent's license status (defaults to false if not set)
      const isLicensedAgent = agent.is_licensed_agent ?? false;

      const dripResult = await enrollAgentInDripCampaign(agent.id, isLicensedAgent);

      if (!dripResult.success && dripResult.error) {
        errors.push(`Drip campaign enrollment: ${dripResult.error}`);
      }
    } catch (dripError) {
      errors.push(`Drip campaign error: ${dripError instanceof Error ? dripError.message : 'Unknown error'}`);
    }

    // ================================================
    // 7. NOTIFY SPONSOR
    // ================================================
    // TODO: Implement notification service for sponsor alerts
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
