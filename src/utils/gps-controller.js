// Robust GPS controller: binds directly and updates global capturedLocation via setter

function getLabelFromCoords(lat, lng) {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

function bindGps() {
  const gpsButton = document.getElementById('gpsButton');
  const locationDisplay = document.getElementById('locationDisplay');
  const locationLabel = document.getElementById('locationLabel');
  const locationMapLink = document.getElementById('locationMapLink');
  if (!gpsButton) return;

  gpsButton.addEventListener('click', () => {
    gpsButton.disabled = true;
    gpsButton.innerHTML = 'Getting Location...';
    if (!navigator.geolocation) {
      if (window.showNotification) window.showNotification('Geolocation not supported', 'error');
      gpsButton.disabled = false; gpsButton.innerHTML = 'GET LOCATION';
      return;
    }
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      const loc = {
        coords: { latitude, longitude, accuracy, timestamp: new Date().toISOString() },
        label: getLabelFromCoords(latitude, longitude),
        type: 'unknown',
        googleMapsUrl: `https://www.google.com/maps?q=${latitude},${longitude}`
      };
      try {
        if (typeof window.setCapturedLocation === 'function') window.setCapturedLocation(loc);
        window.capturedLocation = loc; // fallback
      } catch {}
      if (locationDisplay && locationLabel && locationMapLink) {
        locationDisplay.style.display = 'block';
        locationLabel.textContent = loc.label;
        locationMapLink.href = loc.googleMapsUrl;
      }
      gpsButton.innerHTML = 'UPDATE LOCATION';
      gpsButton.disabled = false;
      if (window.showNotification) window.showNotification('Location captured successfully', 'success');
    }, (err) => {
      gpsButton.disabled = false;
      gpsButton.innerHTML = 'GET LOCATION';
      if (window.showNotification) window.showNotification('Could not get location: ' + err.message, 'error');
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindGps);
} else {
  bindGps();
}

