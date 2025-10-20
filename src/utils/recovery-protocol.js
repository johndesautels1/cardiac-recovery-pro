// ============================================================================
// WEEK-BY-WEEK CARDIAC RECOVERY PROTOCOL GUIDANCE
// ============================================================================
// Provides evidence-based exercise recommendations for each recovery week
// Based on standard cardiac rehabilitation protocols
// Last Updated: Oct 20, 2025

console.log('📋 Recovery Protocol Module Loading...');

// ============================================================================
// RECOVERY PROTOCOL DATA (Weeks 1-12)
// ============================================================================

const RECOVERY_PROTOCOL = {
    1: {
        week: 1,
        phase: 'Early Recovery',
        title: 'Week 1: Gentle Movement',
        mets: '1-2 METs',
        duration: '5-10 minutes',
        frequency: '2-3 times daily',
        exercises: [
            'Slow walking indoors',
            'Light stretching',
            'Breathing exercises',
            'Ankle pumps and circles'
        ],
        precautions: [
            'No lifting over 5-10 lbs',
            'Avoid pushing/pulling',
            'Stop if chest pain occurs',
            'Rest frequently'
        ],
        goals: [
            'Independent walking to bathroom',
            'Self-care activities',
            'Maintain light activity without fatigue'
        ],
        rpe: '6-11 (Very light to light)',
        tips: 'Focus on rest and gradual mobility. Listen to your body.'
    },
    2: {
        week: 2,
        phase: 'Early Recovery',
        title: 'Week 2: Building Endurance',
        mets: '2-3 METs',
        duration: '10-15 minutes',
        frequency: '2-3 times daily',
        exercises: [
            'Walking indoors/outdoors (flat surface)',
            'Sit-to-stand exercises',
            'Light arm exercises (no weights)',
            'Gentle stretching'
        ],
        precautions: [
            'No lifting over 10 lbs',
            'Avoid stairs if possible',
            'Monitor incision sites',
            'No driving yet'
        ],
        goals: [
            'Walk 50-100 feet without stopping',
            'Increase stamina gradually',
            'Return to light household tasks'
        ],
        rpe: '11-13 (Light to somewhat hard)',
        tips: 'Gradually increase walking distance. Rest when needed.'
    },
    3: {
        week: 3,
        phase: 'Early Recovery',
        title: 'Week 3: Expanding Activity',
        mets: '2-3 METs',
        duration: '15-20 minutes',
        frequency: '2-3 times daily',
        exercises: [
            'Outdoor walking (0.5-1 mile)',
            'Light household chores',
            'Stationary bike (no resistance)',
            'Chair exercises'
        ],
        precautions: [
            'Lift limit: 10-15 lbs',
            'One flight of stairs max',
            'Avoid extreme temperatures',
            'No swimming yet (incision healing)'
        ],
        goals: [
            'Walk 0.5-1 mile comfortably',
            'Climb one flight of stairs',
            'Resume light cooking/cleaning'
        ],
        rpe: '11-13 (Light to somewhat hard)',
        tips: 'Focus on consistency over intensity. Build routine.'
    },
    4: {
        week: 4,
        phase: 'Progressive Recovery',
        title: 'Week 4: Increasing Intensity',
        mets: '3-4 METs',
        duration: '20-30 minutes',
        frequency: '3-5 times per week',
        exercises: [
            'Brisk walking (1-1.5 miles)',
            'Stationary bike (light resistance)',
            'Light resistance bands',
            'Bodyweight exercises (modified)'
        ],
        precautions: [
            'Lift limit: 15-20 lbs',
            'Multiple stairs okay',
            'Still avoid heavy lifting',
            'Clear for short car trips'
        ],
        goals: [
            'Walk 1-1.5 miles',
            'Exercise 20-30 min continuously',
            'Return to sexual activity (if cleared)'
        ],
        rpe: '12-14 (Somewhat hard)',
        tips: 'Start formal cardiac rehab if available. Track your progress.'
    },
    5: {
        week: 5,
        phase: 'Progressive Recovery',
        title: 'Week 5: Building Strength',
        mets: '4-5 METs',
        duration: '30 minutes',
        frequency: '3-5 times per week',
        exercises: [
            'Walking 1.5-2 miles',
            'Stationary bike (moderate resistance)',
            'Light dumbbells (2-5 lbs)',
            'Elliptical machine (low resistance)'
        ],
        precautions: [
            'Lift limit: 20-25 lbs',
            'Gradual return to work (if sedentary)',
            'Avoid heavy yard work',
            'Monitor heart rate'
        ],
        goals: [
            'Walk 2 miles comfortably',
            'Exercise 30 min at moderate intensity',
            'Return to light work activities'
        ],
        rpe: '13-15 (Somewhat hard to hard)',
        tips: 'Consistency is key. Build exercise habit.'
    },
    6: {
        week: 6,
        phase: 'Progressive Recovery',
        title: 'Week 6: Milestone Week',
        mets: '4-6 METs',
        duration: '30-40 minutes',
        frequency: '4-5 times per week',
        exercises: [
            'Walking/jogging intervals',
            'Swimming (if cleared)',
            'Cycling outdoors',
            'Light weight training'
        ],
        precautions: [
            'Most restrictions lifted',
            'Still avoid max effort',
            'Get clearance before returning to full work',
            'Check with doctor before sports'
        ],
        goals: [
            'Walk 2-3 miles',
            'Return to most daily activities',
            'Begin resistance training program'
        ],
        rpe: '13-15 (Somewhat hard to hard)',
        tips: '6-week mark: Major milestone! Most activities can resume.'
    },
    7: {
        week: 7,
        phase: 'Advanced Recovery',
        title: 'Week 7: Advancing Exercise',
        mets: '5-7 METs',
        duration: '40 minutes',
        frequency: '4-5 times per week',
        exercises: [
            'Jogging/running (if tolerated)',
            'Swimming laps',
            'Rowing machine',
            'Weight training (moderate weights)'
        ],
        precautions: [
            'Most restrictions lifted',
            'Avoid competitive sports',
            'Listen to your body',
            'Don\'t skip warm-up/cool-down'
        ],
        goals: [
            'Exercise at moderate-vigorous intensity',
            'Return to most hobbies',
            'Strength training 2x/week'
        ],
        rpe: '14-16 (Hard)',
        tips: 'Focus on building cardiovascular fitness and strength.'
    },
    8: {
        week: 8,
        phase: 'Advanced Recovery',
        title: 'Week 8: Establishing Routine',
        mets: '5-7 METs',
        duration: '40-45 minutes',
        frequency: '5 times per week',
        exercises: [
            'Running/jogging',
            'Group fitness classes',
            'Hiking (moderate trails)',
            'Circuit training'
        ],
        precautions: [
            'Full activities allowed (with clearance)',
            'Avoid extreme exertion',
            'Stay hydrated',
            'Monitor for any symptoms'
        ],
        goals: [
            'Maintain consistent exercise routine',
            'Build endurance',
            'Improve overall fitness'
        ],
        rpe: '14-16 (Hard)',
        tips: 'Make exercise part of your daily routine. Find activities you enjoy.'
    },
    9: {
        week: 9,
        phase: 'Advanced Recovery',
        title: 'Week 9: Optimizing Fitness',
        mets: '6-8 METs',
        duration: '45 minutes',
        frequency: '5-6 times per week',
        exercises: [
            'Running 2-3 miles',
            'Advanced strength training',
            'Sports (tennis, basketball)',
            'High-intensity interval training (HIIT)'
        ],
        precautions: [
            'Cleared for most activities',
            'Know your target heart rate zone',
            'Don\'t overtrain',
            'Rest days are important'
        ],
        goals: [
            'Run 3+ miles',
            'Return to recreational sports',
            'Achieve pre-surgery fitness level'
        ],
        rpe: '15-17 (Hard to very hard)',
        tips: 'Challenge yourself but avoid overtraining. Recovery is key.'
    },
    10: {
        week: 10,
        phase: 'Maintenance',
        title: 'Week 10: Performance Building',
        mets: '6-9 METs',
        duration: '45-60 minutes',
        frequency: '5-6 times per week',
        exercises: [
            'Long distance running',
            'Competitive sports',
            'Advanced fitness classes',
            'Heavy resistance training'
        ],
        precautions: [
            'Full clearance required',
            'Listen to your body',
            'Annual stress test recommended',
            'Maintain medication regimen'
        ],
        goals: [
            'Exceed pre-surgery fitness',
            'Compete in events (5K, etc.)',
            'Full return to lifestyle'
        ],
        rpe: '15-18 (Hard to very hard)',
        tips: 'You\'re doing great! Focus on long-term heart health.'
    },
    11: {
        week: 11,
        phase: 'Maintenance',
        title: 'Week 11: Peak Performance',
        mets: '7-10 METs',
        duration: '60 minutes',
        frequency: '5-6 times per week',
        exercises: [
            'Marathon training',
            'Competitive sports',
            'Advanced HIIT',
            'CrossFit (if cleared)'
        ],
        precautions: [
            'Full activities allowed',
            'Regular follow-ups with cardiologist',
            'Know warning signs',
            'Maintain healthy lifestyle'
        ],
        goals: [
            'Peak cardiovascular fitness',
            'Strength goals achieved',
            'Sustainable exercise routine'
        ],
        rpe: '16-18 (Very hard)',
        tips: 'Maintain gains. Focus on sustainability and enjoyment.'
    },
    12: {
        week: 12,
        phase: 'Maintenance',
        title: 'Week 12: Full Recovery Milestone',
        mets: '7-10+ METs',
        duration: '60+ minutes',
        frequency: '5-7 times per week',
        exercises: [
            'All activities cleared',
            'Endurance events',
            'Team sports',
            'Any recreational activity'
        ],
        precautions: [
            'No restrictions (with clearance)',
            'Continue medications',
            'Annual cardiac check-ups',
            'Maintain heart-healthy habits'
        ],
        goals: [
            'Full return to pre-surgery life',
            'Optimal cardiovascular health',
            'Long-term fitness maintenance'
        ],
        rpe: '12-18 (Variable based on activity)',
        tips: '12 weeks! You\'ve completed the major recovery phase. Keep it up!'
    }
};

