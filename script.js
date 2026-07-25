/* ================================================================
   MEERA & ARJUN — WEDDING INVITATION
   script.js — loading sequence, mandala generator, scroll reveals,
   countdown, timeline fill, gallery lightbox, RSVP form, music toggle.
================================================================= */
'use strict';

/* ---------------------------------------------------------------
   Small helpers
---------------------------------------------------------------- */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* =================================================================
   1. MANDALA GENERATOR
   Builds a symmetrical gold rosette by rotating one petal path
   around a center point. Reused for the loader, hero corners,
   couple divider, and footer.
================================================================== */
function buildMandala(svg, { petals = 12, radius = 100 } = {}) {
  if (!svg) return;
  const cx = 100, cy = 100;
  const ns = 'http://www.w3.org/2000/svg';

  // Outer + inner guide circles
  [radius * 0.92, radius * 0.62, radius * 0.3].forEach((r) => {
    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', r);
    svg.appendChild(circle);
  });

  // Petal path, repeated with rotation for n-fold symmetry
  const angleStep = 360 / petals;
  for (let i = 0; i < petals; i++) {
    const path = document.createElementNS(ns, 'path');
    const d = `M ${cx} ${cy - radius * 0.28}
               C ${cx + radius * 0.22} ${cy - radius * 0.6}, ${cx + radius * 0.22} ${cy - radius * 0.82}, ${cx} ${cy - radius * 0.92}
               C ${cx - radius * 0.22} ${cy - radius * 0.82}, ${cx - radius * 0.22} ${cy - radius * 0.6}, ${cx} ${cy - radius * 0.28} Z`;
    path.setAttribute('d', d);
    path.setAttribute('transform', `rotate(${i * angleStep} ${cx} ${cy})`);
    svg.appendChild(path);
  }
  return svg;
}

// Build every mandala instance on the page
$$('.mandala').forEach((svg) => {
  const isLoader = svg.classList.contains('mandala--loader');
  buildMandala(svg, { petals: isLoader ? 16 : 12, radius: 92 });
});

/* =================================================================
   1B. PALACE GATE GENERATOR
   Draws one ornate gate half (frame, arch line-work, a small dome
   finial, and a jali lattice grid) into a 200x400 viewBox. Colour
   comes entirely from the CSS classes in style.css. The right panel
   reuses the exact same drawing code, mirrored with a transform, so
   the two halves meet as a single arch at the centre seam.
================================================================== */
function drawGateHalf(target) {
  const ns = 'http://www.w3.org/2000/svg';
  const w = 200, h = 400;
  const make = (tag, attrs, cls) => {
    const el = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    if (cls) el.setAttribute('class', cls);
    target.appendChild(el);
    return el;
  };

  // Outer frame
  make('rect', { x: 6, y: 6, width: w - 12, height: h - 12 }, 'frame');

  // Seam trim along the inner edge (where the two panels meet)
  make('line', { x1: w - 4, y1: 0, x2: w - 4, y2: h }, 'seam');

  // Pointed arch line-work rising toward the seam
  make('path', { d: `M 20 96 C 20 44, ${w - 20} 44, ${w - 4} 6` }, 'arch-a');
  make('path', { d: `M 34 98 C 34 58, ${w - 34} 58, ${w - 16} 20` }, 'arch-b');

  // Small dome finial at the top of the seam
  make('circle', { cx: w - 4, cy: 10, r: 6 }, 'dome');
  make('path', { d: `M ${w - 10} 10 L ${w - 4} 0 L ${w + 2} 10` }, 'dome');

  // Jali lattice — a grid of small diamonds across the lower body
  const cols = 5, rows = 9;
  const marginX = 26, marginY = 130, bottomMargin = 30;
  const cellW = (w - marginX * 2) / cols;
  const cellH = (h - marginY - bottomMargin) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = marginX + c * cellW + cellW / 2;
      const cy = marginY + r * cellH + cellH / 2;
      const s = Math.min(cellW, cellH) * 0.32;
      make('path', { d: `M ${cx} ${cy - s} L ${cx + s} ${cy} L ${cx} ${cy + s} L ${cx - s} ${cy} Z` }, 'lattice');
    }
  }

  // Accent lines bracketing the lattice block
  make('line', { x1: marginX, y1: marginY - 6, x2: w - marginX, y2: marginY - 6 }, 'accent');
  make('line', { x1: marginX, y1: h - bottomMargin, x2: w - marginX, y2: h - bottomMargin }, 'accent');
}

