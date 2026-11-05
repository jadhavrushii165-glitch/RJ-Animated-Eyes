import test from 'node:test';
import assert from 'node:assert/strict';
import { RJV1, validateRJV1, formatBytes, makeOutputName } from './rjv1.js';

function makeValidFile() {
  const frameCount = 2;
  const bytes = new Uint8Array(RJV1.HEADER_SIZE + frameCount * RJV1.FRAME_SIZE);
  bytes.set([0x52, 0x4a, 0x56, 0x31], 0);
  const view = new DataView(bytes.buffer);
  view.setUint8(4, 1);
  view.setUint8(5, 40);
  view.setUint16(6, 128, true);
  view.setUint16(8, 64, true);
  view.setUint8(10, 5);
  view.setUint8(11, 1);
  view.setUint32(12, frameCount, true);
  view.setUint32(16, 1024, true);
  view.setUint32(20, 400, true);
  bytes.set([1, 2, 3, 4, 5, 6, 7, 8], 32);
  return bytes;
}

test('accepts a structurally valid RJV1 file', () => {
  const result = validateRJV1(makeValidFile());
  assert.equal(result.valid, true);
  assert.equal(result.width, 128);
  assert.equal(result.height, 64);
  assert.equal(result.frameCount, 2);
  assert.equal(result.videoId, '0102030405060708');
  assert.equal(result.fileSize, 40 + 2 * 1024);
});

test('rejects an invalid magic signature', () => {
  const bytes = makeValidFile();
  bytes[0] = 0;
  assert.match(validateRJV1(bytes).error, /magic/i);
});

test('rejects a truncated frame payload', () => {
  const bytes = makeValidFile().subarray(0, 40 + 1024);
  assert.match(validateRJV1(bytes).error, /length/i);
});

test('rejects an unsupported frame rate', () => {
  const bytes = makeValidFile();
  new DataView(bytes.buffer).setUint8(10, 3);
  assert.match(validateRJV1(bytes).error, /frame rate/i);
});

test('rejects a wrong frame size', () => {
  const bytes = makeValidFile();
  new DataView(bytes.buffer).setUint32(16, 512, true);
  assert.match(validateRJV1(bytes).error, /frame size/i);
});

test('formats output filenames and byte sizes', () => {
  assert.equal(makeOutputName('Vacation.mp4'), 'Vacation.rjv');
  assert.equal(formatBytes(2048), '2.0 KB');
});
