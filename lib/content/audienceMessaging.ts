// SPEC: Audience Segmentation > Content Messaging
// Centralized messaging for different audience types
// Updated based on Apex Affinity Group recruitment deck

export type AudienceType = "agents" | "newcomers" | "both";

// ============================================
// HERO SECTION
// ============================================

export const heroMessaging = {
  agents: {
    title: "50% Commissions or 100%? Your Choice.",
    subtitle:
      "7 premier carriers. Up to 100% commissions paid direct. AI-powered CRM. Build a team and earn 6-generation overrides. Keep 100% ownership. Free to join.",
  },
  newcomers: {
    title: "No Experience? No Problem. We'll Get You Licensed and Selling.",
    subtitle:
      "Complete training. 1-on-1 mentorship. Write your first policy within 2 weeks. Earn 50-100% commissions on 7 top carriers. Free to join, no monthly fees.",
  },
  both: {
    title: "More Carriers. Better Technology. Higher Commissions.",
    subtitle:
      "Apex gives you what captive agencies can't: 7 premier carriers, up to 100% commissions, AI-powered CRM, and a 6-generation team override structure. Free to join.",
  },
};

// ============================================
// ABOUT SECTION (Corporate)
// ============================================

export const aboutMessaging = {
  agents: {
    heading: "Why Agents Leave Captive Agencies for Apex",
    paragraph1:
      "Stuck at 30-50% commissions with 1-2 carriers? Dead leads and outdated tools? Apex gives you access to 7 premier life insurance carriers (Columbus Life, AIG, F&G, Mutual of Omaha, National Life Group, Symetra, North American) with commissions from 50% up to 100% at MGA level—paid directly by carriers, not through us.",
    paragraph2:
      "Use CoPilot, our optional AI-powered CRM ($49-$199/month), for lead scoring, automated follow-up, multi-carrier quoting, and real-time objection handling. Build a team and earn 6-generation overrides: 15% on Gen 1, 5% on Gen 2, down to 0.5% on Gen 6. Or go solo—earn six figures on personal production alone.",
  },
  newcomers: {
    heading: "From Zero to Licensed Agent in Weeks",
    paragraph1:
      "No insurance experience? We'll help you get licensed and provide fast-start training so you're selling within your first week. You'll get proven sales scripts, weekly coaching calls with top producers, a 1-on-1 mentor, and access to 100+ training videos. Most agents write their first policy within 2 weeks.",
    paragraph2:
      "Start earning 50-60% commissions immediately, advancing to 85-100% as you rank up. Sell term, whole life, or indexed universal life (IUL) from 7 top carriers. Build a team and earn 6-generation overrides—or focus on personal production. Fast Start Bonuses up to $750 in your first 90 days. It's free to join with no monthly fees.",
  },
  both: {
    heading: "Insurance, Done Right",
    paragraph1:
      "Apex Affinity Group is an independent insurance marketing organization (IMO) that gives agents more carriers, better technology, and higher commissions than captive agencies or typical IMOs. Access 7 premier carriers with products spanning term, whole life, and indexed universal life (IUL).",
    paragraph2:
      "Earn 50-100% commissions paid directly by carriers. Use our AI-powered CoPilot CRM (optional, $49-$199/month) with automated follow-up, multi-carrier quoting, and lead scoring. Build a team with 6-generation overrides (15% on direct recruits down to 0.5% on Gen 6). Free to join, no monthly fees. Your book stays yours—100% ownership.",
  },
};

// ============================================
// PROCESS SECTION (Corporate)
// ============================================

export const processMessaging = {
  agents: {
    sectionTitle: "How It Works for Licensed Agents",
    subtitle: "Start earning more within days, not months",
    steps: [
      {
        title: "Apply Online (5 Minutes)",
        description: "Free application. No monthly fees. Keep your existing book.",
      },
      {
        title: "Get Appointed to 7 Carriers",
        description: "Columbus Life, AIG, F&G, Mutual of Omaha, National Life Group, Symetra, North American",
      },
      {
        title: "Access Your Tools",
        description: "Back office, replicated website, optional CoPilot CRM ($49-$199/month)",
      },
      {
        title: "Start Earning 50-100%",
        description: "Commissions paid direct by carriers. Build team for 6-gen overrides or go solo.",
      },
    ],
    ctaText: "Ready to earn what you're worth?",
  },
  newcomers: {
    sectionTitle: "Your Path from Unlicensed to Earning",
    subtitle: "Most agents write their first policy within 2 weeks",
    steps: [
      {
        title: "Apply & Get Licensed",
        description: "Free to join. We help with licensing. Fast-start training begins immediately.",
      },
      {
        title: "Complete Training",
        description: "Selling within week 1. Proven scripts, weekly coaching, 1-on-1 mentor, 100+ videos.",
      },
      {
        title: "Set Up Your Tools",
        description: "Back office, replicated website, optional CoPilot CRM for automation.",
      },
      {
        title: "Write Your First Policy",
        description: "Earn 50-60% commissions on term, whole life, or IUL from 7 carriers. Fast Start Bonus up to $750.",
      },
    ],
    ctaText: "Ready to start your career and build your future?",
  },
  both: {
    sectionTitle: "How to Get Started",
    subtitle: "Five simple steps to launch your Apex business",
    steps: [
      {
        title: "Apply Online (Free)",
        description: "5-minute application. No monthly fees.",
      },
      {
        title: "Get Licensed",
        description: "Already licensed? Great. New? We'll help you get there.",
      },
      {
        title: "Complete Training",
        description: "Fast-start training, weekly coaching, 1-on-1 mentorship, resource library.",
      },
      {
        title: "Set Up Your Tools",
        description: "Back office, website, optional CoPilot CRM.",
      },
      {
        title: "Start Selling",
        description: "7 carriers, 50-100% commissions, 6-gen overrides. Build your way.",
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
    heading: "Earn $70K on $100K Premium—Not $35K",
    subheading:
      "At 70% with Apex vs. 35% captive, you double your income on the same work. Rank to MGA and hit 100%. Build a team and stack 6-gen overrides. Or go solo and keep it all.",
    primaryCta: "Join Now",
    secondaryCta: "Learn More",
  },
  newcomers: {
    heading: "From Zero to First Commission in 2 Weeks",
    subheading:
      "We'll get you licensed, trained, and selling. Fast Start Bonus up to $750 in 90 days. Rank advancement bonuses from $25 to $20,000. Monthly and quarterly contests. It's free to join.",
    primaryCta: "Start Your Career",
    secondaryCta: "Learn More",
  },
  both: {
    heading: "Ready to Stop Leaving Money on the Table?",
    subheading:
      "More carriers. Higher commissions. Better technology. Team-building upside. Free to join. No monthly fees. Your book stays yours. This is how insurance should work.",
    primaryCta: "Join Now",
    secondaryCta: "Learn More",
  },
};

// ============================================
// SERVICES SECTION - PRIORITY ORDERING
// ============================================

// Note: Services content is the same, but we can reorder by priority

export const servicesPriority = {
  agents: [1, 0, 3, 2, 4, 5], // Commissions, Carriers, Team Building, CoPilot, Marketing, Training
  newcomers: [5, 3, 0, 1, 4, 2], // Training, Team Building, Carriers, Commissions, Marketing, CoPilot
  both: [0, 1, 2, 3, 4, 5], // Default order
};
