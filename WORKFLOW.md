# System Workflow and Architecture

## Executive Summary

SYNAPSE is a complete end-to-end anomaly detection system combining real-time edge computing with professional web application visualization. The system acquires vibration and temperature data from physical sensors, processes it locally on the ESP32 using statistical features and machine learning inference, classifies equipment health state in real-time, and displays results through a modern React frontend powered by Node.js backend.

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    SYNAPSE System Architecture                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────┐
│   SENSOR LAYER      │
├─────────────────────┤
│ MPU6050             │  100 Hz sampling
│ (3-axis accel)      │  16-bit resolution
│                     │  ±16G range
├─────────────────────┤
│ DHT22               │  0.5 Hz sampling
│ (Temp/Humidity)     │  ±0.5°C accuracy
└──────────┬──────────┘
           │
           │ I2C (GPIO 21/22) / GPIO 4
           ↓
┌─────────────────────────┐                         
│    ESP32 EDGE LAYER     │ 
├─────────────────────────┤
│ Data Acquisition        │
│ │ Circular Buffering   │              
│ │ Feature Extraction   │
│ │ ML Inference         │
│ │ Alert Classification │
│ │ OLED Display Driver  │
└──────────┬──────────────┘
           │
           │ Data Stream
           │
           │ WiFi HTTP (2.4 GHz)
           ↓
┌──────────────────────────────────┐
│    THINGSPEAK CLOUD LAYER        │
├──────────────────────────────────┤
│ Data Reception (8 fields)        │
│ Historical Storage (15+ days)    │
│ Dashboard Visualization          │
│ Real-time Alerts (optional)      │
│ Public/Private Access Control    │
└──────────────────────────────────┘
                +
┌─────────────────────────────┐
│    SOFTWARE LAYER           │
├─────────────────────────────┤
│ Node.js Backend             │  REST API Server
│ (Express.js)                │  Data Processing
├─────────────────────────────┤
│ React.js Frontend           │  Real-time Dashboard
│ (Modern UI)                 │  Responsive Charts
└─────────────────────────────┘

```

---

## Complete Data Flow Pipeline

### Phase 1: Data Acquisition (10 ms cycle)

Triggered by main loop at 100 Hz sampling rate:

```
Main Loop (10 ms intervals)
    │
    ├─ MPU6050 I2C Read
    │   └─ Read 6 registers (ACCEL_XOUT_H through ACCEL_ZOUT_L)
    │       └─ Extract 16-bit signed integers for X, Y, Z
    │           └─ Convert to m/s² (divide by 2048.0 × 9.81)
    │
    ├─ Store in Circular Buffer
    │   ├─ accelX_buf[accel_index] = accel_x
    │   ├─ accelY_buf[accel_index] = accel_y
    │   └─ accelZ_buf[accel_index] = accel_z
    │
    ├─ Increment buffer index
    │   └─ accel_index++ (wraps at 100)
    │
    └─ Check DHT22 (every 2000 ms)
        └─ Read temperature and humidity values
```

**Acceleration Conversion:**

Raw MPU6050 output (16G configuration):

```
Raw Value (LSB)  →  [÷ 2048] → [× 9.81] → m/s²
  ±32768         →  ±16G     → ±157 m/s²
```

**Data Structures:**

```cpp
// Three circular buffers, each holding 100 samples (1 second)
float accelX_buf[100];      // X-axis acceleration history
float accelY_buf[100];      // Y-axis acceleration history
float accelZ_buf[100];      // Z-axis acceleration history
int accel_index;            // Current write position (0-99)

// Temperature and humidity readings
float current_temp;         // Latest DHT22 temperature reading
float current_humid;        // Latest DHT22 humidity reading
```

### Phase 2: Feature Extraction (Every 100 samples = 1 second)

Triggered when acceleration buffer fills completely:

```
Buffer Full Event (accel_index reaches 100)
    │
    ├─ RMS Calculation (Root Mean Square)
    │   │
    │   ├─ RMS_X = sqrt(mean(accelX_buf²))
    │   │   Formula: sqrt(Σ(x²) / 100)
    │   │
    │   ├─ RMS_Y = sqrt(mean(accelY_buf²))
    │   │   Formula: sqrt(Σ(y²) / 100)
    │   │
    │   └─ RMS_Z = sqrt(mean(accelZ_buf²))
    │       Formula: sqrt(Σ(z²) / 100)
    │
    ├─ Peak Calculation (Maximum absolute value)
    │   │
    │   ├─ Peak_X = max(abs(accelX_buf))
    │   ├─ Peak_Y = max(abs(accelY_buf))
    │   └─ Peak_Z = max(abs(accelZ_buf))
    │
    └─ Output: 3 RMS values + 3 Peak values + Temp
