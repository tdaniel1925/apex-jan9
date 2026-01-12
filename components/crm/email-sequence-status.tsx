'use client';

import { formatDistanceToNow, format } from 'date-fns';
import { Mail, Check, Clock, XCircle, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface EmailQueueItem {
  id: string;
  status: string;
  scheduled_for: string;
  sent_at: string | null;
  email_sequence_steps: {
    subject: string;
    step_number: number;
  };
}

interface EmailSequenceStatusProps {
  emailQueue: EmailQueueItem[];
  sequenceStartedAt: string | null;
}

const statusConfig: Record<string, { icon: typeof Mail; label: string; color: string }> = {
  pending: {
    icon: Clock,
    label: 'Scheduled',
    color: 'text-yellow-600 bg-yellow-100',
  },
  sent: {
    icon: Check,
    label: 'Sent',
    color: 'text-green-600 bg-green-100',
  },
  failed: {
    icon: XCircle,
    label: 'Failed',
    color: 'text-red-600 bg-red-100',
  },
  cancelled: {
    icon: XCircle,
    label: 'Cancelled',
    color: 'text-gray-600 bg-gray-100',
  },
};

export function EmailSequenceStatus({
  emailQueue,
  sequenceStartedAt,
}: EmailSequenceStatusProps) {
  if (emailQueue.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>No email sequence active</p>
      </div>
    );
  }

  const sentCount = emailQueue.filter((e) => e.status === 'sent').length;
  const totalCount = emailQueue.length;
  const progress = (sentCount / totalCount) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Sequence Progress</span>
          <span className="font-medium">
            {sentCount} of {totalCount} emails sent
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        {sequenceStartedAt && (
          <p className="text-xs text-muted-foreground">
            Started {formatDistanceToNow(new Date(sequenceStartedAt), { addSuffix: true })}
          </p>
        )}
      </div>

      {/* Email List */}
      <div className="space-y-3">
        {emailQueue.map((email) => {
          const config = statusConfig[email.status] || statusConfig.pending;
          const Icon = config.icon;
          const step = email.email_sequence_steps;

          return (
            <div
              key={email.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border',
                email.status === 'sent' && 'bg-muted/30'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center',
                    config.color
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Step {step.step_number}: {step.subject}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {email.status === 'sent' && email.sent_at
                      ? `Sent ${format(new Date(email.sent_at), 'MMM d, h:mm a')}`
                      : email.status === 'pending'
                        ? `Scheduled for ${format(new Date(email.scheduled_for), 'MMM d, h:mm a')}`
                        : config.label}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className={config.color}>
                {config.label}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}
