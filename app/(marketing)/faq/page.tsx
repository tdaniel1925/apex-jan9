/**
 * FAQ Page
 * Frequently asked questions about Apex Affinity Group
 */

import { Metadata } from 'next';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Find answers to common questions about joining Apex Affinity Group, licensing, commissions, training, and more.',
};

const faqCategories = [
  {
    title: 'Getting Started',
    faqs: [
      {
        question: 'Do I need an insurance license to join?',
        answer: 'Yes, you need a life insurance license to sell products and earn commissions. However, you can join Apex while you\'re getting licensed. We provide guidance on the licensing process and recommend study materials. Most people complete licensing within 2-4 weeks.',
      },
      {
        question: 'Is there a fee to join Apex?',
        answer: 'No. Unlike many agencies, we don\'t charge enrollment fees, platform fees, or monthly fees to be part of Apex. Your only costs are obtaining your insurance license (state exam fees) and any personal business expenses you choose to incur.',
      },
      {
        question: 'What states can I sell in?',
        answer: 'Our agents sell in all 50 states. You\'ll need to be licensed in each state where you want to sell. Many agents start with their home state and expand as they grow their business.',
      },
      {
        question: 'Do I need prior insurance experience?',
        answer: 'No prior experience is required. Our training program is designed to take you from zero to productive agent. Many of our top performers came from completely different industries.',
      },
    ],
  },
  {
    title: 'Compensation',
    faqs: [
      {
        question: 'How do commissions work?',
        answer: 'You earn a percentage of the premium when you sell a policy. Commission rates vary by product and carrier, ranging from 50% to over 100% of first-year premium for life insurance. You also earn renewal commissions on policies that stay in force.',
      },
      {
        question: 'When do I get paid?',
        answer: 'Commissions are paid weekly or bi-weekly depending on the carrier. Once a policy is issued and the first premium is collected, your commission is typically paid within 1-2 weeks.',
      },
      {
        question: 'What are chargebacks?',
        answer: 'If a policy lapses within the chargeback period (typically 6-12 months), a portion of your commission may be recovered. This is standard in the insurance industry. We provide training on persistency to help minimize chargebacks.',
      },
      {
        question: 'How much can I earn?',
        answer: 'Income varies significantly based on effort, experience, and market conditions. Most new agents earn little in their first year while building skills. Some agents earn six figures, but this typically takes 2-3+ years of dedicated effort. Please read our income disclosure for actual statistics.',
      },
      {
        question: 'What are override commissions?',
        answer: 'If you recruit and develop other agents, you can earn override commissions on their production. Our compensation plan pays overrides up to 6 generations deep, creating potential for passive income as your team grows.',
      },
    ],
  },
  {
    title: 'Training & Support',
    faqs: [
      {
        question: 'What training is provided?',
        answer: 'We provide comprehensive training including: licensing prep guidance, product knowledge courses, sales training with scripts and role-plays, field training with experienced agents, weekly team calls, and ongoing education. Our AI Copilot tool also provides real-time assistance.',
      },
      {
        question: 'Is the training online or in-person?',
        answer: 'Both! Most training is available online so you can learn at your own pace. We also have in-person events, field training days, and regional meetings for hands-on learning and networking.',
      },
      {
        question: 'What is the AI Copilot?',
        answer: 'Our exclusive AI tool that helps you with sales scripts, objection handling, product recommendations, and lead management. It\'s like having a sales coach available 24/7. This technology gives Apex agents a competitive advantage.',
      },
      {
        question: 'Will I have a mentor?',
        answer: 'Yes, you\'ll be connected with an upline mentor who can guide you through your first months. They earn overrides on your production, so they\'re incentivized to help you succeed.',
      },
    ],
  },
  {
    title: 'Products & Carriers',
    faqs: [
      {
        question: 'What products can I sell?',
        answer: 'Through our carrier partnerships, you can sell term life, whole life, universal life, IUL, final expense, fixed annuities, and indexed annuities. We focus primarily on life insurance and retirement products.',
      },
      {
        question: 'Who are your carrier partners?',
        answer: 'We partner with 7 A-rated carriers: Columbus Life, AIG, F&G, Mutual of Omaha, National Life Group, Symetra, and North American. All are financially strong companies with competitive products.',
      },
      {
        question: 'Can I represent other companies?',
        answer: 'As an independent contractor, you\'re not exclusive to Apex. However, you must follow each carrier\'s appointment rules and cannot represent direct competitors in certain situations.',
      },
    ],
  },
  {
    title: 'Business Operations',
    faqs: [
      {
        question: 'Am I an employee or contractor?',
        answer: 'You are an independent contractor, not an employee. This means you control your own schedule, methods, and business practices. You\'re responsible for your own taxes (including self-employment tax) and don\'t receive employee benefits.',
      },
      {
        question: 'Do I need an office?',
        answer: 'No. Most agents work from home and meet clients at their homes, coffee shops, or virtually via video call. You don\'t need a physical office to be successful.',
      },
      {
        question: 'What are my startup costs?',
        answer: 'Minimal. You\'ll need to pay for your licensing exam (typically $50-150), study materials if desired, and basic business cards/marketing materials. There are no Apex fees. Total startup is usually under $500.',
      },
      {
        question: 'How do I find clients?',
        answer: 'We train on multiple lead generation methods including warm market (friends/family), referrals, social media, networking, and purchased leads. Your upline can help you develop a lead strategy that fits your style and budget.',
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about joining Apex, compensation,
            training, and more.
          </p>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-12">
            {faqCategories.map((category) => (
              <div key={category.title}>
                <h2 className="text-2xl font-bold mb-6">{category.title}</h2>
                <Accordion type="single" collapsible className="space-y-4">
                  {category.faqs.map((faq, index) => (
                    <AccordionItem
                      key={index}
                      value={`${category.title}-${index}`}
                      className="border rounded-lg px-4"
                    >
                      <AccordionTrigger className="text-left hover:no-underline py-4">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-4">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Income Disclaimer Link */}
      <section className="py-12 bg-amber-50 border-y border-amber-200">
        <div className="container mx-auto px-4 text-center">
          <p className="text-amber-800 mb-2">
            Have questions about earning potential?
          </p>
          <Link href="/income-disclaimer" className="text-amber-900 font-medium underline">
            Read our detailed Income Disclosure Statement &rarr;
          </Link>
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6 text-center">
              <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
              <p className="text-muted-foreground mb-6">
                Can&apos;t find what you&apos;re looking for? Our team is happy to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button>Contact Us</Button>
                </Link>
                <Link href="/signup">
                  <Button variant="outline">Apply Now</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
