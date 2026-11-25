import { registerRootComponent } from 'expo';
import App from './src/App';

if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (msg.includes('Unknown event handler property')) return;
    originalError(...args);
  };

  // RNGH 3.3 Swipeable sets inline `touch-action: none` on web (its `touchAction="pan-y"`
  // prop never reaches the gesture handler), which blocks native touch scrolling inside
  // ScrollViews. Force pan-y so vertical drags scroll while horizontal drags still swipe.
  const style = document.createElement('style');
  style.textContent = 'div[style*="touch-action"]{touch-action:pan-y !important}';
  document.head.appendChild(style);
}

registerRootComponent(App);
