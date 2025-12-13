// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

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
    screenTime: 0,
  });

  // Simulate receiving data from the content script
  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        clicks: prev.clicks + Math.floor(Math.random() * 5),
        keystrokes: prev.keystrokes + Math.floor(Math.random() * 3),
        scrollDistance: prev.scrollDistance + Math.floor(Math.random() * 50),
        screenTime: prev.screenTime + 1,
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatScreenTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  }

  const updatedStats = {
    ...stats,
    screenTime: formatScreenTime(stats.screenTime)
  };


  return (
    <div className="app-container">
      <h1>Screen Break AI</h1>
      <BreakButton />
      <Dashboard stats={updatedStats} />
    </div>
  );
}

export default App;
