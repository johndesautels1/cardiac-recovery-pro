// ============================================================================
// PROGRESS MILESTONES & ACHIEVEMENTS SYSTEM
// ============================================================================
// Gamification to increase patient adherence to recovery program
// Last Updated: Oct 20, 2025

console.log('🏆 Milestones & Achievements Module Loading...');

// ============================================================================
// MILESTONE DEFINITIONS
// ============================================================================

const MILESTONES = {
    // Recovery Week Milestones
    week1: {
        id: 'week1',
        title: 'Week 1 Complete',
        description: 'You completed your first week of recovery!',
        icon: '🎯',
        category: 'recovery',
        requirement: { type: 'week', value: 1 }
    },
    week2: {
        id: 'week2',
        title: 'Two Week Warrior',
        description: 'Two weeks down, you\'re building momentum!',
        icon: '💪',
        category: 'recovery',
        requirement: { type: 'week', value: 2 }
    },
    week4: {
        id: 'week4',
        title: 'One Month Strong',
        description: 'A full month of recovery - incredible progress!',
        icon: '🌟',
        category: 'recovery',
        requirement: { type: 'week', value: 4 }
    },
    week6: {
        id: 'week6',
        title: '6-Week Milestone',
        description: 'Major milestone! Most activities can resume.',
        icon: '🎊',
        category: 'recovery',
        requirement: { type: 'week', value: 6 }
    },
    week12: {
        id: 'week12',
        title: 'Full Recovery Champion',
        description: 'You completed the 12-week recovery program!',
        icon: '👑',
        category: 'recovery',
        requirement: { type: 'week', value: 12 }
    },

    // Distance Milestones
    miles10: {
        id: 'miles10',
        title: 'First 10 Miles',
        description: 'You walked your first 10 miles!',
        icon: '🚶',
        category: 'distance',
        requirement: { type: 'totalDistance', value: 10 }
    },
    miles50: {
        id: 'miles50',
        title: '50 Mile Club',
        description: 'Half a hundred miles - amazing dedication!',
        icon: '🏃',
        category: 'distance',
        requirement: { type: 'totalDistance', value: 50 }
    },
    miles100: {
        id: 'miles100',
        title: 'Century Walker',
        description: '100 miles completed - you\'re unstoppable!',
        icon: '🏅',
        category: 'distance',
        requirement: { type: 'totalDistance', value: 100 }
    },
    miles250: {
        id: 'miles250',
        title: 'Ultra Achiever',
        description: '250 miles! You\'ve walked from NYC to Boston!',
        icon: '🌎',
        category: 'distance',
        requirement: { type: 'totalDistance', value: 250 }
    },

    // Session Milestones
    sessions10: {
        id: 'sessions10',
        title: 'Consistency Builder',
        description: '10 therapy sessions completed!',
        icon: '📅',
        category: 'sessions',
        requirement: { type: 'totalSessions', value: 10 }
    },
    sessions25: {
        id: 'sessions25',
        title: 'Rehabilitation Regular',
        description: '25 sessions - you\'re forming a solid habit!',
        icon: '💯',
        category: 'sessions',
        requirement: { type: 'totalSessions', value: 25 }
    },
    sessions50: {
        id: 'sessions50',
        title: 'Half Century Sessions',
        description: '50 therapy sessions! Incredible commitment!',
        icon: '🎖️',
        category: 'sessions',
        requirement: { type: 'totalSessions', value: 50 }
    },

    // Consecutive Days
    streak7: {
        id: 'streak7',
        title: 'Week Streak',
        description: '7 days of consecutive activity!',
        icon: '🔥',
        category: 'streak',
        requirement: { type: 'streak', value: 7 }
    },
    streak14: {
        id: 'streak14',
        title: 'Two Week Streak',
        description: '14 days straight - you\'re on fire!',
        icon: '🔥🔥',
        category: 'streak',
        requirement: { type: 'streak', value: 14 }
    },
    streak30: {
        id: 'streak30',
        title: 'Monthly Streak Master',
        description: '30 consecutive days! Unstoppable!',
        icon: '⚡',
        category: 'streak',
        requirement: { type: 'streak', value: 30 }
    },

    // Data Entry Milestones
    entries50: {
        id: 'entries50',
        title: 'Data Diligent',
        description: '50 data entries logged!',
        icon: '📊',
        category: 'tracking',
        requirement: { type: 'totalEntries', value: 50 }
    },
    entries100: {
        id: 'entries100',
        title: 'Tracking Champion',
        description: '100 entries - you\'re serious about your data!',
        icon: '📈',
        category: 'tracking',
        requirement: { type: 'totalEntries', value: 100 }
    },

    // Performance Milestones
    mets5: {
        id: 'mets5',
        title: 'METs Milestone: 5',
        description: 'You reached 5 METs - moderate intensity!',
        icon: '💓',
        category: 'performance',
        requirement: { type: 'maxMETs', value: 5 }
    },
    mets7: {
        id: 'mets7',
        title: 'METs Milestone: 7',
        description: '7 METs achieved - vigorous activity!',
        icon: '❤️',
        category: 'performance',
        requirement: { type: 'maxMETs', value: 7 }
    },
    mets10: {
        id: 'mets10',
        title: 'METs Master: 10',
        description: '10 METs! You\'re performing at high intensity!',
        icon: '❤️‍🔥',
        category: 'performance',
        requirement: { type: 'maxMETs', value: 10 }
    },

    // Special Achievements
    firstEntry: {
        id: 'firstEntry',
        title: 'Getting Started',
        description: 'You logged your first data entry!',
        icon: '🎬',
        category: 'special',
        requirement: { type: 'totalEntries', value: 1 }
    },
    firstSession: {
        id: 'firstSession',
        title: 'Therapy Begins',
        description: 'You completed your first therapy session!',
        icon: '🎓',
        category: 'special',
        requirement: { type: 'totalSessions', value: 1 }
    },
    earlyBird: {
        id: 'earlyBird',
        title: 'Early Bird',
        description: 'Completed a morning exercise session!',
        icon: '🌅',
        category: 'special',
        requirement: { type: 'morningSession', value: true }
    }
};

