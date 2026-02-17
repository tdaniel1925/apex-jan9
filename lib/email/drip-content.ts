// Drip campaign email content
// 20 emails for newcomers (not_licensed)
// 20 emails for licensed agents (licensed)
// Sent every 3 days

export interface DripEmail {
  step: number;
  subject: string;
  previewText: string;
  content: {
    heading: string;
    paragraphs: string[];
    callToAction?: {
      text: string;
      url: string;
    };
    tips?: string[];
  };
}

// ============================================
// NEWCOMER TRACK (not_licensed)
// ============================================

export const newcomerTrack: DripEmail[] = [
  {
    step: 1,
    subject: "Day 1: Welcome to Your Insurance Journey",
    previewText: "Everything you need to know about starting in insurance",
    content: {
      heading: "Your First Steps in the Insurance Industry",
      paragraphs: [
        "Welcome to the insurance industry! Whether you're completely new or exploring a career change, you've made an excellent choice. The insurance sector is one of the most stable and rewarding industries in America.",
        "Over $1.3 trillion in premiums are written annually in the U.S. insurance market. This massive industry offers unlimited opportunity for those willing to learn and grow.",
        "With Apex Affinity Group, you're not just selling insurance – you're building a business, helping families protect their futures, and creating generational wealth.",
      ],
      tips: [
        "The insurance industry is recession-resistant",
        "No experience required – we provide full training",
        "You can start part-time and transition to full-time",
        "Unlimited income potential based on your effort",
      ],
    },
  },
  {
    step: 2,
    subject: "Understanding the Insurance Landscape",
    previewText: "Learn about different types of insurance and opportunities",
    content: {
      heading: "The Three Pillars of Insurance",
      paragraphs: [
        "The insurance industry has three main sectors: Life Insurance, Health Insurance, and Property & Casualty. Each offers unique opportunities and serves critical needs.",
        "Life insurance protects families from financial devastation. Health insurance ensures access to medical care. Property & Casualty protects assets and businesses.",
        "At Apex, we focus on helping you understand which products align with your market and how to position yourself as a trusted advisor, not just a salesperson.",
      ],
    },
  },
  {
    step: 3,
    subject: "Why People Buy Insurance (And How You Can Help)",
    previewText: "Understanding client motivation is key to success",
    content: {
      heading: "The Psychology of Protection",
      paragraphs: [
        "People don't buy insurance – they buy peace of mind, financial security, and protection for their loved ones. Understanding this mindset transforms how you approach clients.",
        "Your role isn't to 'sell' insurance. It's to identify needs, educate prospects, and guide them toward smart decisions. When you genuinely help people, success follows naturally.",
        "At Apex, we teach consultative selling: asking the right questions, listening actively, and presenting solutions that truly fit each client's situation.",
      ],
      tips: [
        "Focus on protection, not products",
        "Ask questions before presenting solutions",
        "Build trust through education",
        "Follow up consistently and genuinely care",
      ],
    },
  },
  {
    step: 4,
    subject: "Getting Licensed: Your Path to Professional Status",
    previewText: "Everything you need to know about insurance licensing",
    content: {
      heading: "The Licensing Process Made Simple",
      paragraphs: [
        "To sell insurance legally, you need a license. Don't let this intimidate you – millions of people have passed these exams, and with proper preparation, you will too.",
        "Most states require a pre-licensing course (20-40 hours), followed by a state exam. The entire process typically takes 2-4 weeks. Many states offer online courses for flexibility.",
        "Apex provides resources and guidance to help you through the licensing process. Once licensed, you'll have credibility, legal authority, and unlimited earning potential.",
      ],
      callToAction: {
        text: "View Licensing Resources",
        url: "https://theapexway.net/resources",
      },
    },
  },
  {
    step: 5,
    subject: "Building Your Personal Brand",
    previewText: "Stand out in a crowded market with authentic positioning",
    content: {
      heading: "Why Your Story Matters",
      paragraphs: [
        "In insurance, people buy from people they know, like, and trust. Your personal brand is what sets you apart from thousands of other agents.",
        "Your brand isn't about being perfect – it's about being authentic. Share your journey, your 'why,' and your commitment to helping others. People connect with real stories, not sales pitches.",
        "Apex gives you the tools and platform to build your brand, but your unique personality and values are what will attract the right clients to you.",
      ],
      tips: [
        "Share your 'why' – what drove you to insurance?",
        "Be consistent across all platforms (social media, website, email)",
        "Focus on educating, not always selling",
        "Show up regularly and be genuine",
      ],
    },
  },
  {
    step: 6,
    subject: "Your First 30 Days: Building Momentum",
    previewText: "A practical action plan for new insurance professionals",
    content: {
      heading: "The 30-Day Launch Plan",
      paragraphs: [
        "The first 30 days set the tone for your entire insurance career. Focus on education, relationship-building, and taking consistent action – even small steps matter.",
        "Week 1: Complete your initial training and set up your workspace. Week 2: Start studying for your license and reach out to 10 warm contacts. Week 3: Practice your pitch and schedule coffee meetings. Week 4: Make your first presentations.",
        "Don't expect perfection. Expect progress. Every conversation, every 'no,' and every small win is building your skills and confidence.",
      ],
    },
  },
  {
    step: 7,
    subject: "The Power of the Warm Market",
    previewText: "Your existing network is your best starting point",
    content: {
      heading: "Why Your Circle Matters",
      paragraphs: [
        "Your 'warm market' – friends, family, former colleagues, neighbors – is your goldmine. These people already know and trust you, making them far more likely to listen than cold prospects.",
        "Don't think of this as 'selling to friends.' Think of it as sharing an opportunity to protect what matters most. If you truly believe in insurance (and you should), helping your circle is a gift, not an imposition.",
        "At Apex, we teach ethical, relationship-first approaches to warm market prospecting. You'll never feel pushy or salesy – just helpful and genuine.",
      ],
      tips: [
        "Make a list of 50-100 people you know",
        "Reach out personally, not with mass messages",
        "Offer a free review, not a sales pitch",
        "Follow up without being annoying",
      ],
    },
  },
  {
    step: 8,
    subject: "Overcoming Objections with Confidence",
    previewText: "Every 'no' is a step closer to 'yes'",
    content: {
      heading: "Handling Resistance Like a Pro",
      paragraphs: [
        "Objections aren't rejections – they're opportunities. When someone says 'I can't afford it' or 'I need to think about it,' they're actually engaging with you. Your job is to address their concerns, not overcome them.",
        "The best agents don't fear objections; they welcome them. Objections reveal what prospects are really thinking, giving you a chance to provide clarity and build trust.",
        "Apex trains you on the most common objections and how to respond authentically. With practice, objections become conversational stepping stones, not roadblocks.",
      ],
    },
  },
  {
    step: 9,
    subject: "Time Management for Insurance Success",
    previewText: "How to maximize productivity in a flexible career",
    content: {
      heading: "Structuring Your Day for Results",
      paragraphs: [
        "One of the biggest challenges in insurance is the lack of structure. You're your own boss, which is liberating – but also requires discipline.",
        "Successful agents block time for prospecting, follow-ups, training, and administrative tasks. They don't wait for motivation; they follow a schedule that creates momentum.",
        "At Apex, we recommend the 80/20 rule: spend 80% of your time on income-generating activities (prospecting, presentations, follow-ups) and only 20% on everything else.",
      ],
      tips: [
        "Set daily goals (calls made, meetings booked, policies sold)",
        "Block your calendar like a traditional job",
        "Track your activities to identify what works",
        "Eliminate distractions during power hours",
      ],
    },
  },
  {
    step: 10,
    subject: "The Apex Difference: Why We're Not Like Other MLMs",
    previewText: "Real opportunity backed by real products and real value",
    content: {
      heading: "Network Marketing Done Right",
      paragraphs: [
        "Let's address the elephant in the room: Apex is a network marketing company. But we're different from the pyramid schemes and sketchy MLMs that give the industry a bad name.",
        "We sell real products (insurance) that people genuinely need. Our compensation plan rewards both sales and team-building. There are no inventory requirements, monthly quotas, or pressure to recruit.",
        "Our 5×7 matrix ensures spillover benefits, meaning your upline's success helps you grow. You're building a business, not just chasing bonuses. This is about long-term wealth, not quick cash.",
      ],
    },
  },
  {
    step: 11,
    subject: "Building Residual Income: The Insurance Advantage",
    previewText: "Get paid over and over for work you do once",
    content: {
      heading: "The Power of Renewals",
      paragraphs: [
        "One of the best parts of insurance is residual income. When clients renew their policies, you earn commissions year after year – even if you don't actively service them.",
        "Imagine earning $500/month in residual income after just one year of hard work. In five years, that could be $5,000/month or more. This is how insurance agents build generational wealth.",
        "Apex's compensation structure is designed to maximize your residual earnings. Every policy you write, every team member you train, adds to your monthly income stream.",
      ],
    },
  },
  {
    step: 12,
    subject: "Social Media for Insurance Professionals",
    previewText: "Turn your online presence into a lead-generation machine",
    content: {
      heading: "Digital Prospecting in 2026",
      paragraphs: [
        "Social media isn't optional anymore – it's where your prospects are. Facebook, LinkedIn, Instagram, and even TikTok are goldmines for insurance professionals who know how to use them.",
        "The key is consistency and value. Post educational content, share client success stories (with permission), and engage authentically. Don't spam or hard-sell; build relationships.",
        "Apex provides social media templates, graphics, and content ideas to make this easy. You don't need to be a marketer – just show up, be helpful, and let your personality shine.",
      ],
      tips: [
        "Post 3-5 times per week minimum",
        "Mix educational, inspirational, and personal content",
        "Engage with comments and messages promptly",
        "Use video to build trust and connection",
      ],
    },
  },
  {
    step: 13,
    subject: "Handling Rejection: The Mental Game of Sales",
    previewText: "Develop resilience and keep moving forward",
    content: {
      heading: "Why 'No' Doesn't Mean Failure",
      paragraphs: [
        "Rejection is part of insurance. Even the best agents hear 'no' far more than 'yes.' The difference between success and failure isn't talent – it's how you respond to rejection.",
        "Every 'no' brings you closer to a 'yes.' Top producers understand this is a numbers game: make more calls, have more conversations, and statistically, you'll close more sales.",
        "At Apex, we build mental toughness through training, community support, and celebrating small wins. You're never alone in this journey.",
      ],
    },
  },
  {
    step: 14,
    subject: "Understanding the 5×7 Matrix",
    previewText: "How Apex's compensation structure benefits everyone",
    content: {
      heading: "The Math Behind Your Success",
      paragraphs: [
        "Apex uses a 5×7 forced matrix, meaning you can have up to 5 people directly under you, and the structure extends 7 levels deep. This creates exponential growth potential.",
        "Here's the magic: when your 5 spots fill, new recruits from your upline 'spill over' into your downline, helping you build depth even if you're not actively recruiting.",
        "This structure rewards both personal effort and team collaboration. Your success helps your downline, and their success helps you. It's truly a win-win system.",
      ],
      callToAction: {
        text: "View Your Matrix",
        url: "https://theapexway.net/dashboard/team",
      },
    },
  },
  {
    step: 15,
    subject: "Creating Your Sales Process",
    previewText: "Consistency and systems lead to predictable income",
    content: {
      heading: "From Prospect to Policy: Your Proven Path",
      paragraphs: [
        "Winging it doesn't work in insurance. You need a repeatable sales process: prospecting → appointment → presentation → close → follow-up → referrals.",
        "Document what works for you. How do you open conversations? What questions do you ask? How do you overcome objections? Systematize your success so you can replicate it.",
        "Apex provides proven scripts and processes, but personalize them to fit your style. The goal is natural confidence, not robotic selling.",
      ],
    },
  },
  {
    step: 16,
    subject: "The Importance of Continuing Education",
    previewText: "Stay sharp, stay relevant, stay ahead",
    content: {
      heading: "Lifelong Learning in Insurance",
      paragraphs: [
        "Insurance is constantly evolving: new products, new regulations, new market trends. The best agents never stop learning.",
        "Invest in webinars, books, industry conferences, and mentorship. The more you know, the more valuable you become to clients – and the more you earn.",
        "Apex offers ongoing training, but take ownership of your education. Read industry blogs, listen to podcasts, and learn from top producers.",
      ],
      tips: [
        "Set a goal to read one insurance book per quarter",
        "Attend at least two industry events per year",
        "Shadow a top producer for a day",
        "Join an insurance mastermind group",
      ],
    },
  },
  {
    step: 17,
    subject: "Building a Referral Engine",
    previewText: "Turn happy clients into your best marketers",
    content: {
      heading: "The Easiest Way to Grow Your Business",
      paragraphs: [
        "Referrals are the lifeblood of successful insurance practices. When a satisfied client refers you to their friend, that warm introduction is worth more than 100 cold calls.",
        "The key is to ASK. Most agents don't ask for referrals because they're afraid or forget. Make it a habit: after every policy sale, after every positive review, ask for introductions.",
        "At Apex, we teach systematic referral generation. This isn't pushy or uncomfortable – it's a natural extension of providing excellent service.",
      ],
    },
  },
  {
    step: 18,
    subject: "Balancing Sales and Team Building",
    previewText: "How to grow your income through both channels",
    content: {
      heading: "The Two-Engine Success Model",
      paragraphs: [
        "At Apex, you earn in two ways: selling policies and building your team. Both are important, and striking the right balance accelerates your income growth.",
        "In your first 90 days, focus heavily on sales. Build your skills, gain confidence, and create cash flow. Once you're consistently closing deals, shift some energy to recruiting.",
        "Team-building isn't about replacing sales; it's about multiplying your efforts. Train your team well, and they'll generate income for you even while you're focusing on your own clients.",
      ],
    },
  },
  {
    step: 19,
    subject: "Celebrating Your First 60 Days",
    previewText: "Look how far you've come!",
    content: {
      heading: "You're No Longer a Beginner",
      paragraphs: [
        "Take a moment to reflect on your journey. Two months ago, you were just starting. Now you're learning the industry, building skills, and making progress toward your goals.",
        "Whether you've made your first sale, recruited your first team member, or simply stayed consistent with your training – that's success. Growth isn't always linear, but showing up every day compounds.",
        "At Apex, we celebrate milestones. You're part of a community that wants you to succeed. Keep going – your breakthrough is closer than you think.",
      ],
    },
  },
  {
    step: 20,
    subject: "Your Next Chapter: From Beginner to Builder",
    previewText: "The foundation is set. Now it's time to scale.",
    content: {
      heading: "What's Next for You?",
      paragraphs: [
        "You've completed the newcomer training series. You've learned the basics of insurance, built foundational skills, and started taking action. Now it's time to level up.",
        "The next phase is about consistency and scale. Keep prospecting, keep closing, keep recruiting. The habits you've built will compound into life-changing income.",
        "Apex is here every step of the way. Lean on your sponsor, attend team trainings, and never stop learning. Your success story is just beginning.",
      ],
      callToAction: {
        text: "Access Advanced Training",
        url: "https://theapexway.net/dashboard",
      },
    },
  },
];

