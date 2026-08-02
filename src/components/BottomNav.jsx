import { useLocation, useNavigate } from 'react-router-dom';
import { Sun, Calendar, TrendingUp, Settings, Layers, BookOpen, Sparkles } from 'lucide-react';

const NAV = [
  { path: '/', icon: Sun, label: 'Today' },
  { path: '/calendar', icon: Calendar, label: 'Cal' },
  { path: '/logs', icon: BookOpen, label: 'Logs' },
  { path: '/trends', icon: TrendingUp, label: 'Trends' },
  { path: '/correlate', icon: Layers, label: 'Patterns' },
  { path: '/ai-insights', icon: Sparkles, label: 'AI' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="bottom-nav">
      {NAV.map(({ path, icon: Icon, label }) => (
        <button
          key={path}
          className={`nav-btn ${location.pathname === path ? 'active' : ''}`}
          onClick={() => navigate(path)}
          type="button"
        >
          <Icon size={18} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
