/**
 * Tax Documents API
 * GET - Generate income statement or 1099 data for a tax year
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/db/supabase-server';
import { z } from 'zod';

interface Commission {
  commission_amount: number;
  created_at: string;
}

interface Override {
  override_amount: number;
  created_at: string;
}

interface Bonus {
  amount: number;
  bonus_type: string;
  created_at: string;
}

interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  agent_code: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  ssn_last_four: string | null;
  created_at: string;
}

const querySchema = z.object({
  year: z.coerce.number().min(2020).max(2099),
  type: z.enum(['income_statement', '1099_summary']).default('income_statement'),
  format: z.enum(['json', 'csv']).default('json'),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get agent
    const { data: agentData, error: agentError } = await supabase
      .from('agents')
      .select('id, first_name, last_name, email, phone, agent_code, address_line1, address_line2, city, state, zip_code, ssn_last_four, created_at')
      .eq('user_id', user.id)
      .single();

    if (agentError || !agentData) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agent = agentData as Agent;

    // Parse query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parseResult = querySchema.safeParse(searchParams);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { year, type, format } = parseResult.data;

    // Define date range for the tax year
    const startDate = new Date(year, 0, 1).toISOString();
    const endDate = new Date(year, 11, 31, 23, 59, 59).toISOString();

    // Fetch commissions for the year
    const { data: commissionsData } = await supabase
      .from('commissions')
      .select('commission_amount, created_at')
      .eq('agent_id', agent.id)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const commissions = (commissionsData || []) as Commission[];

    // Fetch overrides for the year
    const { data: overridesData } = await supabase
      .from('overrides')
      .select('override_amount, created_at')
      .eq('agent_id', agent.id)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const overrides = (overridesData || []) as Override[];

    // Fetch bonuses for the year
    const { data: bonusesData } = await supabase
      .from('bonuses')
      .select('amount, bonus_type, created_at')
      .eq('agent_id', agent.id)
      .eq('status', 'paid')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const bonuses = (bonusesData || []) as Bonus[];

    // Calculate totals
    const totalCommissions = commissions.reduce((sum, c) => sum + Number(c.commission_amount), 0);
    const totalOverrides = overrides.reduce((sum, o) => sum + Number(o.override_amount), 0);
    const totalBonuses = bonuses.reduce((sum, b) => sum + Number(b.amount), 0);
    const totalEarnings = totalCommissions + totalOverrides + totalBonuses;

    // Monthly breakdown
    const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthStart = new Date(year, i, 1);
      const monthEnd = new Date(year, i + 1, 0, 23, 59, 59);

      const monthCommissions = commissions
        .filter(c => {
          const date = new Date(c.created_at);
          return date >= monthStart && date <= monthEnd;
        })
        .reduce((sum, c) => sum + Number(c.commission_amount), 0);

      const monthOverrides = overrides
        .filter(o => {
          const date = new Date(o.created_at);
          return date >= monthStart && date <= monthEnd;
        })
        .reduce((sum, o) => sum + Number(o.override_amount), 0);

      const monthBonuses = bonuses
        .filter(b => {
          const date = new Date(b.created_at);
          return date >= monthStart && date <= monthEnd;
        })
        .reduce((sum, b) => sum + Number(b.amount), 0);

      return {
        month,
        monthName: monthStart.toLocaleString('default', { month: 'long' }),
        commissions: monthCommissions,
        overrides: monthOverrides,
        bonuses: monthBonuses,
        total: monthCommissions + monthOverrides + monthBonuses,
      };
    });

    // Bonus breakdown by type
    const bonusByType: Record<string, number> = {};
    bonuses.forEach(b => {
      const type = b.bonus_type || 'other';
      bonusByType[type] = (bonusByType[type] || 0) + Number(b.amount);
    });

    const document = {
      type,
      year,
      generatedAt: new Date().toISOString(),
      agent: {
        name: `${agent.first_name} ${agent.last_name}`,
        email: agent.email,
        phone: agent.phone,
        agentCode: agent.agent_code,
        address: agent.address_line1 ? {
          line1: agent.address_line1,
          line2: agent.address_line2,
          city: agent.city,
          state: agent.state,
          zipCode: agent.zip_code,
        } : null,
        ssnLastFour: agent.ssn_last_four,
      },
      summary: {
        totalCommissions,
        totalOverrides,
        totalBonuses,
        totalEarnings,
        transactionCount: commissions.length + overrides.length + bonuses.length,
      },
      monthlyBreakdown,
      bonusByType,
      disclaimer: type === '1099_summary'
        ? 'This is a summary for informational purposes only. Your official 1099-NEC form will be mailed by January 31st if your total earnings exceed $600. Please consult with a tax professional for guidance.'
        : 'This income statement is for your records. It may not include all compensation if payments were made outside the normal commission system.',
    };

    if (format === 'csv') {
      // Generate CSV
      const csvLines = [
        `Apex Affinity Group - ${type === '1099_summary' ? '1099 Summary' : 'Income Statement'}`,
        `Tax Year: ${year}`,
        `Agent: ${agent.first_name} ${agent.last_name} (${agent.agent_code})`,
        `Generated: ${new Date().toLocaleDateString()}`,
        '',
        'SUMMARY',
        `Direct Commissions,$${totalCommissions.toFixed(2)}`,
        `Override Commissions,$${totalOverrides.toFixed(2)}`,
        `Bonuses,$${totalBonuses.toFixed(2)}`,
        `Total Earnings,$${totalEarnings.toFixed(2)}`,
        '',
        'MONTHLY BREAKDOWN',
        'Month,Commissions,Overrides,Bonuses,Total',
        ...monthlyBreakdown.map(m =>
          `${m.monthName},$${m.commissions.toFixed(2)},$${m.overrides.toFixed(2)},$${m.bonuses.toFixed(2)},$${m.total.toFixed(2)}`
        ),
        '',
        'BONUS BREAKDOWN',
        'Type,Amount',
        ...Object.entries(bonusByType).map(([type, amount]) =>
          `${type},$${amount.toFixed(2)}`
        ),
        '',
        document.disclaimer,
      ];

      const csvContent = csvLines.join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${type}-${year}-${agent.agent_code}.csv"`,
        },
      });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error('Tax documents error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
