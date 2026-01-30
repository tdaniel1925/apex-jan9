'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Heart, Key, Users, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PillarType = 'enjoy' | 'own' | 'support';

interface PillarData {
  id: PillarType;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  bgColor: string;
  details: {
    forLicensed: string[];
    forNewcomers: string[];
  };
}

const pillars: PillarData[] = [
  {
    id: 'enjoy',
    icon: Heart,
    title: 'Love What You Do',
    subtitle: 'Rediscover Your Passion',
    description: 'Stop grinding. Start thriving. Build a career that brings fulfillment, not just a paycheck.',
    color: 'text-rose-600',
    bgColor: 'bg-rose-500',
    details: {
      forLicensed: [
        'Remember why you got into this business',
        'Escape the captive grind and toxic culture',
        'Work with clients you genuinely want to help',
        'Set your own schedule and priorities',
      ],
      forNewcomers: [
        'Build a career you actually enjoy',
        'Help families while doing meaningful work',
        'Freedom to create the life you want',
        'Work from anywhere, anytime',
      ],
    },
  },
  {
    id: 'own',
    icon: Key,
    title: 'Own Your Future',
    subtitle: 'Build Real Wealth',
    description: 'Your clients. Your agency. Your equity. Stop building someone else\'s empire.',
    color: 'text-amber-600',
    bgColor: 'bg-amber-500',
    details: {
      forLicensed: [
        'Own your client relationships from day one',
        'Build a sellable asset, not just income',
        'Top-tier commissions with no splits',
        'Create generational wealth',
      ],
      forNewcomers: [
        'Be your own boss from the start',
        'Build something that\'s truly yours',
        'Unlimited income potential',
        'No salary cap holding you back',
      ],
    },
  },
  {
    id: 'support',
    icon: Users,
    title: 'Backed By Champions',
    subtitle: 'Never Go It Alone',
    description: 'Elite training and genuine support without the corporate bureaucracy.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500',
    details: {
      forLicensed: [
        'A team that actually has your back',
        'Resources that match your ambition',
        'Advanced training for growth',
        'Community of top performers',
      ],
      forNewcomers: [
        'We\'ll teach you everything you need',
        'Personal mentor guides your journey',
        'From zero to confident in weeks',
        'Never feel alone or lost',
      ],
    },
  },
];

interface PillarCardProps {
  pillar: PillarData;
  onClick: () => void;
}

function PillarCard({ pillar, onClick }: PillarCardProps): JSX.Element {
  const Icon = pillar.icon;

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <Card
      className="border-2 hover:shadow-2xl transition-all cursor-pointer group hover:-translate-y-1"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={`Learn more about ${pillar.title}`}
    >
      <CardContent className="p-0">
        {/* Image Placeholder - Can be replaced with actual images */}
        <div className={cn('relative h-64 rounded-t-lg overflow-hidden', `${pillar.bgColor}/10`)}>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className={cn('h-32 w-32 opacity-20', pillar.color)} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className={cn('inline-flex items-center justify-center h-12 w-12 rounded-full mb-4', pillar.bgColor)}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{pillar.title}</h3>
            <p className="text-slate-300 text-sm">{pillar.subtitle}</p>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-6">
          <p className="text-muted-foreground mb-4">{pillar.description}</p>
          <Button
            variant="ghost"
            className={cn('group-hover:gap-3 transition-all', pillar.color)}
          >
            Learn More
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface PillarCardsProps {
  className?: string;
}

export function PillarCards({ className }: PillarCardsProps): JSX.Element {
  const [selectedPillar, setSelectedPillar] = useState<PillarData | null>(null);

  const handlePillarClick = useCallback((pillar: PillarData) => {
    setSelectedPillar(pillar);
  }, []);

  const handleDialogClose = useCallback((open: boolean) => {
    if (!open) {
      setSelectedPillar(null);
    }
  }, []);

  // Create memoized click handlers for each pillar
  const pillarClickHandlers = useMemo(() => {
    return pillars.reduce((acc, pillar) => {
      acc[pillar.id] = () => handlePillarClick(pillar);
      return acc;
    }, {} as Record<PillarType, () => void>);
  }, [handlePillarClick]);

  return (
    <>
      <div className={cn('grid md:grid-cols-3 gap-8', className)}>
        {pillars.map((pillar) => (
          <PillarCard
            key={pillar.id}
            pillar={pillar}
            onClick={pillarClickHandlers[pillar.id]}
          />
        ))}
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedPillar} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedPillar && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className={cn('inline-flex items-center justify-center h-16 w-16 rounded-full', selectedPillar.bgColor)}>
                    <selectedPillar.icon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-3xl">{selectedPillar.title}</DialogTitle>
                    <DialogDescription className="text-lg">{selectedPillar.subtitle}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-8">
                <p className="text-lg text-muted-foreground">{selectedPillar.description}</p>

                {/* For Licensed Professionals */}
                <div>
                  <h4 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    For Licensed Professionals
                  </h4>
                  <ul className="space-y-3">
                    {selectedPillar.details.forLicensed.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <div className={cn('h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5', `${selectedPillar.bgColor}/20`)}>
                          <ArrowRight className={cn('h-4 w-4', selectedPillar.color)} />
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* For Newcomers */}
                <div>
                  <h4 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    New to Insurance
                  </h4>
                  <ul className="space-y-3">
                    {selectedPillar.details.forNewcomers.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <div className={cn('h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5', `${selectedPillar.bgColor}/20`)}>
                          <ArrowRight className={cn('h-4 w-4', selectedPillar.color)} />
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <div className="pt-4 flex gap-4">
                  <Button className={cn(selectedPillar.bgColor, 'text-white hover:opacity-90')}>
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline">
                    Learn More
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
