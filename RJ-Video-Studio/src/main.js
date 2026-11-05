import './style.css';
import { convertVideoToRJV1, formatBytes, makeOutputName } from './converter/rjv1.js';

const app = document.querySelector('#app');

app.innerHTML = `
  <header class="topbar">
    <a class="brand" href="#" aria-label="RJ Video Studio home">
      <span class="brand-mark">RJ</span>
      <span><strong>RJ Video Studio</strong><small>OLED video converter</small></span>
    </a>
    <span class="version-pill">RJV1 · 128 × 64</span>
  </header>

  <main class="shell">
    <section class="intro">
      <div>
        <p class="eyebrow">CREATE FOR YOUR RJ</p>
        <h1>Turn a video into<br /><span>an RJ moment.</span></h1>
        <p class="intro-copy">Convert a short video into a compact monochrome animation for the RJ OLED display.</p>
      </div>
      <div class="intro-device" aria-hidden="true">
        <div class="device-screen"><span class="eye eye-left"></span><span class="eye eye-right"></span><span class="mouth"></span></div>
        <span class="device-caption">RJ · 128 × 64</span>
      </div>
    </section>

    <section class="workspace">
      <div class="section-heading">
        <div><p class="eyebrow">01 / SOURCE VIDEO</p><h2>Choose your video</h2></div>
        <span class="subtle">Processed locally in this browser</span>
      </div>
      <label class="dropzone" id="dropzone" for="video-file">
        <input id="video-file" type="file" accept="video/*,.mp4,.mov,.webm,.m4v,.avi" />
        <span class="upload-icon">↑</span>
        <strong>Drop a video here or <u>browse files</u></strong>
        <span class="subtle">Choose a video your browser can play · Maximum output duration 60 seconds</span>
      </label>
      <div class="source-details hidden" id="source-details">
        <div class="file-icon">▶</div>
        <div class="file-meta"><strong id="file-name">video.mp4</strong><span id="file-info">Loading video…</span></div>
        <button class="text-button" id="remove-video" type="button">Remove</button>
      </div>
    </section>

    <section class="workspace">
      <div class="section-heading">
        <div><p class="eyebrow">02 / OUTPUT SETTINGS</p><h2>Set your conversion</h2></div>
      </div>
      <div class="settings-grid">
        <label class="setting-card">
          <span class="setting-label">Frame rate</span>
          <select id="fps">
            <option value="1">1 FPS · Smooth storage</option>
            <option value="2">2 FPS</option>
            <option value="5" selected>5 FPS · Recommended</option>
            <option value="10">10 FPS · More motion</option>
          </select>
          <small>Maximum 10 frames per second</small>
        </label>
        <div class="setting-card">
          <span class="setting-label">Display size</span>
          <strong class="setting-value">128 × 64 px</strong>
          <small>Monochrome · 1 bit per pixel</small>
        </div>
        <div class="setting-card">
          <span class="setting-label">Fit mode</span>
          <strong class="setting-value">Contain</strong>
          <small>Keep full frame, add black bars</small>
        </div>
        <div class="setting-card">
          <span class="setting-label">Audio</span>
          <strong class="setting-value">Removed</strong>
          <small>RJV1 stores video frames only</small>
        </div>
      </div>
    </section>

    <section class="workspace preview-workspace">
      <div class="section-heading">
        <div><p class="eyebrow">03 / PREVIEW</p><h2>Original vs RJ display</h2></div>
        <span class="subtle">Preview uses the first frame</span>
      </div>
      <div class="preview-grid">
        <div class="preview-panel">
          <div class="preview-label">ORIGINAL VIDEO</div>
          <div class="original-frame" id="original-frame"><span>Select a video to preview</span></div>
        </div>
        <div class="preview-panel">
          <div class="preview-label">RJ OLED · 128 × 64</div>
          <div class="oled-frame"><canvas id="oled-preview" width="128" height="64"></canvas></div>
        </div>
      </div>
      <p class="preview-note" id="preview-note">The OLED preview will appear after you choose a video.</p>
    </section>

    <section class="workspace">
      <div class="section-heading">
        <div><p class="eyebrow">04 / EXPORT</p><h2>Build your RJV file</h2></div>
      </div>
      <div class="export-row">
        <div><span class="setting-label">Estimated output size</span><strong class="estimate" id="estimate">—</strong><small id="estimate-detail">Choose a video to calculate</small></div>
        <button class="primary-button" id="convert" type="button" disabled>Convert to .rjv <span>→</span></button>
      </div>
      <div class="progress-wrap hidden" id="progress-wrap">
        <div class="progress-top"><span id="progress-label">Preparing video…</span><strong id="progress-value">0%</strong></div>
        <div class="progress-track"><div id="progress-bar"></div></div>
      </div>
      <div class="result hidden" id="result">
        <div class="result-check">✓</div>
        <div class="result-copy"><strong id="result-name">video.rjv</strong><span id="result-info">Conversion complete</span></div>
        <button class="download-button" id="download" type="button">Download .rjv</button>
      </div>
      <p class="privacy-note">Your source video is processed on your device. This prototype does not upload videos to a server.</p>
      <p class="error-message hidden" id="error-message" role="alert"></p>
    </section>

    <footer><span>RJ Video Studio <span class="dot">·</span> Early development build</span><span>Made for RJ OLED · RJV1</span></footer>
  </main>
  <video id="decoder" muted playsinline preload="metadata" class="hidden"></video>
`;

