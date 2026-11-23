# BLE protocol: dashboard ↔ ESP firmware

Everything the dashboard needs from the device. All multi-byte values are
**little-endian**; timestamps are `millis()` (ms since boot).

The app's implementation lives in `src/lib/ble.ts`. Demo mode runs a virtual
ESP (`src/lib/demoDevice.ts`) that speaks exactly this protocol, so the UI can
be tested without hardware.

## Overview

Service `4fafc201-1fb5-459e-8fcc-c5c9c331914b`, device name `Prosthetic-Hand`.

| Characteristic | UUID                                   | Properties          | Direction |
| -------------- | -------------------------------------- | ------------------- | --------- |
| FSR data       | `beb5483e-36e1-4688-b7f5-ea07361b26a8` | NOTIFY              | ESP → app |
| Temperature    | `1c95d5d3-d300-4172-bc4a-bf2436f6d532` | NOTIFY              | ESP → app |
| Calibration    | `6e3a1f52-8c4d-4b7a-9f21-3d5c8e7a1b90` | WRITE               | app → ESP |
| Control        | `6e3a1f53-8c4d-4b7a-9f21-3d5c8e7a1b90` | WRITE, NOTIFY, READ | both      |

Calibration and Control are optional: if they are missing, the app filters
in software and shows the motor as "not available".

## Sensor data: all 4 sensors in one packet

Send one notification per sample period for each characteristic.

**FSR**, 12 bytes:

| Bytes | Type         | Field                                |
| ----- | ------------ | ------------------------------------ |
| 0–3   | `uint32`     | timestamp, ms                        |
| 4–11  | `uint16` × 4 | Sensor 1–4 value (after calibration) |

**Temperature**, 12 bytes:

| Bytes | Type        | Field                                            |
| ----- | ----------- | ------------------------------------------------ |
| 0–3   | `uint32`    | timestamp, ms                                    |
| 4–11  | `int16` × 4 | Sensor 1–4 in hundredths of °C (3655 = 36.55 °C) |

The app also accepts the old single-sensor packets (FSR 6 bytes
`[uint32][uint16]`, temperature 8 bytes `[uint32][float32]`) and shows them
as Sensor 1, so existing firmware keeps working.

Example FSR packet (t = 123456 ms; values 0, 1500, 4050, 77):
`40 e2 01 00 00 00 dc 05 d2 0f 4d 00`

## Calibration: per-sensor correction

One 7-byte write per sensor:

| Byte | Type     | Field                             |
| ---- | -------- | --------------------------------- |
| 0    | `uint8`  | sensor index, 0–3 = Sensor 1–4    |
| 1–2  | `int16`  | offset (raw reading with no load) |
| 3–4  | `uint16` | dead band                         |
| 5–6  | `uint16` | alpha × 1000, EMA weight, 1–1000  |

`offset 0, dead band 0, alpha 1000` = **no correction**. The app sends this for
all sensors right after connecting, on Reset, and before each calibration, so
it measures the sensors' raw noise.

Processing for every FSR sample:

```
input    = raw - offset
filtered = filtered + alpha * (input - filtered)   // first sample: filtered = input
output   = max(0, filtered - deadband)
if raw >= 0.99 * ADC_MAX: output = ADC_MAX         // never hide saturation
```

This must match `createCorrectionFilter` in `src/lib/calibration.ts`.

## Control: commands and motor status

**Commands** (app writes 1 byte):

| Code   | Command     |
| ------ | ----------- |
| `0x01` | Motor start |
| `0x02` | Motor stop  |

**Status** (1 byte; readable, and notified):

| Code | Motor state |
| ---- | ----------- |
| `0`  | stopped     |
| `1`  | running     |
| `2`  | fault       |

Rules:

- After **every** command, notify the current status, even if it didn't change.
  The app waits up to 2 s for this confirmation and shows a warning otherwise.
- Notify whenever the state changes on its own (e.g. a fault).
- Stop the motor when the BLE client disconnects.

The motor indicator in the app shows only what the device reports.

## Calibration sequence (what the app does)

1. Write "no correction" for all sensors.
2. Write `0x01` (motor start), wait for status `1`.
3. Collect FSR samples for 3 s.
4. Write `0x02` (motor stop), wait for status `0`.
5. Compute and write the 4 corrections.

## Reference firmware (Arduino ESP32, `BLEDevice` library)

Adjust the pins and `readTemperature()` for the real hardware.

