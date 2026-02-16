# Optive Section Inventory

**Source:** themeforest-UcfPE2SH-optive-business-consulting-html-template/html/index.html
**Total Lines:** 2,141
**Total Sections:** 13

---

## 1. Header

**Line Numbers:** 48-105
**Structure:** `header.main-header > nav.navbar > container > logo + menu + CTA`

**Features:**
- Sticky header with shadow on scroll (`.header-sticky`)
- Logo (SVG) on left
- Navigation menu with submenu dropdowns
- CTA button "Get Free Quote" on right
- Mobile responsive menu (`.navbar-toggle` + `.responsive-menu`)
- SlickNav for mobile navigation

**CSS Classes:**
- `.main-header` - Main wrapper
- `.header-sticky` - Sticky container
- `.navbar`, `.navbar-expand-lg` - Bootstrap nav
- `.navbar-brand` - Logo container
- `.navbar-nav` - Nav items
- `.nav-item.submenu` - Dropdown menus
- `.header-btn` - CTA button container
- `.btn-default` - Primary button style

**JavaScript:**
- SlickNav (mobile menu)
- Scroll event (sticky header)

---

## 2. Hero Section (Video Background)

**Line Numbers:** 107-173
**Structure:** `.hero.hero-video.dark-section > container > row > hero-content + hero-info-box`

**Features:**
- Full-height video background (HTML5 video OR YouTube via YTPlayer)
- Dark overlay (dark-section class)
- 2-column layout:
  - Left (col-xl-8): Heading + subtitle
  - Right (col-xl-4): Info box with image + video play button
- Text animations (`.text-anime-style-3`)
- WOW.js animations (`.wow fadeInUp`)

**CSS Classes:**
- `.hero.hero-video.dark-section` - Main wrapper
- `.hero-bg-video` - Video container
- `.hero-content` - Text content
- `.section-title` - Title wrapper
- `.section-sub-title` - Subtitle/tagline
- `.hero-info-box` - Right sidebar box
- `.video-play-button` - Play button overlay
- `.popup-video` - Magnific popup trigger

**Content:**
- Subtitle: "Transforming Financial Challenges Into Growth"
- Title: "Financial Guidance that Moves your Business"
- Info box: "Smart Advisory" with image

---

## 3. Company Slider

**Line Numbers:** 175-241
**Structure:** `.company-slider > container > company-slider-box > title + swiper`

**Features:**
- Horizontal logo carousel
- Title: "Trusted By Leading Businesses Worldwide"
- 5 company logos (repeating)
- Auto-scroll Swiper slider
- WOW.js animation

**CSS Classes:**
- `.company-slider` - Main wrapper
- `.company-slider-box` - Container
- `.company-slider-title` - Title section
- `.company-supports-slider` - Swiper wrapper
- `.company-supports-logo` - Logo items

**JavaScript:**
- Swiper.js with auto-scroll

---

## 4. About Us Section

**Line Numbers:** 243-325
**Structure:** `.about-us > container > section-title + about-counter-items + section-footer-text`

**Features:**
- Centered section title with embedded images in heading
- 4 animated counter stats cards
- Review rating footer (4.9/5 stars, 4200 reviews)
- Counter animation on scroll
- WOW.js animations

**CSS Classes:**
- `.about-us` - Main wrapper
- `.section-title.section-title-center` - Centered title
- `.text-effect` - Text with special effects
- `.about-counter-item-list` - Stats grid
- `.about-counter-item` - Individual stat card
- `.counter` - Animated counter
- `.section-footer-text` - Footer with rating

**Counter Stats:**
1. Clients Served: 320+
2. Client Retention Rate: 98%
3. Investments Managed: $10M+
4. Expert Advisors: 100+

**JavaScript:**
- jQuery Waypoints + CounterUp.js
- WOW.js

---

## 5. Our Services Section

**Line Numbers:** 327-482
**Structure:** `.our-services > container > section-title + service-items-list + section-footer-text`

**Features:**
- Centered section title
- 3 service cards + 1 CTA contact box (4-item grid)
- Each service card: icon + title + description + "Learn More" link
- Background shape images per card
- Contact CTA box with phone number
- Footer text with link to all services
- WOW.js animations

**CSS Classes:**
- `.our-services` - Main wrapper
- `.service-items-list` - Grid container
- `.service-item` - Individual service card
- `.service-item-bg-shape` - Decorative background
- `.icon-box` - Icon container
- `.service-item-body` - Content wrapper
- `.service-cta-box` - Special CTA card
- `.readmore-btn` - Link style

**Services:**
1. Financial Planning
2. Business Consulting
3. Investment Advisory
4. Contact CTA box

---

## 6. Why Choose Us Section

**Line Numbers:** 484-609
**Structure:** `.why-choose-us > container > row > image-box (col-xl-6) + content (col-xl-6)`

