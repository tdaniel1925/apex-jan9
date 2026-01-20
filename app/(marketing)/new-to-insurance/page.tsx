import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  DollarSign,
  Clock,
  Users,
  Laptop,
  Award,
  BookOpen,
  Target,
  Sparkles,
  HeartHandshake,
  TrendingUp,
  Shield,
} from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Start Your Insurance Career | No Experience Required | Apex Affinity Group',
  description: 'No insurance license? No problem. We\'ll help you get licensed, trained, and earning. Start your new career in insurance with full support.',
  keywords: ['insurance career', 'no experience', 'get insurance license', 'career change', 'insurance training', 'become insurance agent'],
};

export default function NewToInsurancePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 text-white py-20 lg:py-28">
        <div className="absolute inset-0 bg-[url('/images/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              No Experience? No Problem.
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Start Your New Career
              <span className="text-emerald-400 block mt-2">In Insurance</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              No license yet? We&apos;ll help you get one. No experience? We&apos;ll train you.
              Build a career with unlimited income potential and true flexibility.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/join">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Is This Right for You?</h2>
            <p className="text-muted-foreground mb-12">
              A career in insurance might be perfect if any of these sound like you:
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: TrendingUp, text: 'You want unlimited income potential, not a salary cap' },
                { icon: Clock, text: 'You want flexibility to set your own schedule' },
                { icon: Users, text: 'You enjoy helping people and building relationships' },
                { icon: Target, text: 'You\'re self-motivated and driven to succeed' },
                { icon: HeartHandshake, text: 'You want work that makes a real difference in people\'s lives' },
                { icon: Sparkles, text: 'You\'re ready for a fresh start in a new career' },
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg text-left">
                  <item.icon className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-slate-700">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Insurance */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Insurance?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The insurance industry offers opportunities that few other careers can match.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-3xl font-bold text-emerald-600 mb-2">$100K+</h3>
                <p className="text-muted-foreground">
                  Average first-year income for dedicated full-time agents
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-3xl font-bold text-emerald-600 mb-2">Growing</h3>
                <p className="text-muted-foreground">
                  Industry projected to grow 6% through 2032
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-3xl font-bold text-emerald-600 mb-2">Stable</h3>
                <p className="text-muted-foreground">
                  Recession-resistant industry—people always need protection
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-3xl font-bold text-emerald-600 mb-2">Flexible</h3>
                <p className="text-muted-foreground">
                  Set your own hours, work from anywhere, be your own boss
                </p>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            * Income figures are illustrative. Actual results vary based on individual effort.
            See our <Link href="/income-disclaimer" className="underline">income disclaimer</Link>.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Your Path to Success</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We guide you every step of the way—from getting licensed to closing your first sale.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-emerald-200 hidden md:block" />

              {/* Steps */}
              <div className="space-y-12">
                <div className="flex gap-6 items-start">
                  <div className="h-16 w-16 rounded-full bg-emerald-500 text-white flex items-center justify-center text-2xl font-bold shrink-0 relative z-10">
                    1
                  </div>
                  <div className="pt-2">
                    <h3 className="text-xl font-semibold mb-2">Get Your License (2-4 weeks)</h3>
                    <p className="text-muted-foreground mb-4">
                      We&apos;ll guide you through the licensing process. Most states require a simple exam
                      that you can prepare for in 2-4 weeks of part-time study.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Study materials provided</Badge>
                      <Badge variant="outline">Exam prep support</Badge>
                      <Badge variant="outline">State-specific guidance</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex gap-6 items-start">
                  <div className="h-16 w-16 rounded-full bg-emerald-500 text-white flex items-center justify-center text-2xl font-bold shrink-0 relative z-10">
                    2
                  </div>
                  <div className="pt-2">
                    <h3 className="text-xl font-semibold mb-2">Complete Training (1-2 weeks)</h3>
                    <p className="text-muted-foreground mb-4">
                      Learn our proven sales system, product knowledge, and how to use our tools.
                      Training is online and self-paced—fit it around your schedule.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Online courses</Badge>
                      <Badge variant="outline">Live coaching calls</Badge>
                      <Badge variant="outline">Mentor assigned</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex gap-6 items-start">
                  <div className="h-16 w-16 rounded-full bg-emerald-500 text-white flex items-center justify-center text-2xl font-bold shrink-0 relative z-10">
                    3
                  </div>
                  <div className="pt-2">
                    <h3 className="text-xl font-semibold mb-2">Get Contracted with Carriers</h3>
                    <p className="text-muted-foreground mb-4">
                      We handle the paperwork to get you appointed with top-rated insurance carriers.
                      You&apos;ll have access to products from 7+ carriers.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">7 A-rated carriers</Badge>
                      <Badge variant="outline">We handle paperwork</Badge>
                      <Badge variant="outline">Usually 48-72 hours</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex gap-6 items-start">
                  <div className="h-16 w-16 rounded-full bg-emerald-500 text-white flex items-center justify-center text-2xl font-bold shrink-0 relative z-10">
                    4
                  </div>
                  <div className="pt-2">
                    <h3 className="text-xl font-semibold mb-2">Start Helping Families</h3>
                    <p className="text-muted-foreground mb-4">
                      Begin working with clients, protected by the full support of your team and mentor.
                      You&apos;re never alone—help is always a call away.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">1-on-1 mentorship</Badge>
                      <Badge variant="outline">Sales support</Badge>
                      <Badge variant="outline">Case help available</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex gap-6 items-start">
                  <div className="h-16 w-16 rounded-full bg-emerald-500 text-white flex items-center justify-center text-2xl font-bold shrink-0 relative z-10">
                    5
                  </div>
                  <div className="pt-2">
                    <h3 className="text-xl font-semibold mb-2">Grow Your Business</h3>
                    <p className="text-muted-foreground mb-4">
                      As you gain experience, you can build a team and earn override income.
                      Many of our top earners started exactly where you are now.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Team building optional</Badge>
                      <Badge variant="outline">6 levels of overrides</Badge>
                      <Badge variant="outline">Leadership development</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Provide */}
      <section className="py-20 bg-emerald-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Succeed</h2>
            <p className="text-xl text-emerald-200 max-w-2xl mx-auto">
              We invest in your success because when you win, we all win.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white/10 rounded-xl p-6">
              <GraduationCap className="h-10 w-10 text-emerald-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Licensing Support</h3>
              <p className="text-emerald-200">
                Study guides, practice exams, and guidance to pass your state insurance exam quickly.
              </p>
            </div>

            <div className="bg-white/10 rounded-xl p-6">
              <BookOpen className="h-10 w-10 text-emerald-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Comprehensive Training</h3>
              <p className="text-emerald-200">
                Online courses, weekly training calls, and a proven sales system that works.
              </p>
            </div>

            <div className="bg-white/10 rounded-xl p-6">
              <Users className="h-10 w-10 text-emerald-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Personal Mentor</h3>
              <p className="text-emerald-200">
                A dedicated mentor who&apos;s been where you are and will guide you to success.
              </p>
            </div>

            <div className="bg-white/10 rounded-xl p-6">
              <Laptop className="h-10 w-10 text-emerald-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Modern Technology</h3>
              <p className="text-emerald-200">
                CRM, quoting tools, AI assistant, and a personal marketing website—all included.
              </p>
            </div>

            <div className="bg-white/10 rounded-xl p-6">
              <DollarSign className="h-10 w-10 text-emerald-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Fast Start Bonuses</h3>
              <p className="text-emerald-200">
                Extra bonuses in your first 90 days to help you build momentum quickly.
              </p>
            </div>

            <div className="bg-white/10 rounded-xl p-6">
              <Award className="h-10 w-10 text-emerald-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Recognition & Rewards</h3>
              <p className="text-emerald-200">
                Trips, bonuses, and recognition for your achievements. Your hard work gets noticed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Common Questions */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Common Questions</h2>

            <div className="space-y-6">
              <div className="bg-slate-50 rounded-lg p-6">
                <h3 className="font-semibold mb-2">Do I need any experience in insurance or sales?</h3>
                <p className="text-muted-foreground">
                  No! Many of our most successful agents came from completely different careers—teachers,
                  nurses, retail workers, military veterans. We&apos;ll teach you everything you need to know.
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-6">
                <h3 className="font-semibold mb-2">How much does it cost to get started?</h3>
                <p className="text-muted-foreground">
                  The main cost is your state licensing exam (typically $50-100) and the pre-licensing
                  course (around $100-300 depending on your state). There are no fees to join Apex.
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-6">
                <h3 className="font-semibold mb-2">How hard is the licensing exam?</h3>
                <p className="text-muted-foreground">
                  With proper study, most people pass on their first try. The exam is multiple choice,
                  and we provide study guides and practice tests to help you prepare.
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-6">
                <h3 className="font-semibold mb-2">Can I do this part-time while keeping my current job?</h3>
                <p className="text-muted-foreground">
                  Absolutely. Many agents start part-time and transition to full-time once they&apos;ve
                  built up their income. You set your own schedule.
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-6">
                <h3 className="font-semibold mb-2">How soon can I start earning money?</h3>
                <p className="text-muted-foreground">
                  Once you&apos;re licensed and contracted (typically 3-5 weeks total), you can start
                  earning commissions on your very first sale. Commissions are paid weekly.
                </p>
              </div>
            </div>

            <div className="text-center mt-8">
              <Link href="/faq" className="text-emerald-600 hover:text-emerald-700 font-medium">
                View all frequently asked questions →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Success Story */}
      <section className="py-16 bg-emerald-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-5xl text-emerald-500 mb-6">&ldquo;</div>
            <blockquote className="text-xl md:text-2xl text-slate-700 mb-6">
              I was a teacher making $45K a year, burned out and looking for something new.
              I got licensed in 3 weeks, and in my first full year at Apex, I made over $85,000
              working fewer hours than I did in the classroom. Best decision I ever made.
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="h-12 w-12 rounded-full bg-emerald-200 flex items-center justify-center">
                <span className="font-semibold text-emerald-700">SK</span>
              </div>
              <div className="text-left">
                <p className="font-semibold">Sarah Kennedy</p>
                <p className="text-sm text-muted-foreground">Former Teacher, Now Senior Associate</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your New Career?
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Take the first step today. We&apos;ll be with you every step of the way.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/join">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="bg-transparent border-white/50 text-white hover:bg-white/10 hover:border-white/70">
                Talk to Someone First
              </Button>
            </Link>
          </div>
          <p className="text-sm text-slate-400 mt-6">
            No cost to join. No obligation. Just opportunity.
          </p>
        </div>
      </section>
    </div>
  );
}
