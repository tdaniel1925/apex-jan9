# Component Architecture — Optive to React/Next.js

**Purpose:** Define React component structure for Apex marketing pages based on Optive template
**Approach:** Variant-based components (corporate vs. replicated)
**Framework:** Next.js 15 + TypeScript + Tailwind CSS

---

## 📋 Component Overview

Total Components: **10**

| # | Component Name | Variants | Priority | Complexity |
|---|---------------|----------|----------|------------|
| 1 | MarketingHeader | corporate, replicated | High | Medium |
| 2 | HeroSection | corporate, replicated | High | Medium |
| 3 | AboutSection | corporate, replicated | High | High |
| 4 | ServicesSection | shared | Medium | Low |
| 5 | ProcessSection | corporate, replicated | Medium | Medium |
| 6 | TestimonialsSection | corporate, replicated | Medium | Medium |
| 7 | FAQSection | shared | Low | Low |
| 8 | ContactSection | replicated only | High | High (backend) |
| 9 | CTASection | corporate, replicated | Medium | Low |
| 10 | MarketingFooter | shared | High | Low |

---

## 📂 File Structure

```
components/
  marketing/
    MarketingHeader.tsx
    HeroSection.tsx
    AboutSection.tsx
    ServicesSection.tsx
    ProcessSection.tsx
    TestimonialsSection.tsx
    FAQSection.tsx
    ContactSection.tsx
    CTASection.tsx
    MarketingFooter.tsx
    MarketingLayout.tsx  # Wrapper component
```

---

## 🏗️ Page Structure

### Corporate Page (`/`)

```tsx
// app/(public)/page.tsx

export default async function CorporatePage() {
  return (
    <div className="min-h-screen">
      <MarketingHeader variant="corporate" ctaLink="/join" />

      <main>
        <HeroSection
          variant="corporate"
          title="Build Your Financial Future with Apex"
          subtitle="Join a community of entrepreneurs..."
          ctaText="Get Started"
          ctaLink="/join"
        />

        <AboutSection
          variant="corporate"
          stats={{
            yearsInBusiness: 5,
            activeDistributors: 1247,
            countries: 12,
          }}
        />

        <ServicesSection />

        <ProcessSection variant="corporate" />

        <TestimonialsSection variant="corporate" />

        <FAQSection />

        <CTASection variant="corporate" ctaLink="/join" />
      </main>

      <MarketingFooter />
    </div>
  );
}
```

### Replicated Page (`/[username]`)

```tsx
// app/(public)/[username]/page.tsx

export default async function ReplicatedPage({ params }: { params: { username: string } }) {
  const distributor = await findDistributorByUsername(params.username);
  const teamSize = await getOrganizationSize(distributor.id);
  const directCount = await getDirectEnrolleesCount(distributor.id);

  return (
    <div className="min-h-screen">
      <MarketingHeader
        variant="replicated"
        distributorName={`${distributor.firstName} ${distributor.lastName}`}
        ctaLink={`/join/${distributor.username}`}
      />

      <main>
        <HeroSection
          variant="replicated"
          title={`Join ${distributor.firstName}'s Team at Apex`}
          subtitle={`Build your financial future with ${distributor.firstName}...`}
          ctaText={`Join ${distributor.firstName}'s Team`}
          ctaLink={`/join/${distributor.username}`}
          distributorPhoto={distributor.photoUrl}
          distributorName={distributor.firstName}
        />

        <AboutSection
          variant="replicated"
          distributor={{
            firstName: distributor.firstName,
            lastName: distributor.lastName,
            photoUrl: distributor.photoUrl,
            bio: distributor.bio,
            createdAt: distributor.createdAt,
          }}
          teamStats={{
            totalTeamSize: teamSize,
            directEnrollees: directCount,
          }}
        />

        <ServicesSection />

        <ProcessSection
          variant="replicated"
          distributorName={distributor.firstName}
        />

        <TestimonialsSection
          variant="replicated"
          distributorName={distributor.firstName}
        />

        <ContactSection
          distributorId={distributor.id}
          distributorName={distributor.firstName}
          distributorEmail={distributor.email}
        />

        <CTASection
          variant="replicated"
          distributorName={distributor.firstName}
          ctaLink={`/join/${distributor.username}`}
        />
      </main>

      <MarketingFooter />
    </div>
  );
}
```

---

## 🧩 Component Specifications

### 1. MarketingHeader

**File:** `components/marketing/MarketingHeader.tsx`
**Client Component:** ✅ Yes (interactive menu)

**Props:**
```typescript
interface MarketingHeaderProps {
  variant: "corporate" | "replicated";
  distributorName?: string;  // Required for replicated
  ctaLink: string;           // CTA button destination
}
```

**Features:**
- Sticky header on scroll (adds shadow)
- Logo (links to `/`)
- Navigation menu with smooth scroll to sections
- Mobile hamburger menu (< 768px)
- CTA button (context-aware text)
- State: `isScrolled`, `isMobileMenuOpen`

**Navigation Links:**

**Corporate:**
- Home (`#home`)
- About (`#about`)
- Opportunity (`#opportunity`)
- How It Works (`#how-it-works`)
- FAQ (`#faq`)
- Contact (`#contact`)
- CTA: "Join Now" → `/join`

