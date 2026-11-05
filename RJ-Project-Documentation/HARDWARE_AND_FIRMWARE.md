# RJ Hardware and Firmware Baseline

Last updated: 2026-11-05

## Current repository firmware

The current animated-eyes project is stored at the repository root. Preserve these files as the known baseline:

- `RJ_Animated_Eyes.ino`
- `Face.cpp/.h`
- `Eye.cpp/.h`
- `EyeDrawer.h`
- `EyePresets.h`
- `FaceExpression.cpp/.h`
- `FaceBehavior.cpp/.h`
- `FaceEmotions.hpp`
- `EyeTransition.*`
- `EyeTransformation.*`
- `EyeVariation.*`
- `EyeBlink.*`
- `BlinkAssistant.*`
- `LookAssistant.*`
- `AsyncTimer.*`
- `Animations.h`
- `EyeConfig.h`
- `Common.h`
- `LICENSE`

The code is based on the Playful Technology `esp32-eyes` project. Preserve its applicable AGPL-3.0-or-later notices and license terms when modifying or redistributing derived code.

## Main board and pin baseline

The current documented main board is an **ESP32 DevKit**. Earlier ESP32-C3 experiments are historical and should not be mixed into the current pin map.

| Component | Connection |
|---|---|
| SH1106 OLED, 128×64 | I²C |
| OLED SDA | GPIO 21 |
| OLED SCL | GPIO 22 |
| TTP223 touch OUT | GPIO 4 |
| microSD CS | GPIO 13 |
| microSD SCK | GPIO 18 |
| microSD MOSI | GPIO 23 |
| microSD MISO | GPIO 19 |

OLED address used by the firmware: `0x3C`.

The microSD test used:

```cpp
SPI.begin(18, 19, 23, 13);
SD.begin(13, SPI);
```

The owner reported successful SDHC detection (approximately 15.2 GB) and successful read/write testing. The OLED and touch test were also reported as successful.

## Animated-eyes behavior

The current firmware uses the Mochi-style expressive eye character. The existing project supports touch-selected expressions including:

- Natural
- Happy
- Glee
- Furious
- Sleepy
- Skeptic
- Annoyed
- Worried

The firmware configuration uses the OLED on GPIO 21/22 and touch input on GPIO 4. Automatic blinking and idle gaze behavior are enabled; random expression switching is disabled.

## Planned / separate hardware

These are not confirmed as integrated into the current firmware:

- GPS NEO-6M
- MAX9814 microphone
- Vibration motor
- Battery-powered operation (battery connection still requires verification)

Do not claim these components are wired or working until the owner confirms the hardware test.

## Planned video-player interaction

The intended device interaction is:

- Double touch: enter Video Player mode.
- Start the first video stored on the microSD card.
- When a video ends, repeat that same video continuously.
- Single touch: advance to the next video.
- Double touch: exit Video Player and return to animated eyes.
- Keep the OLED on during playback.

The video player must remain a separate development module until the standalone RJV file/player tests are complete. It must not destabilize the current animated-eyes baseline.

## Build and verification notes

A repository source file existing does not prove it has compiled or run on hardware. Record each test with board, wiring, library versions, test date, and result. Keep experimental code clearly labelled until verified.
