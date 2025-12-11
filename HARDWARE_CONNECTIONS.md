# Hardware Connections and Architecture

## Overview

The SYNAPSE system uses an ESP32 microcontroller as the main processing unit, integrated with three primary sensors: the MPU6050 accelerometer/gyroscope for vibration monitoring and DHT22 for environmental temperature sensing. All components communicate via I2C protocol or GPIO pins.

---

## Component Specifications

### Main Processor
- **Model**: ESP32-WROOM-32 (DevKit)
- **Processor**: Dual-core Xtensa 32-bit LX6
- **Operating Voltage**: 3.3V
- **GPIO Pins Available**: 28
- **I2C Interfaces**: 2
- **SPI Interfaces**: 4
- **ADC Channels**: 12
- **WiFi**: 802.11 b/g/n (single band 2.4 GHz)
- **Operating Temperature Range**: -40°C to +85°C

### Vibration Sensor (MPU6050)
- **Type**: 6-Axis Inertial Measurement Unit
- **Accelerometer Range**: ±16G (configured in firmware)
- **Accelerometer Resolution**: 16-bit
- **Gyroscope Range**: ±250°/s (not used in current firmware)
- **Gyroscope Resolution**: 16-bit
- **Sampling Rate**: 100 Hz (configurable via internal FIFO)
- **I2C Address**: 0x68 (AD0 pin connected to GND)
- **I2C Clock Speed**: 400 kHz (Fast Mode)
- **Communication Protocol**: I2C
- **Operating Voltage**: 3.0V to 3.4V
- **Supply Current**: Typical 3.7 mA

### Temperature and Humidity Sensor (DHT22)
- **Type**: Capacitive Humidity and Temperature Sensor
- **Temperature Range**: -40°C to +80°C
- **Temperature Accuracy**: ±0.5°C
- **Humidity Range**: 0% to 100%
- **Humidity Accuracy**: ±2% RH
- **Sampling Rate**: 0.5 Hz (one reading every 2 seconds minimum)
- **Communication Protocol**: Single-wire digital (GPIO)
- **Operating Voltage**: 3.3V to 5V
- **Supply Current**: 0.5 mA to 2.5 mA
- **Response Time**: 2 seconds typical

### Display (OLED)
- **Type**: Monochrome OLED Display
- **Resolution**: 128 x 64 pixels
- **Display Size**: 0.96 inches diagonal
- **Color**: White pixels on black background
- **I2C Address**: 0x3C (primary) or 0x3D (fallback)
- **Communication Protocol**: I2C
- **Operating Voltage**: 3.3V to 5V
- **Operating Temperature Range**: -20°C to +70°C
- **Response Time**: Immediate

---

## Pin Configuration

### ESP32 Pin Assignments

| Component | Pin (ESP32) | Pin Type | Function | Protocol | Notes |
|-----------|-----------|----------|----------|----------|-------|
| MPU6050 (I2C) | GPIO 21 | I2C | SDA (Data Line) | I2C | Address: 0x68 |
| MPU6050 (I2C) | GPIO 22 | I2C | SCL (Clock Line) | I2C | Clock: 400 kHz |
| DHT22 | GPIO 4 | Digital Input | Data Line | 1-Wire Digital | Requires 10kΩ pull-up |
| OLED (I2C) | GPIO 21 | I2C | SDA (Data Line) | I2C | Shared with MPU6050 |
| OLED (I2C) | GPIO 22 | I2C | SCL (Clock Line) | I2C | Shared with MPU6050 |
| WiFi Antenna | Internal | RF | WiFi Communication | 802.11 b/g/n | Built-in antenna |

### Voltage Levels
- I2C Lines: 3.3V logic (with pull-up resistors to 3.3V)
- All sensors operate at 3.3V
- ESP32 can be powered from USB or external 5V with voltage regulator

---

## Schematic Overview

### I2C Bus Topology

ESP32 (I2C Master @ 400 kHz)
├── SDA (GPIO 21) ──┬── MPU6050 (Address: 0x68)
│ └── OLED Display (Address: 0x3C/0x3D)
│
└── SCL (GPIO 22) ──┬── MPU6050
└── OLED Display

Optional Pull-up resistors: 4.7kΩ on SDA and SCL to 3.3V

### GPIO Single-Wire Topology

ESP32 GPIO 4 ──→ DHT22 Data Line
(With 10kΩ pull-up resistor to 3.3V)


### Power Distribution

ESP32 Supply
├── 5V In (USB or External)
│ └── 3.3V Regulator (On-board)
│
└── 3.3V Output
├── MPU6050 VCC
├── DHT22 VCC
├── OLED VCC
├── Pull-up resistors (SDA, SCL, DHT22 DATA)
└── ESP32 I/O pins

---

## Complete Wiring Diagram

### Connections Summary

**MPU6050 to ESP32:**

