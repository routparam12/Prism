/**
 * Bespoke Anthropic-inspired Animated Icons (<prism-animated-icon>)
 * Replaces static utility/editorial icons across the entire site with
 * stippled, hand-drawn optical & engineering micro-animations.
 * Pure CSS-composited SVG animations paused automatically when off-screen.
 */

const ICON_TEMPLATES = {
  // Card 3: Lower cost or latency (70B -> 8B compaction & sub-100ms pulse)
  compaction: `
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="16" cy="16" r="12" stroke-dasharray="3 3.5" class="anim-orbit-slow" opacity="0.55" />
      <circle cx="16" cy="16" r="8" stroke-dasharray="16 6" class="anim-orbit-rev" opacity="0.8" />
      <circle cx="16" cy="16" r="3.4" fill="currentColor" stroke="none" class="anim-core-pulse" />
      <path d="M16 2v4M16 26v4M2 16h4M26 16h4" class="anim-inward-ticks" opacity="0.7" />
    </svg>
  `,

  // Card 4: Data that can't leave your environment (Zero-egress enclave vault)
  enclave: `
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="4" y="4" width="24" height="24" rx="6" stroke-dasharray="4 3" class="anim-dash-crawl" opacity="0.45" />
      <rect x="9" y="14.5" width="14" height="10" rx="2.5" />
      <path d="M11.5 14.5v-3.5a4.5 4.5 0 0 1 9 0v3.5" class="anim-shackle-breathe" />
      <circle cx="16" cy="19.5" r="1.6" fill="currentColor" stroke="none" class="anim-core-pulse" />
    </svg>
  `,

  // Engineering Guarantee Callout: Precision benchmark sweep
  benchmark: `
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="16" cy="16" r="11.5" stroke-dasharray="5 3" class="anim-orbit-slow" opacity="0.5" />
      <path d="M9.5 19.5A7.5 7.5 0 0 1 22.5 19.5" opacity="0.85" />
      <line x1="16" y1="19" x2="21" y2="11.5" class="anim-needle-sweep" />
      <circle cx="16" cy="19" r="2" fill="currentColor" stroke="none" />
    </svg>
  `,

  // Phase 01: Discovery (Scanning lens / target)
  discovery: `
    <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="14" cy="14" r="9.5" stroke-dasharray="3 3" class="anim-orbit-slow" opacity="0.6" />
      <circle cx="14" cy="14" r="5" class="anim-ring-breathe" />
      <circle cx="14" cy="14" r="1.7" fill="currentColor" stroke="none" />
    </svg>
  `,

  // Phase 02: Data Prep (Sanitized token stream)
  dataprep: `
    <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 8h18M8 14h12M11 20h6" stroke-dasharray="4 3" class="anim-dash-crawl" />
      <circle cx="14" cy="23.5" r="1.6" fill="currentColor" stroke="none" class="anim-core-pulse" />
    </svg>
  `,

  // Phase 03: Baseline Eval (Oscillating comparative bars)
  eval: `
    <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="7" y1="22" x2="7" y2="13" class="anim-bar-1" />
      <line x1="14" y1="22" x2="14" y2="7" class="anim-bar-2" />
      <line x1="21" y1="22" x2="21" y2="10" class="anim-bar-3" />
      <line x1="4" y1="22.5" x2="24" y2="22.5" opacity="0.45" stroke-width="1.5" />
    </svg>
  `,

  // Phase 04: LoRA Training (Converging neural adapter nodes)
  training: `
    <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <line x1="7" y1="7" x2="14" y2="14" stroke-dasharray="2.5 2.5" class="anim-dash-crawl" />
      <line x1="21" y1="7" x2="14" y2="14" stroke-dasharray="2.5 2.5" class="anim-dash-crawl" />
      <line x1="7" y1="21" x2="14" y2="14" stroke-dasharray="2.5 2.5" class="anim-dash-crawl" />
      <line x1="21" y1="21" x2="14" y2="14" stroke-dasharray="2.5 2.5" class="anim-dash-crawl" />
      <circle cx="7" cy="7" r="2.1" />
      <circle cx="21" cy="7" r="2.1" />
      <circle cx="7" cy="21" r="2.1" />
      <circle cx="21" cy="21" r="2.1" />
      <circle cx="14" cy="14" r="3" fill="currentColor" stroke="none" class="anim-core-pulse" />
    </svg>
  `,

  // Phase 05: Eval & Deploy (Sovereign model lift)
  deploy: `
    <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="5" y="18" width="18" height="5" rx="1.5" opacity="0.6" />
      <path d="M14 15V5" class="anim-float-up" />
      <polyline points="9.5 9.5 14 5 18.5 9.5" class="anim-float-up" />
    </svg>
  `,

  // Delivery Option 01: Hosted Endpoint Pulse
  hosted: `
    <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="14" cy="14" r="3.2" fill="currentColor" stroke="none" class="anim-core-pulse" />
      <circle cx="14" cy="14" r="7.2" stroke-dasharray="10 4" class="anim-orbit-slow" />
      <circle cx="14" cy="14" r="11.2" stroke-dasharray="3 4" class="anim-orbit-rev" opacity="0.55" />
    </svg>
  `,

  // Delivery Option 02: Private Cloud / VPC Shield Boundary
  vpc: `
    <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="14,3.5 23,8 23,15.5 14,24.5 5,15.5 5,8" stroke-dasharray="4 2.5" class="anim-dash-crawl" opacity="0.65" />
      <polygon points="14,7.5 19.5,10.5 19.5,15.5 14,20.5 8.5,15.5 8.5,10.5" class="anim-ring-breathe" />
      <circle cx="14" cy="14" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  `,

  // Delivery Option 03: Weights Handover Cube
  weights: `
    <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <g class="anim-float-gentle">
        <polygon points="14,4 23,9 23,19 14,24 5,19 5,9" />
        <polyline points="5,9 14,14 23,9" />
        <line x1="14" y1="14" x2="14" y2="24" />
      </g>
    </svg>
  `
};

export class PrismAnimatedIconElement extends HTMLElement {
  static get observedAttributes() {
    return ['name', 'size'];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal !== newVal && this.isConnected) {
      this.render();
    }
  }

  render() {
    const name = this.getAttribute('name') || 'compaction';
    const size = this.getAttribute('size') || '24px';
    const svg = ICON_TEMPLATES[name] || ICON_TEMPLATES.compaction;

    this.classList.add('prism-anim-icon');
    this.style.setProperty('--anim-icon-size', size);
    this.innerHTML = svg;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('prism-animated-icon')) {
  customElements.define('prism-animated-icon', PrismAnimatedIconElement);
}