const $ = (selector) => document.querySelector(selector);
const input = $('#video-file');
const decoder = $('#decoder');
const originalFrame = $('#original-frame');
const oledCanvas = $('#oled-preview');
const oledContext = oledCanvas.getContext('2d', { willReadFrequently: true });
const fpsSelect = $('#fps');
let sourceFile = null;
let sourceUrl = null;
let outputBlob = null;
let outputName = '';
let sourceDuration = 0;

function setError(message) {
  $('#error-message').textContent = message;
  $('#error-message').classList.remove('hidden');
}

function clearError() {
  $('#error-message').textContent = '';
  $('#error-message').classList.add('hidden');
}

function updateEstimate() {
  if (!sourceFile || !sourceDuration) return;
  const fps = Number(fpsSelect.value);
  const duration = Math.min(sourceDuration, 60);
  const frames = Math.min(Math.ceil(duration * fps), 600);
  const size = 40 + frames * 1024;
  $('#estimate').textContent = formatBytes(size);
  $('#estimate-detail').textContent = `${frames} frames · ${duration.toFixed(1)} sec · ${fps} FPS${sourceDuration > 60 ? ' · first 60 seconds only' : ''}`;
}

function drawOledPreview() {
  const offscreen = document.createElement('canvas');
  offscreen.width = 128;
  offscreen.height = 64;
  const ctx = offscreen.getContext('2d', { willReadFrequently: true });
  const scale = Math.min(128 / decoder.videoWidth, 64 / decoder.videoHeight);
  const width = Math.round(decoder.videoWidth * scale);
  const height = Math.round(decoder.videoHeight * scale);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 128, 64);
  ctx.drawImage(decoder, Math.floor((128 - width) / 2), Math.floor((64 - height) / 2), width, height);
  const image = ctx.getImageData(0, 0, 128, 64);
  for (let i = 0; i < image.data.length; i += 4) {
    const gray = Math.round(image.data[i] * 0.299 + image.data[i + 1] * 0.587 + image.data[i + 2] * 0.114);
    const value = gray >= 128 ? 255 : 0;
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  oledContext.clearRect(0, 0, 128, 64);
  oledContext.drawImage(offscreen, 0, 0);
}

