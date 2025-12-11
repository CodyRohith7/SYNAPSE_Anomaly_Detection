import React, { useState, useEffect } from 'react';
import './styles/App.css';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import { io } from 'socket.io-client';
import axios from 'axios';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [liveData, setLiveData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [theme, setTheme] = useState('dark');
  const [isConnected, setIsConnected] = useState(false);

  const API_URL = 'http://localhost:5000';
  const SOCKET_URL = 'http://localhost:5000';

  // Initialize WebSocket connection
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket Connected');
      setIsConnected(true);
    });

    socket.on('data_update', (data) => {
      setLiveData(data);
    });

    socket.on('history_update', (data) => {
      setHistoricalData(data);
    });

    socket.on('alert', (alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 50));
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket Disconnected');
      setIsConnected(false);
    });

    return () => socket.close();
  }, []);

  // Fetch initial data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [latest, history] = await Promise.all([
          axios.get(`${API_URL}/api/latest`),
          axios.get(`${API_URL}/api/history?results=100`),
        ]);
        setLiveData(latest.data);
        setHistoricalData(history.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={`app ${theme}`}>
      <Navigation 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
        onThemeToggle={toggleTheme}
        isConnected={isConnected}
      />
      <main className="main-content">
        {currentPage === 'dashboard' && (
          <Dashboard 
            liveData={liveData} 
            historicalData={historicalData}
            alerts={alerts}
          />
        )}
        {currentPage === 'analytics' && (
          <Analytics historicalData={historicalData} />
        )}
        {currentPage === 'settings' && (
          <Settings />
        )}
      </main>
    </div>
  );
}

export default App;
