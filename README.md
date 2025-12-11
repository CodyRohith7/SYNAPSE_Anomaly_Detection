# SYNAPSE: Real-Time Edge AI Anomaly Detection System
Real-time edge AI anomaly detection system with ESP32, ML model, cloud integration, and web dashboard

**Team SYNASE** | VIT Hackathon (GLYTCH 2025) | **Top 5 Finalist!** 

## Project Overview

SYNAPSE is an intelligent anomaly detection system that uses edge AI to monitor equipment vibration and temperature in real-time. 
It detects anomalies before they become problems!

### Key Features
-  Real-time vibration monitoring (100Hz sampling)
-  Temperature tracking with gradient analysis
-  On-device ML model for instant anomaly detection
-  Web dashboard via ThingSpeak
-  OLED display for local feedback

## Hardware Stack
- **Microcontroller**: ESP32
- **Accelerometer/Gyro**: MPU6050
- **Temperature Sensor**: DHT22
- **Display**: 128x64 OLED

## Project Structure

1. SYNAPSE_ESP32_Firmware.ino
2. backend/
   2.1 controllers                    
   2.2 middleware                     
   2.3 routes                      
   2.4 .env                            
   2.5 package.json                   
   2.6 server.js                      
3. frontend/
   3.1 Components                    
   3.2 Config                        
   3.3 Pages                         
   3.4 Styles                         
   3.5 Utils                          
4. HARDWARE_CONNECTIONS.md            
5. THINGSPEAK_SETUP.md                
6. WORKFLOW.md                       

## 🚀 Quick Start

### Hardware Setup
See HARDWARE_CONNECTIONS.md for detailed wiring.

### Arduino Setup
1. Install Arduino IDE
2. Install required libraries:
   - Adafruit MPU6050
   - Adafruit SSD1306
   - DHT sensor library
3. Upload `SYNAPSE_ESP32_Firmware.ino` to ESP32

### Cloud Integration
Follow THINGSPEAK_SETUP.md to set up your ThingSpeak channel.

### Dashboard
Navigate to your ThingSpeak dashboard to view real-time data!

## Team Members
1. Rohith G - https://github.com/CodyRohith7
2. Rakshitha BRN - https://github.com/BRN-RAKSHITHA
3. Koushik R -
4. Vishwa Priya V - https://github.com/vishwapriyav10a-max
5. Poorni S - https://github.com/poorni342007-byte
6. Trilok K R - https://github.com/trilok135


## Results
 **Top 5 Finalist** - VIT Hackathon (GLYTCH 2025)

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Questions?
Open an issue or contact the team!
