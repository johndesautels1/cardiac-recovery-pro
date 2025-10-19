// CARDIAC RECOVERY PRO - Fast Launch Version
// Importing all styles
import './styles/main.css';

console.log('🚀 Cardiac Recovery Pro - Initializing...');

// Import the app loader
import { initializeApp } from './app-loader.js';

// Load HTML content first, then initialize the app
(async () => {
  const loaded = await initializeApp();

  if (loaded) {
    console.log('✅ HTML content loaded, initializing JavaScript...');

    // Now import and run all the JavaScript functionality
    // This ensures DOM elements exist before JS tries to access them
    await import('./app-core.js');

    console.log('✅ Cardiac Recovery Pro fully loaded!');

    // Register Service Worker for PWA offline support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.warn('⚠️ Service Worker registration failed:', error);
        });
    }
  } else {
    console.error('❌ Failed to initialize app');
  }
})();
