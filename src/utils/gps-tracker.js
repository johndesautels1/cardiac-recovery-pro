// ============================================================================
// GPS LOCATION TRACKING MODULE
// ============================================================================

let currentLocation = null;
let locationPermissionGranted = false;

/**
 * Request GPS location from user
 * @returns {Promise<Object>} Location coordinates
 */
export async function requestLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: new Date().toISOString()
                };
                locationPermissionGranted = true;
                console.log('📍 Location acquired:', currentLocation);
                resolve(currentLocation);
            },
            (error) => {
                console.warn('⚠️ Location error:', error.message);
                reject(error);
            },
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 300000 // Cache for 5 minutes
            }
        );
    });
}

/**
 * Get location with friendly label
 * @returns {Promise<Object>} Location data with label
 */
export async function getLocationLabel() {
    try {
        const location = await requestLocation();
        const label = `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;

        return {
            coords: location,
            label: label,
            type: 'outdoor', // Could be determined by comparing to saved locations
            googleMapsUrl: `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
        };
    } catch (error) {
        return {
            coords: null,
            label: 'Location not available',
            type: 'unknown',
            error: error.message
        };
    }
}

/**
 * Format location for HTML display
 * @param {Object} locationData - Location data object
 * @returns {string} HTML string
 */
export function formatLocation(locationData) {
    if (!locationData || !locationData.coords) {
        return '<span class="location-unavailable">📍 Location not recorded</span>';
    }

    const { latitude, longitude } = locationData.coords;
    const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

    return `
        <div class="location-display" style="display: inline-flex; align-items: center; gap: 6px;">
            <span class="location-icon">📍</span>
            <a href="${googleMapsLink}"
               target="_blank"
               rel="noopener noreferrer"
               class="location-link"
               style="color: var(--cyan); text-decoration: none; font-size: 0.9rem;">
                ${locationData.label}
            </a>
        </div>
    `;
}

/**
 * Attach location to data entry
 * @param {Object} metrics - Metrics data object
 * @returns {Promise<Object>} Metrics with location attached
 */
export async function attachLocationToEntry(metrics) {
    try {
        const locationData = await getLocationLabel();
        return {
            ...metrics,
            location: locationData
        };
    } catch (error) {
        console.warn('Could not attach location:', error);
        return metrics;
    }
}

// Expose to window for onclick handlers
if (typeof window !== 'undefined') {
    window.requestLocation = requestLocation;
    window.getLocationLabel = getLocationLabel;
    window.formatLocation = formatLocation;
    console.log('✅ GPS Location Tracking Module Loaded');
}
