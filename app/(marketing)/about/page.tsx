/**
 * About Page
 * Company story, mission, and leadership
 */

import { Metadata } from 'next';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Heart, Users, Award, TrendingUp, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Apex Affinity Group, our mission, values, and the team dedicated to helping insurance agents build successful careers.',
};

export default function AboutPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            About Apex Affinity Group
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We&apos;re on a mission to empower insurance professionals with the tools,
            training, and support they need to build thriving careers and help families
            secure their financial futures.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Apex Affinity Group was founded with a simple belief: that the insurance
                  industry needed a fresh approach. Too many talented individuals were
                  struggling to succeed because they lacked access to quality carriers,
                  proper training, and genuine support.
                </p>
                <p>
                  Since our founding, we&apos;ve grown from a small team of dedicated
                  professionals to a nationwide network of successful agents. Our growth
                  hasn&apos;t come from aggressive recruiting tactics or empty promises—it&apos;s
                  come from genuine results and word-of-mouth from satisfied agents.
                </p>
                <p>
                  Today, Apex represents thousands of independent agents across the country,
                  all working together to provide families with the protection they need
                  while building their own entrepreneurial dreams.
                </p>
              </div>
            </div>
            <div className="bg-muted rounded-lg p-8 text-center">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="text-4xl font-bold text-primary">2,500+</div>
                  <div className="text-sm text-muted-foreground mt-1">Active Agents</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary">7</div>
                  <div className="text-sm text-muted-foreground mt-1">Top Carriers</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary">$50M+</div>
                  <div className="text-sm text-muted-foreground mt-1">Commissions Paid</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary">50</div>
                  <div className="text-sm text-muted-foreground mt-1">States Served</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Mission & Values</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything we do is guided by our commitment to these core principles.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Agent Success First</h3>
                <p className="text-muted-foreground">
                  Our agents&apos; success is our success. We invest heavily in training,
                  technology, and support to help every agent reach their potential.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Client-Centered</h3>
                <p className="text-muted-foreground">
                  We train our agents to put clients first. The right policy for the
                  right situation, every time. No high-pressure tactics, just honest advice.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Community & Support</h3>
                <p className="text-muted-foreground">
                  Insurance can be isolating. We&apos;ve built a community where agents
                  support each other, share strategies, and celebrate wins together.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Integrity Always</h3>
                <p className="text-muted-foreground">
                  We do business the right way. Transparent income disclosures, honest
                  expectations, and ethical practices are non-negotiable.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Innovation</h3>
                <p className="text-muted-foreground">
                  From AI-powered sales tools to cutting-edge CRM systems, we give our
                  agents modern technology to compete in today&apos;s market.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Top Carrier Access</h3>
                <p className="text-muted-foreground">
                  We&apos;ve negotiated top-tier contracts with leading carriers so our
                  agents can offer competitive products with competitive commissions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Apex */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Agents Choose Apex</h2>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex gap-6">
              <div className="shrink-0 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">No Enrollment Fees</h3>
                <p className="text-muted-foreground">
                  Unlike many agencies, we don&apos;t charge you to join. Your only
                  investment is obtaining your insurance license and committing to success.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="shrink-0 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Vested from Day One</h3>
                <p className="text-muted-foreground">
                  Your commissions are yours. We don&apos;t hold your renewals hostage
                  or require multi-year commitments. You&apos;re vested in your business
                  from day one.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="shrink-0 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Real Training, Real Support</h3>
                <p className="text-muted-foreground">
                  Our training program isn&apos;t just a few videos. It&apos;s live coaching,
                  role-playing sessions, field training, and ongoing education to keep
                  you sharp.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="shrink-0 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">AI-Powered Tools</h3>
                <p className="text-muted-foreground">
                  Our exclusive AI Copilot helps you with sales scripts, objection
                  handling, lead management, and more. It&apos;s like having a sales
                  coach available 24/7.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
