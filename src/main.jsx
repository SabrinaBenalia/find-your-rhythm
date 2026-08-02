import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// iOS PWA: focus inputs on touchend so keyboard appears.
// No readOnly trick — that puts iOS in "no keyboard" state for the element.
// touchend fires after the tap completes, which iOS treats as a valid gesture.
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
