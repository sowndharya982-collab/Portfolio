// Smooth Canvas Scroll Animation
// Seamless frame sequence scrubber

const START_FRAME = 50;
const END_FRAME = 180;
const TOTAL_FRAMES = END_FRAME - START_FRAME + 1; // 131 frames

const canvas = document.getElementById('animation-canvas');
const ctx = canvas.getContext('2d', { alpha: false });

const images = {};
let loadedImagesCount = 0;
let lastDrawnFrame = -1;
let needsRedraw = true;

// Lerp-based smooth scroll state
let targetProgress = 0;
let currentProgress = 0;
const LERP_FACTOR = 0.09;

// Generate image filename path
function getFramePath(frameNumber) {
  const paddedIndex = String(frameNumber).padStart(3, '0');
  return `portfolio/ezgif-frame-${paddedIndex}.jpg`;
}

// Adjust canvas resolution for retina displays and viewport size
function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const displayWidth = window.innerWidth;
  const displayHeight = window.innerHeight;

  if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
    canvas.width = Math.floor(displayWidth * dpr);
    canvas.height = Math.floor(displayHeight * dpr);
  }

  needsRedraw = true;
}

// Find closest loaded frame if specific frame is still loading
function getNearestLoadedImage(targetIndex) {
  if (images[targetIndex] && images[targetIndex].complete && images[targetIndex].naturalWidth > 0) {
    return images[targetIndex];
  }

  for (let offset = 1; offset <= TOTAL_FRAMES; offset++) {
    const prev = targetIndex - offset;
    if (prev >= START_FRAME && images[prev] && images[prev].complete && images[prev].naturalWidth > 0) {
      return images[prev];
    }
    const next = targetIndex + offset;
    if (next <= END_FRAME && images[next] && images[next].complete && images[next].naturalWidth > 0) {
      return images[next];
    }
  }

  return null;
}

// Render the given frame maintaining high quality and aspect ratio
function drawFrame(frameIndex) {
  const img = getNearestLoadedImage(frameIndex);
  if (!img) return;

  const canvasW = canvas.width;
  const canvasH = canvas.height;

  // Clear canvas with base dark studio color
  ctx.fillStyle = '#0a0a0b';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Contain fit: maintains natural proportions, full height on landscape, full width on portrait
  const scale = Math.min(canvasW / img.naturalWidth, canvasH / img.naturalHeight);
  const drawW = img.naturalWidth * scale;
  const drawH = img.naturalHeight * scale;
  const drawX = (canvasW - drawW) / 2;
  const drawY = (canvasH - drawH) / 2;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, drawX, drawY, drawW, drawH);
}

// Preload all frames
function preloadFrames() {
  // Load initial frame first for instant render
  const firstImg = new Image();
  firstImg.src = getFramePath(START_FRAME);
  firstImg.onload = () => {
    images[START_FRAME] = firstImg;
    loadedImagesCount++;
    needsRedraw = true;
  };

  // Preload remaining frames
  for (let i = START_FRAME + 1; i <= END_FRAME; i++) {
    const img = new Image();
    img.src = getFramePath(i);
    img.onload = () => {
      images[i] = img;
      loadedImagesCount++;
      if (i === lastDrawnFrame) {
        needsRedraw = true;
      }
      if (typeof img.decode === 'function') {
        img.decode().catch(() => {});
      }
    };
  }
}

// Calculate target scroll progress
function updateScrollProgress() {
  const scrollY = window.pageYOffset || document.documentElement.scrollTop;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  targetProgress = maxScroll > 0 ? Math.min(Math.max(scrollY / maxScroll, 0), 1) : 0;
}

// Main animation loop with smooth damping
function renderLoop() {
  const diff = targetProgress - currentProgress;

  if (Math.abs(diff) > 0.0001) {
    currentProgress += diff * LERP_FACTOR;
  } else {
    currentProgress = targetProgress;
  }

  const rawFrame = START_FRAME + currentProgress * (END_FRAME - START_FRAME);
  const targetIndex = Math.min(Math.max(Math.round(rawFrame), START_FRAME), END_FRAME);

  if (targetIndex !== lastDrawnFrame || needsRedraw) {
    drawFrame(targetIndex);
    lastDrawnFrame = targetIndex;
    needsRedraw = false;
  }

  requestAnimationFrame(renderLoop);
}

// Initialize
window.addEventListener('resize', resizeCanvas, { passive: true });
window.addEventListener('scroll', updateScrollProgress, { passive: true });

resizeCanvas();
preloadFrames();
updateScrollProgress();
currentProgress = targetProgress;
requestAnimationFrame(renderLoop);
