// ============================================================================
// EMERGENCY ALERT SYSTEM
// ============================================================================

// Critical thresholds for cardiac patients
const THRESHOLDS = {
    heartRate: {
        dangerouslyHigh: 180,
        high: 150,
        low: 40,
        dangerouslyLow: 35
    },
    bloodPressure: {
        systolic: {
            dangerouslyHigh: 200,
            high: 180,
            dangerouslyLow: 80
        },
        diastolic: {
            dangerouslyHigh: 120,
            high: 110,
            dangerouslyLow: 50
        }
    },
    spo2: {
        dangerouslyLow: 88,
        low: 92
    },
    temperature: {
        high: 38.5, // 101.3°F
        dangerouslyHigh: 39.5 // 103.1°F
    }
};

/**
 * Check vitals for emergency conditions
 * @param {Object} vitals - Object containing vital signs
 * @returns {Object} Alert assessment
 */
export function checkVitals(vitals) {
    const alerts = [];

    // Heart Rate checks
    if (vitals.heartRate) {
        const hr = parseFloat(vitals.heartRate);

        if (hr >= THRESHOLDS.heartRate.dangerouslyHigh) {
            alerts.push({
                type: 'emergency',
                vital: 'Heart Rate',
                value: hr,
                message: `🚨 EMERGENCY: Heart rate extremely high (${hr} bpm). Stop activity and seek immediate medical attention!`,
                action: 'CALL 911'
            });
        } else if (hr >= THRESHOLDS.heartRate.high) {
            alerts.push({
                type: 'warning',
                vital: 'Heart Rate',
                value: hr,
                message: `⚠️ WARNING: Heart rate elevated (${hr} bpm). Reduce activity intensity.`,
                action: 'SLOW DOWN'
            });
        } else if (hr <= THRESHOLDS.heartRate.dangerouslyLow) {
            alerts.push({
                type: 'emergency',
                vital: 'Heart Rate',
                value: hr,
                message: `🚨 EMERGENCY: Heart rate dangerously low (${hr} bpm). Seek immediate medical attention!`,
                action: 'CALL 911'
            });
        } else if (hr <= THRESHOLDS.heartRate.low) {
            alerts.push({
                type: 'warning',
                vital: 'Heart Rate',
                value: hr,
                message: `⚠️ WARNING: Heart rate low (${hr} bpm). Contact your doctor.`,
                action: 'CALL DOCTOR'
            });
        }
    }

    // Blood Pressure checks
    if (vitals.systolicBP && vitals.diastolicBP) {
        const sys = parseFloat(vitals.systolicBP);
        const dia = parseFloat(vitals.diastolicBP);

        if (sys >= THRESHOLDS.bloodPressure.systolic.dangerouslyHigh || dia >= THRESHOLDS.bloodPressure.diastolic.dangerouslyHigh) {
            alerts.push({
                type: 'emergency',
                vital: 'Blood Pressure',
                value: `${sys}/${dia}`,
                message: `🚨 EMERGENCY: Blood pressure critically high (${sys}/${dia} mmHg). Stop activity immediately!`,
                action: 'CALL 911'
            });
        } else if (sys >= THRESHOLDS.bloodPressure.systolic.high || dia >= THRESHOLDS.bloodPressure.diastolic.high) {
            alerts.push({
                type: 'warning',
                vital: 'Blood Pressure',
                value: `${sys}/${dia}`,
                message: `⚠️ WARNING: Blood pressure elevated (${sys}/${dia} mmHg). Rest and monitor.`,
                action: 'REST'
            });
        } else if (sys <= THRESHOLDS.bloodPressure.systolic.dangerouslyLow) {
            alerts.push({
                type: 'emergency',
                vital: 'Blood Pressure',
                value: `${sys}/${dia}`,
                message: `🚨 EMERGENCY: Blood pressure dangerously low (${sys}/${dia} mmHg). Lie down and seek help!`,
                action: 'CALL 911'
            });
        }
    }

    // SpO2 checks
    if (vitals.spo2) {
        const spo2 = parseFloat(vitals.spo2);

        if (spo2 <= THRESHOLDS.spo2.dangerouslyLow) {
            alerts.push({
                type: 'emergency',
                vital: 'Blood Oxygen',
                value: `${spo2}%`,
                message: `🚨 EMERGENCY: Blood oxygen critically low (${spo2}%). Seek immediate medical attention!`,
                action: 'CALL 911'
            });
        } else if (spo2 <= THRESHOLDS.spo2.low) {
            alerts.push({
                type: 'warning',
                vital: 'Blood Oxygen',
                value: `${spo2}%`,
                message: `⚠️ WARNING: Blood oxygen low (${spo2}%). Stop activity and rest.`,
                action: 'REST'
            });
        }
    }

    return {
        hasAlerts: alerts.length > 0,
        hasEmergency: alerts.some(a => a.type === 'emergency'),
        alerts: alerts
    };
}

