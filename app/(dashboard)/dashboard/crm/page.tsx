'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ContactsList } from '@/components/crm/contacts-list';
import { AddContactDialog } from '@/components/crm/add-contact-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, Clock, CheckCircle, FileSpreadsheet, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient } from '@/lib/db/supabase-client';

export default function CRMPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const supabase = createClient();

      // Get agent
      const { data: agentData } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const agent = agentData as { id: string } | null;
      if (agent) {
        // Get contacts
        const { data } = await supabase
          .from('contacts')
          .select('*')
          .eq('agent_id', agent.id)
          .order('updated_at', { ascending: false });

        setContacts(data || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate stats
  const totalContacts = contacts.length;
  const leads = contacts.filter((c) => c.type === 'lead').length;
  const followUps = contacts.filter(
    (c) => c.next_follow_up_at && new Date(c.next_follow_up_at) <= new Date()
  ).length;
  const closedWon = contacts.filter((c) => c.stage === 'closed_won').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CRM</h1>
          <p className="text-muted-foreground">
            Manage your leads, customers, and recruits.
          </p>
        </div>
        <AddContactDialog />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContacts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Follow-ups</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{followUps}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed Won</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{closedWon}</div>
          </CardContent>
        </Card>
      </div>

      {/* Import/Export Link */}
      <Link href="/dashboard/crm/import-export">
        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <FileSpreadsheet className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">Import / Export</h3>
                <p className="text-sm text-muted-foreground">
                  Bulk import contacts from CSV or export your contact list
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>

      {/* Contacts List */}
      <ContactsList contacts={contacts} />
    </div>
  );
}
