// ============================================================================
// PWA INSTALLATION PROMPT HANDLER
// ============================================================================
// Manages the "Add to Home Screen" install experience
// Last Updated: Oct 20, 2025

console.log('📱 PWA Install Module Loading...');

let deferredPrompt = null;

// ============================================================================
// CAPTURE INSTALL PROMPT EVENT
// ============================================================================

window.addEventListener('beforeinstallprompt', (e) => {
    console.log('📱 Install prompt triggered');

    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();

    // Stash the event so it can be triggered later
    deferredPrompt = e;

    // Show our custom install prompt
    showInstallPrompt();
});

// ============================================================================
// SHOW CUSTOM INSTALL PROMPT
// ============================================================================

function showInstallPrompt() {
    const installPrompt = document.getElementById('installPrompt');
    if (!installPrompt) return;

    installPrompt.style.display = 'flex';

    // Add fade-in animation
    setTimeout(() => {
        installPrompt.classList.add('show');
    }, 100);
}

function hideInstallPrompt() {
    const installPrompt = document.getElementById('installPrompt');
    if (!installPrompt) return;

    installPrompt.classList.remove('show');
    setTimeout(() => {
        installPrompt.style.display = 'none';
    }, 300);
}

// ============================================================================
// HANDLE INSTALL BUTTON CLICK
// ============================================================================

function handleInstallClick() {
    if (!deferredPrompt) {
        console.log('⚠️ Install prompt not available');
        alert('Installation not available. Please use your browser\'s menu to install this app.');
        return;
    }

    // Hide our custom prompt
    hideInstallPrompt();

    // Show the browser's install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('✅ User accepted the install prompt');
            showNotification('✅ App installed! Look for it on your home screen.', 'success');
        } else {
            console.log('❌ User dismissed the install prompt');
        }

        // Clear the deferredPrompt so it can't be used again
        deferredPrompt = null;
    });
}

function handleDismissClick() {
    hideInstallPrompt();

    // Store that user dismissed it (don't show again for 7 days)
    localStorage.setItem('installPromptDismissed', Date.now());
}

// ============================================================================
// CHECK IF ALREADY INSTALLED
// ============================================================================

function isAppInstalled() {
    // Check if running in standalone mode (installed as PWA)
    if (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true) {
        return true;
    }
    return false;
}

// ============================================================================
// INITIALIZE
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
    // Don't show install prompt if already installed
    if (isAppInstalled()) {
        console.log('✅ App is already installed');
        const installPrompt = document.getElementById('installPrompt');
        if (installPrompt) {
            installPrompt.style.display = 'none';
        }
        return;
    }

    // Check if user recently dismissed the prompt
    const dismissedTime = localStorage.getItem('installPromptDismissed');
    if (dismissedTime) {
        const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 7) {
            console.log('📱 Install prompt dismissed recently, not showing again');
            const installPrompt = document.getElementById('installPrompt');
            if (installPrompt) {
                installPrompt.style.display = 'none';
            }
            return;
        }
    }

    // Attach event listeners
    const installBtn = document.getElementById('installBtn');
    const dismissBtn = document.getElementById('dismissInstallBtn');

    if (installBtn) {
        installBtn.addEventListener('click', handleInstallClick);
    }

    if (dismissBtn) {
        dismissBtn.addEventListener('click', handleDismissClick);
    }

    console.log('✅ PWA Install handlers registered');
});

// ============================================================================
// LISTEN FOR APP INSTALLED EVENT
// ============================================================================

window.addEventListener('appinstalled', (evt) => {
    console.log('✅ App was successfully installed');
    hideInstallPrompt();

    // Track installation (optional analytics)
    if (typeof gtag !== 'undefined') {
        gtag('event', 'app_installed', {
            app_name: 'Cardiac Recovery Pro'
        });
    }
});

// ============================================================================
// DISPLAY MODE DETECTION
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
    let displayMode = 'browser';

    if (window.matchMedia('(display-mode: standalone)').matches) {
        displayMode = 'standalone';
    } else if (window.navigator.standalone === true) {
        displayMode = 'standalone-ios';
    }

    console.log('📱 Display Mode:', displayMode);

    // Add class to body for display-mode-specific styling
    document.body.classList.add(`display-mode-${displayMode}`);

    // Show welcome message if just installed
    if (displayMode !== 'browser') {
        const lastLaunch = localStorage.getItem('lastLaunchMode');
        if (lastLaunch !== displayMode) {
            setTimeout(() => {
                if (typeof showNotification === 'function') {
                    showNotification('🎉 Welcome to Cardiac Recovery Pro! You\'re running in app mode.', 'success');
                }
            }, 1000);
        }
        localStorage.setItem('lastLaunchMode', displayMode);
    }
});

// ============================================================================
// OFFLINE INDICATOR
// ============================================================================

function updateOnlineStatus() {
    const isOnline = navigator.onLine;

    if (!isOnline) {
        if (typeof showNotification === 'function') {
            showNotification('📡 You\'re offline. Data will sync when you reconnect.', 'warning');
        }
        document.body.classList.add('offline-mode');
    } else {
        document.body.classList.remove('offline-mode');
    }

    console.log('📡 Online status:', isOnline ? 'ONLINE' : 'OFFLINE');
}

window.addEventListener('online', () => {
    console.log('📡 Connection restored');
    updateOnlineStatus();
    if (typeof showNotification === 'function') {
        showNotification('✅ Connection restored', 'success');
    }
});

window.addEventListener('offline', () => {
    console.log('📡 Connection lost');
    updateOnlineStatus();
});

// Check initial status
updateOnlineStatus();

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

window.handleInstallClick = handleInstallClick;
window.isAppInstalled = isAppInstalled;

console.log('✅ PWA Install Module Loaded');
