'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';
import {
  ArrowRight,
  Shield,
  Users,
  DollarSign,
  Sparkles,
  CheckCircle,
  Star,
  Quote,
  TrendingUp,
  Award,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

const testimonials = [
  {
    name: 'Sarah Mitchell',
    role: 'Senior Regional Manager',
    location: 'Houston, TX',
    quote: 'Joining Apex was the best decision I made for my career. The training and support are world-class, and the AI Copilot has literally doubled my productivity.',
    years: 3,
    achievement: 'Regional Manager in 18 months',
  },
  {
    name: 'Marcus Johnson',
    role: 'District Manager',
    location: 'Atlanta, GA',
    quote: 'I came from a completely different industry with zero insurance experience. Apex gave me all the tools and training I needed to build a six-figure business.',
    years: 2,
    achievement: 'First $100K year in year 2',
  },
  {
    name: 'Jennifer Lee',
    role: 'MGA',
    location: 'Los Angeles, CA',
    quote: 'The carrier contracts at Apex are unmatched. Being vested from day one and having access to top-tier products makes all the difference.',
    years: 5,
    achievement: 'Built a team of 50+ agents',
  },
];

const stats = [
  { value: '2,500+', label: 'Active Agents' },
  { value: '7', label: 'A-Rated Carriers' },
  { value: '$50M+', label: 'Commissions Paid' },
  { value: '50', label: 'States' },
];

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size="sm" />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/carriers" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Carriers
            </Link>
            <Link href="/compare" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Compare
            </Link>
            <Link href="/professionals" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              For Agents
            </Link>
            <Link href="/new-to-insurance" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              New to Insurance
            </Link>
            <Link href="/faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </Link>
            <Link href="/contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Join Apex</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Star className="h-4 w-4" />
            Rated #1 IMO for Agent Support
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-4xl mx-auto">
            Build Your Insurance Business with{' '}
            <span className="text-primary">Apex Affinity Group</span>
          </h1>
          <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
            Join a network of top-producing insurance agents. Earn competitive commissions,
            build your team, and grow your business with AI-powered tools.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/opportunity">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Learn More
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            No enrollment fees &bull; Vested day one &bull; Top carrier contracts
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Apex Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Agents Choose Apex</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We&apos;ve built a platform that gives independent agents everything they need to
              succeed without the corporate red tape.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Top Commissions</h3>
                <p className="text-muted-foreground">
                  Earn up to 100% commission with our top carrier contracts. No caps, no games.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Team Building</h3>
                <p className="text-muted-foreground">
                  Build your team and earn override commissions up to 6 generations deep.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI Copilot</h3>
                <p className="text-muted-foreground">
                  Our exclusive AI tools help you close more deals and manage leads efficiently.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">7 Top Carriers</h3>
                <p className="text-muted-foreground">
                  Access A-rated carriers: Columbus Life, AIG, F+G, MOO, NLG, Symetra, NA.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Agent Success Stories</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Real agents, real results. See what our agents have to say about building
              their business with Apex.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="relative">
                <CardContent className="pt-6">
                  <Quote className="h-8 w-8 text-primary/20 absolute top-4 right-4" />
                  <p className="text-muted-foreground mb-6 italic">
                    &quot;{testimonial.quote}&quot;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      <div className="text-xs text-muted-foreground">{testimonial.location}</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm">
                    <Award className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">{testimonial.achievement}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              Results vary. See our{' '}
              <Link href="/income-disclaimer" className="text-primary hover:underline">
                income disclosure
              </Link>{' '}
              for actual statistics.
            </p>
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Everything You Need to Succeed</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-semibold">No Enrollment Fees</div>
                    <div className="text-sm text-muted-foreground">
                      Start your business without upfront costs
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-semibold">Vested from Day One</div>
                    <div className="text-sm text-muted-foreground">
                      Your commissions and renewals are yours immediately
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-semibold">Comprehensive Training</div>
                    <div className="text-sm text-muted-foreground">
                      Live coaching, field training, and ongoing education
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-semibold">AI-Powered Tools</div>
                    <div className="text-sm text-muted-foreground">
                      Modern technology to help you compete and win
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-semibold">Top Carrier Contracts</div>
                    <div className="text-sm text-muted-foreground">
                      Access to 7 A-rated carriers with competitive rates
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-semibold">Supportive Community</div>
                    <div className="text-sm text-muted-foreground">
                      Join a network of agents who help each other succeed
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-muted rounded-lg p-8 text-center">
              <TrendingUp className="h-16 w-16 text-primary mx-auto mb-6" />
              <h3 className="text-2xl font-bold mb-4">Ready to Build Your Future?</h3>
              <p className="text-muted-foreground mb-6">
                Take the first step toward financial independence. Join thousands of agents
                who have transformed their careers with Apex.
              </p>
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Your Application
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join Apex Affinity Group today. No enrollment fees, top carrier access,
            and the support you need to build a successful insurance business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Apply Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
            {/* Brand */}
            <div className="space-y-4">
              <Logo size="sm" />
              <p className="text-sm text-muted-foreground">
                Building financial futures through trusted insurance solutions and
                entrepreneurial opportunities since 2018.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">About Us</Link></li>
                <li><Link href="/carriers" className="hover:text-foreground">Our Carriers</Link></li>
                <li><Link href="/compare" className="hover:text-foreground">Compare</Link></li>
                <li><Link href="/faq" className="hover:text-foreground">FAQ</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">Contact Us</Link></li>
              </ul>
            </div>

            {/* Get Started */}
            <div>
              <h4 className="font-semibold mb-4">Get Started</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/professionals" className="hover:text-foreground">Licensed Agents</Link></li>
                <li><Link href="/new-to-insurance" className="hover:text-foreground">New to Insurance</Link></li>
                <li><Link href="/opportunity" className="hover:text-foreground">Career Opportunity</Link></li>
                <li><Link href="/join" className="hover:text-foreground">Join Apex</Link></li>
              </ul>
            </div>

            {/* Products */}
            <div>
              <h4 className="font-semibold mb-4">Products</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/carriers#life-insurance" className="hover:text-foreground">Life Insurance</Link></li>
                <li><Link href="/carriers#annuities" className="hover:text-foreground">Annuities</Link></li>
                <li><Link href="/carriers#iul" className="hover:text-foreground">IUL Policies</Link></li>
                <li><Link href="/carriers#term-life" className="hover:text-foreground">Term Life</Link></li>
                <li><Link href="/carriers#final-expense" className="hover:text-foreground">Final Expense</Link></li>
              </ul>
            </div>

            {/* For Agents */}
            <div>
              <h4 className="font-semibold mb-4">For Agents</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/login" className="hover:text-foreground">Agent Login</Link></li>
                <li><Link href="/signup" className="hover:text-foreground">Join Apex</Link></li>
                <li><Link href="/income-disclaimer" className="hover:text-foreground">Income Disclosure</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
              <p>&copy; {new Date().getFullYear()} Apex Affinity Group. All rights reserved.</p>
              <div className="flex gap-6">
                <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
                <Link href="/income-disclaimer" className="hover:text-foreground">Income Disclosure</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
