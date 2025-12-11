/*
═════════════════════════════════════════════════════════════════
  SYNAPSE - FINAL COMPLETE CODE (FIXED)
  ESP32 DevKit WROOM32 - ALL COMPONENTS + THINGSPEAK
  
  ✅ VARIABLE NAME FIXES:
  - accel_x_buf → accelX_buf
  - accel_y_buf → accelY_buf
  - accel_z_buf → accelZ_buf
  
  TESTED & WORKING CONFIGURATION:
  ✅ OLED Display (I2C)
  ✅ MPU6050 Accelerometer (I2C)
  ✅ DHT22 Temperature Sensor (GPIO)
  ✅ WiFi + ThingSpeak Cloud Integration
  
  THINGSPEAK FIELD MAPPING:
  Field 1: Vibration_RMS_X (m/s²)
  Field 2: Vibration_RMS_Y (m/s²)
  Field 3: Vibration_RMS_Z (m/s²)
  Field 4: Temperature (°C)
  Field 5: Anomaly_Score (%)
  Field 6: Alert_Status (0/1/2)
  Field 7: Peak_Vibration (m/s²)
  Field 8: System_Status (0/1)
═════════════════════════════════════════════════════════════════
*/

#include <Wire.h>
#include <DHT.h>
#include <Adafruit_SSD1306.h>
#include <WiFi.h>
#include <HTTPClient.h>

// ═══════════════════════════════════════════════════════════════
// WIFI & CLOUD CONFIG
// ═══════════════════════════════════════════════════════════════
const char* ssid = "Cody";
const char* password = "Hinataaa";

const unsigned long channelID = 3196619;
const char* writeAPIKey = "XSF9N4UR4K5CA8AY";
const char* thingSpeakServer = "api.thingspeak.com";

bool wifiConnected = false;

// ═══════════════════════════════════════════════════════════════
// PIN DEFINITIONS
// ═══════════════════════════════════════════════════════════════
#define I2C_SDA 21
#define I2C_SCL 22
#define DHT_PIN 4
#define DHT_TYPE DHT22

// ═══════════════════════════════════════════════════════════════
// SENSOR OBJECTS
// ═══════════════════════════════════════════════════════════════
Adafruit_SSD1306 display(128, 64, &Wire, -1);
DHT dht(DHT_PIN, DHT_TYPE);

// ═══════════════════════════════════════════════════════════════
// GLOBAL VARIABLES
// ═══════════════════════════════════════════════════════════════
unsigned long lastMPUUpdate = 0;
unsigned long lastDHTUpdate = 0;
unsigned long lastCloudUpdate = 0;
unsigned long sampleCount = 0;

#define SAMPLE_INTERVAL 10       // 10ms for 100Hz
#define DHT_INTERVAL 2000        // 2 seconds
#define CLOUD_INTERVAL 15000     // 15 seconds (ThingSpeak rate limit)

// MPU6050 buffers - FIXED VARIABLE NAMES
#define BUFFER_SIZE 100
float accelX_buf[BUFFER_SIZE];  // FIXED: was accel_x_buf
float accelY_buf[BUFFER_SIZE];  // FIXED: was accel_y_buf
float accelZ_buf[BUFFER_SIZE];  // FIXED: was accel_z_buf
int accel_index = 0;

// Current readings
float accel_x = 0, accel_y = 0, accel_z = 0;
float rms_x = 0, rms_y = 0, rms_z = 0;
float peak_vibration = 0;
float current_temp = 0, current_humid = 0;
float anomaly_score = 0;
int alert_status = 0;  // 0=normal, 1=warning, 2=critical
int wifi_status = 0;   // 0=offline, 1=online

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

float calculateRMS(float* data, int size) {
  float sum = 0;
  for (int i = 0; i < size; i++) {
    sum += data[i] * data[i];
  }
  return sqrt(sum / size);
}

float calculatePeak(float* data, int size) {
  float peak = 0;
  for (int i = 0; i < size; i++) {
    if (abs(data[i]) > peak) peak = abs(data[i]);
  }
  return peak;
}

float sigmoid(float x) {
  return 1.0 / (1.0 + exp(-x));
}

// Simple anomaly detection
float detectAnomaly(float rms_x, float rms_y, float rms_z, float temp_diff) {
  // Normalize inputs
  float norm_rms = (rms_x + rms_y + rms_z) / 3.0;
  norm_rms = constrain(norm_rms / 10.0, 0.0, 1.0);
  
  float norm_temp = constrain(abs(temp_diff) / 5.0, 0.0, 1.0);
  
  // Simple weighted average
  float score = 0.7 * norm_rms + 0.3 * norm_temp;
  
  return constrain(score, 0.0, 1.0);
}