function buildGate(svg, mirror) {
  if (!svg) return;
  const ns = 'http://www.w3.org/2000/svg';
  if (!mirror) { drawGateHalf(svg); return; }
  const g = document.createElementNS(ns, 'g');
  g.setAttribute('transform', 'translate(200,0) scale(-1,1)');
  svg.appendChild(g);
  drawGateHalf(g);
}

buildGate($('#gateLeft'), false);
buildGate($('#gateRight'), true);

/* =================================================================
   2. LOADING SCREEN → WAX SEAL → PALACE GATE ENTRANCE
   Stage 1: a brief progress fill while the mandala draws.
   Stage 2: a wax seal appears — the tap is a genuine user gesture,
            which is what lets background music start (browsers
            block audio autoplay without one).
   Stage 3: the gate panels swing open on their outer hinges and
            the hero entrance plays underneath.
================================================================== */
function runLoader() {
  const stage = $('#loaderStage');
  const bar = $('#loaderProgress');
  const percentLabel = $('#loaderPercent');
  const seal = $('#loaderSeal');
  let progress = 0;

  const tick = setInterval(() => {
    progress += Math.random() * 16 + 6;
    if (progress >= 100) {
      progress = 100;
      clearInterval(tick);
      bar.style.width = '100%';
      percentLabel.textContent = '100%';
      setTimeout(() => {
        stage.classList.add('is-hidden');
        seal.hidden = false;
        // requestAnimationFrame lets the browser register the
        // unhide before the opacity transition starts
        requestAnimationFrame(() => seal.classList.add('is-visible'));
      }, 400);
      return;
    }
    bar.style.width = progress + '%';
    percentLabel.textContent = Math.round(progress) + '%';
  }, 180);
}

function openPalaceGates() {
  const loader = $('#loader');
  const seal = $('#loaderSeal');
  const gateWrap = $('#gateWrap');

  seal.classList.remove('is-visible');
  seal.disabled = true;
  gateWrap.classList.add('is-open');

  // This click is a genuine user gesture — safe to start audio here.
  setMusicPlaying(true);

  setTimeout(() => {
    loader.classList.add('is-hidden');
    document.body.style.overflow = '';
    playHeroEntrance();
  }, 1500);
}

// Lock scroll while loading
document.body.style.overflow = 'hidden';
window.addEventListener('load', () => setTimeout(runLoader, 300));
$('#loaderSeal') && $('#loaderSeal').addEventListener('click', openPalaceGates);

/* =================================================================
   3. HERO ENTRANCE + SCROLL REVEALS (GSAP + ScrollTrigger)
================================================================== */
function playHeroEntrance() {
  if (typeof gsap === 'undefined') return;
  gsap.to('[data-hero]', {
    opacity: 1,
    y: 0,
    duration: 1.1,
    ease: 'power3.out',
    stagger: 0.14,
  });
}

// Initial state for hero elements (revealed by the timeline above)
gsap && gsap.set && gsap.set('[data-hero]', { opacity: 0, y: 28 });

