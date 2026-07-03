# Hardware / Electrical Schematic

This is a **simulation/concept only** — no physical hardware is required for the demo. The circuit below shows how the office devices *would* be wired and sensed in real life, and is representative of **one room** (2 fans + 3 lights). The other two rooms replicate the same pattern.

Build it in **[Wokwi](https://wokwi.com)** (recommended — it simulates the ESP32 with Wi‑Fi) and export a screenshot + share link into this folder.

## Concept

In a real deployment the lights and fans are mains (AC) loads switched by relays. The ESP32 does **not** switch them here — it **monitors** them:

- Each device's on/off state is read as a **digital input** (from the relay's auxiliary/feedback contact through an opto-isolator).
- The room's aggregate current is read from an **ACS712** hall-effect current sensor on the ESP32's ADC, which lets us estimate real power (`W = V_line × I`).
- The ESP32 publishes these readings over Wi‑Fi to the backend, which is exactly the "Simulated Device Layer → Backend" edge in the [system diagram](./system-diagram.svg).

For a bench/Wokwi mock, model the loads with **LEDs (lights)** and **small DC motors (fans)** so the wiring is visible and safe.

## Pin mapping (one representative room)

| Signal | ESP32 pin | Direction | Purpose |
|---|---|---|---|
| Light 1 state | GPIO 25 | input (pull-down) | on/off sense |
| Light 2 state | GPIO 26 | input (pull-down) | on/off sense |
| Light 3 state | GPIO 27 | input (pull-down) | on/off sense |
| Fan 1 state | GPIO 32 | input (pull-down) | on/off sense |
| Fan 2 state | GPIO 33 | input (pull-down) | on/off sense |
| Room current | GPIO 34 (ADC1_CH6) | analog in | ACS712 output → derive amps/watts |
| Logic power | 3V3 | power | ESP32 + opto/sensor logic side |
| Sensor power | 5V (VIN) | power | ACS712 Vcc |
| Ground | GND | power | common reference |

> GPIO 34 is input-only (no internal pull-up/down) — correct for an analog sensor line. GPIO 25/26/27/32/33 are general-purpose and support internal pull-downs.

## Electrical reasoning

- **Opto-isolation:** the AC sense side is isolated from the ESP32 with opto-couplers (e.g. PC817). The ESP32 only ever sees a clean 3.3 V logic level, never mains.
- **Pull-downs:** each state input has a pull-down (internal or ~10 kΩ) so a disconnected/off line reads a solid LOW instead of floating.
- **Current → power:** the ACS712 outputs ~2.5 V at 0 A and swings ±(sensitivity) around it. Read the ADC, subtract the 2.5 V midpoint, divide by the sensitivity (e.g. 185 mV/A for the 5 A part) to get amps, then `P = V_line × I` (V_line ≈ 220 V or your local mains).
- **Never drive motors from a GPIO:** in the Wokwi mock, fan DC motors go through a transistor/driver with a flyback diode; the GPIO only carries a control/sense signal, not motor current.
- **ADC scaling:** the ESP32 ADC is 0–3.3 V; keep the ACS712 output within range (use the 5 A/20 A variant appropriate to the load, or a divider).

## ASCII sketch (one room)

```
                +---------------------------+
   3V3 ---------| ESP32                     |
   GND ---------|                           |
                |  GPIO25 <--[opto]-- Light1 state
                |  GPIO26 <--[opto]-- Light2 state
                |  GPIO27 <--[opto]-- Light3 state
                |  GPIO32 <--[opto]-- Fan1 state
                |  GPIO33 <--[opto]-- Fan2 state
                |  GPIO34 <--------- ACS712 OUT (room current)
                |     (Wi-Fi) ----> Backend  /ingest
                +---------------------------+

   Mock loads: Light = LED + resistor,  Fan = DC motor via transistor + flyback diode
```

## Build steps in Wokwi

1. New project → **ESP32**.
2. Add 3 LEDs (lights) and 2 DC motors (fans); add an ACS712 (or a potentiometer to emulate the analog current reading).
3. Wire per the pin-mapping table above; add pull-down resistors on the five state inputs.
4. Add a sketch that reads the five digital inputs + the ADC and prints/publishes the readings (Wi‑Fi `HTTPClient` POST to the backend in a real build).
5. Save, screenshot the diagram, and drop `wokwi-schematic.png` + the share link into this `docs/` folder; reference them from the root README.
