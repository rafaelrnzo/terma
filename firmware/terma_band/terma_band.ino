
#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#include <MAX30105.h>
#include <spo2_algorithm.h>

#include <OneWire.h>
#include <DallasTemperature.h>

// =====================================
// TERMA CONNECTION
// =====================================
// DEVICE_ID must match a Band unit in the web (BAND-01 / BAND-02).
#define DEVICE_ID "BAND-01"
#include "terma_net.h"

const unsigned long SEND_INTERVAL_MS = 10000;
unsigned long lastSend = 0;
// Valid samples of the current 10 s window; the median ignores the
// algorithm's occasional spikes (e.g. 214 BPM) that skew an average.
const int WINDOW_MAX = 20;
int32_t hrSamples[WINDOW_MAX], spo2Samples[WINDOW_MAX];
int hrCount = 0, spo2Count = 0;

int32_t median(int32_t *values, int count) {
    for (int i = 1; i < count; i++) {
        int32_t v = values[i];
        int j = i - 1;
        while (j >= 0 && values[j] > v) { values[j + 1] = values[j]; j--; }
        values[j + 1] = v;
    }
    return count % 2 ? values[count / 2] : (values[count / 2 - 1] + values[count / 2]) / 2;
}

// =====================================
// PIN CONFIGURATION
// =====================================

#define OLED_SDA 8
#define OLED_SCL 9

#define DS18B20_PIN 10

// =====================================
// OLED CONFIGURATION
// =====================================

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_ADDRESS 0x3C

Adafruit_SSD1306 display(
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    &Wire,
    -1
);

// =====================================
// MAX30102 CONFIGURATION
// =====================================

MAX30105 particleSensor;

#define BUFFER_LENGTH 100

uint32_t irBuffer[BUFFER_LENGTH];
uint32_t redBuffer[BUFFER_LENGTH];

int32_t spo2 = 0;
int32_t heartRate = 0;

int8_t validSPO2 = 0;
int8_t validHeartRate = 0;

bool fingerDetected = false;

// The Maxim algorithm assumes 25 samples/s. This MAX30102 clone delivers fewer
// (~41% of the configured rate), so its raw BPM came out ~2.5x too high (157-214).
// The real rate is measured every loop and the BPM corrected with it.
float samplesPerSecond = 20.0;  // configured 200 sps / sampleAverage 4 = 50; this clone delivers ~20
int32_t heldHeartRate = 0;   // smoothed BPM, kept on screen while the finger stays on
bool freshHeartRate = false; // this window produced a new valid BPM (only these are sent to TERMA)
byte outliers = 0;

// =====================================
// DS18B20 CONFIGURATION
// =====================================

OneWire oneWire(DS18B20_PIN);
DallasTemperature ds18b20(&oneWire);

float temperatureC = NAN;

unsigned long tempRequestTime = 0;
bool tempPending = false;

const unsigned long TEMP_CONVERSION_MS = 100;
// Skin temperature changes slowly. Each DS18B20 transaction blocks the CPU, and doing
// it every 100 ms starved the pulse sensor (its FIFO overflowed and beats were lost).
const unsigned long TEMP_PERIOD_MS = 2000;
DeviceAddress tempAddress;
bool tempAddressKnown = false;

// =====================================
// TEMPERATURE READING
// =====================================

void serviceTemperature() {

    unsigned long now = millis();

    // Check conversion completion
    if (tempPending &&
        now - tempRequestTime >= TEMP_CONVERSION_MS) {

        if (!tempAddressKnown) tempAddressKnown = ds18b20.getAddress(tempAddress, 0);

        float value = tempAddressKnown ? ds18b20.getTempC(tempAddress) : DEVICE_DISCONNECTED_C;

        if (value == DEVICE_DISCONNECTED_C ||
            value < -55 || value > 125) {

            temperatureC = NAN;

        } else {

            temperatureC = value;
        }

        tempPending = false;
    }

    // Start next conversion
    if (!tempPending && now - tempRequestTime >= TEMP_PERIOD_MS) {

        if (tempAddressKnown) ds18b20.requestTemperaturesByAddress(tempAddress);
        else ds18b20.requestTemperatures();

        tempRequestTime = millis();

        tempPending = true;
    }
}

// =====================================
// READ MAX30102 SAMPLE
// =====================================

void readMaxSample(
    uint32_t &irValue,
    uint32_t &redValue
) {

    while (!particleSensor.available()) {

        particleSensor.check();

        serviceTemperature();

        delay(1);
    }

    redValue = particleSensor.getRed();

    irValue = particleSensor.getIR();

    particleSensor.nextSample();

    serviceTemperature();
}