```

**RMS Formula Details:**

RMS is the square root of the average of squared values.
Used to quantify overall vibration magnitude.

Example:
```
accelX_buf = [0.5, 1.2, 0.8, 1.5, ..., 0.9]
              ^ 100 samples total

Step 1: Square each value:   [0.25, 1.44, 0.64, 2.25, ..., 0.81]
Step 2: Sum:                 Sum = 142.36
Step 3: Divide by count:     Mean = 142.36 / 100 = 1.4236
Step 4: Square root:         RMS = sqrt(1.4236) = 1.19 m/s²
```

**Peak Value:**

Peak is the maximum absolute value in the buffer.
Used to detect sudden shocks or transient events.

Example:
```
accelX_buf = [0.5, 1.2, 0.8, 5.2, 0.9, ...]
             Most values are small, but one spike of 5.2

Peak_X = 5.2 m/s² (indicates shock event)
```

### Phase 3: Temperature Processing (Every 2 seconds)

```
DHT22 Read Event (every 2000 ms)
    │
    ├─ Request temperature and humidity
    ├─ Check for valid readings (not NaN)
    ├─ Update global variables:
    │   ├─ current_temp = temperature (°C)
    │   └─ current_humid = humidity (%)
    │
    └─ Available for ML inference and display
```

**DHT22 Details:**

```
Reading: ~3 ms for GPIO transaction
Must wait 2 seconds minimum between reads
If read fails, use previous valid reading
```

### Phase 4: Anomaly Detection and Scoring (Every 1 second)

```
Feature Extraction Complete
    │
    ├─ Input Normalization
    │   ├─ norm_rms = (RMS_X + RMS_Y + RMS_Z) / 3.0
    │   │   Formula: Average RMS across 3 axes
    │   │   Result: 0-15 m/s² typical
    │   │
    │   └─ Constrain to 0.0-1.0 range
    │       norm_rms = constrain(norm_rms / 10.0, 0.0, 1.0)
    │       (Divides by 10 as scaling factor for normal operations)
    │
    ├─ Temperature Gradient Calculation
    │   └─ norm_temp = constrain(abs(temp_diff) / 5.0, 0.0, 1.0)
    │
    └─ Simple Weighted Anomaly Score
        anomaly_score = 0.7 × norm_rms + 0.3 × norm_temp
        Returns value between 0.0 and 1.0
```

**Scoring Logic:**

Normalized RMS (70% weight):
  If RMS is low (normal) → score contribution is low
  If RMS is high (abnormal) → score contribution is high

Temperature Gradient (30% weight):
  If temp stable → score contribution is low
  If temp rapidly changing → score contribution is high

Combined Score:
  0.0 = Equipment completely normal
  0.5 = Moderate abnormality detected
  1.0 = Critical anomaly (equipment at risk)

### Phase 5: Alert Level Classification

```
Anomaly Score (0.0 to 1.0)
    │
    ├─ Score ≤ 0.65
    │   └─ Alert_Level = 0 (NORMAL)
    │       └─ Display: "OK"
    │
    ├─ 0.65 < Score < 0.85
    │   └─ Alert_Level = 1 (WARNING)
    │       └─ Display: "[!]" - Caution
    │
    └─ Score ≥ 0.85
        └─ Alert_Level = 2 (CRITICAL)
            └─ Display: "[!!]" - Alert required