**Replicated:**
- About {FirstName} (`#about`)
- Opportunity (`#opportunity`)
- How to Join (`#how-to-join`)
- Contact {FirstName} (`#contact`)
- CTA: "Join {FirstName}'s Team" → `/join/[username]`

**Optive Source:** Lines 48-105
**Dependencies:** lucide-react (icons), useState, useEffect
**Backend Connection:** None

---

### 2. HeroSection

**File:** `components/marketing/HeroSection.tsx`
**Client Component:** ❌ No (can be server component)

**Props:**
```typescript
interface HeroSectionProps {
  variant: "corporate" | "replicated";
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  backgroundVideo?: string;      // Optional video URL
  backgroundImage?: string;      // Fallback image
  distributorPhoto?: string | null;  // For replicated variant
  distributorName?: string;      // For replicated variant
}
```

**Features:**
- Full-height hero (min-h-screen)
- Video background OR static image
- Dark gradient overlay
- Animated title entrance (Framer Motion)
- Large CTA button
- **Corporate:** Generic messaging + optional sidebar info box
- **Replicated:** Distributor photo (large, circular) + personalized text

**Layout:**
- Corporate: 2-column (col-xl-8 text + col-xl-4 info box)
- Replicated: Centered text + distributor photo

**Optive Source:** Lines 107-173
**Dependencies:** framer-motion
**Backend Connection:** None (receives props from page)

---

### 3. AboutSection

**File:** `components/marketing/AboutSection.tsx`
**Client Component:** ✅ Yes (counter animations)

**Props:**
```typescript
interface AboutSectionProps {
  variant: "corporate" | "replicated";

  // Corporate variant
  stats?: {
    yearsInBusiness: number;
    activeDistributors: number;
    countries: number;
  };

  // Replicated variant
  distributor?: {
    firstName: string;
    lastName: string;
    photoUrl: string | null;
    bio: string | null;
    createdAt: Date;
  };
  teamStats?: {
    totalTeamSize: number;
    directEnrollees: number;
  };
}
```

**Features:**
- **Corporate:** Company overview + 4 animated stat counters
- **Replicated:** Distributor bio + photo + 3 team stat counters
- Counter animation on scroll (Framer Motion `useInView`)
- Avatar component (photo OR initials fallback)
- Years calculation from `createdAt`

**Counter Animation:**
- Triggers when scrolled into view
- Animates from 0 to target value over 2 seconds
- Easing: linear increment

**Optive Source:** Lines 243-325
**Dependencies:** framer-motion, Avatar component
**Backend Connection:**
- `getOrganizationSize(distributorId)` → teamStats.totalTeamSize
- `getDirectEnrolleesCount(distributorId)` → teamStats.directEnrollees

---

### 4. ServicesSection

**File:** `components/marketing/ServicesSection.tsx`
**Client Component:** ❌ No (static content)

**Props:** None (all content hardcoded)

**Features:**
- Grid of 6 service/benefit cards
- Each card: Icon + heading + description
- Hover effect (lift + shadow)
- Same content for corporate + replicated
- Responsive: 3 cols (lg), 2 cols (md), 1 col (sm)

**Content (Apex-specific):**
1. **5×7 Forced Matrix** (Grid icon)
2. **Spillover Benefits** (TrendingUp icon)
3. **Replicated Website** (Globe icon)
4. **Training & Support** (GraduationCap icon)
5. **Residual Income** (DollarSign icon)
6. **Community** (Users icon)

**Optive Source:** Lines 327-482
**Dependencies:** lucide-react
**Backend Connection:** None

---

### 5. ProcessSection

**File:** `components/marketing/ProcessSection.tsx`
**Client Component:** ❌ No (can be server component)

**Props:**
```typescript
interface ProcessSectionProps {
  variant: "corporate" | "replicated";
  distributorName?: string;  // Required for replicated
}
```

**Features:**
- 4-step process with numbered circles
- Timeline connector line between steps
- Icons for each step
- Responsive: horizontal (lg), vertical (sm)
- Framer Motion scroll animations

