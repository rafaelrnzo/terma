// Copy to secrets.h inside each sketch folder and fill in. secrets.h is gitignored.
#pragma once
#define WIFI1_SSID "nama-hotspot-hp"
#define WIFI1_PASS "password-hotspot"
#define WIFI2_SSID "nama-wifi-rumah"
#define WIFI2_PASS "password-wifi-rumah"
#define WIFI3_SSID "nama-hotspot-cadangan"
#define WIFI3_PASS "password-hotspot-cadangan"
#define TERMA_SERVER_MDNS "nama-laptop"   // macOS: scutil --get LocalHostName (tanpa .local)
#define TERMA_SERVER_IP ""                // isi IP laptop jika mDNS tidak jalan, mis. "192.168.1.6"
#define TERMA_SERVER_PORT 3028
#define TERMA_IOT_KEY "sama-dengan-TERMA_IOT_KEY-di-web/.env.local"
