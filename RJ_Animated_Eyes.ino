
/***************************************************************
 * RJ Animated Eyes
 *
 * Based on esp32-eyes by Alastair Aitchison / Playful Technology
 * and work by Luis Llamas. Original AGPL-3.0 notices are retained
 * in the upstream source files. See LICENSE.
 *
 * RJ modifications:
 * - SH1106 128x64 display, SDA 21 / SCL 22
 * - TTP223 touch input on GPIO 4 with debounce
 * - Eight-expression touch cycle
 * - Manual expression selection
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

// Natural -> Happy -> Glee -> Furious -> Sleepy ->
// Skeptic -> Annoyed -> Worried -> Natural.
static void showExpression(uint8_t index) {
  if (face == nullptr) return;

  switch (index % 8) {
    case 0: face->Expression.GoTo_Normal();  break;
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
  const bool raw = (digitalRead(TOUCH_PIN) == HIGH);

  if (raw != lastRawTouch) {
    lastRawTouch = raw;
    rawChangeAt = now;
  }

  if ((uint32_t)(now - rawChangeAt) >= TOUCH_DEBOUNCE_MS &&
      raw != stableTouch) {
    stableTouch = raw;

    // Advance only on a debounced rising edge.
    if (stableTouch) {
      currentExpression = (currentExpression + 1) % 8;
      showExpression(currentExpression);
    }
  }
}

void setup() {
  Serial.begin(115200);

  pinMode(TOUCH_PIN, INPUT);

  Wire.begin(21, 22);

  oled.setI2CAddress(0x3C << 1);
  oled.begin();
  oled.clearBuffer();
  oled.sendBuffer();

  randomSeed((uint32_t)micros());

  // Construct the face engine.
  face = new Face(DISPLAY_WIDTH, DISPLAY_HEIGHT, EYE_SIZE);

  // IMPORTANT: Initialize both eyes before the first draw
  // and before starting the initial expression transition.
  face->LeftEye.ApplyPreset(Preset_Normal);
  face->RightEye.ApplyPreset(Preset_Normal);

  // Touch controls expressions; disable autonomous emotion changes.
  face->RandomBehavior = false;

  // Preserve idle gaze and automatic blinking.
  face->RandomLook = true;
  face->RandomBlink = true;
  face->Blink.Timer.SetIntervalMillis(4000);

  currentExpression = 0;

  // Keep the normal expression transition.
  face->Expression.GoTo_Normal();

  // Avoid treating a touch held during boot as a new press.
  stableTouch = (digitalRead(TOUCH_PIN) == HIGH);
  lastRawTouch = stableTouch;
  rawChangeAt = millis();
}

void loop() {
  updateTouch();

  if (face != nullptr) {
    face->Update();
  }
}