// =====================================
// CALCULATE BPM AND SPO2
// =====================================

void calculateMeasurements() {

    maxim_heart_rate_and_oxygen_saturation(
        irBuffer,
        BUFFER_LENGTH,
        redBuffer,
        &spo2,
        &validSPO2,
        &heartRate,
        &validHeartRate
    );

    // Finger detection threshold
    fingerDetected = irBuffer[BUFFER_LENGTH - 1] > 50000;

    // Corrected BPM, smoothed; a single reading >40% off is ignored unless it repeats
    int32_t measured = lround(heartRate * samplesPerSecond / 25.0);
    // Only a window fully on the skin counts: the samples from before the finger
    // touched made the first reading wrong (151 BPM). Costs ~5 s of "..." at start.
    bool windowOnSkin = true;
    for (int i = 0; i < BUFFER_LENGTH; i++) if (irBuffer[i] <= 50000) windowOnSkin = false;
    freshHeartRate = windowOnSkin && validHeartRate && measured >= 40 && measured <= 200;

    if (!fingerDetected) {
        heldHeartRate = 0;
        outliers = 0;
    } else if (freshHeartRate) {
        bool outlier = heldHeartRate > 0 && abs(measured - heldHeartRate) > heldHeartRate * 0.4;
        if (outlier && ++outliers < 3) {
            freshHeartRate = false;
        } else {
            heldHeartRate = heldHeartRate == 0 || outlier ? measured : lround(0.6 * heldHeartRate + 0.4 * measured);
            outliers = 0;
        }
    }

    heartRate = heldHeartRate;
    validHeartRate = heartRate > 0;
}

// =====================================
// OLED DISPLAY
// =====================================

void updateDisplay() {

    display.clearDisplay();

    display.setTextColor(SSD1306_WHITE);

    // Header
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.print("TERMA ");
    display.print(DEVICE_ID);
    display.setCursor(104, 0);
    display.println(termaOnline() ? "WiFi" : "----");

    display.drawFastHLine(
        0, 11, 128, SSD1306_WHITE
    );

    // Temperature
    display.setCursor(0, 17);

    display.print("TEMP  : ");

    if (!isnan(temperatureC)) {

        display.print(temperatureC, 1);
        display.println(" C");

    } else {

        display.println("-- C");
    }

    // Heart Rate
    display.setCursor(0, 30);

    display.print("HEART : ");

    if (fingerDetected && validHeartRate) {

        display.print(heartRate);
        display.println(" BPM");

    } else if (fingerDetected) {

        display.println("... BPM");  // first beats being measured

    } else {

        display.println("-- BPM");
    }

    // SpO2
    display.setCursor(0, 43);

    display.print("SPO2  : ");

    if (fingerDetected &&
        validSPO2 &&
        spo2 >= 70 &&
        spo2 <= 100) {

        display.print(spo2);
        display.println(" %");

    } else {

        display.println("-- %");
    }

    // Finger status
    display.setCursor(0, 57);

    if (fingerDetected) {

        display.println("Finger: DETECTED");

    } else {

        display.println("Place your finger");
    }

    display.display();
}

// =====================================
// SERIAL MONITOR
// =====================================

void printSerialData() {

    Serial.println("--------------------------");

    Serial.print("Sensor rate: ");
    Serial.print(samplesPerSecond, 1);
    Serial.println(" sps");

    Serial.print("Temperature: ");

    if (!isnan(temperatureC)) {
        Serial.print(temperatureC, 2);
        Serial.println(" C");
    } else {
        Serial.println("Sensor Error");
    }

    if (fingerDetected) {

        Serial.print("Heart Rate: ");

        if (validHeartRate) {
            Serial.print(heartRate);
            Serial.println(" BPM");
        } else {
            Serial.println("Invalid");
        }

        Serial.print("SpO2: ");

        if (validSPO2) {
            Serial.print(spo2);
            Serial.println(" %");
        } else {
            Serial.println("Invalid");
        }

    } else {

        Serial.println("Finger not detected");
    }

    Serial.println("--------------------------");
}

// =====================================
// SEND TO TERMA
// =====================================
// Sends the median of valid beats over 10 s (the Maxim algorithm is noisy per window)
// and only sends while the sensor touches skin, so no fake zero readings reach TERMA.

