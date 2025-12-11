# ThingSpeak Cloud Integration Setup Guide

## Overview

This document provides comprehensive instructions for configuring the ThingSpeak IoT cloud platform to receive, process, and visualize real-time anomaly detection data from the SYNAPSE system. ThingSpeak serves as the primary cloud data repository and remote monitoring dashboard.

---

## Prerequisites

- Active ThingSpeak account (https://thingspeak.com - free tier is sufficient)
- SYNAPSE hardware fully operational and tested (all sensors responding)
- ESP32 WiFi connectivity confirmed
- Arduino IDE with ESP32 board support installed

---

## Part 1: Create ThingSpeak Channel

### Step 1: Create New Channel

1. Navigate to https://thingspeak.com
2. Log in with your account (create account if needed)
3. Click "Channels" in the left menu
4. Click "New Channel" button
5. Fill in the channel information:

   | Field | Value |
   |-------|-------|
   | **Name** | SYNAPSE Anomaly Detection |
   | **Description** | Real-time edge AI anomaly detection system for predictive maintenance and equipment health monitoring |
   | **Field 1 Name** | Vibration_RMS_X |
   | **Field 2 Name** | Vibration_RMS_Y |
   | **Field 3 Name** | Vibration_RMS_Z |
   | **Field 4 Name** | Temperature |
   | **Field 5 Name** | Anomaly_Score |
   | **Field 6 Name** | Alert_Status |
   | **Field 7 Name** | Peak_Vibration |
   | **Field 8 Name** | System_Status |

6. Leave privacy as "Private" for secure monitoring
7. Click "Save Channel"
8. **Note your Channel ID** (visible in channel URL and settings)

---

## Part 2: Obtain API Keys

### Write API Key (Required)

1. In your channel, click the "API Keys" tab
2. Under "Write API Key" section, copy the key
3. It should look like: `XXXXXXXXXXXXXXXXXXX` (alphanumeric)
4. Keep this key secure and private
5. This key allows your ESP32 to send data to ThingSpeak

### Read API Key (Optional)

1. In the same "API Keys" tab
2. Under "Read API Key" section, note this key
3. This key is optional (used only for external data access)

---

## Part 3: Configure Field Settings

After channel creation, configure each field. From your channel main page:

### Standard Field Configuration

For all fields, access settings by clicking field name, then configure:

### Field 1: Vibration_RMS_X

1. Click "Field Settings" for Field 1
2. Configure:

   | Setting | Value |
   |---------|-------|
   | **Field Name** | Vibration_RMS_X |
   | **Units** | m/s² |
   | **Decimal Places** | 2 |
   | **Chart Type** | Line Chart |
   | **Y-Axis Min** | 0 |
   | **Y-Axis Max** | 15 |
   | **Chart Title** | X-Axis Vibration Intensity |

3. Save settings

### Field 2: Vibration_RMS_Y

1. Click "Field Settings" for Field 2
2. Configure:

   | Setting | Value |
   |---------|-------|
   | **Field Name** | Vibration_RMS_Y |
   | **Units** | m/s² |
   | **Decimal Places** | 2 |
   | **Chart Type** | Line Chart |
   | **Y-Axis Min** | 0 |
   | **Y-Axis Max** | 15 |
   | **Chart Title** | Y-Axis Vibration Intensity |

3. Save settings

### Field 3: Vibration_RMS_Z

1. Click "Field Settings" for Field 3
2. Configure:

   | Setting | Value |
   |---------|-------|
   | **Field Name** | Vibration_RMS_Z |
   | **Units** | m/s² |
   | **Decimal Places** | 2 |
   | **Chart Type** | Line Chart |
   | **Y-Axis Min** | 0 |
   | **Y-Axis Max** | 15 |
   | **Chart Title** | Z-Axis Vibration Intensity |

3. Save settings

### Field 4: Temperature

1. Click "Field Settings" for Field 4
2. Configure:

   | Setting | Value |
   |---------|-------|
   | **Field Name** | Temperature |
   | **Units** | °C |
   | **Decimal Places** | 1 |
   | **Chart Type** | Gauge Chart |
   | **Y-Axis Min** | 0 |
   | **Y-Axis Max** | 50 |
   | **Chart Title** | Real-Time Temperature |

3. Save settings

### Field 5: Anomaly_Score

1. Click "Field Settings" for Field 5
2. Configure:

   | Setting | Value |
   |---------|-------|
   | **Field Name** | Anomaly_Score |
   | **Units** | % |
   | **Decimal Places** | 1 |
   | **Chart Type** | Area Chart |
   | **Y-Axis Min** | 0 |
   | **Y-Axis Max** | 100 |
   | **Chart Title** | Anomaly Detection Score |

3. Save settings

### Field 6: Alert_Status

1. Click "Field Settings" for Field 6
2. Configure:

   | Setting | Value |
   |---------|-------|
   | **Field Name** | Alert_Status |
   | **Units** | Level |
   | **Decimal Places** | 0 |
   | **Chart Type** | Number Display |
   | **Chart Title** | System Alert Level |

3. Save settings

### Field 7: Peak_Vibration

1. Click "Field Settings" for Field 7
2. Configure:

   | Setting | Value |
   |---------|-------|
   | **Field Name** | Peak_Vibration |
   | **Units** | m/s² |
   | **Decimal Places** | 2 |
   | **Chart Type** | Bar Chart |
   | **Y-Axis Min** | 0 |
   | **Y-Axis Max** | 30 |
   | **Chart Title** | Peak Vibration |

3. Save settings

### Field 8: System_Status

1. Click "Field Settings" for Field 8
2. Configure:

   | Setting | Value |
   |---------|-------|
   | **Field Name** | System_Status |
   | **Units** | Code |
   | **Decimal Places** | 0 |
   | **Chart Type** | Number Display |
   | **Chart Title** | System Health |

3. Save settings

---

## Part 4: Configure ESP32 Firmware
Update WiFi and ThingSpeak Credentials

const char* ssid = "Your_WiFi_SSID"; // Your WiFi network name
const char* password = "Your_WiFi_Password"; // Your WiFi password
const unsigned long channelID = YOUR_CHANNEL_ID; // From ThingSpeak
const char* writeAPIKey = "YOUR_WRITE_API_KEY"; // From ThingSpeak
const char* thingSpeakServer = "api.thingspeak.com"; // No change needed
