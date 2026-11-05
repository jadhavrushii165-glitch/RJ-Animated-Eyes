# RJ Video Studio

Early browser-based prototype for converting short videos into RJ RJV1 monochrome frame files.

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Create a production build:

```bash
npm run build
npm run preview
```

## Current prototype scope

- Responsive desktop/mobile interface
- Select or drag in a video
- Decode videos supported by the current browser
- 1, 2, 5, or 10 FPS output
- Fit the full source frame into 128×64 with black letterbox/pillarbox
- Floyd–Steinberg monochrome dithering
- 1-bit, MSB-first, row-major pixel packing
- RJV1 40-byte header with a random 8-byte Video ID
- Download the generated `.rjv` file
- Source processing remains local in the browser

## Important limitations

This is the first converter prototype, not the complete product. It currently uses the browser's native video decoder; file compatibility therefore depends on the browser and installed codecs. FFmpeg.wasm integration is a planned next step for broader input-format support.

The unified Computer/Cloud/RJ microSD library, Supabase authentication/storage, cloud thumbnails, device registration, local transfer, and RJ synchronization are not implemented in this prototype.

The converter has not yet been built and tested in a real browser session or validated against the ESP32 player. Do not treat the format as production-frozen until encoder/decoder test vectors and hardware playback tests pass.
