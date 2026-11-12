# Prism — Design Notes & Architecture Reference

Researched from live inspection of **sarvam.ai** and **anthropic.com/research/team/frontier-red-team** alongside the user-provided "Haven" hero layout reference.

---

## 1. Palette & Surface Tokens

### Light Mode (Default)
- **Background Root (`--bg-root`):** `#FAF9F5` (Anthropic warm paper tone / calm editorial foundation)
- **Background Surface (`--bg-surface`):** `#FFFFFF` (Pristine card and pill container background)
- **Background Muted (`--bg-muted`):** `#F3F1EB` (Subtle section fills, code blocks, and chip badges)
- **Foreground Primary (`--text-primary`):** `#141413` (Deep graphite carbon, high legibility WCAG AAA)
- **Foreground Secondary (`--text-secondary`):** `#5C5A54` (Warm stone muted copy, WCAG AA compliant)
- **Foreground Tertiary (`--text-tertiary`):** `#8C8980` (Metadata, captions, mono accents)
- **Border Subtle (`--border-subtle`):** `rgba(20, 20, 19, 0.08)` (Delicate hairline separator)
- **Border Default (`--border-default`):** `rgba(20, 20, 19, 0.14)` (Card outlines, pills)
- **Border Focus (`--border-focus`):** `#D9653B` (Warm terracotta amber accent focus ring)
- **Brand Accent Warm (`--accent-brand`):** `#D9653B` (Sarvam-inspired warm Indian saffron/terracotta)
- **Prism Spectrum Dispersion:**
  - Violet: `#8B5CF6`
  - Cyan: `#06B6D4`
  - Emerald: `#10B981`
  - Amber/Gold: `#F59E0B`
  - Rose: `#F43F5E`

### Dark Mode (System & Manual Toggle)
- **Background Root (`--bg-root`):** `#0E0E0D` (Deep obsidian warm-charcoal)
- **Background Surface (`--bg-surface`):** `#171716` (Elevated card background)
- **Background Muted (`--bg-muted`):** `#1F1E1C` (Pill & chip surface)
- **Foreground Primary (`--text-primary`):** `#FAF9F5` (Warm off-white)
- **Foreground Secondary (`--text-secondary`):** `#A8A59D` (Light warm gray)
- **Foreground Tertiary (`--text-tertiary`):** `#706E67`
- **Border Subtle (`--border-subtle`):** `rgba(250, 249, 245, 0.08)`
- **Border Default (`--border-default`):** `rgba(250, 249, 245, 0.16)`
- **Brand Accent Warm (`--accent-brand`):** `#E27D56`

---

## 2. Typography & Editorial Scale

- **Display Headings (`--font-display`):**
  - Font: `"Newsreader"`, `"Playfair Display"`, `"Georgia"`, serif
  - Style: Normal/Medium 400-500, letter-spacing `-0.02em`, editorial grace inspired by Anthropic Frontier Red Team.
  - Fluid scale: `clamp(2.5rem, 5vw + 1rem, 4.5rem)` for Hero H1; `clamp(1.75rem, 3vw + 0.5rem, 2.75rem)` for Section H2.
- **Body & Controls (`--font-sans`):**
  - Font: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `Roboto`, sans-serif
  - Crisp, humanist, neutral legibility. Line height 1.6 for long-form prose.
- **Metadata, Tags & Counters (`--font-mono`):**
  - Font: `ui-monospace`, `"SFMono-Regular"`, `"Menlo"`, `"Monaco"`, monospace
  - Uppercase small-caps style (`font-feature-settings: "smcp"`, letter-spacing `0.08em`, font-size `0.75rem` / 12px).

---

## 3. Spacing, Radii & Shadows

- **Spacing Rhythm:** 4px grid base (`0.25rem`, `0.5rem`, `0.75rem`, `1rem`, `1.5rem`, `2rem`, `3rem`, `4rem`, `6rem`).
- **Border Radii:**
  - Full Pill (`--radius-pill`): `9999px` (Navbar, announcement chip, CTA buttons, scroll pill).
  - Cards (`--radius-card`): `16px` (Sarvam cards standard).
  - Nested elements (`--radius-sm`): `8px` - `12px`.
- **Elevation / Shadows:**
  - Floating Nav: `0 8px 32px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)`, backdrop-filter `blur(16px)`.
  - Card Hover: `0 12px 36px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)`.

---

## 4. Hover Behaviors & Motion Curves

- **Easing Curve:** `cubic-bezier(0.16, 1, 0.3, 1)` (Anthropic & Apple standard snappy ease-out).
- **Duration:** 180ms – 250ms for interactive elements.
- **Card Hover:** Subtle `translateY(-3px)`, slight border luminescence, warm accent tint on icon/indicator.
- **Pill Hover:** Background shift and subtle scale `1.02`, smooth arrow nudge on `Get Started →`.
- **Guards:** `@media (hover: hover) and (pointer: fine)` wrapped around all hover transforms to prevent sticky touch states.

---

## 5. Hero Reference & Light-Refraction Atmosphere

- Structure directly follows the user-provided "Haven" screenshot:
  1. Floating pill navbar centered at top (`9999px` radius, logo left, links center, dark pill action right).
  2. Announcement chip: "Now fine-tuning Llama, Qwen & Mistral" with soft pill border.
  3. Animated hand-drawn Prism logo mark (the centerpiece) above/inline with headline.
  4. Centered headline: *"Models that speak your business."*
  5. Centered subline: *"Fine-tuned on your data. Deployed in your cloud. Measured against your baseline."*
  6. Action group: Primary white/dark pill CTA ("Get Started →") + adjacent text button ("Watch Demo").
  7. Anchored scroll indicator at bottom: "SCROLL ↓" pill.
  8. Atmospheric backdrop: Abstract light refraction canvas/SVG: pure white beam hitting a faceted triangular prism, dispersing into soft spectral wavelengths (violet, cyan, emerald, amber, rose) with subtle film grain and slow parallax drift.

---

## 6. Anthropic-Style Sprite-Sheet Mask Animation

- **Format:** Single high-res WebP sprite sheet (6 columns × 4 rows = 24 frames, transparent background, single-color mask).
- **CSS Masking:** `mask-image` + `-webkit-mask-image`, `mask-size: 600% 400%`, `background-color: currentColor`.
- **JS Controller:** Driven via `requestAnimationFrame` with cubic-bezier easing to frame indices, per-frame hold weights ("on twos" hand-drawn jitter feel), graceful completion on pointerleave, tap toggle on touch, keyboard focusable with visible focus ring, and `@media (prefers-reduced-motion: reduce)` override to static frame 0.