// ============================================================================
// ACHIEVEMENT TRACKING
// ============================================================================

function getEarnedAchievements() {
    const earned = localStorage.getItem('earnedAchievements');
    return earned ? JSON.parse(earned) : {};
}

function saveEarnedAchievement(milestoneId) {
    const earned = getEarnedAchievements();

    if (!earned[milestoneId]) {
        earned[milestoneId] = {
            earnedDate: new Date().toISOString(),
            viewedDate: null
        };

        localStorage.setItem('earnedAchievements', JSON.stringify(earned));

        // Show notification
        showAchievementNotification(MILESTONES[milestoneId]);

        return true; // New achievement
    }

    return false; // Already earned
}

function markAchievementAsViewed(milestoneId) {
    const earned = getEarnedAchievements();

    if (earned[milestoneId]) {
        earned[milestoneId].viewedDate = new Date().toISOString();
        localStorage.setItem('earnedAchievements', JSON.stringify(earned));
    }
}

// ============================================================================
// CALCULATE USER STATS
// ============================================================================

function calculateUserStats() {
    const allData = JSON.parse(localStorage.getItem('cardiacRecoveryData') || '{}');
    const surgeryDateStr = localStorage.getItem('surgeryDate');

    let stats = {
        totalEntries: 0,
        totalSessions: 0,
        totalDistance: 0,
        maxMETs: 0,
        currentStreak: 0,
        recoveryWeek: 0,
        morningSessionCompleted: false
    };

    // Count entries
    stats.totalEntries = Object.keys(allData).length;

    // Calculate totals
    Object.values(allData).forEach(entry => {
        if (entry.distance) {
            stats.totalDistance += parseFloat(entry.distance);
        }
        if (entry.mets && parseFloat(entry.mets) > stats.maxMETs) {
            stats.maxMETs = parseFloat(entry.mets);
        }

        // Check for morning session (before 10 AM)
        if (entry.timestamp) {
            const entryDate = new Date(entry.timestamp);
            if (entryDate.getHours() < 10) {
                stats.morningSessionCompleted = true;
            }
        }
    });

    // Count therapy sessions
    const therapySessions = localStorage.getItem('therapySessions');
    if (therapySessions) {
        stats.totalSessions = JSON.parse(therapySessions).length || 0;
    }

    // Calculate recovery week
    if (surgeryDateStr) {
        const surgeryDate = new Date(surgeryDateStr);
        const today = new Date();
        const daysSinceSurgery = Math.floor((today - surgeryDate) / (1000 * 60 * 60 * 24));
        stats.recoveryWeek = Math.floor(daysSinceSurgery / 7) + 1;
    }

    // Calculate current streak
    stats.currentStreak = calculateStreak(allData);

    return stats;
}

