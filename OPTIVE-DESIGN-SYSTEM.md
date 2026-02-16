# Optive Design System → Tailwind Mapping

**Source:** themeforest-UcfPE2SH-optive-business-consulting-html-template/html/css/custom.css
**CSS Variables:** Lines 50-63 (`:root`)

---

## 🎨 Colors

### Primary Palette

| Optive Variable | Hex Value | Tailwind Class | Usage |
|----------------|-----------|----------------|--------|
| `--primary-color` | `#0A1119` | `gray-950` | Dark backgrounds, headings, text |
| `--secondary-color` | `#FFFFFF` | `white` | Light backgrounds, inverse text |
| `--bg-color` | `#F5F5F5` | `gray-100` | Page background (light sections) |
| `--text-color` | `#4B535D` | `gray-600` | Body text, descriptions |
| `--accent-color` | `#097C7D` | `teal-700` | Primary CTA, links, accents |
| `--accent-secondary-color` | `#20282D` | `gray-800` | Secondary accent (gradients) |
| `--white-color` | `#FFFFFF` | `white` | Pure white |
| `--divider-color` | `#0A11191A` | `gray-950/10` | Light mode dividers (10% opacity) |
| `--dark-divider-color` | `#FFFFFF1A` | `white/10` | Dark mode dividers (10% opacity) |
| `--error-color` | `rgb(230, 87, 87)` | `red-500` | Error states, validation |

