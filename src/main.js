// CARDIAC RECOVERY PRO - Fast Launch Version
// Importing all styles
import './styles/main.css';
import './styles/print.css';
import './styles/mobile-responsive.css';

console.log('🚀 Cardiac Recovery Pro - Initializing...');

// Import the app loader
import { initializeApp } from './app-loader.js';

// Load HTML content first, then initialize the app
(async () => {
  const loaded = await initializeApp();

  if (loaded) {
    console.log('✅ HTML content loaded, initializing JavaScript...');

    // Load app-core.js from public folder (not processed by Vite)
    // It assigns functions to window object directly
    const coreScript = document.createElement('script');
    coreScript.src = '/app-core.js?v=8d8b954';
    coreScript.type = 'text/javascript';
    document.body.appendChild(coreScript);

    // Wait for core script to load
    await new Promise(resolve => {
      coreScript.onload = () => {
        console.log('✅ app-core.js loaded successfully');
        resolve();
      };
      coreScript.onerror = () => {
        console.error('❌ Failed to load app-core.js');
        resolve();
      };
    });

    // NOTE: Removed await import('./app-core.js') - now loaded as regular script above
    
    // Import utility modules
    await import('./utils/gps-tracker.js');
    await import('./utils/backup-restore.js');
    await import('./utils/symptoms-logger.js');
    await import('./utils/emergency-alerts.js');
    await import('./utils/pwa-install.js');
    await import('./utils/milestones.js');
    await import('./utils/chart-validator.js');
    await import('./utils/recovery-protocol.js');
    await import('./utils/data-validation.js');
    // Normalize labels/icons after core is ready
    await import('./normalizers.js');

    console.log('✅ Cardiac Recovery Pro fully loaded!');
    console.log('✅ All utility modules loaded: GPS, Backup, Symptoms, Alerts, Validation, PWA, Protocol, Milestones, ChartValidator');

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
