/**
 * Prism Main Application Script
 * Vanilla JavaScript orchestrator for navigation, sprite mask icon,
 * atmospheric light refraction parallax, and interactive widgets.
 */

import { initNavigation } from './nav.js';
import './sprite-icon.js';
import { calculateTokenEconomics } from './motion-math.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Navbar & Theme Controller
  initNavigation();

  // 2. Slow Atmospheric Light-Refraction Parallax Drift (Compositor Only)
  const backdrop = document.querySelector('.refraction-backdrop');
  const heroSection = document.querySelector('.hero-section');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (backdrop && heroSection && !prefersReduced.matches) {
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafActive = false;

    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX = x * 35; // max 35px gentle drift
      mouseY = y * 25;

      if (!rafActive) {
        rafActive = true;
        requestAnimationFrame(updateDrift);
      }
    }, { passive: true });

    function updateDrift() {
      currentX += (mouseX - currentX) * 0.05;
      currentY += (mouseY - currentY) * 0.05;

      backdrop.style.transform = `translate(calc(-50% + ${currentX.toFixed(2)}px), calc(-50% + ${currentY.toFixed(2)}px))`;

      if (Math.abs(mouseX - currentX) > 0.1 || Math.abs(mouseY - currentY) > 0.1) {
        requestAnimationFrame(updateDrift);
      } else {
        rafActive = false;
      }
    }
  }

  // 3. Interactive ROI / Token Economics Calculator
  const tokenSlider = document.getElementById('tokenSlider');
  const tokenValDisplay = document.getElementById('tokenValDisplay');
  const monthlySavingsEl = document.getElementById('monthlySavings');
  const annualSavingsEl = document.getElementById('annualSavings');
  const percentSavingsEl = document.getElementById('percentSavings');

  function updateCalculator() {
    if (!tokenSlider) return;
    const tokensMillions = Number(tokenSlider.value) || 50;
    if (tokenValDisplay) tokenValDisplay.textContent = `${tokensMillions}M tokens`;

    const stats = calculateTokenEconomics(tokensMillions, 15.0, 1.20);

    if (monthlySavingsEl) monthlySavingsEl.textContent = `$${stats.monthlySavings.toLocaleString()}`;
    if (annualSavingsEl) annualSavingsEl.textContent = `$${stats.annualSavings.toLocaleString()}`;
    if (percentSavingsEl) percentSavingsEl.textContent = `${stats.percentSaved}%`;
  }

  if (tokenSlider) {
    tokenSlider.addEventListener('input', updateCalculator);
    updateCalculator();
  }

  // 4. Interactive Model Evaluation Comparison Tabs
  const evalTabs = document.querySelectorAll('.eval-tab-btn');
  const evalPromptEl = document.getElementById('evalPrompt');
  const evalBaseEl = document.getElementById('evalBaseOutput');
  const evalPrismEl = document.getElementById('evalPrismOutput');

  const evalDatasets = {
    tax: {
      prompt: "Extract GSTIN, invoice date, HSN items and tax breakup from this unformatted Indian purchase receipt text.",
      base: `Certainly! Here is my best attempt at reading your invoice:

Invoice Details:
- The supplier GSTIN appears to be 29ABCDE1234F1Z5.
- The invoice date was October 14, 2026.
- HSN Code: 84713010 for Computer equipment.
- CGST (9%): INR 4,500
- SGST (9%): INR 4,500
- Total Tax: INR 9,000

Please note that you should double check with your auditor before filing in GSTR-2B. Let me know if you need any other tax help!`,
      prism: `{
  "gstin_supplier": "29ABCDE1234F1Z5",
  "invoice_date": "2026-10-14",
  "hsn_summary": [
    {
      "code": "84713010",
      "taxable_value": 50000.00,
      "cgst_rate": 0.09,
      "cgst_amt": 4500.00,
      "sgst_rate": 0.09,
      "sgst_amt": 4500.00,
      "igst_amt": 0.00
    }
  ],
  "total_invoice_val": 59000.00,
  "schema_validated": true
}`
    },
    legal: {
      prompt: "Parse indemnity clauses and uncapped liability triggers from this Master Services Agreement excerpt.",
      base: `Looking at this contract section, it seems there are some liability provisions mentioned. 

The supplier agrees to indemnify the customer for intellectual property claims. However, Section 14 mentions that liability may be uncapped for gross negligence, but this might be subject to state law interpretation. In summary, be careful about the IP indemnity scope.`,
      prism: `{
  "contract_type": "MSA",
  "indemnity_obligations": [
    {
      "party": "Supplier",
      "scope": "Third-party IP infringement",
      "cap_type": "UNCAPPED",
      "carve_out_reference": "Section 14.2(b)"
    }
  ],
  "aggregate_liability_cap": "12_MONTHS_FEES_PAID",
  "governing_jurisdiction": "Bengaluru, Karnataka, India",
  "compliance_risk_score": 0.88
}`
    },
    support: {
      prompt: "Categorize incoming omnichannel customer issue in Hinglish and route to the correct resolution workflow.",
      base: `The customer says: "Mera refund abhi tak initiate nahi hua account me, 5 din ho gaye order cancel kiye hue."

Analysis:
The customer is asking about a refund in Hindi/English (Hinglish). They seem frustrated because 5 days have passed since cancellation. You should route them to Billing or Customer Support team.`,
      prism: `{
  "detected_language": "hi-Latn (Hinglish)",
  "intent": "REFUND_DELAY_INQUIRY",
  "order_status_context": "CANCELLED_PENDING_SETTLEMENT",
  "urgency_level": "P2_ELEVATED",
  "recommended_action": "TRIGGER_GATEWAY_REQUERY",
  "routing_queue": "in_fintech_settlements",
  "confidence": 0.994
}`
    }
  };

  evalTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      evalTabs.forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');

      const key = tab.getAttribute('data-dataset');
      const data = evalDatasets[key];
      if (data) {
        if (evalPromptEl) evalPromptEl.textContent = data.prompt;
        if (evalBaseEl) evalBaseEl.textContent = data.base;
        if (evalPrismEl) evalPrismEl.textContent = data.prism;
      }
    });
  });

  // 5. Watch Demo Modal / Dialog
  const demoTrigger = document.getElementById('watchDemoBtn');
  const demoModal = document.getElementById('demoModal');
  const demoCloseBtn = document.getElementById('demoCloseBtn');

  if (demoTrigger && demoModal) {
    demoTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      demoModal.showModal();
    });

    demoCloseBtn?.addEventListener('click', () => {
      demoModal.close();
    });

    demoModal.addEventListener('click', (e) => {
      if (e.target === demoModal) {
        demoModal.close();
      }
    });
  }

  // 6. Smooth Scroll for Anchor Links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth' });
        targetEl.setAttribute('tabindex', '-1');
        targetEl.focus({ preventScroll: true });
      }
    });
  });
});
