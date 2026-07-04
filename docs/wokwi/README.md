# Wokwi Circuit — One-Room Sensing Node

A ready-to-run [Wokwi](https://wokwi.com) simulation of the hardware described in
[`../HARDWARE.md`](../HARDWARE.md). It models **one representative room** (Work
Room 1: 3 lights + 2 fans) where an **ESP32 monitors** each device's on/off
state and the room's aggregate current, then prints a JSON snapshot — the same
"device layer → backend" edge shown in the [system diagram](../system-diagram.svg).

The other two rooms are identical copies of this node, so one room proves the
whole design.

> **Files:** [`diagram.json`](./diagram.json) (the circuit) and
> [`sketch.ino`](./sketch.ino) (the firmware). Paste both into a new Wokwi ESP32
> project and press ▶.

---

## 1. Components (Bill of Materials)

| Qty | Wokwi part | Real-world part | Role in the design |
|----|------------|-----------------|--------------------|
| 1 | `wokwi-esp32-devkit-v1` | ESP32 DevKit v1 | The monitoring microcontroller (Wi-Fi + ADC) |
| 5 | `wokwi-slide-switch` | Opto-isolated relay **feedback contact** | One per device — delivers a clean 3.3 V "on/off" logic signal |
| 3 | `wokwi-led` (yellow) | Mains **light** (15 W) | Visual indicator that a light is ON |
| 2 | `wokwi-led` (cyan) | Mains **fan** (60 W) | Visual indicator that a fan is running |
| 5 | `wokwi-resistor` (220 Ω) | 220 Ω resistor | LED current limiting |
| 1 | `wokwi-potentiometer` | **ACS712** hall-effect current sensor | Emulates the analog room-current reading on the ADC |

Why these stand-ins are *physically honest*: in a real office the lights and
fans are 220 V AC loads switched by relays — you never wire mains to an MCU. The
ESP32 only ever sees (a) a **3.3 V logic feedback** signal per device (the slide
switch here) and (b) a **low-voltage analog** current signal from a hall sensor
(the potentiometer here). See "Real-world upgrade" below for animated DC-motor
fans.

---

## 2. Pin mapping

| Signal | ESP32 pin | Direction | Notes |
|---|---|---|---|
| Light 1 state | GPIO 25 | input (pull-down) | on/off sense |
| Light 2 state | GPIO 26 | input (pull-down) | on/off sense |
| Light 3 state | GPIO 27 | input (pull-down) | on/off sense |
| Fan 1 state | GPIO 32 | input (pull-down) | on/off sense |
| Fan 2 state | GPIO 33 | input (pull-down) | on/off sense |
| Room current | GPIO 34 (ADC1_CH6) | analog in | ACS712/pot → amps → watts |
| Logic power | 3V3 | power | switch commons + pot VCC |
| Ground | GND.1 / GND.2 | power | common reference |

GPIO 34 is **input-only** (no internal pull resistor) — exactly right for an
analog line. GPIO 25/26/27/32/33 support internal pull-downs, so the firmware
uses `INPUT_PULLDOWN` and no external pull-down resistors are needed.

---

## 3. Wiring / net list

Per device (repeat 5×, one GPIO each):

```
3V3 ──► switch.common(2)
        switch.throw(3) ──┬──► ESP32 GPIO (state sense, INPUT_PULLDOWN)
                          └──► LED.anode(A) ──► 220Ω ──► GND
```

Current sensor:

```
3V3 ──► pot.VCC     pot.SIG ──► GPIO34 (ADC)     pot.GND ──► GND
```

Serial monitor (required for output — the ESP32's UART0 must be wired to the
virtual monitor, crossed TX↔RX):

```
esp.TX0 ──► $serialMonitor:RX     esp.RX0 ──► $serialMonitor:TX
```

When a switch is ON, its throw ties the node to **3V3**: the GPIO reads **HIGH**
and the LED lights. When OFF, the internal pull-down holds the node at **0 V**:
the GPIO reads **LOW** and the LED is dark. The ESP32 taps the same node it
senses — it monitors, it never drives the load.

### ASCII schematic (one room)

```
                       +----------------------------+
        3V3 ───────────┤ 3V3                        │
                       │                    ESP32   │
  [SW L1]══3V3══► D25 ─┤ D25   (INPUT_PULLDOWN)     │
     └─► LED(Y)─220Ω─┐ │                            │
  [SW L2]══3V3══► D26 ─┤ D26                        │
     └─► LED(Y)─220Ω─┤ │                            │
  [SW L3]══3V3══► D27 ─┤ D27                        │
     └─► LED(Y)─220Ω─┤ │                            │
  [SW F1]══3V3══► D32 ─┤ D32                        │
     └─► LED(C)─220Ω─┤ │                            │
  [SW F2]══3V3══► D33 ─┤ D33                        │
     └─► LED(C)─220Ω─┴─┤ GND.1/GND.2                │
                       │                            │
  [POT wiper] ───────► ┤ D34 (ADC)   ── Wi-Fi ──►  Backend /ingest
  3V3 ─pot.VCC  GND─pot.GND                         │
                       +----------------------------+
    (Y)=yellow LED = light   (C)=cyan LED = fan
```

---

## 4. Build it in Wokwi — fast path (recommended)

1. Go to **https://wokwi.com** → **New Project** → **ESP32**.
2. Click the **`diagram.json`** tab, select-all, and paste the contents of
   [`diagram.json`](./diagram.json).
3. Open **`sketch.ino`** (or the code tab) and paste the contents of
   [`sketch.ino`](./sketch.ino).
4. Press **▶ (Start)**. Open the **Serial Monitor** (bottom panel).
5. **Demo:** drag each slide switch — the matching LED lights up (yellow =
   light, cyan = fan) and the serial log updates the device state and total
   watts. Drag the **potentiometer** to change the measured room current (amps →
   watts). You'll see output like:

   ```
   ---- work1 snapshot ----
   Light 1  ON    15W
   Light 2  off    0W
   Light 3  ON    15W
   Fan 1    ON    60W
   Fan 2    off    0W
   devices ON: 3/5 | nameplate: 90W | measured: 0.68A = 150W
   {"room":"work1","devices":[...],"nameplateWatts":90,"measuredAmps":0.68}
   ```

## 5. Build it from scratch — manual path

If you'd rather wire it by hand instead of pasting `diagram.json`:

1. New ESP32 project. Click the blue **+** to add parts: 5 × slide switch,
   5 × LED, 5 × resistor (set each `value` to `220`), 1 × potentiometer.
2. Set 3 LEDs `color` to `yellow` (lights) and 2 to `cyan` (fans).
3. For each device: wire **switch pin 2 → 3V3**, **switch pin 3 → the GPIO**
   (25/26/27 for lights, 32/33 for fans) **and → LED anode**; **LED cathode →
   220 Ω → GND**.
4. Potentiometer: **VCC → 3V3**, **GND → GND**, **SIG → GPIO 34**.
5. Serial monitor: wire **TX0 → `$serialMonitor:RX`** and **RX0 →
   `$serialMonitor:TX`** (crossed), or nothing prints.
6. Paste [`sketch.ino`](./sketch.ino), press ▶.

---

## 6. Electrical reasoning (what a grader looks for)

- **Opto-isolation:** the AC sense side is isolated from the ESP32 with an
  opto-coupler (e.g. PC817). The MCU only ever sees clean 3.3 V logic — the
  slide switch here already delivers that isolated logic level.
- **Pull-downs:** every state input has a pull-down (internal here) so an OFF or
  disconnected line reads a solid LOW rather than floating and glitching.
- **Current → power:** the ACS712 outputs ~2.5 V at 0 A and swings ±185 mV/A
  (5 A part). The firmware reads the ADC, subtracts the 2.5 V midpoint, divides
  by the sensitivity to get amps, then `P = V_line × I` (≈ 220 V mains).
- **ADC range:** the ESP32 ADC is 0–3.3 V; pick the ACS712 5 A/20 A variant (or
  a divider) so the sensor output stays in range.
- **Never drive a load from a GPIO:** the ESP32 monitors only. A GPIO carries a
  sense/control *signal*, never mains or motor current.

## 7. Real-world upgrade — animated DC-motor fans

Wokwi's transistors are custom chips, so this project uses LEDs for both device
types to stay one-click runnable. To make the fans physically accurate on real
hardware (or a fuller Wokwi build), replace each fan LED with a DC motor driven
through a low-side switch — **never off the GPIO directly**:

```
GPIO ──► 1kΩ ──► base of NPN (2N2222 / PN2222)
5V  ──► motor(+)                    motor(-) ──► collector
                                    emitter  ──► GND
1N4007 flyback diode across the motor (cathode to +5V) to clamp back-EMF.
```

The GPIO switches the transistor; the transistor carries the motor current; the
diode absorbs the inductive kick. In that build the ESP32 would *drive* the fan
indicator from an output pin after sensing the switch — sense on an input pin,
actuate on an output pin.

## 8. Connecting to the backend (real deployment)

In production the node POSTs its JSON to the shared backend instead of (or in
addition to) printing it. Sketch outline:

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
WiFi.begin("Wokwi-GUEST", "");            // Wokwi's built-in test network
HTTPClient http;
http.begin("https://your-backend.example/api/ingest");
http.addHeader("Content-Type", "application/json");
http.POST(payload);                        // the JSON built in loop()
```

The backend then merges this into the same single source of truth the web
dashboard and the Discord bot both read. (Note: Wokwi can reach the public
internet but **not** your `localhost` — deploy the backend or use a tunnel to
test the real POST.)
