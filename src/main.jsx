import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// iOS PWA: call focus() synchronously inside touchend — iOS only counts
// this as a valid keyboard gesture when it's inside a native event handler.
document.addEventListener('touchend', (e) => {
  const el = e.target;
  if ((el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) && !el.disabled && !el.readOnly) {
    el.focus();
  }
}, true);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
