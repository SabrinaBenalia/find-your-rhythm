import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// iOS PWA keyboard fix: readOnly trick.
// navigator.standalone can be unreliable, so run on all iOS.
// iOS only triggers the keyboard when a focused input transitions
// from readOnly → editable, not from a bare focus() call.
const SKIP_TYPES = new Set(['range', 'checkbox', 'radio', 'date', 'time', 'datetime-local', 'month', 'week', 'color', 'file', 'submit', 'button', 'reset', 'image']);
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

if (isIOS) {
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
