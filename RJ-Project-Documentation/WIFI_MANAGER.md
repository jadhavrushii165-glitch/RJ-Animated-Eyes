# RJ Wi-Fi Manager

Status: the owner reports that the standalone Wi-Fi Manager sketch worked successfully. The exact complete sketch is not currently present in this repository, so this document records the known behavior and configuration rather than recreating or replacing the original source.

## Known implementation

The previously tested standalone sketch uses the ESP32 Arduino Wi-Fi, web-server, and NVS Preferences APIs:

```cpp
#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>

WebServer server(80);
Preferences preferences;

#define MAX_NETWORKS 5

const char* apName = "RJ-Setup";
const char* apPassword = "RJsetup26";
```

Known settings and behavior:

- Setup access point SSID: `RJ-Setup`
- Setup access point password in the earlier test sketch: `RJsetup26`
- Setup webpage address: `192.168.4.1`
- Maximum saved networks: 5
- Saved credentials stored in ESP32 non-volatile storage using `Preferences`
- AP + station operation for configuration and normal Wi-Fi connection
- Automatic connection attempts to saved networks
- Connection timeout around 35 seconds
- Retry interval around 5 seconds
- Web interface supports network scanning, adding/saving credentials, connecting, and forgetting saved networks
- Network scanning is handled asynchronously in the sketch

**Security note:** the earlier AP password above is recorded only to identify the previous test configuration. Change it before public or production use. Do not store real Wi-Fi passwords in documentation or source control.

## Required network architecture

RJ must not depend on one particular phone or hotspot. It should work with:

- Phone 1 hotspot
- Another phone's hotspot
- Home or office Wi-Fi routers
- Other compatible Wi-Fi networks added by the owner

Expected behavior:

1. The owner can save multiple trusted networks.
2. RJ checks saved networks and connects to an available one.
3. RJ retries/reconnects when connectivity is lost.
4. The owner can add, change, or forget networks through the setup webpage.
5. Cloud synchronization starts when a usable internet connection becomes available.
6. If internet is unavailable, eligible data is stored on microSD and synchronized later.

The device must not require Phone 1 to remain nearby once another saved network is available.

## Planned extension: BLE provisioning

Sending Wi-Fi credentials from a phone to RJ over BLE is planned. It is **not confirmed implemented**. The existing setup webpage remains the known configuration method until BLE provisioning is separately implemented and tested.

## Source recovery required

The exact full working Wi-Fi Manager sketch has not yet been archived here. The partial source excerpt available in earlier discussion is insufficient to reconstruct the complete tested program safely.

When the owner supplies the original `.ino` file or complete source, add it unchanged under a clearly named path such as:

`Firmware/Modules/WiFiManager/`

Then document its exact version, dependencies, and hardware test result. Do not substitute a newly written approximation and label it the original working sketch.
