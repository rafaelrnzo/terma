// TERMA shared network helper. Copy of this file lives in each sketch folder
// (Arduino IDE cannot include files outside the sketch folder).
#pragma once
#include <WiFi.h>
#include <ESPmDNS.h>
#include <HTTPClient.h>
#include "secrets.h"

static const char* termaSsids[] = {WIFI1_SSID, WIFI2_SSID, WIFI3_SSID};
static const char* termaPasses[] = {WIFI1_PASS, WIFI2_PASS, WIFI3_PASS};
static const int TERMA_NETS = 3;
static int termaNet = -1;  // saved network currently in use
static IPAddress termaServer;
static bool termaResolved = false;
static bool termaMdns = false;
static unsigned long termaLastTry = 0;

inline bool termaOnline() { return WiFi.status() == WL_CONNECTED; }

// Finds the TERMA server on the current network: fixed IP (VPS) or the laptop's mDNS name,
// so the laptop's IP may change between networks.
inline bool termaResolve() {
  if (termaResolved) return true;
  if (strlen(TERMA_SERVER_IP) > 0) return termaResolved = termaServer.fromString(TERMA_SERVER_IP);
  if (!termaMdns) termaMdns = MDNS.begin(DEVICE_ID);
  termaServer = MDNS.queryHost(TERMA_SERVER_MDNS, 2000);
  termaResolved = termaServer != IPAddress((uint32_t)0);
  Serial.printf("[NET] Server %s.local -> %s\n", TERMA_SERVER_MDNS, termaResolved ? termaServer.toString().c_str() : "tidak ditemukan");
  return termaResolved;
}

// Joins the saved networks in turn and stays on the first one where the TERMA server is found.
// (Joining the strongest network failed whenever the laptop was on a different saved network.)
inline bool termaHunt() {
  int found = WiFi.scanNetworks();
  if (found < 0) found = 0;
  Serial.printf("[NET] %d WiFi 2.4GHz terlihat:", found);
  for (int i = 0; i < found; i++) Serial.printf(" %s(%d)", WiFi.SSID(i).c_str(), WiFi.RSSI(i));
  Serial.println();
  for (int k = 1; k <= TERMA_NETS; k++) {
    int net = (termaNet + k + TERMA_NETS) % TERMA_NETS;
    bool visible = false;
    if (!strlen(termaSsids[net])) continue;  // unused slot
    for (int i = 0; i < found; i++) visible |= WiFi.SSID(i) == termaSsids[net];
    if (!visible) continue;
    WiFi.disconnect();
    termaResolved = false;
    WiFi.begin(termaSsids[net], termaPasses[net]);
    for (int t = 0; t < 150 && !termaOnline(); t++) delay(100);
    Serial.printf("[NET] WiFi %s: %s\n", termaSsids[net], termaOnline() ? WiFi.localIP().toString().c_str() : "gagal");
    if (termaOnline() && termaResolve()) {
      termaNet = net;
      return true;
    }
  }
  return false;
}

inline void termaNetBegin() {
  WiFi.mode(WIFI_STA);
  WiFi.setHostname(DEVICE_ID);
#ifdef CONFIG_IDF_TARGET_ESP32C3
  WiFi.setTxPower(WIFI_POWER_8_5dBm);  // ESP32-C3 Super Mini: full power often fails to associate
#else
  WiFi.setTxPower(WIFI_POWER_15dBm);   // lower current spikes: full power reset the board on weak USB/5 V supplies
#endif
  termaLastTry = millis();
  termaHunt();
}

// Keeps a route to the server, retrying at most every 10 s so sensors are not blocked.
inline bool termaEnsureWifi() {
  if (termaOnline() && termaResolved) return true;
  if (millis() - termaLastTry < 10000) return false;
  termaLastTry = millis();
  if (termaOnline() && termaResolve()) return true;
  return termaHunt();
}

// POSTs one JSON reading to TERMA. Returns true when the server accepted it (HTTP 200).
inline bool termaPost(const char* json) {
  if (!termaEnsureWifi()) return false;
  HTTPClient http;
  http.setTimeout(3000);
  http.begin(String("http://") + termaServer.toString() + ":" + TERMA_SERVER_PORT + "/api/iot");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-terma-key", TERMA_IOT_KEY);
  int code = http.POST((uint8_t*)json, strlen(json));
  http.end();
  if (code <= 0) termaResolved = false;  // laptop moved or offline: look for it again
  Serial.printf("[NET] POST %d %s\n", code, json);
  return code == 200;
}
