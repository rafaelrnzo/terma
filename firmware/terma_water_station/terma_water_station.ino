
#include <Arduino.h>
#include <SPI.h>
#include <MFRC522.h>

// ---------------- TERMA CONNECTION -------------

#define DEVICE_ID "TWS-01"
#include "terma_net.h"

const unsigned long HEARTBEAT_INTERVAL = 60000;
const unsigned long SAME_CARD_IGNORE_MS = 3000;
unsigned long lastHeartbeat = 0;
unsigned long lastCardAt = 0;
char lastCard[32] = "";

// ================================================
// SMART WATER STATION
// ESP32 DEVKIT V1 - 30 PIN
// RFID MFRC522 + RED LED + GREEN LED + BUZZER
// ================================================

// ---------------- RFID PIN ----------------------

#define RFID_SS_PIN     5
#define RFID_RST_PIN     4

#define RFID_SCK_PIN    18
#define RFID_MISO_PIN   19
#define RFID_MOSI_PIN   23

// ---------------- OUTPUT PIN -------------------

#define LED_RED_PIN     26
#define LED_GREEN_PIN   25
#define BUZZER_PIN      27

// ---------------- RFID OBJECT ------------------

MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);

// ---------------- SYSTEM STATUS -----------------

bool rfidReady = false;

unsigned long greenLedUntil = 0;
unsigned long redLedUntil = 0;
unsigned long buzzerUntil = 0;

unsigned long lastBlink = 0;

bool blinkState = false;

// =================================================
// FUNCTION: LED AND BUZZER CONTROL
// =================================================

void updateIndicators() {

    unsigned long now = millis();

    // Red LED
    bool redState = false;

    if (!rfidReady) {

        // Blink red LED if RFID initialization failed
        if (now - lastBlink >= 400) {

            lastBlink = now;
            blinkState = !blinkState;
        }

        redState = blinkState;

    } else {

        redState = now < redLedUntil;
    }

    // Green LED
    bool greenState = now < greenLedUntil;

    // Buzzer
    bool buzzerState = now < buzzerUntil;

    digitalWrite(LED_RED_PIN, redState);
    digitalWrite(LED_GREEN_PIN, greenState);
    digitalWrite(BUZZER_PIN, buzzerState);
}

// =================================================
// FUNCTION: BUZZER
// =================================================

void buzzerBeep(unsigned long duration) {

    buzzerUntil = millis() + duration;
}

// =================================================
// FUNCTION: INDICATOR TEST
// =================================================

void testIndicators() {

    Serial.println();
    Serial.println("=== INDICATOR TEST ===");

    // Test RED LED
    Serial.println("Testing RED LED...");

    digitalWrite(LED_RED_PIN, HIGH);
    delay(500);
    digitalWrite(LED_RED_PIN, LOW);

    // Test GREEN LED
    Serial.println("Testing GREEN LED...");

    digitalWrite(LED_GREEN_PIN, HIGH);
    delay(500);
    digitalWrite(LED_GREEN_PIN, LOW);

    // Test BUZZER
    Serial.println("Testing BUZZER...");

    digitalWrite(BUZZER_PIN, HIGH);
    delay(200);
    digitalWrite(BUZZER_PIN, LOW);

    Serial.println("Indicator test completed!");

    Serial.println("======================");
    Serial.println();
}

// =================================================
// FUNCTION: PRINT CARD UID
// =================================================

void printCardInfo() {

    Serial.println();
    Serial.println("======================================");
    Serial.println("          RFID CARD DETECTED");
    Serial.println("======================================");

    // Print UID HEX
    Serial.print("UID HEX     : ");

    for (byte i = 0; i < rfid.uid.size; i++) {

        if (rfid.uid.uidByte[i] < 0x10) {
            Serial.print("0");
        }

        Serial.print(rfid.uid.uidByte[i], HEX);

        if (i < rfid.uid.size - 1) {
            Serial.print(":");
        }
    }

    Serial.println();

    // Print UID DECIMAL
    Serial.print("UID DECIMAL : ");

    for (byte i = 0; i < rfid.uid.size; i++) {

        Serial.print(rfid.uid.uidByte[i]);

        if (i < rfid.uid.size - 1) {
            Serial.print(" ");
        }
    }

    Serial.println();

    // Print card type
    MFRC522::PICC_Type cardType =
        rfid.PICC_GetType(rfid.uid.sak);

    Serial.print("CARD TYPE   : ");

    Serial.println(
        rfid.PICC_GetTypeName(cardType)
    );

    Serial.println("STATUS      : SUCCESS");

    Serial.println("======================================");
}

// =================================================
// FUNCTION: RFID SCANNER
// =================================================