function calculateStreak(allData) {
    const dates = Object.keys(allData).sort().reverse();

    if (dates.length === 0) return 0;

    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    for (let date of dates) {
        const entryDate = new Date(date);
        entryDate.setHours(0, 0, 0, 0);

        const dayDiff = Math.floor((checkDate - entryDate) / (1000 * 60 * 60 * 24));

        if (dayDiff === streak) {
            streak++;
        } else if (dayDiff > streak) {
            break;
        }
    }

    return streak;
}

// ============================================================================
// CHECK FOR NEW ACHIEVEMENTS
// ============================================================================

function checkForNewAchievements() {
    const stats = calculateUserStats();
    const earned = getEarnedAchievements();
    let newAchievements = [];

    Object.entries(MILESTONES).forEach(([id, milestone]) => {
        // Skip if already earned
        if (earned[id]) return;

        let requirementMet = false;

        switch (milestone.requirement.type) {
            case 'week':
                requirementMet = stats.recoveryWeek >= milestone.requirement.value;
                break;
            case 'totalDistance':
                requirementMet = stats.totalDistance >= milestone.requirement.value;
                break;
            case 'totalSessions':
                requirementMet = stats.totalSessions >= milestone.requirement.value;
                break;
            case 'streak':
                requirementMet = stats.currentStreak >= milestone.requirement.value;
                break;
            case 'totalEntries':
                requirementMet = stats.totalEntries >= milestone.requirement.value;
                break;
            case 'maxMETs':
                requirementMet = stats.maxMETs >= milestone.requirement.value;
                break;
            case 'morningSession':
                requirementMet = stats.morningSessionCompleted;
                break;
        }

        if (requirementMet) {
            const isNew = saveEarnedAchievement(id);
            if (isNew) {
                newAchievements.push(milestone);
            }
        }
    });

    return newAchievements;
}

// ============================================================================
// ACHIEVEMENT NOTIFICATION
// ============================================================================

