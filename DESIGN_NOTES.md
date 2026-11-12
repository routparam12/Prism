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

---

## 7. Cinematic Hero Light Stage (White Light → Glass Prism → Spectral Fan)

### Research Findings from Anthropic (`anthropic.com/institute/econ-scenarios`)
- **Translucent Multiply Layering:** Translucent SVG vector paths composited using `mix-blend-mode: multiply` against warm off-white background paper (`#FAF9F5`). Fills vary between `fill-opacity: 0.24` and `0.68` across muted botanical/mineral tones (`#A2B48B`, `rgb(137,157,112)`).
- **Textural Noise & Filtering:** Subtle SVG filter marker texture (`#mk-marker`) and fine stippled grain prevent flat synthetic digital look and produce authentic watercolor/marker physical qualities.
- **Editorial Restraint:** Absolute positioning (`inset: 0; width: 100%; height: 100%`) contained within charts using negative clip-path insets (`clip-path: inset(0 0 -128px)`), leaving generous breathing room for typography.

### Light Theme Prototype Evaluation: (a) Pro Dark Inset vs. (b) Multiply on Cream
Both rendering techniques were prototyped and visually evaluated:

1. **Option (a) — Pro Dark Inset (Selected Default):**
   - **Visual Execution:** The stage is presented as an obsidian optical theater inset (`border-radius: 20px`, radial obsidian gradient `#141417` to `#080809`, hairline border `rgba(255, 255, 255, 0.12)`, ambient shadow `0 24px 64px -12px rgba(0,0,0,0.5)`).
   - **Optical Fidelity:** Preserves 100% of the luminous additive/screen physics of the visual target (Image 2): the narrow incoming white beam glows with a soft Tyndall halo, the glass prism produces bright internal focal highlights, and the 7 spectral hairline rays (Red `#ff3b30`, Orange `#ff9500`, Yellow `#ffd60a`, Green `#34c759`, Cyan `#32ade6`, Indigo `#5856d6`, Violet `#af52de`) disperse with radiant brilliance.
   - **Contrast & Hierarchy:** Creates a high-craft focal contrast between the warm editorial cream page (`#FAF9F5`) and the pro optical stage, ensuring text above retains WCAG AAA contrast (> 12:1).

2. **Option (b) — Multiply on Cream:**
   - **Visual Execution:** Uses `mix-blend-mode: multiply` directly over the cream canvas with a warm off-white beam with subtle pencil/ink shadow and delicate ink-line glass prism strokes.
   - **Trade-off:** While aesthetically pleasant in an illustration/print diagram sense, it inevitably diminishes the physical feeling of an emitting beam of light, as light cannot additively glow or shine brightly over a light cream substrate.

3. **Implementation Decision:**
   - Option (a) "Dark Inset" is the default presentation.
   - An interactive mode switcher is embedded in the stage header (`Dark Inset` vs `Multiply Cream`), allowing live side-by-side demonstration of both techniques.
   - In Dark Mode, both modes seamlessly converge into the full-bleed dark obsidian environment.

