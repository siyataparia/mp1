/* Your JS here. */
//console.log('Hello World!')
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// current navbar height
const nav = $('.navbar');
const getNavH = () => nav?.getBoundingClientRect().height || 0;

const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// smooth scrolling
function smoothScrollTo(targetId) {
  const el = document.getElementById(targetId);
  if (!el) return;
  const y = Math.max(0, el.offsetTop - getNavH()); // offset for sticky nav
  window.scrollTo({ top: y, behavior: 'smooth' });
}

$$('[data-section], .nav-link, .brand').forEach(a => {
  a.addEventListener('click', (e) => {
    const href = a.getAttribute('href') || '';
    if (href.startsWith('#')) {
      e.preventDefault();
      const id = href.slice(1);
      smoothScrollTo(id);
      // close mobile menu if open
      const menu = $('#nav-menu');
      if (menu?.classList.contains('is-open')) {
        menu.classList.remove('is-open');
        const toggle = $('.nav-toggle');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
      }
    }
  });
});

// navbar shrink on scroll 
function onScrollShrink() {
  if (!nav) return;
  if (window.scrollY > 8) nav.classList.add('navbar--shrink');
  else nav.classList.remove('navbar--shrink');
}

// progress bar 
const progressBar = $('.nav-progress__bar');
const sections = $$('#content > section'); // all top-level sections in main
const navLinks = $$('.nav-link');

function updateProgressBar() {
  if (!progressBar) return;
  const doc = document.documentElement;
  const scrollTop = window.scrollY || doc.scrollTop || 0;
  const scrollHeight = doc.scrollHeight - window.innerHeight;
  const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
  progressBar.style.width = `${pct}%`;
}

function updateActiveNav() {
  if (!navLinks.length) return;
  const navH = getNavH();
  const scrollY = window.scrollY;

  // Special case: bottom of page => last link active
  const atBottom = Math.ceil(scrollY + window.innerHeight) >= document.documentElement.scrollHeight;
  if (atBottom) {
    navLinks.forEach(l => l.classList.remove('is-active'));
    navLinks[navLinks.length - 1]?.classList.add('is-active');
    return;
  }

  // find section directly under the bottom of navbar
  let currentId = sections[0]?.id;
  for (const sec of sections) {
    const top = sec.offsetTop - navH - 1;
    const bottom = top + sec.offsetHeight;
    if (scrollY >= top && scrollY < bottom) {
      currentId = sec.id; break;
    }
  }

  navLinks.forEach(link => {
    const href = link.getAttribute('href') || '';
    const id = href.startsWith('#') ? href.slice(1) : '';
    link.classList.toggle('is-active', id === currentId);
  });
}

// mobile nav toggle
const navToggle = $('.nav-toggle');
const navMenu = $('#nav-menu');
if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const open = navMenu.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
}

// carousel 
(function initCarousel() {
  const track = $('.carousel__track');
  if (!track) return;
  const slides = $$('.carousel__slide', track);
  const dots = $$('.carousel__dot', track.parentElement);
  const prev = $('.carousel__control--prev', track.parentElement);
  const next = $('.carousel__control--next', track.parentElement);

  let index = Math.max(0, slides.findIndex(s => s.classList.contains('is-active')));
  const clamp = (n) => (n + slides.length) % slides.length;

  function setActive(i) {
    index = clamp(i);
    slides.forEach((s, si) => s.classList.toggle('is-active', si === index));
    dots.forEach((d, di) => {
      d.classList.toggle('is-active', di === index);
      d.setAttribute('aria-selected', di === index ? 'true' : 'false');
    });
  }

  prev?.addEventListener('click', () => setActive(index - 1));
  next?.addEventListener('click', () => setActive(index + 1));
  dots.forEach((d, di) => d.addEventListener('click', () => setActive(di)));

  // Optional: arrow keys when focused on controls
  track.parentElement?.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') setActive(index - 1);
    if (e.key === 'ArrowRight') setActive(index + 1);
  });

  // Tip: for instant first render, avoid lazy-loading the first slide image.
  // (In your HTML, you can remove loading="lazy" from the first slide.)
})();

// ===================== 6) Modals (open/close, Esc, focus return) =====================
let lastFocused = null;

function openModalById(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  lastFocused = document.activeElement;

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');

  const focusTarget = modal.querySelector('.modal__close') ||
                      modal.querySelector('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
  focusTarget?.focus();

  const onKey = (e) => {
    if (e.key === 'Escape') closeModal(modal);
    // Basic focus trap
    if (e.key === 'Tab') {
      const focusables = Array.from(modal.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'))
        .filter(el => !el.hasAttribute('disabled'));
      if (!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    }
  };
  modal._onKey = onKey;
  modal.addEventListener('keydown', onKey);
}

function closeModal(modal) {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  if (modal._onKey) modal.removeEventListener('keydown', modal._onKey);
  lastFocused?.focus();
}

$$('.modal-open').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.getAttribute('data-modal');
    if (id) openModalById(id);
  });
});

document.addEventListener('click', (e) => {
  const closeTrigger = e.target.closest('[data-close="modal"]');
  if (closeTrigger) {
    const modal = closeTrigger.closest('.modal');
    if (modal) closeModal(modal);
  }
});

// ===================== 7) Scroll handlers =====================
function onScroll() {
  onScrollShrink();
  updateProgressBar();
  updateActiveNav();
}
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', () => { updateActiveNav(); updateProgressBar(); });

// Initialize once on load
onScroll();
