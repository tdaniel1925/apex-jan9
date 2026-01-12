'use client';

import { formatDistanceToNow } from 'date-fns';
import {
  Mail,
  MailOpen,
  MousePointerClick,
  FileText,
  MessageSquare,
  Bot,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  activity_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface LeadActivityTimelineProps {
  activities: ActivityItem[];
}

const activityConfig: Record<
  string,
  { icon: typeof Mail; label: string; color: string }
> = {
  email_sent: {
    icon: Mail,
    label: 'Email Sent',
    color: 'text-blue-500 bg-blue-100',
  },
  email_open: {
    icon: MailOpen,
    label: 'Email Opened',
    color: 'text-green-500 bg-green-100',
  },
  email_click: {
    icon: MousePointerClick,
    label: 'Clicked Link',
    color: 'text-purple-500 bg-purple-100',
  },
  form_submit: {
    icon: FileText,
    label: 'Form Submitted',
    color: 'text-orange-500 bg-orange-100',
  },
  page_view: {
    icon: Activity,
    label: 'Page Viewed',
    color: 'text-gray-500 bg-gray-100',
  },
  copilot_demo: {
    icon: Bot,
    label: 'Copilot Demo',
    color: 'text-indigo-500 bg-indigo-100',
  },
  copilot_message: {
    icon: MessageSquare,
    label: 'Copilot Message',
    color: 'text-indigo-500 bg-indigo-100',
  },
};

export function LeadActivityTimeline({ activities }: LeadActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>No activity yet</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.map((activity, index) => {
          const config = activityConfig[activity.activity_type] || {
            icon: Activity,
            label: activity.activity_type.replace(/_/g, ' '),
            color: 'text-gray-500 bg-gray-100',
          };
          const Icon = config.icon;
          const isLast = index === activities.length - 1;

          return (
            <li key={activity.id}>
              <div className="relative pb-8">
                {!isLast && (
                  <span
                    className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-muted"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3">
                  <div>
                    <span
                      className={cn(
                        'h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-background',
                        config.color
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className="text-sm font-medium">{config.label}</p>
                      {activity.metadata && (
                        <ActivityMetadata
                          type={activity.activity_type}
                          metadata={activity.metadata}
                        />
                      )}
                    </div>
                    <div className="whitespace-nowrap text-right text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ActivityMetadata({
  type,
  metadata,
}: {
  type: string;
  metadata: Record<string, unknown>;
}) {
  switch (type) {
    case 'email_click':
      return (
        <p className="text-sm text-muted-foreground truncate max-w-xs">
          {String(metadata.clicked_url || '')}
        </p>
      );
    case 'form_submit':
      return (
        <p className="text-sm text-muted-foreground">
          Source: {String(metadata.source || 'Unknown')}
        </p>
      );
    case 'page_view':
      return (
        <p className="text-sm text-muted-foreground">
          {String(metadata.page || '')}
        </p>
      );
    default:
      return null;
  }
}