/**
 * Show emergency alert dialog
 * @param {Array} alerts - Array of alert objects
 */
export function showEmergencyAlert(alerts) {
    const hasEmergency = alerts.some(a => a.type === 'emergency');

    const dialog = document.createElement('div');
    dialog.className = 'emergency-alert-overlay';
    dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        padding: 20px;
        animation: flashRed 1s infinite;
    `;

    const emergencyAlerts = alerts.filter(a => a.type === 'emergency');
    const warningAlerts = alerts.filter(a => a.type === 'warning');

    dialog.innerHTML = `
        <div style="background: var(--background); border-radius: 12px; padding: 30px; max-width: 500px; width: 100%; border: 4px solid ${hasEmergency ? 'var(--bad)' : 'var(--warning)'};">
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 4rem; margin-bottom: 10px;">${hasEmergency ? '🚨' : '⚠️'}</div>
                <h2 style="color: ${hasEmergency ? 'var(--bad)' : 'var(--warning)'}; margin: 0 0 10px 0; font-size: 1.8rem;">
                    ${hasEmergency ? 'MEDICAL EMERGENCY' : 'HEALTH WARNING'}
                </h2>
                <p style="color: var(--text); font-size: 1rem;">
                    ${hasEmergency ? 'Critical vital signs detected!' : 'Concerning vital signs detected'}
                </p>
            </div>

            <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid var(--bad); padding: 15px; margin-bottom: 20px; max-height: 300px; overflow-y: auto;">
                ${emergencyAlerts.map(alert => `
                    <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid rgba(239, 68, 68, 0.2);">
                        <div style="color: var(--bad); font-weight: 600; margin-bottom: 5px;">
                            ${alert.vital}: ${alert.value}
                        </div>
                        <div style="color: var(--text); font-size: 0.9rem; margin-bottom: 8px;">
                            ${alert.message}
                        </div>
                        <div style="background: var(--bad); color: white; padding: 8px 12px; border-radius: 6px; font-weight: 600; display: inline-block;">
                            ${alert.action}
                        </div>
                    </div>
                `).join('')}

                ${warningAlerts.map(alert => `
                    <div style="margin-bottom: 15px; padding-bottom: 15px;">
                        <div style="color: var(--warning); font-weight: 600; margin-bottom: 5px;">
                            ${alert.vital}: ${alert.value}
                        </div>
                        <div style="color: var(--text); font-size: 0.9rem; margin-bottom: 8px;">
                            ${alert.message}
                        </div>
                        <div style="background: var(--warning); color: var(--background); padding: 6px 10px; border-radius: 6px; font-weight: 600; display: inline-block;">
                            ${alert.action}
                        </div>
                    </div>
                `).join('')}
            </div>

            ${hasEmergency ? `
                <button id="call911Btn" style="width: 100%; padding: 16px; background: var(--bad); color: white; border: none; border-radius: 8px; font-weight: 700; font-size: 1.1rem; cursor: pointer; margin-bottom: 10px;">
                    📞 CALL 911 NOW
                </button>
            ` : ''}

            <button id="acknowledgeAlert" style="width: 100%; padding: 14px; background: var(--muted); color: var(--text); border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                I Understand
            </button>
        </div>
    `;

    document.body.appendChild(dialog);

    // Event listeners
    if (hasEmergency) {
        document.getElementById('call911Btn').addEventListener('click', () => {
            window.location.href = 'tel:911';
        });
    }

    document.getElementById('acknowledgeAlert').addEventListener('click', () => {
        dialog.remove();
    });

    // Flash animation for emergencies
    if (hasEmergency) {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes flashRed {
                0%, 100% { background: rgba(0, 0, 0, 0.95); }
                50% { background: rgba(139, 0, 0, 0.4); }
            }
        `;
        document.head.appendChild(style);

    }
}

/**
 * Monitor vitals in real-time (for live monitoring scenarios)
 * @param {Object} vitals - Current vitals
 * @param {Function} callback - Callback when alerts triggered
 */
export function monitorVitals(vitals, callback) {
    const assessment = checkVitals(vitals);

    if (assessment.hasAlerts) {
        if (callback) callback(assessment);
        if (assessment.hasEmergency) {
            showEmergencyAlert(assessment.alerts);
        }
    }

    return assessment;
}

// Expose to window
if (typeof window !== 'undefined') {
    window.checkVitals = checkVitals;
    window.showEmergencyAlert = showEmergencyAlert;
    window.monitorVitals = monitorVitals;
    console.log('✅ Emergency Alert System Loaded');
}