### Tailwind Config Extension

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        // Optive Brand Colors
        'apex-dark': '#0A1119',        // Primary dark
        'apex-teal': '#097C7D',        // Primary accent
        'apex-teal-dark': '#20282D',   // Secondary accent
        'apex-gray': '#4B535D',        // Body text
        'apex-bg': '#F5F5F5',          // Light bg
      },
    },
  },
}
```

**Usage Examples:**
- Dark sections: `bg-apex-dark text-white`
- Light sections: `bg-apex-bg text-apex-gray`
- CTA buttons: `bg-gradient-to-r from-apex-teal via-apex-teal-dark to-apex-teal`
- Headings: `text-apex-dark font-semibold`

---

## 📝 Typography

### Font Families

| Optive Variable | Font Stack | Tailwind Class |
|----------------|------------|----------------|
| `--default-font` | `"Public Sans", sans-serif` | `font-sans` |
| `--accent-font` | `"Mona Sans", sans-serif` | `font-heading` |

**Tailwind Config:**
```typescript
export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Public Sans', 'sans-serif'],
        heading: ['Mona Sans', 'sans-serif'],
      },
    },
  },
}
```

**Google Fonts Import:**
```html
<link href="https://fonts.googleapis.com/css2?family=Mona+Sans:ital,wght@0,200..900;1,200..900&family=Public+Sans:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
```

### Font Sizes & Weights

| Element | Optive CSS | Tailwind Class | Usage |
|---------|-----------|----------------|--------|
| **Body** | `16px / 1.6em / 400` | `text-base leading-relaxed font-normal` | Body text |
| **H1** | `48-56px / 1.2em / 600` | `text-5xl leading-tight font-semibold` | Hero titles |
| **H2** | `36-44px / 1.2em / 600` | `text-4xl leading-tight font-semibold` | Section titles |
| **H3** | `24-28px / 1.2em / 600` | `text-2xl leading-tight font-semibold` | Subsection titles |
| **H4** | `20-22px / 1.2em / 600` | `text-xl leading-tight font-semibold` | Card titles |
| **H5** | `18px / 1.2em / 600` | `text-lg leading-tight font-semibold` | Small headings |
| **H6** | `16px / 1.2em / 600` | `text-base leading-tight font-semibold` | Tiny headings |
| **Small** | `14px / 1.4em / 400` | `text-sm leading-normal` | Captions, labels |
| **Subtitle** | `14-16px / 1.25em / 600` | `text-sm font-semibold uppercase tracking-wide` | Section subtitles |

### Text Styles

| Class Name | Tailwind Equivalent |
|-----------|-------------------|
| `.section-sub-title` | `text-sm font-semibold text-apex-teal uppercase tracking-wider` |
| `.text-effect` | `text-4xl font-heading font-semibold text-apex-dark` |
| Heading default | `font-heading font-semibold text-apex-dark` |
| Body default | `font-sans text-base text-apex-gray leading-relaxed` |

**Font Weights Used:**
- 400 (Normal) - Body text
- 600 (Semibold) - All headings, buttons, labels

---

## 📐 Spacing

### Container

| Optive CSS | Tailwind Class |
|-----------|----------------|
| `max-width: 1500px` | `max-w-7xl` (1280px) or custom |
| `padding: 0 15px` | `px-4` (16px) or `px-6` (24px) |

**Tailwind Config:**
```typescript
export default {
  theme: {
    extend: {
      maxWidth: {
        'optive': '1500px',
      },
    },
  },
}
```

### Section Padding

| Element | Optive CSS | Tailwind Class |
|---------|-----------|----------------|
| Section vertical padding | `80px 0` | `py-20` (80px) |
| Section top only | `80px` | `pt-20` |
| Section bottom only | `80px` | `pb-20` |
| Small section padding | `40px 0` | `py-10` (40px) |
| Large section padding | `120px 0` | `py-32` (128px) |

### Grid Gaps

| Element | Optive CSS | Tailwind Class |
|---------|-----------|----------------|
| Row gutter (Bootstrap) | `margin: -15px` | `gap-6` (24px) or `gap-8` (32px) |
| Card grid gap | `30px` | `gap-8` |
| Icon + Text gap | `12px` | `gap-3` |

---

## 🎭 Effects

### Border Radius

| Element | Optive CSS | Tailwind Class |
|---------|-----------|----------------|
| Buttons | `border-radius: 4px` | `rounded` (4px) |
| Cards | `border-radius: 8px` | `rounded-lg` (8px) |
| Images | `border-radius: 12px` | `rounded-xl` (12px) |
| Circular (avatars) | `border-radius: 50%` | `rounded-full` |

### Box Shadows

| Element | Optive CSS | Tailwind Class |
|---------|-----------|----------------|
| Card hover | `box-shadow: 0 10px 30px rgba(0,0,0,0.1)` | `shadow-lg hover:shadow-xl` |
| Card default | `box-shadow: 0 4px 12px rgba(0,0,0,0.05)` | `shadow-md` |
| Sticky header | `box-shadow: 0 2px 10px rgba(0,0,0,0.1)` | `shadow-md` |

**Tailwind Config (if needed):**
```typescript
export default {
  theme: {
    extend: {
      boxShadow: {
        'optive': '0 10px 30px rgba(0, 0, 0, 0.1)',
        'optive-lg': '0 20px 50px rgba(0, 0, 0, 0.15)',
      },
    },
  },
}
```

### Gradients

#### Primary Button Gradient
```css
/* Optive CSS */
background: linear-gradient(to right, var(--accent-color) 0%, var(--accent-secondary-color) 50%, var(--accent-color) 100%);
background-size: 200% auto;
```

**Tailwind:**
```jsx
className="bg-gradient-to-r from-apex-teal via-apex-teal-dark to-apex-teal bg-[length:200%_auto] hover:bg-right-center transition-all duration-400"
```

**Tailwind Config:**
```typescript
export default {
  theme: {
    extend: {
      backgroundSize: {
        '200': '200% auto',
      },
    },
  },
}
```

#### Dark Section Gradient (Preloader)
```css
/* Optive CSS */
background: linear-gradient(90deg, var(--accent-color) 0%, var(--accent-secondary-color) 100%);
```

**Tailwind:**
```jsx
className="bg-gradient-to-r from-apex-teal to-apex-teal-dark"
```

---

## ⚡ Transitions

### Duration

| Element | Optive CSS | Tailwind Class |
|---------|-----------|----------------|
| Button hover | `0.4s ease-in-out` | `duration-400 ease-in-out` |
| Link hover | `0.3s ease-in-out` | `duration-300 ease-in-out` |
| Image reveal | `600ms linear` | `duration-600` |
| General | `0.5s ease-in-out` | `duration-500 ease-in-out` |

### Common Transitions

| Effect | Optive CSS | Tailwind Class |
|--------|-----------|----------------|
| Color change | `color: ...; transition: 0.3s` | `text-... transition-colors duration-300` |
| Transform | `transform: ...; transition: 0.4s` | `transform transition-transform duration-400` |
| All properties | `transition: all 0.4s` | `transition-all duration-400` |
| Background position | `background-position: ...; transition: 0.4s` | Custom (see button example above) |

---

## 🔘 Buttons

### Primary Button (`.btn-default`)

**Optive CSS:**
```css
.btn-default {
  background: linear-gradient(to right, var(--accent-color) 0%, var(--accent-secondary-color) 50%, var(--accent-color) 100%);
  background-size: 200% auto;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  color: var(--white-color);
  padding: 15px 46px 15px 24px; /* Right padding for arrow icon */
  transition: all 0.4s ease-in-out;
}

.btn-default::before {
  content: '';
  /* Arrow icon positioned absolutely */
  background-image: url(../images/arrow-white.svg);
  width: 16px;
  height: 16px;
  right: 20px;
}
```

**Tailwind Component:**
```tsx
<button className="relative inline-flex items-center justify-center gap-2 px-6 py-3.5 pr-12 rounded bg-gradient-to-r from-apex-teal via-apex-teal-dark to-apex-teal bg-[length:200%_auto] hover:bg-right-center text-white text-base font-semibold transition-all duration-400">
  Button Text
  <span className="absolute right-5 transition-transform duration-400 group-hover:translate-x-0.5">
    <ArrowRight className="w-4 h-4" />
  </span>
