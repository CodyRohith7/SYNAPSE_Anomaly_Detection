import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import '../styles/RealTimeMetrics.css';

const RealTimeMetrics = ({ data }) => {
  const metrics = useMemo(() => {
    if (!data) return null;

    const totalVibration = Math.sqrt(
      data.vibration_x ** 2 + data.vibration_y ** 2 + data.vibration_z ** 2
    );

    return {
      vibration_x: data.vibration_x?.toFixed(2) || 0,
      vibration_y: data.vibration_y?.toFixed(2) || 0,
      vibration_z: data.vibration_z?.toFixed(2) || 0,
      total_vibration: totalVibration?.toFixed(2) || 0,
      temperature: data.temperature?.toFixed(1) || 0,
      anomaly_score: (data.anomaly_score * 100)?.toFixed(1) || 0,
      peak_vibration: data.peak_vibration?.toFixed(2) || 0,
      system_status: data.system_status === 1 ? '🟢 Online' : '🔴 Offline',
    };
  }, [data]);

  if (!metrics) return <div className="loading">Loading metrics...</div>;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div 
      className="metrics-grid"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div className="metric-card vibration" variants={item}>
        <div className="metric-icon">📊</div>
        <div className="metric-content">
          <span className="label">Vibration X</span>
          <span className="value">{metrics.vibration_x} m/s²</span>
        </div>
      </motion.div>

      <motion.div className="metric-card vibration" variants={item}>
        <div className="metric-icon">📊</div>
        <div className="metric-content">
          <span className="label">Vibration Y</span>
          <span className="value">{metrics.vibration_y} m/s²</span>
        </div>
      </motion.div>

      <motion.div className="metric-card vibration" variants={item}>
        <div className="metric-icon">📊</div>
        <div className="metric-content">
          <span className="label">Vibration Z</span>
          <span className="value">{metrics.vibration_z} m/s²</span>
        </div>
      </motion.div>

      <motion.div className="metric-card total" variants={item}>
        <div className="metric-icon">⚡</div>
        <div className="metric-content">
          <span className="label">Total Vibration</span>
          <span className="value highlight">{metrics.total_vibration} m/s²</span>
        </div>
      </motion.div>

      <motion.div className="metric-card temperature" variants={item}>
        <div className="metric-icon">🌡️</div>
        <div className="metric-content">
          <span className="label">Temperature</span>
          <span className="value">{metrics.temperature}°C</span>
        </div>
      </motion.div>

      <motion.div className="metric-card anomaly" variants={item}>
        <div className="metric-icon">🧠</div>
        <div className="metric-content">
          <span className="label">Anomaly Score</span>
          <span className="value">{metrics.anomaly_score}%</span>
        </div>
      </motion.div>

      <motion.div className="metric-card peak" variants={item}>
        <div className="metric-icon">⚡</div>
        <div className="metric-content">
          <span className="label">Peak Vibration</span>
          <span className="value">{metrics.peak_vibration} m/s²</span>
        </div>
      </motion.div>

      <motion.div className="metric-card system" variants={item}>
        <div className="metric-icon">💻</div>
        <div className="metric-content">
          <span className="label">System Status</span>
          <span className="value">{metrics.system_status}</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RealTimeMetrics;
