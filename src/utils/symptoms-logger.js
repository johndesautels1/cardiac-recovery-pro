// ============================================================================
// SYMPTOMS QUICK-LOGGER MODULE
// ============================================================================

const SYMPTOMS = [
    { id: 'chest_pain', label: 'Chest Pain', icon: '💔', severity: 'high' },
    { id: 'sob', label: 'Shortness of Breath', icon: '😮‍💨', severity: 'high' },
    { id: 'dizziness', label: 'Dizziness', icon: '😵', severity: 'medium' },
    { id: 'fatigue', label: 'Extreme Fatigue', icon: '😴', severity: 'medium' },
    { id: 'palpitations', label: 'Heart Palpitations', icon: '💗', severity: 'medium' },
    { id: 'nausea', label: 'Nausea', icon: '🤢', severity: 'low' },
    { id: 'sweating', label: 'Cold Sweats', icon: '💦', severity: 'medium' },
    { id: 'weakness', label: 'Weakness', icon: '🦴', severity: 'low' }
];

/**
 * Log a symptom with timestamp
 * @param {string} symptomId - Symptom identifier
 * @param {Object} details - Additional details (severity, notes)
 * @returns {Object} Logged symptom data
 */
export function logSymptom(symptomId, details = {}) {
    const symptom = SYMPTOMS.find(s => s.id === symptomId);
    if (!symptom) {
        console.error('Invalid symptom ID:', symptomId);
        return null;
    }

    const symptomEntry = {
        id: `symptom-${Date.now()}`,
        symptomId: symptomId,
        label: symptom.label,
        icon: symptom.icon,
        severity: details.severity || symptom.severity,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString(),
        notes: details.notes || '',
        context: {
            duringExercise: details.duringExercise || false,
            afterMedication: details.afterMedication || false,
            ...details.context
        }
    };

    // Save to localStorage
    try {
        const symptoms = JSON.parse(localStorage.getItem('cardiacSymptoms') || '[]');
        symptoms.push(symptomEntry);
        localStorage.setItem('cardiacSymptoms', JSON.stringify(symptoms));
        console.log('✅ Symptom logged:', symptomEntry);

        // Show notification
        showSymptomNotification(symptomEntry);

        return symptomEntry;
    } catch (error) {
        console.error('Error logging symptom:', error);
        return null;
    }
}

/**
 * Show symptom notification
 */
function showSymptomNotification(symptom) {
    const notification = document.createElement('div');
    notification.className = 'symptom-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${symptom.severity === 'high' ? 'var(--bad)' : symptom.severity === 'medium' ? 'var(--warning)' : 'var(--cyan)'};
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 300px;
        animation: slideIn 0.3s ease;
    `;

    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.5rem;">${symptom.icon}</span>
            <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Symptom Logged</div>
                <div style="font-size: 0.9rem; opacity: 0.9;">${symptom.label}</div>
            </div>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Get all symptoms for a date range
 * @param {string} startDate - Start date (ISO format)
 * @param {string} endDate - End date (ISO format)
 * @returns {Array} Array of symptom entries
 */
export function getSymptoms(startDate = null, endDate = null) {
    try {
        const symptoms = JSON.parse(localStorage.getItem('cardiacSymptoms') || '[]');

        if (!startDate && !endDate) {
            return symptoms;
        }

        return symptoms.filter(s => {
            const symptomDate = new Date(s.date);
            const start = startDate ? new Date(startDate) : new Date('2000-01-01');
            const end = endDate ? new Date(endDate) : new Date('2100-01-01');
            return symptomDate >= start && symptomDate <= end;
        });
    } catch (error) {
        console.error('Error retrieving symptoms:', error);
        return [];
    }
}

/**
 * Show quick symptom logger UI
 */
export function showQuickSymptomLogger() {
    const dialog = document.createElement('div');
    dialog.className = 'symptom-logger-overlay';
    dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;

    dialog.innerHTML = `
        <div style="background: var(--background); border-radius: 12px; padding: 30px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto;">
            <h2 style="color: var(--bad); margin: 0 0 10px 0; font-size: 1.5rem;">⚠️ Log Symptom</h2>
            <p style="color: var(--muted); margin-bottom: 20px; font-size: 0.9rem;">
                Quick-log any symptoms you're experiencing
            </p>

            <div id="symptom-buttons" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px;">
                ${SYMPTOMS.map(symptom => `
                    <button
                        class="symptom-btn"
                        data-symptom-id="${symptom.id}"
                        style="padding: 16px; background: ${symptom.severity === 'high' ? 'rgba(239, 68, 68, 0.1)' : symptom.severity === 'medium' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(96, 165, 250, 0.1)'};
                        border: 2px solid ${symptom.severity === 'high' ? 'var(--bad)' : symptom.severity === 'medium' ? 'var(--warning)' : 'var(--cyan)'};
                        color: var(--text);
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                        transition: all 0.2s;
                        text-align: left;">
                        <div style="font-size: 1.5rem; margin-bottom: 6px;">${symptom.icon}</div>
                        <div style="font-size: 0.9rem;">${symptom.label}</div>
                    </button>
                `).join('')}
            </div>

            <div style="margin-bottom: 20px;">
                <label style="display: block; color: var(--text); font-weight: 600; margin-bottom: 8px;">Additional Notes (Optional)</label>
                <textarea
                    id="symptom-notes"
                    placeholder="Describe the symptom, when it happened, what you were doing..."
                    style="width: 100%; padding: 12px; border: 2px solid var(--muted); border-radius: 8px; background: var(--background); color: var(--text); min-height: 80px; resize: vertical;"
                ></textarea>
            </div>

            <div style="display: flex; gap: 12px;">
                <button id="closeSymptomLogger" style="flex: 1; padding: 14px; background: var(--muted); color: var(--text); border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                    Cancel
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(dialog);

    // Event listeners
    document.querySelectorAll('.symptom-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const symptomId = btn.dataset.symptomId;
            const notes = document.getElementById('symptom-notes').value;

            logSymptom(symptomId, { notes });
            dialog.remove();
        });

        // Hover effect
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'scale(1.05)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'scale(1)';
        });
    });

    document.getElementById('closeSymptomLogger').addEventListener('click', () => {
        dialog.remove();
    });

    // Close on overlay click
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            dialog.remove();
        }
    });
}

// Expose to window
if (typeof window !== 'undefined') {
    window.logSymptom = logSymptom;
    window.getSymptoms = getSymptoms;
    window.showQuickSymptomLogger = showQuickSymptomLogger;
    console.log('✅ Symptoms Logger Module Loaded');
}
