/**
 * Agent Signup API
 * POST - Create a new agent account with full workflow
 *
 * This handles:
 * 1. Validate input and check for duplicate email
 * 2. Create Supabase auth user
 * 3. Generate unique agent_code and username
 * 4. Create agent record
 * 5. Run onAgentRegistered workflow (wallet, matrix, welcome email, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabase-server';
import { onAgentRegistered } from '@/lib/workflows/on-agent-registered';
import type { Agent, AgentInsert } from '@/lib/types/database';
import type { Rank } from '@/lib/config/ranks';

// Signup schema
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  sponsorUsername: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    // Validate input
    const parseResult = signupSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName, phone, sponsorUsername } = parseResult.data;

    // Check if email already exists
    const { data: existingAgent } = await supabase
      .from('agents')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingAgent) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Look up sponsor if username provided
    let sponsorId: string | null = null;
    if (sponsorUsername) {
      const { data: sponsor, error: sponsorError } = await supabase
        .from('agents')
        .select('id')
        .eq('username', sponsorUsername)
        .single();

      if (sponsorError || !sponsor) {
        return NextResponse.json(
          { error: 'Invalid sponsor code. Please check and try again.' },
          { status: 400 }
        );
      }
      sponsorId = (sponsor as { id: string }).id;
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: false, // Require email verification
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (authError || !authData.user) {
      console.error('Auth user create error:', authError);
      return NextResponse.json(
        { error: authError?.message || 'Failed to create account' },
        { status: 500 }
      );
    }

    // Generate unique agent code
    const agentCode = await generateAgentCode(supabase);

    // Generate username from email (or name)
    const username = await generateUniqueUsername(supabase, email, firstName, lastName);

    // Create agent record
    const insertData: AgentInsert = {
      user_id: authData.user.id,
      email: email.toLowerCase(),
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      username,
      agent_code: agentCode,
      sponsor_id: sponsorId,
      rank: 'pre_associate' as Rank,
      status: 'pending',
    };

    const { data: agent, error: createError } = await supabase
      .from('agents')
      .insert(insertData as never)
      .select()
      .single();

    if (createError || !agent) {
      console.error('Agent create error:', createError);
      // Clean up auth user if agent creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Failed to create agent profile' },
        { status: 500 }
      );
    }

    // Run the registration workflow (wallet, matrix, welcome email, onboarding)
    const workflowResult = await onAgentRegistered({
      agent: agent as Agent,
      sponsorId,
    });

    if (!workflowResult.success) {
      console.warn('Agent registration workflow had errors:', workflowResult.errors);
      // Don't fail signup, but log errors - agent is created successfully
    }

    // Send verification email using magic link
    // Note: User created with email_confirm: false needs explicit verification
    const { data: linkData, error: verifyError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email.toLowerCase(),
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/dashboard`,
      },
    });

    if (verifyError) {
      console.warn('Failed to generate verification link:', verifyError);
    } else if (linkData?.properties?.action_link) {
      // Send verification email via our email service
      try {
        const { sendVerificationEmail } = await import('@/lib/email/email-service');
        await sendVerificationEmail({
          to: email.toLowerCase(),
          agentName: `${firstName} ${lastName}`,
          verificationLink: linkData.properties.action_link,
        });
      } catch (emailErr) {
        console.warn('Failed to send verification email:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      agent: {
        id: (agent as { id: string }).id,
        email: email.toLowerCase(),
        firstName,
        lastName,
        agentCode,
        username,
      },
      requiresVerification: true,
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

// Helper to generate unique agent code
async function generateAgentCode(supabase: ReturnType<typeof createAdminClient>): Promise<string> {
  const prefix = 'APX';
  let code: string;
  let exists = true;

  while (exists) {
    const random = Math.floor(100000 + Math.random() * 900000);
    code = `${prefix}${random}`;

    const { data } = await supabase
      .from('agents')
      .select('id')
      .eq('agent_code', code)
      .single();

    exists = !!data;
  }

  return code!;
}

// Helper to generate unique username
async function generateUniqueUsername(
  supabase: ReturnType<typeof createAdminClient>,
  email: string,
  firstName: string,
  lastName: string
): Promise<string> {
  // Start with email prefix
  let baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

  // If too short, use first + last name
  if (baseUsername.length < 3) {
    baseUsername = `${firstName}${lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  // Truncate to reasonable length
  baseUsername = baseUsername.substring(0, 20);

  let username = baseUsername;
  let counter = 1;
  let exists = true;

  while (exists) {
    const { data } = await supabase
      .from('agents')
      .select('id')
      .eq('username', username)
      .single();

    if (!data) {
      exists = false;
    } else {
      username = `${baseUsername}${counter}`;
      counter++;
    }
  }

  return username;
}
