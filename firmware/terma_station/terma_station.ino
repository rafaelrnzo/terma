
#include <Arduino.h>
#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// ========================================
// TERMA CONNECTION
// ========================================
// ZONE must be a TERMA zone code: COR_B, BEK_A or GUDANG.
#define DEVICE_ID "TST-01"
#define ZONE "COR_B"
#include "terma_net.h"

const unsigned long SEND_INTERVAL = 30000;
unsigned long previousSend = 0;

// ========================================
// PIN CONFIGURATION
// ========================================

#define DHT_PIN       25
#define DHT_TYPE      DHT11

#define DS18B20_PIN   26

// ========================================
// SENSOR OBJECT
// ========================================

DHT dht(DHT_PIN, DHT_TYPE);

OneWire oneWire(DS18B20_PIN);

DallasTemperature ds18b20(&oneWire);

// ========================================
// TIMER
// ========================================

unsigned long previousMillis = 0;

const unsigned long READ_INTERVAL = 2000;

// ========================================
// SENSOR DATA
// ========================================

float airTemperature = NAN;
float humidity = NAN;
float waterTemperature = NAN;

// ========================================
// FUNCTION: READ SENSORS
// ========================================

void readSensors() {

    Serial.println();
    Serial.println("================================");
    Serial.println("         TERMA STATION");
    Serial.println("================================");

    // ------------------------------------
    // READ DHT11
    // ------------------------------------

    humidity = dht.readHumidity();

    airTemperature = dht.readTemperature();

    Serial.println("[ DHT11 - AIR SENSOR ]");

    if (isnan(humidity) || isnan(airTemperature)) {

        Serial.println("Status      : SENSOR ERROR");

    } else {

        Serial.print("Temperature : ");
        Serial.print(airTemperature, 1);
        Serial.println(" C");

        Serial.print("Humidity    : ");
        Serial.print(humidity, 1);
        Serial.println(" %");

        Serial.println("Status      : OK");
    }

    // ------------------------------------
    // READ DS18B20
    // ------------------------------------

    Serial.println();

    // DS18B20 is the natural wet-bulb sensor: its tip is wrapped in a wet cotton
    // wick whose end dips in the water reservoir (tip itself stays out of the water).
    Serial.println("[ DS18B20 - WET BULB SENSOR ]");

    ds18b20.requestTemperatures();

    waterTemperature = ds18b20.getTempCByIndex(0);

    if (
        ds18b20.getDeviceCount() == 0 ||
        waterTemperature == DEVICE_DISCONNECTED_C
    ) {

        Serial.println("Temperature : SENSOR ERROR");

        Serial.println("Status      : NOT DETECTED");

    } else {

        Serial.print("Temperature : ");

        Serial.print(waterTemperature, 2);

        Serial.println(" C");

        Serial.println("Status      : OK");
    }

    // ------------------------------------
    // SUMMARY
    // ------------------------------------

    Serial.println();

    Serial.println("[ SYSTEM STATUS ]");

    Serial.print("DHT11       : ");

    Serial.println(
        !isnan(humidity) && !isnan(airTemperature)
        ? "ONLINE"
        : "ERROR"
    );

    Serial.print("DS18B20     : ");

    Serial.println(
        waterTemperature != DEVICE_DISCONNECTED_C &&
        ds18b20.getDeviceCount() > 0
        ? "ONLINE"
        : "ERROR"
    );

    Serial.println("================================");
}

// ========================================
// SEND TO TERMA
// ========================================
// TERMA computes ISBB (WBGT) server-side: 0.7 x wet bulb + 0.3 x air temperature.

void sendReading() {

    if (isnan(humidity) || isnan(airTemperature)) {
        Serial.println("[NET] Tidak dikirim: DHT11 error");
        return;
    }

    bool wetBulbOk = ds18b20.getDeviceCount() > 0 && waterTemperature != DEVICE_DISCONNECTED_C;
    char wetBulbText[12] = "null";
    if (wetBulbOk) snprintf(wetBulbText, sizeof(wetBulbText), "%.2f", waterTemperature);

    char json[200];
    snprintf(json, sizeof(json),
        "{\"type\":\"station\",\"deviceId\":\"%s\",\"zone\":\"%s\",\"airC\":%.1f,\"humidityPct\":%.1f,\"wetBulbC\":%s}",
        DEVICE_ID, ZONE, airTemperature, humidity, wetBulbText);
    termaPost(json);
}

// ========================================
// SETUP
// ========================================

void setup() {

    Serial.begin(115200);

    delay(1000);

    Serial.println();

    Serial.println("================================");
    Serial.println("     ESP32 TERMA STATION");
    Serial.println("================================");

    // Initialize DHT11
    Serial.println("Initializing DHT11...");

    dht.begin();

    // Initialize DS18B20
    Serial.println("Initializing DS18B20...");

    ds18b20.begin();

    // Try ESP32 internal pull-up
    // Experimental: external pull-up is preferred
    pinMode(DS18B20_PIN, INPUT_PULLUP);

    // Set resolution 9-bit
    ds18b20.setResolution(9);

    // Display sensor detection
    Serial.println();

    Serial.print("DHT11      : READY");

    Serial.println();

    Serial.print("DS18B20 detected: ");

    Serial.println(ds18b20.getDeviceCount());

    Serial.println();

    if (ds18b20.getDeviceCount() == 0) {

        Serial.println("WARNING: DS18B20 NOT DETECTED!");

    }

    termaNetBegin();

    Serial.println("System initialization completed.");

    Serial.println();

    delay(1500);
}

// ========================================
// LOOP
// ========================================

void loop() {

    unsigned long currentMillis = millis();

    if (currentMillis - previousMillis >= READ_INTERVAL) {

        previousMillis = currentMillis;

        readSensors();
    }

    if (currentMillis - previousSend >= SEND_INTERVAL) {

        previousSend = currentMillis;

        sendReading();
    }
}