**Features:**
- 2-column layout:
  - Left: Large image + growth stats box overlay
  - Right: Title + benefits items + checklist + CTA button
- Growth box with animated counter (96,567)
- 2 benefit items (icon + heading + text)
- 4-item bulleted list
- "Learn More" button
- Review footer (same as About section)
- WOW.js animations

**CSS Classes:**
- `.why-choose-us` - Main wrapper
- `.why-choose-us-image-box` - Left image container
- `.why-choose-growth-box` - Floating stats box
- `.why-choose-content` - Right content
- `.why-choose-body-item` - Benefit items
- `.why-choose-list` - Bulleted list
- `.image-anime.reveal` - Image reveal animation

**Benefits:**
1. Expertise You Can Trust
2. Solutions Tailored to Your Goal

**Checklist:**
- Building Strong Financial Futures
- Smart Experts for Smarter Growth
- Proven frameworks that deliver
- Expertise That Powers Your Growth

---

## 7. Our Story Section (Video Background)

**Line Numbers:** 611-739
**Structure:** `.our-story.dark-section > container > row > story-content (col-xl-6) + history-box (col-xl-6)`

**Features:**
- Dark section with video background
- 2-column layout:
  - Left: Title + video play button + quote
  - Right: Awards header + 2 counter stats
- Satisfied client images (5 circular avatars)
- Counter animations
- Video popup (Magnific)
- WOW.js animations

**CSS Classes:**
- `.our-story.dark-section` - Main wrapper
- `.our-story-bg-video` - Video background
- `.our-story-content` - Left content
- `.video-play-button` - Play button
- `.our-story-history-box` - Right box
- `.satisfy-client-images` - Avatar stack
- `.story-counter-item` - Stat cards

**Stats:**
- 100+ Awards & Recognitions
- 40+ Industries Served
- 98% Client Satisfaction Rate

---

## 8. Our Process Section

**Line Numbers:** 741-884
**Structure:** `.our-process > container > section-title + process-steps-item-list + footer`

**Features:**
- Centered section title
- 3-step process cards with numbering (01, 02, 03)
- Each step: number + image + title + description + 2 bullet points
- Footer with service tags + satisfied client images + CTA
- WOW.js animations with staggered delays

**CSS Classes:**
- `.our-process` - Main wrapper
- `.process-steps-item-list` - Steps container
- `.process-step-item` - Individual step card
- `.process-step-item-no` - Number badge
- `.process-step-item-image` - Step image
- `.our-process-footer` - Footer section
- `.our-process-footer-list` - Service tags

**Process Steps:**
1. Initial Consultation
2. Strategy Development
3. Execution Support

**Footer Tags:**
- Financial Consulting
- Digital Marketing
- Investment Advisory
- Financial Services

---

## 9. Our Case Studies Section

**Line Numbers:** 886-~1400
**Structure:** `.our-case-study > container > section-title + case-study-slider`

**Features:**
- Centered section title
- Horizontal Swiper slider
- Each slide: Case study card with image + category tag + title + arrow button
- Draggable cursor effect (`data-cursor-text="Drag"`)
- View cursor effect on cards (`data-cursor-text="View"`)
- WOW.js animation

**CSS Classes:**
- `.our-case-study` - Main wrapper
- `.case-study-slider` - Swiper wrapper
- `.case-study-item` - Individual card
- `.case-study-item-image` - Card image
- `.case-study-item-content` - Title + category
- `.case-study-item-btn` - Arrow button

**Case Studies (Sample):**
1. Retail Growth Optimization (Retail & E-Commerce)
2. Corporate Tax Optimization (Compliance Consulting)
3. Startup Funding Success (Technology)

---

## 10. Our FAQs Section

**Line Numbers:** 1500-1744
**Structure:** `.our-faqs > container > section-title + row > accordion (col-xl-6) + faq-image-box (col-xl-6) + company-slider`

**Features:**
- Centered section title
- 2-column layout:
  - Left: Bootstrap accordion with 6 FAQ items
  - Right: Large image + floating CTA box with video button
- Company logo slider below FAQ (reused from section 3)
- Accordion collapse/expand animation
- WOW.js animations with staggered delays

**CSS Classes:**
- `.our-faqs` - Main wrapper
- `.faq-accordion` - Accordion wrapper
- `.accordion-item` - Individual FAQ
- `.accordion-button` - Question button
- `.accordion-collapse` - Answer container
- `.faq-image-box` - Right image area
- `.faq-cta-box` - Floating video CTA
- `.faq-company-slider-box` - Logo slider

**FAQ Questions (6 total):**
1. Can you help my business improve profitability?
2. What services do you offer for individual financial planning?
3. How often should I review my financial plan?
4. How do you approach risk management for businesses?
5. What types of investments do you recommend?
6. How do you ensure my investments are secure?

---

## 11. Our Testimonials Section (Video Background)

