# Placeholder Imagery Strategy

**Goal**: Replace icon-heavy, text-based design with emotional, lifestyle-driven photography that resonates with both experienced agents and newcomers.

---

## Core Visual Principles

### 1. **Authentic Over Cheesy**
- Avoid obvious stock photo poses (fake handshakes, forced smiles)
- Prefer candid, natural moments
- Real settings, not studio backdrops

### 2. **Emotional Over Corporate**
- Show the LIFE insurance enables, not just the business
- Focus on feeling successful, not looking professional
- Personal moments > business settings

### 3. **Diverse Representation**
- Mix of ages (25-65)
- Ethnic diversity
- Gender balance
- Mix of urban/suburban/rural settings

### 4. **Aspirational Yet Relatable**
- Luxurious but not ostentatious
- Success without arrogance
- Achievable dreams, not unrealistic fantasies

---

## Image Categories by Section

### **HERO IMAGES** (Homepage, Main Pages)
**Purpose**: Emotional anchor, first impression, "movie trailer" moment

#### Homepage Hero
- **Subject**: Single agent or small family
- **Setting**: Beautiful home, peaceful outdoor scene, or modern home office
- **Emotion**: Contentment, freedom, confidence
- **Action**: Living life (not working) - maybe on a deck, traveling, with family
- **Examples**:
  - Agent working from laptop on a beautiful deck overlooking mountains
  - Family at dinner table, relaxed and happy
  - Agent closing laptop, heading outside (symbolizing freedom)

#### Professionals Page Hero
- **Subject**: Professional-looking individual (30-50)
- **Setting**: Upscale home office or meeting with client
- **Emotion**: Authority, success, confidence
- **Action**: Thoughtful moment, strategic thinking, or celebration
- **Examples**:
  - Agent reviewing documents with satisfied clients
  - Person looking out window of nice office (contemplative)
  - Successful agent shaking hands with client (natural, not posed)

#### Newcomers Page Hero
- **Subject**: Younger individual or career-changer (25-40)
- **Setting**: Learning environment or first success moment
- **Emotion**: Hope, excitement, support
- **Action**: Learning, celebrating first win, being mentored
- **Examples**:
  - Person at laptop with mentor looking over shoulder supportively
  - Individual raising arms in celebration at desk
  - Someone confidently presenting to a small group

---

## Section-Specific Imagery Needs

### **TESTIMONIAL SECTIONS**
**Current**: Initial avatars (SK, MR)
**New Approach**: Real photos or realistic stock replacements

#### Requirements:
- Headshot-style photos (shoulders up)
- Professional but warm
- Natural smile
- Varied backgrounds (not all identical)
- **Specs**: Square crop, 400x400px minimum

**Sources:**
- Unsplash: Search "professional headshot", "business portrait"
- Generated: If using AI, prompt for "professional insurance agent headshot, natural lighting, warm smile"

---

### **SUCCESS & LIFESTYLE IMAGERY**

#### "Enjoying What You Do" (Pillar 1)
- Agent genuinely smiling while helping a client
- Person working from a beautiful location (beach house, mountain cabin)
- Agent at community event, coaching kids sports, volunteering
- **Emotion**: Fulfillment, joy, purpose

#### "Own Your Future" (Pillar 2)
- Home office setup (nice but not over-the-top)
- Keys (symbolizing ownership)
- Agent reviewing growth charts/dashboards
- Signing documents, handshake on deal
- **Emotion**: Control, ownership, wealth-building

#### "Backed By Champions" (Pillar 3)
- Mentor and mentee working together
- Group training session (diverse participants)
- Team celebration, high-fives
- 1-on-1 coaching conversation
- **Emotion**: Support, community, never alone

---

### **PAIN POINT IMAGERY** (Professionals Page)
**Current**: Icon + text list
**New Approach**: Split-screen or before/after concept

