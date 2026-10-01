/**
 * 3D Scroll-Driven Architecture Animation
 * Features full-width horizontal rendering, sticky scroll scrubbing,
 * progressive frame preloading, and seamless transition to sections below.
 */

const TOTAL_FRAMES = 210;
const FRAME_BASE_PATH = '/frames/ezgif-frame-';
const FRAME_EXTENSION = '.png';
const FRAME_WIDTH = 1280;
const FRAME_HEIGHT = 720;

const state = {
  currentFrame: 1,
  targetFrame: 1,
  renderedFrame: -1,
  loadedCount: 0,
  isReady: false
};

const images = new Array(TOTAL_FRAMES + 1);

const canvas = document.getElementById('animation-canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const loader = document.getElementById('loader');
const loaderBar = document.getElementById('loader-bar');
const loaderText = document.getElementById('loader-text');
const scrollProgressBar = document.getElementById('scroll-progress-bar');
const scrollProgressTrack = document.getElementById('scroll-progress-track');
const scrollAnimationSection = document.getElementById('scroll-animation-section');
const animationHud = document.getElementById('animation-hud');

function getFrameSrc(index) {
  return `${FRAME_BASE_PATH}${String(index).padStart(3, '0')}${FRAME_EXTENSION}`;
}

/**
 * Handle canvas resizing with DevicePixelRatio
 */
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  state.renderedFrame = -1;
  renderFrame();
}

/**
 * Draw image full screen horizontally (edge-to-edge 100% width)
 * maintaining aspect ratio and vertically centered
 */
function drawContainedImage(img) {
  const cw = canvas.width;
  const ch = canvas.height;
  if (!cw || !ch) return;

  const iw = img.naturalWidth || FRAME_WIDTH;
  const ih = img.naturalHeight || FRAME_HEIGHT;

  // Scale to fill full screen horizontally
  const scale = cw / iw;
  const dw = cw;
  const dh = Math.round(ih * scale);
  const dx = 0;
  const dy = Math.round((ch - dh) / 2);

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(img, dx, dy, dw, dh);
}

/**
 * Render the current frame to canvas
 */
function renderFrame() {
  const frameIdx = Math.max(1, Math.min(TOTAL_FRAMES, Math.round(state.currentFrame)));
  if (state.renderedFrame === frameIdx) return;

  const img = images[frameIdx];
  if (img && img.complete && img.naturalWidth > 0) {
    drawContainedImage(img);
    state.renderedFrame = frameIdx;
  } else {
    // If exact frame is still buffering, use closest loaded frame to prevent black flash
    for (let offset = 1; offset < 25; offset++) {
      const prev = images[frameIdx - offset];
      if (prev && prev.complete) {
        drawContainedImage(prev);
        break;
      }
      const next = images[frameIdx + offset];
      if (next && next.complete) {
        drawContainedImage(next);
        break;
      }
    }
  }

  // Update minimal scroll progress indicator
  if (scrollProgressBar) {
    const progressPct = ((frameIdx - 1) / (TOTAL_FRAMES - 1)) * 100;
    scrollProgressBar.style.width = `${progressPct}%`;
  }
}

/**
 * Page Scroll Listener:
 * Maps scroll position through the sticky 3D section to animation frames (1 to 210)
 */
