# Translation Requirements - Marketing Site Redesign

**Date**: January 29, 2026
**Scope**: Spanish (es.json) and Chinese (zh.json) translations for redesigned marketing pages
**Status**: ⚠️ Hardcoded English - Extraction Required Before Translation

---

## Current Situation

### Marketing Site Structure:
- **Replicated Sites** (`app/team/[username]/*`): ✅ Fully internationalized with `next-intl`
- **Main Marketing Site** (`app/(marketing)/*`): ❌ Hardcoded English text

### Redesigned Pages (Hardcoded English):
1. `app/page.tsx` - Homepage (testimonials, sections)
2. `app/(marketing)/about/page.tsx` - About page
3. `app/(marketing)/professionals/page.tsx` - Professionals page
4. `app/(marketing)/new-to-insurance/page.tsx` - New to Insurance page
5. `app/(marketing)/opportunity/page.tsx` - Opportunity page

### New Components (Hardcoded English):
1. `components/marketing/audience-selector.tsx` - Audience targeting
2. `components/marketing/pillar-card.tsx` - Three pillars messaging
3. `components/marketing/commission-calculator.tsx` - Interactive calculator

---

## Translation Scope Analysis

### Option 1: Leave Marketing Site English-Only (Recommended for Launch)
**Pros**:
- No refactoring required
- Launch ready immediately
- Replicated sites already support 3 languages (agents can use them for multilingual recruitment)

**Cons**:
- Main marketing site www.theapexway.net only in English
- May lose some international direct traffic

**Recommendation**: ✅ **Proceed with English-only launch**, add translations post-launch

---

### Option 2: Full Internationalization (Post-Launch Enhancement)
**Pros**:
- Consistent multilingual experience across entire site
- SEO benefits for Spanish/Chinese search terms
- Professional presentation

**Cons**:
- Requires significant refactoring (200+ translation keys)
- 40-60 hours of development work
- Professional translation services recommended
- Testing required for all 3 languages

**Recommendation**: ⏰ **Plan for Phase 2** (4-6 weeks post-launch)

---

## Translation Key Extraction Required

### Homepage (`app/page.tsx`)
**Estimated Keys**: 45

**Sections to Extract**:
- Testimonials (3 × 5 keys each = 15 keys)
- Trust indicators (4 keys)
- Three pillars section (5 keys)
- Success stories section (4 keys)
- Video placeholder (3 keys)
- What You Get section (10 keys)
- Final CTA (4 keys)

**Example Translation Key Structure**:
```json
{
  "marketing": {
    "homepage": {
      "trustIndicators": {
        "subtitle": "Trusted by thousands of agents across America",
        "activeAgents": "Active Agents",
        "paidToAgents": "Paid to Agents",
        "topCarriers": "Top Carriers",
        "states": "States"
      },
      "testimonials": {
        "badge": "Real People, Real Results",
        "heading": "They Made the Switch. So Can You.",
        "michael": {
          "name": "Michael Rodriguez",
          "role": "Former Captive Agent, Now Regional Director",
          "quote": "After 8 years feeling trapped...",
          "highlight": "Tripled income in year 1"
        }
      }
    }
  }
}
```

---

### About Page (`app/(marketing)/about/page.tsx`)
**Estimated Keys**: 35

**Sections to Extract**:
- Hero (3 keys)
- Problem section (8 keys - 4 cards × 2 each)
- Solution section (heading + comparison table = 12 keys)
- Principles (9 keys - 3 cards × 3 each)
- Where You Fit In (8 keys - 4 sections)
- Track record (5 keys)

---

### Professionals Page (`app/(marketing)/professionals/page.tsx`)
**Estimated Keys**: 40

**Sections to Extract**:
- Hero (4 keys)
- Pain points (5 cards × 1 key each = 5 keys)
- Benefits section (heading + 6 cards = 13 keys)
- Comparison table (12 keys)
- Transition support (6 keys)
- Testimonial (4 keys)

