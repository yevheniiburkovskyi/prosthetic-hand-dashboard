# FSR calibration: firmware protocol

The dashboard measures each FSR sensor's noise with the hand at rest, computes
a correction, and sends it to the ESP. The ESP applies it to every reading
before notifying, so the app receives an already stable signal.

If the firmware does not expose the characteristic below, the app applies the
same correction itself (shown as "applied in the app").

## Characteristic

|                |                                                   |
| -------------- | ------------------------------------------------- |
| Service        | `4fafc201-1fb5-459e-8fcc-c5c9c331914b` (existing) |
| Characteristic | `6e3a1f52-8c4d-4b7a-9f21-3d5c8e7a1b90`            |
| Properties     | `WRITE` (with response)                           |

## Packet

One 7-byte write per finger, little-endian:

| Byte | Type     | Field        | Notes                                           |
| ---- | -------- | ------------ | ----------------------------------------------- |
| 0    | `uint8`  | finger index | 0 thumb, 1 index, 2 middle, 3 ring, 4 pinky     |
| 1–2  | `int16`  | offset       | raw reading with no load; subtracted first      |
| 3–4  | `uint16` | dead band    | subtracted after filtering; result clamped at 0 |
| 5–6  | `uint16` | alpha × 1000 | EMA weight of the newest sample, 1–1000         |

`offset = 0, dead band = 0, alpha = 1000` means **no correction**. The app
sends this for all fingers right after connecting, on Reset, and before each
new calibration (so it measures the sensors' raw noise).

Example (ring: offset −12, dead band 122, alpha 0.258): `03 f4 ff 7a 00 02 01`

## Processing, per sample

```
input    = raw - offset
filtered = filtered + alpha * (input - filtered)   // first sample: filtered = input
output   = max(0, filtered - deadband)
if raw >= 0.99 * ADC_MAX: output = ADC_MAX         // never hide saturation
```

This is identical to `createCorrectionFilter` in `src/lib/calibration.ts`;
keep the two in sync.

## Arduino (ESP32 `BLEDevice`) sketch

```cpp
#include <BLEDevice.h>

#define CALIBRATION_UUID "6e3a1f52-8c4d-4b7a-9f21-3d5c8e7a1b90"
constexpr int FINGER_COUNT = 5;
constexpr uint16_t ADC_MAX = 4050;

struct Correction {
  int16_t offset = 0;
  uint16_t deadband = 0;
  float alpha = 1.0f;
  float filtered = 0;
  bool primed = false;
};

Correction corrections[FINGER_COUNT];

class CalibrationCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *characteristic) override {
    // Arduino-ESP32 3.x returns String, 2.x returns std::string.
    auto value = characteristic->getValue();
    if (value.length() != 7) return;
    const uint8_t *p = reinterpret_cast<const uint8_t *>(value.c_str());

    uint8_t finger = p[0];
    if (finger >= FINGER_COUNT) return;

    Correction &c = corrections[finger];
    c.offset = static_cast<int16_t>(p[1] | (p[2] << 8));
    c.deadband = p[3] | (p[4] << 8);
    uint16_t alphaMilli = p[5] | (p[6] << 8);
    c.alpha = constrain(alphaMilli, 1, 1000) / 1000.0f;
    c.primed = false; // restart the filter with the new settings
  }
};

// In setup(), next to the existing characteristics:
//   BLECharacteristic *calibration = service->createCharacteristic(
//       CALIBRATION_UUID, BLECharacteristic::PROPERTY_WRITE);
//   calibration->setCallbacks(new CalibrationCallbacks());

uint16_t applyCorrection(int finger, uint16_t raw) {
  if (raw >= ADC_MAX * 0.99f) return ADC_MAX;

  Correction &c = corrections[finger];
  float input = static_cast<float>(raw) - c.offset;
  if (!c.primed) {
    c.filtered = input;
    c.primed = true;
  } else {
    c.filtered += c.alpha * (input - c.filtered);
  }
  float out = c.filtered - c.deadband;
  return out > 0 ? static_cast<uint16_t>(out + 0.5f) : 0;
}

// Before notifying an FSR value:
//   uint16_t value = applyCorrection(fingerIndex, analogRead(pin));
```

Corrections live in RAM; the app re-sends them after every connect, so they
don't need to be persisted.
