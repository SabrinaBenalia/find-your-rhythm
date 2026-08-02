import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// iOS PWA: keyboard doesn't appear on input tap unless focus() is called
// synchronously within a touch event handler
document.addEventListener('touchend', (e) => {
  const el = e.target;
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
    el.focus();
  }
}, { passive: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
