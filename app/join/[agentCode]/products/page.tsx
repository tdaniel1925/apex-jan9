import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CARRIER_CONFIG } from '@/lib/config/carriers';
import {
  Shield,
  TrendingUp,
  Clock,
  Heart,
  Building,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import type { Agent } from '@/lib/types/database';

const IMAGES = {
  family: 'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=1920&q=80',
  consultation: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80',
};

interface PageProps {
  params: Promise<{ agentCode: string }>;
}

export default async function ProductsPage({ params }: PageProps) {
  const { agentCode } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: agentData, error } = await supabase
    .from('agents')
    .select('first_name, last_name')
    .eq('agent_code', agentCode)
    .single();

  if (error || !agentData) {
    notFound();
  }

  const agent = agentData as Pick<Agent, 'first_name' | 'last_name'>;

  const products = [
    {
      icon: Shield,
      name: 'Indexed Universal Life (IUL)',
      description: 'Permanent life insurance with cash value growth tied to market indexes.',
      benefits: [
        'Tax-free death benefit',
        'Cash value accumulation',
        'Market-linked growth with downside protection',
        'Flexible premium payments',
        'Policy loans available',
      ],
    },
    {
      icon: Clock,
      name: 'Term Life Insurance',
      description: 'Affordable protection for a specific period of time.',
      benefits: [
        'Lower initial premiums',
        'Coverage for 10, 20, or 30 years',
        'Convertible to permanent coverage',
        'Simple application process',
        'High coverage amounts available',
      ],
    },
    {
      icon: TrendingUp,
      name: 'Fixed Index Annuities',
      description: 'Retirement income products with principal protection and growth potential.',
      benefits: [
        'Principal protection',
        'Tax-deferred growth',
        'Guaranteed lifetime income options',
        'No market loss',
        'Flexible payout options',
      ],
    },
    {
      icon: Heart,
      name: 'Final Expense Insurance',
      description: 'Whole life coverage designed to cover end-of-life costs.',
      benefits: [
        'Guaranteed acceptance options',
        'Small face amounts ($5k-$50k)',
        'Fixed premiums',
        'No medical exam required',
        'Quick approval process',
      ],
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={IMAGES.family}
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl font-bold mb-4">Our Products</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We offer a comprehensive suite of life insurance and annuity products
            from top-rated carriers to meet your clients&apos; diverse needs.
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {products.map((product) => (
              <Card key={product.name} className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <product.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{product.name}</CardTitle>
                  </div>
                  <CardDescription>{product.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {product.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Carriers */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Partner Carriers</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We work with A-rated insurance carriers to provide the best products
              and competitive commission rates for our agents.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.values(CARRIER_CONFIG).map((carrier) => (
              <Card key={carrier.id}>
                <CardContent className="pt-6 text-center">
                  <div className="p-4 bg-muted rounded-lg mb-4">
                    <Building className="h-8 w-8 mx-auto text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold">{carrier.name}</h3>
                  <Badge variant="outline" className="mt-2">A-Rated</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Our Products */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-[400px] rounded-xl overflow-hidden shadow-xl order-2 lg:order-1">
              <Image
                src={IMAGES.consultation}
                alt="Professional consultation"
                fill
                className="object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold mb-6">Why Sell Our Products?</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Competitive Commissions</h3>
                    <p className="text-sm text-muted-foreground">
                      Earn up to 90% commission rates on life insurance and competitive
                      rates on annuity products.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Trusted Carriers</h3>
                    <p className="text-sm text-muted-foreground">
                      All our carriers are A-rated or better, giving you confidence
                      when presenting to clients.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Easy Application Process</h3>
                    <p className="text-sm text-muted-foreground">
                      Streamlined e-applications and quick underwriting for faster
                      policy placement.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-6 mt-6">
                <h3 className="text-lg font-semibold mb-3">Ready to Learn More?</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Contact {agent.first_name} to learn more about our product portfolio.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild>
                    <Link href={`/join/${agentCode}/signup`}>
                      Join the Team
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/join/${agentCode}/contact`}>Contact</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
