import { registerRootComponent } from 'expo';
import App from './src/App';

if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (msg.includes('Unknown event handler property')) return;
    originalError(...args);
  };
}

registerRootComponent(App);
