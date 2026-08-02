import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// iOS PWA keyboard fix: readOnly trick.
// iOS only shows the keyboard when a *focused editable* input becomes
// editable, not when focus() is called directly. So we:
// 1. Set readOnly (focus without keyboard)
// 2. Call focus() so the element has focus
// 3. Remove readOnly after a frame — iOS then shows the keyboard
const SKIP_TYPES = new Set(['range', 'checkbox', 'radio', 'date', 'time', 'datetime-local', 'month', 'week', 'color', 'file', 'submit', 'button', 'reset', 'image']);
const isIOSPWA = window.navigator.standalone === true && /iphone|ipad|ipod/i.test(navigator.userAgent);

if (isIOSPWA) {
  document.addEventListener('touchstart', (e) => {
    const el = e.target;
    const isKeyboardInput = (el instanceof HTMLInputElement && !SKIP_TYPES.has(el.type)) || el instanceof HTMLTextAreaElement;
    if (!isKeyboardInput || el.readOnly || el.disabled) return;
    el.setAttribute('readonly', '');
    el.focus();
    setTimeout(() => el.removeAttribute('readonly'), 100);
  }, true);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
