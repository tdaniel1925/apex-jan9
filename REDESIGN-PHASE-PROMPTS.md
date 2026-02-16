# REDESIGN PHASE PROMPTS — Apex Optive Template Integration

**Total Phases:** 8
**Estimated Time:** 12-14 hours
**Approach:** Each phase is self-contained with context carryover

---

## 📋 PHASE OVERVIEW

| Phase | Description | Time | Deliverables |
|-------|-------------|------|--------------|
| **Phase 1** | Analyze Optive Template + Extract Design System | 1.5h | Design tokens doc, section inventory |
| **Phase 2** | Create Component Architecture + Tailwind Config | 1.5h | Component files, Tailwind setup |
| **Phase 3** | Build Header + Hero + Footer | 2h | 3 core components |
| **Phase 4** | Build About + Services + Process | 2.5h | 3 content components |
| **Phase 5** | Build Testimonials + FAQ + Contact + CTA | 2.5h | 4 interactive components |
| **Phase 6** | Wire Backend + Create Dummy Data | 2h | Backend integration, seed data |
| **Phase 7** | Build Corporate + Replicated Pages | 1.5h | Complete page assembly |
| **Phase 8** | Test Atoms + Performance + Deploy | 2h | Verification report, go-live |

---

## 🎯 HOW TO USE THIS DOCUMENT

1. **Start with Phase 1** - Copy the prompt at the bottom of Phase 1 section
2. **Paste into new Claude session** - Give Claude the prompt
3. **Complete the phase** - Let Claude finish all deliverables
4. **Verify deliverables** - Check files were created
5. **Move to next phase** - Copy the prompt from the END of the phase you just completed
6. **Repeat** until Phase 8 complete

**Each prompt includes:**
- ✅ Context from previous phases (what was already done)
- ✅ Current phase instructions (what to do now)
- ✅ Verification checklist (how to confirm it worked)
- ✅ Next phase prompt (copy/paste ready)

---

## 📊 DEPENDENCY MAP COVERAGE

**Feature 1: Corporate Marketing Site** - 34 atoms (Phases 3-7)
**Feature 2: Replicated Distributor Page** - 45 atoms (Phases 5-7)
**Feature 3: Sign-Up Flow UI Polish** - 8 atoms (Phase 5)

**Total Atoms Verified:** 87

---

## ⚠️ IMPORTANT NOTES

**DO NOT CHANGE (Preserve):**
- ❌ Database schema (all 11 tables)
- ❌ Server actions (signup.ts, contact.ts, dashboard.ts, admin.ts)
- ❌ Matrix placement algorithm
- ❌ Email templates (Resend)
- ❌ Admin panel
- ❌ Dashboard
- ❌ RLS policies
- ❌ Auth system
- ❌ Middleware

**ONLY CHANGE (Redesign):**
- ✅ Marketing components (visual layer)
- ✅ Corporate page (/)
- ✅ Replicated page (/[username])
- ✅ Sign-up page UI (/join/[username])
- ✅ Tailwind styles
- ✅ Add dummy data for examples

---

## 🚀 EXECUTION TRACKER

Use this to track your progress:

- [ ] Phase 1: Analyze Optive Template
- [ ] Phase 2: Component Architecture
- [ ] Phase 3: Header + Hero + Footer
- [ ] Phase 4: About + Services + Process
- [ ] Phase 5: Testimonials + FAQ + Contact + CTA
- [ ] Phase 6: Backend Wiring + Dummy Data
- [ ] Phase 7: Page Assembly
- [ ] Phase 8: Testing + Deploy

**Current Phase:** ___________
**Date Started:** ___________
**Estimated Completion:** ___________

---

# 📍 PHASE 1: ANALYZE OPTIVE TEMPLATE + EXTRACT DESIGN SYSTEM

## Phase 1 Objectives

1. Read and analyze Optive `index.html` template
2. Extract all sections and their structure
3. Map Optive design tokens to Tailwind equivalents
4. Create design system document
5. Inventory all components needed

## Phase 1 Deliverables

- `OPTIVE-DESIGN-SYSTEM.md` - Complete design token mapping
- `OPTIVE-SECTION-INVENTORY.md` - All 13 sections documented
- `COMPONENT-ARCHITECTURE.md` - Component tree structure

## Estimated Time: 1.5 hours

---

## 🎯 CONTEXT FOR PHASE 1

**Project:** Apex Affinity Group Platform v1.0.0
**Current Status:** Backend complete, frontend is placeholder
**Goal:** Redesign marketing pages to match Optive template

**What Exists:**
- ✅ All 7 build stages complete (database, auth, dashboard, admin)
- ✅ Backend fully functional (matrix placement, emails, analytics)
- ✅ Deployed to GitHub: https://github.com/tdaniel1925/apex-jan9
- ✅ Production environment variables configured
- ✅ Dummy root distributor + admin created

**What Needs Work:**
- ❌ Corporate page (/) - Currently basic placeholder
- ❌ Replicated page (/[username]) - Too simple
- ❌ Sign-up page UI - Functional but needs polish

**Source Material:**
- Optive Template: `themeforest-UcfPE2SH-optive-business-consulting-html-template/html/index.html`
- Dependency Map: `SPEC-DEPENDENCY-MAP.md` (Features 1, 2, 3)

---

## 📋 PHASE 1 TASKS

### Task 1.1: Read Optive Template

**File to analyze:**
```
C:\dev\1 - Apex Rep Site\themeforest-UcfPE2SH-optive-business-consulting-html-template\html\index.html
```

**Extract:**
1. All major sections (identify with HTML comments like `<!-- Hero Section Start -->`)
2. HTML structure for each section
3. CSS classes used (Bootstrap + custom)
4. JavaScript interactions (carousels, accordions, animations)
5. Responsive breakpoints

**Create:**
```
File: OPTIVE-SECTION-INVENTORY.md

Content structure:
# Optive Section Inventory

## 1. Header
- Line numbers: X-Y
- Structure: nav > container > logo + menu + CTA
- Features: Sticky, hamburger menu, dropdown submenus
- CSS classes: main-header, navbar, navbar-brand, etc.

## 2. Hero Section
- Line numbers: X-Y
- Structure: ...
- Features: Video background, gradient overlay, animated text
- CSS classes: ...

[Continue for all 13 sections]
```

### Task 1.2: Extract Design Tokens

**Analyze Optive CSS:**
```
Files to read:
C:\dev\1 - Apex Rep Site\themeforest-UcfPE2SH-optive-business-consulting-html-template\html\css\custom.css
```

**Extract:**
1. **Colors:**
   - Primary color (hex)
   - Secondary color
   - Background colors (light/dark sections)
   - Text colors
   - Accent colors

2. **Typography:**
   - Font families (already known: Mona Sans, Public Sans)
   - Font sizes (h1-h6, body, small)
   - Font weights
   - Line heights

3. **Spacing:**
   - Section padding (top/bottom)
   - Container max-width
   - Grid gaps
   - Card padding

4. **Effects:**
   - Border radius values
   - Box shadows
   - Gradients
   - Transitions

**Create:**
```
File: OPTIVE-DESIGN-SYSTEM.md

Content structure:
# Optive Design System → Tailwind Mapping

## Colors
| Optive | Hex | Tailwind | Usage |
|--------|-----|----------|-------|
| Primary | #667eea | purple-500 | Buttons, links, accents |
| Secondary | #764ba2 | purple-700 | Gradients, dark sections |
| Background Light | #f9fafb | gray-50 | Light sections |
| Background Dark | #1a1a2e | gray-900 | Dark sections |

## Typography
| Element | Optive | Tailwind |
|---------|--------|----------|
| H1 | 48px/56px, 700 | text-5xl font-bold |
| H2 | 36px/44px, 700 | text-4xl font-bold |
| Body | 16px/24px, 400 | text-base |

## Spacing
| Element | Optive | Tailwind |
|---------|--------|----------|
| Section Padding | 80px 0 | py-20 |
| Container | 1200px | max-w-7xl |

[Continue for all tokens]
```

### Task 1.3: Map Optive Sections to React Components

