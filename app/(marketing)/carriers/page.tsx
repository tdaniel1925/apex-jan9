/**
 * Carriers Page
 * Showcase of insurance carrier partnerships
 */

import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Star, Shield, DollarSign, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Our Carriers',
  description: 'Apex Affinity Group partners with top-rated insurance carriers including Columbus Life, AIG, F&G, MOO, NLG, Symetra, and North American.',
};

const carriers = [
  {
    name: 'Columbus Life',
    rating: 'A+ (Superior)',
    ratingAgency: 'A.M. Best',
    description: 'A subsidiary of Western & Southern Financial Group, Columbus Life offers competitive life insurance and annuity products.',
    products: ['Term Life', 'Whole Life', 'Universal Life', 'IUL'],
    highlights: ['Strong financials', 'Competitive IUL', 'Fast underwriting'],
    commissionTier: 'Top Tier',
  },
  {
    name: 'AIG',
    rating: 'A (Excellent)',
    ratingAgency: 'A.M. Best',
    description: 'One of the world\'s largest insurance organizations, AIG provides comprehensive life insurance solutions.',
    products: ['Term Life', 'IUL', 'VUL', 'Final Expense'],
    highlights: ['Global brand recognition', 'Diverse product line', 'Strong marketing support'],
    commissionTier: 'Top Tier',
  },
  {
    name: 'F&G (Fidelity & Guaranty)',
    rating: 'A- (Excellent)',
    ratingAgency: 'A.M. Best',
    description: 'F&G specializes in annuities and life insurance for middle-income Americans saving for retirement.',
    products: ['Fixed Annuities', 'FIA', 'IUL', 'Term Life'],
    highlights: ['Competitive annuity rates', 'Simple products', 'Strong e-app'],
    commissionTier: 'Top Tier',
  },
  {
    name: 'Mutual of Omaha',
    rating: 'A+ (Superior)',
    ratingAgency: 'A.M. Best',
    description: 'A Fortune 500 mutual company with over 100 years of experience in the insurance industry.',
    products: ['Term Life', 'Whole Life', 'Medicare Supplements', 'Final Expense'],
    highlights: ['100+ years in business', 'Strong brand', 'Excellent final expense'],
    commissionTier: 'Premium',
  },
  {
    name: 'National Life Group',
    rating: 'A (Excellent)',
    ratingAgency: 'A.M. Best',
    description: 'NLG is focused on providing life insurance and annuities that help people secure their financial future.',
    products: ['IUL', 'Term Life', 'Fixed Annuities', 'FIA'],
    highlights: ['Living benefits included', 'Strong IUL options', 'Quick issue'],
    commissionTier: 'Top Tier',
  },
  {
    name: 'Symetra',
    rating: 'A (Excellent)',
    ratingAgency: 'A.M. Best',
    description: 'Symetra offers a diverse portfolio of employee benefits, annuities, and life insurance products.',
    products: ['Term Life', 'IUL', 'Fixed Annuities', 'Retirement Products'],
    highlights: ['Competitive rates', 'Strong retirement options', 'Responsive service'],
    commissionTier: 'Premium',
  },
  {
    name: 'North American',
    rating: 'A+ (Superior)',
    ratingAgency: 'A.M. Best',
    description: 'Part of Sammons Financial Group, North American offers innovative life insurance and annuity solutions.',
    products: ['IUL', 'Fixed Annuities', 'FIA', 'Term Life'],
    highlights: ['Industry-leading IUL', 'Strong fixed products', 'Great compensation'],
    commissionTier: 'Top Tier',
  },
];

const productCategories = [
  {
    id: 'life-insurance',
    name: 'Life Insurance',
    icon: Shield,
    description: 'Protect your clients\' families with term and permanent life insurance solutions.',
    products: ['Term Life', 'Whole Life', 'Universal Life', 'Final Expense'],
  },
  {
    id: 'iul',
    name: 'Indexed Universal Life',
    icon: TrendingUp,
    description: 'IUL policies combine death benefit protection with cash value growth potential.',
    products: ['IUL with Living Benefits', 'Premium Financed IUL', 'Accumulation IUL'],
  },
  {
    id: 'annuities',
    name: 'Annuities',
    icon: DollarSign,
    description: 'Help clients secure guaranteed income and grow their retirement savings.',
    products: ['Fixed Annuities', 'Fixed Indexed Annuities (FIA)', 'MYGA'],
  },
  {
    id: 'term-life',
    name: 'Term Life Insurance',
    icon: CheckCircle,
    description: 'Affordable coverage for a specific period with competitive rates.',
    products: ['10-Year Term', '20-Year Term', '30-Year Term', 'ROP Term'],
  },
  {
    id: 'final-expense',
    name: 'Final Expense',
    icon: Star,
    description: 'Simplified issue whole life designed for burial and end-of-life expenses.',
    products: ['Guaranteed Issue', 'Simplified Issue', 'Graded Benefit'],
  },
];

export default function CarriersPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Our Carrier Partners
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We&apos;ve negotiated top-tier contracts with 7 A-rated carriers so you can
            offer your clients the best products with competitive commissions.
          </p>
        </div>
      </section>

      {/* Carrier Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">7 Top-Rated Carriers</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Every carrier we partner with is rated A or better by A.M. Best,
              ensuring financial stability and reliability for your clients.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {carriers.map((carrier) => (
              <Card key={carrier.name} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{carrier.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {carrier.rating} ({carrier.ratingAgency})
                      </CardDescription>
                    </div>
                    <Badge variant={carrier.commissionTier === 'Top Tier' ? 'default' : 'secondary'}>
                      {carrier.commissionTier}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-sm text-muted-foreground mb-4">
                    {carrier.description}
                  </p>

                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Products:</p>
                    <div className="flex flex-wrap gap-1">
                      {carrier.products.map((product) => (
                        <Badge key={product} variant="outline" className="text-xs">
                          {product}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto">
                    <p className="text-sm font-medium mb-2">Highlights:</p>
                    <ul className="space-y-1">
                      {carrier.highlights.map((highlight) => (
                        <li key={highlight} className="text-sm text-muted-foreground flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Product Categories</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              With our diverse carrier lineup, you can meet virtually any client need
              with quality products from trusted names.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {productCategories.map((category) => (
              <Card key={category.id} id={category.id}>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <category.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{category.name}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.products.map((product) => (
                      <li key={product} className="text-sm flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {product}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Access These Carriers?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join Apex Affinity Group and get appointed with our carrier partners.
            No startup fees, vested day one.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90"
            >
              Join Apex Today
            </a>
            <a
              href="/opportunity"
              className="inline-flex items-center justify-center px-8 py-3 border border-input bg-background rounded-md font-medium hover:bg-accent"
            >
              Learn About the Opportunity
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