if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);

  $$('[data-reveal]').forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      onEnter: () => el.classList.add('is-visible'),
      onEnterBack: () => el.classList.add('is-visible'),
    });
  });

  // Timeline connector line fills as the section scrolls through view
  const timelineLine = $('#timelineFill');
  const timeline = $('.timeline');
  if (timelineLine && timeline) {
    ScrollTrigger.create({
      trigger: timeline,
      start: 'top 70%',
      end: 'bottom 60%',
      scrub: 0.6,
      onUpdate: (self) => {
        timelineLine.style.height = (self.progress * 100) + '%';
      },
    });
  }
} else {
  // Fallback: reveal everything immediately if GSAP fails to load
  $$('[data-reveal]').forEach((el) => el.classList.add('is-visible'));
}

/* =================================================================
   4. FALLING PETALS
================================================================== */
function spawnPetal() {
  const container = $('#petals');
  if (!container) return;
  const petal = document.createElement('span');
  petal.className = 'petal';

  const left = Math.random() * 100;
  const duration = 9 + Math.random() * 8;
  const swayDuration = 3 + Math.random() * 3;
  const size = 7 + Math.random() * 8;
  const rotate = Math.random() * 360;

  petal.style.left = left + 'vw';
  petal.style.width = size + 'px';
  petal.style.height = size * 1.15 + 'px';
  petal.style.animationDuration = `${duration}s, ${swayDuration}s`;
  petal.style.transform = `rotate(${rotate}deg)`;
  petal.style.opacity = (0.35 + Math.random() * 0.35).toFixed(2);

  container.appendChild(petal);
  setTimeout(() => petal.remove(), duration * 1000);
}

// Gentle, capped petal stream — keeps things ambient, not distracting
setInterval(spawnPetal, 900);
for (let i = 0; i < 6; i++) setTimeout(spawnPetal, i * 300);

/* =================================================================
   5. STICKY HEADER
================================================================== */
const header = $('#siteHeader');
const hero = $('#hero');

function updateHeader() {
  if (!header || !hero) return;
  const heroBottom = hero.getBoundingClientRect().bottom;
  header.classList.toggle('is-visible', heroBottom < 80);
  header.classList.toggle('is-solid', window.scrollY > 40);
}
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

/* =================================================================
   6. MOBILE MENU
================================================================== */
const menuToggle = $('#menuToggle');
const menuOverlay = $('#menuOverlay');
const menuClose = $('#menuClose');

function openMenu() {
  menuOverlay.classList.add('is-open');
  menuOverlay.setAttribute('aria-hidden', 'false');
  menuToggle.setAttribute('aria-expanded', 'true');
}
function closeMenu() {
  menuOverlay.classList.remove('is-open');
  menuOverlay.setAttribute('aria-hidden', 'true');
  menuToggle.setAttribute('aria-expanded', 'false');
}

menuToggle && menuToggle.addEventListener('click', openMenu);
menuClose && menuClose.addEventListener('click', closeMenu);
$$('.menu-link').forEach((link) => link.addEventListener('click', closeMenu));

/* =================================================================
   7. COUNTDOWN TIMER
   Set your real ceremony date/time below (local time of the browser).
================================================================== */
const WEDDING_DATE = new Date('2026-12-12T10:30:00');

function updateCountdown() {
  const now = new Date();
  let diff = WEDDING_DATE - now;
  if (diff < 0) diff = 0;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  setCountdownValue('cd-days', days);
  setCountdownValue('cd-hours', hours);
  setCountdownValue('cd-minutes', minutes);
  setCountdownValue('cd-seconds', seconds);
}

function setCountdownValue(id, value) {
  const el = $('#' + id);
  if (!el) return;
  const formatted = String(value).padStart(2, '0');
  if (el.textContent !== formatted) {
    el.textContent = formatted;
    el.classList.remove('pulse');
    // Force reflow so the animation can retrigger every second
    void el.offsetWidth;
    el.classList.add('pulse');
  }
}

updateCountdown();
setInterval(updateCountdown, 1000);

/* =================================================================
   8. GALLERY LIGHTBOX
================================================================== */
const galleryItems = $$('.gallery-item');
const lightbox = $('#lightbox');
const lightboxStage = $('#lightboxStage');
const lightboxCaption = $('#lightboxCaption');
let currentIndex = 0;

