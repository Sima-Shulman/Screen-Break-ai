
// export default App
import React, { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard.jsx";
import BreakButton from "./components/BreakButton.jsx";
import './App.css';

function App() {
  const [stats, setStats] = useState({
    clicks: 0,
    keystrokes: 0,
    scrollDistance: 0,
    screenTime: "0h 0m",
  });
  const formatScreenTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }

useEffect(() => {
    const loadSavedData = () => {
        chrome.storage.local.get(["total_activity"], (result) => {
            if (result.total_activity) {
                const data = result.total_activity;
                setStats({
                    clicks: data.clicks,
                    keystrokes: data.keystrokes,
                    scrollDistance: Math.floor(data.scrollDistance),
                    screenTime: formatScreenTime(data.screenTime)
                });
            }
        });
    };

    loadSavedData(); 
    const interval = setInterval(loadSavedData, 1000); 
    return () => clearInterval(interval);
}, []);

  return (
    <div className="app-container">
      <h1>Screen Break AI</h1>
      <BreakButton />
      <Dashboard stats={stats} />
    </div>
  );
}

export default App;
