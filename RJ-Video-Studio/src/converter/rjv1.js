export const RJV1 = Object.freeze({
  HEADER_SIZE: 40,
  WIDTH: 128,
  HEIGHT: 64,
  FRAME_SIZE: 1024,
  VERSION: 1,
  PIXEL_FORMAT_MONO_1BPP: 1,
  MAX_FPS: 10,
  MAX_FRAMES: 600,
  MAX_DURATION_SECONDS: 60
});

function waitForSeek(video, time) {
  if (Math.abs(video.currentTime - time) < 0.0005) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error('The browser could not decode a video frame.'));
    };
    const cleanup = () => {
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
    };
    video.addEventListener('seeked', onSeeked, { once: true });
    video.addEventListener('error', onError, { once: true });
    video.currentTime = time;
  });
}

function renderFitFrame(video, canvas, context) {
  const scale = Math.min(RJV1.WIDTH / video.videoWidth, RJV1.HEIGHT / video.videoHeight);
  const width = Math.max(1, Math.round(video.videoWidth * scale));
  const height = Math.max(1, Math.round(video.videoHeight * scale));
  const x = Math.floor((RJV1.WIDTH - width) / 2);
  const y = Math.floor((RJV1.HEIGHT - height) / 2);
  context.fillStyle = '#000';
  context.fillRect(0, 0, RJV1.WIDTH, RJV1.HEIGHT);
  context.drawImage(video, x, y, width, height);
  return context.getImageData(0, 0, RJV1.WIDTH, RJV1.HEIGHT);
}

function ditherAndPack(imageData) {
  const width = RJV1.WIDTH;
  const height = RJV1.HEIGHT;
  const gray = new Float32Array(width * height);
  for (let i = 0; i < gray.length; i++) {
    const p = i * 4;
    gray[i] = imageData.data[p] * 0.299 + imageData.data[p + 1] * 0.587 + imageData.data[p + 2] * 0.114;
  }

  const pixels = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      const oldValue = gray[index];
      const newValue = oldValue >= 128 ? 255 : 0;
      const error = oldValue - newValue;
      pixels[index] = newValue === 255 ? 1 : 0;
      if (x + 1 < width) gray[index + 1] += error * 7 / 16;
      if (y + 1 < height) {
        if (x > 0) gray[index + width - 1] += error * 3 / 16;
        gray[index + width] += error * 5 / 16;
        if (x + 1 < width) gray[index + width + 1] += error / 16;
      }
    }
  }

  const packed = new Uint8Array(RJV1.FRAME_SIZE);
  for (let i = 0; i < pixels.length; i++) {
    if (pixels[i]) packed[i >> 3] |= 1 << (7 - (i & 7));
  }
  return { packed, pixels };
}

function createHeader({ fps, frameCount, durationMs, videoId }) {
  const header = new ArrayBuffer(RJV1.HEADER_SIZE);
  const view = new DataView(header);
  const bytes = new Uint8Array(header);
  bytes.set([0x52, 0x4a, 0x56, 0x31], 0); // ASCII "RJV1"
  view.setUint8(4, RJV1.VERSION);
  view.setUint8(5, RJV1.HEADER_SIZE);
  view.setUint16(6, RJV1.WIDTH, true);
  view.setUint16(8, RJV1.HEIGHT, true);
  view.setUint8(10, fps);
  view.setUint8(11, RJV1.PIXEL_FORMAT_MONO_1BPP);
  view.setUint32(12, frameCount, true);
  view.setUint32(16, RJV1.FRAME_SIZE, true);
  view.setUint32(20, durationMs, true);
  view.setUint16(24, 0, true); // flags
  // Bytes 26-31 are reserved and remain zero.
  bytes.set(videoId, 32);
  return bytes;
}

export async function convertVideoToRJV1(video, { fps, duration, onProgress = () => {}, onFrame = () => {} }) {
  if (!video.videoWidth || !video.videoHeight) throw new Error('Video metadata is not ready.');
  if (![1, 2, 5, 10].includes(fps)) throw new Error('Choose 1, 2, 5, or 10 FPS.');
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('Video duration is invalid.');

  const safeDuration = Math.min(duration, RJV1.MAX_DURATION_SECONDS);
  const frameCount = Math.min(Math.ceil(safeDuration * fps), RJV1.MAX_FRAMES);
  if (frameCount < 1) throw new Error('The video is too short to convert.');

  const canvas = document.createElement('canvas');
  canvas.width = RJV1.WIDTH;
  canvas.height = RJV1.HEIGHT;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas is not available in this browser.');

  const videoId = new Uint8Array(8);
  crypto.getRandomValues(videoId);
  const header = createHeader({
    fps,
    frameCount,
    durationMs: Math.round(safeDuration * 1000),
    videoId
  });

  const chunks = [header];
  const originalTime = video.currentTime;
  try {
    for (let frame = 0; frame < frameCount; frame++) {
      const time = Math.min(frame / fps, Math.max(0, safeDuration - 0.001));
      await waitForSeek(video, time);
      const image = renderFitFrame(video, canvas, context);
      const { packed, pixels } = ditherAndPack(image);
      chunks.push(packed);
      onFrame(pixels);
      onProgress(frame + 1, frameCount);
      // Yield to the UI so progress and preview remain responsive.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  } finally {
    try {
      await waitForSeek(video, Math.min(originalTime, Math.max(0, video.duration - 0.001)));
    } catch {
      // Preserve the conversion result even if restoring the preview position fails.
    }
  }

  return new Blob(chunks, { type: 'application/octet-stream' });
}

export function makeOutputName(inputName) {
  const base = inputName.replace(/\.[^.]+$/, '').trim() || 'RJ_Video';
  return `${base}.rjv`;
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