function openLightbox(index) {
  currentIndex = index;
  renderLightbox();
  lightbox.classList.add('is-open');
  lightbox.setAttribute('aria-hidden', 'false');
}
function closeLightbox() {
  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden', 'true');
}
function renderLightbox() {
  const item = galleryItems[currentIndex];
  if (!item) return;
  // Reuse the gallery tile's gradient background for the large stage
  lightboxStage.style.background = getComputedStyle(item).backgroundImage;
  lightboxCaption.textContent = item.dataset.caption || '';
}
function showNext() { currentIndex = (currentIndex + 1) % galleryItems.length; renderLightbox(); }
function showPrev() { currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length; renderLightbox(); }

galleryItems.forEach((item, i) => item.addEventListener('click', () => openLightbox(i)));
$('#lightboxClose') && $('#lightboxClose').addEventListener('click', closeLightbox);
$('#lightboxNext') && $('#lightboxNext').addEventListener('click', showNext);
$('#lightboxPrev') && $('#lightboxPrev').addEventListener('click', showPrev);

lightbox && lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('is-open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') showNext();
  if (e.key === 'ArrowLeft') showPrev();
});

// Basic swipe support for touch devices
let touchStartX = 0;
lightbox && lightbox.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
lightbox && lightbox.addEventListener('touchend', (e) => {
  const delta = e.changedTouches[0].screenX - touchStartX;
  if (Math.abs(delta) > 40) delta > 0 ? showPrev() : showNext();
}, { passive: true });

/* =================================================================
   9. RSVP FORM
   No backend is wired up here — connect this to your own endpoint
   (Formspree, EmailJS, Google Forms, etc.) by replacing the
   fakeSubmit() call below with a real fetch() request.
================================================================== */
const rsvpForm = $('#rsvpForm');
const rsvpSubmit = $('#rsvpSubmit');
const rsvpSuccess = $('#rsvpSuccess');
const mealField = $('#mealField');
const attendRadios = $$('input[name="attending"]');

function syncMealField() {
  const attending = $('input[name="attending"]:checked');
  if (!mealField) return;
  mealField.classList.toggle('is-hidden', !(attending && attending.value === 'yes'));
}
attendRadios.forEach((r) => r.addEventListener('change', syncMealField));
syncMealField();

function fakeSubmit() {
  // Simulated network delay — replace with a real request.
  return new Promise((resolve) => setTimeout(resolve, 1200));
}

rsvpForm && rsvpForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!rsvpForm.checkValidity()) {
    rsvpForm.reportValidity();
    return;
  }

  rsvpSubmit.classList.add('is-loading');
  rsvpSubmit.disabled = true;

  await fakeSubmit();

  rsvpForm.hidden = true;
  rsvpSuccess.hidden = false;
});

/* =================================================================
   10. BACKGROUND MUSIC
   Autoplay is blocked by browsers until the user interacts, so the
   button starts muted/paused and toggles on tap. Add your track at
   assets/music.mp3.
================================================================== */
const musicToggle = $('#musicToggle');
const bgMusic = $('#bgMusic');
let isPlaying = false;

async function setMusicPlaying(playing) {
  try {
    if (playing) {
      await bgMusic.play();
    } else {
      bgMusic.pause();
    }
    isPlaying = playing;
  } catch (err) {
    // No audio file present at assets/music.mp3, or playback was
    // blocked — fail silently rather than breaking the UI.
    isPlaying = false;
  }
  musicToggle.classList.toggle('is-playing', isPlaying);
  musicToggle.setAttribute('aria-pressed', String(isPlaying));
  musicToggle.setAttribute('aria-label', isPlaying ? 'Pause background music' : 'Play background music');
}

musicToggle && musicToggle.addEventListener('click', () => setMusicPlaying(!isPlaying));
                