**Line Numbers:** 1746-1863
**Structure:** `.our-testimonials (dark-section) > container > testimonial-slider-box > title + swiper`

**Features:**
- Dark section with video background
- Centered title
- Horizontal Swiper carousel
- Each slide: 5-star rating + quote + author (photo + name + title)
- Draggable cursor effect
- WOW.js animations

**CSS Classes:**
- `.our-testimonials` - Main wrapper
- `.our-testimonial-bg-video` - Video background
- `.testimonial-slider-box` - Container
- `.testimonial-slider` - Swiper wrapper
- `.testimonial-item` - Individual card
- `.testimonial-item-rating` - Star icons
- `.testimonial-item-content` - Quote text
- `.testimonial-item-author` - Author info
- `.testimonial-author-image` - Circular photo

**Testimonials (Sample):**
1. Sarah Mitchell - Operations Manager, Horizon Tech
2. Brooklyn Simmons - Homeowner

---

## 12. Our Blog Section

**Line Numbers:** 1865-1973
**Structure:** `.our-blog > container > section-title + row > 3 blog posts`

**Features:**
- Centered section title
- 3-column grid (col-xl-4 each)
- Each post: Featured image + category tag + title + "Read More" link
- Hover animation on images (`.image-anime`)
- Cursor effect on images (`data-cursor-text="View"`)
- WOW.js animations with staggered delays

**CSS Classes:**
- `.our-blog` - Main wrapper
- `.post-item` - Blog card
- `.post-featured-image` - Image wrapper
- `.post-item-tags` - Category badge
- `.post-item-body` - Content area
- `.readmore-btn` - Link style

**Blog Posts (3 total):**
1. Top Industry Trends That Are Shaping the Future of Operations
2. Optimizing Operations Through Strategic Cost Control
3. How Businesses Can Improve Cash Flow in Uncertain Markets

---

## 13. Footer

**Line Numbers:** 1975-2106
**Structure:** `footer.main-footer.dark-section > container > about-footer + newsletter-box + footer-links + copyright + site-name`

**Features:**
- Dark section background
- Logo + company description
- Newsletter subscription form (2-column layout)
- Social media icons (Instagram, Facebook, Dribbble, LinkedIn)
- 3-column footer links:
  - Quick Links (5 links)
  - Our Services (5 links)
  - Contact Information (email, phone, address)
- Copyright bar with Terms & Privacy links
- Large "Optive" text at bottom

**CSS Classes:**
- `footer.main-footer.dark-section` - Main wrapper
- `.about-footer` - Logo + description
- `.footer-newsletter-box` - Newsletter section (col-xl-5)
- `.footer-newsletter-form` - Email input + button
- `.footer-social-links` - Social icons
- `.footer-links-box` - Links grid (col-xl-7)
- `.footer-links` - Link columns
- `.footer-copyright` - Copyright bar
- `.footer-site-name` - Large site name

**Footer Sections:**
1. About (logo + description)
2. Newsletter (form + social links)
3. Quick Links
4. Our Services
5. Contact Information
6. Copyright + Legal
7. Site Name

---

## Dependencies Identified

From HTML `<script>` tags (lines 2108-2140):

| Library | Purpose | React Equivalent |
|---------|---------|------------------|
| jQuery 3.7.1 | DOM manipulation | React (no jQuery needed) |
| Bootstrap 5 | Grid + components | Tailwind CSS |
| Swiper.js | Carousels | ✅ **Install:** `npm i swiper` |
| WOW.js | Scroll animations | Framer Motion |
| Magnific Popup | Lightboxes | Radix Dialog |
| CounterUp.js | Animated counters | Custom React hook |
| GSAP + MagicCursor | Custom cursor | Optional (low priority) |
| YTPlayer | YouTube backgrounds | Optional (use HTML5 video) |

---

## Animation Libraries Used

1. **WOW.js** - Scroll-triggered animations (`.wow fadeInUp`)
   - Replace with: **Framer Motion** `useInView` hook

2. **GSAP SplitText** - Text animation effects (`.text-anime-style-3`)
   - Replace with: **Framer Motion** motion variants

3. **CSS Transitions** - Hover effects, button animations
   - Keep: Use Tailwind transition utilities

---

## Responsive Breakpoints

From Bootstrap grid usage:
- Mobile: < 768px (col-md)
- Tablet: 768px - 1024px (col-lg)
- Desktop: 1024px - 1280px (col-xl)
- Large Desktop: > 1280px (col-xxl)

**Tailwind Equivalents:**
- `sm:` - 640px
- `md:` - 768px
- `lg:` - 1024px
- `xl:` - 1280px
- `2xl:` - 1536px

---

**Document Created:** Phase 1 - Redesign
**Date:** 2026-02-15
**Next Step:** Extract design tokens (OPTIVE-DESIGN-SYSTEM.md)