async function loadFile(file) {
  clearError();
  if (!file) return;
  if (!file.type.startsWith('video/') && !/\.(mp4|mov|webm|m4v|avi)$/i.test(file.name)) {
    setError('Please choose a supported video file.');
    return;
  }
  if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  sourceFile = file;
  outputBlob = null;
  sourceUrl = URL.createObjectURL(file);
  decoder.src = sourceUrl;
  $('#source-details').classList.remove('hidden');
  $('#file-name').textContent = file.name;
  $('#file-info').textContent = `${formatBytes(file.size)} · Reading duration…`;
  $('#result').classList.add('hidden');
  $('#convert').disabled = true;
  $('#progress-wrap').classList.add('hidden');
  originalFrame.innerHTML = '<span>Loading preview…</span>';

  decoder.onloadedmetadata = () => {
    sourceDuration = decoder.duration;
    if (!Number.isFinite(sourceDuration) || sourceDuration <= 0) {
      setError('This video has an invalid duration.');
      return;
    }
    $('#file-info').textContent = formatBytes(file.size) + ' · ' + sourceDuration.toFixed(1) + ' seconds';
    updateEstimate();
  };
  decoder.onloadeddata = () => {
    if (!sourceFile || !decoder.videoWidth) return;
    $('#convert').disabled = false;
    originalFrame.innerHTML = '';
    const video = document.createElement('video');
    video.src = sourceUrl;
    video.muted = true;
    video.playsInline = true;
    video.controls = true;
    video.preload = 'metadata';
    originalFrame.append(video);
    drawOledPreview();
    $('#preview-note').textContent = 'Fit mode keeps the complete picture. Black bars fill unused display space.';
  };
  decoder.onerror = () => setError('Your browser could not decode this video. Try an MP4 or WebM file.');
}

input.addEventListener('change', (event) => loadFile(event.target.files?.[0]));
fpsSelect.addEventListener('change', updateEstimate);
$('#remove-video').addEventListener('click', () => {
  sourceFile = null;
  outputBlob = null;
  sourceDuration = 0;
  input.value = '';
  if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  sourceUrl = null;
  decoder.removeAttribute('src');
  decoder.load();
  $('#source-details').classList.add('hidden');
  $('#result').classList.add('hidden');
  $('#convert').disabled = true;
  $('#estimate').textContent = '—';
  $('#estimate-detail').textContent = 'Choose a video to calculate';
  originalFrame.innerHTML = '<span>Select a video to preview</span>';
  oledContext.clearRect(0, 0, 128, 64);
  $('#preview-note').textContent = 'The OLED preview will appear after you choose a video.';
  clearError();
});

const dropzone = $('#dropzone');
dropzone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropzone.classList.add('dragging');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragging'));
dropzone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropzone.classList.remove('dragging');
  const file = event.dataTransfer.files?.[0];
  if (file) {
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    loadFile(file);
  }
});

$('#convert').addEventListener('click', async () => {
  if (!sourceFile || !sourceUrl || !sourceDuration) return;
  clearError();
  $('#convert').disabled = true;
  $('#result').classList.add('hidden');
  $('#progress-wrap').classList.remove('hidden');
  const fps = Number(fpsSelect.value);
  outputName = makeOutputName(sourceFile.name);
  try {
    outputBlob = await convertVideoToRJV1(decoder, {
      fps,
      duration: Math.min(sourceDuration, 60),
      onProgress: (done, total) => {
        const percent = Math.round((done / total) * 100);
        $('#progress-bar').style.width = `${percent}%`;
        $('#progress-value').textContent = `${percent}%`;
        $('#progress-label').textContent = `Encoding frame ${done} of ${total}`;
      },
      onFrame: (pixels) => {
        const image = new ImageData(128, 64);
        for (let i = 0; i < pixels.length; i++) {
          const value = pixels[i] ? 255 : 0;
          const offset = i * 4;
          image.data[offset] = value;
          image.data[offset + 1] = value;
          image.data[offset + 2] = value;
          image.data[offset + 3] = 255;
        }
        oledContext.putImageData(image, 0, 0);
      }
    });
    $('#result-name').textContent = outputName;
    $('#result-info').textContent = `${formatBytes(outputBlob.size)} · RJV1 · ${fps} FPS`;
    $('#result').classList.remove('hidden');
    $('#progress-label').textContent = 'Conversion complete';
    $('#progress-bar').style.width = '100%';
    $('#progress-value').textContent = '100%';
    drawOledPreview();
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Conversion failed. Please try another video.');
  } finally {
    $('#convert').disabled = false;
  }
});

$('#download').addEventListener('click', () => {
  if (!outputBlob) return;
  const url = URL.createObjectURL(outputBlob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = outputName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
