/*
 * Office Energy Monitor - one-room sensing node (Wokwi mock)
 * ----------------------------------------------------------
 * This ESP32 MONITORS (does not switch) the office devices. It reads the
 * on/off state of 5 devices in one room (3 lights + 2 fans) as digital
 * inputs, reads the room's aggregate current from an analog sensor, computes
 * power, and prints a JSON snapshot every cycle. That JSON is exactly the
 * "Simulated Device Layer -> Backend" edge from the system diagram.
 *
 * Real-world mapping (what each Wokwi part stands in for):
 *   slide switch   -> opto-isolated relay feedback contact (device on/off)
 *   LED indicator  -> the actual mains load (light bulb / fan) turning on
 *   potentiometer  -> ACS712 hall-effect current sensor on the mains line
 *   Serial JSON    -> a Wi-Fi HTTP POST to the backend /ingest endpoint
 */

#include <Arduino.h>

struct Device {
  const char* id;      // matches the backend's Device.id shape: "<room>-<type>-<n>"
  const char* label;   // "Fan 1", "Light 3"
  const char* type;    // "light" | "fan"
  uint8_t     pin;     // ESP32 GPIO used as the state-sense input
  uint16_t    watts;   // nameplate wattage when ON (light 15W, fan 60W)
};

// One representative room: Work Room 1 (work1). The other two rooms replicate
// this same node. 3 lights @ 15W + 2 fans @ 60W.
Device devices[] = {
  { "work1-light-1", "Light 1", "light", 25, 15 },
  { "work1-light-2", "Light 2", "light", 26, 15 },
  { "work1-light-3", "Light 3", "light", 27, 15 },
  { "work1-fan-1",   "Fan 1",   "fan",   32, 60 },
  { "work1-fan-2",   "Fan 2",   "fan",   33, 60 },
};
const int DEVICE_COUNT = sizeof(devices) / sizeof(devices[0]);

// --- Current sensing (potentiometer emulates an ACS712 output) ---
const int   CURRENT_PIN = 34;      // ADC1_CH6, input-only pin - correct for a sensor line
const float ADC_MAX     = 4095.0;  // 12-bit ESP32 ADC
const float ADC_VREF    = 3.3;     // ADC full-scale (approx)
const float ACS_ZERO_V  = 2.5;     // ACS712 outputs ~2.5 V at 0 A
const float ACS_SENS    = 0.185;   // 185 mV/A for the ACS712-5A variant
const float MAINS_V     = 220.0;   // local line voltage (Bangladesh ~220 V)

void setup() {
  Serial.begin(115200);
  delay(200);
  // Pull-down so a disconnected / OFF line reads a solid LOW, never floating.
  for (int i = 0; i < DEVICE_COUNT; i++) {
    pinMode(devices[i].pin, INPUT_PULLDOWN);
  }
  Serial.println("[node] work1 sensing node online");
}

float readRoomAmps() {
  int   raw  = analogRead(CURRENT_PIN);
  float vout = (raw / ADC_MAX) * ADC_VREF;       // sensor output voltage
  float amps = (vout - ACS_ZERO_V) / ACS_SENS;   // ACS712 transfer function
  return amps < 0 ? 0 : amps;                    // clamp noise below zero
}

void loop() {
  int nameplateWatts = 0;
  int onCount = 0;

  Serial.println();
  Serial.println("---- work1 snapshot ----");
  for (int i = 0; i < DEVICE_COUNT; i++) {
    bool on = digitalRead(devices[i].pin) == HIGH;
    int  w  = on ? devices[i].watts : 0;
    nameplateWatts += w;
    if (on) onCount++;
    Serial.printf("%-8s %-3s  %3dW\n", devices[i].label, on ? "ON" : "off", w);
  }

  float amps          = readRoomAmps();
  float measuredWatts = amps * MAINS_V;

  Serial.printf("devices ON: %d/%d | nameplate: %dW | measured: %.2fA = %.0fW\n",
                onCount, DEVICE_COUNT, nameplateWatts, amps, measuredWatts);

  // JSON payload - what a Wi-Fi build POSTs to the backend /ingest endpoint.
  Serial.print("{\"room\":\"work1\",\"devices\":[");
  for (int i = 0; i < DEVICE_COUNT; i++) {
    bool on = digitalRead(devices[i].pin) == HIGH;
    Serial.printf("%s{\"id\":\"%s\",\"type\":\"%s\",\"status\":\"%s\",\"watts\":%d}",
                  i ? "," : "", devices[i].id, devices[i].type,
                  on ? "on" : "off", on ? devices[i].watts : 0);
  }
  Serial.printf("],\"nameplateWatts\":%d,\"measuredAmps\":%.2f}\n",
                nameplateWatts, amps);

  delay(1500);
}
