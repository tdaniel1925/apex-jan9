import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  AlertTriangle,
  DollarSign,
  Users,
  Building2,
  Shield,
  Clock,
  Award,
  ExternalLink,
} from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compare Insurance Careers: Apex vs Primerica vs WFG vs Experior',
  description: 'Honest comparison of insurance career opportunities. Compare commission rates, startup costs, products, and business models between Apex, Primerica, World Financial Group, and Experior.',
  keywords: ['Primerica comparison', 'WFG comparison', 'Experior comparison', 'insurance MLM', 'best insurance company to work for', 'insurance agent commission comparison'],
};

export default function ComparePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-blue-500/20 text-blue-400 border-blue-500/30">
              Honest Comparison
            </Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Compare Your Options Before You Decide
            </h1>
            <p className="text-xl text-slate-300 mb-4 max-w-2xl mx-auto">
              We believe you should have all the facts. Here&apos;s an honest comparison
              of Apex Affinity Group with Primerica, World Financial Group, and Experior Financial.
            </p>
            <p className="text-sm text-slate-400">
              All data sourced from public disclosures and official company materials.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Summary Cards */}
      <section className="py-12 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">At a Glance</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Apex Card */}
            <Card className="border-2 border-amber-500 relative">
              <div className="absolute -top-3 left-4">
                <Badge className="bg-amber-500 text-black">Apex Affinity</Badge>
              </div>
              <CardContent className="pt-8">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Commission</span>
                    <span className="font-semibold text-green-600">Up to 145%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Startup Cost</span>
                    <span className="font-semibold text-green-600">$0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Carriers</span>
                    <span className="font-semibold">7+ A-Rated</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model</span>
                    <span className="font-semibold">Independent</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Book Ownership</span>
                    <span className="font-semibold text-green-600">Day 1</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Primerica Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Primerica</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Commission</span>
                    <span className="font-semibold">25-60%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Startup Cost</span>
                    <span className="font-semibold">$99 + fees</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Carriers</span>
                    <span className="font-semibold">1 (Captive)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model</span>
                    <span className="font-semibold">MLM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Book Ownership</span>
                    <span className="font-semibold text-amber-600">Restricted</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* WFG Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">World Financial Group</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Commission</span>
                    <span className="font-semibold">25-65%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Startup Cost</span>
                    <span className="font-semibold">$100-700+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Carriers</span>
                    <span className="font-semibold">Multiple</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model</span>
                    <span className="font-semibold">MLM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Book Ownership</span>
                    <span className="font-semibold text-amber-600">Limited</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Experior Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Experior Financial</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Commission</span>
                    <span className="font-semibold">Up to 160%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Startup Cost</span>
                    <span className="font-semibold">Monthly fees</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Carriers</span>
                    <span className="font-semibold">Multiple</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model</span>
                    <span className="font-semibold">IMO Hybrid</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Book Ownership</span>
                    <span className="font-semibold text-green-600">Day 1</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Detailed Comparison Table */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">Detailed Comparison</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Data compiled from official company disclosures, earnings statements, and public filings.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full max-w-6xl mx-auto border-collapse">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left py-4 px-4 font-semibold">Category</th>
                  <th className="text-center py-4 px-4 font-semibold bg-amber-50 border-x-2 border-amber-200">
                    <span className="text-amber-600">Apex Affinity</span>
                  </th>
                  <th className="text-center py-4 px-4 font-semibold">Primerica</th>
                  <th className="text-center py-4 px-4 font-semibold">WFG</th>
                  <th className="text-center py-4 px-4 font-semibold">Experior</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {/* Commission Structure */}
                <tr>
                  <td className="py-4 px-4 font-medium">Starting Commission</td>
                  <td className="py-4 px-4 text-center bg-amber-50 border-x-2 border-amber-200">
                    <span className="text-green-600 font-semibold">Street Level</span>
                  </td>
                  <td className="py-4 px-4 text-center">25%</td>
                  <td className="py-4 px-4 text-center">25%</td>
                  <td className="py-4 px-4 text-center">Varies</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="py-4 px-4 font-medium">Maximum Commission</td>
                  <td className="py-4 px-4 text-center bg-amber-50 border-x-2 border-amber-200">
                    <span className="font-semibold">Up to 145%</span>
                  </td>
                  <td className="py-4 px-4 text-center">60%</td>
                  <td className="py-4 px-4 text-center">65%</td>
                  <td className="py-4 px-4 text-center">Up to 160% FYC</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium">Override Levels</td>
                  <td className="py-4 px-4 text-center bg-amber-50 border-x-2 border-amber-200">
                    <span className="font-semibold">6 Levels</span>
                  </td>
                  <td className="py-4 px-4 text-center">Multiple</td>
                  <td className="py-4 px-4 text-center">Multiple</td>
                  <td className="py-4 px-4 text-center">Up to 213% FYC</td>
                </tr>

                {/* Costs */}
                <tr className="bg-slate-50">
                  <td className="py-4 px-4 font-medium">Startup Fee</td>
                  <td className="py-4 px-4 text-center bg-amber-50 border-x-2 border-amber-200">
                    <span className="text-green-600 font-semibold">$0</span>
                  </td>
                  <td className="py-4 px-4 text-center">$99</td>
                  <td className="py-4 px-4 text-center">$100-200</td>
                  <td className="py-4 px-4 text-center">Varies</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium">Monthly Fees</td>
                  <td className="py-4 px-4 text-center bg-amber-50 border-x-2 border-amber-200">
                    <span className="text-green-600 font-semibold">$0</span>
                  </td>
                  <td className="py-4 px-4 text-center">$28/mo (website)</td>
                  <td className="py-4 px-4 text-center">$15-30/mo+</td>
                  <td className="py-4 px-4 text-center">Low monthly</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="py-4 px-4 font-medium">E&O Insurance</td>
                  <td className="py-4 px-4 text-center bg-amber-50 border-x-2 border-amber-200">
                    <span className="text-sm">Agent responsibility</span>
                  </td>
                  <td className="py-4 px-4 text-center text-sm">Agent responsibility</td>
                  <td className="py-4 px-4 text-center">~$450</td>
                  <td className="py-4 px-4 text-center text-sm">Agent responsibility</td>
                </tr>

                {/* Products & Carriers */}
                <tr>
                  <td className="py-4 px-4 font-medium">Number of Carriers</td>
                  <td className="py-4 px-4 text-center bg-amber-50 border-x-2 border-amber-200">
                    <span className="font-semibold">7+ A-Rated</span>
                  </td>
                  <td className="py-4 px-4 text-center">1 (Own products)</td>
                  <td className="py-4 px-4 text-center">Multiple (Transamerica primary)</td>
                  <td className="py-4 px-4 text-center">6+ carriers</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="py-4 px-4 font-medium">Product Types</td>
                  <td className="py-4 px-4 text-center bg-amber-50 border-x-2 border-amber-200">
                    <span className="text-sm">Life, IUL, Annuities, Term</span>
                  </td>
                  <td className="py-4 px-4 text-center text-sm">Term Life primarily</td>
                  <td className="py-4 px-4 text-center text-sm">Life, Investments, LTC</td>
                  <td className="py-4 px-4 text-center text-sm">Life, Annuities, Disability</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium">Captive or Independent</td>
                  <td className="py-4 px-4 text-center bg-amber-50 border-x-2 border-amber-200">
                    <span className="text-green-600 font-semibold">Independent</span>
                  </td>
                  <td className="py-4 px-4 text-center">Captive</td>
                  <td className="py-4 px-4 text-center">Semi-Captive (Aegon owned)</td>
                  <td className="py-4 px-4 text-center">Independent IMO</td>
                </tr>

                {/* Business Terms */}
                <tr className="bg-slate-50">
                  <td className="py-4 px-4 font-medium">Book Ownership</td>
                  <td className="py-4 px-4 text-center bg-amber-50 border-x-2 border-amber-200">
                    <span className="text-green-600 font-semibold">100% Vested Day 1</span>
                  </td>
                  <td className="py-4 px-4 text-center text-sm">2-year non-compete</td>
                  <td className="py-4 px-4 text-center text-sm">Limited</td>
                  <td className="py-4 px-4 text-center text-green-600">Own from first sale</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium">Quotas</td>
                  <td className="py-4 px-4 text-center bg-amber-50 border-x-2 border-amber-200">
                    <span className="text-green-600 font-semibold">None</span>
                  </td>
                  <td className="py-4 px-4 text-center text-sm">Performance expectations</td>
                  <td className="py-4 px-4 text-center text-sm">Team building encouraged</td>
                  <td className="py-4 px-4 text-center">Varies</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="py-4 px-4 font-medium">Business Model</td>
                  <td className="py-4 px-4 text-center bg-amber-50 border-x-2 border-amber-200">
                    <span className="font-semibold">IMO</span>
                  </td>
                  <td className="py-4 px-4 text-center">MLM</td>
                  <td className="py-4 px-4 text-center">MLM</td>
                  <td className="py-4 px-4 text-center">IMO Hybrid</td>
                </tr>

                {/* Earnings Data */}
                <tr>
                  <td className="py-4 px-4 font-medium">Avg. Agent Earnings (2024)</td>
                  <td className="py-4 px-4 text-center bg-amber-50 border-x-2 border-amber-200">
                    <span className="text-sm text-muted-foreground">Contact for details</span>
                  </td>
                  <td className="py-4 px-4 text-center">$7,757</td>
                  <td className="py-4 px-4 text-center">$6,535 (2023)</td>
                  <td className="py-4 px-4 text-center text-sm">Varies by role</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="py-4 px-4 font-medium">Sales Force Size</td>
                  <td className="py-4 px-4 text-center bg-amber-50 border-x-2 border-amber-200">
                    <span>Growing</span>
                  </td>
                  <td className="py-4 px-4 text-center">151,000+</td>
                  <td className="py-4 px-4 text-center">Large network</td>
                  <td className="py-4 px-4 text-center">Growing network</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Detailed Breakdowns */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Understanding Each Company</h2>

          <div className="max-w-4xl mx-auto space-y-8">
            {/* Primerica */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Primerica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Primerica is one of the largest financial services companies in North America with over 151,000 licensed
                  representatives. They use a multi-level marketing structure focused primarily on term life insurance.
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-green-600">Pros</h4>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span>Established brand recognition</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span>Structured training program</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span>Low barrier to entry ($99)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span>Business continuation plan available</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-red-600">Cons</h4>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                        <span>Low starting commission (25%)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                        <span>Captive - can only sell Primerica products</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                        <span>2-year non-compete/non-solicit if you leave</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                        <span>Average earnings: $7,757/year (2024)</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-slate-100 rounded-lg p-4 text-sm">
                  <strong>Commission Structure:</strong> Representatives start at 25%, progressing to Senior Rep (35%),
                  District Leader (50%), and Division Leader (60%). Average 2024 earnings were $7,757 according to
                  official disclosures.
                </div>

                <p className="text-xs text-muted-foreground">
                  Source:{' '}
                  <a
                    href="https://www.primerica.com/public/primerica_disclosures.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    Primerica Official Disclosures
                  </a>
                </p>
              </CardContent>
            </Card>

            {/* WFG */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  World Financial Group (WFG)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  WFG is a multi-level marketing financial services company owned by Aegon (Transamerica&apos;s parent company).
                  They offer multiple insurance and investment products through their agent network.
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-green-600">Pros</h4>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span>Access to multiple carriers</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span>Diverse product portfolio</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span>Team building opportunities</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span>Training resources available</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-red-600">Cons</h4>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                        <span>Higher startup costs ($100-700+)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                        <span>Low starting commission (25%)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                        <span>Monthly platform fees ($15-30+)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                        <span>Average earnings: $6,535/year (2023)</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-slate-100 rounded-lg p-4 text-sm">
                  <strong>Commission Structure:</strong> Training Associates start at 25%, progressing to Associate (35%),
                  Managing Director (50%), and Senior Managing Director (65%). Requires recruiting to advance.
                  Costs include $100-200 registration, ~$150 licensing, ~$450 E&O insurance, and $15-30+/month platform fees.
                </div>

                <p className="text-xs text-muted-foreground">
                  Source:{' '}
                  <a
                    href="https://www.worldfinancialgroup.com/legal/earnings-disclosure"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    WFG Earnings Disclosure
                  </a>
                </p>
              </CardContent>
            </Card>

            {/* Experior */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Experior Financial Group
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Experior is an Independent Marketing Organization (IMO) that positions itself as a hybrid between
                  traditional captive models and fully independent brokerage. They launched in the USA in 2019.
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-green-600">Pros</h4>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span>Higher commission potential (up to 160% FYC)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span>Book ownership from first sale</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span>Multiple carrier access</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span>Legacy/succession program</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-red-600">Cons</h4>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                        <span>Newer organization (est. 2019 in USA)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                        <span>Monthly fees required</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                        <span>Still building brand recognition</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                        <span>100% commission (no base salary)</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-slate-100 rounded-lg p-4 text-sm">
                  <strong>Commission Structure:</strong> Personal and agency commissions up to 160% of FYC (First Year Commission),
                  with hierarchy commissions up to 213% of FYC. Partners include ManhattanLife, Corebridge (formerly AIG),
                  Mutual of Omaha, Nassau, and American Equity.
                </div>

                <p className="text-xs text-muted-foreground">
                  Source:{' '}
                  <a
                    href="https://usa.experiorfinancial.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    Experior Financial Group
                  </a>
                </p>
              </CardContent>
            </Card>

            {/* Apex */}
            <Card className="border-2 border-amber-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  Apex Affinity Group
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Apex is an Independent Marketing Organization (IMO) that provides street-level contracts, full book ownership,
                  and access to multiple A-rated carriers with no startup costs or monthly fees.
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-green-600">What We Offer</h4>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span>Street-level contracts up to 145%</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span>100% vested from day one</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span>$0 startup costs, $0 monthly fees</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span>7+ A-rated carriers (Columbus Life, AIG, F&G, and more)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span>6 levels of override income</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span>No production quotas</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span>AI-powered tools and CRM included</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span>Fast contracting (48-72 hours)</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Why Agents Choose Apex</h4>
                    <ul className="space-y-2 text-sm">
                      <li>&bull; Keep more of what you earn with higher contracts</li>
                      <li>&bull; Never turn away business with multiple carriers</li>
                      <li>&bull; Your book is YOUR book - no vesting schedules</li>
                      <li>&bull; Build a team and earn passive override income</li>
                      <li>&bull; No nickel-and-diming with fees</li>
                      <li>&bull; Work your way - no quotas or requirements</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Important Disclaimers */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Important Disclosures</h3>
                  <ul className="text-sm text-blue-800 space-y-2">
                    <li>
                      &bull; All commission and earnings data is sourced from official company disclosures and public filings
                      as of the dates noted.
                    </li>
                    <li>
                      &bull; Individual results will vary based on effort, skill, market conditions, and other factors.
                      Past performance does not guarantee future results.
                    </li>
                    <li>
                      &bull; Average earnings figures include both part-time and full-time agents. Many agents earn less
                      than the averages shown.
                    </li>
                    <li>
                      &bull; This comparison is provided for informational purposes. We encourage you to verify all
                      information directly with each company.
                    </li>
                    <li>
                      &bull; Licensing costs, E&O insurance, and other business expenses are the responsibility of
                      the individual agent regardless of which company they join.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Compare in Person?
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Schedule a confidential call with our team. We&apos;ll answer your questions
            and help you make the best decision for your career—no pressure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/join">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                Join Apex Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Schedule a Call
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Sources Footer */}
      <section className="py-8 bg-slate-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="font-semibold mb-4 text-sm">Sources & References</h3>
            <div className="grid md:grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                <p className="font-medium mb-2">Primerica</p>
                <ul className="space-y-1">
                  <li>
                    <a
                      href="https://www.primerica.com/public/primerica_disclosures.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1"
                    >
                      Official Disclosures <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.primerica.com/public/primerica_earnings_statement.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1"
                    >
                      Earnings Statement <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">World Financial Group</p>
                <ul className="space-y-1">
                  <li>
                    <a
                      href="https://www.worldfinancialgroup.com/legal/earnings-disclosure"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1"
                    >
                      Earnings Disclosure <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.worldfinancialgroup.com/business-model"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1"
                    >
                      Business Model <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Experior Financial</p>
                <ul className="space-y-1">
                  <li>
                    <a
                      href="https://usa.experiorfinancial.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1"
                    >
                      Official Website <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://usa.experiorfinancial.com/our-partners/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1"
                    >
                      Partner Carriers <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Additional Sources</p>
                <ul className="space-y-1">
                  <li>
                    <a
                      href="https://www.glassdoor.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1"
                    >
                      Glassdoor Salary Data <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Data compiled January 2025. Commission rates, fees, and earnings figures are subject to change.
              Always verify current information directly with each company.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