**Corporate Steps:**
1. Sign Up → Choose your sponsor
2. Get Placed → Automatic matrix placement
3. Build Team → Share your replicated site
4. Earn Income → Grow your organization

**Replicated Steps (personalized):**
1. Learn → Explore this page
2. Sign Up → Click "Join {Name}'s Team"
3. Get Placed → Placed in {Name}'s matrix
4. Start Building → {Name} will guide you

**Optive Source:** Lines 741-884
**Dependencies:** framer-motion, lucide-react
**Backend Connection:** None

---

### 6. TestimonialsSection

**File:** `components/marketing/TestimonialsSection.tsx`
**Client Component:** ✅ Yes (Swiper)

**Props:**
```typescript
interface TestimonialsSectionProps {
  variant: "corporate" | "replicated";
  distributorName?: string;  // For replicated heading
}
```

**Features:**
- Swiper carousel
- Auto-play with pause on hover
- Navigation arrows + pagination dots
- Responsive slides: 1 (mobile), 2 (tablet), 3 (desktop)
- Each testimonial: Photo + name + quote + 5-star rating
- Placeholder testimonials (5 for corporate, 4 for replicated)

**Testimonial Structure:**
```typescript
{
  name: string;
  photo: string | null;  // Null shows initials
  quote: string;
  rating: 1-5;
  title?: string;  // "CEO, Company Name"
}
```

**Optive Source:** Lines 1746-1863
**Dependencies:** swiper, lucide-react (Star icon), Avatar component
**Backend Connection:** None (future: fetch from testimonials table)

---

### 7. FAQSection

**File:** `components/marketing/FAQSection.tsx`
**Client Component:** ✅ Yes (Radix Accordion)

**Props:** None (static content)

**Features:**
- Radix UI Accordion (collapse/expand)
- 8-10 FAQ items
- Plus/minus icons
- Smooth animations
- 2-column layout (lg), 1-column (sm)

**FAQ Questions (Apex-specific):**
1. What is Apex Affinity Group?
2. How does the 5×7 matrix work?
3. What is spillover and how do I benefit?
4. How much does it cost to join?
5. How do I earn income?
6. Do I need to recruit people?
7. What training and support do I get?
8. Can I do this part-time?

**Optive Source:** Lines 1500-1744
**Dependencies:** @radix-ui/react-accordion, lucide-react
**Backend Connection:** None (future: fetch from faq table)

---

### 8. ContactSection

**File:** `components/marketing/ContactSection.tsx`
**Client Component:** ✅ Yes (form submission)

**Props:**
```typescript
interface ContactSectionProps {
  distributorId: string;
  distributorName: string;
  distributorEmail: string;
}
```

**Features:**
- Contact form with react-hook-form + Zod validation
- Server action integration (`submitContactForm`)
- Rate limiting (3 submissions per hour per IP)
- Loading states
- Toast notifications (success, error, rate limit)

**Form Fields:**
- Name (text, required, 2-100 chars)
- Email (email, required, email format)
- Phone (tel, optional, phone format)
- Message (textarea, required, 10-1000 chars)

**Backend Wiring:**
```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactFormSchema } from "@/lib/types/schemas";
import { submitContactForm } from "@/lib/actions/contact";
import { toast } from "sonner";

async function onSubmit(data: ContactFormData) {
  const result = await submitContactForm({
    ...data,
    distributorId,
  });

  if (result.success) {
    toast.success(`Message sent to ${distributorName}!`);
    form.reset();
  } else {
    if (result.error === "rate_limited") {
      toast.error("Please wait before sending another message.");
    } else {
      toast.error("Something went wrong.");
    }
  }
}
```

**Optive Source:** contact.html form section
**Dependencies:** react-hook-form, zod, sonner
**Backend Connection:**
- `submitContactForm` server action
- Saves to `contact_submissions` table
- Sends email via Resend
- Creates notification in `notifications` table
- Logs to `activity_log`
- Rate limit enforced (3/hour per IP)

---

### 9. CTASection

**File:** `components/marketing/CTASection.tsx`
**Client Component:** ❌ No (can be server component)

**Props:**
```typescript
interface CTASectionProps {
  variant: "corporate" | "replicated";
  distributorName?: string;  // Required for replicated
  ctaLink: string;
}
```

**Features:**
- Dark gradient background
- Large heading + subheading
- Prominent CTA button
- Optional background pattern/shapes
- Full-width section

**Corporate Content:**
- Heading: "Ready to Start Building Your Future?"
- Subheading: "Join thousands of entrepreneurs creating financial freedom..."
- CTA: "Join Apex Today" → `/join`

