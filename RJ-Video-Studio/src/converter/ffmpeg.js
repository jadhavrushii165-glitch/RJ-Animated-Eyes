import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpegInstance;
let loadingPromise;

const CORE_VERSION = '0.12.10';
const CORE_BASE = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

export async function getFFmpeg(onLog = () => {}) {
  if (!ffmpegInstance) ffmpegInstance = new FFmpeg();
  const ffmpeg = ffmpegInstance;
  ffmpeg.on('log', ({ message }) => onLog(message));
  if (!ffmpeg.loaded) {
    if (!loadingPromise) {
      loadingPromise = (async () => {
        const coreURL = await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, 'text/javascript');
        const wasmURL = await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm');
        await ffmpeg.load({ coreURL, wasmURL });
      })().catch((error) => {
        loadingPromise = null;
        throw error;
      });
    }
    await loadingPromise;
  }
  return ffmpeg;
}

function parseDuration(logText) {
  const match = logText.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!match) throw new Error('FFmpeg could not read the video duration or the file has no supported video stream.');
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

async function removeIfPresent(ffmpeg, name) {
  try { await ffmpeg.deleteFile(name); } catch { /* File did not exist. */ }
}

export async function inspectVideoWithFFmpeg(file, onStatus = () => {}) {
  const ffmpeg = await getFFmpeg();
  onStatus('Loading video into the local decoder…');
  const extension = file.name.match(/\.([a-z0-9]{1,8})$/i)?.[1]?.toLowerCase() || 'video';
  const inputName = `source.${extension}`;
  const previewName = 'rj-preview.png';
  await removeIfPresent(ffmpeg, inputName);
  await removeIfPresent(ffmpeg, previewName);
  await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));

  let probeLog = '';
  const capture = ({ message }) => { probeLog += `\n${message}`; };
  ffmpeg.on('log', capture);
  try {
    await ffmpeg.exec(['-i', inputName]);
  } catch {
    // FFmpeg exits non-zero when no output target is supplied; its log still has stream metadata.
  } finally {
    ffmpeg.off('log', capture);
  }
  const duration = parseDuration(probeLog);
  onStatus('Creating the first-frame preview…');
  const previewCode = await ffmpeg.exec([
    '-y', '-i', inputName, '-frames:v', '1',
    '-vf', 'scale=128:64:force_original_aspect_ratio=decrease,pad=128:64:(ow-iw)/2:(oh-ih)/2:black',
    '-f', 'image2', previewName
  ]);
  if (previewCode !== 0) throw new Error('FFmpeg could not decode the first video frame.');
  const previewBytes = await ffmpeg.readFile(previewName);
  const previewBlob = new Blob([previewBytes], { type: 'image/png' });
  const previewUrl = URL.createObjectURL(previewBlob);
  await removeIfPresent(ffmpeg, previewName);
  return { ffmpeg, inputName, duration, previewUrl };
}

export async function decodeGrayFramesWithFFmpeg(ffmpeg, inputName, fps, onProgress = () => {}) {
  const outputName = 'rj-frames.gray';
  await removeIfPresent(ffmpeg, outputName);
  onProgress(0, 'Decoding frames with FFmpeg…');
  const progressHandler = ({ progress }) => {
    if (Number.isFinite(progress)) onProgress(Math.max(0, Math.min(0.99, progress)), 'Decoding frames with FFmpeg…');
  };
  ffmpeg.on('progress', progressHandler);
  try {
    const code = await ffmpeg.exec([
      '-y', '-i', inputName, '-t', '60',
      '-vf', `fps=${fps},scale=128:64:force_original_aspect_ratio=decrease,pad=128:64:(ow-iw)/2:(oh-ih)/2:black,format=gray`,
      '-frames:v', '600', '-f', 'rawvideo', '-pix_fmt', 'gray', outputName
    ]);
    if (code !== 0) throw new Error('FFmpeg could not decode this video. Try another file.');
    const frames = await ffmpeg.readFile(outputName);
    if (!frames.length || frames.length % (128 * 64) !== 0) {
      throw new Error('FFmpeg returned incomplete frame data. Please try another video.');
    }
    onProgress(1, 'Frame decoding complete');
    return frames;
  } finally {
    ffmpeg.off('progress', progressHandler);
    await removeIfPresent(ffmpeg, outputName);
  }
}
