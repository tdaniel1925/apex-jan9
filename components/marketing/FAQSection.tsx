// SPEC: OPTIVE REDESIGN > FAQ Section
// SOURCE: index.html lines 1500-1744

"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import * as Accordion from "@radix-ui/react-accordion";
import { Plus, Minus } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: "What is Apex Affinity Group?",
    answer: "Apex Affinity Group is a network marketing organization that uses a proven 5×7 forced matrix system to help members build sustainable income. We provide training, support, and a community of entrepreneurs working together toward financial freedom.",
  },
  {
    question: "How does the 5×7 matrix work?",
    answer: "Our 5×7 matrix means each position can have up to 5 direct enrollees, and the system extends 7 levels deep. When someone joins under your sponsor, they're automatically placed in the optimal position in the matrix. This ensures everyone benefits from team growth through spillover.",
  },
  {
    question: "What is spillover and how do I benefit?",
    answer: "Spillover occurs when your upline's recruiting efforts result in new members being placed in your downline. Because of our forced matrix structure, you can benefit from your team's growth even when you're not actively recruiting. This creates passive growth opportunities.",
  },
  {
    question: "How much does it cost to join?",
    answer: "The initial membership fee varies based on your chosen package. Contact your sponsor for current pricing and payment options. All fees go toward your position in the matrix, training materials, and replicated website access.",
  },
  {
    question: "How do I earn income with Apex?",
    answer: "You earn through multiple streams: direct enrollment bonuses when you personally recruit members, matrix commissions from your entire organization, and residual income as your team grows. The more your team expands, the more passive income you generate.",
  },
  {
    question: "Do I need to recruit people to succeed?",
    answer: "While personal recruiting accelerates your growth and earnings, our spillover system means you can benefit from your upline's efforts too. The most successful members combine personal recruiting with leveraging spillover and mentoring their team.",
  },
  {
    question: "What training and support do I get?",
    answer: "All members receive comprehensive training materials, weekly group calls, one-on-one mentorship from your sponsor, access to our member portal with resources, and ongoing support from the entire Apex community. We're committed to your success.",
  },
  {
    question: "Can I do this part-time?",
    answer: "Absolutely! Many of our most successful members started part-time while maintaining other commitments. The beauty of our system is that it works with your schedule. You can build your business at your own pace and scale up as you see results.",
  },
  {
    question: "What is a replicated website?",
    answer: "Every member receives a professional, personalized website that looks just like our corporate site but features your information and tracks your referrals. This makes it easy to share the Apex opportunity with others using a simple, branded URL.",
  },
  {
    question: "Is there a guarantee or refund policy?",
    answer: "We stand behind our system and offer a satisfaction guarantee for new members. Specific refund terms are outlined in your membership agreement. We're confident that with proper effort and use of our training, you'll see results.",
  },
];

export function FAQSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [openItems, setOpenItems] = useState<string[]>([]);

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="container max-w-optive mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block text-sm font-semibold text-apex-navy uppercase tracking-wider mb-4">
              FAQ
            </span>
            <h2 className="text-4xl md:text-5xl font-heading font-semibold text-apex-dark mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-apex-gray max-w-3xl mx-auto">
              Got questions? We've got answers. Here are the most common questions about Apex and how it works.
            </p>
          </motion.div>
        </div>

        {/* FAQ Accordion */}
        <div ref={ref} className="max-w-4xl mx-auto">
          <Accordion.Root
            type="multiple"
            value={openItems}
            onValueChange={setOpenItems}
            className="space-y-4"
          >
            {faqItems.map((item, index) => {
              const itemValue = `item-${index}`;
              const isOpen = openItems.includes(itemValue);

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Accordion.Item
                    value={itemValue}
                    className="bg-apex-bg rounded-xl overflow-hidden border border-transparent hover:border-apex-navy/30 transition-colors duration-200"
                  >
                    <Accordion.Header>
                      <Accordion.Trigger className="w-full flex items-center justify-between p-6 text-left group">
                        <span className="text-lg font-heading font-semibold text-apex-dark pr-8 group-hover:text-apex-navy transition-colors duration-200">
                          {item.question}
                        </span>
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-apex-navy/10 flex items-center justify-center group-hover:bg-apex-navy transition-colors duration-200">
                          {isOpen ? (
                            <Minus className="w-5 h-5 text-apex-navy group-hover:text-white transition-colors duration-200" />
                          ) : (
                            <Plus className="w-5 h-5 text-apex-navy group-hover:text-white transition-colors duration-200" />
                          )}
                        </span>
                      </Accordion.Trigger>
                    </Accordion.Header>
                    <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                      <div className="px-6 pb-6 pt-0">
                        <p className="text-apex-gray leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    </Accordion.Content>
                  </Accordion.Item>
                </motion.div>
              );
            })}
          </Accordion.Root>
        </div>

        {/* CTA at bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-12"
        >
          <p className="text-lg text-apex-gray mb-4">
            Still have questions?
          </p>
          <a
            href="#contact"
            className="inline-block text-apex-navy font-semibold hover:text-apex-navy-dark transition-colors duration-200"
          >
            Contact us for more information →
          </a>
        </motion.div>
      </div>
    </section>
  );
}
