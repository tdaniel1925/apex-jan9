'use client';

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RANK_CONFIG } from '@/lib/config/ranks';
import { cn } from '@/lib/utils';

interface AgentNodeData {
  firstName: string;
  lastName: string;
  rank: string;
  status: string;
  avatarUrl?: string;
  email?: string;
  isRoot?: boolean;
}

interface AgentNodeProps {
  data: AgentNodeData;
}

function AgentNodeComponent({ data }: AgentNodeProps) {
  const rankConfig = RANK_CONFIG[data.rank as keyof typeof RANK_CONFIG];
  const initials = `${data.firstName[0] || ''}${data.lastName[0] || ''}`;

  return (
    <div
      className={cn(
        'bg-background border-2 rounded-lg shadow-md p-4 min-w-[200px]',
        data.isRoot ? 'border-primary' : 'border-border',
        data.status === 'active' ? '' : 'opacity-60'
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-muted-foreground !w-3 !h-3"
      />

      <div className="flex items-center gap-3">
        <Avatar className={cn('h-10 w-10', data.isRoot && 'ring-2 ring-primary ring-offset-2')}>
          <AvatarImage src={data.avatarUrl} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {data.firstName} {data.lastName}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              {rankConfig?.shortName || data.rank}
            </Badge>
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                data.status === 'active' ? 'bg-green-500' : 'bg-gray-300'
              )}
            />
          </div>
        </div>
      </div>

      {data.isRoot && (
        <div className="mt-2 pt-2 border-t">
          <p className="text-xs text-primary font-medium text-center">You</p>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-muted-foreground !w-3 !h-3"
      />
    </div>
  );
}

export const AgentNode = memo(AgentNodeComponent);
