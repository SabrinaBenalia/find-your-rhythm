import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import Today from './screens/Today';
import Calendar from './screens/Calendar';
import Trends from './screens/Trends';
import Correlate from './screens/Correlate';
import Settings from './screens/Settings';
import Logs from './screens/Logs';
import AIInsights from './screens/AIInsights';

function AppInner() {
  const location = useLocation();
  const [animKey, setAnimKey] = useState(0);
  const [prevPath, setPrevPath] = useState(location.pathname);

  useEffect(() => {
    if (location.pathname !== prevPath) {
      setAnimKey(k => k + 1);
      setPrevPath(location.pathname);
    }
  }, [location.pathname]);

  return (
    <div className="app">
      <div className="page-wrap" key={animKey}>
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/trends" element={<Trends />} />
          <Route path="/correlate" element={<Correlate />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/ai-insights" element={<AIInsights />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
