import React, { useState } from 'react';
import { motion } from 'framer-motion';
import '../styles/Settings.css';

const Settings = () => {
  const [settings, setSettings] = useState({
    updateInterval: 10,
    chartHistoryLength: 100,
    thresholdWarning: 50,
    thresholdCritical: 85,
    enableNotifications: true,
    enableSoundAlerts: true,
    emailAlerts: false,
    emailAddress: 'user@example.com',
  });

  const [savedMessage, setSavedMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = () => {
    localStorage.setItem('synapseSettings', JSON.stringify(settings));
    setSavedMessage('✅ Settings saved successfully!');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      const defaultSettings = {
        updateInterval: 10,
        chartHistoryLength: 100,
        thresholdWarning: 50,
        thresholdCritical: 85,
        enableNotifications: true,
        enableSoundAlerts: true,
        emailAlerts: false,
        emailAddress: 'user@example.com',
      };
      setSettings(defaultSettings);
      localStorage.setItem('synapseSettings', JSON.stringify(defaultSettings));
      setSavedMessage('✅ Settings reset to defaults!');
      setTimeout(() => setSavedMessage(''), 3000);
    }
  };

  return (
    <motion.div 
      className="settings-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1>⚙️ Settings & Preferences</h1>

      {savedMessage && (
        <motion.div 
          className="success-message"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {savedMessage}
        </motion.div>
      )}

      <div className="settings-grid">
        {/* Data Settings */}
        <motion.div className="settings-card" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <h2>📊 Data Collection</h2>
          
          <div className="setting-item">
            <label htmlFor="updateInterval">Update Interval (seconds)</label>
            <input
              type="range"
              id="updateInterval"
              name="updateInterval"
              min="5"
              max="60"
              value={settings.updateInterval}
              onChange={handleChange}
            />
            <span className="value">{settings.updateInterval}s</span>
          </div>

          <div className="setting-item">
            <label htmlFor="chartHistoryLength">Chart History Length</label>
            <select 
              id="chartHistoryLength" 
              name="chartHistoryLength" 
              value={settings.chartHistoryLength}
              onChange={handleChange}
            >
              <option value="50">Last 50 entries</option>
              <option value="100">Last 100 entries</option>
              <option value="200">Last 200 entries</option>
              <option value="500">Last 500 entries</option>
            </select>
          </div>
        </motion.div>

        {/* Alert Thresholds */}
        <motion.div className="settings-card" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          <h2>🚨 Alert Thresholds</h2>
          
          <div className="setting-item">
            <label htmlFor="thresholdWarning">Warning Threshold (%)</label>
            <input
              type="range"
              id="thresholdWarning"
              name="thresholdWarning"
              min="10"
              max="80"
              value={settings.thresholdWarning}
              onChange={handleChange}
            />
            <span className="value">{settings.thresholdWarning}%</span>
          </div>

          <div className="setting-item">
            <label htmlFor="thresholdCritical">Critical Threshold (%)</label>
            <input
              type="range"
              id="thresholdCritical"
              name="thresholdCritical"
              min="50"
              max="100"
              value={settings.thresholdCritical}
              onChange={handleChange}
            />
            <span className="value">{settings.thresholdCritical}%</span>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div className="settings-card" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
          <h2>🔔 Notifications</h2>
          
          <div className="setting-checkbox">
            <input
              type="checkbox"
              id="enableNotifications"
              name="enableNotifications"
              checked={settings.enableNotifications}
              onChange={handleChange}
            />
            <label htmlFor="enableNotifications">Enable Browser Notifications</label>
          </div>

          <div className="setting-checkbox">
            <input
              type="checkbox"
              id="enableSoundAlerts"
              name="enableSoundAlerts"
              checked={settings.enableSoundAlerts}
              onChange={handleChange}
            />
            <label htmlFor="enableSoundAlerts">Enable Sound Alerts</label>
          </div>

          <div className="setting-checkbox">
            <input
              type="checkbox"
              id="emailAlerts"
              name="emailAlerts"
              checked={settings.emailAlerts}
              onChange={handleChange}
            />
            <label htmlFor="emailAlerts">Enable Email Alerts</label>
          </div>

          {settings.emailAlerts && (
            <div className="setting-item">
              <label htmlFor="emailAddress">Email Address</label>
              <input
                type="email"
                id="emailAddress"
                name="emailAddress"
                value={settings.emailAddress}
                onChange={handleChange}
                placeholder="your@email.com"
              />
            </div>
          )}
        </motion.div>

        {/* System Info */}
        <motion.div className="settings-card system-info" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
          <h2>💻 System Information</h2>
          
          <div className="info-item">
            <span>Application</span>
            <span>SYNAPSE Elite v1.0.0</span>
          </div>

          <div className="info-item">
            <span>Frontend Framework</span>
            <span>React 18.x</span>
          </div>

          <div className="info-item">
            <span>Backend Server</span>
            <span>Express.js + Socket.io</span>
          </div>

          <div className="info-item">
            <span>Data Source</span>
            <span>ThingSpeak API</span>
          </div>

          <div className="info-item">
            <span>Last Updated</span>
            <span>{new Date().toLocaleString()}</span>
          </div>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="settings-actions">
        <motion.button 
          className="btn btn-primary"
          onClick={handleSave}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ✅ Save Settings
        </motion.button>

        <motion.button 
          className="btn btn-danger"
          onClick={handleReset}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🔄 Reset to Default
        </motion.button>
      </div>
    </motion.div>
  );
};

export default Settings;