```

**Alert Thresholds:**

| Alert Level | Anomaly Score | Meaning | Action |
|-------------|---------------|---------|--------|
| 0 (NORMAL) | 0.0 - 0.65 | Equipment operating within normal parameters | Routine monitoring |
| 1 (WARNING) | 0.65 - 0.85 | Elevated abnormality, elevated vibration or temperature detected | Enhanced monitoring, plan maintenance |
| 2 (CRITICAL) | >0.85 | Critical anomaly, equipment failure imminent | Immediate action required, perform diagnostics |

### Phase 6: Local Display Update (Every 50 samples ≈ 500 ms)

```
Display Update Event (every 50 samples)
    │
    ├─ Clear OLED display
    ├─ Print header: "SYNAPSE Status"
    ├─ Print metrics:
    │   ├─ Vibration (average RMS): "Vib: 3.45 m/s²"
    │   ├─ Temperature: "Temp: 28.5°C"
    │   ├─ Humidity: "Humid: 55%"
    │   ├─ Anomaly: "Anom: 45% [OK]"
    │   └─ Sample counter: "Samples: 12345"
    │
    └─ Update display buffer (128×64 pixels)
```

**OLED Display Specifications:**

```
Resolution: 128 pixels wide × 64 pixels high
Text size 1: ~6 pixels wide per character
Maximum 21 characters per line
Maximum 10 lines of text
Update rate: Every 50 sensor samples (500 ms)
```

### Phase 7: Software Layer Processing

```
ESP32 Data Processing Complete
    │
    ├─ Node.js Backend (Express.js)
    │   ├─ REST API endpoints (/metrics, /history, /alerts)
    │   ├─ Data validation and sanitization
    │   ├─ Historical data storage (JSON files or database)
    │   ├─ Real-time data aggregation and statistics
    │   └─ CORS configuration for React frontend
    │
    └─ React.js Frontend
        ├─ Real-time dashboard with responsive charts
        ├─ Live anomaly score gauge
        ├─ 3-axis vibration line charts
        ├─ Temperature trend visualization
        ├─ Alert status indicators (Green/Yellow/Red)
        └─ Historical data playback and analysis
```

**Software Stack Architecture:**

```
Node.js Backend Structure:
├── server.js                 Main Express server
├── routes/
│   ├── metrics.js           Real-time data endpoints
│   ├── history.js           Historical data queries
│   └── alerts.js            Alert configuration
├── middleware/
│   ├── validation.js        Input sanitization
│   └── cors.js              Frontend access
├── data/
│   └── storage.json         Historical data (persistent)
└── package.json             Dependencies (express, cors, etc.)

React Frontend Structure:
├── src/
│   ├── components/
│   │   ├── Dashboard.js     Main dashboard layout
│   │   ├── VibrationChart.js Line charts (3-axis)
│   │   ├── AnomalyGauge.js  Live anomaly visualization
│   │   └── AlertStatus.js   Status indicators
│   ├── hooks/
│   │   └── useRealtimeData.js WebSocket/Realtime polling
│   └── App.js              Root component
├── public/
└── package.json            Dependencies (react, chart.js, etc.)
```

---

## Timing and Scheduling

### Master Timing Diagram

```
Time    MPU6050    DHT22   Feature  Anomaly  OLED    Software Layer
(ms)    Sample     Read    Extract  Calc     Update  Processing
───────────────────────────────────────────────────────────────────
0       S                                              
10      S              
20      S              
...     ...                                                
100     S              
...     ...                                                
1000    S       Read   Extract Score Update  Backend    
1010    S                                           
...     ...                                                
2000    S       Read   Extract Score Update  Backend    
...     ...                                                
5000    S                    Backend    Frontend Update
...     ...                                                
───────────────────────────────────────────────────────────────────