// Protocol for weeks 13+ (maintenance phase)
const MAINTENANCE_PROTOCOL = {
    phase: 'Long-term Maintenance',
    title: 'Ongoing Maintenance',
    mets: '5-10+ METs',
    duration: '45-60+ minutes',
    frequency: '5-7 times per week',
    exercises: [
        'Continue regular exercise routine',
        'Mix cardio and strength training',
        'Try new activities',
        'Stay active daily'
    ],
    precautions: [
        'Regular cardiac follow-ups',
        'Annual stress tests',
        'Medication adherence',
        'Heart-healthy diet'
    ],
    goals: [
        'Maintain cardiovascular fitness',
        'Prevent future cardiac events',
        'Enjoy active lifestyle',
        'Long-term health optimization'
    ],
    rpe: '12-17 (Moderate to hard)',
    tips: 'Congratulations on your recovery! Focus on lifelong heart health.'
};

// ============================================================================
// GET PROTOCOL FOR RECOVERY WEEK
// ============================================================================

function getProtocolForWeek(recoveryWeek) {
    if (recoveryWeek < 1) {
        return null;
    }

    if (recoveryWeek <= 12) {
        return RECOVERY_PROTOCOL[recoveryWeek];
    }

    // For week 13+, return maintenance protocol
    return {
        ...MAINTENANCE_PROTOCOL,
        week: recoveryWeek,
        title: `Week ${recoveryWeek}: ${MAINTENANCE_PROTOCOL.title}`
    };
}

