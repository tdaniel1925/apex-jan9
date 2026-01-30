import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  GraduationCap,
  DollarSign,
  Clock,
  Users,
  Award,
  Sparkles,
  HeartHandshake,
  TrendingUp,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New to Insurance? Start Your Career Here | Apex Affinity Group',
  description: 'No license? No experience? No problem. We\'ll teach you everything, help you get licensed, and support you every step of the way. Start your insurance career with Apex.',
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
              Start a Career You&apos;ll Actually
              <span className="text-emerald-400 block mt-2">Love</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              No license? We'll help you get one. No experience? We'll train you.
              Build a career with unlimited income and real flexibility.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <p className="text-sm text-slate-400 mt-4">
              No cost to join. Just the cost of your state licensing exam (~$100-300).
            </p>
          </div>
        </div>
      </section>

      {/* Is This Right for You? */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Is This Right for You?</h2>
            <p className="text-muted-foreground mb-12">
              A career in insurance might be perfect if you want:
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: DollarSign, text: 'Unlimited income potential, not a salary cap' },
                { icon: Clock, text: 'Flexibility to set your own schedule' },
                { icon: Users, text: 'To help people and build real relationships' },
                { icon: HeartHandshake, text: 'Work that makes a difference in people\'s lives' },
                { icon: Sparkles, text: 'A fresh start in a new career' },
                { icon: TrendingUp, text: 'To be rewarded for your effort' },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg text-left border-2 border-emerald-100">
                  <item.icon className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-slate-700">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Your Journey - Visual Timeline */}
      <section className="py-20 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Your Journey: Zero to Earning</h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Most people are earning within 4-6 weeks. Here's your path.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="relative">
              {/* Timeline connector */}
              <div className="absolute left-8 top-0 bottom-0 w-1 bg-emerald-500/30 hidden md:block" />

              {/* Steps */}
              <div className="space-y-8">
                {[
                  {
                    step: 1,
                    time: '2-4 weeks',
                    title: 'Get Your License',
                    desc: 'Pass a simple state exam. We provide study materials, practice tests, and guidance. Most pass on their first try.',
                    badge: 'Study from home',
                  },
                  {
                    step: 2,
                    time: '1 week',
                    title: 'Complete Training',
                    desc: 'Learn our proven system, product knowledge, and how to use our tools. Online, self-paced, fits your schedule.',
                    badge: 'Free training',
                  },
                  {
                    step: 3,
                    time: '2-3 days',
                    title: 'Get Authorized',
                    desc: 'We handle the paperwork to connect you with 7+ top insurance companies. You just focus on getting ready.',
                    badge: 'We do the work',
                  },
                  {
                    step: 4,
                    time: 'Week 5+',
                    title: 'Start Helping Families',
                    desc: 'Begin working with clients, supported by your mentor and team. You\'re never alone—help is one call away.',
                    badge: '1-on-1 support',
                  },
                  {
                    step: 5,
                    time: 'Ongoing',
                    title: 'Grow Your Income',
                    desc: 'As you gain experience, build a team if you want. Many of our top earners started exactly where you are now.',
                    badge: 'Optional',
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-6 items-start relative">
                    <div className="h-16 w-16 rounded-full bg-emerald-500 text-white flex items-center justify-center text-2xl font-bold shrink-0 relative z-10 border-4 border-slate-900">
                      {item.step}
                    </div>
                    <div className="flex-1 pt-2 pb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{item.title}</h3>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          {item.badge}
                        </Badge>
                      </div>
                      <p className="text-slate-400 mb-2">{item.desc}</p>
                      <p className="text-emerald-400 text-sm font-semibold">⏱️ {item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Insurance Industry */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Insurance?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The numbers speak for themselves.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <Card className="text-center border-2">
              <CardContent className="pt-6">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-3xl font-bold text-emerald-600 mb-2">$85K+</h3>
                <p className="text-sm text-muted-foreground">
                  Average first-year income for dedicated full-time agents
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2">
              <CardContent className="pt-6">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-3xl font-bold text-emerald-600 mb-2">Growing</h3>
                <p className="text-sm text-muted-foreground">
                  Industry projected to grow 6% through 2032
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2">
              <CardContent className="pt-6">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-3xl font-bold text-emerald-600 mb-2">Stable</h3>
                <p className="text-sm text-muted-foreground">
                  People always need protection—recession-resistant industry
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2">
              <CardContent className="pt-6">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-3xl font-bold text-emerald-600 mb-2">Flexible</h3>
                <p className="text-sm text-muted-foreground">
                  Set your hours, work from anywhere, be your own boss
                </p>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Income varies based on effort. See our{' '}
            <Link href="/income-disclaimer" className="text-emerald-600 hover:underline">
              income disclaimer
            </Link>
            .
          </p>
        </div>
      </section>

      {/* What We Provide */}
      <section className="py-20 bg-emerald-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Succeed</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We invest in your success because when you win, we all win.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: GraduationCap,
                title: 'Get Licensed Fast',
                desc: 'Study guides, practice exams, and support to pass your state exam quickly.',
              },
              {
                icon: Users,
                title: 'Personal Mentor',
                desc: "A dedicated mentor who's been where you are guides your entire journey.",
              },
              {
                icon: Award,
                title: 'Proven Training',
                desc: 'Online courses, live calls, and a sales system that actually works.',
              },
              {
                icon: DollarSign,
                title: 'Fast Start Bonuses',
                desc: 'Extra bonuses in your first 90 days to help you build momentum.',
              },
              {
                icon: Shield,
                title: 'Multiple Companies',
                desc: 'Access to 7+ top-rated insurance companies—never turn away business.',
              },
              {
                icon: Sparkles,
                title: 'Modern Technology',
                desc: 'CRM, quoting tools, AI assistant, personal website—all included.',
              },
            ].map((item) => (
              <Card key={item.title} className="border-2 hover:border-emerald-500/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                    <item.icon className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success Story */}
      <section className="py-16 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-5xl text-emerald-500 mb-6">&ldquo;</div>
            <blockquote className="text-xl md:text-2xl mb-8 leading-relaxed">
              I was a teacher making $45K, burned out and looking for something new.
              Got licensed in 3 weeks, and made over $85K my first full year—working fewer hours.
              Best decision I ever made.
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="h-16 w-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/30 flex items-center justify-center">
                <span className="font-semibold text-emerald-400 text-xl">SK</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-lg">Sarah Kennedy</p>
                <p className="text-sm text-slate-400">Former Teacher → Senior Associate</p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="inline-flex items-center gap-2 text-emerald-400">
                <TrendingUp className="h-5 w-5" />
                <span className="font-semibold">Nearly doubled income in year 1</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ - Accordion Style */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Questions You Probably Have</h2>

            <div className="space-y-4">
              {[
                {
                  q: "Do I need any experience in insurance or sales?",
                  a: "Nope! Many successful agents came from teaching, nursing, retail, military, etc. We teach you everything.",
                },
                {
                  q: "How much does it cost to get started?",
                  a: "Main cost is your state licensing exam (~$100) and pre-licensing course (~$100-300). No fees to join Apex.",
                },
                {
                  q: "How hard is the licensing exam?",
                  a: "With proper study, most pass on their first try. It's multiple choice, and we provide study guides and practice tests.",
                },
                {
                  q: "Can I do this part-time?",
                  a: "Absolutely. Many start part-time and transition to full-time once they've built up income. You set your schedule.",
                },
                {
                  q: "How soon can I start earning?",
                  a: "Once licensed and set up (typically 4-6 weeks), you earn on your very first sale. Commissions paid weekly.",
                },
                {
                  q: "What if I fail the exam?",
                  a: "You can retake it. We'll help you prepare better. Most people pass on their second attempt if they didn't the first time.",
                },
              ].map((item) => (
                <details
                  key={item.q}
                  className="group bg-slate-50 rounded-lg p-6 border-2 hover:border-emerald-500/50 transition-colors"
                >
                  <summary className="font-semibold cursor-pointer flex items-center justify-between">
                    {item.q}
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-open:rotate-90 transition-transform" />
                  </summary>
                  <p className="text-muted-foreground mt-4">{item.a}</p>
                </details>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link href="/faq" className="text-emerald-600 hover:text-emerald-700 font-medium">
                View all frequently asked questions →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-emerald-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your New Career?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Take the first step today. We'll be with you every step of the way.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" variant="secondary" className="text-lg px-8 font-semibold">
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/about">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 bg-transparent border-2 border-white text-white hover:bg-white/10"
              >
                Learn More About Apex
              </Button>
            </Link>
          </div>
          <p className="text-sm opacity-75 mt-6">
            No cost to join. No obligation. Just opportunity.
          </p>
        </div>
      </section>
    </div>
  );
}
