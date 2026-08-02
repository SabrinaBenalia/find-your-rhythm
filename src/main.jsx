import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// iOS PWA: keyboard doesn't appear on input tap unless focus() is called
// inside a native touch handler. React's synthetic events fire too late.
document.addEventListener('touchstart', (e) => {
  const el = e.target;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    el.focus();
  }
}, true);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