**Create component architecture:**
```
File: COMPONENT-ARCHITECTURE.md

Content:
# Component Architecture

## Page Structure

### Corporate Page (/)
- MarketingLayout
  - MarketingHeader (variant="corporate")
  - HeroSection (variant="corporate")
  - CompanySlider (optional - trusted brands)
  - AboutSection (variant="corporate")
  - ServicesSection
  - WhyChooseSection
  - ProcessSection (variant="corporate")
  - TestimonialsSection (variant="corporate")
  - FAQSection
  - CTASection (variant="corporate")
  - MarketingFooter

### Replicated Page (/[username])
- MarketingLayout
  - MarketingHeader (variant="replicated", props: distributorName, username)
  - HeroSection (variant="replicated", props: distributor data)
  - AboutSection (variant="replicated", props: distributor, teamStats)
  - ServicesSection (same as corporate)
  - ProcessSection (variant="replicated", props: distributorName)
  - TestimonialsSection (variant="replicated", props: distributorName)
  - ContactSection (props: distributorId, distributorName, distributorEmail)
  - CTASection (variant="replicated", props: distributorName, username)
  - MarketingFooter

## Component Specifications

### MarketingHeader
**Props:**
- variant: "corporate" | "replicated"
- distributorName?: string
- username?: string
- ctaLink: string

**Features:**
- Sticky on scroll
- Mobile hamburger menu
- Smooth scroll to sections
- CTA button (context-aware)

**Optive Mapping:**
- Source: Lines 48-105 in index.html
- Classes: main-header, header-sticky, navbar

---

[Continue for each component with:]
- Props definition
- Features list
- Optive source reference
- Tailwind class mapping
- Backend connections (if any)
```

### Task 1.4: Identify Optive Dependencies

**Check what libraries Optive uses:**
```
File to read:
C:\dev\1 - Apex Rep Site\themeforest-UcfPE2SH-optive-business-consulting-html-template\html\index.html
(Look at <script> tags at bottom)
```

**Document:**
```
# Optive Dependencies vs. Apex Current

| Optive Library | Purpose | Apex Equivalent | Action |
|----------------|---------|-----------------|--------|
| Swiper.js | Carousels | None | Install: npm i swiper |
| WOW.js | Scroll animations | None | Replace with Framer Motion |
| Magnific Popup | Lightbox | None | Use Radix Dialog |
| jQuery | DOM manipulation | React | No jQuery needed |
| Bootstrap Grid | Layout | Tailwind | Use Tailwind grid |

**Installations needed:**
- swiper (for testimonials carousel)
- framer-motion (for animations)
```

---

## ✅ PHASE 1 VERIFICATION CHECKLIST

Before moving to Phase 2, verify:

- [ ] `OPTIVE-SECTION-INVENTORY.md` created with all 13 sections documented
- [ ] `OPTIVE-DESIGN-SYSTEM.md` created with color, typography, spacing tokens
- [ ] `COMPONENT-ARCHITECTURE.md` created with full component tree
- [ ] Design tokens mapped to Tailwind equivalents
- [ ] Dependencies identified (Swiper, Framer Motion)
- [ ] Optive HTML structure understood for each section

**Files Created:**
1. `OPTIVE-SECTION-INVENTORY.md`
2. `OPTIVE-DESIGN-SYSTEM.md`
3. `COMPONENT-ARCHITECTURE.md`

---

## 🎯 WHAT COMES NEXT (Phase 2)

**Phase 2 will:**
- Install necessary dependencies (Swiper, Framer Motion)
- Configure Tailwind with Optive design tokens
- Create component file structure
- Set up base component templates

**Prerequisites from Phase 1:**
- Design system document (color, typography, spacing)
- Component architecture document
- Section inventory

---

## 📝 COPY THIS PROMPT FOR PHASE 1

```
PHASE 1: ANALYZE OPTIVE TEMPLATE + EXTRACT DESIGN SYSTEM

PROJECT CONTEXT:
- Apex Affinity Group Platform v1.0.0
- Backend complete (database, auth, matrix, emails, dashboard, admin)
- Need to redesign marketing pages to match Optive template
- Working directory: C:\dev\1 - Apex Rep Site
- Optive template location: themeforest-UcfPE2SH-optive-business-consulting-html-template/html/

PHASE 1 OBJECTIVES:
1. Analyze Optive index.html template (2,141 lines)
2. Extract all 13 sections and document structure
3. Map design tokens (colors, typography, spacing) to Tailwind
4. Create component architecture document
5. Identify dependencies needed

DELIVERABLES:
1. OPTIVE-SECTION-INVENTORY.md - Document all 13 sections with:
   - Line numbers in source
   - HTML structure
   - Features (animations, interactions)
   - CSS classes used

2. OPTIVE-DESIGN-SYSTEM.md - Map design tokens:
   - Colors (primary, secondary, backgrounds) → Tailwind classes
   - Typography (font sizes, weights, line heights) → Tailwind classes
   - Spacing (section padding, container widths) → Tailwind classes
   - Effects (shadows, gradients, borders) → Tailwind classes

3. COMPONENT-ARCHITECTURE.md - Component tree:
   - Corporate page component structure
   - Replicated page component structure
   - Component specifications (props, features, Optive source mapping)

TASKS:
1. Read: themeforest-UcfPE2SH-optive-business-consulting-html-template/html/index.html
2. Read: themeforest-UcfPE2SH-optive-business-consulting-html-template/html/css/custom.css
3. Extract all sections (<!-- Section Name Start --> comments)
4. Map Optive design to Tailwind equivalents
5. Create component architecture based on Optive sections
6. Identify JavaScript libraries used (Swiper, WOW.js, etc.)

CONSTRAINTS:
- Focus on ANALYSIS only, don't write code yet
- Document everything for Phase 2 implementation
- Map to Tailwind v3 classes (already in project)
- Consider mobile-first responsive approach

VERIFICATION:
- All 3 documents created
- Design tokens complete and mapped
- Component architecture clearly defined
- Ready for Phase 2 (implementation)

START with reading index.html and documenting all sections. Then extract design tokens from custom.css. Finally, create component architecture based on findings.
```

---

# 📍 PHASE 2: COMPONENT ARCHITECTURE + TAILWIND SETUP

## Phase 2 Objectives

1. Install required dependencies (Swiper, Framer Motion)
2. Configure Tailwind with Optive design tokens
3. Create component file structure
4. Build base component templates (empty shells)
5. Set up layout components

## Phase 2 Deliverables

- `package.json` updated with dependencies
- `tailwind.config.ts` extended with Optive tokens
- Component files created (10 components)
- `MarketingLayout.tsx` wrapper component

## Estimated Time: 1.5 hours

---

## 🎯 COPY THIS PROMPT FOR PHASE 2

```
PHASE 2: COMPONENT ARCHITECTURE + TAILWIND SETUP

CONTEXT FROM PHASE 1:
- ✅ Analyzed Optive template (13 sections identified)
- ✅ Created OPTIVE-DESIGN-SYSTEM.md (colors, typography, spacing)
- ✅ Created COMPONENT-ARCHITECTURE.md (component tree)
- ✅ Created OPTIVE-SECTION-INVENTORY.md (section details)

PROJECT INFO:
- Working directory: C:\dev\1 - Apex Rep Site
- Current stack: Next.js 15, Tailwind CSS, TypeScript
- Existing components: Dashboard, Admin (don't touch)
- Target: Marketing pages only (/, /[username])

PHASE 2 OBJECTIVES:
1. Install dependencies (Swiper for carousels, Framer Motion for animations)
2. Extend Tailwind config with Optive design tokens
3. Create component file structure
4. Build component templates (shells with TypeScript interfaces)
5. Create layout wrapper

TASKS:

Task 2.1: Install Dependencies
```bash
npm install swiper framer-motion
```

Task 2.2: Extend Tailwind Config
File: tailwind.config.ts

Add to theme.extend:
- Optive colors (from OPTIVE-DESIGN-SYSTEM.md)
- Custom shadows
- Custom gradients
- Animation keyframes

Task 2.3: Create Component Files
Create these files in components/marketing/:

1. MarketingHeader.tsx
2. HeroSection.tsx
3. AboutSection.tsx
4. ServicesSection.tsx
5. ProcessSection.tsx
6. TestimonialsSection.tsx
7. FAQSection.tsx
8. ContactSection.tsx
9. CTASection.tsx
10. MarketingFooter.tsx

Each file should have:
- TypeScript interface for props
- Component shell with placeholder content
- Proper imports
- Comment header with Optive source reference

Task 2.4: Create Layout Component
File: components/marketing/MarketingLayout.tsx

Wrapper that includes:
- Metadata handling
- Common layout structure
- Children rendering

DELIVERABLES:
1. package.json - Updated with swiper + framer-motion
2. tailwind.config.ts - Extended with Optive tokens
3. 10 component files - Empty shells with TypeScript
4. MarketingLayout.tsx - Layout wrapper

VERIFICATION:
- Dependencies installed (check package.json)
- Tailwind config extended (check tailwind.config.ts)
- All 10 component files exist in components/marketing/
- Each component has TypeScript interface
- MarketingLayout.tsx created
- No build errors (npm run build should pass)

REFERENCE DOCUMENTS:
- Read OPTIVE-DESIGN-SYSTEM.md for color/spacing values
- Read COMPONENT-ARCHITECTURE.md for component specs
- Use existing components/dashboard/ as TypeScript reference

START by installing dependencies, then extend Tailwind config, then create all component files.
```

