# RJ Animated Eyes — ESP32 DevKit + SH1106 + TTP223

This Arduino project adapts the **original Playful Technology `esp32-eyes` animation engine** for RJ. It does not replace the renderer with a new animation system. The upstream `Face`, `Eye`, `EyeDrawer`, `FaceExpression`, transition, transformation, variation, look, blink, and timer implementation files are included.

## Hardware

- ESP32 DevKit (ESP32, not ESP32-C3)
- 1.3-inch SH1106 OLED, 128×64, I²C
- TTP223 touch sensor

### Wiring

| Module | ESP32 DevKit |
|---|---|
| OLED VCC | 3.3V |
| OLED GND | GND |
| OLED SDA | GPIO 21 |
| OLED SCL | GPIO 22 |
| TTP223 VCC | 3.3V |
| TTP223 GND | GND |
| TTP223 OUT | GPIO 4 |

The sketch assumes the OLED I²C address is `0x3C` (7-bit). If your particular display uses `0x3D`, change `oled.setI2CAddress(0x3C << 1)` in the `.ino` to `oled.setI2CAddress(0x3D << 1)`.

## Expressions

One debounced TTP223 touch advances through exactly this sequence:

1. Natural — upstream `GoTo_Normal()` / `Preset_Normal`
2. Happy — upstream `GoTo_Happy()` / `Preset_Happy`
3. Glee — upstream `GoTo_Glee()` / `Preset_Glee`
4. Furious — upstream `GoTo_Furious()` / `Preset_Furious`
5. Sleepy Eyes — upstream `GoTo_Sleepy()` / `Preset_Sleepy` and its alternate eye
6. Skeptic — upstream `GoTo_Skeptic()` / `Preset_Skeptic` and its alternate eye
7. Annoyed — upstream `GoTo_Annoyed()` / `Preset_Annoyed` and its alternate eye
8. Worried — upstream `GoTo_Worried()` / `Preset_Worried` and its alternate eye

After Worried, the next touch returns to Natural. A held touch does not repeatedly advance; a new touch edge is required.

## Animation behavior

- Original per-eye rendering and expression presets are retained.
- Original 500 ms expression transition engine is retained.
- Original eye transformation and variation pipeline is retained.
- Random idle gaze is enabled (`RandomLook = true`).
- Automatic blinking is enabled (`RandomBlink = true`).
- Automatic random emotion selection is disabled (`RandomBehavior = false`) so touch-selected expressions remain selected.
- The main loop contains no delay and calls the engine continuously.
- The RJ fork changes automatic blink interval after a blink to a random interval between 3.0 and 6.5 seconds.

## Arduino IDE setup

1. Extract the ZIP.
2. Open `RJ_Animated_Eyes/RJ_Animated_Eyes.ino` in Arduino IDE. Keep all `.cpp`, `.h`, and `.hpp` files in the same project folder.
3. Install the **U8g2** library by olikraus using Arduino IDE Library Manager (`Tools` / `Sketch` → `Include Library` → `Manage Libraries…`, search `U8g2`).
4. Install/select the Espressif ESP32 board package if not already installed.
5. Select your ESP32 DevKit board (commonly **ESP32 Dev Module**) and its COM port.
6. Click Verify, then Upload.

No Adafruit SSD1306 library is used; the included project uses U8g2 and the SH1106 display class.

## Project files

- `RJ_Animated_Eyes.ino` — RJ-specific hardware setup and touch expression sequence.
- `Face.cpp/.h`, `Eye.cpp/.h`, `EyeDrawer.h`, `EyePresets.h`, `FaceExpression.cpp/.h`, `FaceBehavior.cpp/.h`, `FaceEmotions.hpp`, `EyeTransition.*`, `EyeTransformation.*`, `EyeVariation.*`, `EyeBlink.*`, `BlinkAssistant.*`, `LookAssistant.*`, `AsyncTimer.*`, `Animations.h`, `EyeConfig.h` — upstream animation engine, with the display binding adapted to `oled`.
- `Common.h` — declares the SH1106 U8g2 display object.
- `LICENSE` — upstream AGPL-3.0 license text.

## Upstream source and licensing

Based on https://github.com/playfultechnology/esp32-eyes (Playful Technology / Alastair Aitchison, with prior work by Luis Llamas). The upstream project is licensed under **GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later)**. Original per-file copyright/license notices are preserved. See `LICENSE`.

RJ modifications are identified in `RJ_Animated_Eyes.ino`, `Common.h`, `Face.cpp`, `EyeDrawer.h`, and `BlinkAssistant.cpp`: SH1106/global display adaptation, ESP32 DevKit I²C pin setup in the sketch, debounced TTP223 expression cycling, disabling random emotion selection, and randomized automatic blink spacing.

## Testing status and known limitations

The repository source and requested preset/function mappings were inspected. The package was checked for required source files and consistent display-object references. **This environment does not have the Arduino ESP32 toolchain or a connected ESP32/OLED, so a genuine Arduino compile and physical hardware test could not be performed here.** Run Verify in Arduino IDE before uploading. If a compiler error appears, share the complete error output for a targeted fix.