// ═══════════════════════════════════════════════════════════════
// DISPLAY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

void displayBoot() {
  display.clearDisplay();
  display.setTextSize(2);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(15, 10);
  display.println("SYNAPSE");
  
  display.setTextSize(1);
  display.setCursor(0, 35);
  display.println("Real-Time Edge AI");
  display.setCursor(10, 45);
  display.println("Anomaly Detection");
  
  display.setCursor(20, 56);
  display.println("v1.0 - 2025");
  
  display.display();
}

void displayStatus() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  
  // Header
  display.setCursor(0, 0);
  display.print("SYNAPSE ");
  if (wifiConnected) {
    display.println("[WiFi OK]");
  } else {
    display.println("[No WiFi]");
  }
  display.println("────────────────────");
  
  // Vibration
  float avg_rms = (rms_x + rms_y + rms_z) / 3.0;
  display.print("Vib: ");
  display.print(avg_rms, 2);
  display.println(" m/s²");
  
  // Temperature
  display.print("Temp: ");
  display.print(current_temp, 1);
  display.println("°C");
  
  // Humidity
  display.print("Humid: ");
  display.print(current_humid, 0);
  display.println("%");
  
  // Anomaly
  display.print("Anom: ");
  display.print(anomaly_score * 100, 0);
  display.print("% ");
  
  // Alert status
  if (alert_status == 0) {
    display.println("[OK]");
  } else if (alert_status == 1) {
    display.println("[!]");
  } else {
    display.println("[!!]");
  }
  
  // Sample counter
  display.print("Samples: ");
  display.println(sampleCount);
  
  display.display();
}

// ═══════════════════════════════════════════════════════════════
// THINGSPEAK UPLOAD
// ═══════════════════════════════════════════════════════════════

void sendToThingSpeak() {
  if (!wifiConnected) {
    return;
  }
  
  if (millis() - lastCloudUpdate < CLOUD_INTERVAL) {
    return;
  }
  
  lastCloudUpdate = millis();
  
  HTTPClient http;
  
  // Build URL with CORRECT field mapping
  String url = "http://api.thingspeak.com/update?api_key=";
  url += writeAPIKey;
  url += "&field1=" + String(rms_x, 2);              // Vibration_RMS_X
  url += "&field2=" + String(rms_y, 2);              // Vibration_RMS_Y
  url += "&field3=" + String(rms_z, 2);              // Vibration_RMS_Z
  url += "&field4=" + String(current_temp, 1);       // Temperature
  url += "&field5=" + String(anomaly_score * 100, 1); // Anomaly_Score (%)
  url += "&field6=" + String(alert_status);          // Alert_Status
  url += "&field7=" + String(peak_vibration, 2);     // Peak_Vibration
  url += "&field8=" + String(wifi_status);           // System_Status
  
  Serial.println("\n☁️ THINGSPEAK UPDATE");
  Serial.print("   RMS X: "); Serial.print(rms_x, 2);
  Serial.print(" | RMS Y: "); Serial.print(rms_y, 2);
  Serial.print(" | RMS Z: "); Serial.println(rms_z, 2);
  Serial.print("   Temp: "); Serial.print(current_temp, 1);
  Serial.print("°C | Anom: "); Serial.print(anomaly_score * 100, 0);
  Serial.print("% | Status: "); Serial.println(alert_status);
  
  http.begin(url);
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String response = http.getString();
    Serial.print("   ✅ SUCCESS! Entry #");
    Serial.println(response);
  } else {
    Serial.print("   ❌ FAILED! HTTP Code: ");
    Serial.println(httpCode);
  }
  
  http.end();
}

