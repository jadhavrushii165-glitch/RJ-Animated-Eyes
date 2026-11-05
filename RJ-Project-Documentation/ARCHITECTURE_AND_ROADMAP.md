# RJ Architecture and Roadmap

## Core principles

- Keep the project in this single GitHub repository.
- Preserve the existing animated-eyes firmware at the root as the baseline.
- Develop new modules on the `Development` branch first.
- Keep tested firmware, experiments, and planned features clearly distinguished.
- Do not mark a feature implemented until code and the relevant test are confirmed.
- Do not implement conversation recording or transcription unless the owner explicitly requests it.

## Intended high-level architecture

```text
Phone / Browser
   | BLE setup (planned) or RJ setup webpage
   v
RJ Wi-Fi Manager
   | connects to any saved available network
   v
ESP32 DevKit
   |-- Animated Eyes / Touch UI
   |-- microSD storage
   |-- RJV1 Video Player (planned module)
   |-- Cloud Sync Client (planned module)
   |
   +---- Internet ---- Supabase services
                         |-- device/account metadata
                         |-- private video storage
                         |-- sync state
                         +-- authenticated web access
   |
   +---- Local Wi-Fi transfer to RJ Video Studio (planned)
```

The architecture must support RJ connecting to any saved hotspot/router, not only one phone. Phone 2 or another authorized client should be able to access cloud-synchronized content remotely after upload.

## Data flow and offline behavior

- Keep eligible data on microSD while RJ is offline.
- When internet becomes available, connect to a saved network and check for assigned cloud content.
- Compare cloud files with microSD contents.
- Download missing files, validate them, then make them available in the playable library.
- Do not expose incomplete downloads as playable files.
- Keep cloud and microSD deletion independent unless a later explicit sync policy says otherwise.

## Cloud synchronization plan

Planned sync sequence:

1. Connect to an available saved Wi-Fi network.
2. Authenticate RJ with its registered device identity.
3. Check the cloud for videos assigned to this device.
4. Compare cloud inventory with the microSD inventory.
5. Download missing files.
6. Validate each downloaded RJV file.
7. Update cloud/device sync status.

Planned schedule: run immediately after internet reconnects, then approximately every 15 minutes.

Playback has priority over background downloads. Coordinate microSD access and use small chunks or pauses so sync does not interrupt the eyes/video experience. Exact chunk size and scheduling strategy remain to be tuned and tested.

## Storage cleanup plan

Planned microSD cleanup policy:

- Begin cleanup when free space falls below 10%.
- Delete the oldest eligible local videos until free space rises above 10% or enough space exists for a pending download.
- Protect the currently playing file and incomplete downloads.
- The owner has explicitly accepted that an oldest local video may be deleted even if it has no cloud backup; this can permanently lose that local copy.
- Cloud copies are unaffected by local cleanup.
- Log cleanup events and report them to the website.
- If no eligible files remain, report insufficient space instead of deleting protected data.

## Device registration and security plan

Planned device registration includes a device ID and a password created by the owner through the RJ setup webpage. The planned password length is 8–32 characters with letters and numbers and confirmation.

Security requirements:

- Hash and salt device credentials appropriately; never store plaintext passwords.
- Use Supabase Auth, row-level security (RLS), private storage buckets, and authenticated downloads or short-lived signed URLs.
- Never put a Supabase service-role key in browser code, ESP32 firmware, or GitHub.
- Keep device/account access scoped to the registered owner.
- One account is planned to register one RJ device.
- Unregistering a device must revoke its access.

These are requirements for future implementation, not a claim that registration/authentication is already working.

## Suggested implementation order

1. Archive and verify the original Wi-Fi Manager source.
2. Preserve and document the current animated-eyes firmware.
3. Complete standalone microSD RJV1 file read/validation tests.
4. Build and test RJ Video Studio independently.
5. Implement the standalone RJV1 player on the ESP32.
6. Integrate touch-based mode switching without breaking the eyes firmware.
7. Implement device registration and secure cloud storage.
8. Implement cloud sync, retry/resume behavior, and storage cleanup.
9. Add BLE Wi-Fi provisioning.
10. Add optional GPS, microphone ambient sensing, and vibration features only after separate hardware approval and tests.

## Status vocabulary

- **Verified:** tested on the target hardware or service and confirmed by the owner.
- **Implemented, not verified:** code exists but has not passed the relevant target test.
- **Planned:** agreed specification, no completed implementation claim.
- **Blocked:** waiting on source, credentials, hardware, or an external permission.