void collectAndSend() {

    if (fingerDetected && freshHeartRate && heartRate >= 40 && heartRate <= 220) {
        if (hrCount < WINDOW_MAX) hrSamples[hrCount++] = heartRate;
    }

    if (fingerDetected && validSPO2 && spo2 >= 70 && spo2 <= 100) {
        if (spo2Count < WINDOW_MAX) spo2Samples[spo2Count++] = spo2;
    }

    termaEnsureWifi();

    if (millis() - lastSend < SEND_INTERVAL_MS) return;
    lastSend = millis();

    if (hrCount > 0 && !isnan(temperatureC)) {
        char spo2Text[8] = "null";
        if (spo2Count > 0) snprintf(spo2Text, sizeof(spo2Text), "%ld", (long)median(spo2Samples, spo2Count));
        char json[200];
        snprintf(json, sizeof(json),
            "{\"type\":\"band\",\"deviceId\":\"%s\",\"heartRate\":%ld,\"skinC\":%.2f,\"spo2\":%s,\"battery\":null}",
            DEVICE_ID, (long)median(hrSamples, hrCount), temperatureC, spo2Text);
        termaPost(json);
    } else {
        Serial.println("[NET] Tidak dikirim: sensor belum menempel/denyut belum valid");
    }

    hrCount = spo2Count = 0;
}

// =====================================
// SETUP
// =====================================

void setup() {

    Serial.begin(115200);

    delay(1000);

    Serial.println();
    Serial.println("========================");
    Serial.println("ESP32-C3 HEALTH MONITOR");
    Serial.println("========================");

    // Initialize I2C
    Wire.begin(OLED_SDA, OLED_SCL);

    // Initialize OLED
    if (!display.begin(
        SSD1306_SWITCHCAPVCC,
        OLED_ADDRESS
    )) {

        Serial.println("OLED initialization failed!");

        while (true) delay(1000);
    }

    display.clearDisplay();

    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);

    display.setCursor(15, 20);
    display.println("INITIALIZING...");

    display.setCursor(10, 35);
    display.println("HEALTH MONITOR");

    display.display();

    termaNetBegin();

    // Initialize DS18B20
    ds18b20.begin();

    ds18b20.setResolution(9);

    ds18b20.setWaitForConversion(false);

    Serial.print("DS18B20 devices: ");
    Serial.println(ds18b20.getDeviceCount());

    serviceTemperature();

    // Initialize MAX30102
    if (!particleSensor.begin(
        Wire,
        I2C_SPEED_FAST
    )) {

        Serial.println("MAX30102 not found!");

        display.clearDisplay();
        display.setCursor(0, 20);
        display.println("MAX30102 ERROR!");
        display.display();

        while (true) delay(1000);
    }

    Serial.println("MAX30102 initialized!");

    // MAX30102 sensor settings
    byte ledBrightness = 60;
    byte sampleAverage = 4;
    byte ledMode = 2;
    int sampleRate = 200;  // 200 / sampleAverage 4 = 50 sps configured; this clone delivers ~20
    int pulseWidth = 411;
    int adcRange = 4096;

    particleSensor.setup(
        ledBrightness,
        sampleAverage,
        ledMode,
        sampleRate,
        pulseWidth,
        adcRange
    );

    // Collect initial 100 samples
    Serial.println("Collecting sensor data...");

    for (int i = 0; i < BUFFER_LENGTH; i++) {

        readMaxSample(
            irBuffer[i],
            redBuffer[i]
        );
    }

    calculateMeasurements();

    updateDisplay();

    printSerialData();

    Serial.println("SYSTEM READY!");
}

// =====================================
// MAIN LOOP
// =====================================

void loop() {

    // Shift previous 75 samples
    for (int i = 25; i < BUFFER_LENGTH; i++) {

        redBuffer[i - 25] = redBuffer[i];

        irBuffer[i - 25] = irBuffer[i];
    }

    // Collect 25 new samples and measure the real sample rate
    unsigned long started = millis();
    for (int i = 75; i < BUFFER_LENGTH; i++) {

        readMaxSample(
            irBuffer[i],
            redBuffer[i]
        );
    }

    unsigned long elapsed = millis() - started;
    if (elapsed > 0) samplesPerSecond = 0.8 * samplesPerSecond + 0.2 * (25000.0 / elapsed);

    // Calculate new measurements
    calculateMeasurements();

    // Update OLED
    updateDisplay();

    // Print results
    printSerialData();


    // Send 10-second average to TERMA
    collectAndSend();
}
