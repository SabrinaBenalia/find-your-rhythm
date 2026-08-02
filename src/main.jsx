import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// iOS PWA: force keyboard on input tap
document.addEventListener('touchstart', (e) => {
  const el = e.target;
  if (
    el.tagName === 'TEXTAREA' ||
    (el.tagName === 'INPUT' && el.type !== 'range' && el.type !== 'checkbox' && el.type !== 'date' && el.type !== 'time')
  ) {
    el.focus();
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
