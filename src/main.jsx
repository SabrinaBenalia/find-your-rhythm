import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// iOS PWA: force keyboard on inputs via focus() + click() after 100ms.
document.addEventListener('touchend', (e) => {
  const el = e.target;
  if ((el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) && !el.disabled && !el.readOnly) {
    setTimeout(() => {
      el.focus();
      el.click();
    }, 100);
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
