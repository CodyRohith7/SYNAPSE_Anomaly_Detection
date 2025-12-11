const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const http = require('http');
const socketIo = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Environment Variables
const THINGSPEAK_CHANNEL_ID = process.env.THINGSPEAK_CHANNEL_ID || 'YOUR ID';
const THINGSPEAK_READ_API = process.env.THINGSPEAK_READ_API || 'YOUR API';
const PORT = process.env.PORT || 5000;

// In-memory cache
let cachedData = {
  latest: {},
  historical: [],
  alerts: [],
};

// ═════════════════════════════════════════════════════════════
// THINGSPEAK API FUNCTIONS
// ═════════════════════════════════════════════════════════════

async function fetchLatestThingSpeakData() {
  try {
    const url = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${THINGSPEAK_READ_API}&results=1`;
    const response = await axios.get(url, { timeout: 5000 });

    if (response.data.feeds && response.data.feeds.length > 0) {
      const feed = response.data.feeds[0];
      return {
        timestamp: feed.created_at,
        vibration_x: parseFloat(feed.field1) || 0,
        vibration_y: parseFloat(feed.field2) || 0,
        vibration_z: parseFloat(feed.field3) || 0,
        temperature: parseFloat(feed.field4) || 0,
        anomaly_score: parseFloat(feed.field5) || 0,
        alert_status: parseInt(feed.field6) || 0,
        peak_vibration: parseFloat(feed.field7) || 0,
        system_status: parseInt(feed.field8) || 0,
      };
    }
    return null;
  } catch (error) {
    console.error('❌ ThingSpeak API Error:', error.message);
    return null;
  }
}

async function fetchHistoricalThingSpeakData(results = 100) {
  try {
    const url = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${THINGSPEAK_READ_API}&results=${results}`;
    const response = await axios.get(url, { timeout: 10000 });

    if (response.data.feeds) {
      return response.data.feeds.map(feed => ({
        timestamp: feed.created_at,
        vibration_x: parseFloat(feed.field1) || 0,
        vibration_y: parseFloat(feed.field2) || 0,
        vibration_z: parseFloat(feed.field3) || 0,
        temperature: parseFloat(feed.field4) || 0,
        anomaly_score: parseFloat(feed.field5) || 0,
        alert_status: parseInt(feed.field6) || 0,
        peak_vibration: parseFloat(feed.field7) || 0,
        system_status: parseInt(feed.field8) || 0,
      }));
    }
    return [];
  } catch (error) {
    console.error('❌ Historical Data Error:', error.message);
    return [];
  }
}

// ═════════════════════════════════════════════════════════════
// REST API ENDPOINTS
// ═════════════════════════════════════════════════════════════

app.get('/api/latest', async (req, res) => {
  const latest = await fetchLatestThingSpeakData();
  if (latest) {
    cachedData.latest = latest;
    res.json(latest);
  } else {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.get('/api/history', async (req, res) => {
  const results = req.query.results || 100;
  const historical = await fetchHistoricalThingSpeakData(results);
  cachedData.historical = historical;
  res.json(historical);
});

app.get('/api/statistics', (req, res) => {
  const data = cachedData.historical;
  if (!data || data.length === 0) {
    return res.json({});
  }

  const vibValues = data.map(d => d.vibration_x + d.vibration_y + d.vibration_z);
  const tempValues = data.map(d => d.temperature);

  const avg = arr => (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
  const max = arr => Math.max(...arr).toFixed(2);
  const min = arr => Math.min(...arr).toFixed(2);

  res.json({
    vibration_avg: avg(vibValues),
    vibration_max: max(vibValues),
    vibration_min: min(vibValues),
    temperature_avg: avg(tempValues),
    temperature_max: max(tempValues),
    temperature_min: min(tempValues),
    total_alerts: data.filter(d => d.alert_status > 0).length,
    critical_count: data.filter(d => d.alert_status === 2).length,
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ═════════════════════════════════════════════════════════════
// WEBSOCKET EVENTS
// ═════════════════════════════════════════════════════════════

io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);
  socket.emit('data_update', cachedData.latest);

  socket.on('request_history', async () => {
    const historical = await fetchHistoricalThingSpeakData(50);
    socket.emit('history_update', historical);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// ═════════════════════════════════════════════════════════════
// POLLING INTERVAL (Every 10 seconds)
// ═════════════════════════════════════════════════════════════

let pollInterval;

async function startPolling() {
  console.log('📡 Starting ThingSpeak polling...');
  
  pollInterval = setInterval(async () => {
    const latest = await fetchLatestThingSpeakData();
    if (latest) {
      cachedData.latest = latest;
      io.emit('data_update', latest);

      if (latest.alert_status > 0) {
        const alert = {
          timestamp: new Date().toISOString(),
          level: latest.alert_status === 2 ? 'CRITICAL' : 'WARNING',
          anomaly_score: latest.anomaly_score,
        };
        cachedData.alerts.unshift(alert);
        if (cachedData.alerts.length > 100) cachedData.alerts.pop();
        io.emit('alert', alert);
      }
    }
  }, 10000);
}

// ═════════════════════════════════════════════════════════════
// SERVER STARTUP
// ═════════════════════════════════════════════════════════════

server.listen(PORT, () => {
  console.log('\n═════════════════════════════════════════════════════════');
  console.log('  🚀 SYNAPSE Elite Backend Server Started');
  console.log(`  🌐 Server: http://localhost:${PORT}`);
  console.log(`  📡 ThingSpeak Channel: ${THINGSPEAK_CHANNEL_ID}`);
  console.log('═════════════════════════════════════════════════════════\n');
  
  startPolling();
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  clearInterval(pollInterval);
  process.exit(0);
});