**Replicated Content:**
- Heading: "Ready to Join {Name}'s Team?"
- Subheading: "Take the first step toward financial independence with {Name}..."
- CTA: "Get Started with {Name}" → `/join/[username]`

**Optive Source:** Lines 1440-1499 (approximate)
**Dependencies:** None
**Backend Connection:** None

---

### 10. MarketingFooter

**File:** `components/marketing/MarketingFooter.tsx`
**Client Component:** ❌ No (static links)

**Props:** None

**Features:**
- 4-section layout:
  1. Logo + company description
  2. Quick links (to page sections)
  3. Legal links (Terms, Privacy, Income Disclosure)
  4. Contact info (email, phone, address)
- Social media icons (Facebook, Twitter, LinkedIn, Instagram)
- Copyright bar (dynamic year)
- Responsive: 4 cols (lg), 2 cols (md), 1 col (sm)

**Links:**
- Quick Links: Home, About, Opportunity, How It Works, FAQ, Contact
- Legal: Terms of Service, Privacy Policy, Income Disclosure
- Social: 4 icons (lucide-react)

**Optive Source:** Lines 1975-2106
**Dependencies:** lucide-react
**Backend Connection:** None

---

## 🔌 Backend Connections Summary

| Component | Backend Function | Purpose |
|-----------|-----------------|---------|
| **AboutSection** (replicated) | `getOrganizationSize(distributorId)` | Get total team size |
| **AboutSection** (replicated) | `getDirectEnrolleesCount(distributorId)` | Get direct enrollees count |
| **ContactSection** | `submitContactForm(data)` | Submit contact, save to DB, send email |
| **ContactSection** | Rate limiting (3/hour per IP) | Prevent spam |
| **ContactSection** | Activity logging | Track contact submissions |

**Verified Backend Files:**
- ✅ `lib/actions/contact.ts` - submitContactForm server action
- ✅ `lib/matrix/placement.ts` - getOrganizationSize, getDirectEnrolleesCount
- ✅ `lib/db/queries.ts` - findDistributorByUsername
- ✅ `lib/email/templates.ts` - sendContactNotificationEmail
- ✅ `lib/types/schemas.ts` - contactFormSchema

---

## 🎨 Shared Component Patterns

### Avatar Component

**Used in:** AboutSection, TestimonialsSection

```tsx
interface AvatarProps {
  photoUrl: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
}

function Avatar({ photoUrl, name, size = "md" }: AvatarProps) {
  if (photoUrl) {
    return <img src={photoUrl} alt={name} className={sizeClasses[size]} />;
  }

  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  return (
    <div className={`${sizeClasses[size]} bg-apex-teal text-white flex items-center justify-center font-heading font-semibold`}>
      {initials}
    </div>
  );
}
```

### Button Component

**Used in:** All sections

```tsx
interface ButtonProps {
  variant: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
}

function Button({ variant, size = "md", children, ...props }: ButtonProps) {
  // Implementation with variant styles from OPTIVE-DESIGN-SYSTEM.md
}
```

### Section Title Component

**Used in:** All sections

```tsx
interface SectionTitleProps {
  subtitle?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

function SectionTitle({ subtitle, title, description, align = "center" }: SectionTitleProps) {
  return (
    <div className={align === "center" ? "text-center" : ""}>
      {subtitle && (
        <span className="text-sm font-semibold text-apex-teal uppercase tracking-wider">
          {subtitle}
        </span>
      )}
      <h2 className="text-4xl font-heading font-semibold text-apex-dark mt-4 mb-6">
        {title}
      </h2>
      {description && (
        <p className="text-base text-apex-gray max-w-3xl mx-auto">
          {description}
        </p>
      )}
    </div>
  );
}
```

---

## 📦 Dependencies to Install

```bash
npm install swiper framer-motion
```

**Already Installed:**
- react-hook-form
- @hookform/resolvers
- zod
- sonner
- @radix-ui/react-accordion
- lucide-react

---

## 🎯 Implementation Order (Phase 2-5)

**Phase 2:** Set up architecture
1. Install dependencies
2. Extend Tailwind config with Optive tokens
3. Create all 10 component files (empty shells)

**Phase 3:** Core layout
1. MarketingHeader
2. HeroSection
3. MarketingFooter

**Phase 4:** Content sections
1. AboutSection
2. ServicesSection
3. ProcessSection

**Phase 5:** Interactive sections
1. TestimonialsSection (Swiper)
2. FAQSection (Radix)
3. ContactSection (backend wiring)
4. CTASection

---

**Document Created:** Phase 1 - Redesign
**Date:** 2026-02-15
**Status:** ✅ Ready for Phase 2 (Implementation)
**Next Phase:** Install dependencies + create component shells