#### Visual Ideas:
- **Frustrated agent**: Person at desk, head in hands, stressed by paperwork
- **Trapped agent**: Person looking through window (symbolizing captive contract)
- **Confused agent**: Multiple confusing options, overwhelmed
- **Isolated agent**: Person alone in empty office, no support

**Style**: Muted colors, less saturated to contrast with positive sections

---

### **PROCESS & JOURNEY IMAGERY** (New to Insurance Page)
**Current**: Timeline with numbers
**New Approach**: Illustrated journey or photo progression

#### Visual Sequence:
1. **Getting Licensed**: Person studying with books/laptop, taking test
2. **Training**: Group in training session, mentor teaching
3. **First Sale**: Agent shaking hands with first client, celebration
4. **Growing**: Agent confidently presenting, team expanding
5. **Success**: Agent enjoying fruits of labor (lifestyle moment)

**Style**: Progressive lighting/color (darker → brighter as journey progresses)

---

## Specific Image Requirements by Component

### **Audience Selector Component** (Homepage)
Two distinct hero images side-by-side or overlapping:

#### Licensed Path Image:
- **Subject**: Confident professional (35-50)
- **Setting**: Upscale office or with clients
- **Color Treatment**: Amber/gold overlay to match branding
- **Specs**: 1200x800px, landscape orientation

#### Newcomer Path Image:
- **Subject**: Hopeful individual (25-40)
- **Setting**: Starting journey, learning, fresh start
- **Color Treatment**: Emerald/green overlay to match branding
- **Specs**: 1200x800px, landscape orientation

---

### **Comparison Tables** (Visual Enhancement)
Add small icons or photos:
- ✓ Success symbol with small celebration image
- ✗ Problem symbol with frustrated face
- Contrasting visual treatments for Apex vs. Competitor columns

---

### **Stats & Numbers** (Trust Indicators)
- Background: Subtle lifestyle image (success moments, team gatherings)
- Treatment: Overlay with transparency so numbers stand out
- **Alternative**: Icon + photo combination (keep icon, add photo behind)

---

## Image Sourcing Strategy

### **Phase 1: Launch (Free Stock)**

#### Recommended Sources:
1. **Unsplash** (unsplash.com)
   - Free, high-quality
   - Good for lifestyle, business, success themes
   - Already configured in next.config.ts

2. **Pexels** (pexels.com)
   - Free, curated
   - Strong diversity representation
   - Good for authentic moments

3. **Pixabay** (pixabay.com)
   - Free, large library
   - Good for specific scenarios

#### Search Terms to Use:
- "insurance agent professional"
- "business success celebration"
- "home office entrepreneur"
- "mentor teaching student"
- "confident professional"
- "family dinner happy"
- "work from home freedom"
- "business handshake authentic"
- "diverse business team"
- "professional headshot"

---

### **Phase 2: AI-Generated (If Needed)**

#### Tools:
- **Midjourney** (best quality, $10/month)
- **DALL-E 3** (via ChatGPT Plus, $20/month)
- **Leonardo.ai** (free tier available)

#### Sample Prompts:
```
Professional insurance agent working from beautiful home office,
natural lighting, modern desk, mountain view through window,
authentic candid moment, photorealistic, warm tones
```

```
Diverse group of insurance agents in training session,
engaged and smiling, modern office space, natural interactions,
photorealistic, professional photography style
```

```
Confident business professional shaking hands with client,
authentic moment, modern office setting, natural lighting,
photorealistic portrait photography, warm and trustworthy
```

---

### **Phase 3: Real Agent Photography (Future)**
Once site performs well, invest in real photography:
- Hire photographer for 1-2 day shoot
- Feature real Apex agents
- Capture authentic success stories
- Replace all placeholder images

**Budget Estimate**: $2,000-5,000 for professional shoot

---

## Image Specifications

### **Technical Requirements**:

| Image Type | Dimensions | Format | Max Size | Notes |
|------------|-----------|--------|----------|-------|
| Hero Images | 1920x1080px | WebP, JPG | 300KB | Next.js Image will optimize |
| Section Images | 1200x800px | WebP, JPG | 200KB | Landscape orientation |
| Portraits | 400x400px | WebP, JPG | 100KB | Square crop for testimonials |
| Card Images | 800x600px | WebP, JPG | 150KB | 4:3 ratio for feature cards |
| Mobile Optimized | 800x1200px | WebP, JPG | 200KB | Portrait for mobile heroes |

### **Naming Convention**:
```
hero-homepage-freedom.jpg
hero-professionals-success.jpg
hero-newcomers-learning.jpg
testimonial-sarah-kennedy.jpg
pillar-enjoy-work.jpg
pillar-ownership.jpg
pillar-support.jpg
pain-frustrated-agent.jpg
journey-step1-licensing.jpg
```

---

## Accessibility Considerations

### Alt Text Requirements:
Every image MUST have descriptive alt text:

**Bad Alt Text**:
- "Image 1"
- "Hero"
- "Stock photo"

**Good Alt Text**:
- "Insurance agent working from laptop on home deck overlooking mountains"
- "Mentor and new agent reviewing documents together, smiling"
- "Confident professional shaking hands with satisfied client in modern office"

### Contrast & Overlays:
- If adding text over images, ensure 4.5:1 contrast ratio
- Use gradient overlays (dark → transparent) for text legibility
- Test with grayscale to ensure clarity

---

## Color Treatments by Audience

### **Professionals** (Amber/Gold Theme)
- Overlay: rgba(251, 191, 36, 0.15) // amber-500 at 15%
- Highlights: Warm gold accents
- Mood: Success, achievement, premium

### **Newcomers** (Emerald/Green Theme)
- Overlay: rgba(16, 185, 129, 0.15) // emerald-500 at 15%
- Highlights: Fresh green accents
- Mood: Growth, fresh start, support

### **Universal** (Primary Brand)
- Overlay: rgba(71, 85, 105, 0.15) // slate-600 at 15%
- Highlights: Neutral sophistication
- Mood: Trust, professionalism, clarity

---

## Implementation Checklist

Before adding any image to the site:
- [ ] Image is high quality (not pixelated or compressed)
- [ ] Subjects look authentic (not cheesy stock pose)
- [ ] Diverse representation considered
- [ ] Emotion matches section purpose
- [ ] Alt text written (descriptive, specific)
- [ ] Image optimized (<300KB before Next.js processing)
- [ ] Naming convention followed
- [ ] Copyright/license verified (commercial use allowed)
- [ ] Mobile version considered (crop works on small screens)

---

## Quick Start Image List

### Immediate Needs (Priority 1):
1. ✅ Homepage hero (freedom/lifestyle moment)
2. ✅ Professionals page hero (successful agent)
3. ✅ Newcomers page hero (learning/growth)
4. ✅ 3 pillar images (enjoy, own, supported)
5. ✅ 3 testimonial headshots

### Secondary Needs (Priority 2):
6. ⏳ Pain point imagery (4 images)
7. ⏳ Journey timeline (5 step images)
8. ⏳ Success story visuals (3 images)
9. ⏳ Team/community images (2 images)

### Future Enhancements (Priority 3):
10. ⏳ Video thumbnails (3 placeholders)
11. ⏳ Interactive calculator background
12. ⏳ Footer/brand imagery

---

## Resources

### Image Search URLs (Pre-configured):
- Unsplash: `https://unsplash.com/s/photos/professional-success`
- Pexels: `https://www.pexels.com/search/insurance%20professional/`
- Pixabay: `https://pixabay.com/images/search/business%20success/`

### Next.js Image Optimization:
Already configured in `next.config.ts` to handle:
- Automatic WebP conversion
- Responsive sizing
- Lazy loading
- Quality optimization

**Just use the Next.js Image component**, and it handles the rest.

---

**Remember**: Every image should tell a story and evoke emotion. If it doesn't make you feel something, find a different image.
