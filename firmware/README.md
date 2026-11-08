# TERMA firmware (low-budget)

Three sketches send readings over WiFi to the **terma-iot** backend (`POST /api/iot`, Go service in
the private repo Raya46/terma-iot). The TERMA web receives them in real time over Server-Sent Events.

| Sketch | Board | Sends | Lands in TERMA as |
| --- | --- | --- | --- |
| `terma_band` | ESP32-C3 + MAX30102 + DS18B20 + OLED | 10 s average heart rate, skin temp, SpO2 | `BAND_READING` for the worker the Band is handed to (consent + handoff required) |
| `terma_station` | ESP32 DevKit + DHT11 + DS18B20 (wet wick) | air temp, RH, wet bulb every 30 s | hourly ISBB (WBGT) reading, origin AKTUAL, highest value of the hour |
| `terma_water_station` | ESP32 DevKit + MFRC522 + LEDs + buzzer | card UID per tap, heartbeat every 60 s | `WATER_VISIT` for the worker whose "UID kartu" matches, plus station coverage |

## Low-budget substitutions

- **No black globe.** ISBB = 0.7 × wet bulb + 0.3 × air temperature (globe ≈ air, valid in shade).
  It reads low in direct sun; place the Station in the shade of the work zone.
- **Wet bulb.** Wrap the DS18B20 tip in a cotton wick whose lower end dips in the water reservoir;
  the tip itself stays out of the water. If the wick reads above air temperature (dry or soaked
  sensor) or the DS18B20 is missing, TERMA falls back to a wet bulb computed from DHT11 (Stull 2011).
- **DHT11** is ±2 °C / ±5 %RH. Good enough for a pilot, not a calibrated instrument.
- **Band** sends nothing while the sensor is off the skin, so no fake zero readings reach TERMA.
  No battery sensor, so battery is always empty.

## Setup

1. `secrets.h` in each sketch folder holds three WiFi networks (the device joins them in turn and stays on the one where the TERMA server is found), the laptop's
   mDNS name and `TERMA_IOT_KEY`. It is gitignored; template in `secrets.example.h`.
   The key must equal `TERMA_IOT_KEY` in `web/.env.local`.
2. Laptop mode (devices and laptop on the same WiFi): run terma-iot on the port in `secrets.h`
   (`TERMA_IOT_KEY=... PORT=3028 ALLOWED_ORIGINS=http://localhost:3030 ./terma-iot`), then the web with
   `NEXT_PUBLIC_TERMA_IOT_URL=http://localhost:3028 npm run dev -- -p 3030`.
   Devices find the laptop by name (`<LocalHostName>.local`), so its IP may change between networks.
   VPS mode: set `TERMA_SERVER_IP` to the VPS IP and `TERMA_SERVER_PORT` to its port; any WiFi works.
3. Arduino IDE: Preferences → Additional Boards Manager URLs `https://dl.espressif.com/dl/package_esp32_index.json`, then Boards Manager → **esp32 by Espressif Systems 3.x**. Libraries: Adafruit SSD1306,
   Adafruit GFX, SparkFun MAX3010x, OneWire, DallasTemperature, DHT sensor library, Adafruit Unified
   Sensor, MFRC522 (GithubCommunity/miguelbalboa).
4. In TERMA: open a shift with the workers; set each worker's **UID kartu RFID** (Serial Monitor of the
   Water Station prints it, and TERMA shows an info toast for an unknown card); Clinic records Band
   consent, HSE assigns `BAND-01`, the foreman records the handoff.

## Board settings

Band (ESP32-C3): Board **ESP32C3 Dev Module**, USB CDC On Boot **Enabled**, CPU 160 MHz, Flash 80 MHz,
Flash Mode QIO (use DIO if it boot-loops), Flash 4 MB, Partition **Default 4MB with spiffs**, Upload 921600,
Port `/dev/ttyACM0`.

Station and Water Station (ESP32 DevKit V1): Board **ESP32 Dev Module**, CPU 240 MHz, Flash 80 MHz, QIO,
4 MB, Partition **Default 4MB with spiffs**, Upload 921600, Port `/dev/ttyUSB0`. Hold BOOT while
"Connecting...." if the upload stalls.

## Limits

Readings are stamped when the server
receives them; a device offline at that moment loses the reading (the Water Station blinks red and the
worker taps again).
