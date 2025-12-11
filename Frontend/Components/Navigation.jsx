import React, { useState } from 'react';
import { motion } from 'framer-motion';
import '../styles/Navigation.css';

const Navigation = ({ currentPage, onPageChange, onThemeToggle, isConnected }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
    { id: 'analytics', label: '📈 Analytics', icon: '📈' },
    { id: 'settings', label: '⚙️ Settings', icon: '⚙️' },
  ];

  return (
    <motion.nav 
      className="navigation"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="nav-container">
        {/* Logo */}
        <div className="nav-logo">
          <motion.div 
            className="logo-icon"
            animate={{ rotate: isConnected ? 360 : 0 }}
            transition={{ duration: isConnected ? 20 : 0, repeat: isConnected ? Infinity : 0, linear: true }}
          >
            ⚡
          </motion.div>
          <span>SYNAPSE</span>
        </div>

        {/* Desktop Menu */}
        <div className="nav-menu">
          {navItems.map(item => (
            <motion.button
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => onPageChange(item.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Right Section */}
        <div className="nav-right">
          {/* Connection Status */}
          <div className="connection-status">
            <motion.div
              className="status-indicator"
              animate={{ 
                opacity: isConnected ? [0.5, 1] : 0.3,
                boxShadow: isConnected ? '0 0 10px rgba(0, 255, 0, 0.5)' : 'none'
              }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{
                backgroundColor: isConnected ? '#00ff00' : '#ff0000',
              }}
            />
            <span className="status-text">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Theme Toggle */}
          <motion.button
            className="theme-toggle"
            onClick={onThemeToggle}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            🌙
          </motion.button>

          {/* Mobile Menu Button */}
          <motion.button
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            whileHover={{ scale: 1.1 }}
          >
            ☰
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          className="mobile-menu"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          {navItems.map(item => (
            <motion.button
              key={item.id}
              className={`mobile-nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => {
                onPageChange(item.id);
                setIsMobileMenuOpen(false);
              }}
              whileTap={{ scale: 0.95 }}
            >
              {item.label}
            </motion.button>
          ))}
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navigation;