// ============================================================================
// CALCULATE RECOVERY WEEK FROM SURGERY DATE
// ============================================================================

function getRecoveryWeek() {
    const surgeryDateStr = localStorage.getItem('surgeryDate');

    if (!surgeryDateStr) {
        return null;
    }

    const surgeryDate = new Date(surgeryDateStr);
    const today = new Date();
    const daysSinceSurgery = Math.floor((today - surgeryDate) / (1000 * 60 * 60 * 24));
    const weeksSinceSurgery = Math.floor(daysSinceSurgery / 7) + 1;

    return Math.max(1, weeksSinceSurgery);
}

// ============================================================================
// DISPLAY PROTOCOL ON DASHBOARD
// ============================================================================

function displayProtocolGuidance() {
    const recoveryWeek = getRecoveryWeek();

    if (!recoveryWeek) {
        console.log('No surgery date set - protocol guidance not available');
        return;
    }

    const protocol = getProtocolForWeek(recoveryWeek);

    if (!protocol) {
        return;
    }

    // Find or create protocol container
    let container = document.getElementById('protocolGuidance');

    if (!container) {
        // Create and insert protocol guidance section
        const dashboardPanel = document.getElementById('dashboard');
        if (!dashboardPanel) return;

        container = document.createElement('div');
        container.id = 'protocolGuidance';
        container.className = 'card protocol-card';

        // Insert after patient info section
        const firstCard = dashboardPanel.querySelector('.card');
        if (firstCard) {
            firstCard.parentNode.insertBefore(container, firstCard.nextSibling);
        } else {
            dashboardPanel.insertBefore(container, dashboardPanel.firstChild);
        }
    }

    // Build HTML content
    const html = `
        <h3 style="color: var(--accent); margin: 0 0 15px 0;">
            📋 ${protocol.title}
        </h3>

        <div style="background: var(--bg); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid var(--accent);">
            <div style="font-weight: 700; color: var(--good); font-size: 1.1rem; margin-bottom: 8px;">
                ${protocol.phase}
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 10px;">
                <div>
                    <div style="font-size: 0.85rem; color: var(--muted);">METs Target</div>
                    <div style="font-weight: 700;">${protocol.mets}</div>
                </div>
                <div>
                    <div style="font-size: 0.85rem; color: var(--muted);">Duration</div>
                    <div style="font-weight: 700;">${protocol.duration}</div>
                </div>
                <div>
                    <div style="font-size: 0.85rem; color: var(--muted);">Frequency</div>
                    <div style="font-weight: 700;">${protocol.frequency}</div>
                </div>
                <div>
                    <div style="font-size: 0.85rem; color: var(--muted);">RPE Target</div>
                    <div style="font-weight: 700;">${protocol.rpe}</div>
                </div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
            <div>
                <h4 style="color: var(--good); margin: 0 0 10px 0;">✓ Recommended Exercises</h4>
                <ul style="margin: 0; padding-left: 20px;">
                    ${protocol.exercises.map(ex => `<li style="margin-bottom: 5px;">${ex}</li>`).join('')}
                </ul>
            </div>

            <div>
                <h4 style="color: var(--warning); margin: 0 0 10px 0;">⚠ Precautions</h4>
                <ul style="margin: 0; padding-left: 20px;">
                    ${protocol.precautions.map(prec => `<li style="margin-bottom: 5px;">${prec}</li>`).join('')}
                </ul>
            </div>
        </div>

        <div style="margin-bottom: 15px;">
            <h4 style="color: var(--accent); margin: 0 0 10px 0;">🎯 Goals for This Week</h4>
            <ul style="margin: 0; padding-left: 20px;">
                ${protocol.goals.map(goal => `<li style="margin-bottom: 5px;">${goal}</li>`).join('')}
            </ul>
        </div>

        <div style="background: var(--bg); padding: 12px; border-radius: 6px; border-left: 4px solid var(--good);">
            <strong>💡 Tip:</strong> ${protocol.tips}
        </div>
    `;

    container.innerHTML = html;

    console.log(`✅ Protocol guidance displayed for Week ${recoveryWeek}`);
}

// ============================================================================
// INITIALIZE
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
    // Display protocol guidance on page load
    setTimeout(displayProtocolGuidance, 500);

    console.log('✅ Recovery Protocol Module initialized');
});

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

window.getProtocolForWeek = getProtocolForWeek;
window.getRecoveryWeek = getRecoveryWeek;
window.displayProtocolGuidance = displayProtocolGuidance;

console.log('✅ Recovery Protocol Module Loaded');
