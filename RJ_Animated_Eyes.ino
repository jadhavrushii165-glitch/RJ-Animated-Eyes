/***************************************************************
 * RJ Animated Eyes
 *
 * Based on esp32-eyes by Alastair Aitchison / Playful Technology
 * and work by Luis Llamas. Original AGPL-3.0 notices are retained
 * in the upstream source files. See LICENSE.
 *
 * RJ modifications:
 * - SH1106 128x64 display object, initialized on SDA 21 / SCL 22
 * - TTP223 touch input on GPIO 4 with edge detection/debounce
 * - Eight-expression touch cycle in the requested order
 * - Manual expression selection; random emotion switching disabled
 * - Random idle gaze and automatic blinking retained
 ***************************************************************/

#include <Arduino.h>
#include <Wire.h>
#include <U8g2lib.h>
#include "Face.h"

// Hardware: ESP32 DevKit + 1.3-inch SH1106 128x64 OLED
// SDA = GPIO21, SCL = GPIO22, TTP223 OUT = GPIO4
U8G2_SH1106_128X64_NONAME_F_HW_I2C oled(
  U8G2_R0,
  U8X8_PIN_NONE
);

static constexpr uint8_t TOUCH_PIN = 4;
static constexpr uint32_t TOUCH_DEBOUNCE_MS = 35;
static constexpr uint16_t DISPLAY_WIDTH = 128;
static constexpr uint16_t DISPLAY_HEIGHT = 64;
static constexpr uint16_t EYE_SIZE = 40;

Face* face = nullptr;

// Requested order: Natural -> Happy -> Glee -> Furious -> Sleepy ->
// Skeptic -> Annoyed -> Worried -> Natural.
static void showExpression(uint8_t index) {
  if (face == nullptr) return;

  switch (index % 8) {
    case 0: face->Expression.GoTo_Normal();  break; // Natural
    case 1: face->Expression.GoTo_Happy();   break;
    case 2: face->Expression.GoTo_Glee();    break;
    case 3: face->Expression.GoTo_Furious(); break;
    case 4: face->Expression.GoTo_Sleepy();  break;
    case 5: face->Expression.GoTo_Skeptic(); break;
    case 6: face->Expression.GoTo_Annoyed(); break;
    case 7: face->Expression.GoTo_Worried(); break;
  }
}

static uint8_t currentExpression = 0;
static bool lastRawTouch = false;
static bool stableTouch = false;
static uint32_t rawChangeAt = 0;

static void updateTouch() {
  const uint32_t now = millis();
  const bool raw = (digitalRead(TOUCH_PIN) == HIGH); // TTP223 active HIGH

  if (raw != lastRawTouch) {
    lastRawTouch = raw;
    rawChangeAt = now;
  }

  if ((uint32_t)(now - rawChangeAt) >= TOUCH_DEBOUNCE_MS &&
      raw != stableTouch) {
    stableTouch = raw;

    // Advance only on the debounced rising edge. Holding the pad does not
    // repeat; a fresh touch is required for the next expression.
    if (stableTouch) {
      currentExpression = (currentExpression + 1) % 8;
      showExpression(currentExpression);
    }
  }
}

void setup() {
  Serial.begin(115200);

  pinMode(TOUCH_PIN, INPUT);

  // Keep the exact I2C pin assignment supplied for the ESP32 DevKit.
  Wire.begin(21, 22);

  // U8g2 uses an 8-bit address; 0x3C is the common 7-bit OLED address.
  oled.setI2CAddress(0x3C << 1);
  oled.begin();
  oled.clearBuffer();
  oled.sendBuffer();

  randomSeed((uint32_t)micros());

  // Construct the upstream face/eye engine after the display is initialized.
  face = new Face(DISPLAY_WIDTH, DISPLAY_HEIGHT, EYE_SIZE);

  // Touch controls expressions, so do not allow the autonomous behaviour
  // roulette to override the selected expression.
  face->RandomBehavior = false;

  // Preserve original engine features: spontaneous idle gaze and blinking.
  face->RandomLook = true;
  face->RandomBlink = true;
  face->Blink.Timer.SetIntervalMillis(4000);

  currentExpression = 0;
  face->Expression.GoTo_Normal();

  // Avoid treating a touch already held during boot as a new press.
  stableTouch = (digitalRead(TOUCH_PIN) == HIGH);
  lastRawTouch = stableTouch;
  rawChangeAt = millis();
}

void loop() {
  updateTouch();

  // Non-blocking continuous update: original engine advances transitions,
  // pupil transformations, eye variations, blink animation and drawing.
  if (face != nullptr) {
    face->Update();
  }
}
