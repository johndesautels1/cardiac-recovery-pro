// UI Normalizers to fix garbled glyphs/icons safely at runtime
// Runs after app-core.js loads (imported by main.js)

function initializeBottomNavSafe() {
  const bottomNav = document.getElementById('bottomNav');
  if (!bottomNav) return;
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'entry', label: 'Entry' },
    { id: 'sessions', label: 'Sessions' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'history', label: 'History' },
    { id: 'videos', label: 'Videos' },
    { id: 'hrmonitor', label: 'HR Monitor' },
    { id: 'education', label: 'Learn More' },
    { id: 'bluetooth', label: 'Devices' },
    { id: 'settings', label: 'Settings' }
  ];
  let navHTML = '';
  tabs.forEach(tab => {
    navHTML += `
    <a class="bottom-nav-item ${tab.id === 'dashboard' ? 'active' : ''}"
       id="bottomNav-${tab.id}"
       onclick="switchTab('${tab.id}')"
       role="button"
       tabindex="0">
        <span class="bottom-nav-icon"></span>
        <span class="bottom-nav-label">${tab.label}</span>
    </a>`;
  });
  bottomNav.innerHTML = navHTML;
}

function sanitizeLabels() {
  try {
    const h1 = document.querySelector('header h1');
    if (h1) h1.textContent = 'CARDIAC RECOVERY PRO';

    const navBtns = document.querySelectorAll('.calendar-nav .nav-buttons button');
    const labels = ['-1 Week','-1 Day','+1 Day','+1 Week'];
    navBtns.forEach((btn, i) => { if (labels[i]) btn.textContent = labels[i]; });

    const gpsBtn = document.getElementById('gpsButton');
    if (gpsBtn) gpsBtn.textContent = 'GET LOCATION';

    const mapLink = document.getElementById('locationMapLink');
    if (mapLink) mapLink.textContent = 'View on Map';

    document.querySelectorAll('button[onclick="saveMetrics()"]')
      .forEach(btn => { btn.textContent = 'Save All Metrics'; });

    const baseline = document.getElementById('baseline-heading');
    if (baseline) baseline.textContent = 'Patient Information & Recovery Day 1';
  } catch (e) {
    console.warn('sanitizeLabels warning:', e);
  }
}

// Ensure location formatter uses plain label text for link
window.formatLocationForTable = function(location) {
  if (!location || !location.latitude) return '-';
  const mapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
  return `<a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--cyan); text-decoration: none; font-size: 0.85rem;" title="${location.label}">View</a>`;
};

// Run after a tick so core init completes
setTimeout(() => {
  try {
    initializeBottomNavSafe();
    sanitizeLabels();
  } catch (e) {
    console.warn('normalizers startup warning:', e);
  }
}, 0);

// Aggressively update any existing service worker to reduce stale cache issues
if ('serviceWorker' in navigator) {
  try {
    navigator.serviceWorker.getRegistrations()
      .then(regs => regs.forEach(r => { try { r.update(); } catch(e){} }))
      .catch(() => {});
  } catch {}
}