function onScroll() {
  if (!scrollAnimationSection) return;

  const rect = scrollAnimationSection.getBoundingClientRect();
  const maxScroll = scrollAnimationSection.offsetHeight - window.innerHeight;
  if (maxScroll <= 0) return;

  const scrolled = Math.max(0, -rect.top);
  const progress = Math.min(1, Math.max(0, scrolled / maxScroll));

  state.targetFrame = 1 + progress * (TOTAL_FRAMES - 1);

  // Smoothly fade out the HUD as the user scrolls into the disassembly
  if (animationHud) {
    const hudOpacity = Math.max(0, 1 - progress * 4);
    animationHud.style.opacity = hudOpacity;
  }

  // Scroll-triggered info boxes — sequential reveal, no overlapping
  // Left boxes (1 & 5) never overlap: 1 hides before 5 appears
  // Right boxes (2 & 6) never overlap: 2 hides before 6 appears
  // Center boxes (3 & 4) swap at midpoint: only one visible at a time
  const infoBoxThresholds = [
    { id: 'info-box-1', showAt: 0.06, hideAt: 0.28 },   // LEFT — early
    { id: 'info-box-2', showAt: 0.12, hideAt: 0.35 },   // RIGHT — early
    { id: 'info-box-3', showAt: 0.30, hideAt: 0.50 },   // CENTER — mid (30-40% opacity via CSS)
    { id: 'info-box-4', showAt: 0.52, hideAt: 0.72 },   // CENTER — mid-late (30-40% opacity via CSS)
    { id: 'info-box-5', showAt: 0.55, hideAt: 0.78 },   // LEFT — late
    { id: 'info-box-6', showAt: 0.60, hideAt: 0.82 }    // RIGHT — late
  ];

  infoBoxThresholds.forEach(({ id, showAt, hideAt }) => {
    const box = document.getElementById(id);
    if (!box) return;
    if (progress >= showAt && progress <= hideAt) {
      box.classList.add('visible');
    } else {
      box.classList.remove('visible');
    }
  });

  // 3D headphone widget — disappear when scroll animation ends, reappear at start
  const mini3dWidget = document.getElementById('mini-3d-widget');
  if (mini3dWidget) {
    if (progress >= 0.90) {
      // Fade out smoothly when animation is near the end
      mini3dWidget.style.opacity = '0';
      mini3dWidget.style.pointerEvents = 'none';
    } else {
      // Fade back in when scrolling back toward the start
      mini3dWidget.style.opacity = '1';
      mini3dWidget.style.pointerEvents = 'auto';
    }
  }
}

/**
 * Click-to-Jump on progress bar track
 */
if (scrollProgressTrack) {
  scrollProgressTrack.addEventListener('click', (e) => {
    const rect = scrollProgressTrack.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (scrollAnimationSection) {
      const maxScroll = scrollAnimationSection.offsetHeight - window.innerHeight;
      window.scrollTo({
        top: scrollAnimationSection.offsetTop + pct * maxScroll,
        behavior: 'smooth'
      });
    }
  });
}

/**
 * 60 FPS Physics Loop with spring damping
 */
function tick() {
  const diff = state.targetFrame - state.currentFrame;
  if (Math.abs(diff) > 0.01) {
    state.currentFrame += diff * 0.14; // Buttery-smooth damping
  } else {
    state.currentFrame = state.targetFrame;
  }

  renderFrame();
  requestAnimationFrame(tick);
}

/**
 * Progressive Preloading for all 210 frames
 */
function preloadFrames() {
  const queue = [];
  // Prioritize keyframes first
  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    if (i === 1 || i % 4 === 0 || i === TOTAL_FRAMES) queue.push(i);
  }
  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    if (!queue.includes(i)) queue.push(i);
  }

  let count = 0;
  const total = queue.length;

  function loadNext(idx) {
    if (idx >= total) return;

    const frameNum = queue[idx];
    const img = new Image();

    img.onload = () => {
      images[frameNum] = img;
      count++;
      state.loadedCount = count;

      const pct = Math.round((count / total) * 100);
      if (loaderBar) loaderBar.style.width = `${pct}%`;
      if (loaderText) loaderText.textContent = `Loading ${pct}%`;

      if (frameNum === 1 || state.renderedFrame === -1) {
        renderFrame();
      }

      // Hide loader once initial batch is ready for zero perceived delay
      if (count >= 25 && !state.isReady) {
        state.isReady = true;
        if (loader) loader.classList.add('hidden');
        resizeCanvas();
        onScroll();
      }

      loadNext(idx + 1);
    };

    img.onerror = () => {
      count++;
      loadNext(idx + 1);
    };

    img.src = getFrameSrc(frameNum);
  }

  const concurrency = 6;
  for (let c = 0; c < concurrency; c++) {
    loadNext(c * Math.floor(total / concurrency));
  }
}

function init() {
  resizeCanvas();

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    resizeCanvas();
    onScroll();
  }, { passive: true });

  onScroll();
  preloadFrames();
  tick();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