| MPU6050 Pin | ESP32 Pin | Purpose |
|-------------|-----------|---------|
| VCC | 3.3V | Power Supply |
| GND | GND | Ground |
| SDA | GPIO 21 | I2C Data |
| SCL | GPIO 22 | I2C Clock |
| INT | Not Connected | Interrupt (optional) |

**DHT22 to ESP32:**

| DHT22 Pin | ESP32 Connection | Purpose |
|-----------|------------------|---------|
| VCC (Pin 1) | 3.3V | Power Supply |
| DATA (Pin 2) | GPIO 4 (via 10kΩ pull-up) | Single-wire digital |
| NC (Pin 3) | Not Connected | Not used |
| GND (Pin 4) | GND | Ground |

**10kΩ Pull-up Resistor for DHT22:**
3.3V ──[10kΩ resistor]──┬── GPIO 4 (ESP32)
└── Pin 2 (DHT22 DATA)


**OLED to ESP32:**

| OLED Pin | ESP32 Pin | Purpose |
|----------|-----------|---------|
| VCC | 3.3V | Power Supply |
| GND | GND | Ground |
| SDA | GPIO 21 | I2C Data |
| SCL | GPIO 22 | I2C Clock |

**Power Supply Requirements:**

External Power Source (5V, 500mA min)
│
└── 3.3V Voltage Regulator (with 100µF capacitor)
│
├── ESP32 VCC
├── MPU6050 VCC
├── DHT22 VCC
└── OLED VCC

All components share common GND with external source
---

## I2C Configuration

### Clock Speed
- **I2C Clock Frequency**: 400 kHz (Fast Mode)
- Configured in firmware: `Wire.setClock(400000);`
- Both MPU6050 and OLED support 400 kHz operation

### Pull-up Resistors
- **SDA Pull-up**: 4.7 kΩ to 3.3V (usually on breakout boards)
- **SCL Pull-up**: 4.7 kΩ to 3.3V (usually on breakout boards)
- **DHT22 DATA Pull-up**: 10 kΩ to 3.3V (required for DHT22)

### Device Addresses
- **MPU6050**: 0x68 (AD0 pin connected to GND)
- **OLED**: 0x3C (primary) or 0x3D (if jumper modified)
- **I2C Scanner** implemented in firmware for automatic detection

---

## Power Specifications

### Power Consumption

| Component | Typical Current | Peak Current | Voltage |
|-----------|-----------------|--------------|---------|
| ESP32 (Idle) | 20 mA | 80 mA | 3.3V |
| ESP32 (WiFi Transmit) | 200 mA | 500 mA | 3.3V |
| MPU6050 (Active) | 3.7 mA | 6.8 mA | 3.3V |
| DHT22 (Sampling) | 0.5 mA | 2.5 mA | 3.3V |
| OLED (Display On) | 15 mA | 25 mA | 3.3V |
| **Total (Normal)** | **~40 mA** | **100 mA** | **3.3V** |
| **Total (WiFi TX)** | **~220 mA** | **560 mA** | **3.3V** |

### Power Supply Requirements
- **Input Voltage**: 5V USB or external power supply
- **3.3V Rail**: Minimum 1A capacity (500 mA recommended for continuous operation)
- **Recommended Power Source**: USB power bank (5V, 2A) or DC adapter with 3.3V regulator
- **Decoupling Capacitor**: 100 µF across 3.3V supply near ESP32

---

## Sensor Sampling and Data Flow

### Sampling Rates
- **MPU6050 Acceleration**: 100 Hz (10 ms interval)
- **DHT22 Temperature**: 0.5 Hz (one reading every 2000 ms)
- **OLED Display Update**: Every 50 samples (~500 ms for visual update)
- **ThingSpeak Cloud Upload**: Every 15 seconds

### Data Buffer Organization
- **Acceleration Buffer**: 100 samples @ 100 Hz = 1 second of history
  - `accelX_buf[100]` - X-axis acceleration
  - `accelY_buf[100]` - Y-axis acceleration
  - `accelZ_buf[100]` - Z-axis acceleration
- **Temperature Reading**: Single value updated every 2 seconds
- **Feature Extraction**: Performed every 100 acceleration samples

### Feature Extraction Pipeline

Raw Accelerometer Data (100 Hz)
↓
Circular Buffer (100 samples)
↓
Buffer Full (1 second of data)
↓
Feature Extraction
├── RMS (Root Mean Square) per axis
│ Formula: RMS = sqrt(Σ(x²) / N)
│
├── Peak Value per axis
│ Formula: Peak = max(abs(x))
│
└── Temperature Reading
(Updated every 2 seconds from DHT22)
↓
Neural Network Scoring
Input: 3 RMS values + 1 Temperature
↓
Anomaly Detection
Output: Score 0.0 to 1.0
↓
Alert Classification
├── Normal: Score ≤ 0.65
├── Warning: 0.65 < Score < 0.85
└── Critical: Score ≥ 0.85

