/**
 * Prism Navigation & Theme Controller
 * Handles floating pill navbar scroll-shrink, light/dark theme toggle,
 * mobile drawer state, and keyboard accessibility.
 */

export function initNavigation() {
  const navHeader = document.querySelector('.nav-header');
  const themeToggle = document.querySelector('.btn-theme-toggle');
  const mobileToggle = document.querySelector('.btn-mobile-toggle');
  const mobileDrawer = document.querySelector('.mobile-nav-drawer');
  const mobileCloseBtn = document.querySelector('.btn-mobile-close');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-item a');

  // 1. Scroll-shrink behavior for floating pill navbar
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (window.scrollY > 40) {
          navHeader?.classList.add('is-scrolled');
        } else {
          navHeader?.classList.remove('is-scrolled');
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // 2. Theme Toggle Controller
  function getPreferredTheme() {
    const saved = localStorage.getItem('prism-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('prism-theme', theme);
    if (themeToggle) {
      const isDark = theme === 'dark';
      themeToggle.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} theme`);
      const icon = themeToggle.querySelector('svg');
      if (icon) {
        // Change between Sun and Moon SVG
        if (isDark) {
          icon.innerHTML = `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
        } else {
          icon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
        }
      }
    }
  }

  // Initialize theme on page load
  const initialTheme = getPreferredTheme();
  applyTheme(initialTheme);

  // Toggle on click
  themeToggle?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || initialTheme;
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });

  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('prism-theme')) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });

  // 3. Mobile Drawer Navigation
  function openDrawer() {
    if (!mobileDrawer) return;
    mobileDrawer.classList.add('is-open');
    mobileToggle?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    if (!mobileDrawer) return;
    mobileDrawer.classList.remove('is-open');
    mobileToggle?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  mobileToggle?.addEventListener('click', openDrawer);
  mobileCloseBtn?.addEventListener('click', closeDrawer);
  mobileDrawer?.addEventListener('click', (e) => {
    if (e.target === mobileDrawer) closeDrawer();
  });

  mobileNavLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileDrawer?.classList.contains('is-open')) {
      closeDrawer();
    }
  });
}