// ============================================
// LICENSED AGENT TRACK (licensed)
// ============================================

export const licensedAgentTrack: DripEmail[] = [
  {
    step: 1,
    subject: "Welcome, Agent! Let's Take Your Career to the Next Level",
    previewText: "You're already licensed – now let's scale your success",
    content: {
      heading: "Leveling Up Your Insurance Business",
      paragraphs: [
        "Welcome to Apex Affinity Group! As a licensed insurance professional, you already understand the power of this industry. Now it's time to multiply your impact and income.",
        "You've experienced the grind of prospecting, the challenge of closing, and the satisfaction of helping clients. But have you experienced true leverage – where your income grows even when you're not actively selling?",
        "At Apex, we combine your existing skills with a proven team-building model that creates exponential growth. You're not starting over; you're scaling up.",
      ],
    },
  },
  {
    step: 2,
    subject: "Why Top Producers Are Joining Network Marketing",
    previewText: "The industry shift every agent needs to understand",
    content: {
      heading: "The Evolution of Insurance Distribution",
      paragraphs: [
        "The most successful agents in 2026 aren't just selling policies – they're building teams. Network marketing isn't a gimmick; it's a business model that rewards leadership and leverage.",
        "Traditional agencies cap your income through hierarchical structures and profit-sharing limitations. Apex's 5×7 matrix gives you ownership, unlimited depth, and residual income from your entire organization.",
        "You already have the hard skills. Now you're learning the business skills that turn six-figure agents into seven-figure entrepreneurs.",
      ],
    },
  },
  {
    step: 3,
    subject: "Leveraging Your Existing Book of Business",
    previewText: "Your current clients are your greatest asset",
    content: {
      heading: "Monetizing Relationships You've Already Built",
      paragraphs: [
        "As a licensed agent, you likely have a book of business – existing clients who trust you. These relationships are gold, and Apex helps you leverage them ethically.",
        "Consider cross-selling complementary products, asking for referrals, or even presenting the Apex opportunity to entrepreneurial clients. Your existing relationships are your warmest leads.",
        "We teach compliant, relationship-first strategies for expanding your client base without burning bridges or damaging trust.",
      ],
      tips: [
        "Schedule annual reviews with existing clients",
        "Ask every satisfied client for 2-3 referrals",
        "Identify clients who might be interested in the business opportunity",
        "Cross-sell products they don't currently have",
      ],
    },
  },
  {
    step: 4,
    subject: "Building a Team That Sells for You",
    previewText: "Recruiting and training your downline effectively",
    content: {
      heading: "From Solo Agent to Team Leader",
      paragraphs: [
        "The shift from individual contributor to team leader is the key to scaling. Your income is no longer limited by your personal production – it's multiplied by your team's efforts.",
        "Recruiting isn't about convincing people; it's about identifying ambitious individuals who want what you have. Your job is to share the opportunity and provide training – not to drag people across the finish line.",
        "Apex provides all the tools, systems, and support you need to build a thriving team. Focus on finding the right people, and the system does the rest.",
      ],
    },
  },
  {
    step: 5,
    subject: "Advanced Prospecting Strategies for Experienced Agents",
    previewText: "Go beyond warm market and cold calling",
    content: {
      heading: "Sophisticated Lead Generation Techniques",
      paragraphs: [
        "You've already mastered the basics of prospecting. Now let's explore advanced strategies: strategic partnerships, content marketing, LinkedIn outreach, and automated funnels.",
        "The best agents in 2026 don't chase leads – they attract them. By positioning yourself as an authority through content, speaking, and networking, prospects come to you.",
        "Apex provides marketing assets, but your personal brand is what closes deals. Invest in your visibility, and watch your pipeline fill effortlessly.",
      ],
      tips: [
        "Publish weekly LinkedIn posts about insurance trends",
        "Host free webinars or lunch-and-learns",
        "Partner with CPAs, attorneys, and financial advisors",
        "Run targeted Facebook ads to your niche",
      ],
    },
  },
  {
    step: 6,
    subject: "The Math of the 5×7 Matrix",
    previewText: "How to build wealth through team leverage",
    content: {
      heading: "Understanding Exponential Growth",
      paragraphs: [
        "The 5×7 matrix at Apex isn't just a compensation plan – it's a wealth-building machine. Let's break down the math so you can visualize your earning potential.",
        "With 5 people on your first level, 25 on your second, 125 on your third, and so on, a fully-loaded matrix has 97,655 people generating income for you across 7 levels.",
        "Obviously, building a full matrix takes time. But even partial depth – say, 3 levels deep with consistent production – can generate life-changing passive income.",
      ],
      callToAction: {
        text: "View Your Matrix Progress",
        url: "https://theapexway.net/dashboard/team",
      },
    },
  },
  {
    step: 7,
    subject: "Overcoming Stigma: Addressing MLM Objections",
    previewText: "How to handle skepticism from peers and prospects",
    content: {
      heading: "Owning Your Business Model with Confidence",
      paragraphs: [
        "Let's be real: network marketing has a reputation problem. But so did online shopping in 1995. The question isn't whether MLM is 'legitimate' – it's whether THIS opportunity creates value.",
        "Apex sells real insurance products. Our compensation structure rewards results, not recruitment. We're regulated, compliant, and backed by actuarial science. That's not a scheme – that's a business.",
        "When someone questions your involvement in network marketing, don't get defensive. Educate them on how Apex works, share your results, and invite them to judge based on facts, not stereotypes.",
      ],
    },
  },
  {
    step: 8,
    subject: "Time Blocking for Maximum Productivity",
    previewText: "How top producers structure their week",
    content: {
      heading: "The 80/20 of Income Generation",
      paragraphs: [
        "As an experienced agent, you know time management is everything. But are you prioritizing the activities that actually generate income?",
        "Top producers spend 60% of their time prospecting and presenting, 20% training their team, 10% on administration, and 10% on learning. Audit your calendar – does it reflect these priorities?",
        "At Apex, we recommend power hours: uninterrupted blocks dedicated to high-value activities. No emails, no social media, no distractions. Just prospecting, presenting, and team-building.",
      ],
    },
  },
  {
    step: 9,
    subject: "Mastering the Recruiting Conversation",
    previewText: "Scripts and frameworks that convert prospects to partners",
    content: {
      heading: "Presenting the Opportunity Effectively",
      paragraphs: [
        "Recruiting is sales, but instead of selling a product, you're selling a vision. The best recruiters paint a picture of what's possible and let prospects see themselves in that future.",
        "Use the 'Feel, Felt, Found' framework: 'I understand how you feel. I felt the same way. But here's what I found...' This validates concerns while leading to a positive resolution.",
        "Apex provides recruiting presentations, videos, and tools. Your job is to customize these to your audience and deliver with authenticity and conviction.",
      ],
      tips: [
        "Ask questions to understand their goals and pain points",
        "Share your personal 'why' and results",
        "Use third-party tools (videos, testimonials) for credibility",
        "Always follow up within 24-48 hours",
      ],
    },
  },
  {
    step: 10,
    subject: "Building a High-Performance Culture",
    previewText: "How to inspire and lead your downline",
    content: {
      heading: "Leadership That Multiplies Success",
      paragraphs: [
        "Your team's success is your success. As a leader, your job is to set the standard, provide training, and create a culture where people want to perform.",
        "Recognize wins publicly, coach struggles privately, and never stop leading by example. If you're not actively prospecting and selling, your team won't either.",
        "Apex provides weekly team trainings, but your personal involvement is what makes the difference. Show up, support your team, and watch your organization thrive.",
      ],
    },
  },
  {
    step: 11,
    subject: "Advanced Closing Techniques",
    previewText: "Strategies to increase your close rate by 20%+",
    content: {
      heading: "From Good to Great: Closing Like a Pro",
      paragraphs: [
        "You already know how to close, but there's always room to improve. Small tweaks to your process can dramatically increase your conversion rate.",
        "The best closers use assumptive language, handle objections preemptively, and create urgency without pressure. They also know when to walk away – not every prospect is a fit.",
        "At Apex, we analyze what top closers do differently and distill it into repeatable frameworks. Study the best, implement their strategies, and refine based on your results.",
      ],
      tips: [
        "Use trial closes throughout your presentation",
        "Create scarcity or urgency ethically",
        "Summarize benefits before asking for the sale",
        "Have multiple closing techniques ready",
      ],
    },
  },
  {
    step: 12,
    subject: "Scaling Through Systems and Automation",
    previewText: "Leverage technology to 10x your output",
    content: {
      heading: "Work Smarter, Not Just Harder",
      paragraphs: [
        "The most successful agents use CRMs, email automation, and marketing funnels to stay organized and follow up consistently. Technology isn't optional in 2026 – it's essential.",
        "Imagine having automated email sequences nurturing your leads, a CRM tracking every interaction, and social media posts scheduled weeks in advance. This is how top producers scale.",
        "Apex integrates with the best tools in the industry, and we provide training on how to use them effectively. Invest in systems now, and reap the benefits for years.",
      ],
    },
  },
  {
    step: 13,
    subject: "Developing Your Unique Value Proposition",
    previewText: "Stand out in a crowded market of agents",
    content: {
      heading: "Why Should Prospects Choose You?",
      paragraphs: [
        "Every market is saturated with insurance agents. What makes you different? What do you offer that your competitors don't?",
        "Your UVP might be your specialization (serving a specific niche), your service model (white-glove experience), or your story (overcoming adversity). Whatever it is, lean into it.",
        "Apex helps you craft and communicate your UVP, but it must be authentic to you. Prospects can smell fake positioning from a mile away.",
      ],
    },
  },
  {
    step: 14,
    subject: "Retention Strategies That Maximize Lifetime Value",
    previewText: "Selling is great, but keeping clients is better",
    content: {
      heading: "Building a Book That Lasts",
      paragraphs: [
        "Acquiring a new client costs 5-7 times more than retaining an existing one. The best agents focus as much on retention as they do on acquisition.",
        "Regular check-ins, birthday cards, policy reviews, and proactive service keep clients loyal. When they feel valued, they don't shop around – and they refer others.",
        "Apex provides retention tools and reminders, but genuine care is what makes the difference. Treat every client like they're your only client.",
      ],
    },
  },
  {
    step: 15,
    subject: "Niche Marketing: The Secret to Dominating a Market",
    previewText: "Why being a specialist beats being a generalist",
    content: {
      heading: "Riches in Niches",
      paragraphs: [
        "Instead of trying to serve everyone, focus on a specific niche: teachers, small business owners, young families, retirees, etc. When you specialize, you become the go-to expert.",
        "Niche marketing makes your messaging sharper, your referrals easier, and your credibility higher. Prospects in your niche are far more likely to convert.",
        "Apex supports niche-focused agents with specialized training and marketing materials. Choose your niche, own it, and watch your income soar.",
      ],
    },
  },
  {
    step: 16,
    subject: "The Power of Masterminds and Peer Learning",
    previewText: "Surround yourself with top performers",
    content: {
      heading: "Iron Sharpens Iron",
      paragraphs: [
        "You're the average of the five people you spend the most time with. If you want to be a top producer, surround yourself with other top producers.",
        "Join mastermind groups, attend industry conferences, and invest in coaching. The strategies, accountability, and inspiration you gain are worth far more than the cost.",
        "Apex facilitates peer learning through weekly calls, regional meetups, and annual conventions. Show up, participate, and elevate your game.",
      ],
    },
  },
  {
    step: 17,
    subject: "Building Generational Wealth Through Equity",
    previewText: "Your Apex business is an asset, not just a job",
    content: {
      heading: "Creating Something You Can Pass Down",
      paragraphs: [
        "Unlike a traditional sales job, your Apex business is an asset. Your matrix, your residual income, and your team are things you own – and can pass to your heirs.",
        "Imagine building a business that generates $10,000/month in passive income. Even if you stopped working, that income would continue. That's equity. That's wealth.",
        "At Apex, we're not just helping you earn more today – we're helping you build something that lasts for generations.",
      ],
    },
  },
  {
    step: 18,
    subject: "Overcoming Plateaus and Breaking Through",
    previewText: "What to do when growth stalls",
    content: {
      heading: "Every Agent Hits a Ceiling – Until They Don't",
      paragraphs: [
        "Plateaus are normal. You hit a certain income level, get comfortable, and growth slows. The question is: what do you do about it?",
        "Top producers push through plateaus by changing their approach: prospecting harder, upgrading their skills, or shifting focus to team-building. Complacency is the enemy of growth.",
        "Apex provides coaching and accountability to help you break through. Don't settle for 'good enough' when you're capable of extraordinary.",
      ],
    },
  },
  {
    step: 19,
    subject: "Your 60-Day Reflection: Progress and Next Steps",
    previewText: "Celebrate your wins and plan your next move",
    content: {
      heading: "How Far You've Come",
      paragraphs: [
        "Two months ago, you joined Apex as a licensed agent looking to grow. Since then, you've learned our systems, built momentum, and started seeing results.",
        "Take a moment to celebrate your progress – every sale, every recruit, every lesson learned. Success compounds, and you're laying a foundation for massive growth.",
        "At Apex, we're proud of you. Keep going, stay consistent, and trust the process. Your breakthrough is coming.",
      ],
    },
  },
  {
    step: 20,
    subject: "From Agent to Leader: Your Next Chapter",
    previewText: "You're ready for the next level",
    content: {
      heading: "The Journey Continues",
      paragraphs: [
        "You've completed the licensed agent training series. You've honed your skills, built your team, and started scaling your income. Now it's time to think bigger.",
        "The next phase is about leadership: mentoring your downline, refining your systems, and expanding your impact. You're no longer just an agent – you're an entrepreneur.",
        "Apex is here every step of the way. Keep learning, keep building, and never stop pushing toward your goals. Your success story is just beginning.",
      ],
      callToAction: {
        text: "Access Leadership Training",
        url: "https://theapexway.net/dashboard",
      },
    },
  },
];