---

# 📍 PHASE 3: BUILD HEADER + HERO + FOOTER

## Phase 3 Objectives

1. Build MarketingHeader component (corporate + replicated variants)
2. Build HeroSection component (video background support)
3. Build MarketingFooter component
4. Wire up smooth scrolling and sticky header
5. Test responsive layouts

## Phase 3 Deliverables

- Completed `MarketingHeader.tsx`
- Completed `HeroSection.tsx`
- Completed `MarketingFooter.tsx`
- All components responsive (375px+)

## Estimated Time: 2 hours

---

## 🎯 COPY THIS PROMPT FOR PHASE 3

```
PHASE 3: BUILD HEADER + HERO + FOOTER COMPONENTS

CONTEXT FROM PREVIOUS PHASES:
- ✅ Phase 1: Analyzed Optive, created design docs
- ✅ Phase 2: Set up Tailwind config, created component shells

PROJECT INFO:
- Working directory: C:\dev\1 - Apex Rep Site
- Components location: components/marketing/
- Optive source: themeforest-UcfPE2SH-optive-business-consulting-html-template/html/index.html

PHASE 3 OBJECTIVES:
Build the 3 core layout components that appear on every page:
1. MarketingHeader (sticky navigation)
2. HeroSection (video background, CTAs)
3. MarketingFooter (links, copyright)

TASKS:

Task 3.1: Build MarketingHeader
File: components/marketing/MarketingHeader.tsx

Features:
- Sticky on scroll (add shadow when scrolled)
- Logo (left side)
- Navigation menu (center) - links to page sections
- CTA button (right side) - context-aware
- Mobile hamburger menu (< 768px)
- Smooth scroll to sections
- Two variants: "corporate" | "replicated"

Optive source: Lines 48-105 in index.html
Design reference: OPTIVE-DESIGN-SYSTEM.md

Props interface:
```typescript
interface MarketingHeaderProps {
  variant: "corporate" | "replicated";
  distributorName?: string;
  ctaLink: string;
}
```

Corporate variant:
- Logo links to /
- Nav: Home, About, Opportunity, How It Works, FAQ, Contact
- CTA: "Join Now" → /join

Replicated variant:
- Logo links to / (corporate)
- Distributor name shown
- Nav: About [Name], Opportunity, How to Join, FAQ, Contact [Name]
- CTA: "Join [Name]'s Team" → /join/[username]

Task 3.2: Build HeroSection
File: components/marketing/HeroSection.tsx

Features:
- Full viewport height (min-h-screen)
- Background options: video OR static image
- Gradient overlay
- Heading (animated entrance)
- Subheading
- CTA button
- Optional: sidebar info box (Optive "Smart Advisory" box)

Optive source: Lines 107-173 in index.html

Props interface:
```typescript
interface HeroSectionProps {
  variant: "corporate" | "replicated";
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  backgroundVideo?: string;
  backgroundImage?: string;
  distributorPhoto?: string | null;
  distributorName?: string;
}
```

Corporate variant:
- Generic title: "Build Your Financial Future with Apex"
- Video background (optional)
- CTA: "Get Started" → /join

Replicated variant:
- Personalized title: "Join [Name]'s Team at Apex"
- Distributor photo (large, circular)
- Personalized subtitle
- CTA: "Join [Name]'s Team" → /join/[username]

Task 3.3: Build MarketingFooter
File: components/marketing/MarketingFooter.tsx

Features:
- 4-column grid (collapse to 1 on mobile)
- Column 1: Company info (logo, tagline, social icons)
- Column 2: Quick links (page sections)
- Column 3: Legal links (Terms, Privacy, Income Disclosure)
- Column 4: Contact info
- Bottom bar: Copyright (dynamic year)

Optive source: Lines 2000+ in index.html (footer section)

No props needed (static content)

Use lucide-react for social icons:
- Facebook, Twitter, LinkedIn, Instagram

IMPLEMENTATION NOTES:

Smooth Scrolling:
```typescript
const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};
```

Sticky Header Detection:
```typescript
const [isScrolled, setIsScrolled] = useState(false);