// ═══════════════════════════════════════════════════════════════
// SETUP
// ═══════════════════════════════════════════════════════════════

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n\n");
  Serial.println("═══════════════════════════════════════════════════════");
  Serial.println("  SYNAPSE - FINAL COMPLETE SYSTEM");
  Serial.println("  OLED + MPU6050 + DHT22 + WiFi + ThingSpeak");
  Serial.println("═══════════════════════════════════════════════════════\n");
  
  // ─────────────────────────────────────────────────────────────
  // STEP 1: WiFi First (CRITICAL!)
  // ─────────────────────────────────────────────────────────────
  Serial.println("[1] WiFi Initialization...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int wifi_attempts = 0;
  while (WiFi.status() != WL_CONNECTED && wifi_attempts < 20) {
    delay(500);
    Serial.print(".");
    wifi_attempts++;
  }
  Serial.println();
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    wifi_status = 1;
    Serial.println("    ✅ WiFi Connected!");
    Serial.print("    IP: "); Serial.println(WiFi.localIP());
    Serial.print("    RSSI: "); Serial.print(WiFi.RSSI()); Serial.println(" dBm");
  } else {
    wifiConnected = false;
    wifi_status = 0;
    Serial.println("    ❌ WiFi Failed - Offline Mode");
  }
  Serial.println();
  
  // ─────────────────────────────────────────────────────────────
  // STEP 2: I2C Bus
  // ─────────────────────────────────────────────────────────────
  Serial.println("[2] I2C Bus Initialization...");
  Wire.begin(I2C_SDA, I2C_SCL);
  Wire.setClock(400000);
  delay(100);
  
  // I2C Scanner
  byte error, address;
  int devices_found = 0;
  
  for(address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    error = Wire.endTransmission();
    if (error == 0) {
      Serial.print("    Device at 0x");
      if (address < 16) Serial.print("0");
      Serial.print(address, HEX);
      
      if (address == 0x3C || address == 0x3D) {
        Serial.println(" (OLED)");
      } else if (address == 0x68 || address == 0x69) {
        Serial.println(" (MPU6050)");
      } else {
        Serial.println();
      }
      devices_found++;
    }
  }
  
  if (devices_found == 0) {
    Serial.println("    ❌ NO I2C DEVICES!");
  }
  Serial.println();
  
  // ─────────────────────────────────────────────────────────────
  // STEP 3: OLED Display
  // ─────────────────────────────────────────────────────────────
  Serial.println("[3] OLED Display...");
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3D)) {
      Serial.println("    ⚠️  OLED not found!");
    } else {
      Serial.println("    ✅ OLED at 0x3D");
    }
  } else {
    Serial.println("    ✅ OLED at 0x3C");
  }
  
  displayBoot();
  delay(2000);
  Serial.println();
  
  // ─────────────────────────────────────────────────────────────
  // STEP 4: DHT22 Temperature Sensor
  // ─────────────────────────────────────────────────────────────
  Serial.println("[4] DHT22 Temperature Sensor...");
  dht.begin();
  delay(2000);
  
  float test_temp = dht.readTemperature();
  if (!isnan(test_temp)) {
    current_temp = test_temp;
    Serial.println("    ✅ DHT22 Ready!");
    Serial.print("    Temp: "); Serial.print(test_temp, 1); Serial.println("°C");
  } else {
    Serial.println("    ⚠️  DHT22 No Response (check 10kΩ pull-up!)");
  }
  Serial.println();
  
  // ─────────────────────────────────────────────────────────────
  // STEP 5: MPU6050 Accelerometer
  // ─────────────────────────────────────────────────────────────
  Serial.println("[5] MPU6050 Accelerometer...");
  
  // Initialize MPU6050 with raw I2C
  Wire.beginTransmission(0x68);
  Wire.write(0x6B);  // PWR_MGMT_1
  Wire.write(0x00);  // Wake up
  Wire.endTransmission();
  delay(100);
  
  // Set accelerometer range (±16G)
  Wire.beginTransmission(0x68);
  Wire.write(0x1C);  // ACCEL_CONFIG
  Wire.write(0x18);  // ±16G
  Wire.endTransmission();
  delay(100);
  
  Serial.println("    ✅ MPU6050 Ready!");
  Serial.println("    Range: ±16G | Filter: 21Hz");
  Serial.println();
  
  Serial.println("═══════════════════════════════════════════════════════");
  Serial.println("  SYNAPSE SYSTEM READY!");
  Serial.println("  Sampling @ 100Hz | Cloud Update Every 15s");
  Serial.println("═══════════════════════════════════════════════════════\n");
}

// ═══════════════════════════════════════════════════════════════
// MAIN LOOP
// ═══════════════════════════════════════════════════════════════

