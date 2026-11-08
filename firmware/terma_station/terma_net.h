// TERMA shared network helper. Copy of this file lives in each sketch folder
// (Arduino IDE cannot include files outside the sketch folder).
#pragma once
#include <WiFi.h>
#include <WiFiMulti.h>
#include <ESPmDNS.h>
#include <HTTPClient.h>
#include "secrets.h"

static WiFiMulti termaWifi;
static IPAddress termaServer;
static bool termaResolved = false;
static bool termaMdns = false;
static unsigned long termaLastTry = 0;

// Connects to whichever saved WiFi is in range (strongest of the saved networks in range).
inline void termaNetBegin() {
  WiFi.mode(WIFI_STA);
  WiFi.setHostname(DEVICE_ID);
  termaWifi.addAP(WIFI1_SSID, WIFI1_PASS);
  termaWifi.addAP(WIFI2_SSID, WIFI2_PASS);
  termaWifi.addAP(WIFI3_SSID, WIFI3_PASS);
#ifdef CONFIG_IDF_TARGET_ESP32C3
  WiFi.setTxPower(WIFI_POWER_8_5dBm);  // ESP32-C3 Super Mini: full power often fails to associate
#endif
  int found = WiFi.scanNetworks();
  Serial.printf("[NET] %d WiFi 2.4GHz terlihat:", found);
  for (int i = 0; i < found; i++) Serial.printf(" %s(%d)", WiFi.SSID(i).c_str(), WiFi.RSSI(i));
  Serial.println();
  termaWifi.run(10000);
  Serial.printf("[NET] WiFi: %s %s\n", WiFi.status() == WL_CONNECTED ? WiFi.SSID().c_str() : "belum terhubung", WiFi.localIP().toString().c_str());
}

inline bool termaOnline() { return WiFi.status() == WL_CONNECTED; }

// Finds the laptop by its mDNS name, so its IP may change between hotspot and home WiFi.
inline bool termaResolve() {
  if (termaResolved) return true;
  if (strlen(TERMA_SERVER_IP) > 0) return termaResolved = termaServer.fromString(TERMA_SERVER_IP);
  if (!termaMdns) termaMdns = MDNS.begin(DEVICE_ID);
  termaServer = MDNS.queryHost(TERMA_SERVER_MDNS, 2000);
  termaResolved = termaServer != IPAddress((uint32_t)0);
  Serial.printf("[NET] Server %s.local -> %s\n", TERMA_SERVER_MDNS, termaResolved ? termaServer.toString().c_str() : "tidak ditemukan");
  return termaResolved;
}

// Reconnects to any saved WiFi, at most every 10 s so sensors are not blocked.
inline bool termaEnsureWifi() {
  if (termaOnline()) return true;
  if (millis() - termaLastTry < 10000) return false;
  termaLastTry = millis();
  termaResolved = false;
  bool ok = termaWifi.run(5000) == WL_CONNECTED;
  Serial.printf("[NET] WiFi: %s\n", ok ? WiFi.SSID().c_str() : "belum terhubung");
  return ok;
}

// POSTs one JSON reading to TERMA. Returns true when the server accepted it (HTTP 200).
inline bool termaPost(const char* json) {
  if (!termaEnsureWifi() || !termaResolve()) return false;
  HTTPClient http;
  http.setTimeout(3000);
  http.begin(String("http://") + termaServer.toString() + ":" + TERMA_SERVER_PORT + "/api/iot");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-terma-key", TERMA_IOT_KEY);
  int code = http.POST((uint8_t*)json, strlen(json));
  http.end();
  if (code <= 0) termaResolved = false;  // network changed or laptop offline: look it up again
  Serial.printf("[NET] POST %d %s\n", code, json);
  return code == 200;
}
