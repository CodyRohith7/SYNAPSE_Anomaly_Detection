import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import '../styles/Analytics.css';

const Analytics = ({ historicalData }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  const analytics = useMemo(() => {
    if (!historicalData || historicalData.length === 0) return null;

    const data = historicalData;
    const vibrationValues = data.map(d => d.vibration_x + d.vibration_y + d.vibration_z);
    const tempValues = data.map(d => d.temperature);
    const anomalyValues = data.map(d => d.anomaly_score * 100);

    const avg = (arr) => (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
    const max = (arr) => Math.max(...arr).toFixed(2);
    const min = (arr) => Math.min(...arr).toFixed(2);
    const count = (arr, threshold) => arr.filter(v => v > threshold).length;

    return {
      vibration: {
        avg: avg(vibrationValues),
        max: max(vibrationValues),
        min: min(vibrationValues),
        spikes: count(vibrationValues, 10),
      },
      temperature: {
        avg: avg(tempValues),
        max: max(tempValues),
        min: min(tempValues),
      },
      anomaly: {
        avg: avg(anomalyValues),
        max: max(anomalyValues),
        critical: count(anomalyValues, 85),
        warning: count(anomalyValues, 50),
      },
      uptime: '99.8%',
      totalSamples: data.length,
    };
  }, [historicalData]);

  const chartData = historicalData ? historicalData.slice(-24).map((item, idx) => ({
    index: idx,
    vibration: (item.vibration_x + item.vibration_y + item.vibration_z).toFixed(2),
    temperature: item.temperature,
    anomaly: (item.anomaly_score * 100).toFixed(1),
  })) : [];

  const alertDistribution = [
    { name: 'Normal', value: historicalData ? historicalData.filter(d => d.alert_status === 0).length : 0, color: '#00ff88' },
    { name: 'Warning', value: historicalData ? historicalData.filter(d => d.alert_status === 1).length : 0, color: '#ffaa00' },
    { name: 'Critical', value: historicalData ? historicalData.filter(d => d.alert_status === 2).length : 0, color: '#ff0000' },
  ];

  return (
    <motion.div 
      className="analytics-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1>📈 Advanced Analytics</h1>

      {analytics && (
        <>
          {/* Key Metrics Grid */}
          <div className="metrics-summary-grid">
            <motion.div className="metric-summary" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
              <h3>Vibration Analysis</h3>
              <div className="metric-item">
                <span>Average</span>
                <span className="value">{analytics.vibration.avg} m/s²</span>
              </div>
              <div className="metric-item">
                <span>Maximum</span>
                <span className="value">{analytics.vibration.max} m/s²</span>
              </div>
              <div className="metric-item">
                <span>Spikes (>10)</span>
                <span className="value">{analytics.vibration.spikes}</span>
              </div>
            </motion.div>

            <motion.div className="metric-summary" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <h3>Temperature</h3>
              <div className="metric-item">
                <span>Average</span>
                <span className="value">{analytics.temperature.avg}°C</span>
              </div>
              <div className="metric-item">
                <span>Maximum</span>
                <span className="value">{analytics.temperature.max}°C</span>
              </div>
              <div className="metric-item">
                <span>Minimum</span>
                <span className="value">{analytics.temperature.min}°C</span>
              </div>
            </motion.div>

            <motion.div className="metric-summary" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
              <h3>Anomaly Detection</h3>
              <div className="metric-item">
                <span>Critical Events</span>
                <span className="value critical">{analytics.anomaly.critical}</span>
              </div>
              <div className="metric-item">
                <span>Warnings</span>
                <span className="value warning">{analytics.anomaly.warning}</span>
              </div>
              <div className="metric-item">
                <span>Total Samples</span>
                <span className="value">{analytics.totalSamples}</span>
              </div>
            </motion.div>
          </div>

          {/* Charts */}
          <div className="analytics-charts">
            <motion.div className="chart-card" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
              <h3>Vibration Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="index" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #00ff00' }} />
                  <Line type="monotone" dataKey="vibration" stroke="#00ff88" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div className="chart-card" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
              <h3>Alert Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={alertDistribution} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={100} fill="#8884d8" dataKey="value">
                    {alertDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e' }} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default Analytics;
