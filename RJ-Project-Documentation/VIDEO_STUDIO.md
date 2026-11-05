# RJ Video Studio and RJV1 Specification

Status: requirements and design agreed; implementation and end-to-end device/cloud integration are not yet confirmed.

## Product

RJ Video Studio is a responsive browser-based converter and video library for desktop and mobile. Conversion runs in the browser/device, not on the ESP32. The first version is developed and tested independently before device transfer or cloud integration.

Planned stack:

- HTML, CSS, JavaScript, and Vite
- FFmpeg.wasm for source-video decoding
- Supabase for cloud storage and database metadata
- A backend/service may be added later if required for secure authenticated operations

No arbitrary 10 MB upload limit has been approved.

## RJV1 file format

- Extension: `.rjv`
- Video dimensions: 128×64
- Pixel format: monochrome, 1 bit per pixel
- Frame size: 1,024 bytes
- Maximum duration: 60 seconds
- Maximum frame rate: 10 FPS
- Allowed selectable frame rates: 1, 2, 5, 10 FPS
- No audio
- Maximum frames: 600
- Maximum payload: 614,400 bytes
- Header target: 40 bytes, including a random 8-byte Video ID

### Pixel packing

- Row-major order
- Left-to-right, then top-to-bottom
- Most-significant bit represents the leftmost pixel in each byte
- Multi-byte integer fields use little-endian encoding

### Header layout

The original 32-byte header fields were:

| Field | Size |
|---|---:|
| Magic `RJV1` | 4 bytes |
| Version | 1 byte |
| Header size | 1 byte |
| Width | 2 bytes |
| Height | 2 bytes |
| FPS | 1 byte |
| Pixel format | 1 byte |
| Frame count | 4 bytes |
| Frame size | 4 bytes |
| Duration | 4 bytes |
| Flags | 2 bytes |
| Reserved | 6 bytes |
| **Original total** | **32 bytes** |

The owner subsequently specified an additional random 8-byte Video ID, making the header 40 bytes. The current prototype places this ID at bytes 32–39; bytes 26–31 remain reserved. This is the prototype's explicit offset choice and still requires confirmation against the ESP32 decoder before the format is treated as production-frozen.

### Validation

Validate before playback/import:

- Magic and supported version
- Header size
- 128×64 dimensions and 1-bit pixel format
- Allowed FPS
- Frame count and duration limits
- Frame size exactly 1,024 bytes
- Exact file length equals header size plus frame count × frame size
- Complete frame payload

Reject invalid or truncated files. Do not add SHA-256 as a required format check; the agreed validation is structural.

## Conversion behavior

- Floyd–Steinberg dithering
- Fit mode: preserve the whole frame, without cropping or distortion; use black letterbox/pillarbox where needed
- Strip audio
- Show original video and 128×64 OLED preview side by side
- Controls: play/pause, restart, frame-by-frame
- Show FPS, duration, estimated output size, and conversion progress
- Maximum 60 seconds and 10 FPS

## Video identity and filenames

- Generate a random 8-byte Video ID.
- Video ID is independent of filename and remains unchanged after rename.
- Video ID is the primary duplicate-check key when registering a video.
- If a collision is detected during registration, generate a new ID.
- Keep the original video filename for the `.rjv` output.
- If a filename already exists, automatically number the duplicate, for example `Vacation.rjv`, `Vacation_2.rjv`.
- Do not use content-based IDs.

## Thumbnails

- Use the first frame of the original video as the thumbnail.
- Store thumbnails only in Supabase cloud storage.
- Do not embed thumbnails in the `.rjv` file and do not create a local thumbnail file.

## Unified video library

One library should provide storage filters:

- Computer
- Cloud
- RJ microSD

Metadata shown: thumbnail, name, duration, FPS, resolution, file size, and storage location.

Actions: preview, rename, download, and delete.

Deletion affects only the selected storage location, not every copy. Ask for confirmation before permanent deletion. Protect the currently playing file from deletion.

## Transfer behavior

- Detect whether RJ is reachable on the local network.
- If RJ is reachable locally, offer local transfer.
- Otherwise offer cloud transfer.
- Do not automatically start a local transfer without the owner's approval.
- RJ can download assigned cloud videos when internet is available.
- Local and cloud transfer should both be supported; cloud transfer enables access when the website and RJ are on different networks.
- Cloud videos remain until manually deleted.
- Local and cloud deletion are independent.

## Device dashboard and account

Planned dashboard fields: device name, device ID, connection status, Wi-Fi status, microSD status, free space, and last sync. Planned actions: change device password and unregister device.

One account is planned to register one RJ device. The owner creates a device password through the RJ setup webpage; planned length is 8–32 characters with letters and numbers and confirmation.

Use secure password hashing, Supabase Auth, RLS, private storage, and authenticated downloads or signed URLs. Never expose service-role credentials in frontend code or firmware.

## Playback integration

The device player is a separate module until standalone tests pass. Intended behavior:

- Double touch enters Video Player mode.
- Start the first available video.
- Repeat the current video after it ends.
- Single touch advances to the next video.
- Double touch exits to animated eyes.
- Keep OLED on during playback.

The current animated-eyes firmware must remain preserved while the player is developed.