void scanRFID() {

    // Check new card
    if (!rfid.PICC_IsNewCardPresent()) {
        return;
    }

    // Read card UID
    if (!rfid.PICC_ReadCardSerial()) {

        Serial.println("ERROR: Failed to read RFID card!");

        redLedUntil = millis() + 500;

        return;
    }

    // Print RFID information
    printCardInfo();

    // UID as "A1:B2:C3:D4" - the value to enter as "UID kartu" in TERMA worker data
    char uid[32] = "";
    for (byte i = 0; i < rfid.uid.size && i < 10; i++) {
        snprintf(uid + strlen(uid), sizeof(uid) - strlen(uid), i ? ":%02X" : "%02X", rfid.uid.uidByte[i]);
    }

    // A card held on the reader is one visit, not many
    bool repeated = strcmp(uid, lastCard) == 0 && millis() - lastCardAt < SAME_CARD_IGNORE_MS;
    strcpy(lastCard, uid);
    lastCardAt = millis();

    if (!repeated) {

        char json[120];
        snprintf(json, sizeof(json), "{\"type\":\"water\",\"deviceId\":\"%s\",\"uid\":\"%s\"}", DEVICE_ID, uid);

        if (termaPost(json)) {

            // Accepted by TERMA: green LED + short beep
            greenLedUntil = millis() + 1000;
            redLedUntil = 0;
            buzzerBeep(150);

        } else {

            // Not sent: red LED + long beep, worker taps again
            redLedUntil = millis() + 1500;
            greenLedUntil = 0;
            buzzerBeep(600);
        }
    }

    // Halt RFID card
    rfid.PICC_HaltA();

    // Stop encryption
    rfid.PCD_StopCrypto1();
}

// =================================================
// SETUP
// =================================================

void setup() {

    // Serial initialization
    Serial.begin(115200);

    delay(1000);

    Serial.println();
    Serial.println("======================================");
    Serial.println("         SMART WATER STATION");
    Serial.println("           ESP32 DEVKIT");
    Serial.println("======================================");

    // Initialize output pins
    pinMode(LED_RED_PIN, OUTPUT);
    pinMode(LED_GREEN_PIN, OUTPUT);
    pinMode(BUZZER_PIN, OUTPUT);

    digitalWrite(LED_RED_PIN, LOW);
    digitalWrite(LED_GREEN_PIN, LOW);
    digitalWrite(BUZZER_PIN, LOW);

    // Test indicators
    testIndicators();

    termaNetBegin();

    // Initialize SPI
    Serial.println("Initializing SPI...");

    SPI.begin(
        RFID_SCK_PIN,
        RFID_MISO_PIN,
        RFID_MOSI_PIN,
        RFID_SS_PIN
    );

    // Initialize RFID
    Serial.println("Initializing MFRC522...");

    rfid.PCD_Init();

    delay(100);

    // Check RFID module
    byte version = rfid.PCD_ReadRegister(
        MFRC522::VersionReg
    );

    Serial.print("MFRC522 VERSION : 0x");
    Serial.println(version, HEX);

    // Check connection
    if (version == 0x00 || version == 0xFF) {

        rfidReady = false;

        Serial.println();
        Serial.println("ERROR: MFRC522 NOT DETECTED!");

        Serial.println("Please check:");
        Serial.println("- VCC must be 3.3V");
        Serial.println("- GND connection");
        Serial.println("- SPI wiring");
        Serial.println("- SS pin GPIO5");
        Serial.println("- RST pin GPIO4");

        return;
    }

    // RFID successfully initialized
    rfidReady = true;

    Serial.println();
    Serial.println("======================================");
    Serial.println("       INITIALIZATION SUCCESS");
    Serial.println("======================================");

    Serial.println("RFID MFRC522 : ONLINE");
    Serial.println("LED RED      : READY");
    Serial.println("LED GREEN    : READY");
    Serial.println("BUZZER       : READY");

    Serial.println("--------------------------------------");
    Serial.println("SMART WATER STATION IS READY!");
    Serial.println("PLEASE SCAN YOUR RFID CARD");
    Serial.println("--------------------------------------");

    Serial.println();
}

// =================================================
// LOOP
// =================================================

void loop() {

    // Update output indicators
    updateIndicators();

    // Stop scanning if RFID initialization failed
    if (!rfidReady) {
        return;
    }

    // Heartbeat tells TERMA the station is online, so missed drinks can be flagged
    if (lastHeartbeat == 0 || millis() - lastHeartbeat >= HEARTBEAT_INTERVAL) {

        lastHeartbeat = millis();

        char json[120];
        snprintf(json, sizeof(json), "{\"type\":\"water_heartbeat\",\"deviceId\":\"%s\",\"uptimeMs\":%lu}", DEVICE_ID, millis());
        termaPost(json);
    }

    // Scan RFID card
    scanRFID();
}