---

### New to Insurance Page (`app/(marketing)/new-to-insurance/page.tsx`)
**Estimated Keys**: 38

**Sections to Extract**:
- Hero (4 keys)
- Visual timeline (5 steps × 4 keys each = 20 keys)
- Day in the life (6 keys)
- FAQ accordion (5 questions × 2 keys = 10 keys)
- Testimonial (4 keys)

---

### Opportunity Page (`app/(marketing)/opportunity/page.tsx`)
**Estimated Keys**: 42

**Sections to Extract**:
- Hero (3 keys)
- What You Get (4 cards × 3 keys = 12 keys)
- Carriers section (8 keys)
- Products section (12 keys - 4 products × 3 keys)
- Onboarding process (5 steps × 1 key = 5 keys)
- Requirements (4 keys)

---

### New Components

#### AudienceSelector Component
**Estimated Keys**: 8

```json
{
  "marketing": {
    "audienceSelector": {
      "title": "Who is Apex For?",
      "subtitle": "Choose your path to get started",
      "licensed": {
        "title": "I'm a Licensed Professional",
        "description": "Already in insurance? See how we're different.",
        "buttonText": "For Professionals"
      },
      "newcomer": {
        "title": "I'm New to Insurance",
        "description": "Exploring a career change? Start here.",
        "buttonText": "New to Insurance"
      }
    }
  }
}
```

#### PillarCard Component
**Estimated Keys**: 18 (3 pillars × 6 keys each)

```json
{
  "marketing": {
    "pillars": {
      "loveWhatYouDo": {
        "title": "Love What You Do",
        "description": "Build a career that brings joy...",
        "icon": "Heart",
        "professionalModalTitle": "For Licensed Professionals",
        "professionalModalContent": "Stop dreading Mondays...",
        "newcomerModalTitle": "For Career Changers",
        "newcomerModalContent": "Imagine waking up excited..."
      }
    }
  }
}
```

#### CommissionCalculator Component
**Estimated Keys**: 12

```json
{
  "marketing": {
    "commissionCalculator": {
      "badge": "Income Calculator",
      "heading": "See What You Could Actually Earn",
      "subtitle": "Move the slider to see your potential income...",
      "sliderLabel": "Your Annual Production (Premium Volume)",
      "typicalAgency": "Typical Agency (65%)",
      "atApex": "At Apex (135% avg)",
      "perYear": "per year",
      "differenceLabel": "You Would Earn",
      "moreLabel": "More",
      "percentageIncrease": "That's a {percentage}% increase in your annual income",
      "disclaimer1": "* Based on average commission rates...",
      "disclaimer2": "Apex commission rates range from 90% to 145%..."
    }
  }
}
```

---

## Total Translation Work Required

| Component | Translation Keys | Development Hours | Translation Hours |
|-----------|------------------|-------------------|-------------------|
| Homepage | 45 | 6 | 4 |
| About Page | 35 | 4 | 3 |
| Professionals Page | 40 | 5 | 3 |
| New to Insurance Page | 38 | 5 | 3 |
| Opportunity Page | 42 | 6 | 4 |
| AudienceSelector | 8 | 2 | 1 |
| PillarCard | 18 | 3 | 2 |
| CommissionCalculator | 12 | 2 | 1 |
| **TOTAL** | **238 keys** | **33 hours** | **21 hours** |

**Per Language (Spanish & Chinese)**: 21 hours each × 2 = 42 hours
**Total Project Time**: 75 hours (33 dev + 42 translation)

---

## Implementation Plan (Post-Launch)

### Phase 1: Extract Translation Keys (Week 1)
1. Create namespace structure in `messages/en.json`
2. Extract all hardcoded strings from 5 redesigned pages
3. Extract all hardcoded strings from 3 new components
4. Refactor components to use `useTranslations()` hook
5. Test English version (should work identically)

