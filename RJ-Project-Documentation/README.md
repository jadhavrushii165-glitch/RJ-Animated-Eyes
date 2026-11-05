# RJ Project Documentation

This folder is the project reference for RJ: the ESP32-based animated companion device and its planned connected features.

## Documents

- [Hardware and firmware baseline](HARDWARE_AND_FIRMWARE.md)
- [Wi-Fi Manager](WIFI_MANAGER.md)
- [System architecture and roadmap](ARCHITECTURE_AND_ROADMAP.md)
- [RJ Video Studio and RJV1 format](VIDEO_STUDIO.md)

## Project status rules

- **Implemented / verified:** present in the repository or explicitly tested by the project owner.
- **In development:** code or integration is being worked on but is not yet confirmed on hardware.
- **Planned:** agreed future functionality that must not be described as implemented.
- **Needs source / verification:** requirements are known, but the original source or a hardware test is still needed.

## Repository safety

The existing animated-eyes firmware at the repository root is the preserved baseline. Development work is being added on the `Development` branch. Do not replace or reorganize the root firmware without an explicit migration plan and a verified backup.

Never commit Wi-Fi passwords, device passwords, Supabase service-role keys, access tokens, or other secrets. Use local configuration files excluded by `.gitignore` and server-side secrets where appropriate.