```cpp
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLE2902.h>

#define DEVICE_NAME "Prosthetic-Hand"
#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define FSR_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define TEMPERATURE_UUID "1c95d5d3-d300-4172-bc4a-bf2436f6d532"
#define CALIBRATION_UUID "6e3a1f52-8c4d-4b7a-9f21-3d5c8e7a1b90"
#define CONTROL_UUID "6e3a1f53-8c4d-4b7a-9f21-3d5c8e7a1b90"

constexpr int SENSOR_COUNT = 4;
constexpr uint8_t FSR_PINS[SENSOR_COUNT] = {32, 33, 34, 35}; // TODO: real pins
constexpr uint8_t MOTOR_PIN = 25;                             // TODO: real pin
constexpr uint16_t ADC_MAX = 4050;
constexpr uint32_t SAMPLE_INTERVAL_MS = 100; // 10 Hz

enum : uint8_t { CMD_MOTOR_START = 0x01, CMD_MOTOR_STOP = 0x02 };
enum : uint8_t { MOTOR_STOPPED = 0, MOTOR_RUNNING = 1, MOTOR_FAULT = 2 };

BLECharacteristic *fsrChar;
BLECharacteristic *temperatureChar;
BLECharacteristic *controlChar;
bool clientConnected = false;
uint8_t motorState = MOTOR_STOPPED;

// --- Calibration -----------------------------------------------------------

struct Correction {
  int16_t offset = 0;
  uint16_t deadband = 0;
  float alpha = 1.0f;
  float filtered = 0;
  bool primed = false;
};
Correction corrections[SENSOR_COUNT];

void resetCorrections() {
  for (auto &c : corrections) c = Correction();
}

uint16_t applyCorrection(int sensor, uint16_t raw) {
  if (raw >= ADC_MAX * 0.99f) return ADC_MAX;
  Correction &c = corrections[sensor];
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

// --- Motor -----------------------------------------------------------------

void notifyStatus() {
  controlChar->setValue(&motorState, 1);
  if (clientConnected) controlChar->notify();
}

void setMotor(bool on) {
  digitalWrite(MOTOR_PIN, on ? HIGH : LOW);
  motorState = on ? MOTOR_RUNNING : MOTOR_STOPPED;
}

// --- Sensors ---------------------------------------------------------------

float readTemperature(int sensor) {
  return 0.0f; // TODO: read the real temperature sensor
}

void putU16(uint8_t *p, uint16_t v) { p[0] = v; p[1] = v >> 8; }
void putU32(uint8_t *p, uint32_t v) {
  p[0] = v; p[1] = v >> 8; p[2] = v >> 16; p[3] = v >> 24;
}

// --- BLE callbacks ---------------------------------------------------------

class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *) override { clientConnected = true; }
  void onDisconnect(BLEServer *server) override {
    clientConnected = false;
    setMotor(false); // safety: never leave the motor running
    resetCorrections();
    controlChar->setValue(&motorState, 1);
    server->getAdvertising()->start();
  }
};

class CalibrationCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *characteristic) override {
    // Arduino-ESP32 3.x returns String, 2.x returns std::string.
    auto value = characteristic->getValue();
    if (value.length() != 7) return;
    const uint8_t *p = reinterpret_cast<const uint8_t *>(value.c_str());
    uint8_t sensor = p[0];
    if (sensor >= SENSOR_COUNT) return;

    Correction &c = corrections[sensor];
    c.offset = static_cast<int16_t>(p[1] | (p[2] << 8));
    c.deadband = p[3] | (p[4] << 8);
    uint16_t alphaMilli = p[5] | (p[6] << 8);
    c.alpha = constrain(alphaMilli, 1, 1000) / 1000.0f;
    c.primed = false; // restart the filter with the new settings
  }
};

class ControlCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *characteristic) override {
    auto value = characteristic->getValue();
    if (value.length() >= 1) {
      switch (static_cast<uint8_t>(value[0])) {
        case CMD_MOTOR_START: setMotor(true); break;
        case CMD_MOTOR_STOP: setMotor(false); break;
      }
    }
    notifyStatus(); // always confirm
  }
};

// --- Setup / loop ----------------------------------------------------------

void setup() {
  pinMode(MOTOR_PIN, OUTPUT);
  setMotor(false);
  analogReadResolution(12);

  BLEDevice::init(DEVICE_NAME);
  BLEServer *server = BLEDevice::createServer();
  server->setCallbacks(new ServerCallbacks());
  BLEService *service = server->createService(SERVICE_UUID);

  fsrChar = service->createCharacteristic(
      FSR_UUID, BLECharacteristic::PROPERTY_NOTIFY);
  fsrChar->addDescriptor(new BLE2902());

  temperatureChar = service->createCharacteristic(
      TEMPERATURE_UUID, BLECharacteristic::PROPERTY_NOTIFY);
  temperatureChar->addDescriptor(new BLE2902());

  BLECharacteristic *calibrationChar = service->createCharacteristic(
      CALIBRATION_UUID, BLECharacteristic::PROPERTY_WRITE);
  calibrationChar->setCallbacks(new CalibrationCallbacks());

  controlChar = service->createCharacteristic(
      CONTROL_UUID, BLECharacteristic::PROPERTY_WRITE |
                        BLECharacteristic::PROPERTY_NOTIFY |
                        BLECharacteristic::PROPERTY_READ);
  controlChar->addDescriptor(new BLE2902());
  controlChar->setCallbacks(new ControlCallbacks());
  controlChar->setValue(&motorState, 1);

  service->start();
  BLEAdvertising *advertising = BLEDevice::getAdvertising();
  advertising->addServiceUUID(SERVICE_UUID);
  advertising->start();
}

void loop() {
  static uint32_t lastSample = 0;
  uint32_t now = millis();
  if (!clientConnected || now - lastSample < SAMPLE_INTERVAL_MS) return;
  lastSample = now;

  uint8_t fsrPacket[12];
  putU32(fsrPacket, now);
  for (int i = 0; i < SENSOR_COUNT; i++) {
    uint16_t raw = min<uint16_t>(analogRead(FSR_PINS[i]), ADC_MAX);
    putU16(fsrPacket + 4 + i * 2, applyCorrection(i, raw));
  }
  fsrChar->setValue(fsrPacket, sizeof(fsrPacket));
  fsrChar->notify();

  uint8_t temperaturePacket[12];
  putU32(temperaturePacket, now);
  for (int i = 0; i < SENSOR_COUNT; i++) {
    int16_t centi = static_cast<int16_t>(lroundf(readTemperature(i) * 100));
    putU16(temperaturePacket + 4 + i * 2, static_cast<uint16_t>(centi));
  }
  temperatureChar->setValue(temperaturePacket, sizeof(temperaturePacket));
  temperatureChar->notify();
}
```

## Testing without the app

With a BLE debugging app (e.g. nRF Connect): connect, enable notifications on
FSR and Control, write `01` to Control and expect a notification `01`, write
`02` and expect `00`. FSR notifications should be 12 bytes.