### Phase 2: Spanish Translation (Week 2)
1. Send all 238 keys to professional translator
2. Review translations for context/accuracy
3. Update `messages/es.json`
4. Test Spanish version with language switcher

### Phase 3: Chinese Translation (Week 3)
1. Send all 238 keys to professional translator
2. Review translations for context/accuracy
3. Update `messages/zh.json`
4. Test Chinese version with language switcher

### Phase 4: QA & Polish (Week 4)
1. Cross-browser testing (all 3 languages)
2. Mobile responsiveness check
3. RTL support if needed (Arabic expansion)
4. Performance testing
5. Launch multilingual marketing site

---

## Cost Estimate

### Development (33 hours @ $100/hr):
- Translation key extraction: $1,800
- Component refactoring: $1,500
**Subtotal**: $3,300

### Translation Services:
- Spanish (238 keys @ $0.15/word, avg 10 words/key): ~$350
- Chinese (238 keys @ $0.20/word, avg 8 words/key): ~$380
**Subtotal**: $730

**Total Project Cost**: ~$4,030

---

## Alternative: Machine Translation + Human Review

### Using AI Translation (Faster, Cheaper):
1. Use GPT-4 or Claude to translate all keys
2. Have native speaker review/correct (5 hours per language)
3. Cost: ~$1,000 total (vs. $4,030 professional)
4. Quality: 90-95% vs. 98-100% professional

**Recommended for internal launch, professional for public-facing**

---

## Current Translation Status

### ✅ Already Translated (Replicated Sites):
- Replicated site homepage
- Opportunity page (replicated version)
- About Me page
- Contact page
- Products page
- Signup flow

**Total Keys Translated**: ~600 (English, Spanish, Chinese)

### ❌ Not Translated (Main Marketing Site):
- Homepage (main site)
- About page (main site)
- Professionals page
- New to Insurance page
- Opportunity page (main site)
- New components (AudienceSelector, PillarCard, CommissionCalculator)

**Total Keys Needed**: ~238

---

## Recommendation for Current Launch

### Immediate Action (This Week):
✅ **Launch main marketing site in English only**
- Most traffic will be from US/English-speaking markets
- Language switcher can be hidden on main site (visible only on replicated sites)
- SEO will primarily target English keywords ("insurance career", "become an insurance agent", etc.)

### Post-Launch (Weeks 2-5):
📝 **Plan translation project for multilingual expansion**
- Allocate budget ($4,000)
- Source translators (Spanish, Chinese)
- Schedule development work (33 hours)
- Target completion: February 28, 2026

### Long-Term (Q2 2026):
🌐 **Expand to additional languages** (if demand exists)
- French (Canada market)
- Arabic (Middle East expansion)
- Portuguese (Brazil market)

---

## Decision Point

**User must decide**:
1. ✅ **Launch English-only** (ready now, add translations later)
2. ⏸️ **Delay launch for translations** (add 4 weeks, full multilingual)
3. 🤖 **Quick AI translation** (ready in 1 week, 90-95% quality)

**My Recommendation**: **Option 1** - Launch English now, add professional translations in February.

---

## Files That Would Need Modification

### For Full Translation Support:
```
messages/
├── en.json (add 238 keys to "marketing" namespace)
├── es.json (add 238 translated keys)
└── zh.json (add 238 translated keys)

app/
├── page.tsx (refactor to use useTranslations)
└── (marketing)/
    ├── about/page.tsx (refactor)
    ├── professionals/page.tsx (refactor)
    ├── new-to-insurance/page.tsx (refactor)
    └── opportunity/page.tsx (refactor)

components/marketing/
├── audience-selector.tsx (refactor)
├── pillar-card.tsx (refactor)
└── commission-calculator.tsx (refactor)
```

**Total Files to Modify**: 11

---

**Report Generated**: January 29, 2026
**Decision Needed**: Launch strategy (English-only vs. multilingual)
