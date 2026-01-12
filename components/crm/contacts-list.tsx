'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Contact } from '@/lib/types/database';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, MoreHorizontal, Mail, Phone, Calendar, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContactsListProps {
  contacts: Contact[];
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

const typeColors: Record<string, string> = {
  lead: 'bg-primary/10 text-primary',
  customer: 'bg-green-100 text-green-800',
  recruit: 'bg-purple-100 text-purple-800',
};

export function ContactsList({ contacts: initialContacts }: ContactsListProps) {
  const router = useRouter();
  const [contacts] = useState(initialContacts);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const handleViewDetails = (contactId: string) => {
    router.push(`/dashboard/crm/${contactId}`);
  };

  const getLeadScoreColor = (score: number) => {
    if (score >= 50) return 'text-green-600';
    if (score >= 20) return 'text-yellow-600';
    return 'text-gray-400';
  };

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      !search ||
      contact.first_name.toLowerCase().includes(search.toLowerCase()) ||
      contact.last_name.toLowerCase().includes(search.toLowerCase()) ||
      contact.email?.toLowerCase().includes(search.toLowerCase());

    const matchesType = !typeFilter || contact.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={typeFilter === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter(null)}
          >
            All
          </Button>
          <Button
            variant={typeFilter === 'lead' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('lead')}
          >
            Leads
          </Button>
          <Button
            variant={typeFilter === 'customer' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('customer')}
          >
            Customers
          </Button>
          <Button
            variant={typeFilter === 'recruit' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('recruit')}
          >
            Recruits
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Follow-up</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-muted-foreground">No contacts found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredContacts.map((contact) => (
                <TableRow
                  key={contact.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleViewDetails(contact.id)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {contact.first_name} {contact.last_name}
                      </p>
                      {contact.source && (
                        <p className="text-sm text-muted-foreground">
                          Source: {contact.source}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={typeColors[contact.type]}
                    >
                      {contact.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={stageColors[contact.stage]}
                    >
                      {contact.stage.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className={cn('h-4 w-4', getLeadScoreColor(contact.lead_score))} />
                      <span className={cn('text-sm font-medium', getLeadScoreColor(contact.lead_score))}>
                        {contact.lead_score}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Mail className="h-4 w-4" />
                        </a>
                      )}
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {formatDate(contact.next_follow_up_at)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(contact.id)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Update Stage</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
