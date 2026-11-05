# RJ Video Studio

Early browser-based prototype for converting short videos into RJ RJV1 monochrome frame files.

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Run the RJV1 structural validation tests and create a production build:

```bash
npm test
npm run build
npm run preview
```

## Current prototype scope

- Responsive desktop/mobile interface
- Select or drag in a video
- Decode videos locally with FFmpeg.wasm (input compatibility depends on FFmpeg's enabled codecs)
- 1, 2, 5, or 10 FPS output
- Fit the full source frame into 128×64 with black letterbox/pillarbox
- Floyd–Steinberg monochrome dithering
- 1-bit, MSB-first, row-major pixel packing
- RJV1 40-byte header with a random 8-byte Video ID
- Validate RJV1 headers, supported settings, frame payload size, and Video ID
- Download the generated `.rjv` file
- Source processing remains local in the browser

## Important limitations

This is the first converter prototype, not the complete product. It now uses FFmpeg.wasm in the browser to inspect video duration, decode a first-frame preview, extract grayscale frames, and encode RJV1 without uploading the source video. FFmpeg core files are loaded from jsDelivr on first use, so an internet connection is required to initialize the decoder. Actual format support depends on the FFmpeg core build and input codec.

The unified Computer/Cloud/RJ microSD library, Supabase authentication/storage, cloud thumbnails, device registration, local transfer, and RJ synchronization are not implemented in this prototype.

The converter has not yet been verified in a real browser session or validated against the ESP32 player. The GitHub Actions workflow runs the Node tests and Vite production build; confirm its status before opening the pull request. Do not treat the format as production-frozen until encoder/decoder test vectors and hardware playback tests pass.