useEffect(() => {
  const handleScroll = () => {
    setIsScrolled(window.scrollY > 50);
  };
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

Mobile Menu:
```typescript
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
```

DELIVERABLES:
1. MarketingHeader.tsx - Fully functional with both variants
2. HeroSection.tsx - Fully functional with video/image support
3. MarketingFooter.tsx - Fully functional, responsive

VERIFICATION:
- Header sticks on scroll
- Mobile menu works (hamburger icon, slide-in menu)
- Hero section displays correctly (corporate + replicated)
- Footer displays all sections
- All components responsive (test 375px, 768px, 1024px)
- No TypeScript errors
- Components use Tailwind classes from config

REFERENCE:
- Optive source: index.html
- Design tokens: OPTIVE-DESIGN-SYSTEM.md
- Component specs: COMPONENT-ARCHITECTURE.md

START with MarketingHeader, then HeroSection, then MarketingFooter. Test each component's responsive behavior.
```

---

# 📍 PHASE 4: BUILD ABOUT + SERVICES + PROCESS

## Phase 4 Objectives

1. Build AboutSection (corporate + replicated variants)
2. Build ServicesSection (6 benefit cards)
3. Build ProcessSection (4-step process)
4. Add animations (Framer Motion)
5. Test with dummy data

## Estimated Time: 2.5 hours

---

## 🎯 COPY THIS PROMPT FOR PHASE 4

```
PHASE 4: BUILD ABOUT + SERVICES + PROCESS COMPONENTS

CONTEXT FROM PREVIOUS PHASES:
- ✅ Phase 1: Design system created
- ✅ Phase 2: Tailwind config + component shells
- ✅ Phase 3: Header + Hero + Footer complete

CURRENT STATE:
- Header, Hero, Footer components working
- Can now build content sections
- Need to add scroll animations

PHASE 4 OBJECTIVES:
Build 3 major content sections:
1. AboutSection - Company/distributor overview
2. ServicesSection - 6 benefit cards
3. ProcessSection - 4-step how-it-works

TASKS:

Task 4.1: Build AboutSection
File: components/marketing/AboutSection.tsx

Corporate variant:
- Heading: "About Apex Affinity Group"
- Company overview text
- Stats grid (3-4 animated counters):
  * Years in business
  * Active distributors
  * Countries/states
  * Success stories
- Company image/photo

Replicated variant:
- Heading: "About [FirstName]"
- Large distributor photo (circular, prominent)
- Distributor bio (from database)
- Team stats (from backend):
  * Total team size
  * Direct enrollees
  * Joined date
  * Current rank (future)

Props interface:
```typescript
interface AboutSectionProps {
  variant: "corporate" | "replicated";
  // Corporate props
  stats?: {
    yearsInBusiness: number;
    activeDistributors: number;
    countries: number;
  };
  // Replicated props
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

Optive source: Lines 243-326 in index.html
Use Framer Motion for stat counter animation

Task 4.2: Build ServicesSection
File: components/marketing/ServicesSection.tsx

Features:
- Grid of 6 benefit cards
- Icon + heading + description
- Hover effect (lift + shadow)
- Same for corporate + replicated

Content (Apex Benefits):
1. 5×7 Forced Matrix
   - Icon: Grid
   - "Guaranteed placement in our proven matrix system"

2. Spillover Benefits
   - Icon: TrendingUp
   - "Benefit from your upline's recruiting efforts"

3. Replicated Website
   - Icon: Globe
   - "Professional marketing page with your personal URL"

4. Training & Support
   - Icon: GraduationCap
   - "Comprehensive training and ongoing mentorship"

5. Residual Income
   - Icon: DollarSign
   - "Build long-term wealth with passive income"

6. Community
   - Icon: Users
   - "Join a network of successful entrepreneurs"

Props: None needed (static content)

Optive source: Lines 327-483 in index.html
Design: 3-column grid (desktop), 2-col (tablet), 1-col (mobile)

Task 4.3: Build ProcessSection
File: components/marketing/ProcessSection.tsx

Corporate variant - "How Apex Works":
1. Sign Up → Choose your sponsor
2. Get Placed → Automatic matrix placement
3. Build Team → Share your replicated site
4. Earn Income → Grow your organization

Replicated variant - "How to Join [Name]":
1. Learn → Explore this page and opportunity
2. Sign Up → Click "Join [Name]'s Team" button
3. Get Placed → You'll be placed in [Name]'s matrix
4. Start Building → [Name] will guide you to success

Props interface:
```typescript
interface ProcessSectionProps {
  variant: "corporate" | "replicated";
  distributorName?: string;
}
```

Features:
- 4-step process
- Numbered circles
- Timeline connector line
- Icons for each step
- Responsive: horizontal (desktop), vertical (mobile)

Optive source: Lines 741-861 in index.html

ANIMATION SETUP:

Use Framer Motion for scroll animations:

```typescript
import { motion } from "framer-motion";
import { useInView } from "framer-motion";

const ref = useRef(null);
const isInView = useInView(ref, { once: true, margin: "-100px" });

<motion.div
  ref={ref}
  initial={{ opacity: 0, y: 50 }}
  animate={isInView ? { opacity: 1, y: 0 } : {}}
  transition={{ duration: 0.5 }}
>
  {/* Content */}
</motion.div>
```

Stat Counter Animation:

```typescript
const [count, setCount] = useState(0);

useEffect(() => {
  if (isInView) {
    let start = 0;
    const end = targetValue;
    const duration = 2000;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }
}, [isInView, targetValue]);
```

DELIVERABLES:
1. AboutSection.tsx - Corporate + replicated variants, animated stats
2. ServicesSection.tsx - 6 benefit cards, responsive grid, hover effects
3. ProcessSection.tsx - 4-step process, responsive layout

VERIFICATION:
- AboutSection displays correctly for both variants
- Stats animate when scrolled into view
- ServicesSection shows 6 cards in responsive grid
- Card hover effects work
- ProcessSection shows 4 steps with connector line
- Personalization works (distributorName appears correctly)
- All components responsive (375px, 768px, 1024px)
- Animations smooth (Framer Motion)

REFERENCE:
- Optive: index.html (lines specified above)
- Design: OPTIVE-DESIGN-SYSTEM.md
- Icons: lucide-react

START with AboutSection (most complex), then ServicesSection, then ProcessSection.
```

---

# 📍 PHASE 5: BUILD TESTIMONIALS + FAQ + CONTACT + CTA

## Phase 5 Objectives

1. Build TestimonialsSection (Swiper carousel)
2. Build FAQSection (Radix Accordion)
3. Build ContactSection (form with backend wiring)
4. Build CTASection (final conversion push)
5. Polish SignUpForm UI

## Estimated Time: 2.5 hours

---

## 🎯 COPY THIS PROMPT FOR PHASE 5

```
PHASE 5: BUILD TESTIMONIALS + FAQ + CONTACT + CTA

CONTEXT FROM PREVIOUS PHASES:
- ✅ Phases 1-2: Design system + architecture
- ✅ Phase 3: Header + Hero + Footer
- ✅ Phase 4: About + Services + Process

CURRENT STATE:
- 7/10 components complete
- Need final 4 interactive components
- Contact form needs backend wiring

PHASE 5 OBJECTIVES:
Build final 4 components + polish sign-up form:
1. TestimonialsSection (carousel)
2. FAQSection (accordion)
3. ContactSection (form with server action)
4. CTASection (conversion-focused)
5. Polish SignUpForm UI (Optive styling)

TASKS:

Task 5.1: Build TestimonialsSection
File: components/marketing/TestimonialsSection.tsx

Features:
- Swiper carousel
- Auto-play with pause on hover
- Navigation arrows
- Pagination dots
- Responsive (1 slide mobile, 2 tablet, 3 desktop)

Corporate variant:
- Heading: "What Our Members Say"
- 5 placeholder testimonials

Replicated variant:
- Heading: "What [Name]'s Team Says"
- 4 placeholder testimonials

Testimonial card:
- Photo (circular)
- Name
- Quote
- 5-star rating

Props interface:
```typescript
interface TestimonialsSectionProps {
  variant: "corporate" | "replicated";
  distributorName?: string;
}
```

Placeholder testimonials:
```typescript
const testimonials = [
  {
    name: "Sarah Johnson",
    photo: null, // Will show initials
    quote: "Joining Apex was the best decision I ever made. The support and training are incredible!",
    rating: 5,
  },
  // ... 4 more
];
```

Swiper setup:
```typescript
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

<Swiper
  modules={[Navigation, Pagination, Autoplay]}
  spaceBetween={30}
  slidesPerView={1}
  navigation
  pagination={{ clickable: true }}
  autoplay={{ delay: 5000, pauseOnMouseEnter: true }}
  breakpoints={{
    768: { slidesPerView: 2 },
    1024: { slidesPerView: 3 },
  }}
>
```

Optive source: Lines 1865+ in index.html

Task 5.2: Build FAQSection
File: components/marketing/FAQSection.tsx

Features:
- Radix Accordion component
- 8-10 common questions
- Smooth expand/collapse
- Plus/minus icons
- 2-column layout (desktop), 1-column (mobile)

Props: None (static content)

FAQ questions:
1. What is Apex Affinity Group?
2. How does the 5×7 matrix work?
3. What is spillover and how do I benefit?
4. How much does it cost to join?
5. How do I earn income?
6. Do I need to recruit people?
7. What training and support do I get?
8. Can I do this part-time?

Radix Accordion setup:
```typescript
import * as Accordion from '@radix-ui/react-accordion';
import { Plus, Minus } from 'lucide-react';

<Accordion.Root type="single" collapsible>
  <Accordion.Item value="item-1">
    <Accordion.Header>
      <Accordion.Trigger>
        Question text
        <Plus className="accordion-icon-plus" />
        <Minus className="accordion-icon-minus" />
      </Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Content>
      Answer text
    </Accordion.Content>
  </Accordion.Item>
</Accordion.Root>
```

Optive source: Lines 1500-1864 in index.html

Task 5.3: Build ContactSection
File: components/marketing/ContactSection.tsx

**IMPORTANT: This component connects to backend!**

Features:
- Contact form with validation
- Server action integration
- Rate limiting (3/hour per IP)
- Loading states
- Toast notifications

Props interface:
```typescript
interface ContactSectionProps {
  distributorId: string;
  distributorName: string;
  distributorEmail: string;
}
```

Form fields:
- Name (text, required, 2-100 chars)
- Email (email, required)
- Phone (tel, optional)
- Message (textarea, required, 10-1000 chars)

Backend wiring:
```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactFormSchema } from "@/lib/types/schemas";
import { submitContactForm } from "@/lib/actions/contact";
import { toast } from "sonner";
import { useState } from "react";

export function ContactSection({ distributorId, distributorName, distributorEmail }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  async function onSubmit(data: any) {
    setIsSubmitting(true);

    const result = await submitContactForm({
      ...data,
      distributorId,
    });

    setIsSubmitting(false);

    if (result.success) {
      toast.success(`Message sent to ${distributorName}!`);
      form.reset();
    } else {
      if (result.error === "rate_limited") {
        toast.error("Please wait before sending another message.");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <section id="contact" className="py-20">
      <div className="container max-w-4xl">
        <h2>Contact {distributorName}</h2>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Form fields with Optive styling */}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>
    </section>
  );
}
```

**Backend connection verified:**
- ✅ submitContactForm exists in lib/actions/contact.ts
- ✅ contactFormSchema exists in lib/types/schemas.ts
- ✅ Rate limiting implemented (3/hour per IP)
- ✅ Email notification via Resend
- ✅ Saves to contact_submissions table

Optive source: contact.html form section

Task 5.4: Build CTASection
File: components/marketing/CTASection.tsx

Features:
- Dark background (gradient)
- Large heading
- Subheading
- Prominent CTA button
- Optional: secondary CTA

Corporate variant:
- Heading: "Ready to Start Building Your Future?"
- Subheading: "Join thousands of entrepreneurs creating financial freedom with Apex"
- CTA: "Join Apex Today" → /join

Replicated variant:
- Heading: "Ready to Join [Name]'s Team?"
- Subheading: "Take the first step toward financial independence with [Name] as your sponsor"
- CTA: "Get Started with [Name]" → /join/[username]

Props interface:
```typescript
interface CTASectionProps {
  variant: "corporate" | "replicated";
  distributorName?: string;
  ctaLink: string;
}
```

Design:
- Full-width section
- Dark gradient background (purple to darker purple)
- Centered content
- Large button with arrow icon
- Optional: background pattern or shapes

Optive source: Lines 1440-1499 in index.html

Task 5.5: Polish SignUpForm UI
File: components/signup/SignUpForm.tsx

**Don't change functionality, only apply Optive styling!**

Changes:
- Apply Optive input styles (from design system)
- Style username suggestions list
- Style submit button (gradient, larger)
- Better spacing and typography
- Keep all existing validation, backend logic

Focus on:
- Input borders (focus states)
- Label typography
- Error message styling
- Button styling (use Optive gradient)
- Responsive layout

DELIVERABLES:
1. TestimonialsSection.tsx - Swiper carousel, responsive
2. FAQSection.tsx - Radix accordion, expandable
3. ContactSection.tsx - Form with backend wired, working
4. CTASection.tsx - Conversion-focused, dark theme
5. SignUpForm.tsx - Optive styling applied (functionality preserved)

VERIFICATION:
- Testimonials carousel works (auto-play, navigation)
- FAQ accordion expands/collapses smoothly
- Contact form submits successfully
- Toast notifications show (success/error/rate limit)
- Contact saved in database (check Supabase)
- Email sent to distributor (check Resend)
- CTA section displays correctly
- Sign-up form looks polished (Optive design)
- All components responsive

BACKEND VERIFICATION (ContactSection):
- Test submit → check database for new contact_submissions row
- Test rate limit → submit 4 times quickly, 4th should fail
- Test email → check distributor's inbox for notification
- Test analytics → check signup_analytics for page_view event

REFERENCE:
- Optive: index.html + contact.html
- Existing server action: lib/actions/contact.ts
- Existing schema: lib/types/schemas.ts

START with TestimonialsSection, then FAQSection, then ContactSection (most critical), then CTASection, then polish SignUpForm.
```

---

# 📍 PHASE 6: BACKEND WIRING + DUMMY DATA

## Phase 6 Objectives

1. Create dummy distributor data (3 examples)
2. Wire AboutSection to backend (team stats)
3. Test replicated page with real data
4. Verify all backend connections work
5. Create seed script for dummy data

## Estimated Time: 2 hours

---

## 🎯 COPY THIS PROMPT FOR PHASE 6

```
PHASE 6: BACKEND WIRING + DUMMY DISTRIBUTOR DATA

CONTEXT FROM PREVIOUS PHASES:
- ✅ Phases 1-5: All 10 components built
- ✅ Contact form backend wired (Phase 5)
- ✅ Components ready for data integration

CURRENT STATE:
- All components exist and render
- Need to wire AboutSection to database
- Need dummy distributor examples
- Need to test full data flow

PHASE 6 OBJECTIVES:
1. Create 3 dummy distributors with realistic data
2. Wire AboutSection to fetch team stats
3. Test replicated pages with dummy data
4. Verify all backend connections
5. Create seed script for reproducibility

TASKS:

Task 6.1: Create Dummy Distributor Seed Script
File: lib/db/seed-dummy-distributors.ts

Create 3 realistic distributor examples:

**Distributor 1: John Smith (Successful, 2 years)**
```typescript
{
  username: "john.smith",
  firstName: "John",
  lastName: "Smith",
  email: "john.smith@example.com",
  phone: "+1 (555) 123-4567",
  bio: "I've been building my Apex business for 2 years and absolutely love helping others achieve financial freedom. My team is like family, and I'm committed to your success from day one. Let's build something amazing together!",
  photoUrl: null, // Will show initials
  status: "active",
  // Create matrix position
  // Add 47 team members in matrix under John
  // Add 12 direct enrollees
}
```

**Distributor 2: Sarah Johnson (Newer, 6 months)**
```typescript
{
  username: "sarah.johnson",
  firstName: "Sarah",
  lastName: "Johnson",
  email: "sarah.j@example.com",
  phone: "+1 (555) 234-5678",
  bio: "Former teacher turned entrepreneur. I joined Apex 6 months ago and haven't looked back. If you're ready for a positive change and financial growth, let's talk!",
  // Create 12 team members under Sarah
  // 5 direct enrollees
}
```

**Distributor 3: Mike Davis (Top Producer, 5 years)**
```typescript
{
  username: "mike.davis",
  firstName: "Mike",
  lastName: "Davis",
  email: "mike.d@example.com",
  bio: "5-year Apex veteran and top producer. I've helped over 200 people start their journey to financial independence. My proven system works - let me show you how.",
  // Create 203 team members (multi-level matrix)
  // 28 direct enrollees
}
```

Also create:
- 4 dummy contact submissions for each distributor
- Placeholder testimonials for their pages

Full script structure:
```typescript
import { db } from "./client";
import { distributors, matrixPositions, contactSubmissions } from "./schema";
import { placeDistributorInMatrix, createRootPosition } from "@/lib/matrix";
import { createClient } from "@supabase/supabase-js";

async function seedDummyDistributors() {
  // 1. Create John Smith + auth user + matrix position
  // 2. Create 47 team members under John (using placement algorithm)
  // 3. Create Sarah Johnson + team
  // 4. Create Mike Davis + team
  // 5. Create contact submissions

  console.log("✅ Created 3 dummy distributors");
  console.log("   - john.smith (47 team members)");
  console.log("   - sarah.johnson (12 team members)");
  console.log("   - mike.davis (203 team members)");
}

seedDummyDistributors();
```

Run script:
```bash
tsx lib/db/seed-dummy-distributors.ts
```

Task 6.2: Wire AboutSection to Backend
File: components/marketing/AboutSection.tsx

Update replicated variant to fetch real data:

Parent page must pass:
```typescript
// In app/(public)/[username]/page.tsx

import { getOrganizationSize, getDirectEnrolleesCount } from "@/lib/matrix";

const teamSize = await getOrganizationSize(distributor.id);
const directCount = await getDirectEnrolleesCount(distributor.id);

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
```

AboutSection displays:
- Distributor photo (or initials if null)
- Full bio (or default text if null)
- Team stats with animated counters:
  * "47 Team Members" (from backend)
  * "12 Direct Enrollees" (from backend)
  * "2 Years with Apex" (calculate from createdAt)

Backend functions verified:
- ✅ getOrganizationSize(distributorId) exists in lib/matrix/placement.ts
- ✅ getDirectEnrolleesCount(distributorId) exists in lib/matrix/placement.ts

Task 6.3: Verify All Backend Connections

**Checklist:**

ContactSection:
- [ ] Form submits to submitContactForm server action
- [ ] Contact saved in contact_submissions table
- [ ] Email sent via Resend to distributor
- [ ] Notification created in notifications table
- [ ] Activity logged in activity_log
- [ ] Rate limiting works (3/hour)
- [ ] Toast shows success/error/rate limit messages

AboutSection (Replicated):
- [ ] Team stats fetch from database
- [ ] Stats display correctly (47, 12, 2 years)
- [ ] Stats animate on scroll
- [ ] Bio displays from database
- [ ] Photo displays (or initials if null)

HeroSection (Replicated):
- [ ] Distributor name appears in title
- [ ] Distributor photo displays
- [ ] CTA links to /join/[username]

ContactSection Analytics:
- [ ] Page view tracked on replicated page load
- [ ] Contact submission tracked in signup_analytics

BACKEND FILES (DO NOT MODIFY):
- ✅ lib/actions/contact.ts (submitContactForm)
- ✅ lib/matrix/placement.ts (getOrganizationSize, getDirectEnrolleesCount)
- ✅ lib/db/queries.ts (findDistributorByUsername)
- ✅ lib/email/templates.ts (sendContactNotificationEmail)

Task 6.4: Test Dummy Distributor Pages

Visit each dummy distributor page locally:

```bash
npm run dev
```

Test URLs:
1. http://localhost:3000/john.smith
   - Verify: "Join John's Team" in hero
   - Verify: "47 Team Members" in about section
   - Verify: Bio displays correctly
   - Verify: Contact form submits

2. http://localhost:3000/sarah.johnson
   - Verify: "12 Team Members" displays
   - Verify: Personalization works

3. http://localhost:3000/mike.davis
   - Verify: "203 Team Members" displays
   - Verify: Stats animate

4. Test contact form:
   - Submit contact on John's page
   - Check: contact_submissions table (Supabase)
   - Check: Email in John's inbox
   - Check: Toast notification shows

5. Test rate limiting:
   - Submit 3 contacts quickly → should work
   - Submit 4th → should show rate limit error

DELIVERABLES:
1. seed-dummy-distributors.ts - Script to create 3 distributors
2. 3 dummy distributors in database (john.smith, sarah.johnson, mike.davis)
3. Matrix positions created for all team members
4. Contact submissions seeded
5. AboutSection wired to backend (team stats working)
6. All backend connections verified

VERIFICATION:
- Seed script runs without errors
- 3 distributors exist in database
- Matrix positions created correctly
- Team stats display accurately on replicated pages
- Contact form works end-to-end
- Email delivery confirmed
- Rate limiting works
- Analytics tracking works

DATABASE CHECKS (Supabase):
- distributors table: 3 new rows (john.smith, sarah.johnson, mike.davis)
- matrix_positions table: Positions for all team members
- contact_submissions table: 12 dummy contacts (4 per distributor)
- notifications table: Notifications created for contacts

START by creating seed script, run it, then verify each distributor's page displays correctly with real data.
```

---

# 📍 PHASE 7: PAGE ASSEMBLY + FINAL INTEGRATION

## Phase 7 Objectives

1. Assemble corporate page with all components
2. Assemble replicated page with all components
3. Add smooth scrolling and section IDs
4. Test navigation and CTAs
5. Verify responsive design

## Estimated Time: 1.5 hours

---

## 🎯 COPY THIS PROMPT FOR PHASE 7

```
PHASE 7: PAGE ASSEMBLY + FINAL INTEGRATION

CONTEXT FROM PREVIOUS PHASES:
- ✅ Phases 1-5: All components built
- ✅ Phase 6: Backend wired, dummy data created
- ✅ 3 dummy distributors exist: john.smith, sarah.johnson, mike.davis

CURRENT STATE:
- All 10 components complete and tested individually
- Backend connections working
- Need to assemble full pages
- Need to test complete user flows

PHASE 7 OBJECTIVES:
1. Build complete corporate page (/)
2. Build complete replicated page (/[username])
3. Add section IDs for navigation
4. Test all CTAs and navigation
5. Verify responsive design end-to-end

TASKS:

Task 7.1: Assemble Corporate Page
File: app/(public)/page.tsx

Replace current placeholder with full Optive design:

```typescript
import type { Metadata } from "next";
import { db } from "@/lib/db/client";
import { siteContent } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Components
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { HeroSection } from "@/components/marketing/HeroSection";
import { AboutSection } from "@/components/marketing/AboutSection";
import { ServicesSection } from "@/components/marketing/ServicesSection";
import { ProcessSection } from "@/components/marketing/ProcessSection";
import { TestimonialsSection } from "@/components/marketing/TestimonialsSection";
import { FAQSection } from "@/components/marketing/FAQSection";
import { CTASection } from "@/components/marketing/CTASection";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  title: "Apex Affinity Group — Build Your Financial Future",
  description: "Join a community of entrepreneurs creating financial freedom through proven systems and support. Start your journey with Apex today.",
  openGraph: {
    title: "Apex Affinity Group — Build Your Financial Future",
    description: "Join a community of entrepreneurs creating financial freedom.",
    type: "website",
    url: "https://theapexway.net",
  },
};

async function getContent(key: string): Promise<string | null> {
  try {
    const result = await db
      .select()
      .from(siteContent)
      .where(eq(siteContent.sectionKey, key))
      .limit(1);
    return result[0]?.content || null;
  } catch (error) {
    console.error(`Failed to load site content: ${key}`, error);
    return null;
  }
}

export default async function CorporatePage() {
  const heroTitle = await getContent("hero_title") || "Build Your Financial Future with Apex";
  const heroSubtitle = await getContent("hero_subtitle") || "Join a community of entrepreneurs creating financial freedom through proven systems and support";

  return (
    <div className="min-h-screen">
      <MarketingHeader variant="corporate" ctaLink="/join" />

      <main>
        <HeroSection
          variant="corporate"
          title={heroTitle}
          subtitle={heroSubtitle}
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

Add section IDs for navigation:
- hero → id="home"
- about → id="about"
- services → id="opportunity"
- process → id="how-it-works"
- testimonials → id="testimonials"
- faq → id="faq"
- cta → id="contact"

Task 7.2: Assemble Replicated Page
File: app/(public)/[username]/page.tsx

Replace current basic version with full Optive design:

```typescript
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findDistributorByUsername } from "@/lib/db/queries";
import { getOrganizationSize, getDirectEnrolleesCount } from "@/lib/matrix";

// Components
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { HeroSection } from "@/components/marketing/HeroSection";
import { AboutSection } from "@/components/marketing/AboutSection";
import { ServicesSection } from "@/components/marketing/ServicesSection";
import { ProcessSection } from "@/components/marketing/ProcessSection";
import { TestimonialsSection } from "@/components/marketing/TestimonialsSection";
import { ContactSection } from "@/components/marketing/ContactSection";
import { CTASection } from "@/components/marketing/CTASection";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const distributor = await findDistributorByUsername(params.username);

  if (!distributor) {
    return { title: "Distributor Not Found" };
  }

  return {
    title: `${distributor.firstName} ${distributor.lastName} — Apex Affinity Group`,
    description: `Join ${distributor.firstName}'s team at Apex Affinity Group and start building your financial future today.`,
    openGraph: {
      title: `${distributor.firstName} ${distributor.lastName} — Apex Affinity Group`,
      description: `Join ${distributor.firstName}'s team at Apex.`,
      images: distributor.photoUrl ? [distributor.photoUrl] : [],
    },
    robots: distributor.status !== "active" ? "noindex" : "index,follow",
  };
}

export default async function ReplicatedPage({ params }: { params: { username: string } }) {
  const distributor = await findDistributorByUsername(params.username);

  if (!distributor || distributor.status !== "active") {
    notFound();
  }

  // Fetch team stats
  const teamSize = await getOrganizationSize(distributor.id);
  const directCount = await getDirectEnrolleesCount(distributor.id);

  const distributorName = distributor.firstName;
  const fullName = `${distributor.firstName} ${distributor.lastName}`;

  return (
    <div className="min-h-screen">
      <MarketingHeader
        variant="replicated"
        distributorName={fullName}
        ctaLink={`/join/${distributor.username}`}
      />

      <main>
        <HeroSection
          variant="replicated"
          title={`Join ${fullName}'s Team at Apex`}
          subtitle={`Build your financial future with ${distributorName} as your sponsor and mentor`}
          ctaText={`Join ${distributorName}'s Team`}
          ctaLink={`/join/${distributor.username}`}
          distributorPhoto={distributor.photoUrl}
          distributorName={distributorName}
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
          distributorName={distributorName}
        />

        <TestimonialsSection
          variant="replicated"
          distributorName={distributorName}
        />

        <ContactSection
          distributorId={distributor.id}
          distributorName={distributorName}
          distributorEmail={distributor.email}
        />

        <CTASection
          variant="replicated"
          distributorName={distributorName}
          ctaLink={`/join/${distributor.username}`}
        />
      </main>

      <MarketingFooter />
    </div>
  );
}
```

Add section IDs:
- hero → id="home"
- about → id="about-{username}"
- services → id="opportunity"
- process → id="how-to-join"
- testimonials → id="testimonials"
- contact → id="contact"
- cta → id="get-started"

Task 7.3: Update Navigation Links

MarketingHeader should scroll to sections:

```typescript
const navLinks = variant === "corporate"
  ? [
      { label: "Home", href: "#home" },
      { label: "About", href: "#about" },
      { label: "Opportunity", href: "#opportunity" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "FAQ", href: "#faq" },
      { label: "Contact", href: "#contact" },
    ]
  : [
      { label: `About ${distributorName}`, href: "#about" },
      { label: "Opportunity", href: "#opportunity" },
      { label: "How to Join", href: "#how-to-join" },
      { label: "Contact", href: "#contact" },
    ];
```

Smooth scroll:
```typescript
const handleNavClick = (e: React.MouseEvent, href: string) => {
  e.preventDefault();
  const target = document.querySelector(href);
  target?.scrollIntoView({ behavior: 'smooth' });
};
```

Task 7.4: Test Complete User Flows

**Corporate Page Flow:**
1. Visit http://localhost:3000/
2. Click each nav link → smooth scroll to section
3. Click "Join Now" in header → redirects to /join
4. Click "Get Started" in hero → redirects to /join
5. Scroll through all sections → animations trigger
6. Test FAQ accordion → expand/collapse works
7. Click footer links → scroll to sections
8. Resize to 375px → mobile menu works
9. Resize to 768px → 2-column layouts adapt
10. Resize to 1024px+ → full desktop layout

**Replicated Page Flow:**
1. Visit http://localhost:3000/john.smith
2. Verify "John Smith" appears in header
3. Verify hero shows "Join John Smith's Team"
4. Scroll to about → see "47 Team Members"
5. Verify team stats animate on scroll
6. Scroll to services → same as corporate
7. Scroll to process → "How to Join John" steps
8. Scroll to testimonials → "What John's Team Says"
9. Scroll to contact form → submit a message
10. Verify toast shows "Message sent to John!"
11. Check Supabase → contact_submissions has new row
12. Check email → John received notification
13. Click "Join John's Team" CTA → redirects to /join/john.smith
14. Test mobile → all sections stack correctly

**Edge Cases:**
1. Visit /fake-username → 404 page
2. Visit /apex.corporate (company root) → works
3. Test contact rate limit → submit 4 times, 4th fails
4. Test with no bio → default text shows
5. Test with no photo → initials avatar shows

DELIVERABLES:
1. app/(public)/page.tsx - Complete corporate page
2. app/(public)/[username]/page.tsx - Complete replicated page
3. Section IDs added for navigation
4. Smooth scrolling working
5. All CTAs linking correctly
6. Responsive design verified

VERIFICATION:
- Corporate page shows all 9 sections
- Replicated page shows all 8 sections (no FAQ)
- Navigation scroll works smoothly
- All CTAs redirect correctly
- Team stats display from database
- Contact form works end-to-end
- Responsive at 375px, 768px, 1024px+
- Animations trigger on scroll
- No console errors
- No TypeScript errors

BUILD CHECK:
```bash
npm run build
```
Build must pass with no errors.

START by assembling corporate page, test it thoroughly, then replicated page, then test complete flows.
```

---

# 📍 PHASE 8: TESTING + VERIFICATION + DEPLOYMENT

## Phase 8 Objectives

1. Verify all 87 atoms from dependency map
2. Run Lighthouse audits
3. Test all edge cases
4. Create final verification report
5. Prepare for deployment

## Estimated Time: 2 hours

---

## 🎯 COPY THIS PROMPT FOR PHASE 8

```
PHASE 8: TESTING + ATOM VERIFICATION + DEPLOYMENT PREP

CONTEXT FROM ALL PREVIOUS PHASES:
- ✅ Phase 1: Design system created
- ✅ Phase 2: Components architecture + Tailwind setup
- ✅ Phase 3: Header + Hero + Footer built
- ✅ Phase 4: About + Services + Process built
- ✅ Phase 5: Testimonials + FAQ + Contact + CTA built
- ✅ Phase 6: Backend wired, dummy data created
- ✅ Phase 7: Pages assembled, full integration

CURRENT STATE:
- Corporate page complete (/)
- Replicated page complete (/[username])
- 3 dummy distributors: john.smith, sarah.johnson, mike.davis
- All components functional
- Backend connections working

PHASE 8 OBJECTIVES:
1. Verify ALL 87 atoms from dependency map (Features 1, 2, 3)
2. Run Lighthouse performance audits
3. Test all edge cases
4. Create verification report
5. Commit changes to Git

TASKS:

Task 8.1: Verify Dependency Map Atoms

**Read SPEC-DEPENDENCY-MAP.md and verify EVERY atom:**

**FEATURE 1: Corporate Marketing Site (34 atoms)**

Lines 19-63 in SPEC-DEPENDENCY-MAP.md

UI: Header (5 atoms)
- [ ] Apex logo displays
- [ ] Navigation links work (smooth scroll)
- [ ] "Join Now" CTA button → /join
- [ ] Mobile hamburger menu functional
- [ ] Sticky header on scroll (shadow appears)

UI: Hero Section (5 atoms)
- [ ] Hero title from site_content table (or fallback)
- [ ] Hero subtitle from site_content table (or fallback)
- [ ] Hero CTA button → /join
- [ ] Hero background (video or image)
- [ ] Edge: Fallback text if site_content missing

UI: About Section (3 atoms)
- [ ] Company overview text displays
- [ ] Stats counters animate on scroll (3 stats)
- [ ] Company images display

UI: Opportunity Section (3 atoms)
- [ ] How it works steps (4-step process)
- [ ] Benefits cards (6 cards in grid)
- [ ] Income/growth messaging present

UI: Testimonials Section (2 atoms)
- [ ] Testimonial cards carousel (Swiper)
- [ ] Placeholder testimonials (5 cards)

UI: Footer (5 atoms)
- [ ] Company info (address, phone) - can be placeholder
- [ ] Quick links (to sections)
- [ ] Social media icons (4 icons)
- [ ] Legal links (Terms, Privacy, Income Disclosure)
- [ ] Copyright year (dynamic, current year)

SEO (4 atoms)
- [ ] Meta title "Apex Affinity Group — ..."
- [ ] Meta description present
- [ ] Open Graph tags (title, description, image, type, URL)
- [ ] Canonical URL set

Performance (4 atoms)
- [ ] Images lazy loaded (Next.js Image component)
- [ ] Fonts preloaded (check page source for preload tags)
- [ ] CSS/JS minimized (production build)
- [ ] Lighthouse > 85 (run audit)

Responsive (3 atoms)
- [ ] Mobile layout 375px (test in DevTools)
- [ ] Tablet layout 768px
- [ ] Desktop layout 1024px+

**FEATURE 2: Replicated Distributor Page (45 atoms)**

Lines 72-134 in SPEC-DEPENDENCY-MAP.md

ROUTING (6 atoms)
- [ ] Dynamic route /[username] works
- [ ] Lookup distributor case-insensitive
- [ ] Edge: /fake-user → 404
- [ ] Edge: Suspended distributor → 404
- [ ] Edge: Inactive distributor → 404
- [ ] DEP: username index exists (Supabase)

UI: Header (7 atoms)
- [ ] Apex logo displays
- [ ] Distributor name shown
- [ ] Distributor photo (circular, cropped) OR initials
- [ ] "Contact Me" button → scroll to #contact
- [ ] "Join My Team" button → /join/[username]
- [ ] Backend: Pulls from distributors table
- [ ] Edge: No photo → initials avatar

UI: Hero Personalized (5 atoms)
- [ ] Title: "Join [Name]'s Team at Apex"
- [ ] Distributor photo (large, circular)
- [ ] Personalized subtitle with name
- [ ] CTA: "Join [Name]'s Team" → /join/[username]
- [ ] Backend: Distributor data from database

UI: About Distributor (4 atoms)
- [ ] "Why Join [Name]'s Team?" heading
- [ ] Distributor bio from database (or default)
- [ ] Team stats: total size (from getOrganizationSize())
- [ ] Team stats: direct enrollees (from getDirectEnrolleesCount())

UI: Opportunity Section (2 atoms)
- [ ] Same Apex opportunity content as corporate
- [ ] Personalization: "When you join [Name]..."

UI: How It Works Personalized (2 atoms)
- [ ] 4 steps personalized with distributor name
- [ ] Step text includes [Name] references

UI: Contact Form (14 atoms)
- [ ] Name input (validation: min 2, max 100)
- [ ] Email input (email format validation)
- [ ] Phone input (optional, phone format)
- [ ] Message textarea (min 10, max 1000)
- [ ] Submit button with loading spinner
- [ ] Success toast: "Message sent to [Name]!"
- [ ] Error toast: "Something went wrong..."
- [ ] Rate limit toast (3/hour exceeded)
- [ ] Backend: submitContactForm server action
- [ ] Backend: Saves to contact_submissions table
- [ ] Backend: Sends email via Resend
- [ ] Backend: Creates notification record
- [ ] Backend: Logs to activity_log
- [ ] Backend: Rate limit enforced (test 4 submissions)

UI: CTA (2 atoms)
- [ ] "Ready to Join [Name]'s Team?" section
- [ ] Large CTA button → /join/[username]

SEO (4 atoms)
- [ ] Meta title: "[Name] — Apex Affinity Group"
- [ ] Meta description with distributor name
- [ ] Open Graph with distributor photo (if available)
- [ ] noindex if distributor inactive

**FEATURE 3: Sign-Up Flow UI (8 atoms)**

Lines 149-172 in SPEC-DEPENDENCY-MAP.md

- [ ] Optive form styling applied to inputs
- [ ] Optive button style on submit
- [ ] Username suggestions styled nicely
- [ ] All fields have proper labels
- [ ] Inline validation errors display
- [ ] Loading spinner on submit button
- [ ] Success redirect to /login works
- [ ] Functionality preserved (matrix placement, emails)

**TOTAL: 87 atoms to verify**

Task 8.2: Run Lighthouse Audits

```bash
npm run build
npm run start
```

Then in Chrome:
1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Select "Desktop" mode
4. Check all categories
5. Click "Analyze page load"

**Corporate Page (/):**
```
URL: http://localhost:3000/
Target Scores:
- Performance: > 85
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90
```

**Replicated Page (/john.smith):**
```
URL: http://localhost:3000/john.smith
Target Scores:
- Performance: > 85
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90
```

Document scores in verification report.

Task 8.3: Test Edge Cases

**Contact Form:**
1. Submit with empty fields → validation errors
2. Submit with invalid email → error
3. Submit 3 times → success
4. Submit 4th time → rate limit error
5. Check database → 3 contacts saved
6. Check email → notification received

**Replicated Pages:**
1. Visit /JOHN.SMITH (uppercase) → works (case insensitive)
2. Visit /John.Smith (mixed case) → works
3. Visit /fake-user-12345 → 404
4. Visit /apex.corporate → works (company root)

**Responsive:**
1. Test at 375px width (iPhone SE)
2. Test at 768px (iPad)
3. Test at 1024px (laptop)
4. Test at 1920px (desktop)
5. Verify all sections readable, no overflow

**Backend Connections:**
1. Stats display correctly (john: 47, sarah: 12, mike: 203)
2. Contact form saves to database
3. Email sends via Resend
4. Analytics track page_view

Task 8.4: Create Verification Report

```
File: REDESIGN-VERIFICATION-REPORT.md

Content:
# Redesign Verification Report

**Date:** 2026-02-15
**Phase:** 8 (Final)
**Status:** COMPLETE

## Atom Verification

### Feature 1: Corporate Marketing Site
- **Total Atoms:** 34
- **Verified:** 34
- **Missing:** 0
- **Status:** ✅ COMPLETE

[List each atom with checkmark]

### Feature 2: Replicated Distributor Page
- **Total Atoms:** 45
- **Verified:** 45
- **Missing:** 0
- **Status:** ✅ COMPLETE

[List each atom with checkmark]

### Feature 3: Sign-Up Flow UI
- **Total Atoms:** 8
- **Verified:** 8
- **Missing:** 0
- **Status:** ✅ COMPLETE

## Lighthouse Scores

### Corporate Page (/)
- Performance: X / 100
- Accessibility: X / 100
- Best Practices: X / 100
- SEO: X / 100

### Replicated Page (/john.smith)
- Performance: X / 100
- Accessibility: X / 100
- Best Practices: X / 100
- SEO: X / 100

## Edge Cases Tested
- [x] Case-insensitive username lookup
- [x] 404 for invalid usernames
- [x] Contact form rate limiting
- [x] Empty bio fallback
- [x] No photo initials avatar
- [x] Responsive 375px, 768px, 1024px

## Backend Connections Verified
- [x] getOrganizationSize() returns correct counts
- [x] getDirectEnrolleesCount() returns correct counts
- [x] submitContactForm saves to database
- [x] Email notifications sent via Resend
- [x] Activity logging works
- [x] Analytics tracking works

## Components Created
1. MarketingHeader.tsx ✅
2. HeroSection.tsx ✅
3. AboutSection.tsx ✅
4. ServicesSection.tsx ✅
5. ProcessSection.tsx ✅
6. TestimonialsSection.tsx ✅
7. FAQSection.tsx ✅
8. ContactSection.tsx ✅
9. CTASection.tsx ✅
10. MarketingFooter.tsx ✅

## Pages Updated
1. app/(public)/page.tsx ✅
2. app/(public)/[username]/page.tsx ✅
3. components/signup/SignUpForm.tsx ✅ (styled)

## Dummy Data
- john.smith (47 team members) ✅
- sarah.johnson (12 team members) ✅
- mike.davis (203 team members) ✅

## Known Issues
[List any minor issues or future enhancements]

## Deployment Ready
- [x] Build passes (npm run build)
- [x] No TypeScript errors
- [x] No console errors
- [x] All atoms verified
- [x] Lighthouse scores meet targets
- [x] Backend connections working

**Status:** ✅ READY FOR DEPLOYMENT
```

Task 8.5: Git Commits

Create commits for the redesign:

```bash
git add components/marketing/
git commit -m "redesign: add all 10 marketing components

- MarketingHeader (corporate + replicated variants)
- HeroSection (video background support)
- AboutSection (stats animation, distributor bio)
- ServicesSection (6 benefit cards)
- ProcessSection (4-step how-it-works)
- TestimonialsSection (Swiper carousel)
- FAQSection (Radix accordion)
- ContactSection (backend wired)
- CTASection (conversion-focused)
- MarketingFooter (responsive)

All components match Optive template design.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git add app/(public)/
git commit -m "redesign: update corporate + replicated pages

- Corporate page: all 9 sections
- Replicated page: personalization + backend data
- SEO metadata per page
- Section IDs for navigation
- Smooth scrolling

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git add lib/db/seed-dummy-distributors.ts
git commit -m "redesign: add dummy distributor data

Created 3 example distributors:
- john.smith (47 team members)
- sarah.johnson (12 team members)
- mike.davis (203 team members)

For testing replicated page personalization.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git add tailwind.config.ts
git commit -m "redesign: extend Tailwind with Optive design tokens

Added Optive colors, shadows, gradients to theme.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git add REDESIGN-VERIFICATION-REPORT.md
git commit -m "redesign: add verification report

All 87 atoms from dependency map verified.
Lighthouse scores documented.
Ready for deployment.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git tag redesign-complete
git push origin main --tags
```

DELIVERABLES:
1. REDESIGN-VERIFICATION-REPORT.md - Complete verification
2. All 87 atoms verified
3. Lighthouse scores documented
4. Edge cases tested
5. Git commits created
6. Code pushed to GitHub

VERIFICATION:
- All atoms checked
- Lighthouse > 85 on both pages
- No console errors
- No TypeScript errors
- Build passes
- All edge cases handled
- Backend connections working
- Ready for Vercel deployment

FINAL CHECK:
```bash
npm run build
```
Must complete with no errors.

This is the FINAL phase. After completion, the redesign is DONE and ready to deploy to Vercel!
```

---

## 🎉 COMPLETION

After Phase 8, you will have:

✅ **Complete Optive Design Implementation**
- Corporate page matching Optive template
- Replicated page with full personalization
- All 10 components built and tested

✅ **Backend Integration**
- Contact form connected to database + email
- Team stats pulled from matrix
- Analytics tracking working
- All server actions preserved

✅ **Dummy Data**
- 3 example distributors
- Matrix positions
- Contact submissions

✅ **Verification**
- All 87 atoms from dependency map verified
- Lighthouse scores documented
- Edge cases tested
- Git history clean

✅ **Ready for Production**
- Build passes
- No errors
- Responsive design
- Performance optimized

**Next step:** Deploy to Vercel using READY-TO-DEPLOY.md instructions!

---

**Document Version:** 1.0
**Last Updated:** 2026-02-15
**Total Phases:** 8
**Estimated Total Time:** 12-14 hours

