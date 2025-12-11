import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart
} from 'recharts';
import { motion } from 'framer-motion';
import RealTimeMetrics from './RealTimeMetrics';
import AlertPanel from './AlertPanel';
import '../styles/Dashboard.css';

const Dashboard = ({ liveData, historicalData, alerts }) => {
  const [displayData, setDisplayData] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState('vibration');
  const [timeRange, setTimeRange] = useState('1h');

  useEffect(() => {
    if (historicalData && historicalData.length > 0) {
      const formatted = historicalData.map(item => ({
        timestamp: new Date(item.timestamp).toLocaleTimeString(),
        vibration_x: parseFloat(item.vibration_x),
        vibration_y: parseFloat(item.vibration_y),
        vibration_z: parseFloat(item.vibration_z),
        temperature: parseFloat(item.temperature),
        anomaly_score: parseFloat(item.anomaly_score),
        peak_vibration: parseFloat(item.peak_vibration),
      }));
      setDisplayData(formatted);
    }
  }, [historicalData]);

  const getAlertColor = (status) => {
    switch(status) {
      case 0: return '#00ff00';
      case 1: return '#ffaa00';
      case 2: return '#ff0000';
      default: return '#888';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 0: return '🟢 NORMAL';
      case 1: return '🟡 WARNING';
      case 2: return '🔴 CRITICAL';
      default: return 'UNKNOWN';
    }
  };

  return (
    <motion.div 
      className="dashboard-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* HEADER */}
      <div className="dashboard-header">
        <motion.h1 
          className="dashboard-title"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
        >
          ⚡ SYNAPSE Elite Dashboard
        </motion.h1>
        <div className="header-stats">
          {liveData && (
            <>
              <div className="stat-badge">
                <span className="label">System Status</span>
                <span className="value" style={{color: getAlertColor(liveData.alert_status)}}>
                  {getStatusLabel(liveData.alert_status)}
                </span>
              </div>
              <div className="stat-badge">
                <span className="label">Last Update</span>
                <span className="value">{new Date(liveData.timestamp).toLocaleTimeString()}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* REAL-TIME METRICS */}
      <RealTimeMetrics data={liveData} />

      {/* CHART CONTROLS */}
      <div className="chart-controls">
        <div className="metric-selector">
          <button 
            className={selectedMetric === 'vibration' ? 'active' : ''}
            onClick={() => setSelectedMetric('vibration')}
          >
            📊 Vibration
          </button>
          <button 
            className={selectedMetric === 'temperature' ? 'active' : ''}
            onClick={() => setSelectedMetric('temperature')}
          >
            🌡️ Temperature
          </button>
          <button 
            className={selectedMetric === 'anomaly' ? 'active' : ''}
            onClick={() => setSelectedMetric('anomaly')}
          >
            🧠 Anomaly
          </button>
        </div>
        <div className="time-range">
          <button 
            className={timeRange === '1h' ? 'active' : ''}
            onClick={() => setTimeRange('1h')}
          >
            1H
          </button>
          <button 
            className={timeRange === '6h' ? 'active' : ''}
            onClick={() => setTimeRange('6h')}
          >
            6H
          </button>
          <button 
            className={timeRange === '24h' ? 'active' : ''}
            onClick={() => setTimeRange('24h')}
          >
            24H
          </button>
        </div>
      </div>

      {/* MAIN CHARTS GRID */}
      <div className="charts-grid">
        {/* Vibration Chart */}
        {selectedMetric === 'vibration' && displayData.length > 0 && (
          <motion.div 
            className="chart-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3>📈 Vibration Analysis (3-Axis)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={displayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="timestamp" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #00ff00' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line type="monotone" dataKey="vibration_x" stroke="#00ff00" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="vibration_y" stroke="#00ffff" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="vibration_z" stroke="#ff00ff" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Temperature Chart */}
        {selectedMetric === 'temperature' && displayData.length > 0 && (
          <motion.div 
            className="chart-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3>🌡️ Temperature Monitoring</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={displayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="timestamp" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #ff9900' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="temperature" fill="#ff9900" stroke="#ff6600" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Anomaly Score Chart */}
        {selectedMetric === 'anomaly' && displayData.length > 0 && (
          <motion.div 
            className="chart-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3>🧠 Anomaly Detection Score</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={displayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="timestamp" stroke="#888" />
                <YAxis stroke="#888" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #9933ff' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value) => `${value.toFixed(1)}%`}
                />
                <Area type="monotone" dataKey="anomaly_score" fill="#9933ff" stroke="#cc66ff" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Peak Vibration Chart */}
        {displayData.length > 0 && (
          <motion.div 
            className="chart-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3>⚡ Peak Vibration</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={displayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="timestamp" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #00ccff' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="peak_vibration" fill="#00ccff" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>

      {/* ALERT PANEL */}
      <AlertPanel alerts={alerts} />
    </motion.div>
  );
};

export default Dashboard;