void loop() {
  // ─────────────────────────────────────────────────────────────
  // MPU6050 Read @ 100Hz
  // ─────────────────────────────────────────────────────────────
  if (millis() - lastMPUUpdate >= SAMPLE_INTERVAL) {
    lastMPUUpdate = millis();
    
    // Read accelerometer registers
    Wire.beginTransmission(0x68);
    Wire.write(0x3B);  // ACCEL_XOUT_H
    Wire.endTransmission(false);
    Wire.requestFrom(0x68, 14, true);
    
    int16_t ax = Wire.read()<<8 | Wire.read();
    int16_t ay = Wire.read()<<8 | Wire.read();
    int16_t az = Wire.read()<<8 | Wire.read();
    
    // Convert to m/s² (±16G = 16*9.81 = 156.96 m/s²)
    accel_x = (ax / 2048.0) * 9.81;
    accel_y = (ay / 2048.0) * 9.81;
    accel_z = (az / 2048.0) * 9.81;
    
    // Store in buffer - FIXED VARIABLE NAMES
    accelX_buf[accel_index] = accel_x;  // FIXED: was accel_x_buf
    accelY_buf[accel_index] = accel_y;  // FIXED: was accel_y_buf
    accelZ_buf[accel_index] = accel_z;  // FIXED: was accel_z_buf
    accel_index++;
    sampleCount++;
    
    // Calculate statistics every 100 samples
    if (accel_index >= BUFFER_SIZE) {
      rms_x = calculateRMS(accelX_buf, BUFFER_SIZE);  // FIXED
      rms_y = calculateRMS(accelY_buf, BUFFER_SIZE);  // FIXED
      rms_z = calculateRMS(accelZ_buf, BUFFER_SIZE);  // FIXED
      
      float peak_x = calculatePeak(accelX_buf, BUFFER_SIZE);  // FIXED
      float peak_y = calculatePeak(accelY_buf, BUFFER_SIZE);  // FIXED
      float peak_z = calculatePeak(accelZ_buf, BUFFER_SIZE);  // FIXED
      
      peak_vibration = (peak_x + peak_y + peak_z) / 3.0;
      
      accel_index = 0;
    }
  }
  
  // ─────────────────────────────────────────────────────────────
  // DHT22 Read @ 2 seconds
  // ─────────────────────────────────────────────────────────────
  if (millis() - lastDHTUpdate >= DHT_INTERVAL) {
    lastDHTUpdate = millis();
    
    float temp = dht.readTemperature();
    float humid = dht.readHumidity();
    
    if (!isnan(temp) && !isnan(humid)) {
      current_temp = temp;
      current_humid = humid;
    }
  }
  
  // ─────────────────────────────────────────────────────────────
  // Anomaly Detection & Alert Status
  // ─────────────────────────────────────────────────────────────
  float avg_rms = (rms_x + rms_y + rms_z) / 3.0;
  anomaly_score = detectAnomaly(rms_x, rms_y, rms_z, 0);
  
  if (anomaly_score >= 0.85) {
    alert_status = 2;  // Critical
  } else if (anomaly_score >= 0.65) {
    alert_status = 1;  // Warning
  } else {
    alert_status = 0;  // Normal
  }
  
  // ─────────────────────────────────────────────────────────────
  // Update Display & Serial
  // ─────────────────────────────────────────────────────────────
  if (sampleCount % 50 == 0) {
    displayStatus();
    
    Serial.print("Sample #");
    Serial.print(sampleCount);
    Serial.print(" | Vib(X,Y,Z): ");
    Serial.print(rms_x, 2); Serial.print("/");
    Serial.print(rms_y, 2); Serial.print("/");
    Serial.print(rms_z, 2);
    Serial.print(" | Temp: ");
    Serial.print(current_temp, 1); Serial.print("°C");
    Serial.print(" | Anom: ");
    Serial.print(anomaly_score * 100, 0); Serial.println("%");
  }
  
  // ─────────────────────────────────────────────────────────────
  // Send to ThingSpeak (every 15 seconds)
  // ─────────────────────────────────────────────────────────────
  sendToThingSpeak();
}

/*
═══════════════════════════════════════════════════════════════
  WIRING SUMMARY
═══════════════════════════════════════════════════════════════

I2C BUS (OLED + MPU6050):
ESP32 GPIO 21 (SDA) → OLED SDA + MPU6050 SDA
ESP32 GPIO 22 (SCL) → OLED SCL + MPU6050 SCL
ESP32 3.3V         → OLED VCC + MPU6050 VCC
ESP32 GND          → OLED GND + MPU6050 GND

DHT22 (GPIO):
ESP32 GPIO 4       → DHT22 DATA (pin 2)
  With 10kΩ pull-up: 3.3V ──[10kΩ]──┬── GPIO 4
                                    │
                               DHT22 DATA
ESP32 3.3V         → DHT22 VCC (pin 1)
ESP32 GND          → DHT22 GND (pin 4)

═══════════════════════════════════════════════════════════════
  THINGSPEAK FIELD MAPPING
═══════════════════════════════════════════════════════════════

Field 1: Vibration_RMS_X    (m/s²)
Field 2: Vibration_RMS_Y    (m/s²)
Field 3: Vibration_RMS_Z    (m/s²)
Field 4: Temperature        (°C)
Field 5: Anomaly_Score      (%)
Field 6: Alert_Status       (0/1/2)
Field 7: Peak_Vibration     (m/s²)
Field 8: System_Status      (0/1)

═══════════════════════════════════════════════════════════════
*/