</button>
```

### Secondary Button (`.btn-default.btn-highlighted`)

**Optive CSS:**
```css
.btn-default.btn-highlighted {
  background: var(--white-color);
  color: var(--primary-color);
}

.btn-default.btn-highlighted::after {
  background: var(--accent-color);
  /* Expands from right to left on hover */
}
```

**Tailwind Component:**
```tsx
<button className="relative inline-flex items-center justify-center gap-2 px-6 py-3.5 pr-12 rounded bg-white text-apex-dark text-base font-semibold overflow-hidden group transition-all duration-400">
  <span className="relative z-10 group-hover:text-white transition-colors duration-400">
    Button Text
  </span>
  <span className="absolute inset-0 bg-apex-teal scale-x-0 group-hover:scale-x-100 origin-right transition-transform duration-400" />
  <span className="absolute right-5 z-10 transition-transform duration-400 group-hover:translate-x-0.5">
    <ArrowRight className="w-4 h-4 group-hover:text-white" />
  </span>
</button>
```

### Read More Link (`.readmore-btn`)

**Optive CSS:**
```css
.readmore-btn {
  font-family: var(--accent-font);
  font-weight: 600;
  color: var(--primary-color);
  padding-right: 28px;
  transition: 0.3s ease-in-out;
}

.readmore-btn::before {
  /* Gradient arrow icon */
  background-image: url('../images/arrow-gradient.svg');
  width: 16px;
  height: 16px;
  right: 2px;
}
```

**Tailwind Component:**
```tsx
<a href="#" className="inline-flex items-center gap-2 font-heading font-semibold text-apex-dark hover:text-apex-teal transition-colors duration-300">
  Learn More
  <ArrowRight className="w-4 h-4 transition-transform duration-300 hover:translate-x-0.5" />
</a>
```

---

## 🎬 Animations

### Counter Animation

**Optive:** Uses jQuery CounterUp.js + Waypoints

**React Equivalent:**
```tsx
import { useEffect, useState, useRef } from 'react';
import { useInView } from 'framer-motion';

function Counter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}
```

### Scroll Reveal Animations

**Optive:** Uses WOW.js (`.wow fadeInUp`)

**Framer Motion Equivalent:**
```tsx
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

function FadeInUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
```

### Image Reveal Animation

**Optive CSS:**
```css
.image-anime:after {
  content: "";
  position: absolute;
  width: 200%;
  height: 0%;
  background-color: rgba(255,255,255,.3);
  transform: translate(-50%,-50%) rotate(-45deg);
}

.image-anime:hover:after {
  height: 250%;
  transition: all 600ms linear;
}
```

**Tailwind:**
```tsx
<div className="relative overflow-hidden group">
  <img src="..." alt="..." />
  <div className="absolute inset-0 bg-white/30 scale-0 group-hover:scale-150 rotate-45 transition-transform duration-600 origin-center" />
</div>
```

---

## 📏 Layout

### Section Structure

**Optive Pattern:**
```html
<div class="section-name">
  <div class="container">
    <div class="row section-row">
      <div class="col-lg-12">
        <!-- Section Title -->
      </div>
    </div>
    <div class="row">
      <!-- Section Content -->
    </div>
  </div>
</div>
```

**Tailwind Pattern:**
```tsx
<section className="py-20 bg-apex-bg">
  <div className="container max-w-optive mx-auto px-6">
    <div className="mb-12 text-center">
      {/* Section Title */}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {/* Section Content */}
    </div>
  </div>
</section>
```

### Grid Patterns

| Layout | Optive Bootstrap | Tailwind Grid |
|--------|-----------------|---------------|
| 3 columns | `col-xl-4` | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` |
| 2 columns | `col-xl-6` | `grid-cols-1 lg:grid-cols-2` |
| 4 columns | `col-xl-3` | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` |
| Sidebar (4/8) | `col-xl-4` + `col-xl-8` | `grid-cols-1 lg:grid-cols-3` (1fr 2fr) |

---

## 🌗 Dark Sections

**Optive CSS:**
```css
.dark-section {
  background-color: var(--primary-color);
  background-image: url('../images/dark-section-bg-image.png');
  color: var(--white-color);
}
```

**Tailwind:**
```tsx
<section className="bg-apex-dark text-white bg-[url('/images/dark-pattern.png')] bg-center bg-no-repeat">
  {/* Dark section content */}
</section>
```

---

**Document Created:** Phase 1 - Redesign
**Date:** 2026-02-15
**Next Step:** Create component architecture (COMPONENT-ARCHITECTURE.md)
