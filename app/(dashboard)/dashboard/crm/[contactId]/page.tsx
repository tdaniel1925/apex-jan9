'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient } from '@/lib/db/supabase-client';
import { Contact } from '@/lib/types/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeadActivityTimeline } from '@/components/crm/lead-activity-timeline';
import { EmailSequenceStatus } from '@/components/crm/email-sequence-status';
import {
  ArrowLeft,
  Mail,
  Phone,
  Star,
  MailOpen,
  MousePointerClick,
  Calendar,
  User,
} from 'lucide-react';

interface ContactActivitiesResponse {
  contactId: string;
  leadScore: number;
  emailSequenceId: string | null;
  emailSequenceStartedAt: string | null;
  activities: Array<{
    id: string;
    activity_type: string;
    metadata: Record<string, unknown>;
    created_at: string;
  }>;
  emailQueue: Array<{
    id: string;
    status: string;
    scheduled_for: string;
    sent_at: string | null;
    email_sequence_steps: {
      subject: string;
      step_number: number;
    };
  }>;
  stats: {
    opens: number;
    clicks: number;
    formSubmits: number;
    totalActivities: number;
  };
}

const stageColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  qualified: 'bg-purple-100 text-purple-800',
  proposal: 'bg-orange-100 text-orange-800',
  negotiation: 'bg-pink-100 text-pink-800',
  closed_won: 'bg-green-100 text-green-800',
  closed_lost: 'bg-gray-100 text-gray-800',
};

export default function ContactDetailPage() {
  const t = useTranslations('crm');
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const contactId = params.contactId as string;

  const [contact, setContact] = useState<Contact | null>(null);
  const [activityData, setActivityData] = useState<ContactActivitiesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !contactId) return;

    const fetchData = async () => {
      const supabase = createClient();

      // Get agent
      const { data: agentData } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const agent = agentData as { id: string } | null;
      if (!agent) {
        setLoading(false);
        return;
      }

      // Get contact details
      const { data: contactData } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .eq('agent_id', agent.id)
        .single();

      if (contactData) {
        setContact(contactData as Contact);
      }

      // Fetch activities from API
      try {
        const response = await fetch(`/api/contacts/${contactId}/activities`);
        if (response.ok) {
          const data = await response.json();
          setActivityData(data);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
      }

      setLoading(false);
    };

    fetchData();
  }, [user, contactId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('contactNotFound')}</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/crm">{t('backToCRM')}</Link>
        </Button>
      </div>
    );
  }

  const leadScore = activityData?.leadScore || 0;
  const stats = activityData?.stats || { opens: 0, clicks: 0, formSubmits: 0, totalActivities: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/crm">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              {contact.first_name} {contact.last_name}
            </h1>
            <Badge variant="secondary" className={stageColors[contact.stage]}>
              {contact.stage.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {contact.type.charAt(0).toUpperCase() + contact.type.slice(1)} since{' '}
            {new Date(contact.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('leadScore')}</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadScore}</div>
            <p className="text-xs text-muted-foreground">
              {leadScore >= 50 ? t('hotLead') : leadScore >= 20 ? t('warmLead') : t('coldLead')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('emailOpens')}</CardTitle>
            <MailOpen className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.opens}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('linkClicks')}</CardTitle>
            <MousePointerClick className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clicks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalActivities')}</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActivities}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t('contactInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {contact.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${contact.email}`}
                  className="text-sm hover:underline"
                >
                  {contact.email}
                </a>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`tel:${contact.phone}`}
                  className="text-sm hover:underline"
                >
                  {contact.phone}
                </a>
              </div>
            )}
            {contact.source && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">{t('source')}</p>
                <p className="text-sm font-medium">{contact.source}</p>
              </div>
            )}
            {contact.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">{t('notes')}</p>
                <p className="text-sm">{contact.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity & Emails */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="activity">
            <TabsList>
              <TabsTrigger value="activity">{t('activityTimeline')}</TabsTrigger>
              <TabsTrigger value="emails">{t('emailSequence')}</TabsTrigger>
            </TabsList>
            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('recentActivity')}</CardTitle>
                  <CardDescription>
                    {t('trackEngagement')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LeadActivityTimeline
                    activities={activityData?.activities || []}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="emails" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('emailSequence')}</CardTitle>
                  <CardDescription>
                    {t('automatedNurturing')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EmailSequenceStatus
                    emailQueue={activityData?.emailQueue || []}
                    sequenceStartedAt={activityData?.emailSequenceStartedAt || null}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