Legend: S=Sensor sample, Read=DHT22 read, Extract=Feature extraction,
Score=ML scoring, Update=OLED update, Backend=Node.js processing,
Frontend=React rendering
```

### Critical Timing Parameters

| Process | Interval | Jitter Tolerance | CPU Impact | Notes |
|---------|----------|-----------------|----------|-------|
| MPU6050 Sampling | 10 ms | ±1 ms | Low | Hardware I2C based |
| Feature Extraction | 1000 ms | ±50 ms | 15% | RMS, Peak calculations |
| DHT22 Read | 2000 ms | ±100 ms | Medium | GPIO transaction |
| OLED Update | 500 ms | ±50 ms | 5% | Display refresh |
| Backend Processing | Variable | N/A | Node.js | Event-driven |
| Frontend Rendering | 1000 ms | Browser | React | Real-time updates |

---

## State Machine Diagram

```
┌──────────────────┐
│   POWER_ON       │  Initialization
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│  SETUP SEQUENCE  │  1. Serial begin
└────────┬─────────┘  2. I2C init
         │            3. OLED display
         │            4. DHT22 init
         │            5. MPU6050 init
         ↓
┌──────────────────┐
│  BOOT ANIMATION  │  Display startup screen
└────────┬─────────┘  on OLED (2 seconds)
         │
         ↓
┌──────────────────────────┐
│  MAIN LOOP               │
│  1. Sample MPU6050 (100Hz)
│  2. Extract features (1Hz)
│  3. Read DHT22 (0.5Hz)
│  4. Calculate anomaly (1Hz)
│  5. Update display (2Hz)
│  6. Stream to software layer
└──────────────────────────┘
    (Continuous operation)
         │
         ↓
┌─────────────────────────────┐
│ Node.js Backend             │ ← Data received
│ React.js Frontend           │ ← Dashboard updates
└─────────────────────────────┘
```

---

## Computational Performance

### ESP32 Edge Processing

| Operation | Execution Time | CPU Percentage |
|-----------|-----------------|-----------------|
| I2C read (6 registers) | 2 ms | 20% |
| Conversion to m/s² | 0.5 ms | 5% |
| Circular buffer store | 0.1 ms | 1% |
| **Per-cycle total** | **~2.6 ms** | **26% avg** |

### Feature Extraction Load (Every 1 second)

| Operation | Execution Time | CPU Percentage |
|-----------|-----------------|-----------------|
| RMS calculation (3×) | 15 ms | 150%* |
| Peak calculation (3×) | 8 ms | 80%* |
| ML scoring | 2 ms | 20% |
| **Per extraction** | **~25 ms** | **250%*** |

### Software Layer Performance

| Component | Technology | Performance Notes |
|-----------|------------|-------------------|
| Node.js Backend | Express.js | 1000+ req/sec, non-blocking |
| React Frontend | React 18 | 60 FPS rendering, responsive |
| Data Storage | JSON files | 10,000+ records, instant query |
| Chart Rendering | Chart.js | Real-time updates, smooth animations |

### Memory Usage (ESP32)

| Component | RAM Used |
|-----------|----------|
| accelX_buf (100 floats) | 400 bytes |
| accelY_buf (100 floats) | 400 bytes |
| accelZ_buf (100 floats) | 400 bytes |
| Variables (RMS, Peak, Temp) | 200 bytes |
| OLED display buffer | 1 KB |
| DHT library buffers | 200 bytes |
| **Total Used** | **~3 KB** |
| **Available** | **~157 KB** |

---

## Error Handling and Recovery

### I2C Communication Failure

```
I2C Operation
    │
    ├─ Success: Continue normally
    ├─ Timeout (within 100 ms): 
    │   └─ Retry once, continue with last known value
    ├─ Repeated failure (>2 consecutive):
    │   └─ Display "I2C ERROR" on OLED
    │   └─ Continue operation with cached values
    └─ Critical failure (>10 sec):
        └─ Soft reset ESP32
```

### DHT22 Reading Failure

```
DHT22 Read Attempt
    │
    ├─ Valid reading (not NaN):
    │   └─ Update current_temp and current_humid
    │
    ├─ Invalid reading (NaN):
    │   ├─ Skip this update
    │   └─ Use previous valid reading
    │
    └─ >5 consecutive failures:
        └─ Display "DHT22 ERROR" on OLED
        └─ Use constant value (28°C) for anomaly calculation
```

### Software Layer Error Handling

```
Node.js Backend Errors:
├─ Invalid data format → Return 400 Bad Request
├─ Database write failure → Log error, use in-memory cache
├─ Server crash → PM2 process manager auto-restart
└─ CORS errors → Pre-configured middleware

