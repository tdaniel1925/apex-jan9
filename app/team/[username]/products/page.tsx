import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
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
  params: Promise<{ username: string }>;
}

export default async function ProductsPage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createServerSupabaseClient();
  const t = await getTranslations('replicated.products');

  const { data: agentData, error } = await supabase
    .from('agents')
    .select('first_name, last_name')
    .eq('username', username.toLowerCase())
    .single();

  if (error || !agentData) {
    notFound();
  }

  const agent = agentData as Pick<Agent, 'first_name' | 'last_name'>;
  const agentName = `${agent.first_name} ${agent.last_name}`;

  const products = [
    {
      icon: Shield,
      key: 'iul',
      name: t('productList.iul.name'),
      description: t('productList.iul.description'),
      benefits: [
        t('productList.iul.benefits.taxFree'),
        t('productList.iul.benefits.cashValue'),
        t('productList.iul.benefits.marketLinked'),
        t('productList.iul.benefits.flexiblePremium'),
        t('productList.iul.benefits.policyLoans'),
      ],
    },
    {
      icon: Clock,
      key: 'term',
      name: t('productList.term.name'),
      description: t('productList.term.description'),
      benefits: [
        t('productList.term.benefits.lowerPremiums'),
        t('productList.term.benefits.coverage'),
        t('productList.term.benefits.convertible'),
        t('productList.term.benefits.simple'),
        t('productList.term.benefits.highCoverage'),
      ],
    },
    {
      icon: TrendingUp,
      key: 'annuities',
      name: t('productList.annuities.name'),
      description: t('productList.annuities.description'),
      benefits: [
        t('productList.annuities.benefits.principalProtection'),
        t('productList.annuities.benefits.taxDeferred'),
        t('productList.annuities.benefits.guaranteedIncome'),
        t('productList.annuities.benefits.noMarketLoss'),
        t('productList.annuities.benefits.flexiblePayout'),
      ],
    },
    {
      icon: Heart,
      key: 'finalExpense',
      name: t('productList.finalExpense.name'),
      description: t('productList.finalExpense.description'),
      benefits: [
        t('productList.finalExpense.benefits.guaranteed'),
        t('productList.finalExpense.benefits.smallFace'),
        t('productList.finalExpense.benefits.fixedPremiums'),
        t('productList.finalExpense.benefits.noExam'),
        t('productList.finalExpense.benefits.quickApproval'),
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
          <h1 className="text-4xl font-bold mb-4">{t('hero.title')}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {products.map((product) => (
              <Card key={product.key} className="h-full">
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
            <h2 className="text-3xl font-bold mb-4">{t('carriers.title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('carriers.subtitle')}
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
                  <Badge variant="outline" className="mt-2">{t('carriers.aRated')}</Badge>
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
              <h2 className="text-3xl font-bold mb-6">{t('whySell.title')}</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{t('whySell.commissions.title')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('whySell.commissions.description')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{t('whySell.carriers.title')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('whySell.carriers.description')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{t('whySell.process.title')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('whySell.process.description')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-6 mt-6">
                <h3 className="text-lg font-semibold mb-3">{t('cta.title')}</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {t('cta.subtitle', { agentName })}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild>
                    <Link href={`/team/${username}/signup`}>
                      {t('cta.joinTeam')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/team/${username}/contact`}>{t('cta.contact')}</Link>
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
