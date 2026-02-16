// SPEC: Audience Segmentation > Content Messaging
// Centralized messaging for different audience types

export type AudienceType = "agents" | "newcomers" | "both";

// ============================================
// HERO SECTION
// ============================================

export const heroMessaging = {
  agents: {
    title: "Ready to Own Your Book and Earn What You're Worth?",
    subtitle:
      "Get industry-leading rates through 3Mark Financial, keep 100% ownership, and let AI handle your follow-ups. This is insurance without the restrictions.",
  },
  newcomers: {
    title: "Start Your Career in Life Insurance—No Experience Needed",
    subtitle:
      "Get licensed, trained, and earning with our proven system. AI automation handles the hard parts. You focus on building relationships and income.",
  },
  both: {
    title: "Are You Enjoying What You Do?",
    subtitle:
      "If not, why settle? Own your book. Access top rates. Build wealth through your team. The only insurance company with AI-powered automation.",
  },
};

// ============================================
// ABOUT SECTION (Corporate)
// ============================================

export const aboutMessaging = {
  agents: {
    heading: "Why Experienced Agents Choose Apex",
    paragraph1:
      "Tired of companies that own your book? Territory restrictions? Limited carrier access? At Apex, you own what you build—100%. Access industry-leading life insurance rates through 3Mark Financial, so your clients get better prices and you close more deals.",
    paragraph2:
      "Plus, our AI-powered Business Growth Co-Pilot automates your follow-ups, nurtures leads, and handles communication—so you can focus on what you do best: selling. Build wealth from your team's growth, not just your own sales.",
  },
  newcomers: {
    heading: "Your Path to a Profitable Insurance Career",
    paragraph1:
      "No insurance experience? No problem. We'll guide you through licensing, provide complete training, and give you the tools to succeed from day one. Access top life insurance rates through 3Mark Financial, making it easier to help clients and earn commissions.",
    paragraph2:
      "Our AI-powered Business Growth Co-Pilot does the heavy lifting—automating follow-ups, lead nurture, and communication. You focus on learning, building relationships, and growing your income. Plus, earn from your team's success as you build your organization.",
  },
  both: {
    heading: "Insurance, Reimagined for Your Success",
    paragraph1:
      "Tired of companies that own your book? Territory restrictions? Chasing leads without support? At Apex, you own what you build—100%. Access industry-leading life insurance rates through 3Mark Financial, so your clients get better prices and you close more deals.",
    paragraph2:
      "Plus, our AI-powered Business Growth Co-Pilot automates your follow-ups, nurtures leads, and handles communication—so you can focus on selling. Build wealth from your team's growth, not just your own sales. This is insurance done right.",
  },
};

// ============================================
// PROCESS SECTION (Corporate)
// ============================================

export const processMessaging = {
  agents: {
    sectionTitle: "How It Works for Licensed Agents",
    subtitle: "Four simple steps to start earning more with full ownership",
    steps: [
      {
        title: "Transfer Your Book",
        description: "Bring your existing clients and own them 100%—no buybacks",
      },
      {
        title: "Access Top Rates",
        description: "Get appointed with 3Mark Financial's leading carriers",
      },
      {
        title: "Let AI Work for You",
        description: "Automate follow-ups and lead nurture with our Co-Pilot",
      },
      {
        title: "Build Team Wealth",
        description: "Earn from your sales AND your team's growth",
      },
    ],
    ctaText: "Ready to own your business and build your legacy?",
  },
  newcomers: {
    sectionTitle: "Your Path from Zero to Licensed Agent",
    subtitle: "Four simple steps to launch your insurance career",
    steps: [
      {
        title: "Get Started",
        description: "Sign up and get your personal marketing website",
      },
      {
        title: "Get Licensed",
        description: "We guide you through licensing—study materials included",
      },
      {
        title: "Start Selling",
        description: "Use AI automation and top rates to close your first deals",
      },
      {
        title: "Build Your Team",
        description: "Recruit and earn from your organization's growth",
      },
    ],
    ctaText: "Ready to start your career and build your future?",
  },
  both: {
    sectionTitle: "How It Works",
    subtitle: "Four simple steps to own your future in insurance",
    steps: [
      {
        title: "Get Started",
        description: "Create your account and get your personal site",
      },
      {
        title: "Get Licensed",
        description: "We guide you through licensing (or transfer existing)",
      },
      {
        title: "Start Selling",
        description: "Use AI automation and top rates to close deals",
      },
      {
        title: "Build Wealth",
        description: "Earn on sales AND your team's growth",
      },
    ],
    ctaText: "Ready to own your business and build your legacy?",
  },
};

// ============================================
// CTA SECTION
// ============================================

export const ctaMessaging = {
  agents: {
    heading: "Tired of Working for Someone Else's Dream?",
    subheading:
      "You've built the skills. Now build the business. Own your book, access elite rates, and let AI handle the busy work. Your turn.",
    primaryCta: "See How It Works",
    secondaryCta: "Learn More",
  },
  newcomers: {
    heading: "Ready to Build a Real Career?",
    subheading:
      "No degree required. No experience needed. Just the drive to succeed. Get licensed, get trained, and start earning. Your future starts here.",
    primaryCta: "Start Your Journey",
    secondaryCta: "Learn More",
  },
  both: {
    heading: "Are You Enjoying What You Do?",
    subheading:
      "If not, why settle? There's a better way—one where you own your book, access top rates, and build wealth through your team.",
    primaryCta: "See How It Works",
    secondaryCta: "Learn More",
  },
};

// ============================================
// SERVICES SECTION - PRIORITY ORDERING
// ============================================

// Note: Services content is the same, but we can reorder by priority

export const servicesPriority = {
  agents: [0, 2, 1, 3, 4, 5], // AI, Rates, Ownership, Team, Marketing, Training
  newcomers: [5, 0, 3, 1, 4, 2], // Training, AI, Team, Rates, Marketing, Ownership
  both: [0, 1, 2, 3, 4, 5], // Default order
};