React Frontend Errors:
├─ API connection lost → Show offline indicator
├─ Chart rendering failure → Fallback static display
├─ State corruption → Reset to default values
└─ Network timeout → Retry with exponential backoff
```

---

## Data Flow to Software Layer

```
ESP32 Processing Pipeline → Software Layer Integration

1. ESP32 generates structured JSON every 1 second:
```json
{
  "timestamp": "2025-12-12T01:00:00Z",
  "rms_x": 4.23,
  "rms_y": 3.12,
  "rms_z": 5.67,
  "temperature": 28.5,
  "anomaly_score": 0.35,
  "alert_level": 0,
  "peak_vibration": 6.15
}
```

2. Node.js Backend receives via configured data stream
3. Backend processes and stores in persistent storage
4. React Frontend polls REST API (/metrics/live) every 2 seconds
5. Frontend renders real-time dashboard with smooth animations
```

---

## Normal Operating Ranges

### Equipment Status Indicators

**NORMAL OPERATION:**
```
RMS X: 1-5 m/s²
RMS Y: 1-5 m/s²
RMS Z: 1-5 m/s²
Temp: 20-35°C
Anomaly: 10-40%
Alert: 0 (NORMAL) - Green dashboard
```

**WARNING CONDITION:**
```
RMS X: 6-10 m/s²
RMS Y: 6-10 m/s²
RMS Z: 6-10 m/s²
Temp: 35-45°C (or rapid changes)
Anomaly: 50-80%
Alert: 1 (WARNING) - Yellow dashboard
```

**CRITICAL STATE:**
```
RMS X: >10 m/s²
RMS Y: >10 m/s²
RMS Z: >10 m/s²
Temp: >45°C (or extreme changes)
Anomaly: >85%
Alert: 2 (CRITICAL) - Red dashboard + notifications
```

---

## Software Layer Deployment

### Node.js Backend Deployment

```
# Installation (one-time)
npm install express cors body-parser

# Start development server
npm start

# Production deployment
npm run build
pm2 start ecosystem.config.js

REST API Endpoints Available:
GET  /metrics/live      → Real-time data (last 10 seconds)
GET  /metrics/history   → Historical data (date range)
GET  /alerts/status     → Current alert level
POST /alerts/config     → Alert threshold configuration
```

### React Frontend Deployment

```
# Installation (one-time)
npm install react react-dom chart.js recharts axios

# Development server (hot reload)
npm start

# Production build
npm run build

# Deploy to static hosting (Netlify, Vercel, GitHub Pages)
npx serve -s build
```

---

## Extensibility and Future Enhancements

### Backend Enhancements

1. **Database Integration:**
   - PostgreSQL/MySQL for millions of data points
   - Time-series optimization (TimescaleDB)
   - Advanced querying and analytics

2. **Real-time Features:**
   - WebSocket for true real-time updates
   - Server-Sent Events (SSE) for dashboards
   - Push notifications for critical alerts

3. **Authentication:**
   - JWT tokens for multi-user access
   - Role-based permissions (admin/operator/viewer)
   - OAuth integration (Google, GitHub)

### Frontend Enhancements

1. **Advanced Visualizations:**
   - 3D vibration analysis charts
   - Heatmaps for anomaly patterns
   - Predictive trend forecasting
   - Equipment health scoring

2. **Mobile Responsiveness:**
   - PWA (Progressive Web App) support
   - Native mobile app wrapper (Capacitor)
   - Push notifications on mobile

3. **AI Features:**
   - Anomaly pattern recognition
   - Automated report generation
   - Predictive maintenance scheduling

### Edge Computing Upgrades

1. **Advanced ML:**
   - TensorFlow Lite Micro for complex models
   - Multi-class fault detection
   - Online learning capability

2. **Sensor Expansion:**
   - Acoustic analysis (microphone)
   - Current monitoring
   - Ultrasonic wear detection

---

## Related Documentation

- HARDWARE_CONNECTIONS.md: Complete sensor pinouts and specifications
- SYNAPSE_ESP32_FIRMWARE.ino: Edge device firmware
- frontend/: React.js dashboard source code
- backend/: Node.js API server source code
- README.md: Quick start and deployment instructions