function showAchievementNotification(milestone) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 10000;
        min-width: 300px;
        animation: slideIn 0.5s ease-out;
        cursor: pointer;
    `;

    notification.innerHTML = `
        <div style="font-size: 3rem; text-align: center; margin-bottom: 10px;">
            ${milestone.icon}
        </div>
        <div style="font-weight: 700; font-size: 1.2rem; text-align: center; margin-bottom: 5px;">
            🎉 Achievement Unlocked!
        </div>
        <div style="font-weight: 600; font-size: 1rem; text-align: center; margin-bottom: 5px;">
            ${milestone.title}
        </div>
        <div style="font-size: 0.9rem; text-align: center; opacity: 0.9;">
            ${milestone.description}
        </div>
    `;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Play celebration sound if available
    if (typeof showNotification === 'function') {
        showNotification(`🎉 Achievement Unlocked: ${milestone.title}`, 'success');
    }

    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s ease-in';
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 5000);

    // Click to dismiss
    notification.addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.5s ease-in';
        setTimeout(() => {
            notification.remove();
        }, 500);
    });
}

// ============================================================================
// DISPLAY ACHIEVEMENTS PANEL
// ============================================================================

function displayAchievementsPanel() {
    const earned = getEarnedAchievements();
    const stats = calculateUserStats();

    const totalMilestones = Object.keys(MILESTONES).length;
    const earnedCount = Object.keys(earned).length;
    const percentComplete = Math.round((earnedCount / totalMilestones) * 100);

    // Find or create achievements container
    let container = document.getElementById('achievementsPanel');

    if (!container) {
        const dashboardPanel = document.getElementById('dashboard');
        if (!dashboardPanel) return;

        container = document.createElement('div');
        container.id = 'achievementsPanel';
        container.className = 'card achievements-card';

        dashboardPanel.appendChild(container);
    }

    // Group milestones by category
    const categories = {
        recovery: [],
        distance: [],
        sessions: [],
        streak: [],
        tracking: [],
        performance: [],
        special: []
    };

    Object.entries(MILESTONES).forEach(([id, milestone]) => {
        const isEarned = earned[id] !== undefined;
        categories[milestone.category].push({ id, ...milestone, earned: isEarned });
    });

    const html = `
        <h3 style="color: var(--accent); margin: 0 0 15px 0;">
            🏆 Achievements & Milestones
        </h3>

        <div style="background: var(--bg); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="font-weight: 700;">Progress</span>
                <span style="font-weight: 700; color: var(--accent);">${earnedCount} / ${totalMilestones}</span>
            </div>
            <div style="background: var(--card); height: 20px; border-radius: 10px; overflow: hidden;">
                <div style="background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); height: 100%; width: ${percentComplete}%; transition: width 0.5s ease;"></div>
            </div>
            <div style="text-align: center; margin-top: 5px; font-size: 0.9rem; color: var(--muted);">
                ${percentComplete}% Complete
            </div>
        </div>

        ${Object.entries(categories).map(([category, milestones]) => {
            if (milestones.length === 0) return '';

            const categoryNames = {
                recovery: '📅 Recovery Weeks',
                distance: '🚶 Distance',
                sessions: '💪 Therapy Sessions',
                streak: '🔥 Consecutive Days',
                tracking: '📊 Data Tracking',
                performance: '❤️ Performance',
                special: '⭐ Special'
            };

            return `
                <div style="margin-bottom: 20px;">
                    <h4 style="color: var(--good); margin: 0 0 10px 0;">${categoryNames[category]}</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px;">
                        ${milestones.map(m => `
                            <div style="
                                background: ${m.earned ? 'var(--good)' : 'var(--muted)'};
                                padding: 15px;
                                border-radius: 8px;
                                text-align: center;
                                opacity: ${m.earned ? '1' : '0.4'};
                                transition: all 0.3s;
                                cursor: ${m.earned ? 'pointer' : 'default'};
                            " title="${m.description}">
                                <div style="font-size: 2rem; margin-bottom: 5px;">${m.icon}</div>
                                <div style="font-size: 0.75rem; font-weight: 600; color: white;">${m.title}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('')}
    `;

    container.innerHTML = html;

    console.log('✅ Achievements panel displayed:', earnedCount, 'of', totalMilestones, 'earned');
}

// ============================================================================
// INITIALIZE
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
    // Check for new achievements
    setTimeout(() => {
        checkForNewAchievements();
        displayAchievementsPanel();
    }, 1000);

    console.log('✅ Milestones & Achievements Module initialized');
});

// Check for achievements after data save
window.addEventListener('storage', (e) => {
    if (e.key === 'cardiacRecoveryData' || e.key === 'therapySessions') {
        checkForNewAchievements();
        displayAchievementsPanel();
    }
});

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

window.checkForNewAchievements = checkForNewAchievements;
window.displayAchievementsPanel = displayAchievementsPanel;
window.getEarnedAchievements = getEarnedAchievements;
window.calculateUserStats = calculateUserStats;

console.log('✅ Milestones & Achievements Module Loaded');
