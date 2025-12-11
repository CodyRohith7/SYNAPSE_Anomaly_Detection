import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/AlertPanel.css';

const AlertPanel = ({ alerts }) => {
  const getAlertColor = (level) => {
    return level === 'CRITICAL' ? '#ff0000' : '#ffaa00';
  };

  const getAlertIcon = (level) => {
    return level === 'CRITICAL' ? '🔴' : '🟡';
  };

  return (
    <motion.div 
      className="alert-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <h2>⚠️ Alert History</h2>
      
      <div className="alerts-container">
        {alerts.length === 0 ? (
          <div className="no-alerts">
            <span>✅ All Clear! No recent alerts.</span>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {alerts.slice(0, 10).map((alert, index) => (
              <motion.div
                key={`${alert.timestamp}-${index}`}
                className={`alert-item ${alert.level.toLowerCase()}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="alert-icon">
                  {getAlertIcon(alert.level)}
                </div>
                <div className="alert-content">
                  <span className="alert-level" style={{ color: getAlertColor(alert.level) }}>
                    {alert.level}
                  </span>
                  <span className="alert-score">
                    Anomaly Score: {alert.anomaly_score?.toFixed(1)}%
                  </span>
                  <span className="alert-time">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="alert-pulse">
                  <span className="pulse"></span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
};

export default AlertPanel;
