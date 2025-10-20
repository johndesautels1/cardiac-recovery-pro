// ============================================================================
// BACKUP & RESTORE MODULE
// ============================================================================

/**
 * Export all app data as JSON
 * @returns {Object} Complete backup data
 */
export function createBackup() {
    const backupData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        data: {
            profile: {
                name: localStorage.getItem('patientName'),
                surgeryDate: localStorage.getItem('surgeryDate'),
                demographics: JSON.parse(localStorage.getItem('patientDemographics') || '{}')
            },
            recoveryData: JSON.parse(localStorage.getItem('cardiacRecoveryData') || '{}'),
            sessions: JSON.parse(localStorage.getItem('cardiacSessions') || '[]'),
            settings: {
                theme: localStorage.getItem('theme'),
                // Add other settings as needed
            }
        },
        stats: {
            totalEntries: Object.keys(JSON.parse(localStorage.getItem('cardiacRecoveryData') || '{}')).length,
            totalSessions: JSON.parse(localStorage.getItem('cardiacSessions') || '[]').length,
            dateRange: getDateRange()
        }
    };

    return backupData;
}

/**
 * Get date range of data
 * @returns {Object} First and last date
 */
function getDateRange() {
    const data = JSON.parse(localStorage.getItem('cardiacRecoveryData') || '{}');
    const dates = Object.keys(data).sort();

    return {
        firstEntry: dates[0] || null,
        lastEntry: dates[dates.length - 1] || null
    };
}

/**
 * Download backup as JSON file
 */
export function downloadBackup() {
    try {
        const backup = createBackup();
        const filename = `cardiac-recovery-backup-${new Date().toISOString().split('T')[0]}.json`;
        const dataStr = JSON.stringify(backup, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(dataBlob);
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        console.log('✅ Backup downloaded:', filename);
        return { success: true, filename };
    } catch (error) {
        console.error('❌ Backup download failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Restore data from backup file
 * @param {File} file - Backup JSON file
 * @returns {Promise<Object>} Restore result
 */
export async function restoreFromBackup(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const backupData = JSON.parse(event.target.result);

                // Validate backup structure
                if (!backupData.version || !backupData.data) {
                    reject(new Error('Invalid backup file format'));
                    return;
                }

                // Restore data to localStorage
                const { profile, recoveryData, sessions, settings } = backupData.data;

                if (profile.name) {
                    localStorage.setItem('patientName', profile.name);
                }
                if (profile.surgeryDate) {
                    localStorage.setItem('surgeryDate', profile.surgeryDate);
                }
                if (profile.demographics && Object.keys(profile.demographics).length > 0) {
                    localStorage.setItem('patientDemographics', JSON.stringify(profile.demographics));
                }
                if (recoveryData && Object.keys(recoveryData).length > 0) {
                    localStorage.setItem('cardiacRecoveryData', JSON.stringify(recoveryData));
                }
                if (sessions && sessions.length > 0) {
                    localStorage.setItem('cardiacSessions', JSON.stringify(sessions));
                }
                if (settings && settings.theme) {
                    localStorage.setItem('theme', settings.theme);
                }

                console.log('✅ Data restored from backup');
                resolve({
                    success: true,
                    stats: backupData.stats,
                    restored: {
                        entries: Object.keys(recoveryData || {}).length,
                        sessions: (sessions || []).length
                    }
                });
            } catch (error) {
                console.error('❌ Restore failed:', error);
                reject(error);
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read backup file'));
        };

        reader.readAsText(file);
    });
}

/**
 * Show backup/restore UI dialog
 */
export function showBackupDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'backup-dialog-overlay';
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

    const stats = createBackup().stats;

    dialog.innerHTML = `
        <div style="background: var(--background); border-radius: 12px; padding: 30px; max-width: 500px; width: 100%;">
            <h2 style="color: var(--cyan); margin: 0 0 10px 0; font-size: 1.5rem;">💾 Backup & Restore</h2>
            <p style="color: var(--muted); margin-bottom: 20px; font-size: 0.9rem;">
                Protect your data by creating regular backups
            </p>

            <div style="background: rgba(96, 165, 250, 0.1); border: 1px solid var(--cyan); border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <div style="color: var(--text); font-size: 0.9rem;">
                    <strong>Current Data:</strong><br>
                    📊 ${stats.totalEntries} recovery entries<br>
                    🏃 ${stats.totalSessions} exercise sessions<br>
                    📅 ${stats.dateRange.firstEntry ? `${stats.dateRange.firstEntry} to ${stats.dateRange.lastEntry}` : 'No data yet'}
                </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px;">
                <button id="downloadBackupBtn" style="padding: 14px; background: var(--cyan); color: var(--background); border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 1rem;">
                    ⬇️ Download Backup
                </button>

                <button id="restoreBackupBtn" style="padding: 14px; background: var(--good); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 1rem;">
                    ⬆️ Restore from Backup
                </button>

                <button id="closeBackupDialog" style="padding: 14px; background: var(--muted); color: var(--text); border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 1rem;">
                    Cancel
                </button>
            </div>

            <input type="file" id="backupFileInput" accept=".json" style="display: none;">
        </div>
    `;

    document.body.appendChild(dialog);

    // Event listeners
    document.getElementById('downloadBackupBtn').addEventListener('click', () => {
        const result = downloadBackup();
        if (result.success) {
            alert(`✅ Backup downloaded successfully!\n\nFile: ${result.filename}`);
            dialog.remove();
        } else {
            alert(`❌ Backup failed: ${result.error}`);
        }
    });

    document.getElementById('restoreBackupBtn').addEventListener('click', () => {
        document.getElementById('backupFileInput').click();
    });

    document.getElementById('backupFileInput').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const result = await restoreFromBackup(file);
                alert(`✅ Data restored successfully!\n\n${result.restored.entries} entries restored\n${result.restored.sessions} sessions restored\n\nPage will reload to show restored data.`);
                dialog.remove();
                window.location.reload();
            } catch (error) {
                alert(`❌ Restore failed: ${error.message}`);
            }
        }
    });

    document.getElementById('closeBackupDialog').addEventListener('click', () => {
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
    window.downloadBackup = downloadBackup;
    window.restoreFromBackup = restoreFromBackup;
    window.showBackupDialog = showBackupDialog;
    console.log('✅ Backup & Restore Module Loaded');
}
