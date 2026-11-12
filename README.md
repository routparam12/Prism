# Prism — Enterprise LLM Fine-Tuning Marketing Website

Prism is a high-craft marketing website for an enterprise fine-tuning service that adapts open-weight LLMs (Llama 3.3, Qwen 2.5, Mistral) on a business's own data and delivers them hosted or inside the client's own cloud.

Built with **vanilla HTML, CSS, and JavaScript only** (no frontend framework overhead, no Tailwind, no heavy animation libraries), targeting 60fps performance and WCAG AA accessibility.

---

## 1. The `<prism-sprite-icon>` Component

The centerpiece of Prism is the hand-drawn, frame-by-frame logo animation inspired by Anthropic's homepage icon animation.

### Technical Implementation
- **CSS Masking:** Uses `-webkit-mask-image` and `mask-image` with `background-color: currentColor`. The icon automatically inherits light, dark, and brand accent colors with zero color clipping.
- **Sprite Sheet Format:** Single high-resolution 1536×1024 WebP sprite sheet with 24 frames organized in a 6 columns × 4 rows grid (`/assets/sprites/prism-sprite.webp`).
- **Compositor-Friendly Animation:** Driven by `requestAnimationFrame` updating CSS variables `--frame-x` and `--frame-y`. `will-change: mask-position` is only applied during active animation cycles.
- **Organic Pacing:** Elapsed time is mapped through a cubic-bezier easing curve (`cubicEaseInOut`) with per-frame hold weights ("on twos" pacing) so key poses linger slightly rather than ticking mechanically.
- **Interaction States:**
  - **Idle:** Crisp, static resting mark (Frame 0).
  - **Hover:** Plays smoothly once. If hovered mid-cycle, finishes gracefully on mouse leave and eases back to Frame 0 without snapping.
  - **Touch:** Immediate trigger on `pointerdown` / `click` without sticky hover.
  - **Keyboard:** Focusable (`tabindex="0"`), triggers on `Enter` / `Space` with an accessible focus ring.
  - **Reduced Motion:** With `prefers-reduced-motion: reduce`, frame flipping is disabled; displays static Frame 0.

### Component Usage

#### Web Component:
```html
<!-- Hero Large (140px) -->
<prism-sprite-icon
  icon-size="140px"
  duration="1150"
  loop-on-hover="true"
  trigger="both"
  aria-label="Interactive hand-drawn Prism mark">
</prism-sprite-icon>

<!-- Navbar Small (28px) -->
<prism-sprite-icon
  icon-size="28px"
  duration="900"
  trigger="hover"
  aria-label="Prism mark logo">
</prism-sprite-icon>

<!-- Static Footer Mark (no trigger) -->
<prism-sprite-icon
  icon-size="32px"
  trigger="none"
  aria-label="Prism static mark">
</prism-sprite-icon>
```

#### JavaScript Class:
```javascript
import { SpriteIcon } from '/js/sprite-icon.js';

const element = document.querySelector('.my-icon');
const icon = new SpriteIcon(element, {
  spriteSheetUrl: '/assets/sprites/prism-sprite.webp',
  frameCount: 24,
  columns: 6,
  rows: 4,
  duration: 1100,
  loopOnHover: false,
  iconSize: '120px',
  iconColor: 'currentColor',
  trigger: 'both' // 'hover' | 'tap' | 'both' | 'none'
});

// Programmatic control:
icon.play();
icon.reset();
icon.destroy();

// Event listeners:
element.addEventListener('prism:start', () => console.log('Animation started'));
element.addEventListener('prism:end', () => console.log('Animation settled'));
```

---

## 2. How to Swap in Real Hand-Drawn Artwork

To replace the generated placeholder sprite sheet with custom hand-drawn illustrator art:

1. Export your hand-drawn frames as a transparent single-color (e.g. black `#000000` or white) WebP or PNG grid.
2. Save the file to `/assets/sprites/prism-sprite.webp` (and `/public/assets/sprites/prism-sprite.webp`).
3. If your grid dimensions or frame count differ, update the component attributes:
   - `columns`: Number of columns (e.g., `8`)
   - `rows`: Number of rows (e.g., `3`)
   - `frame-count`: Total frames (e.g., `24`)
   - `duration`: Animation duration in ms (e.g., `1200`)
4. Frame 0 should always be the resting, balanced mark.

---

## 3. Tooling & Sprite Generator

A generator script is provided in `/tools`:
- `/tools/generate-sprite.js`: Mathematical curve and line jitter algorithms creating 24 frames of a faceted prism with internal refraction planes and 3 dispersing spectrum rays.
- `/public/generate-sprite.html`: Standalone HTML runner that renders the 1536×1024 canvas and exports WebP data.

To re-run the generator:
```bash
# Served automatically via Vite on port 3000
playwright-cli open http://localhost:3000/generate-sprite.html
```

---

## 4. Design & Architecture Highlights

- **Hero Layout (Haven Reference Match):**
  - Floating pill navbar centered at top (`9999px` radius, backdrop blur, shrinks on scroll).
  - Announcement chip: *"Now fine-tuning Llama, Qwen & Mistral"*.
  - Headline: *"Models that speak your business."*
  - Subline: *"Fine-tuned on your data. Deployed in your cloud. Measured against your baseline."*
  - White pill primary CTA with animated arrow + secondary plain text CTA ("Watch Demo").
  - Anchored *"SCROLL &darr;"* pill indicator at bottom center.
  - Atmospheric light refraction scene with soft spectral dispersion (violet, cyan, emerald, amber, rose) and slow parallax drift.
- **Light & Dark Themes:** Automatic detection via `prefers-color-scheme` with instant manual toggle button in the navbar.
- **Qualification Section (Sarvam-inspired):** 4 editorial cards with subtle hover lift and border shift, plus an upfront guarantee: *"We benchmark prompting and RAG first, and tell you if you don't need fine-tuning."*
- **5-Step Timeline:** Discovery &rarr; Data prep &rarr; Baseline eval &rarr; LoRA training &rarr; Eval report & deploy.
- **Deployment Sovereignty:** Hosted by Prism, In your cloud / VPC, or complete weights handover with Indian DPDP Act compliance.
- **ROI Calculator & Live Prompt Comparison:** Real-time token economics slider and side-by-side prompt output diff.
