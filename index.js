import { registerRootComponent } from 'expo';
import App from './src/App';

// Error handling
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
  });
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled rejection:', event.reason);
  });
}

registerRootComponent(App);
