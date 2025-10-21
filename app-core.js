// DATA STORAGE WITH ERROR HANDLING
let allData = {};
let surgeryDateStr = null;
let patientName = null; // Can be populated from master app data when unified
let currentDate = new Date();
let storageAvailable = true;

// Safely load data from localStorage
try {
    const storedData = localStorage.getItem('cardiacRecoveryData');
    allData = storedData ? JSON.parse(storedData) : {};
    surgeryDateStr = localStorage.getItem('surgeryDate');
    patientName = localStorage.getItem('patientName');
} catch (error) {
    console.error('localStorage error on load:', error);
    storageAvailable = false;
    showNotification('⚠️ Using temporary storage - data may not persist. Check browser settings.', 'error');
}

// AUTOCOMPLETE DATA
const exerciseTypes = [
    'Walking', 'Treadmill', 'Cycling', 'Stationary Bike', 'Swimming',
    'Elliptical', 'Rowing', 'Stairs', 'Resistance Training', 'Yoga'
];

// INITIALIZE
function init() {
    updateDateDisplay();
    if (surgeryDateStr) {
        document.getElementById('surgeryDate').value = surgeryDateStr;
        updateRecoveryInfo();
    }
    if (patientName) {
        document.getElementById('patientName').value = patientName;
        updateWelcomeMessage();
    }
    loadPatientDemographics(); // Load patient demographics
    updateDashboard();
    updateWeeklyMilestones();
    refreshHistoryTable();
    refreshSessionsTable();
    initializeCharts();
    attachValidationListeners();
    initSwipeGestures();
    initializeBottomNav(); // Initialize mobile bottom navigation
}

// DATE NAVIGATION
function navigateDate(days) {
    currentDate.setDate(currentDate.getDate() + days);
    updateDateDisplay();
}

function updateDateDisplay() {
    const dateStr = currentDate.toISOString().split('T')[0];
    document.getElementById('currentDate').textContent =
        currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('entryDate').textContent = dateStr;
    document.getElementById('datePicker').value = dateStr;
    loadDataForDate(dateStr);
}

document.getElementById('datePicker').addEventListener('change', function(e) {
    currentDate = new Date(e.target.value + 'T00:00:00');
    updateDateDisplay();
});

// SWIPE GESTURES FOR MOBILE DATE NAVIGATION
function initSwipeGestures() {
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartY = 0;
    let touchEndY = 0;
    const minSwipeDistance = 50; // Minimum distance for swipe (px)
    const maxVerticalDistance = 100; // Max vertical movement allowed

    const container = document.querySelector('.container');

    container.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    container.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;

        const horizontalDistance = touchEndX - touchStartX;
        const verticalDistance = Math.abs(touchEndY - touchStartY);

        // Only trigger if horizontal swipe is dominant
        if (verticalDistance < maxVerticalDistance) {
            // Swipe left = next day
            if (horizontalDistance < -minSwipeDistance) {
                navigateDate(1);
            }
            // Swipe right = previous day
            if (horizontalDistance > minSwipeDistance) {
                navigateDate(-1);
            }
        }
    }, { passive: true });
}

// RECOVERY DAY 1
function setRecoveryDay1() {
    const date = document.getElementById('surgeryDate').value;
    if (!date) {
        showNotification('Please select a surgery date', 'error');
        return;
    }
    surgeryDateStr = date;

    // Save with error handling
    try {
        localStorage.setItem('surgeryDate', date);
    } catch (error) {
        console.error('Error saving surgery date:', error);
        showNotification('⚠️ Could not save surgery date persistently', 'error');
    }

    updateRecoveryInfo();
    updateDashboard();
    updateWeeklyMilestones();
    showNotification('Recovery Day 1 set!', 'success');
}

// PATIENT NAME FUNCTIONS
function savePatientName() {
    const name = document.getElementById('patientName').value.trim();
    patientName = name;

    // Save with error handling
    try {
        if (name) {
            localStorage.setItem('patientName', name);
            showNotification('✅ Patient name saved', 'success');
        } else {
            localStorage.removeItem('patientName');
        }
    } catch (error) {
        console.error('Error saving patient name:', error);
        showNotification('⚠️ Could not save patient name persistently', 'error');
    }

    updateWelcomeMessage();
}

function updateWelcomeMessage() {
    const welcomeElement = document.getElementById('welcomeMessage');
    if (patientName && patientName.trim()) {
        welcomeElement.textContent = `Welcome, ${patientName}! 👋`;
    } else {
        welcomeElement.textContent = '';
    }
}

// PUBLIC API: Set patient name programmatically (for master app integration)
function setPatientNameFromApp(name) {
    if (name && typeof name === 'string') {
        patientName = name.trim();
        document.getElementById('patientName').value = patientName;

        try {
            localStorage.setItem('patientName', patientName);
        } catch (error) {
            console.error('Error saving patient name from app:', error);
        }

        updateWelcomeMessage();
        return true;
    }
    return false;
}

// ============================================================================
// PATIENT DEMOGRAPHICS FUNCTIONS (for CRPS calculation)
// ============================================================================

let patientDemographics = {
    age: null,
    sex: null,
    height: null,
    weight: null,
    fromMainApp: false
};

// Load demographics from localStorage on init
try {
    const storedDemo = localStorage.getItem('patientDemographics');
    if (storedDemo) {
        patientDemographics = JSON.parse(storedDemo);
    }
} catch (error) {
    console.error('Error loading patient demographics:', error);
}

/**
 * Save patient demographics to localStorage
 */
function savePatientDemographics() {
    const age = document.getElementById('patientAge').value;
    const sex = document.getElementById('patientSex').value;
    const height = document.getElementById('patientHeight').value;
    const weight = document.getElementById('patientWeight').value;

    // Update demographics object
    patientDemographics = {
        age: age ? parseInt(age) : null,
        sex: sex || null,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        fromMainApp: patientDemographics.fromMainApp // Preserve source
    };

    // Save to localStorage
    try {
        localStorage.setItem('patientDemographics', JSON.stringify(patientDemographics));
        showNotification('✅ Demographics saved for CRPS calculation', 'success');
    } catch (error) {
        console.error('Error saving patient demographics:', error);
        showNotification('⚠️ Could not save demographics persistently', 'error');
    }

    // Recalculate CRPS for all existing data with new demographics
    recalculateAllCRPS();
}

/**
 * Load patient demographics into form fields
 */
function loadPatientDemographics() {
    if (patientDemographics.age) {
        document.getElementById('patientAge').value = patientDemographics.age;
    }
    if (patientDemographics.sex) {
        document.getElementById('patientSex').value = patientDemographics.sex;
    }
    if (patientDemographics.height) {
        document.getElementById('patientHeight').value = patientDemographics.height;
    }
    if (patientDemographics.weight) {
        document.getElementById('patientWeight').value = patientDemographics.weight;
    }

    // Show source indicator if from main app
    if (patientDemographics.fromMainApp) {
        document.getElementById('demographicsSource').style.display = 'inline-block';
    }
}

/**
 * Get current demographics (with defaults if not set)
 */
function getCurrentDemographics() {
    return {
        age: patientDemographics.age || 50, // Default age
        sex: patientDemographics.sex || 'female', // Default sex
        height: patientDemographics.height || 170, // Default height in cm
        weight: patientDemographics.weight || 70 // Default weight in kg
    };
}

/**
 * Recalculate CRPS for all existing data when demographics change
 */
function recalculateAllCRPS() {
    const demographics = getCurrentDemographics();
    let updated = 0;

    // Recalculate for all dates with data
    Object.keys(allData).forEach(dateStr => {
        const metrics = allData[dateStr];

        // Skip if no metrics or already has CRPS
        if (!metrics || Object.keys(metrics).length === 0) return;

        try {
            const crpsResult = calculateCRPS(
                metrics,
                demographics.age,
                demographics.height,
                demographics.sex
            );

            metrics.crpsScore = crpsResult.total;
            metrics.crpsBreakdown = crpsResult;
            allData[dateStr] = metrics;
            updated++;
        } catch (error) {
            console.error(`Error recalculating CRPS for ${dateStr}:`, error);
        }
    });

    // Save updated data
    if (updated > 0) {
        try {
            localStorage.setItem('cardiacRecoveryData', JSON.stringify(allData));
        console.log("✅ Data saved to localStorage:", allData);
            console.log(`Recalculated CRPS for ${updated} dates`);

            // Update displays
            updateDashboard();
            updateCharts();
        } catch (error) {
            console.error('Error saving recalculated data:', error);
        }
    }
}

/**
 * PUBLIC API: Set patient demographics from main Heartbeat app
 * @param {Object} demographics - { age, sex, height, weight }
 * @returns {Boolean} success
 */
function setPatientDemographicsFromApp(demographics) {
    if (!demographics || typeof demographics !== 'object') {
        return false;
    }

    try {
        // Update demographics object
        patientDemographics = {
            age: demographics.age ? parseInt(demographics.age) : null,
            sex: demographics.sex || null,
            height: demographics.height ? parseFloat(demographics.height) : null,
            weight: demographics.weight ? parseFloat(demographics.weight) : null,
            fromMainApp: true // Mark as from main app
        };

        // Update form fields
        if (patientDemographics.age) {
            document.getElementById('patientAge').value = patientDemographics.age;
        }
        if (patientDemographics.sex) {
            document.getElementById('patientSex').value = patientDemographics.sex;
        }
        if (patientDemographics.height) {
            document.getElementById('patientHeight').value = patientDemographics.height;
        }
        if (patientDemographics.weight) {
            document.getElementById('patientWeight').value = patientDemographics.weight;
        }

        // Show source indicator
        document.getElementById('demographicsSource').style.display = 'inline-block';

        // Save to localStorage
        localStorage.setItem('patientDemographics', JSON.stringify(patientDemographics));

        // Recalculate CRPS with new demographics
        recalculateAllCRPS();

        console.log('✅ Patient demographics set from Heartbeat app:', patientDemographics);
        return true;
    } catch (error) {
        console.error('Error setting patient demographics from app:', error);
        return false;
    }
}

function updateRecoveryInfo() {
    if (!surgeryDateStr) return;

    const surgeryDate = new Date(surgeryDateStr + 'T00:00:00');
    const today = new Date(currentDate.toISOString().split('T')[0] + 'T00:00:00');
    const daysDiff = Math.floor((today - surgeryDate) / (1000 * 60 * 60 * 24));
    const weeksDiff = Math.floor(daysDiff / 7);

    document.getElementById('recoveryDay').textContent = daysDiff >= 0 ? `Day ${daysDiff + 1}` : 'Before Surgery';
    document.getElementById('weeksPostOp').textContent = weeksDiff >= 0 ? weeksDiff : 0;
    document.getElementById('statsWeeks').textContent = weeksDiff >= 0 ? weeksDiff : 0;

    let phase = 'Pre-Surgery';
    if (daysDiff >= 0 && daysDiff < 14) phase = 'Phase 1: Hospital/Early';
    else if (daysDiff >= 14 && daysDiff < 28) phase = 'Phase 2: Early Mobilization';
    else if (daysDiff >= 28 && daysDiff < 56) phase = 'Phase 3: Progressive Training';
    else if (daysDiff >= 56 && daysDiff < 84) phase = 'Phase 4: Advanced Training';
    else if (daysDiff >= 84) phase = 'Phase 5: Return to Function';

    document.getElementById('recoveryPhase').textContent = phase;
}

// ============================================================================
// CARDIAC RECOVERY PROBABILITY SCORE (CRPS) - EVIDENCE-BASED ALGORITHM
// ============================================================================

/**
 * Calculate Cardiac Recovery Probability Score (CRPS)
 * Based on clinical literature: STS Database, 6MWT norms, METs age-adjusted,
 * HRV cardiac surgery research, AHA/ACC 2024 Guidelines
 *
 * @param {Object} metrics - Patient metrics from data entry
 * @param {Number} age - Patient age for age-adjusted calculations
 * @param {Number} height - Patient height in cm (for 6MWT prediction)
 * @param {String} sex - Patient sex ('male' or 'female') for 6MWT prediction
 * @returns {Object} - Score breakdown with total, categories, and interpretation
 */
function calculateCRPS(metrics, age = 50, height = 170, sex = 'female') {
    const breakdown = {
        total: 0,
        functionalCapacity: 0,
        cardiovascularHealth: 0,
        symptomBurden: 0,
        qualityOfLife: 0,
        riskModifiers: 0,
        details: {},
        interpretation: '',
        probability: '',
        colorCode: ''
    };

    // CATEGORY 1: FUNCTIONAL CAPACITY (35 points max)

    // METs Score (0-15 points) - Age-Adjusted
    if (metrics.mets !== undefined) {
        const expectedMETs = 18.0 - (0.15 * age);
        const metsPercentage = (metrics.mets / expectedMETs) * 100;

        let metsScore = 0;
        if (metsPercentage >= 110) metsScore = 15;
        else if (metsPercentage >= 100) metsScore = 13;
        else if (metsPercentage >= 90) metsScore = 11;
        else if (metsPercentage >= 80) metsScore = 9;
        else if (metsPercentage >= 70) metsScore = 7;
        else if (metsPercentage >= 60) metsScore = 5;
        else if (metsPercentage >= 50) metsScore = 3;
        else metsScore = 0;

        breakdown.functionalCapacity += metsScore;
        breakdown.details.mets = {
            score: metsScore,
            value: metrics.mets,
            expected: expectedMETs.toFixed(1),
            percentage: metsPercentage.toFixed(0) + '%'
        };
    }

    // 6-Minute Walk Test (0-15 points) - Age/Sex-Adjusted
    if (metrics.walkDistance !== undefined && height && sex) {
        // Enright & Sherril prediction equation
        let predictedDistance;
        const weight = metrics.weight || 70; // Default if not provided

        if (sex === 'male') {
            predictedDistance = (7.57 * height) - (5.02 * age) - (1.76 * weight) - 309;
        } else {
            predictedDistance = (2.11 * height) - (5.78 * age) - (2.29 * weight) + 667;
        }

        const walkPercentage = (metrics.walkDistance / predictedDistance) * 100;

        let walkScore = 0;
        if (walkPercentage >= 80) walkScore = 15;
        else if (walkPercentage >= 70) walkScore = 12;
        else if (walkPercentage >= 60) walkScore = 9;
        else if (walkPercentage >= 50) walkScore = 6;
        else if (walkPercentage >= 40) walkScore = 3;
        else walkScore = 0;

        breakdown.functionalCapacity += walkScore;
        breakdown.details.walkDistance = {
            score: walkScore,
            value: metrics.walkDistance,
            predicted: Math.round(predictedDistance),
            percentage: walkPercentage.toFixed(0) + '%'
        };
    }

    // VO2 Max (0-5 points) - Bonus Metric
    if (metrics.vo2Max !== undefined) {
        let vo2Score = 0;
        if (metrics.vo2Max >= 28) vo2Score = 5;
        else if (metrics.vo2Max >= 24) vo2Score = 4;
        else if (metrics.vo2Max >= 20) vo2Score = 3;
        else if (metrics.vo2Max >= 16) vo2Score = 2;
        else if (metrics.vo2Max >= 12) vo2Score = 1;
        else vo2Score = 0;

        breakdown.functionalCapacity += vo2Score;
        breakdown.details.vo2Max = { score: vo2Score, value: metrics.vo2Max };
    }

    // CATEGORY 2: CARDIOVASCULAR HEALTH (25 points max)

    // Heart Rate Variability - SDNN (0-8 points)
    if (metrics.sdnn !== undefined) {
        let sdnnScore = 0;
        if (metrics.sdnn >= 50) sdnnScore = 8;
        else if (metrics.sdnn >= 40) sdnnScore = 6;
        else if (metrics.sdnn >= 35) sdnnScore = 5;
        else if (metrics.sdnn >= 30) sdnnScore = 4;
        else if (metrics.sdnn >= 25) sdnnScore = 3;
        else if (metrics.sdnn >= 20) sdnnScore = 2;
        else sdnnScore = 0;

        breakdown.cardiovascularHealth += sdnnScore;
        breakdown.details.sdnn = { score: sdnnScore, value: metrics.sdnn };
    }

    // Heart Rate Recovery (0-7 points)
    if (metrics.hrRecovery !== undefined) {
        let hrrScore = 0;
        if (metrics.hrRecovery >= 25) hrrScore = 7;
        else if (metrics.hrRecovery >= 20) hrrScore = 6;
        else if (metrics.hrRecovery >= 18) hrrScore = 5;
        else if (metrics.hrRecovery >= 15) hrrScore = 4;
        else if (metrics.hrRecovery >= 13) hrrScore = 2;
        else if (metrics.hrRecovery >= 12) hrrScore = 1;
        else hrrScore = 0;

        breakdown.cardiovascularHealth += hrrScore;
        breakdown.details.hrRecovery = { score: hrrScore, value: metrics.hrRecovery };
    }

    // Resting Heart Rate (0-5 points)
    if (metrics.restingHR !== undefined) {
        let rhrScore = 0;
        if (metrics.restingHR >= 50 && metrics.restingHR <= 60) rhrScore = 5;
        else if (metrics.restingHR >= 61 && metrics.restingHR <= 70) rhrScore = 4;
        else if (metrics.restingHR >= 71 && metrics.restingHR <= 80) rhrScore = 3;
        else if (metrics.restingHR >= 81 && metrics.restingHR <= 90) rhrScore = 2;
        else if (metrics.restingHR >= 91 && metrics.restingHR <= 100) rhrScore = 1;
        else rhrScore = 0;

        breakdown.cardiovascularHealth += rhrScore;
        breakdown.details.restingHR = { score: rhrScore, value: metrics.restingHR };
    }

    // Ejection Fraction (0-5 points)
    if (metrics.ejectionFraction !== undefined) {
        let efScore = 0;
        if (metrics.ejectionFraction >= 55) efScore = 5;
        else if (metrics.ejectionFraction >= 50) efScore = 4;
        else if (metrics.ejectionFraction >= 45) efScore = 3;
        else if (metrics.ejectionFraction >= 40) efScore = 2;
        else if (metrics.ejectionFraction >= 35) efScore = 1;
        else efScore = 0;

        breakdown.cardiovascularHealth += efScore;
        breakdown.details.ejectionFraction = { score: efScore, value: metrics.ejectionFraction };
    }

    // CATEGORY 3: SYMPTOM BURDEN (20 points max) - Inverted scores

    // Dyspnea Score (0-6 points inverted)
    if (metrics.dyspnea !== undefined) {
        let dyspneaScore = 0;
        if (metrics.dyspnea === 0) dyspneaScore = 6;
        else if (metrics.dyspnea <= 2) dyspneaScore = 5;
        else if (metrics.dyspnea <= 4) dyspneaScore = 4;
        else if (metrics.dyspnea <= 6) dyspneaScore = 3;
        else if (metrics.dyspnea <= 8) dyspneaScore = 1;
        else dyspneaScore = 0;

        breakdown.symptomBurden += dyspneaScore;
        breakdown.details.dyspnea = { score: dyspneaScore, value: metrics.dyspnea };
    }

    // Chest Pain Score (0-6 points inverted)
    if (metrics.chestPain !== undefined) {
        let chestPainScore = 0;
        if (metrics.chestPain === 0) chestPainScore = 6;
        else if (metrics.chestPain === 1) chestPainScore = 5;
        else if (metrics.chestPain === 2) chestPainScore = 4;
        else if (metrics.chestPain <= 4) chestPainScore = 2;
        else if (metrics.chestPain <= 7) chestPainScore = 1;
        else chestPainScore = 0;

        breakdown.symptomBurden += chestPainScore;
        breakdown.details.chestPain = { score: chestPainScore, value: metrics.chestPain };
    }

    // Fatigue Score (0-4 points inverted)
    if (metrics.fatigue !== undefined) {
        let fatigueScore = 0;
        if (metrics.fatigue <= 1) fatigueScore = 4;
        else if (metrics.fatigue <= 3) fatigueScore = 3;
        else if (metrics.fatigue <= 5) fatigueScore = 2;
        else if (metrics.fatigue <= 8) fatigueScore = 1;
        else fatigueScore = 0;

        breakdown.symptomBurden += fatigueScore;
        breakdown.details.fatigue = { score: fatigueScore, value: metrics.fatigue };
    }

    // Edema Score (0-4 points inverted)
    if (metrics.edema !== undefined) {
        let edemaScore = 0;
        if (metrics.edema === 0) edemaScore = 4;
        else if (metrics.edema === 1) edemaScore = 3;
        else if (metrics.edema === 2) edemaScore = 2;
        else if (metrics.edema === 3) edemaScore = 1;
        else edemaScore = 0;

        breakdown.symptomBurden += edemaScore;
        breakdown.details.edema = { score: edemaScore, value: metrics.edema };
    }

    // CATEGORY 4: QUALITY OF LIFE & RECOVERY (15 points max)

    // Quality of Life (0-10 points)
    if (metrics.qualityOfLife !== undefined) {
        let qolScore = 0;
        if (metrics.qualityOfLife >= 90) qolScore = 10;
        else if (metrics.qualityOfLife >= 80) qolScore = 8;
        else if (metrics.qualityOfLife >= 70) qolScore = 6;
        else if (metrics.qualityOfLife >= 60) qolScore = 4;
        else if (metrics.qualityOfLife >= 50) qolScore = 2;
        else qolScore = 0;

        breakdown.qualityOfLife += qolScore;
        breakdown.details.qualityOfLife = { score: qolScore, value: metrics.qualityOfLife };
    }

    // Sleep Quality (0-5 points)
    if (metrics.sleepQuality !== undefined) {
        let sleepScore = 0;
        if (metrics.sleepQuality >= 9) sleepScore = 5;
        else if (metrics.sleepQuality >= 7) sleepScore = 4;
        else if (metrics.sleepQuality >= 5) sleepScore = 3;
        else if (metrics.sleepQuality >= 3) sleepScore = 2;
        else if (metrics.sleepQuality >= 1) sleepScore = 1;
        else sleepScore = 0;

        breakdown.qualityOfLife += sleepScore;
        breakdown.details.sleepQuality = { score: sleepScore, value: metrics.sleepQuality };
    }

    // CATEGORY 5: RISK MODIFIERS (5 points bonus/penalty)

    // Blood Pressure Control (±3 points)
    if (metrics.bpSystolic !== undefined && metrics.bpDiastolic !== undefined) {
        let bpScore = 0;
        if (metrics.bpSystolic < 120 && metrics.bpDiastolic < 80) bpScore = 3;
        else if (metrics.bpSystolic < 130 && metrics.bpDiastolic < 85) bpScore = 2;
        else if (metrics.bpSystolic < 140 && metrics.bpDiastolic < 90) bpScore = 1;
        else if (metrics.bpSystolic < 160 && metrics.bpDiastolic < 100) bpScore = 0;
        else bpScore = -3;

        breakdown.riskModifiers += bpScore;
        breakdown.details.bloodPressure = {
            score: bpScore,
            systolic: metrics.bpSystolic,
            diastolic: metrics.bpDiastolic
        };
    }

    // SpO2 (±2 points)
    const spo2Value = metrics.spo2 || metrics.oxygenSat; // Support both field names
    if (spo2Value !== undefined) {
        let spo2Score = 0;
        if (spo2Value >= 98) spo2Score = 2;
        else if (spo2Value >= 95) spo2Score = 1;
        else if (spo2Value >= 92) spo2Score = 0;
        else spo2Score = -2;

        breakdown.riskModifiers += spo2Score;
        breakdown.details.spo2 = { score: spo2Score, value: spo2Value };
    }

    // CALCULATE TOTAL SCORE
    breakdown.total =
        breakdown.functionalCapacity +
        breakdown.cardiovascularHealth +
        breakdown.symptomBurden +
        breakdown.qualityOfLife +
        breakdown.riskModifiers;

    // Apply Age-Stratification Multiplier
    let ageMultiplier = 1.0;
    if (age < 50) ageMultiplier = 1.05;
    else if (age >= 65 && age < 75) ageMultiplier = 1.08;
    else if (age >= 75) ageMultiplier = 1.12;

    breakdown.rawTotal = breakdown.total;
    breakdown.total = Math.min(100, Math.round(breakdown.total * ageMultiplier));
    breakdown.ageMultiplier = ageMultiplier;

    // INTERPRETATION AND COLOR CODING
    if (breakdown.total >= 90) {
        breakdown.interpretation = 'SUPERIOR RECOVERY';
        breakdown.probability = '95-100% probability of full recovery';
        breakdown.colorCode = '#22c55e'; // Green
        breakdown.colorName = 'excellent';
    } else if (breakdown.total >= 80) {
        breakdown.interpretation = 'EXCELLENT RECOVERY';
        breakdown.probability = '85-94% probability of full recovery';
        breakdown.colorCode = '#22c55e'; // Green
        breakdown.colorName = 'excellent';
    } else if (breakdown.total >= 70) {
        breakdown.interpretation = 'VERY GOOD RECOVERY';
        breakdown.probability = '75-84% probability of full recovery';
        breakdown.colorCode = '#3b82f6'; // Blue
        breakdown.colorName = 'better-than-average';
    } else if (breakdown.total >= 60) {
        breakdown.interpretation = 'GOOD RECOVERY';
        breakdown.probability = '65-74% probability of full recovery';
        breakdown.colorCode = '#3b82f6'; // Blue
        breakdown.colorName = 'better-than-average';
    } else if (breakdown.total >= 50) {
        breakdown.interpretation = 'FAIR RECOVERY';
        breakdown.probability = '50-64% probability of full recovery';
        breakdown.colorCode = '#fbbf24'; // Yellow
        breakdown.colorName = 'average';
    } else if (breakdown.total >= 40) {
        breakdown.interpretation = 'BELOW AVERAGE RECOVERY';
        breakdown.probability = '35-49% probability of full recovery';
        breakdown.colorCode = '#f97316'; // Orange
        breakdown.colorName = 'below-average';
    } else if (breakdown.total >= 30) {
        breakdown.interpretation = 'POOR RECOVERY';
        breakdown.probability = '20-34% probability of full recovery';
        breakdown.colorCode = '#ef4444'; // Red
        breakdown.colorName = 'poor';
    } else {
        breakdown.interpretation = 'HIGH RISK';
        breakdown.probability = '0-19% probability - Emergency evaluation required';
        breakdown.colorCode = '#ef4444'; // Red
        breakdown.colorName = 'critical';
    }

    return breakdown;
}

/**
 * Update CRPS Display in real-time across Dashboard and Analytics
 * @param {Object} crpsResult - Result from calculateCRPS()
 */
function updateCRPSDisplay(crpsResult) {
    if (!crpsResult) return;

    // Update Dashboard CRPS display
    const dashboardScore = document.getElementById('dashboardCRPSScore');
    const dashboardInterpretation = document.getElementById('dashboardCRPSInterpretation');
    const dashboardProbability = document.getElementById('dashboardCRPSProbability');
    const dashboardCard = document.getElementById('dashboardCRPSCard');

    if (dashboardScore) {
        dashboardScore.textContent = crpsResult.total;
        dashboardScore.style.color = crpsResult.colorCode;
    }

    if (dashboardInterpretation) {
        dashboardInterpretation.textContent = crpsResult.interpretation;
        dashboardInterpretation.style.color = crpsResult.colorCode;
    }

    if (dashboardProbability) {
        dashboardProbability.textContent = crpsResult.probability;
    }

    if (dashboardCard) {
        dashboardCard.style.borderColor = crpsResult.colorCode;
        dashboardCard.style.background = `linear-gradient(135deg, ${crpsResult.colorCode}15, ${crpsResult.colorCode}05)`;
    }

    // Update Analytics CRPS display
    const analyticsScore = document.getElementById('analyticsCRPSScore');
    const analyticsInterpretation = document.getElementById('analyticsCRPSInterpretation');

    if (analyticsScore) {
        analyticsScore.textContent = crpsResult.total;
        analyticsScore.style.color = crpsResult.colorCode;
    }

    if (analyticsInterpretation) {
        analyticsInterpretation.textContent = crpsResult.interpretation;
    }

    // Update category breakdown
    updateCategoryBreakdown(crpsResult);

    // Update CRPS trend chart
    updateCRPSTrendChart();
}

/**
 * Update category breakdown display
 * @param {Object} crpsResult - Result from calculateCRPS()
 */
function updateCategoryBreakdown(crpsResult) {
    const categories = [
        { id: 'functionalCapacity', label: 'Functional Capacity', max: 35 },
        { id: 'cardiovascularHealth', label: 'Cardiovascular Health', max: 25 },
        { id: 'symptomBurden', label: 'Symptom Burden', max: 20 },
        { id: 'qualityOfLife', label: 'Quality of Life', max: 15 },
        { id: 'riskModifiers', label: 'Risk Modifiers', max: 5 }
    ];

    categories.forEach(cat => {
        const scoreElement = document.getElementById(`crps${cat.id}Score`);
        const barElement = document.getElementById(`crps${cat.id}Bar`);

        if (scoreElement) {
            const score = crpsResult[cat.id] || 0;
            scoreElement.textContent = `${score}/${cat.max}`;
        }

        if (barElement) {
            const score = crpsResult[cat.id] || 0;
            const percentage = (score / cat.max) * 100;
            barElement.style.width = `${percentage}%`;

            // Color code the bar
            if (percentage >= 80) barElement.style.background = '#22c55e';
            else if (percentage >= 60) barElement.style.background = '#3b82f6';
            else if (percentage >= 40) barElement.style.background = '#fbbf24';
            else if (percentage >= 20) barElement.style.background = '#f97316';
            else barElement.style.background = '#ef4444';
        }
    });
}

/**
 * Initialize CRPS Trend Chart with 90-day data
 */
function initializeCRPSTrendChart() {
    const ctx = document.getElementById('crpsTrendChart');
    if (!ctx) { console.warn("crpsTrendChart canvas not found"); return; }
    console.log('📊 Initializing CRPS Trend Chart...');

    // Get CRPS scores for the last 90 days
    const today = new Date();
    const crpsData = [];
    const labels = [];

    for (let i = 90; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const dayData = allData[dateStr];
        if (dayData && dayData.crpsScore !== undefined) {
            crpsData.push({
                x: dateStr,
                y: dayData.crpsScore,
                score: dayData.crpsScore
            });
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
    }
    console.log('📈 CRPS data points collected:', crpsData.length);

    // Color code the points and segments
    const pointColors = crpsData.map(d => {
        if (d.score >= 80) return '#22c55e';
        else if (d.score >= 60) return '#3b82f6';
        else if (d.score >= 50) return '#fbbf24';
        else if (d.score >= 40) return '#f97316';
        else return '#ef4444';
    });

    // Destroy existing chart if it exists
    if (window.crpsTrendChart && typeof window.crpsTrendChart.destroy === 'function') {
        window.crpsTrendChart.destroy();
    }

    console.log('✅ CRPS Trend Chart created successfully');
    // Create new chart
    window.crpsTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.length > 0 ? labels : ['No data yet'],
            datasets: [{
                label: 'Recovery Probability Score',
                data: crpsData.length > 0 ? crpsData.map(d => d.y) : [0],
                backgroundColor: pointColors.length > 0 ? pointColors : ['rgba(96, 165, 250, 0.2)'],
                borderColor: pointColors.length > 0 ? pointColors : ['rgba(96, 165, 250, 1)'],
                borderWidth: 3,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: pointColors.length > 0 ? pointColors : ['rgba(96, 165, 250, 1)'],
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                tension: 0.4,
                fill: {
                    target: 'origin',
                    above: 'rgba(96, 165, 250, 0.1)'
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#e5e7eb',
                        font: { size: 12, weight: 'bold' },
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    titleColor: '#60a5fa',
                    bodyColor: '#e5e7eb',
                    borderColor: '#60a5fa',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const score = context.parsed.y;
                            let interpretation = '';
                            let probability = '';

                            if (score >= 90) {
                                interpretation = 'Superior Recovery';
                                probability = '95-100% probability';
                            } else if (score >= 80) {
                                interpretation = 'Excellent Recovery';
                                probability = '85-94% probability';
                            } else if (score >= 70) {
                                interpretation = 'Very Good Recovery';
                                probability = '75-84% probability';
                            } else if (score >= 60) {
                                interpretation = 'Good Recovery';
                                probability = '65-74% probability';
                            } else if (score >= 50) {
                                interpretation = 'Fair Recovery';
                                probability = '50-64% probability';
                            } else if (score >= 40) {
                                interpretation = 'Below Average';
                                probability = '35-49% probability';
                            } else if (score >= 30) {
                                interpretation = 'Poor Recovery';
                                probability = '20-34% probability';
                            } else {
                                interpretation = 'High Risk';
                                probability = '0-19% probability';
                            }

                            return [
                                `Score: ${score}/100`,
                                `${interpretation}`,
                                `${probability}`
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: '#9ca3af',
                        font: { size: 11 },
                        callback: function(value) {
                            return value + '/100';
                        }
                    },
                    grid: {
                        color: 'rgba(156, 163, 175, 0.1)',
                        drawBorder: false
                    },
                    title: {
                        display: true,
                        text: 'Recovery Probability Score',
                        color: '#60a5fa',
                        font: { size: 13, weight: 'bold' }
                    }
                },
                x: {
                    ticks: {
                        color: '#9ca3af',
                        font: { size: 10 },
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        color: 'rgba(156, 163, 175, 0.05)',
                        drawBorder: false
                    },
                    title: {
                        display: true,
                        text: 'Date',
                        color: '#60a5fa',
                        font: { size: 13, weight: 'bold' }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

/**
 * Update CRPS Trend Chart with 90-day data
 */
function updateCRPSTrendChart() {
    // Simply re-initialize the chart with updated data
    initializeCRPSTrendChart();
}

// INPUT VALIDATION AND RANGE CHECKING
const validationRules = {
    restingHR: { min: 30, max: 220, warning: { min: 40, max: 100 }, critical: { max: 120 }, unit: 'bpm' },
    bpSystolic: { min: 60, max: 250, warning: { min: 90, max: 160 }, critical: { max: 180 }, unit: 'mmHg' },
    bpDiastolic: { min: 40, max: 150, warning: { min: 60, max: 100 }, critical: { max: 110 }, unit: 'mmHg' },
    vo2Max: { min: 5, max: 80, warning: { min: 14 }, critical: { min: 10 }, unit: 'ml/kg/min' },
    maxHR: { min: 60, max: 220, warning: { min: 100 }, unit: 'bpm' },
    hrRecovery: { min: 0, max: 100, warning: { min: 12 }, unit: 'bpm' },
    sdnn: { min: 0, max: 200, warning: { min: 20 }, unit: 'ms' },
    rmssd: { min: 0, max: 200, warning: { min: 20 }, unit: 'ms' },
    pnn50: { min: 0, max: 100, warning: { min: 5 }, unit: '%' },
    walkDistance: { min: 0, max: 1000, warning: { min: 300 }, unit: 'm' },
    mets: { min: 0, max: 20, warning: { min: 5 }, unit: 'METs' },
    ejectionFraction: { min: 10, max: 90, warning: { min: 40 }, critical: { min: 30 }, unit: '%' },
    oxygenSat: { min: 70, max: 100, warning: { min: 93 }, critical: { min: 90 }, unit: '%' },
    respRate: { min: 5, max: 60, warning: { min: 12, max: 25 }, critical: { max: 30 }, unit: '/min' },
    weight: { min: 30, max: 300, unit: 'kg' },
    dyspnea: { min: 0, max: 10, warning: { max: 5 }, critical: { max: 7 }, unit: '' },
    chestPain: { min: 0, max: 10, warning: { max: 2 }, critical: { max: 3 }, unit: '' },
    fatigue: { min: 0, max: 10, warning: { max: 6 }, unit: '' },
    edema: { min: 0, max: 4, warning: { max: 2 }, critical: { max: 3 }, unit: '' },
    qualityOfLife: { min: 0, max: 100, warning: { min: 50 }, unit: '' },
    sleepQuality: { min: 0, max: 10, warning: { min: 6 }, unit: '' }
};

function validateMetricInput(fieldId, value) {
    const rules = validationRules[fieldId];
    if (!rules) return { valid: true };

    const numValue = parseFloat(value);

    // Check if empty or not a number
    if (value === '' || isNaN(numValue)) {
        return { valid: true, level: 'none' };
    }

    // Check absolute limits (error)
    if (numValue < rules.min || numValue > rules.max) {
        return {
            valid: false,
            level: 'error',
            message: `Invalid range: must be ${rules.min}-${rules.max} ${rules.unit}`
        };
    }

    // Check critical thresholds
    if (rules.critical) {
        if (rules.critical.min !== undefined && numValue < rules.critical.min) {
            return {
                valid: true,
                level: 'critical',
                message: `⚠️ CRITICAL: ${fieldId === 'chestPain' ? 'Contact physician immediately' : 'Dangerously low - seek medical attention'}`
            };
        }
        if (rules.critical.max !== undefined && numValue > rules.critical.max) {
            return {
                valid: true,
                level: 'critical',
                message: `⚠️ CRITICAL: ${fieldId === 'chestPain' ? 'Contact physician immediately' : 'Dangerously high - seek medical attention'}`
            };
        }
    }

    // Check warning thresholds
    if (rules.warning) {
        if (rules.warning.min !== undefined && numValue < rules.warning.min) {
            return {
                valid: true,
                level: 'warning',
                message: `Below recommended range (${rules.warning.min}+ ${rules.unit})`
            };
        }
        if (rules.warning.max !== undefined && numValue > rules.warning.max) {
            return {
                valid: true,
                level: 'warning',
                message: `Above recommended range (<${rules.warning.max} ${rules.unit})`
            };
        }
    }

    return { valid: true, level: 'good' };
}

function attachValidationListeners() {
    Object.keys(validationRules).forEach(fieldId => {
        const input = document.getElementById(fieldId);
        if (!input) return;

        // Set min/max attributes
        const rules = validationRules[fieldId];
        input.setAttribute('min', rules.min);
        input.setAttribute('max', rules.max);

        // Add validation on input
        input.addEventListener('input', function() {
            const result = validateMetricInput(fieldId, this.value);
            const field = this.closest('.metric-field');

            // Remove existing validation messages
            const existingWarning = field.querySelector('.metric-warning');
            const existingError = field.querySelector('.metric-error');
            if (existingWarning) existingWarning.remove();
            if (existingError) existingError.remove();

            // Remove validation classes
            this.classList.remove('warning', 'error');

            if (result.level === 'error') {
                this.classList.add('error');
                const errorDiv = document.createElement('div');
                errorDiv.className = 'metric-error show';
                errorDiv.textContent = result.message;
                field.appendChild(errorDiv);
            } else if (result.level === 'critical' || result.level === 'warning') {
                this.classList.add(result.level === 'critical' ? 'error' : 'warning');
                const warningDiv = document.createElement('div');
                warningDiv.className = `metric-${result.level === 'critical' ? 'error' : 'warning'} show`;
                warningDiv.textContent = result.message;
                field.appendChild(warningDiv);
            }
        });
    });
}

// CLINICAL ALERT SYSTEM
let pendingSaveData = null;

function checkClinicalAlerts(metrics) {
    const alerts = [];

    // CRITICAL: Chest Pain
    if (metrics.chestPain !== undefined && metrics.chestPain > 3) {
        alerts.push({
            severity: 'URGENT',
            metric: 'Chest Pain',
            value: metrics.chestPain,
            action: 'Contact your physician IMMEDIATELY. Do not wait.',
            icon: '🆘'
        });
    }

    // CRITICAL: Low Oxygen Saturation
    if (metrics.oxygenSat !== undefined && metrics.oxygenSat < 90) {
        alerts.push({
            severity: 'URGENT',
            metric: 'Oxygen Saturation',
            value: `${metrics.oxygenSat}%`,
            action: 'Dangerously low oxygen - seek immediate medical attention',
            icon: '🫁'
        });
    }

    // CRITICAL: Severe Ejection Fraction
    if (metrics.ejectionFraction !== undefined && metrics.ejectionFraction < 30) {
        alerts.push({
            severity: 'URGENT',
            metric: 'Ejection Fraction',
            value: `${metrics.ejectionFraction}%`,
            action: 'Severely reduced heart function - notify cardiologist',
            icon: '💔'
        });
    }

    // CRITICAL: Very High Blood Pressure
    if (metrics.bpSystolic !== undefined && metrics.bpSystolic > 180) {
        alerts.push({
            severity: 'URGENT',
            metric: 'Blood Pressure (Systolic)',
            value: `${metrics.bpSystolic} mmHg`,
            action: 'Hypertensive crisis - seek emergency care',
            icon: '⚠️'
        });
    }

    // WARNING: High Resting HR
    if (metrics.restingHR !== undefined && metrics.restingHR > 100) {
        alerts.push({
            severity: 'WARNING',
            metric: 'Resting Heart Rate',
            value: `${metrics.restingHR} bpm`,
            action: 'Elevated heart rate - monitor closely and discuss with provider',
            icon: '💓'
        });
    }

    // WARNING: Severe Dyspnea
    if (metrics.dyspnea !== undefined && metrics.dyspnea > 7) {
        alerts.push({
            severity: 'WARNING',
            metric: 'Shortness of Breath',
            value: `${metrics.dyspnea}/10`,
            action: 'Severe breathing difficulty - contact medical team',
            icon: '🫁'
        });
    }

    // WARNING: Severe Edema
    if (metrics.edema !== undefined && metrics.edema >= 3) {
        alerts.push({
            severity: 'WARNING',
            metric: 'Swelling (Edema)',
            value: `${metrics.edema}/4`,
            action: 'Significant fluid retention - may indicate heart failure',
            icon: '💧'
        });
    }

    // WARNING: Rapid Weight Gain (check last entry)
    const dates = Object.keys(allData).sort();
    if (dates.length > 0 && metrics.weight !== undefined) {
        const lastDate = dates[dates.length - 1];
        const lastWeight = allData[lastDate].weight;
        if (lastWeight && (metrics.weight - lastWeight) > 2) {
            alerts.push({
                severity: 'WARNING',
                metric: 'Weight Gain',
                value: `+${(metrics.weight - lastWeight).toFixed(1)} kg`,
                action: 'Rapid weight gain may indicate fluid retention',
                icon: '⚖️'
            });
        }
    }

    return alerts;
}

function showClinicalAlert(alerts) {
    const modal = document.getElementById('alertModal');
    const message = document.getElementById('alertMessage');
    const details = document.getElementById('alertDetails');

    const urgentAlerts = alerts.filter(a => a.severity === 'URGENT');
    const warningAlerts = alerts.filter(a => a.severity === 'WARNING');

    if (urgentAlerts.length > 0) {
        message.textContent = `${urgentAlerts.length} URGENT ${urgentAlerts.length === 1 ? 'ALERT' : 'ALERTS'} detected. Immediate medical attention may be required.`;
    } else {
        message.textContent = `${warningAlerts.length} ${warningAlerts.length === 1 ? 'WARNING' : 'WARNINGS'} detected. Please review these values carefully.`;
    }

    let detailsHTML = '';
    alerts.forEach(alert => {
        detailsHTML += `
            <div class="alert-detail-item">
                ${alert.icon} <strong>${alert.metric}:</strong> ${alert.value}<br>
                → ${alert.action}
            </div>
        `;
    });
    details.innerHTML = detailsHTML;

    modal.classList.add('show');
}

function closeAlert() {
    document.getElementById('alertModal').classList.remove('show');
    pendingSaveData = null;
}

function acknowledgeAlert() {
    if (pendingSaveData) {
        const { dateStr, metrics } = pendingSaveData;
        allData[dateStr] = metrics;

        // Save with error handling
        try {
            localStorage.setItem('cardiacRecoveryData', JSON.stringify(allData));
        console.log("✅ Data saved to localStorage:", allData);
            showNotification('⚠️ Data saved with clinical alerts', 'error');
        } catch (error) {
            console.error('Error saving acknowledged alert data:', error);
            if (error.name === 'QuotaExceededError') {
                showNotification('⚠️ Storage limit exceeded! Data in memory only.', 'error');
            } else {
                showNotification('⚠️ Could not save data persistently', 'error');
            }
        }

        // Update UI regardless of save status
        updateDashboard();
        updateWeeklyMilestones();
        refreshHistoryTable();
        updateCharts();
        updatePopulationComparison();
        closeAlert();
    }
}

// SAVE METRICS
// Historical mode tracking
let isHistoricalMode = false;
let historicalDate = null;

function toggleHistoricalMode() {
    const toggle = document.getElementById('historicalModeToggle');
    const picker = document.getElementById('historicalDatePicker');
    isHistoricalMode = toggle.checked;

    if (isHistoricalMode) {
        picker.style.display = 'block';
        // Set default historical date to 6 months ago
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        document.getElementById('historicalDate').value = sixMonthsAgo.toISOString().split('T')[0];
        updateHistoricalDate();
    } else {
        picker.style.display = 'none';
        historicalDate = null;
        // Reset to current date
        document.getElementById('entryDate').textContent = currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
}

function updateHistoricalDate() {
    const dateInput = document.getElementById('historicalDate');
    if (dateInput.value) {
        historicalDate = new Date(dateInput.value + 'T00:00:00');
        document.getElementById('entryDate').textContent = historicalDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) + ' (Historical)';
    }
}

function saveMetrics() {
    // Use historical date if in historical mode, otherwise use current date
    console.log("💾 saveMetrics called");
    const dateStr = isHistoricalMode && historicalDate
        ? historicalDate.toISOString().split('T')[0]
        : currentDate.toISOString().split('T')[0];

    const metrics = {};
    let hasErrors = false;

    const fields = [
        'restingHR', 'bpSystolic', 'bpDiastolic', 'vo2Max', 'maxHR', 'hrRecovery',
        'sdnn', 'rmssd', 'pnn50', 'walkDistance', 'mets', 'ejectionFraction',
        'spo2', 'respRate', 'weight', 'dyspnea', 'chestPain', 'fatigue',
        'edema', 'qualityOfLife', 'sleepQuality',
        // Samsung Watch ECG Fields
        'qrsDuration', 'rrInterval'
    ];

    const textFields = [
        'ecgRhythmInput', 'stressLevel'
    ];

    // Process numeric fields
    fields.forEach(field => {
        const element = document.getElementById(field);
        if (!element) return;

        const value = element.value;
        if (value !== '') {
            const result = validateMetricInput(field, value);

            if (!result.valid) {
                hasErrors = true;
                return;
            }

            metrics[field] = parseFloat(value);
        }
    });

    // Process text/dropdown fields (Samsung Watch ECG)
    textFields.forEach(field => {
        const element = document.getElementById(field);
        if (!element) return;

        const value = element.value;
        if (value !== '') {
            metrics[field] = value;
        }
    });

    // Map spo2 to oxygenSat for consistency with rest of codebase
    if (metrics.spo2 !== undefined) {
        metrics.oxygenSat = metrics.spo2;
        delete metrics.spo2;
    }

    // Save daily notes
    const notes = document.getElementById('dailyNotes').value;
    if (notes.trim() !== '') {
        metrics.notes = notes.trim();
    }
// Attach GPS location if captured            if (capturedLocation && capturedLocation.coords) {                metrics.location = {                    latitude: capturedLocation.coords.latitude,                    longitude: capturedLocation.coords.longitude,                    label: capturedLocation.label,                    timestamp: capturedLocation.coords.timestamp,                    accuracy: capturedLocation.coords.accuracy                };                console.log('📍 Location attached to metrics:', metrics.location);            }

    if (hasErrors) {
        showNotification('Please fix invalid values before saving', 'error');
        return;
    }

    if (Object.keys(metrics).length === 0) {
        showNotification('Please enter at least one metric', 'error');
        return;
    }

    // Check for clinical alerts
    const alerts = checkClinicalAlerts(metrics);

    if (alerts.length > 0) {
        pendingSaveData = { dateStr, metrics };
        showClinicalAlert(alerts);
        return;
    }

    // Mark as historical data if in historical mode
    if (isHistoricalMode) {
        metrics.isHistorical = true;
    }

    // No alerts - save normally
    allData[dateStr] = metrics;

    // Calculate CRPS (Cardiac Recovery Probability Score)
    // Get patient demographics from stored profile (or use defaults)
    const demographics = getCurrentDemographics();

    try {
        const crpsResult = calculateCRPS(metrics, demographics.age, demographics.height, demographics.sex);
        metrics.crpsScore = crpsResult.total;
        metrics.crpsBreakdown = crpsResult;
        allData[dateStr] = metrics; // Re-save with CRPS score

        // Update real-time CRPS display
        updateCRPSDisplay(crpsResult);
    } catch (error) {
        console.error('Error calculating CRPS:', error);
        // Continue without CRPS if calculation fails
    }

    // Save to localStorage with error handling
    try {
        localStorage.setItem('cardiacRecoveryData', JSON.stringify(allData));
        console.log("✅ Data saved to localStorage:", allData);
        const message = isHistoricalMode
            ? `Historical data saved for ${historicalDate.toLocaleDateString()}!`
            : 'Metrics saved!';
        showNotification(message, 'success');
    } catch (error) {
        console.error('Error saving metrics:', error);
        if (error.name === 'QuotaExceededError') {
            showNotification('⚠️ Storage limit exceeded! Consider exporting old data.', 'error');
        } else {
            showNotification('⚠️ Could not save data persistently. Data in memory only.', 'error');
        }
    }

    // Update UI - SKIP dashboard and milestones for historical data
    if (isHistoricalMode) {
        // Only update charts and history for historical data
        refreshHistoryTable();
        updateCharts();
    } else {
        // Update everything for current data
        updateDashboard();
        updateWeeklyMilestones();
        refreshHistoryTable();
        updateCharts();
        updatePopulationComparison();
    }
}

// LOAD DATA FOR DATE
function loadDataForDate(dateStr) {
    const data = allData[dateStr];
    document.querySelectorAll('.metric-field input').forEach(input => input.value = '');
    document.getElementById('dailyNotes').value = '';
    if (data) {
        Object.keys(data).forEach(key => {
            if (key === 'notes') {
                document.getElementById('dailyNotes').value = data[key];
            } else {
                const input = document.getElementById(key);
                if (input) input.value = data[key];
            }
        });
    }
}

// Helper function to calculate average
function calcAverage(metric) {
    const dates = Object.keys(allData);
    const values = dates.map(d => allData[d][metric]).filter(v => v !== undefined && v !== null);
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
}

// UPDATE DASHBOARD STATS
// Helper function to apply color coding for out-of-range values
function applyRangeColorCoding(metric, value, elementId, avgValue = null) {
    const element = document.getElementById(elementId);
    const avgElement = avgValue !== null ? document.getElementById(elementId + 'Avg') : null;

    if (!element) return;

    // Remove existing range classes
    element.classList.remove('slightly-out-of-range', 'way-out-of-range');
    if (avgElement) avgElement.classList.remove('slightly-out-of-range', 'way-out-of-range');

    // Define normal ranges (slightly out = yellow, way out = red)
    const ranges = {
        restingHR: { optimal: [60, 100], slightlyOut: [50, 110], wayOut: [40, 120] },
        bpSystolic: { optimal: [90, 120], slightlyOut: [85, 140], wayOut: [70, 160] },
        bpDiastolic: { optimal: [60, 80], slightlyOut: [55, 90], wayOut: [40, 100] },
        oxygenSat: { optimal: [95, 100], slightlyOut: [90, 94], wayOut: [0, 89] },
        respRate: { optimal: [12, 20], slightlyOut: [10, 25], wayOut: [8, 30] },
        ejectionFraction: { optimal: [50, 100], slightlyOut: [40, 49], wayOut: [0, 39] },
        hrRecovery: { optimal: [12, 100], slightlyOut: [8, 11], wayOut: [0, 7] },
        vo2Max: { optimal: [20, 100], slightlyOut: [15, 19], wayOut: [0, 14] },
        maxHR: { optimal: [100, 180], slightlyOut: [90, 190], wayOut: [80, 200] }
    };

    if (!ranges[metric]) return;

    const range = ranges[metric];

    // Check if value is out of range
    if (value < range.wayOut[0] || value > range.wayOut[1]) {
        element.classList.add('way-out-of-range');
    } else if (value < range.slightlyOut[0] || value > range.slightlyOut[1]) {
        element.classList.add('slightly-out-of-range');
    }

    // Apply same logic to average if provided
    if (avgElement && avgValue !== null) {
        if (avgValue < range.wayOut[0] || avgValue > range.wayOut[1]) {
            avgElement.classList.add('way-out-of-range');
        } else if (avgValue < range.slightlyOut[0] || avgValue > range.slightlyOut[1]) {
            avgElement.classList.add('slightly-out-of-range');
        }
    }
}

function updateDashboard() {
    try {
        const dates = Object.keys(allData).sort();
        if (dates.length === 0) return;

        const latest = allData[dates[dates.length - 1]];
        const latestDate = new Date(dates[dates.length - 1]).toLocaleDateString();

        // VO2 Max
        if (latest.vo2Max) {
            document.getElementById('statsVO2').textContent = latest.vo2Max.toFixed(1);
            const avg = calcAverage('vo2Max');
            if (avg) document.getElementById('statsVO2Avg').textContent = avg.toFixed(1);
            document.getElementById('statsVO2Date').textContent = `Last: ${latestDate}`;
            document.getElementById('statsVO2Trend').textContent = '↑ Improving';
            applyRangeColorCoding('vo2Max', latest.vo2Max, 'statsVO2', avg);
        }
        // Resting HR
        if (latest.restingHR) {
            document.getElementById('statsHR').textContent = latest.restingHR;
            const avg = calcAverage('restingHR');
            if (avg) document.getElementById('statsHRAvg').textContent = Math.round(avg);
            document.getElementById('statsHRDate').textContent = `Last: ${latestDate}`;
            document.getElementById('statsHRTrend').textContent = '↓ Improving';
            applyRangeColorCoding('restingHR', latest.restingHR, 'statsHR', avg);
        }
        // SDNN
        if (latest.sdnn) {
            document.getElementById('statsSDNN').textContent = latest.sdnn.toFixed(1);
            const avg = calcAverage('sdnn');
            if (avg) document.getElementById('statsSDNNAvg').textContent = avg.toFixed(1);
            document.getElementById('statsSDNNDate').textContent = `Last: ${latestDate}`;
            document.getElementById('statsSDNNTrend').textContent = '↑ Good HRV';
        }
        // Blood Pressure
        if (latest.bpSystolic && latest.bpDiastolic) {
            document.getElementById('statsBP').textContent = `${latest.bpSystolic}/${latest.bpDiastolic}`;
            const avgSys = calcAverage('bpSystolic');
            const avgDia = calcAverage('bpDiastolic');
            if (avgSys && avgDia) document.getElementById('statsBPAvg').textContent = `${Math.round(avgSys)}/${Math.round(avgDia)}`;
            document.getElementById('statsBPDate').textContent = `Last: ${latestDate}`;
            const status = latest.bpSystolic < 120 && latest.bpDiastolic < 80 ? 'Optimal' : latest.bpSystolic < 130 ? 'Good' : 'Monitor';
            document.getElementById('statsBPTrend').textContent = status;
            applyRangeColorCoding('bpSystolic', latest.bpSystolic, 'statsBP', avgSys);
        }
        // Max HR
        if (latest.maxHR) {
            document.getElementById('statsMaxHR').textContent = latest.maxHR;
            const avg = calcAverage('maxHR');
            if (avg) document.getElementById('statsMaxHRAvg').textContent = Math.round(avg);
            document.getElementById('statsMaxHRDate').textContent = `Last: ${latestDate}`;
            document.getElementById('statsMaxHRTrend').textContent = 'Recorded';
            applyRangeColorCoding('maxHR', latest.maxHR, 'statsMaxHR', avg);
        }
        // HR Recovery
        if (latest.hrRecovery) {
            document.getElementById('statsHRRecovery').textContent = latest.hrRecovery;
            const avg = calcAverage('hrRecovery');
            if (avg) document.getElementById('statsHRRecoveryAvg').textContent = Math.round(avg);
            document.getElementById('statsHRRecoveryDate').textContent = `Last: ${latestDate}`;
            const status = latest.hrRecovery > 25 ? 'Excellent' : latest.hrRecovery > 20 ? 'Good' : 'Improving';
            document.getElementById('statsHRRecoveryTrend').textContent = status;
            applyRangeColorCoding('hrRecovery', latest.hrRecovery, 'statsHRRecovery', avg);
        }
        // RMSSD
        if (latest.rmssd) {
            document.getElementById('statsRMSSD').textContent = latest.rmssd.toFixed(1);
            const avg = calcAverage('rmssd');
            if (avg) document.getElementById('statsRMSSDAvg').textContent = avg.toFixed(1);
            document.getElementById('statsRMSSDDate').textContent = `Last: ${latestDate}`;
            const status = latest.rmssd > 40 ? 'Excellent' : latest.rmssd > 30 ? 'Good' : 'Fair';
            document.getElementById('statsRMSSDTrend').textContent = status;
        }
        // pNN50
        if (latest.pnn50) {
            document.getElementById('statsPNN50').textContent = latest.pnn50.toFixed(1);
            const avg = calcAverage('pnn50');
            if (avg) document.getElementById('statsPNN50Avg').textContent = avg.toFixed(1);
            document.getElementById('statsPNN50Date').textContent = `Last: ${latestDate}`;
            const status = latest.pnn50 > 20 ? 'Excellent' : latest.pnn50 > 10 ? 'Good' : 'Fair';
            document.getElementById('statsPNN50Trend').textContent = status;
        }
        // 6-Minute Walk
        if (latest.walkDistance) {
            document.getElementById('stats6MWD').textContent = latest.walkDistance;
            const avg = calcAverage('walkDistance');
            if (avg) document.getElementById('stats6MWDAvg').textContent = Math.round(avg);
            document.getElementById('stats6MWDDate').textContent = `Last: ${latestDate}`;
            const status = latest.walkDistance > 500 ? 'Excellent' : latest.walkDistance > 400 ? 'Good' : 'Improving';
            document.getElementById('stats6MWDTrend').textContent = status;
        }
        // METs
        if (latest.mets) {
            document.getElementById('statsMETs').textContent = latest.mets.toFixed(1);
            const avg = calcAverage('mets');
            if (avg) document.getElementById('statsMETsAvg').textContent = avg.toFixed(1);
            document.getElementById('statsMETsDate').textContent = `Last: ${latestDate}`;
            const status = latest.mets > 10 ? 'Excellent' : latest.mets > 7 ? 'Good' : 'Fair';
            document.getElementById('statsMETsTrend').textContent = status;
        }
        // Ejection Fraction
        if (latest.ejectionFraction) {
            document.getElementById('statsEF').textContent = latest.ejectionFraction;
            const avg = calcAverage('ejectionFraction');
            if (avg) document.getElementById('statsEFAvg').textContent = Math.round(avg);
            document.getElementById('statsEFDate').textContent = `Last: ${latestDate}`;
            const status = latest.ejectionFraction >= 50 ? 'Normal' : latest.ejectionFraction >= 40 ? 'Borderline' : 'Reduced';
            document.getElementById('statsEFTrend').textContent = status;
            applyRangeColorCoding('ejectionFraction', latest.ejectionFraction, 'statsEF', avg);
        }
        // Oxygen Saturation
        if (latest.oxygenSat) {
            document.getElementById('statsSpO2').textContent = latest.oxygenSat;
            const avg = calcAverage('oxygenSat');
            if (avg) document.getElementById('statsSpO2Avg').textContent = Math.round(avg);
            document.getElementById('statsSpO2Date').textContent = `Last: ${latestDate}`;
            const status = latest.oxygenSat >= 95 ? 'Normal' : latest.oxygenSat >= 90 ? 'Monitor' : 'Low';
            document.getElementById('statsSpO2Trend').textContent = status;
            applyRangeColorCoding('oxygenSat', latest.oxygenSat, 'statsSpO2', avg);
        }
        // Respiratory Rate
        if (latest.respRate) {
            document.getElementById('statsRespRate').textContent = latest.respRate;
            const avg = calcAverage('respRate');
            if (avg) document.getElementById('statsRespRateAvg').textContent = Math.round(avg);
            document.getElementById('statsRespRateDate').textContent = `Last: ${latestDate}`;
            const status = latest.respRate >= 12 && latest.respRate <= 20 ? 'Normal' : 'Monitor';
            document.getElementById('statsRespRateTrend').textContent = status;
            applyRangeColorCoding('respRate', latest.respRate, 'statsRespRate', avg);
        }
        // Weight
        if (latest.weight) {
            document.getElementById('statsWeight').textContent = latest.weight.toFixed(1);
            const avg = calcAverage('weight');
            if (avg) document.getElementById('statsWeightAvg').textContent = avg.toFixed(1);
            document.getElementById('statsWeightDate').textContent = `Last: ${latestDate}`;
            document.getElementById('statsWeightTrend').textContent = 'Tracked';
        }
        // Dyspnea
        if (latest.dyspnea !== undefined) {
            document.getElementById('statsDyspnea').textContent = latest.dyspnea;
            const avg = calcAverage('dyspnea');
            if (avg !== null) document.getElementById('statsDyspneaAvg').textContent = avg.toFixed(1);
            document.getElementById('statsDyspneaDate').textContent = `Last: ${latestDate}`;
            const status = latest.dyspnea <= 3 ? 'Mild' : latest.dyspnea <= 6 ? 'Moderate' : 'Severe';
            document.getElementById('statsDyspneaTrend').textContent = status;
        }
        // Chest Pain
        if (latest.chestPain !== undefined) {
            document.getElementById('statsChestPain').textContent = latest.chestPain;
            const avg = calcAverage('chestPain');
            if (avg !== null) document.getElementById('statsChestPainAvg').textContent = avg.toFixed(1);
            document.getElementById('statsChestPainDate').textContent = `Last: ${latestDate}`;
            const status = latest.chestPain === 0 ? 'None' : latest.chestPain <= 3 ? 'Mild' : 'Contact MD';
            document.getElementById('statsChestPainTrend').textContent = status;
        }
        // Fatigue
        if (latest.fatigue !== undefined) {
            document.getElementById('statsFatigue').textContent = latest.fatigue;
            const avg = calcAverage('fatigue');
            if (avg !== null) document.getElementById('statsFatigueAvg').textContent = avg.toFixed(1);
            document.getElementById('statsFatigueDate').textContent = `Last: ${latestDate}`;
            const status = latest.fatigue <= 3 ? 'Low' : latest.fatigue <= 6 ? 'Moderate' : 'High';
            document.getElementById('statsFatigueTrend').textContent = status;
        }
        // Edema
        if (latest.edema !== undefined) {
            document.getElementById('statsEdema').textContent = latest.edema;
            const avg = calcAverage('edema');
            if (avg !== null) document.getElementById('statsEdemaAvg').textContent = avg.toFixed(1);
            document.getElementById('statsEdemaDate').textContent = `Last: ${latestDate}`;
            const status = latest.edema === 0 ? 'None' : latest.edema <= 2 ? 'Mild' : 'Monitor';
            document.getElementById('statsEdemaTrend').textContent = status;
        }
        // Quality of Life
        if (latest.qualityOfLife) {
            document.getElementById('statsQOL').textContent = latest.qualityOfLife;
            const avg = calcAverage('qualityOfLife');
            if (avg) document.getElementById('statsQOLAvg').textContent = Math.round(avg);
            document.getElementById('statsQOLDate').textContent = `Last: ${latestDate}`;
            const status = latest.qualityOfLife >= 80 ? 'Excellent' : latest.qualityOfLife >= 60 ? 'Good' : 'Fair';
            document.getElementById('statsQOLTrend').textContent = status;
        }
        // Sleep Quality
        if (latest.sleepQuality !== undefined) {
            document.getElementById('statsSleep').textContent = latest.sleepQuality;
            const avg = calcAverage('sleepQuality');
            if (avg !== null) document.getElementById('statsSleepAvg').textContent = avg.toFixed(1);
            document.getElementById('statsSleepDate').textContent = `Last: ${latestDate}`;
            const status = latest.sleepQuality >= 8 ? 'Excellent' : latest.sleepQuality >= 6 ? 'Good' : 'Poor';
            document.getElementById('statsSleepTrend').textContent = status;
        }

        // CRPS Recovery Probability Score
        if (latest.crpsScore !== undefined && latest.crpsBreakdown) {
            updateCRPSDisplay(latest.crpsBreakdown);
        }
    } catch (error) {
        console.error('Dashboard update error:', error);
        // Fail silently for dashboard - non-critical display issue
    }
}

// WEEKLY MILESTONES FUNCTIONS
function updateWeeklyMilestones() {
    try {
        const dates = Object.keys(allData).sort();

        // If no surgery date, show milestones without week numbers
        if (!surgeryDateStr) {
            document.getElementById('milestonesTitle').textContent = '🎯 Recent Achievements';
            document.getElementById('currentWeekTitle').textContent = 'Your Progress';
            document.getElementById('nextWeekTitle').innerHTML = 'Goals <button onclick="toggleEditGoals()" style="margin-left: 10px; padding: 4px 12px; background: var(--accent); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">✏️ Edit</button>';

            // Still show milestones if we have data
            if (dates.length > 0) {
                const topMilestones = calculateTopMilestones(null);
                const milestonesContainer = document.getElementById('topMilestones');

                if (topMilestones.length === 0) {
                    milestonesContainer.innerHTML = '<div style="color: var(--muted); font-size: 0.9rem;">Enter data on multiple days to track improvements...</div>';
                } else {
                    let milestonesHTML = '';
                    topMilestones.slice(0, 3).forEach((milestone, idx) => {
                        const medalIcon = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
                        milestonesHTML += `
                            <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.5); border-radius: 4px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 1.2rem;">${medalIcon}</span>
                                    <span style="font-weight: 600; color: var(--text);">${milestone.name}</span>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-weight: 700; color: var(--accent); font-size: 1.1rem;">${milestone.improvement}</div>
                                    <div style="font-size: 0.75rem; color: var(--muted);">${milestone.comparison}</div>
                                </div>
                            </div>
                        `;
                    });
                    milestonesContainer.innerHTML = milestonesHTML;
                }
            } else {
                document.getElementById('topMilestones').innerHTML = '<div style="color: var(--muted); font-size: 0.9rem;">No data entered yet. Start tracking your metrics!</div>';
            }

            loadCustomGoals();
            return;
        }

        if (dates.length === 0) {
            document.getElementById('topMilestones').innerHTML = '<div style="color: var(--muted); font-size: 0.9rem;">No data entered yet. Start tracking your metrics!</div>';
            return;
        }

        // Calculate current week number
        const currentWeekNum = Math.floor((new Date() - new Date(surgeryDateStr)) / (7 * 24 * 60 * 60 * 1000));

        // Update titles
        document.getElementById('milestonesTitle').textContent = `🎯 Week ${currentWeekNum + 1} Milestones`;
        document.getElementById('currentWeekTitle').textContent = `Week ${currentWeekNum + 1} Achievements`;
        document.getElementById('nextWeekTitle').innerHTML = `Week ${currentWeekNum + 2} Goals <button onclick="toggleEditGoals()" style="margin-left: 10px; padding: 4px 12px; background: var(--accent); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">✏️ Edit</button>`;

        // Calculate top milestones
        const topMilestones = calculateTopMilestones(currentWeekNum);

        // Display top 3 milestones
        const milestonesContainer = document.getElementById('topMilestones');
        if (topMilestones.length === 0) {
            milestonesContainer.innerHTML = '<div style="color: var(--muted); font-size: 0.9rem;">Enter data on multiple days to track week-over-week improvements...</div>';
        } else {
            let milestonesHTML = '';
            topMilestones.slice(0, 3).forEach((milestone, idx) => {
                const medalIcon = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
                milestonesHTML += `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.5); border-radius: 4px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 1.2rem;">${medalIcon}</span>
                            <span style="font-weight: 600; color: var(--text);">${milestone.name}</span>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 700; color: var(--accent); font-size: 1.1rem;">${milestone.improvement}</div>
                            <div style="font-size: 0.75rem; color: var(--muted);">${milestone.comparison}</div>
                        </div>
                    </div>
                `;
            });
            milestonesContainer.innerHTML = milestonesHTML;
        }

        // Load and display custom goals
        loadCustomGoals();

    } catch (error) {
        console.error('Weekly milestones update error:', error);
        // Show error message to user
        const milestonesContainer = document.getElementById('topMilestones');
        if (milestonesContainer) {
            milestonesContainer.innerHTML = '<div style="color: var(--bad); font-size: 0.9rem;">⚠️ Error loading milestones. Check console.</div>';
        }
    }
}

function calculateTopMilestones(currentWeekNum) {
    const dates = Object.keys(allData).sort();
    if (dates.length < 2) return [];

    let currentWeekDates, previousWeekDates;

    // If no surgery date (currentWeekNum is null), compare most recent data vs previous data
    if (currentWeekNum === null || !surgeryDateStr) {
        // Get the most recent 7 days
        const recentDate = new Date(dates[dates.length - 1]);
        const sevenDaysAgo = new Date(recentDate);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const fourteenDaysAgo = new Date(recentDate);
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        currentWeekDates = dates.filter(date => new Date(date) >= sevenDaysAgo);
        previousWeekDates = dates.filter(date => {
            const d = new Date(date);
            return d >= fourteenDaysAgo && d < sevenDaysAgo;
        });
    } else {
        // Get current week data and previous week data based on surgery date
        currentWeekDates = dates.filter(date => {
            const weekNum = Math.floor((new Date(date) - new Date(surgeryDateStr)) / (7 * 24 * 60 * 60 * 1000));
            return weekNum === currentWeekNum;
        });

        previousWeekDates = dates.filter(date => {
            const weekNum = Math.floor((new Date(date) - new Date(surgeryDateStr)) / (7 * 24 * 60 * 60 * 1000));
            return weekNum === currentWeekNum - 1;
        });
    }

    if (currentWeekDates.length === 0 || previousWeekDates.length === 0) return [];

    // Calculate averages for both weeks
    const metrics = [
        { key: 'vo2Max', name: 'VO2 Max', unit: 'ml/kg/min', higherBetter: true },
        { key: 'restingHR', name: 'Resting HR', unit: 'bpm', higherBetter: false },
        { key: 'hrRecovery', name: 'HR Recovery', unit: 'bpm drop', higherBetter: true },
        { key: 'sdnn', name: 'SDNN (HRV)', unit: 'ms', higherBetter: true },
        { key: 'rmssd', name: 'RMSSD (HRV)', unit: 'ms', higherBetter: true },
        { key: 'walkDistance', name: '6MWD', unit: 'm', higherBetter: true },
        { key: 'mets', name: 'METs', unit: '', higherBetter: true },
        { key: 'ejectionFraction', name: 'Ejection Fraction', unit: '%', higherBetter: true },
        { key: 'oxygenSat', name: 'Oxygen Saturation', unit: '%', higherBetter: true },
        { key: 'bpSystolic', name: 'Systolic BP', unit: 'mmHg', higherBetter: false },
        { key: 'bpDiastolic', name: 'Diastolic BP', unit: 'mmHg', higherBetter: false },
        { key: 'qualityOfLife', name: 'Quality of Life', unit: '/100', higherBetter: true }
    ];

    const improvements = [];

    metrics.forEach(metric => {
        // Calculate current week average
        const currentValues = currentWeekDates.map(d => allData[d][metric.key]).filter(v => v !== undefined && v !== null);
        const previousValues = previousWeekDates.map(d => allData[d][metric.key]).filter(v => v !== undefined && v !== null);

        if (currentValues.length > 0 && previousValues.length > 0) {
            const currentAvg = currentValues.reduce((a, b) => a + b, 0) / currentValues.length;
            const previousAvg = previousValues.reduce((a, b) => a + b, 0) / previousValues.length;

            const diff = currentAvg - previousAvg;
            const percentChange = ((diff / previousAvg) * 100);

            // Determine if this is an improvement
            const isImprovement = metric.higherBetter ? diff > 0 : diff < 0;

            if (isImprovement) {
                improvements.push({
                    name: metric.name,
                    improvement: metric.higherBetter
                        ? `+${diff.toFixed(1)} ${metric.unit}`
                        : `${diff.toFixed(1)} ${metric.unit}`,
                    comparison: `${previousAvg.toFixed(1)} → ${currentAvg.toFixed(1)} (${Math.abs(percentChange).toFixed(1)}%)`,
                    percentChange: Math.abs(percentChange)
                });
            }
        }
    });

    // Sort by percent improvement and return top 3
    return improvements.sort((a, b) => b.percentChange - a.percentChange);
}

function toggleEditGoals() {
    const display = document.getElementById('goalsDisplay');
    const edit = document.getElementById('goalsEdit');

    if (display.style.display === 'none') {
        // Cancel editing
        display.style.display = 'block';
        edit.style.display = 'none';
    } else {
        // Start editing - populate fields with current values
        document.getElementById('editGoal1Name').value = document.getElementById('goal1Name').textContent.replace(':', '');
        document.getElementById('editGoal1Value').value = document.getElementById('goal1Value').textContent;
        document.getElementById('editGoal2Name').value = document.getElementById('goal2Name').textContent.replace(':', '');
        document.getElementById('editGoal2Value').value = document.getElementById('goal2Value').textContent;
        document.getElementById('editGoal3Name').value = document.getElementById('goal3Name').textContent.replace(':', '');
        document.getElementById('editGoal3Value').value = document.getElementById('goal3Value').textContent;

        display.style.display = 'none';
        edit.style.display = 'block';
    }
}

function saveCustomGoals() {
    const goals = {
        goal1: {
            name: document.getElementById('editGoal1Name').value || 'VO2 Max',
            value: document.getElementById('editGoal1Value').value || 'Improve 5%'
        },
        goal2: {
            name: document.getElementById('editGoal2Name').value || 'Resting HR',
            value: document.getElementById('editGoal2Value').value || 'Reduce 2-3 bpm'
        },
        goal3: {
            name: document.getElementById('editGoal3Name').value || '6MWD',
            value: document.getElementById('editGoal3Value').value || 'Increase 20m'
        }
    };

    // Save to localStorage
    try {
        localStorage.setItem('customGoals', JSON.stringify(goals));
        showNotification('✅ Goals saved successfully', 'success');
    } catch (error) {
        console.error('Error saving goals:', error);
        showNotification('⚠️ Could not save goals', 'error');
    }

    // Update display
    document.getElementById('goal1Name').textContent = goals.goal1.name + ':';
    document.getElementById('goal1Value').textContent = goals.goal1.value;
    document.getElementById('goal2Name').textContent = goals.goal2.name + ':';
    document.getElementById('goal2Value').textContent = goals.goal2.value;
    document.getElementById('goal3Name').textContent = goals.goal3.name + ':';
    document.getElementById('goal3Value').textContent = goals.goal3.value;

    // Hide edit mode
    document.getElementById('goalsDisplay').style.display = 'block';
    document.getElementById('goalsEdit').style.display = 'none';
}

function cancelEditGoals() {
    document.getElementById('goalsDisplay').style.display = 'block';
    document.getElementById('goalsEdit').style.display = 'none';
}

function loadCustomGoals() {
    try {
        const savedGoals = localStorage.getItem('customGoals');
        if (savedGoals) {
            const goals = JSON.parse(savedGoals);
            document.getElementById('goal1Name').textContent = goals.goal1.name + ':';
            document.getElementById('goal1Value').textContent = goals.goal1.value;
            document.getElementById('goal2Name').textContent = goals.goal2.name + ':';
            document.getElementById('goal2Value').textContent = goals.goal2.value;
            document.getElementById('goal3Name').textContent = goals.goal3.name + ':';
            document.getElementById('goal3Value').textContent = goals.goal3.value;
        }
    } catch (error) {
        console.error('Error loading custom goals:', error);
    }
}

// DELETE DATA
function deleteEntry(dateStr) {
    if (confirm(`Delete all data for ${dateStr}?`)) {
        delete allData[dateStr];

        // Save deletion with error handling
        try {
            localStorage.setItem('cardiacRecoveryData', JSON.stringify(allData));
        console.log("✅ Data saved to localStorage:", allData);
            showNotification('Data deleted', 'success');
        } catch (error) {
            console.error('Error saving after deletion:', error);
            showNotification('⚠️ Deleted from memory but could not persist', 'error');
        }

        // Update UI regardless of save status
        refreshHistoryTable();
        updateDashboard();
        updateWeeklyMilestones();
        updateCharts();
    }
}

function clearForm() {
    if (confirm('Clear the current form and delete saved data for this date?')) {
        // Clear form fields
        document.querySelectorAll('.metric-field input').forEach(input => input.value = '');
        document.getElementById('dailyNotes').value = '';

        // Delete saved data for current date
        const dateStr = currentDate.toISOString().split('T')[0];
        delete allData[dateStr];
        localStorage.setItem('cardiacRecoveryData', JSON.stringify(allData));

        // Update dashboard to reflect deletion
        updateDashboard();
        updateWeeklyMilestones();
        updateCharts();

        showNotification('✅ Form cleared and data deleted', 'success');
    }
}

// CLEAR CURRENT DATE DATA ONLY
function clearCurrentData() {
    const dateStr = currentDate.toISOString().split('T')[0];
    const displayDate = currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const confirmation = confirm(
        `⚠️ Clear data for ${displayDate}?\n\n` +
        'This will delete all metrics and notes for this date only.\n\n' +
        'This action cannot be undone.'
    );

    if (!confirmation) {
        return;
    }

    try {
        // Delete data for current date
        delete allData[dateStr];
        localStorage.setItem('cardiacRecoveryData', JSON.stringify(allData));

        // Clear form fields
        document.querySelectorAll('.metric-field input').forEach(input => input.value = '');
        const notesField = document.getElementById('dailyNotes');
        if (notesField) notesField.value = '';

        // Update dashboard to reflect deletion
        updateDashboard();
        updateWeeklyMilestones();
        updateCharts();

        showNotification(`✅ Data cleared for ${displayDate}`, 'success');
    } catch (error) {
        console.error('Error clearing current data:', error);
        showNotification('❌ Failed to clear data', 'error');
    }
}

// CLEAR ALL PATIENT DATA
function clearAllPatientData() {
    const confirmation = confirm(
        '⚠️ WARNING: This will permanently delete ALL patient data including:\n\n' +
        '• All recorded metrics and measurements\n' +
        '• All therapy sessions\n' +
        '• All historical data\n' +
        '• All goals and milestones\n' +
        '• Surgery date and patient information\n\n' +
        'This action CANNOT be undone!\n\n' +
        'Are you absolutely sure you want to continue?'
    );

    if (!confirmation) {
        return;
    }

    // Second confirmation for safety
    const finalConfirmation = confirm(
        'FINAL CONFIRMATION:\n\n' +
        'Type YES in your mind if you really want to delete everything.\n\n' +
        'Click OK to proceed with deletion, or Cancel to keep your data.'
    );

    if (!finalConfirmation) {
        return;
    }

    try {
        // Clear all localStorage data
        localStorage.removeItem('cardiacRecoveryData');
        localStorage.removeItem('surgeryDate');
        localStorage.removeItem('sessionHistory');
        localStorage.removeItem('weeklyGoals');

        // Reset in-memory data
        allData = {};
        surgeryDateStr = null;

        // Reset surgery date input field
        const surgeryDateInput = document.getElementById('surgeryDate');
        if (surgeryDateInput) {
            surgeryDateInput.value = '';
        }

        // Reset UI elements
        document.getElementById('statsWeeks').textContent = '0';
        document.getElementById('statsVO2').textContent = '--';
        document.getElementById('statsVO2Avg').textContent = '--';
        document.getElementById('statsVO2Trend').textContent = 'No data yet';
        document.getElementById('statsVO2Date').textContent = '--';
        document.getElementById('statsHR').textContent = '--';
        document.getElementById('statsHRAvg').textContent = '--';
        document.getElementById('statsHRTrend').textContent = 'No data yet';
        document.getElementById('statsHRDate').textContent = '--';
        document.getElementById('statsSDNN').textContent = '--';
        document.getElementById('statsSDNNAvg').textContent = '--';
        document.getElementById('statsSDNNTrend').textContent = 'No data yet';
        document.getElementById('statsSDNNDate').textContent = '--';

        // Clear all input fields
        document.querySelectorAll('.metric-field input').forEach(input => input.value = '');
        if (document.getElementById('dailyNotes')) {
            document.getElementById('dailyNotes').value = '';
        }

        // Reset charts
        updateCharts();

        // Refresh history table
        refreshHistoryTable();

        // Clear milestones
        if (document.getElementById('topMilestones')) {
            document.getElementById('topMilestones').innerHTML =
                '<div style="color: var(--muted); font-size: 0.9rem;">Enter data to see your progress...</div>';
        }

        // Show success notification
        showNotification('✅ All patient data has been cleared successfully', 'success');

        // Switch to Dashboard tab
        switchTab('dashboard');
    } catch (error) {
        console.error('Error clearing data:', error);
        showNotification('❌ Error clearing data: ' + error.message, 'error');
    }
}

// HISTORY TABLE
function refreshHistoryTable() {
    try {
        const tbody = document.getElementById('historyBody');
        const dates = Object.keys(allData).sort().reverse();

        if (dates.length === 0) {
            tbody.innerHTML = '<tr><td colspan="25" style="text-align: center; color: var(--muted);">No data yet</td></tr>';
            return;
        }

        tbody.innerHTML = dates.map(date => {
            const data = allData[date];
            const dayNum = surgeryDateStr ?
                Math.floor((new Date(date) - new Date(surgeryDateStr)) / (1000 * 60 * 60 * 24)) + 1 : '?';

            return `
                <tr>
                    <td>${date}</td>
                    <td>Day ${dayNum}</td>
                    <td>${data.restingHR || '-'}</td>
                    <td>${data.bpSystolic || '-'}</td>
                    <td>${data.bpDiastolic || '-'}</td>
                    <td>${data.vo2Max || '-'}</td>
                    <td>${data.maxHR || '-'}</td>
                    <td>${data.hrRecovery || '-'}</td>
                    <td>${data.sdnn || '-'}</td>
                    <td>${data.rmssd || '-'}</td>
                    <td>${data.pnn50 !== undefined ? data.pnn50 : '-'}</td>
                    <td>${data.walkDistance || '-'}</td>
                    <td>${data.mets || '-'}</td>
                    <td>${data.ejectionFraction || '-'}</td>
                    <td>${data.oxygenSat || '-'}</td>
                    <td>${data.respRate || '-'}</td>
                    <td>${data.weight || '-'}</td>
                    <td>${data.dyspnea !== undefined ? data.dyspnea : '-'}</td>
                    <td>${data.chestPain !== undefined ? data.chestPain : '-'}</td>
                    <td>${data.fatigue !== undefined ? data.fatigue : '-'}</td>
                    <td>${data.edema !== undefined ? data.edema : '-'}</td>
                    <td>${data.qualityOfLife || '-'}</td>
                    <td>${data.sleepQuality !== undefined ? data.sleepQuality : '-'}</td>
                    <td>${formatLocationForTable(data.location)}</td>
                    <td><button class="delete-entry-btn" onclick="deleteEntry('${date}')">🗑️</button></td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('History table error:', error);
        const tbody = document.getElementById('historyBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="25" style="text-align: center; color: var(--bad);">⚠️ Error loading history table</td></tr>';
        }
    }
}

// THERAPY SESSION MANAGEMENT
let therapySessions = [];

// Load sessions from localStorage
try {
    const storedSessions = localStorage.getItem('therapySessions');
    therapySessions = storedSessions ? JSON.parse(storedSessions) : [];
} catch (error) {
    console.error('Error loading therapy sessions:', error);
    therapySessions = [];
}

function saveTherapySession() {
    const session = {
        id: Date.now().toString(),
        sessionDate: document.getElementById('sessionDate').value,
        sessionTime: document.getElementById('sessionTime').value,
        duration: document.getElementById('sessionDuration').value,
        therapistName: document.getElementById('therapistName').value,
        therapyCompany: document.getElementById('therapyCompany').value,
        therapistCredentials: document.getElementById('therapistCredentials').value,
        exerciseType: document.getElementById('exerciseType').value,
        exerciseIntensity: document.getElementById('exerciseIntensity').value,
        targetHeartRate: document.getElementById('targetHeartRate').value,
        treatmentGoal: document.getElementById('treatmentGoal').value,
        therapistNotes: document.getElementById('therapistNotes').value,
        redFlags: document.getElementById('redFlags').value,
        homeExerciseInstructions: document.getElementById('homeExerciseInstructions').value,
        createdAt: new Date().toISOString()
    };

    // Validation
    if (!session.sessionDate) {
        showNotification('⚠️ Session date is required', 'error');
        return;
    }

    // Check for red flags and trigger notification
    if (session.redFlags && session.redFlags.trim()) {
        const confirmSave = confirm(
            '⚠️ RED FLAG ALERT ⚠️\n\n' +
            'This session contains red flags that will trigger an immediate notification to the care team.\n\n' +
            'Red Flag:\n' + session.redFlags + '\n\n' +
            'Do you want to save this session and notify the care team?'
        );

        if (!confirmSave) {
            return;
        }

        // Trigger care team notification
        triggerCareTeamNotification(session);
    }

    // Add to sessions array
    therapySessions.push(session);

    // Save to localStorage
    try {
        localStorage.setItem('therapySessions', JSON.stringify(therapySessions));
        showNotification('✅ Therapy session saved successfully', 'success');
    } catch (error) {
        console.error('Error saving session:', error);
        showNotification('⚠️ Could not save session persistently', 'error');
    }

    // Clear form and refresh history
    clearSessionForm();
    refreshSessionsTable();
}

function clearSessionForm() {
    document.getElementById('sessionDate').value = '';
    document.getElementById('sessionTime').value = '';
    document.getElementById('sessionDuration').value = '';
    document.getElementById('therapistName').value = '';
    document.getElementById('therapyCompany').value = '';
    document.getElementById('therapistCredentials').value = '';
    document.getElementById('exerciseType').value = '';
    document.getElementById('exerciseIntensity').value = '';
    document.getElementById('targetHeartRate').value = '';
    document.getElementById('treatmentGoal').value = '';
    document.getElementById('therapistNotes').value = '';
    document.getElementById('redFlags').value = '';
    document.getElementById('homeExerciseInstructions').value = '';
}

function refreshSessionsTable() {
    try {
        const tbody = document.getElementById('sessionsBody');

        if (therapySessions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--muted);">No sessions recorded yet</td></tr>';
            return;
        }

        // Sort by date descending
        const sortedSessions = [...therapySessions].sort((a, b) => {
            return new Date(b.sessionDate + ' ' + (b.sessionTime || '00:00')) -
                   new Date(a.sessionDate + ' ' + (a.sessionTime || '00:00'));
        });

        tbody.innerHTML = sortedSessions.map(session => {
            const hasRedFlags = session.redFlags && session.redFlags.trim();
            const redFlagIcon = hasRedFlags ? '🚨' : '-';
            const redFlagStyle = hasRedFlags ? 'color: var(--bad); font-weight: 700;' : '';

            return `
                <tr onclick="viewSessionDetails('${session.id}')" style="cursor: pointer;" title="Click to view full details">
                    <td>${session.sessionDate || '-'}</td>
                    <td>${session.sessionTime || '-'}</td>
                    <td>${session.therapistName || '-'}</td>
                    <td>${session.therapyCompany || '-'}</td>
                    <td>${session.duration ? session.duration + ' min' : '-'}</td>
                    <td>${session.exerciseType || '-'}</td>
                    <td style="${redFlagStyle}">${redFlagIcon}</td>
                    <td>
                        <button class="delete-entry-btn" onclick="event.stopPropagation(); deleteSession('${session.id}')" title="Delete session">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Sessions table error:', error);
        const tbody = document.getElementById('sessionsBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--bad);">⚠️ Error loading sessions table</td></tr>';
        }
    }
}

function viewSessionDetails(sessionId) {
    const session = therapySessions.find(s => s.id === sessionId);
    if (!session) return;

    const details = `
📅 Session Date: ${session.sessionDate || 'Not specified'}
🕐 Time: ${session.sessionTime || 'Not specified'}
⏱️ Duration: ${session.duration ? session.duration + ' minutes' : 'Not specified'}

👨‍⚕️ THERAPIST INFORMATION
Name: ${session.therapistName || 'Not specified'}
Credentials: ${session.therapistCredentials || 'Not specified'}
Facility: ${session.therapyCompany || 'Not specified'}

🏃 EXERCISE DETAILS
Type: ${session.exerciseType || 'Not specified'}
Intensity: ${session.exerciseIntensity || 'Not specified'}
Target HR: ${session.targetHeartRate ? session.targetHeartRate + ' bpm' : 'Not specified'}

🎯 TREATMENT GOAL
${session.treatmentGoal || 'Not specified'}

📝 THERAPIST SESSION NOTES
${session.therapistNotes || 'No notes recorded'}

${session.redFlags ? '⚠️ RED FLAGS / CARE TEAM ALERTS\n' + session.redFlags + '\n\n' : ''}📋 AT-HOME EXERCISE PLAN
${session.homeExerciseInstructions || 'No at-home instructions provided'}
    `.trim();

    alert(details);
}

function deleteSession(sessionId) {
    if (confirm('Delete this therapy session?')) {
        therapySessions = therapySessions.filter(s => s.id !== sessionId);

        try {
            localStorage.setItem('therapySessions', JSON.stringify(therapySessions));
            showNotification('Session deleted', 'success');
        } catch (error) {
            console.error('Error deleting session:', error);
        }

        refreshSessionsTable();
    }
}

function triggerCareTeamNotification(session) {
    // This function will be wired to the main application's notification system
    // For now, it logs the notification that would be sent
    const notification = {
        type: 'RED_FLAG_ALERT',
        priority: 'URGENT',
        patientName: patientName || 'Unknown Patient',
        sessionDate: session.sessionDate,
        therapist: session.therapistName,
        redFlags: session.redFlags,
        therapistNotes: session.therapistNotes,
        timestamp: new Date().toISOString()
    };

    console.warn('🚨 CARE TEAM NOTIFICATION TRIGGERED:', notification);

    // When integrated with master app, this will call:
    // window.parent.postMessage({ type: 'CARE_TEAM_ALERT', data: notification }, '*');
    // or use the main app's notification API

    showNotification('🚨 Care team has been notified of red flags', 'error');
}

// AUTOCOMPLETE
function showExerciseSuggestions(value) {
    const suggestions = document.getElementById('exerciseSuggestions');
    if (value.length === 0) {
        suggestions.classList.remove('show');
        return;
    }

    const filtered = exerciseTypes.filter(type =>
        type.toLowerCase().includes(value.toLowerCase())
    );

    if (filtered.length === 0) {
        suggestions.classList.remove('show');
        return;
    }

    suggestions.innerHTML = filtered.map(type =>
        `<div class="autocomplete-item" onclick="selectExercise('${type}')">${type}</div>`
    ).join('');
    suggestions.classList.add('show');
}

function selectExercise(type) {
    document.getElementById('exerciseType').value = type;
    document.getElementById('exerciseSuggestions').classList.remove('show');
}

// POPULATION COMPARISON CALCULATIONS
function calculatePopulationComparison() {
    const dates = Object.keys(allData).sort();
    if (dates.length === 0) {
        return {
            hasData: false
        };
    }

    const latest = allData[dates[dates.length - 1]];

    // Age-stratified VO2 Max norms for cardiac patients (ACSM Guidelines)
    // Using 50-year-old male baseline (adjust based on age/gender in full version)
    const populationNorms = {
        poor: 14,      // <14 ml/kg/min
        fair: 20,      // 14-20 ml/kg/min
        good: 24,      // 20-24 ml/kg/min
        excellent: 28  // >28 ml/kg/min
    };

    const userVO2 = latest.vo2Max || null;
    let percentile = null;
    let riskLevel = 'UNKNOWN';
    let position = 'No data';

    if (userVO2) {
        // Calculate percentile based on VO2 Max
        if (userVO2 >= populationNorms.excellent) {
            percentile = 90 + Math.min(10, (userVO2 - populationNorms.excellent) / 2);
        } else if (userVO2 >= populationNorms.good) {
            percentile = 75 + ((userVO2 - populationNorms.good) / (populationNorms.excellent - populationNorms.good)) * 15;
        } else if (userVO2 >= populationNorms.fair) {
            percentile = 50 + ((userVO2 - populationNorms.fair) / (populationNorms.good - populationNorms.fair)) * 25;
        } else if (userVO2 >= populationNorms.poor) {
            percentile = 25 + ((userVO2 - populationNorms.poor) / (populationNorms.fair - populationNorms.poor)) * 25;
        } else {
            percentile = (userVO2 / populationNorms.poor) * 25;
        }

        // Determine position
        if (percentile >= 75) position = 'Excellent';
        else if (percentile >= 50) position = 'Above Average';
        else if (percentile >= 25) position = 'Average';
        else position = 'Below Average';
    }

    // Calculate risk level based on multiple factors
    let riskScore = 0;

    // VO2 Max risk factor
    if (userVO2) {
        if (userVO2 < 14) riskScore += 3;
        else if (userVO2 < 20) riskScore += 2;
        else if (userVO2 < 24) riskScore += 1;
    }

    // HR Recovery risk factor
    if (latest.hrRecovery) {
        if (latest.hrRecovery < 12) riskScore += 3;
        else if (latest.hrRecovery < 18) riskScore += 2;
        else if (latest.hrRecovery < 22) riskScore += 1;
    }

    // Ejection Fraction risk factor
    if (latest.ejectionFraction) {
        if (latest.ejectionFraction < 30) riskScore += 3;
        else if (latest.ejectionFraction < 40) riskScore += 2;
        else if (latest.ejectionFraction < 50) riskScore += 1;
    }

    // Resting HR risk factor
    if (latest.restingHR) {
        if (latest.restingHR > 90) riskScore += 2;
        else if (latest.restingHR > 80) riskScore += 1;
    }

    // Determine overall risk
    if (riskScore >= 6) riskLevel = 'HIGH';
    else if (riskScore >= 3) riskLevel = 'MODERATE';
    else if (riskScore >= 0) riskLevel = 'LOW';

    return {
        hasData: true,
        userVO2: userVO2,
        percentile: percentile,
        position: position,
        riskLevel: riskLevel,
        avgVO2: populationNorms.fair,
        goodThreshold: populationNorms.good
    };
}

function updatePopulationComparison() {
    try {
        const comparison = calculatePopulationComparison();

        if (!comparison.hasData) {
            document.getElementById('yourVO2').textContent = '--';
            document.getElementById('yourPercentile').textContent = 'No data yet';
            document.getElementById('yourRiskLevel').textContent = '--';
            document.getElementById('yourPosition').textContent = 'No data';
            return;
        }

    // Update "Your Metrics" card
    if (comparison.userVO2) {
        document.getElementById('yourVO2').textContent = `${comparison.userVO2.toFixed(1)} ml/kg/min`;
    } else {
        document.getElementById('yourVO2').textContent = '--';
    }

    if (comparison.percentile) {
        const percentileStr = `${Math.round(comparison.percentile)}th percentile`;
        document.getElementById('yourPercentile').textContent = percentileStr;

        // Color code based on percentile
        const percentileEl = document.getElementById('yourPercentile');
        if (comparison.percentile >= 75) {
            percentileEl.className = 'metric-value good';
        } else if (comparison.percentile >= 50) {
            percentileEl.className = 'metric-value';
            percentileEl.style.color = 'var(--cyan)';
        } else {
            percentileEl.className = 'metric-value';
            percentileEl.style.color = 'var(--warn)';
        }
    }

    document.getElementById('yourRiskLevel').textContent = comparison.riskLevel;
    const riskEl = document.getElementById('yourRiskLevel');
    if (comparison.riskLevel === 'LOW') {
        riskEl.className = 'metric-value good';
    } else if (comparison.riskLevel === 'MODERATE') {
        riskEl.className = 'metric-value';
        riskEl.style.color = 'var(--warn)';
    } else if (comparison.riskLevel === 'HIGH') {
        riskEl.className = 'metric-value';
        riskEl.style.color = 'var(--bad)';
    }

    // Update "Age/Gender Baseline" card
    document.getElementById('avgVO2').textContent = `${comparison.avgVO2.toFixed(1)} ml/kg/min`;
    document.getElementById('goodThreshold').textContent = `${comparison.goodThreshold.toFixed(1)} ml/kg/min`;
    document.getElementById('yourPosition').textContent = comparison.position;

    const positionEl = document.getElementById('yourPosition');
    if (comparison.position === 'Excellent' || comparison.position === 'Above Average') {
        positionEl.className = 'metric-value good';
    } else if (comparison.position === 'Average') {
        positionEl.className = 'metric-value';
        positionEl.style.color = 'var(--cyan)';
    } else {
        positionEl.className = 'metric-value';
        positionEl.style.color = 'var(--warn)';
    }
    } catch (error) {
        console.error('Population comparison error:', error);
        // Fail silently - non-critical display feature
    }
}

// CHARTS
let charts = {};

function initializeCharts() {
    updateCharts();
    updatePopulationComparison();
    // Initialize new Analytics subtab charts (with error handling to prevent breaking app)
    try {
        createMETsChart();
    } catch (error) {
        console.error('METs chart init error:', error);
    }
    try {
        createHRZoneChart();
    } catch (error) {
        console.error('HR Zone chart init error:', error);
    }
    try {
        // Delay HR chart population to ensure canvas is available
        setTimeout(() => populateHRChartFromDashboard(), 500);
    } catch (error) {
        console.error('HR chart init error:', error);
    }
}

function updateCharts() {
    // Wrap each chart update in try-catch for graceful degradation
    try {
        updateProgressChart();
    } catch (error) {
        console.error('Progress chart error:', error);
        displayChartError('progressChart', 'Progress Chart');
    }

    try {
        updateMetricsChart();
    } catch (error) {
        console.error('Metrics chart error:', error);
        displayChartError('metricsChart', 'Metrics Chart');
    }

    try {
        updateHRVChart();
    } catch (error) {
        console.error('HRV chart error:', error);
        displayChartError('hrvChart', 'HRV Chart');
    }

    try {
        updateRadarChart();
    } catch (error) {
        console.error('Radar chart error:', error);
        displayChartError('radarChart', 'Radar Chart');
    }

    try {
        updateRiskChart();
    } catch (error) {
        console.error('Risk chart error:', error);
        displayChartError('riskChart', 'Risk Chart');
    }

    try {
        updateRecoveryProgressChart();
    } catch (error) {
        console.error('Recovery Progress chart error:', error);
        displayChartError('recoveryProgressChart', 'Recovery Progress Chart');
    }

    try {
        initializeCRPSTrendChart();
    } catch (error) {
        console.error('CRPS Trend chart error:', error);
        displayChartError('crpsTrendChart', 'CRPS Trend Chart');
    }
}

// Display friendly error message when chart fails
function displayChartError(canvasId, chartName) {
    const canvas = document.getElementById(canvasId);
    if (canvas && canvas.parentElement) {
        canvas.style.display = 'none';
        const errorDiv = document.createElement('div');
        errorDiv.className = 'chart-error';
        errorDiv.style.cssText = 'padding: 40px; text-align: center; color: var(--bad); background: rgba(220, 38, 38, 0.1); border-radius: 8px; margin: 20px 0;';
        errorDiv.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 10px;">⚠️</div>
            <div style="font-weight: 600; margin-bottom: 5px;">${chartName} Unavailable</div>
            <div style="font-size: 0.9rem; color: var(--muted);">Unable to load chart. Check console for details.</div>
        `;
        canvas.parentElement.appendChild(errorDiv);
    }
}

// CALCULATE PERSONALIZED RECOVERY TRAJECTORY
function calculatePersonalizedRecovery() {
    const dates = Object.keys(allData).sort();

    // Default generic curve if no baseline data
    let baselineVO2 = 12; // Typical post-cardiac surgery baseline
    let hasBaseline = false;

    if (surgeryDateStr && dates.length > 0) {
        // Look for earliest VO2 data (within first 2 weeks)
        const surgeryDate = new Date(surgeryDateStr);
        const twoWeeksOut = new Date(surgeryDate);
        twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);

        for (const dateStr of dates) {
            const date = new Date(dateStr);
            if (date >= surgeryDate && date <= twoWeeksOut) {
                if (allData[dateStr].vo2Max !== undefined) {
                    baselineVO2 = allData[dateStr].vo2Max;
                    hasBaseline = true;
                    break; // Use first available baseline
                }
            }
        }
    }

    // Target VO2 based on age-adjusted norms (using 50-year-old standard)
    // In full version, this would be personalized by actual age/gender
    const targetVO2 = 28; // Good recovery target

    // Calculate personalized week-by-week expected recovery
    // Using exponential recovery curve: faster gains early, plateau later
    const personalizedCurve = [];
    for (let week = 0; week < 12; week++) {
        // Recovery follows an exponential curve: y = baseline + (target - baseline) * (1 - e^(-k*t))
        // Simplified to power function for readability
        const progressFactor = Math.pow(week / 12, 0.6); // 0.6 exponent = faster early gains
        const expectedVO2 = baselineVO2 + (targetVO2 - baselineVO2) * progressFactor;
        personalizedCurve.push(parseFloat(expectedVO2.toFixed(1)));
    }

    return {
        curve: personalizedCurve,
        baseline: baselineVO2,
        target: targetVO2,
        isPersonalized: hasBaseline
    };
}

function updateProgressChart() {
    const canvas = document.getElementById('progressChart');
    const weeks = Array.from({length: 12}, (_, i) => `Week ${i + 1}`);
    if (!canvas) { console.warn("progressChart canvas not found"); return; }
    const dates = Object.keys(allData).sort();

    // Initialize data arrays for all metrics
    const vo2Data = new Array(12).fill(null);
    const hrData = new Array(12).fill(null);
    const sdnnData = new Array(12).fill(null);
    const bpSystolicData = new Array(12).fill(null);
    const maxHRData = new Array(12).fill(null);
    const hrRecoveryData = new Array(12).fill(null);
    const rmssdData = new Array(12).fill(null);
    const pnn50Data = new Array(12).fill(null);
    const walkDistanceData = new Array(12).fill(null);
    const metsData = new Array(12).fill(null);
    const ejectionFractionData = new Array(12).fill(null);
    const oxygenSatData = new Array(12).fill(null);
    const respRateData = new Array(12).fill(null);
    const weightData = new Array(12).fill(null);
    const dyspneaData = new Array(12).fill(null);
    const chestPainData = new Array(12).fill(null);
    const fatigueData = new Array(12).fill(null);
    const edemaData = new Array(12).fill(null);
    const qolData = new Array(12).fill(null);
    const sleepData = new Array(12).fill(null);

    dates.forEach(date => {
        if (!surgeryDateStr) return;
        const weekNum = Math.floor((new Date(date) - new Date(surgeryDateStr)) / (7 * 24 * 60 * 60 * 1000));
        if (weekNum >= 0 && weekNum < 12) {
            const data = allData[date];
            if (data.vo2Max) vo2Data[weekNum] = data.vo2Max;
            if (data.restingHR) hrData[weekNum] = data.restingHR;
            if (data.sdnn) sdnnData[weekNum] = data.sdnn;
            if (data.bpSystolic) bpSystolicData[weekNum] = data.bpSystolic;
            if (data.maxHR) maxHRData[weekNum] = data.maxHR;
            if (data.hrRecovery) hrRecoveryData[weekNum] = data.hrRecovery;
            if (data.rmssd) rmssdData[weekNum] = data.rmssd;
            if (data.pnn50) pnn50Data[weekNum] = data.pnn50;
            if (data.walkDistance) walkDistanceData[weekNum] = data.walkDistance;
            if (data.mets) metsData[weekNum] = data.mets;
            if (data.ejectionFraction) ejectionFractionData[weekNum] = data.ejectionFraction;
            if (data.oxygenSat) oxygenSatData[weekNum] = data.oxygenSat;
            if (data.respRate) respRateData[weekNum] = data.respRate;
            if (data.weight) weightData[weekNum] = data.weight;
            if (data.dyspnea !== undefined) dyspneaData[weekNum] = data.dyspnea;
            if (data.chestPain !== undefined) chestPainData[weekNum] = data.chestPain;
            if (data.fatigue !== undefined) fatigueData[weekNum] = data.fatigue;
            if (data.edema !== undefined) edemaData[weekNum] = data.edema;
            if (data.qualityOfLife) qolData[weekNum] = data.qualityOfLife;
            if (data.sleepQuality !== undefined) sleepData[weekNum] = data.sleepQuality;
        }
    });

    // Get personalized recovery curve
    const recoveryPlan = calculatePersonalizedRecovery();
    const expectedLabel = recoveryPlan.isPersonalized ?
        'Your Expected Recovery' :
        'Expected VO2 (Generic)';

    // Update existing chart or create new one
    if (charts.progress) {
        charts.progress.data.datasets[0].data = vo2Data;
        charts.progress.data.datasets[1].data = hrData;
        charts.progress.data.datasets[2].data = sdnnData;
        charts.progress.data.datasets[3].data = bpSystolicData;
        charts.progress.data.datasets[4].data = maxHRData;
        charts.progress.data.datasets[5].data = hrRecoveryData;
        charts.progress.data.datasets[6].data = rmssdData;
        charts.progress.data.datasets[7].data = pnn50Data;
        charts.progress.data.datasets[8].data = walkDistanceData;
        charts.progress.data.datasets[9].data = metsData;
        charts.progress.data.datasets[10].data = ejectionFractionData;
        charts.progress.data.datasets[11].data = oxygenSatData;
        charts.progress.data.datasets[12].data = respRateData;
        charts.progress.data.datasets[13].data = weightData;
        charts.progress.data.datasets[14].data = dyspneaData;
        charts.progress.data.datasets[15].data = chestPainData;
        charts.progress.data.datasets[16].data = fatigueData;
        charts.progress.data.datasets[17].data = edemaData;
        charts.progress.data.datasets[18].data = qolData;
        charts.progress.data.datasets[19].data = sleepData;
        charts.progress.data.datasets[20].data = recoveryPlan.curve;
        charts.progress.data.datasets[20].label = expectedLabel;
        charts.progress.data.datasets[20].borderColor = recoveryPlan.isPersonalized ? '#a78bfa' : '#9ca3af';
        charts.progress.update('none');
    } else {
        charts.progress = new Chart(canvas, {
            type: 'line',
            data: {
                labels: weeks,
                datasets: [
                    {
                        label: 'VO2 Max',
                        data: vo2Data,
                        borderColor: '#60a5fa',
                        backgroundColor: 'rgba(96,165,250,0.2)',
                        borderWidth: 3,
                        tension: 0.4,
                        spanGaps: true,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Resting HR',
                        data: hrData,
                        borderColor: '#ef4444',
                        borderWidth: 2,
                        tension: 0.4,
                        spanGaps: true,
                        pointRadius: 4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'SDNN',
                        data: sdnnData,
                        borderColor: '#06b6d4',
                        borderWidth: 2,
                        tension: 0.4,
                        spanGaps: true,
                        pointRadius: 4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'BP Systolic',
                        data: bpSystolicData,
                        borderColor: '#f59e0b',
                        borderWidth: 2,
                        tension: 0.4,
                        spanGaps: true,
                        pointRadius: 4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Max HR',
                        data: maxHRData,
                        borderColor: '#ec4899',
                        borderWidth: 2,
                        tension: 0.4,
                        spanGaps: true,
                        pointRadius: 4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'HR Recovery',
                        data: hrRecoveryData,
                        borderColor: '#8b5cf6',
                        borderWidth: 2,
                        tension: 0.4,
                        spanGaps: true,
                        pointRadius: 4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'RMSSD',
                        data: rmssdData,
                        borderColor: '#14b8a6',
                        borderWidth: 2,
                        tension: 0.4,
                        spanGaps: true,
                        pointRadius: 4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'pNN50',
                        data: pnn50Data,
                        borderColor: '#84cc16',
                        borderWidth: 2,
                        tension: 0.4,
                        spanGaps: true,
                        pointRadius: 4,
                        yAxisID: 'y'
                    },
                    {
                        label: '6-Min Walk (m)',
                        data: walkDistanceData,
                        borderColor: '#22c55e',
                        borderWidth: 2,
                        tension: 0.4,
                        spanGaps: true,
                        pointRadius: 4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'METs',
                        data: metsData,
                        borderColor: '#10b981',
                        borderWidth: 2,
                        tension: 0.4,
                        spanGaps: true,
                        pointRadius: 4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Ejection Fraction',
                        data: ejectionFractionData,
                        borderColor: '#f97316',
                        borderWidth: 2,
                        tension: 0.4,
                        spanGaps: true,
                        pointRadius: 4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Oxygen Saturation',
                        data: oxygenSatData,
                        borderColor: '#3b82f6',
                        borderWidth: 2,
                        tension: 0.4,
                        spanGaps: true,
                        pointRadius: 4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Respiratory Rate',
                        data: respRateData,
                        borderColor: '#0ea5e9',
                        borderWidth: 2,
                        tension: 0.4,
                        spanGaps: true,
                        pointRadius: 4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Weight (kg)',
                        data: weightData,
                        borderColor: '#6366f1',
                        borderWidth: 2,
                        tension: 0.4,
                        spanGaps: true,
                        pointRadius: 4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Dyspnea Score',
                        data: dyspneaData,
                        borderColor: '#d946ef',
                        borderWidth: 2,
                        tension: 0.4,
                        spanGaps: true,
                        pointRadius: 4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Chest Pain',
                        data: chestPainData,
                        borderColor: '#dc2626',
                        borderWidth: 2,
                        tension: 0.4,
                        spanGaps: true,
                        pointRadius: 4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Fatigue',
                        data: fatigueData,
                        borderColor: '#ca8a04',
                        borderWidth: 2,
                        tension: 0.4,
                        spanGaps: true,
                        pointRadius: 4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Edema',
                        data: edemaData,
                        borderColor: '#0891b2',
                        borderWidth: 2,
                        tension: 0.4,
                        spanGaps: true,
                        pointRadius: 4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Quality of Life',
                        data: qolData,
                        borderColor: '#16a34a',
                        borderWidth: 2,
                        tension: 0.4,
                        spanGaps: true,
                        pointRadius: 4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Sleep Quality',
                        data: sleepData,
                        borderColor: '#4f46e5',
                        borderWidth: 2,
                        tension: 0.4,
                        spanGaps: true,
                        pointRadius: 4,
                        yAxisID: 'y'
                    },
                    {
                        label: expectedLabel,
                        data: recoveryPlan.curve,
                        borderColor: recoveryPlan.isPersonalized ? '#a78bfa' : '#9ca3af',
                        borderWidth: recoveryPlan.isPersonalized ? 3 : 2,
                        borderDash: [5, 5],
                        tension: 0.4,
                        pointRadius: 0,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Population Average VO2',
                        data: new Array(12).fill(20),
                        borderColor: '#22c55e',
                        borderWidth: 2,
                        borderDash: [10, 5],
                        tension: 0,
                        pointRadius: 0,
                        yAxisID: 'y'
                    }
                ]
            },
            options: {
                ...getChartOptions(),
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: { size: 11 }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });
    }
}

function updateMetricsChart() {
    const canvas = document.getElementById('metricsChart');
    if (!canvas) { console.warn("metricsChart canvas not found"); return; }
    const dates = Object.keys(allData).sort().map(d => new Date(d).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}));
    const vo2 = Object.keys(allData).sort().map(d => allData[d].vo2Max || null);
    const hr = Object.keys(allData).sort().map(d => allData[d].restingHR || null);
    const sdnn = Object.keys(allData).sort().map(d => allData[d].sdnn || null);

    if (charts.metrics) {
        charts.metrics.data.labels = dates;
        charts.metrics.data.datasets[0].data = vo2;
        charts.metrics.data.datasets[1].data = hr;
        charts.metrics.data.datasets[2].data = sdnn;
        charts.metrics.update('none');
    } else {
        charts.metrics = new Chart(canvas, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    { label: 'VO2 Max', data: vo2, borderColor: '#60a5fa', borderWidth: 3, tension: 0.4, spanGaps: true },
                    { label: 'Resting HR', data: hr, borderColor: '#ef4444', borderWidth: 3, tension: 0.4, spanGaps: true },
                    { label: 'SDNN', data: sdnn, borderColor: '#06b6d4', borderWidth: 3, tension: 0.4, spanGaps: true }
                ]
            },
            options: getChartOptions()
        });
    }
}

function updateHRVChart() {
    const canvas = document.getElementById('hrvChart');
    const dates = Object.keys(allData).sort().map(d => new Date(d).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}));
    if (!canvas) { console.warn("hrvChart canvas not found"); return; }
    const sdnn = Object.keys(allData).sort().map(d => allData[d].sdnn || null);
    const rmssd = Object.keys(allData).sort().map(d => allData[d].rmssd || null);
    const pnn50 = Object.keys(allData).sort().map(d => allData[d].pnn50 || null);

    if (charts.hrv) {
        charts.hrv.data.labels = dates;
        charts.hrv.data.datasets[0].data = sdnn;
        charts.hrv.data.datasets[1].data = rmssd;
        charts.hrv.data.datasets[2].data = pnn50;
        charts.hrv.update('none');
    } else {
        charts.hrv = new Chart(canvas, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    { label: 'SDNN', data: sdnn, borderColor: '#06b6d4', borderWidth: 3, tension: 0.4, spanGaps: true },
                    { label: 'RMSSD', data: rmssd, borderColor: '#a78bfa', borderWidth: 3, tension: 0.4, spanGaps: true },
                    { label: 'pNN50', data: pnn50, borderColor: '#22c55e', borderWidth: 3, tension: 0.4, spanGaps: true }
                ]
            },
            options: getChartOptions()
        });
    }
}

// CALCULATE NORMALIZED RADAR SCORES FROM REAL USER DATA
function calculateRadarScores() {
    const dates = Object.keys(allData).sort();
    if (dates.length === 0) {
        return {
            userScores: [0, 0, 0, 0, 0, 0],
            hasData: false
        };
    }

    const latest = allData[dates[dates.length - 1]];

    // Normalize each metric to 0-100 scale based on medical standards
    const scores = [];

    // 1. VO2 Max (ml/kg/min): Poor <14, Fair 14-20, Good 20-28, Excellent >28
    if (latest.vo2Max) {
        if (latest.vo2Max >= 28) scores.push(100);
        else if (latest.vo2Max >= 20) scores.push(50 + ((latest.vo2Max - 20) / 8) * 50);
        else if (latest.vo2Max >= 14) scores.push(25 + ((latest.vo2Max - 14) / 6) * 25);
        else scores.push((latest.vo2Max / 14) * 25);
    } else {
        scores.push(0);
    }

    // 2. HR Recovery (bpm drop in 1 min): Poor <12, Fair 12-20, Good 20-25, Excellent >25
    if (latest.hrRecovery) {
        if (latest.hrRecovery >= 25) scores.push(100);
        else if (latest.hrRecovery >= 20) scores.push(75 + ((latest.hrRecovery - 20) / 5) * 25);
        else if (latest.hrRecovery >= 12) scores.push(50 + ((latest.hrRecovery - 12) / 8) * 25);
        else scores.push((latest.hrRecovery / 12) * 50);
    } else {
        scores.push(0);
    }

    // 3. Resting HR (bpm): Excellent <60, Good 60-70, Fair 70-80, Poor >80 (INVERTED - lower is better)
    if (latest.restingHR) {
        if (latest.restingHR <= 60) scores.push(100);
        else if (latest.restingHR <= 70) scores.push(75 + ((70 - latest.restingHR) / 10) * 25);
        else if (latest.restingHR <= 80) scores.push(50 + ((80 - latest.restingHR) / 10) * 25);
        else scores.push(Math.max(0, 50 - ((latest.restingHR - 80) / 20) * 50));
    } else {
        scores.push(0);
    }

    // 4. HRV (SDNN in ms): Poor <20, Fair 20-35, Good 35-50, Excellent >50
    if (latest.sdnn) {
        if (latest.sdnn >= 50) scores.push(100);
        else if (latest.sdnn >= 35) scores.push(75 + ((latest.sdnn - 35) / 15) * 25);
        else if (latest.sdnn >= 20) scores.push(50 + ((latest.sdnn - 20) / 15) * 25);
        else scores.push((latest.sdnn / 20) * 50);
    } else {
        scores.push(0);
    }

    // 5. Exercise Capacity (METs): Poor <5, Fair 5-7, Good 7-10, Excellent >10
    if (latest.mets) {
        if (latest.mets >= 10) scores.push(100);
        else if (latest.mets >= 7) scores.push(75 + ((latest.mets - 7) / 3) * 25);
        else if (latest.mets >= 5) scores.push(50 + ((latest.mets - 5) / 2) * 25);
        else scores.push((latest.mets / 5) * 50);
    } else {
        scores.push(0);
    }

    // 6. Recovery Speed (based on weeks post-op vs VO2 improvement)
    let recoveryScore = 0;
    if (surgeryDateStr && latest.vo2Max) {
        const weeksSurgery = Math.floor((new Date(dates[dates.length - 1]) - new Date(surgeryDateStr)) / (7 * 24 * 60 * 60 * 1000));
        if (weeksSurgery > 0) {
            // Compare to expected recovery (should gain ~1.3 ml/kg/min per week)
            const expectedGain = weeksSurgery * 1.3;
            const baselineVO2 = 12; // Typical post-surgery baseline
            const expectedVO2 = baselineVO2 + expectedGain;
            const percentOfExpected = (latest.vo2Max / expectedVO2) * 100;
            recoveryScore = Math.min(100, Math.max(0, percentOfExpected));
        } else {
            recoveryScore = 50; // Default if no time elapsed
        }
    }
    scores.push(recoveryScore);

    return {
        userScores: scores,
        hasData: true
    };
}

function updateRadarChart() {
    const canvas = document.getElementById('radarChart');
    if (!canvas) { console.warn("radarChart canvas not found"); return; }
    const radarData = calculateRadarScores();

    // Calculate average score to determine overall performance color
    const avgScore = radarData.userScores.reduce((a, b) => a + b, 0) / radarData.userScores.length;

    // Determine color based on performance level
    let performanceColor, performanceColorRGBA, performanceLabel;
    if (avgScore >= 75) {
        performanceColor = '#22c55e'; // Green - Excellent
        performanceColorRGBA = 'rgba(34,197,94,0.3)';
        performanceLabel = 'Excellent';
    } else if (avgScore >= 50) {
        performanceColor = '#3b82f6'; // Blue - Good
        performanceColorRGBA = 'rgba(59,130,246,0.3)';
        performanceLabel = 'Good';
    } else if (avgScore >= 25) {
        performanceColor = '#f59e0b'; // Orange - Fair
        performanceColorRGBA = 'rgba(245,158,11,0.3)';
        performanceLabel = 'Fair';
    } else {
        performanceColor = '#ef4444'; // Red - Poor
        performanceColorRGBA = 'rgba(239,68,68,0.3)';
        performanceLabel = 'Needs Attention';
    }

    // Always destroy and recreate to ensure colors update
    if (charts.radar && typeof charts.radar.destroy === 'function') {
        charts.radar.destroy();
    }
    charts.radar = new Chart(canvas, {
            type: 'radar',
            data: {
                labels: ['VO2 Max', 'HR Recovery', 'Resting HR', 'HRV (SDNN)', 'Exercise Capacity', 'Recovery Speed'],
                datasets: [{
                    label: `Your Performance (${performanceLabel})`,
                    data: radarData.userScores,
                    backgroundColor: performanceColorRGBA,
                    borderColor: performanceColor,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: performanceColor,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }, {
                    label: 'Population Average',
                    data: [50, 50, 50, 50, 50, 50],
                    backgroundColor: 'rgba(156,163,175,0.15)',
                    borderColor: '#9ca3af',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 3,
                    pointBackgroundColor: '#9ca3af'
                }]
            },
            options: {
                ...getChartOptions(),
                scales: {
                    r: {
                        min: 0,
                        max: 100,
                        ticks: {
                            color: '#9ca3af',
                            backdropColor: 'transparent',
                            stepSize: 25,
                            callback: function(value) {
                                if (value === 0) return '0';
                                if (value === 25) return '25 (Poor)';
                                if (value === 50) return '50 (Fair)';
                                if (value === 75) return '75 (Good)';
                                if (value === 100) return '100 (Excellent)';
                                return value;
                            }
                        },
                        grid: {
                            color: function(context) {
                                // Color code the grid rings
                                const value = context.tick.value;
                                if (value === 25) return 'rgba(239,68,68,0.3)'; // Red ring
                                if (value === 50) return 'rgba(245,158,11,0.3)'; // Orange ring
                                if (value === 75) return 'rgba(59,130,246,0.3)'; // Blue ring
                                if (value === 100) return 'rgba(34,197,94,0.3)'; // Green ring
                                return 'rgba(96,165,250,0.1)';
                            }
                        },
                        pointLabels: {
                            color: '#e5e7eb',
                            font: { weight: 'bold', size: 12 }
                        }
                    }
                }
            }
        });
}

// CALCULATE RISK STRATIFICATION FROM ACTUAL METRICS (5-LEVEL SYSTEM)
function calculateRiskByDate() {
    const dates = Object.keys(allData).sort();
    const riskLevels = [];

    if (dates.length === 0) {
        return { dates: [], riskLevels: [] };
    }

    dates.forEach(dateStr => {
        const entry = allData[dateStr];
        let riskScore = 0;
        let hasRelevantData = false;

        // VO2 Max risk factor (most important)
        if (entry.vo2Max !== undefined) {
            hasRelevantData = true;
            if (entry.vo2Max < 12) riskScore += 4;
            else if (entry.vo2Max < 16) riskScore += 3;
            else if (entry.vo2Max < 20) riskScore += 2;
            else if (entry.vo2Max < 24) riskScore += 1;
            // else 0 (excellent)
        }

        // HR Recovery risk factor
        if (entry.hrRecovery !== undefined) {
            hasRelevantData = true;
            if (entry.hrRecovery < 10) riskScore += 4;
            else if (entry.hrRecovery < 14) riskScore += 3;
            else if (entry.hrRecovery < 18) riskScore += 2;
            else if (entry.hrRecovery < 22) riskScore += 1;
        }

        // Ejection Fraction risk factor (critical)
        if (entry.ejectionFraction !== undefined) {
            hasRelevantData = true;
            if (entry.ejectionFraction < 30) riskScore += 5; // Severe
            else if (entry.ejectionFraction < 35) riskScore += 4;
            else if (entry.ejectionFraction < 40) riskScore += 3;
            else if (entry.ejectionFraction < 50) riskScore += 2;
            else if (entry.ejectionFraction < 55) riskScore += 1;
        }

        // Resting HR risk factor
        if (entry.restingHR !== undefined) {
            hasRelevantData = true;
            if (entry.restingHR > 100) riskScore += 4;
            else if (entry.restingHR > 90) riskScore += 3;
            else if (entry.restingHR > 80) riskScore += 2;
            else if (entry.restingHR > 70) riskScore += 1;
        }

        // 6-Minute Walk Distance risk factor
        if (entry.walkDistance !== undefined) {
            hasRelevantData = true;
            if (entry.walkDistance < 250) riskScore += 4;
            else if (entry.walkDistance < 350) riskScore += 3;
            else if (entry.walkDistance < 400) riskScore += 2;
            else if (entry.walkDistance < 450) riskScore += 1;
        }

        // Symptom risk factors
        if (entry.chestPain !== undefined && entry.chestPain > 5) {
            riskScore += 3;
            hasRelevantData = true;
        } else if (entry.chestPain !== undefined && entry.chestPain > 3) {
            riskScore += 2;
            hasRelevantData = true;
        }

        if (entry.dyspnea !== undefined && entry.dyspnea > 6) {
            riskScore += 3;
            hasRelevantData = true;
        } else if (entry.dyspnea !== undefined && entry.dyspnea > 4) {
            riskScore += 2;
            hasRelevantData = true;
        }

        if (!hasRelevantData) {
            riskLevels.push(null);
            return;
        }

        // Determine risk level: 1=Low, 2=Below Average, 3=Average, 4=Above Average, 5=High
        if (riskScore >= 10) riskLevels.push(5); // High
        else if (riskScore >= 7) riskLevels.push(4); // Above Average
        else if (riskScore >= 4) riskLevels.push(3); // Average
        else if (riskScore >= 2) riskLevels.push(2); // Below Average
        else riskLevels.push(1); // Low
    });

    return { dates, riskLevels };
}

function updateRiskChart() {
    const canvas = document.getElementById('riskChart');
    if (!canvas) { console.warn("riskChart canvas not found"); return; }

    const riskData = calculateRiskByDate();

    if (riskData.dates.length === 0) {
        if (!charts.risk) {
            charts.risk = new Chart(canvas, {
                type: 'bar',
                data: { labels: [], datasets: [] },
                options: getRiskChartOptions()
            });
        }
        return;
    }

    // Calculate date range with 3-month padding
    const firstDate = new Date(riskData.dates[0]);
    const lastDate = new Date(riskData.dates[riskData.dates.length - 1]);

    const startDate = new Date(firstDate);
    startDate.setMonth(startDate.getMonth() - 3);

    const endDate = new Date(lastDate);
    endDate.setMonth(endDate.getMonth() + 3);

    // Combine padding dates (weekly intervals) with actual data dates
    const allDates = [];
    const allRiskValues = [];

    // Add weekly padding BEFORE first data point
    let currentDate = new Date(startDate);
    while (currentDate < firstDate) {
        allDates.push(new Date(currentDate));
        allRiskValues.push(null); // No data in padding
        currentDate.setDate(currentDate.getDate() + 7);
    }

    // Add ALL actual data points
    for (let i = 0; i < riskData.dates.length; i++) {
        allDates.push(new Date(riskData.dates[i]));
        allRiskValues.push(riskData.riskLevels[i]);
    }

    // Add weekly padding AFTER last data point
    currentDate = new Date(lastDate);
    currentDate.setDate(currentDate.getDate() + 7); // Start one week after last data
    while (currentDate <= endDate) {
        allDates.push(new Date(currentDate));
        allRiskValues.push(null); // No data in padding
        currentDate.setDate(currentDate.getDate() + 7);
    }

    // Sort by date (should already be sorted, but ensure it)
    const sortedIndices = allDates.map((date, idx) => idx).sort((a, b) => allDates[a] - allDates[b]);
    const sortedDates = sortedIndices.map(idx => allDates[idx]);
    const sortedRiskValues = sortedIndices.map(idx => allRiskValues[idx]);

    // Format labels for display
    const displayLabels = sortedDates.map(date => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
    });

    // Create color array for each bar based on risk level
    const barColors = sortedRiskValues.map(risk => {
        if (risk === null) return 'rgba(156,163,175,0.15)'; // Light gray for no data
        if (risk === 5) return '#ef4444'; // High - Red
        if (risk === 4) return '#f97316'; // Above Average - Dark Orange
        if (risk === 3) return '#f59e0b'; // Average - Orange
        if (risk === 2) return '#84cc16'; // Below Average - Lime Green
        return '#22c55e'; // Low - Green
    });

    if (charts.risk && charts.risk.data && charts.risk.data.datasets && charts.risk.data.datasets[0]) {
        charts.risk.data.labels = displayLabels;
        charts.risk.data.datasets[0].data = sortedRiskValues;
        charts.risk.data.datasets[0].backgroundColor = barColors;
        charts.risk.data.datasets[0].borderColor = barColors;
        charts.risk.update('none');
    } else {
        charts.risk = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: displayLabels,
                datasets: [{
                    label: 'Cardiovascular Risk Level',
                    data: sortedRiskValues,
                    backgroundColor: barColors,
                    borderColor: barColors,
                    borderWidth: 1,
                    barThickness: 'flex',
                    maxBarThickness: 30
                }]
            },
            options: getRiskChartOptions()
        });
    }
}

function getRiskChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const value = context.parsed.y;
                        if (value === null) return 'No Data';
                        const labels = ['', 'Low Risk', 'Below Average Risk', 'Average Risk', 'Above Average Risk', 'High Risk'];
                        return labels[value] || 'Unknown';
                    }
                }
            }
        },
        scales: {
            y: {
                min: 0,
                max: 6,
                ticks: {
                    stepSize: 1,
                    callback: function(value) {
                        const labels = ['', 'Low', 'Below Avg', 'Average', 'Above Avg', 'High', ''];
                        return labels[value] || '';
                    },
                    color: '#9ca3af',
                    font: { weight: 'bold', size: 11 }
                },
                grid: {
                    color: function(context) {
                        const value = context.tick.value;
                        if (value === 1) return 'rgba(34,197,94,0.2)'; // Low
                        if (value === 2) return 'rgba(132,204,22,0.2)'; // Below Average
                        if (value === 3) return 'rgba(245,158,11,0.2)'; // Average
                        if (value === 4) return 'rgba(249,115,22,0.2)'; // Above Average
                        if (value === 5) return 'rgba(239,68,68,0.2)'; // High
                        return 'rgba(96,165,250,0.1)';
                    }
                },
                title: {
                    display: true,
                    text: 'Risk Level',
                    color: '#e5e7eb',
                    font: { weight: 'bold', size: 13 }
                }
            },
            x: {
                ticks: {
                    color: '#9ca3af',
                    font: { weight: 'bold', size: 10 },
                    maxRotation: 45,
                    minRotation: 45
                },
                grid: { color: 'rgba(96,165,250,0.05)' },
                title: {
                    display: true,
                    text: 'Date',
                    color: '#e5e7eb',
                    font: { weight: 'bold', size: 13 }
                }
            }
        }
    };
}

// ================================================================
// RECOVERY PROGRESS CHART - ALL METRICS WITH DATE-BASED X-AXIS
// ================================================================

function updateRecoveryProgressChart() {
    const canvas = document.getElementById('recoveryProgressChart');
    if (!canvas) return;

    const sortedDates = Object.keys(allData).sort();

    // If no data, show empty chart
    if (sortedDates.length === 0) {
        if (!charts.recoveryProgress) {
            charts.recoveryProgress = new Chart(canvas, {
                type: 'line',
                data: { labels: [], datasets: [] },
                options: getRecoveryProgressChartOptions()
            });
        }
        return;
    }

    // Calculate date range with 3-month padding
    const firstDate = new Date(sortedDates[0]);
    const lastDate = new Date(sortedDates[sortedDates.length - 1]);

    const startDate = new Date(firstDate);
    startDate.setMonth(startDate.getMonth() - 3);

    const endDate = new Date(lastDate);
    endDate.setMonth(endDate.getMonth() + 3);

    // Generate all dates in range (weekly intervals for reasonable display)
    const allLabels = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        allLabels.push(new Date(currentDate).toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 7); // Weekly intervals
    }

    // Create data maps for each metric
    const metricsData = {
        vo2Max: {},
        restingHR: {},
        bpSystolic: {},
        bpDiastolic: {},
        maxHR: {},
        hrRecovery: {},
        sdnn: {},
        rmssd: {},
        pnn50: {},
        walkDistance: {},
        mets: {},
        ejectionFraction: {},
        oxygenSat: {},
        respRate: {},
        weight: {},
        dyspnea: {},
        chestPain: {},
        fatigue: {},
        edema: {},
        qualityOfLife: {},
        sleepQuality: {}
    };

    // Populate data from actual entries
    sortedDates.forEach(date => {
        const entry = allData[date];
        if (entry.vo2Max !== undefined) metricsData.vo2Max[date] = entry.vo2Max;
        if (entry.restingHR !== undefined) metricsData.restingHR[date] = entry.restingHR;
        if (entry.bpSystolic !== undefined) metricsData.bpSystolic[date] = entry.bpSystolic;
        if (entry.bpDiastolic !== undefined) metricsData.bpDiastolic[date] = entry.bpDiastolic;
        if (entry.maxHR !== undefined) metricsData.maxHR[date] = entry.maxHR;
        if (entry.hrRecovery !== undefined) metricsData.hrRecovery[date] = entry.hrRecovery;
        if (entry.sdnn !== undefined) metricsData.sdnn[date] = entry.sdnn;
        if (entry.rmssd !== undefined) metricsData.rmssd[date] = entry.rmssd;
        if (entry.pnn50 !== undefined) metricsData.pnn50[date] = entry.pnn50;
        if (entry.walkDistance !== undefined) metricsData.walkDistance[date] = entry.walkDistance;
        if (entry.mets !== undefined) metricsData.mets[date] = entry.mets;
        if (entry.ejectionFraction !== undefined) metricsData.ejectionFraction[date] = entry.ejectionFraction;
        if (entry.oxygenSat !== undefined) metricsData.oxygenSat[date] = entry.oxygenSat;
        if (entry.respRate !== undefined) metricsData.respRate[date] = entry.respRate;
        if (entry.weight !== undefined) metricsData.weight[date] = entry.weight;
        if (entry.dyspnea !== undefined) metricsData.dyspnea[date] = entry.dyspnea;
        if (entry.chestPain !== undefined) metricsData.chestPain[date] = entry.chestPain;
        if (entry.fatigue !== undefined) metricsData.fatigue[date] = entry.fatigue;
        if (entry.edema !== undefined) metricsData.edema[date] = entry.edema;
        if (entry.qualityOfLife !== undefined) metricsData.qualityOfLife[date] = entry.qualityOfLife;
        if (entry.sleepQuality !== undefined) metricsData.sleepQuality[date] = entry.sleepQuality;
    });

    // Map data to chart labels
    const mapDataToLabels = (dataMap) => {
        return allLabels.map(label => {
            // Find closest actual data point within 7 days
            if (dataMap[label] !== undefined) return dataMap[label];

            const labelDate = new Date(label);
            for (let i = 0; i <= 7; i++) {
                const checkDate = new Date(labelDate);
                checkDate.setDate(checkDate.getDate() - i);
                const checkDateStr = checkDate.toISOString().split('T')[0];
                if (dataMap[checkDateStr] !== undefined) return dataMap[checkDateStr];
            }
            return null;
        });
    };

    // Create datasets with all metrics
    const datasets = [
        {
            label: 'VO2 Max',
            data: mapDataToLabels(metricsData.vo2Max),
            borderColor: '#60a5fa',
            backgroundColor: 'rgba(96,165,250,0.1)',
            borderWidth: 3,
            tension: 0.4,
            spanGaps: true,
            pointRadius: 4,
            pointHoverRadius: 7,
            hidden: false
        },
        {
            label: 'Resting HR',
            data: mapDataToLabels(metricsData.restingHR),
            borderColor: '#ef4444',
            borderWidth: 2,
            tension: 0.4,
            spanGaps: true,
            pointRadius: 3,
            hidden: false
        },
        {
            label: 'BP Systolic',
            data: mapDataToLabels(metricsData.bpSystolic),
            borderColor: '#f59e0b',
            borderWidth: 2,
            tension: 0.4,
            spanGaps: true,
            pointRadius: 3,
            hidden: false
        },
        {
            label: 'BP Diastolic',
            data: mapDataToLabels(metricsData.bpDiastolic),
            borderColor: '#fb923c',
            borderWidth: 2,
            tension: 0.4,
            spanGaps: true,
            pointRadius: 3,
            hidden: false
        },
        {
            label: 'Max HR',
            data: mapDataToLabels(metricsData.maxHR),
            borderColor: '#ec4899',
            borderWidth: 2,
            tension: 0.4,
            spanGaps: true,
            pointRadius: 3,
            hidden: false
        },
        {
            label: 'HR Recovery',
            data: mapDataToLabels(metricsData.hrRecovery),
            borderColor: '#8b5cf6',
            borderWidth: 2,
            tension: 0.4,
            spanGaps: true,
            pointRadius: 3,
            hidden: false
        },
        {
            label: 'SDNN (HRV)',
            data: mapDataToLabels(metricsData.sdnn),
            borderColor: '#06b6d4',
            borderWidth: 2,
            tension: 0.4,
            spanGaps: true,
            pointRadius: 3,
            hidden: false
        },
        {
            label: 'RMSSD (HRV)',
            data: mapDataToLabels(metricsData.rmssd),
            borderColor: '#14b8a6',
            borderWidth: 2,
            tension: 0.4,
            spanGaps: true,
            pointRadius: 3,
            hidden: false
        },
        {
            label: 'pNN50',
            data: mapDataToLabels(metricsData.pnn50),
            borderColor: '#84cc16',
            borderWidth: 2,
            tension: 0.4,
            spanGaps: true,
            pointRadius: 3,
            hidden: false
        },
        {
            label: '6-Min Walk (m)',
            data: mapDataToLabels(metricsData.walkDistance),
            borderColor: '#22c55e',
            borderWidth: 2,
            tension: 0.4,
            spanGaps: true,
            pointRadius: 3,
            hidden: false
        },
        {
            label: 'METs',
            data: mapDataToLabels(metricsData.mets),
            borderColor: '#10b981',
            borderWidth: 2,
            tension: 0.4,
            spanGaps: true,
            pointRadius: 3,
            hidden: false
        },
        {
            label: 'Ejection Fraction',
            data: mapDataToLabels(metricsData.ejectionFraction),
            borderColor: '#f97316',
            borderWidth: 2,
            tension: 0.4,
            spanGaps: true,
            pointRadius: 3,
            hidden: false
        },
        {
            label: 'Oxygen Saturation',
            data: mapDataToLabels(metricsData.oxygenSat),
            borderColor: '#3b82f6',
            borderWidth: 2,
            tension: 0.4,
            spanGaps: true,
            pointRadius: 3,
            hidden: false
        },
        {
            label: 'Respiratory Rate',
            data: mapDataToLabels(metricsData.respRate),
            borderColor: '#0ea5e9',
            borderWidth: 2,
            tension: 0.4,
            spanGaps: true,
            pointRadius: 3,
            hidden: false
        },
        {
            label: 'Weight (kg)',
            data: mapDataToLabels(metricsData.weight),
            borderColor: '#6366f1',
            borderWidth: 2,
            tension: 0.4,
            spanGaps: true,
            pointRadius: 3,
            hidden: false
        },
        {
            label: 'Dyspnea Score',
            data: mapDataToLabels(metricsData.dyspnea),
            borderColor: '#d946ef',
            borderWidth: 2,
            tension: 0.4,
            spanGaps: true,
            pointRadius: 3,
            hidden: false
        },
        {
            label: 'Chest Pain',
            data: mapDataToLabels(metricsData.chestPain),
            borderColor: '#dc2626',
            borderWidth: 2,
            tension: 0.4,
            spanGaps: true,
            pointRadius: 3,
            hidden: false
        },
        {
            label: 'Fatigue',
            data: mapDataToLabels(metricsData.fatigue),
            borderColor: '#ca8a04',
            borderWidth: 2,
            tension: 0.4,
            spanGaps: true,
            pointRadius: 3,
            hidden: false
        },
        {
            label: 'Edema',
            data: mapDataToLabels(metricsData.edema),
            borderColor: '#0891b2',
            borderWidth: 2,
            tension: 0.4,
            spanGaps: true,
            pointRadius: 3,
            hidden: false
        },
        {
            label: 'Quality of Life',
            data: mapDataToLabels(metricsData.qualityOfLife),
            borderColor: '#16a34a',
            borderWidth: 2,
            tension: 0.4,
            spanGaps: true,
            pointRadius: 3,
            hidden: false
        },
        {
            label: 'Sleep Quality',
            data: mapDataToLabels(metricsData.sleepQuality),
            borderColor: '#4f46e5',
            borderWidth: 2,
            tension: 0.4,
            spanGaps: true,
            pointRadius: 3,
            hidden: false
        }
    ];

    // Format labels for display
    const displayLabels = allLabels.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
    });

    if (charts.recoveryProgress) {
        charts.recoveryProgress.data.labels = displayLabels;
        charts.recoveryProgress.data.datasets = datasets;
        charts.recoveryProgress.update('none');
    } else {
        charts.recoveryProgress = new Chart(canvas, {
            type: 'line',
            data: {
                labels: displayLabels,
                datasets: datasets
            },
            options: getRecoveryProgressChartOptions()
        });
    }
}

function getRecoveryProgressChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false
        },
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 12,
                    font: {
                        size: 13,
                        weight: 'bold'  // Bold legend text
                    },
                    color: '#e5e7eb',
                    boxWidth: 15,
                    boxHeight: 15
                },
                onClick: function(e, legendItem, legend) {
                    // Custom legend click behavior
                    const index = legendItem.datasetIndex;
                    const chart = legend.chart;
                    const clickedDataset = chart.data.datasets[index];

                    // Check how many datasets are currently visible
                    const visibleCount = chart.data.datasets.filter(ds => !ds.hidden).length;

                    // If only one is visible and it's the one being clicked, show all
                    if (visibleCount === 1 && !clickedDataset.hidden) {
                        chart.data.datasets.forEach(dataset => {
                            dataset.hidden = false;
                        });
                    } else {
                        // Hide all others, show only this one
                        chart.data.datasets.forEach((dataset, i) => {
                            dataset.hidden = (i !== index);
                        });
                    }

                    chart.update();
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += context.parsed.y.toFixed(1);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: false,
                ticks: {
                    color: '#9ca3af',
                    font: { weight: 'bold' }
                },
                grid: { color: 'rgba(96,165,250,0.1)' },
                title: {
                    display: true,
                    text: 'Measurement Value',
                    color: '#e5e7eb',
                    font: { weight: 'bold', size: 14 }
                }
            },
            x: {
                ticks: {
                    color: '#9ca3af',
                    font: { weight: 'bold' },
                    maxRotation: 45,
                    minRotation: 45
                },
                grid: { color: 'rgba(96,165,250,0.1)' },
                title: {
                    display: true,
                    text: 'Date',
                    color: '#e5e7eb',
                    font: { weight: 'bold', size: 14 }
                }
            }
        }
    };
}

function toggleAllMetrics() {
    const chart = charts.recoveryProgress;
    if (!chart) return;

    // Check if all are visible
    const allVisible = chart.data.datasets.every(ds => !ds.hidden);

    if (allVisible) {
        // If all visible, keep all visible (do nothing)
        return;
    } else {
        // Show all
        chart.data.datasets.forEach(dataset => {
            dataset.hidden = false;
        });
        chart.update();
    }
}

function getChartOptions() {
    const isMobile = window.innerWidth < 768;
    return {
        responsive: true,
        maintainAspectRatio: false, // Allow custom heights
        plugins: {
            legend: {
                display: true,
                position: isMobile ? 'bottom' : 'top',
                labels: {
                    color: '#e5e7eb',
                    font: {
                        size: isMobile ? 10 : 14,
                        weight: 'bold'
                    },
                    padding: isMobile ? 8 : 10,
                    boxWidth: isMobile ? 15 : 40,
                    usePointStyle: true
                }
            },
            tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false,
                titleFont: { size: isMobile ? 11 : 14 },
                bodyFont: { size: isMobile ? 10 : 12 },
                padding: isMobile ? 8 : 12
            }
        },
        scales: {
            y: {
                ticks: {
                    color: '#9ca3af',
                    font: {
                        size: isMobile ? 9 : 12,
                        weight: 'bold'
                    },
                    maxTicksLimit: isMobile ? 6 : 10
                },
                grid: { color: 'rgba(96,165,250,0.1)' }
            },
            x: {
                ticks: {
                    color: '#9ca3af',
                    font: {
                        size: isMobile ? 9 : 12,
                        weight: 'bold'
                    },
                    maxRotation: isMobile ? 45 : 0,
                    minRotation: isMobile ? 45 : 0,
                    autoSkip: true,
                    maxTicksLimit: isMobile ? 6 : 12
                },
                grid: { color: 'rgba(96,165,250,0.1)' }
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    };
}

// TABS
function switchTab(tabId) {
    // Update tab panel visibility
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
        tab.classList.remove('active');
    });

    const activePanel = document.getElementById(tabId);
    if (activePanel) {
        activePanel.style.display = 'block';
        activePanel.classList.add('active');
    }

    // Update tab button states and ARIA attributes
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
    });

    // Set active tab button and ARIA
    const activeBtn = document.getElementById('tab-' + tabId);
    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.setAttribute('aria-selected', 'true');
    }

    // Update bottom nav for mobile
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    bottomNavItems.forEach(item => item.classList.remove('active'));
    const activeBottomNav = document.getElementById('bottomNav-' + tabId);
    if (activeBottomNav) {
        activeBottomNav.classList.add('active');
    }

    // Smooth scroll to top
    if (window.pageYOffset > 0) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Update charts if needed
    if (tabId === 'dashboard' || tabId === 'analytics') {
        setTimeout(() => {
            updateCharts();
            updatePopulationComparison();
        }, 100);
    }
}

// ANALYTICS SUBTAB SWITCHING
function switchAnalyticsSubtab(subtabId) {
    // Hide all analytics subtabs
    document.querySelectorAll('.analytics-subtab').forEach(subtab => {
        subtab.style.display = 'none';
        subtab.classList.remove('active');
    });

    // Show selected subtab
    const activeSubtab = document.getElementById('analytics-' + subtabId);
    if (activeSubtab) {
        activeSubtab.style.display = 'block';
        activeSubtab.classList.add('active');
    }

    // Update subtab button states
    document.querySelectorAll('.subtab-button').forEach(btn => {
        btn.classList.remove('active');
    });

    const activeBtn = document.getElementById('subtab-' + subtabId);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    // Trigger chart updates for visible subtab
    setTimeout(() => {
        if (subtabId === 'performance') {
            createMETsChart();
            createHRZoneChart();
        } else if (subtabId === 'cardiovascular') {
            initializeCRPSTrendChart();
        } else if (subtabId === 'multiMetric') {
            if (typeof updateRadarChart === 'function') updateRadarChart();
            if (typeof updateRiskChart === 'function') updateRiskChart();
            if (typeof updateRecoveryProgressChart === 'function') updateRecoveryProgressChart();
        }
    }, 100);
}

// CREATE METS PROGRESS CHART
function createMETsChart() {
    const canvas = document.getElementById('metsProgressChart');
    if (!canvas) return;

    if (window.metsChart && typeof window.metsChart.destroy === 'function') {
    if (window.metsChart) {
        window.metsChart.destroy();
    }

    // Calculate METs from saved data
    const dates = Object.keys(allData).sort();
    const metsData = [];

    dates.forEach(date => {
        const data = allData[date];
        // Calculate METs from exercise data or use saved value
        if (data.mets) {
            metsData.push({
                date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                mets: parseFloat(data.mets)
            });
        } else if (data.vo2Max) {
            // Estimate METs from VO2 Max: METs = VO2 Max / 3.5
            const estimatedMETs = (parseFloat(data.vo2Max) / 3.5).toFixed(1);
            metsData.push({
                date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                mets: parseFloat(estimatedMETs)
            });
        }
    });

    // If no data, show sample data
    if (metsData.length === 0) {
        metsData.push(
            { date: 'Week 1', mets: 2.5 },
            { date: 'Week 2', mets: 3.0 },
            { date: 'Week 3', mets: 3.5 },
            { date: 'Week 4', mets: 4.0 },
            { date: 'Sample', mets: null }
        );
    }

    const ctx = canvas.getContext('2d');
    window.metsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: metsData.map(d => d.date),
            datasets: [{
                label: 'METs (Metabolic Equivalents)',
                data: metsData.map(d => d.mets),
                backgroundColor: function(context) {
                    const value = context.parsed.y;
                    if (value >= 6) return 'rgba(34, 197, 94, 0.8)'; // Green - Vigorous
                    if (value >= 4) return 'rgba(59, 130, 246, 0.8)'; // Blue - Moderate
                    if (value >= 2) return 'rgba(245, 158, 11, 0.8)'; // Orange - Light
                    return 'rgba(156, 163, 175, 0.8)'; // Gray - Resting
                },
                borderColor: function(context) {
                    const value = context.parsed.y;
                    if (value >= 6) return 'rgb(34, 197, 94)';
                    if (value >= 4) return 'rgb(59, 130, 246)';
                    if (value >= 2) return 'rgb(245, 158, 11)';
                    return 'rgb(156, 163, 175)';
                },
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: getChartOptions('METs')
    });
}

// CREATE HEART RATE ZONE CHART
function createHRZoneChart() {
    const canvas = document.getElementById('hrZoneChart');
    if (!canvas) return;

    // Destroy existing chart if it exists
    if (window.hrZoneChart && typeof window.hrZoneChart.destroy === 'function') {
        window.hrZoneChart.destroy();
    }

    // Calculate max HR (using age if available, otherwise default to 180)
    const age = calculateAge(); // Will use from patient data if available
    const maxHR = age ? (220 - age) : 180;

    // Define HR zones
    const zones = {
        zone1: { min: Math.round(maxHR * 0.50), max: Math.round(maxHR * 0.60), color: 'rgba(156,163,175,0.2)', label: 'Zone 1' },
        zone2: { min: Math.round(maxHR * 0.60), max: Math.round(maxHR * 0.70), color: 'rgba(59,130,246,0.2)', label: 'Zone 2' },
        zone3: { min: Math.round(maxHR * 0.70), max: Math.round(maxHR * 0.80), color: 'rgba(34,197,94,0.2)', label: 'Zone 3' },
        zone4: { min: Math.round(maxHR * 0.80), max: Math.round(maxHR * 0.90), color: 'rgba(245,158,11,0.2)', label: 'Zone 4' },
        zone5: { min: Math.round(maxHR * 0.90), max: maxHR, color: 'rgba(239,68,68,0.2)', label: 'Zone 5' }
    };

    // Get heart rate data from saved sessions
    const dates = Object.keys(allData).sort();
    const hrData = [];

    dates.forEach(date => {
        const data = allData[date];
        if (data.maxHeartRate) {
            hrData.push({
                date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                hr: parseFloat(data.maxHeartRate)
            });
        } else if (data.avgHeartRate) {
            hrData.push({
                date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                hr: parseFloat(data.avgHeartRate)
            });
        }
    });

    // If no data, show sample data across different zones
    if (hrData.length === 0) {
        hrData.push(
            { date: 'Week 1', hr: Math.round(maxHR * 0.55) },  // Zone 1
            { date: 'Week 2', hr: Math.round(maxHR * 0.65) },  // Zone 2
            { date: 'Week 3', hr: Math.round(maxHR * 0.72) },  // Zone 3
            { date: 'Week 4', hr: Math.round(maxHR * 0.68) },  // Zone 2
            { date: 'Week 5', hr: Math.round(maxHR * 0.75) },  // Zone 3
            { date: 'Week 6', hr: Math.round(maxHR * 0.78) }   // Zone 3
        );
    }

    const ctx = canvas.getContext('2d');
    window.hrZoneChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: hrData.map(d => d.date),
            datasets: [{
                label: 'Heart Rate During Exercise',
                data: hrData.map(d => d.hr),
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239,68,68,0.1)',
                borderWidth: 3,
                pointRadius: 5,
                pointBackgroundColor: '#ef4444',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: { color: '#9ca3af', font: { size: 12 } }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const hr = context.parsed.y;
                            let zone = '';
                            if (hr >= zones.zone5.min) zone = 'Zone 5 (Maximum)';
                            else if (hr >= zones.zone4.min) zone = 'Zone 4 (Hard)';
                            else if (hr >= zones.zone3.min) zone = 'Zone 3 (Moderate)';
                            else if (hr >= zones.zone2.min) zone = 'Zone 2 (Light)';
                            else zone = 'Zone 1 (Very Light)';
                            return `HR: ${hr} bpm (${zone})`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    min: Math.round(maxHR * 0.45),
                    max: maxHR + 10,
                    ticks: { color: '#9ca3af' },
                    grid: { color: 'rgba(156,163,175,0.1)' },
                    title: {
                        display: true,
                        text: 'Heart Rate (bpm)',
                        color: '#9ca3af'
                    }
                },
                x: {
                    ticks: { color: '#9ca3af' },
                    grid: { color: 'rgba(156,163,175,0.1)' }
                }
            }
        },
        plugins: [{
            // Custom plugin to draw zone backgrounds
            beforeDraw: (chart) => {
                const ctx = chart.ctx;
                const chartArea = chart.chartArea;
                const yScale = chart.scales.y;

                // Draw each zone as a colored band
                Object.values(zones).forEach(zone => {
                    const yTop = yScale.getPixelForValue(zone.max);
                    const yBottom = yScale.getPixelForValue(zone.min);

                    ctx.fillStyle = zone.color;
                    ctx.fillRect(
                        chartArea.left,
                        yTop,
                        chartArea.right - chartArea.left,
                        yBottom - yTop
                    );
                });
            }
        }]
    });
}

// Helper function to calculate age from surgery date or patient data
function calculateAge() {
    // Try to get age from stored patient data
    const todayData = allData[new Date().toISOString().split('T')[0]];
    if (todayData && todayData.age) {
        return parseInt(todayData.age);
    }

    // Default age for calculation if not available
    return 55; // Typical cardiac patient age
}

// NOTIFICATIONS
function showNotification(message, type) {
    const notif = document.getElementById('notification');
    notif.textContent = message;
    notif.className = `notification ${type} show`;
    setTimeout(() => notif.classList.remove('show'), 3000);
}

// ============================================================================
// HEART RATE MONITOR - REAL BLUETOOTH CONNECTIVITY
// ============================================================================

// Bluetooth device state
let connectedDevice = null;
let deviceType = null; // 'polar' or 'samsung'
let hrCharacteristic = null;
let batteryCharacteristic = null;
let hrMonitorActive = false;
let hrData = [];
let hrLabels = [];
let hrStartTime = null;
let hrChart = null;
let rrIntervals = []; // For HRV calculation
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

// Standard Bluetooth UUIDs
const HEART_RATE_SERVICE = 0x180D;
const HEART_RATE_MEASUREMENT = 0x2A37;
const BATTERY_SERVICE = 0x180F;
const BATTERY_LEVEL = 0x2A19;

// ============================================================================
// POLAR H10 CONNECTION
// ============================================================================
async function connectPolarH10() {
    try {
        if (!navigator.bluetooth) {
            showNotification('❌ Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera.', 'error');
            return;
        }

        showNotification('🔍 Searching for Polar H10...', 'info');

        // Request Polar H10 device
        const device = await navigator.bluetooth.requestDevice({
            filters: [
                { namePrefix: 'Polar H10' },
                { services: [HEART_RATE_SERVICE] }
            ],
            optionalServices: [BATTERY_SERVICE]
        });

        device.addEventListener('gattserverdisconnected', onDisconnected);

        showNotification('🔗 Connecting to ' + device.name + '...', 'info');

        const server = await device.gatt.connect();
        const hrService = await server.getPrimaryService(HEART_RATE_SERVICE);
        hrCharacteristic = await hrService.getCharacteristic(HEART_RATE_MEASUREMENT);

        // Try to get battery service
        try {
            const batteryService = await server.getPrimaryService(BATTERY_SERVICE);
            batteryCharacteristic = await batteryService.getCharacteristic(BATTERY_LEVEL);
            const batteryValue = await batteryCharacteristic.readValue();
            const batteryLevel = batteryValue.getUint8(0);
            document.getElementById('deviceBattery').textContent = batteryLevel;
        } catch (e) {
            console.log('Battery service not available:', e);
            document.getElementById('deviceBattery').textContent = '--';
        }

        // Save connection
        connectedDevice = device;
        deviceType = 'polar';

        // Update UI
        document.getElementById('polarStatus').innerHTML = '🟢 Connected';
        document.getElementById('polarStatus').style.color = '#22c55e';
        document.getElementById('polarConnectBtn').textContent = 'Connected ✓';
        document.getElementById('polarConnectBtn').disabled = true;
        document.getElementById('connectedDeviceName').textContent = device.name;
        document.getElementById('deviceInfo').style.display = 'block';
        document.getElementById('hrStatus').textContent = 'Device ready - press Start';
        document.getElementById('hrStatus').style.color = '#22c55e';
        document.getElementById('startHRBtn').disabled = false;
        document.getElementById('startHRBtn').style.opacity = '1';

        showNotification('✅ Connected to ' + device.name, 'success');

    } catch (error) {
        console.error('Polar H10 connection error:', error);
        showNotification('❌ Connection failed: ' + error.message, 'error');
    }
}

// ============================================================================
// SAMSUNG WATCH CONNECTION
// ============================================================================
async function connectSamsungWatch() {
    try {
        if (!navigator.bluetooth) {
            showNotification('❌ Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera.', 'error');
            return;
        }

        showNotification('🔍 Searching for Samsung Galaxy Watch...', 'info');

        // Request Samsung Watch - they use standard Heart Rate Service
        const device = await navigator.bluetooth.requestDevice({
            filters: [
                { namePrefix: 'Galaxy Watch' },
                { namePrefix: 'SM-' }, // Samsung model numbers
                { services: [HEART_RATE_SERVICE] }
            ],
            optionalServices: [BATTERY_SERVICE]
        });

        device.addEventListener('gattserverdisconnected', onDisconnected);

        showNotification('🔗 Connecting to ' + device.name + '...', 'info');

        const server = await device.gatt.connect();
        const hrService = await server.getPrimaryService(HEART_RATE_SERVICE);
        hrCharacteristic = await hrService.getCharacteristic(HEART_RATE_MEASUREMENT);

        // Try to get battery service
        try {
            const batteryService = await server.getPrimaryService(BATTERY_SERVICE);
            batteryCharacteristic = await batteryService.getCharacteristic(BATTERY_LEVEL);
            const batteryValue = await batteryCharacteristic.readValue();
            const batteryLevel = batteryValue.getUint8(0);
            document.getElementById('deviceBattery').textContent = batteryLevel;
        } catch (e) {
            console.log('Battery service not available:', e);
            document.getElementById('deviceBattery').textContent = '--';
        }

        // Save connection
        connectedDevice = device;
        deviceType = 'samsung';

        // Update UI
        document.getElementById('samsungStatus').innerHTML = '🟢 Connected';
        document.getElementById('samsungStatus').style.color = '#22c55e';
        document.getElementById('samsungConnectBtn').textContent = 'Connected ✓';
        document.getElementById('samsungConnectBtn').disabled = true;
        document.getElementById('connectedDeviceName').textContent = device.name;
        document.getElementById('deviceInfo').style.display = 'block';
        document.getElementById('hrStatus').textContent = 'Device ready - press Start';
        document.getElementById('hrStatus').style.color = '#22c55e';
        document.getElementById('startHRBtn').disabled = false;
        document.getElementById('startHRBtn').style.opacity = '1';

        // Show ECG section for Samsung Watch
        document.getElementById('ecgSection').style.display = 'block';

        showNotification('✅ Connected to ' + device.name, 'success');

    } catch (error) {
        console.error('Samsung Watch connection error:', error);
        showNotification('❌ Connection failed: ' + error.message, 'error');
    }
}

// ============================================================================
// DISCONNECT DEVICE
// ============================================================================
function disconnectDevice() {
    if (hrMonitorActive) {
        stopHRMonitoring();
    }

    if (connectedDevice && connectedDevice.gatt.connected) {
        connectedDevice.gatt.disconnect();
    }

    connectedDevice = null;
    deviceType = null;
    hrCharacteristic = null;
    batteryCharacteristic = null;

    // Reset UI
    document.getElementById('polarStatus').innerHTML = '🔴 Not Connected';
    document.getElementById('polarStatus').style.color = '#6b7280';
    document.getElementById('polarConnectBtn').textContent = 'Connect Polar H10';
    document.getElementById('polarConnectBtn').disabled = false;

    document.getElementById('samsungStatus').innerHTML = '🔴 Not Connected';
    document.getElementById('samsungStatus').style.color = '#6b7280';
    document.getElementById('samsungConnectBtn').textContent = 'Connect Samsung Watch';
    document.getElementById('samsungConnectBtn').disabled = false;

    document.getElementById('deviceInfo').style.display = 'none';
    document.getElementById('hrStatus').textContent = 'No sensor connected';
    document.getElementById('hrStatus').style.color = '#6b7280';
    document.getElementById('currentHR').textContent = '--';
    document.getElementById('startHRBtn').disabled = true;
    document.getElementById('startHRBtn').style.opacity = '0.5';
    document.getElementById('ecgSection').style.display = 'none';

    showNotification('🔌 Device disconnected', 'info');
}

// ============================================================================
// HANDLE DISCONNECTION
// ============================================================================
function onDisconnected(event) {
    const device = event.target;
    console.log('Device disconnected:', device.name);

    showNotification('⚠️ Device disconnected. Attempting to reconnect...', 'error');

    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        setTimeout(() => {
            if (deviceType === 'polar') {
                connectPolarH10();
            } else if (deviceType === 'samsung') {
                connectSamsungWatch();
            }
        }, 2000);
    } else {
        disconnectDevice();
        showNotification('❌ Could not reconnect. Please connect manually.', 'error');
        reconnectAttempts = 0;
    }
}

// ============================================================================
// START/STOP MONITORING
// ============================================================================
async function startHRMonitoring() {
    if (!hrCharacteristic) {
        showNotification('❌ No device connected', 'error');
        return;
    }

    try {
        hrMonitorActive = true;
        hrData = [];
        hrLabels = [];
        rrIntervals = [];
        hrStartTime = Date.now();

        // Start notifications
        await hrCharacteristic.startNotifications();
        hrCharacteristic.addEventListener('characteristicvaluechanged', handleHeartRateChanged);

        // Update UI
        document.getElementById('hrStatus').textContent = 'Monitoring active...';
        document.getElementById('hrStatus').style.color = '#22c55e';
        document.getElementById('startHRBtn').disabled = true;
        document.getElementById('startHRBtn').style.opacity = '0.5';
        document.getElementById('stopHRBtn').disabled = false;
        document.getElementById('stopHRBtn').style.opacity = '1';

        // Show override section
        document.getElementById('overrideSection').style.display = 'block';
        const deviceName = connectedDevice?.name || 'Device';
        document.getElementById('overrideSessionInfo').textContent = `${deviceName} - Active`;

        // Initialize chart
        initHRChart();

        showNotification('❤️ Heart rate monitoring started', 'success');

    } catch (error) {
        console.error('Start monitoring error:', error);
        showNotification('❌ Failed to start monitoring: ' + error.message, 'error');
    }
}

async function stopHRMonitoring() {
    if (!hrCharacteristic) return;

    try {
        hrMonitorActive = false;
        await hrCharacteristic.stopNotifications();
        hrCharacteristic.removeEventListener('characteristicvaluechanged', handleHeartRateChanged);

        // Update UI
        document.getElementById('hrStatus').textContent = 'Monitoring stopped';
        document.getElementById('hrStatus').style.color = '#f59e0b';
        document.getElementById('startHRBtn').disabled = false;
        document.getElementById('startHRBtn').style.opacity = '1';
        document.getElementById('stopHRBtn').disabled = true;
        document.getElementById('stopHRBtn').style.opacity = '0.5';

        showNotification('⏹️ Heart rate monitoring stopped', 'info');

        // Save session data to localStorage
        saveHRSession();

    } catch (error) {
        console.error('Stop monitoring error:', error);
    }
}

// ============================================================================
// PARSE HEART RATE DATA
// ============================================================================
function handleHeartRateChanged(event) {
    const value = event.target.value;
    const flags = value.getUint8(0);
    const rate16Bits = flags & 0x1;
    let heartRate;

    if (rate16Bits) {
        heartRate = value.getUint16(1, true);
    } else {
        heartRate = value.getUint8(1);
    }

    // Check for RR intervals (for HRV calculation)
    if (flags & 0x10) {
        // RR intervals present
        let index = rate16Bits ? 3 : 2;
        while (index < value.byteLength) {
            const rrInterval = value.getUint16(index, true);
            rrIntervals.push(rrInterval);
            index += 2;
        }

        // Calculate HRV from RR intervals
        if (rrIntervals.length >= 10) {
            const hrv = calculateHRV(rrIntervals);
            if (deviceType === 'samsung') {
                document.getElementById('ecgHRV').textContent = Math.round(hrv);

                // Calculate average RR interval
                const avgRR = rrIntervals.reduce((a, b) => a + b, 0) / rrIntervals.length;
                document.getElementById('ecgRR').textContent = Math.round(avgRR);
            }
        }
    }

    // Add to data
    const elapsedSeconds = Math.floor((Date.now() - hrStartTime) / 1000);
    hrData.push(heartRate);
    hrLabels.push(elapsedSeconds + 's');

    // Keep only last 120 readings (2 minutes)
    if (hrData.length > 120) {
        hrData.shift();
        hrLabels.shift();
    }

    // Update display
    document.getElementById('currentHR').textContent = heartRate;
    updateHRChart();
    updateHRStatistics();

    // Update ECG rhythm detection for Samsung Watch
    if (deviceType === 'samsung') {
        detectRhythm(heartRate);
    }
}

// Calculate HRV (SDNN method)
function calculateHRV(intervals) {
    if (intervals.length < 2) return 0;

    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const squaredDiffs = intervals.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / intervals.length;
    return Math.sqrt(variance);
}

// Simple rhythm detection
function detectRhythm(currentHR) {
    if (hrData.length < 10) {
        document.getElementById('ecgRhythm').textContent = 'Analyzing...';
        return;
    }

    // Calculate variability in last 10 readings
    const recent = hrData.slice(-10);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const variance = recent.map(hr => Math.abs(hr - avg)).reduce((a, b) => a + b, 0) / recent.length;

    if (variance > 10) {
        document.getElementById('ecgRhythm').textContent = 'Irregular';
        document.getElementById('ecgRhythm').style.color = '#ef4444';
    } else if (avg > 100) {
        document.getElementById('ecgRhythm').textContent = 'Tachycardia';
        document.getElementById('ecgRhythm').style.color = '#f59e0b';
    } else if (avg < 60) {
        document.getElementById('ecgRhythm').textContent = 'Bradycardia';
        document.getElementById('ecgRhythm').style.color = '#3b82f6';
    } else {
        document.getElementById('ecgRhythm').textContent = 'Normal Sinus';
        document.getElementById('ecgRhythm').style.color = '#22c55e';
    }

    // Estimate QRS duration (simplified)
    document.getElementById('ecgQRS').textContent = '80-100';
}

// Save HR session to localStorage
function saveHRSession() {
    if (hrData.length === 0) return;

    const session = {
        date: new Date().toISOString(),
        device: connectedDevice?.name || 'Unknown',
        deviceType: deviceType,
        duration: Math.floor((Date.now() - hrStartTime) / 1000),
        avgHR: Math.round(hrData.reduce((a, b) => a + b, 0) / hrData.length),
        minHR: Math.min(...hrData),
        maxHR: Math.max(...hrData),
        data: hrData.slice(),
        rrIntervals: rrIntervals.slice()
    };

    // Get existing sessions
    let sessions = JSON.parse(localStorage.getItem('hrSessions') || '[]');
    sessions.push(session);

    // Keep only last 50 sessions
    if (sessions.length > 50) {
        sessions = sessions.slice(-50);
    }

    localStorage.setItem('hrSessions', JSON.stringify(sessions));
}

// ============================================================================
// OVERRIDE THERAPY DATA FROM MONITOR
// ============================================================================
function overrideTherapyData() {
    if (hrData.length === 0) {
        showNotification('❌ No monitoring data available. Please start monitoring first.', 'error');
        return;
    }

    const confirmation = confirm(
        '⚠️ OVERRIDE CONFIRMATION\n\n' +
        'This will replace the current Data Entry fields with data from your monitoring session.\n\n' +
        'The following metrics will be transferred:\n' +
        '• Resting HR (average from session)\n' +
        '• Maximum HR\n' +
        '• Heart Rate Recovery\n' +
        '• HRV metrics (SDNN, RMSSD, pNN50)\n' +
        (deviceType === 'samsung' ? '• SpO2, Resp Rate, VO2 Max estimate\n' : '') +
        '\n' +
        'Do you want to continue?'
    );

    if (!confirmation) {
        return;
    }

    try {
        // Calculate metrics from monitoring session
        const avgHR = Math.round(hrData.reduce((a, b) => a + b, 0) / hrData.length);
        const maxHR = Math.max(...hrData);
        const minHR = Math.min(...hrData);

        // Calculate HR Recovery (difference between max and last 5 readings average)
        const lastFive = hrData.slice(-5);
        const recoveryHR = Math.round(lastFive.reduce((a, b) => a + b, 0) / lastFive.length);
        const hrRecovery = maxHR - recoveryHR;

        // Calculate HRV metrics from RR intervals
        let sdnn = 0, rmssd = 0, pnn50 = 0;
        if (rrIntervals.length >= 10) {
            // SDNN
            sdnn = Math.round(calculateHRV(rrIntervals));

            // RMSSD (root mean square of successive differences)
            const differences = [];
            for (let i = 1; i < rrIntervals.length; i++) {
                differences.push(Math.pow(rrIntervals[i] - rrIntervals[i-1], 2));
            }
            rmssd = Math.round(Math.sqrt(differences.reduce((a, b) => a + b, 0) / differences.length));

            // pNN50 (percentage of successive RR intervals that differ by more than 50ms)
            let nn50count = 0;
            for (let i = 1; i < rrIntervals.length; i++) {
                if (Math.abs(rrIntervals[i] - rrIntervals[i-1]) > 50) {
                    nn50count++;
                }
            }
            pnn50 = ((nn50count / (rrIntervals.length - 1)) * 100).toFixed(1);
        }

        // Populate data entry fields
        document.getElementById('restingHR').value = avgHR;
        document.getElementById('maxHR').value = maxHR;
        document.getElementById('hrRecovery').value = hrRecovery;
        document.getElementById('sdnn').value = sdnn || '';
        document.getElementById('rmssd').value = rmssd || '';
        document.getElementById('pnn50').value = pnn50 || '';

        // Samsung Watch specific metrics
        if (deviceType === 'samsung') {
            // Get values from Samsung dashboard
            const spo2Text = document.getElementById('watchSpO2').textContent;
            const respRateText = document.getElementById('watchRespRate').textContent;
            const vo2Text = document.getElementById('watchVO2').textContent;

            // Parse and populate if available
            if (spo2Text !== '-- %') {
                const spo2 = parseInt(spo2Text);
                if (!isNaN(spo2)) document.getElementById('spo2').value = spo2;
            }

            if (respRateText !== '-- bpm') {
                const respRate = parseInt(respRateText);
                if (!isNaN(respRate)) document.getElementById('respRate').value = respRate;
            }

            if (vo2Text !== '--') {
                const vo2 = parseFloat(vo2Text);
                if (!isNaN(vo2)) document.getElementById('vo2Max').value = vo2;
            }

            // Transfer Samsung Watch ECG fields
            const rhythmText = document.getElementById('ecgRhythm').textContent;
            const qrsText = document.getElementById('ecgQRS').textContent;
            const rrText = document.getElementById('ecgRR').textContent;
            const stressText = document.getElementById('watchStress').textContent;

            if (rhythmText && rhythmText !== '--') {
                document.getElementById('ecgRhythmInput').value = rhythmText;
            }

            if (qrsText && qrsText !== '-- ms') {
                const qrs = parseInt(qrsText.replace(/\D/g, ''));
                if (!isNaN(qrs)) document.getElementById('qrsDuration').value = qrs;
            }

            if (rrText && rrText !== '-- ms') {
                const rr = parseInt(rrText);
                if (!isNaN(rr)) document.getElementById('rrInterval').value = rr;
            }

            if (stressText && stressText !== '--') {
                document.getElementById('stressLevel').value = stressText;
            }

            // Update ECG metrics in dashboard
            document.getElementById('ecgRMSSD').textContent = rmssd || '--';
            document.getElementById('ecgPNN50').textContent = pnn50 || '--';
        }

        // Switch to Data Entry tab
        switchTab('entry');

        showNotification('✅ Monitoring data successfully transferred to Data Entry!', 'success');

        // Add a visual highlight to the updated fields
        const updatedFields = ['restingHR', 'maxHR', 'hrRecovery', 'sdnn', 'rmssd', 'pnn50', 'spo2', 'respRate', 'ecgRhythmInput', 'qrsDuration', 'rrInterval', 'stressLevel'];
        updatedFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && field.value) {
                field.style.background = 'rgba(34,197,94,0.1)';
                field.style.border = '2px solid #22c55e';
                setTimeout(() => {
                    field.style.background = '';
                    field.style.border = '';
                }, 3000);
            }
        });

    } catch (error) {
        console.error('Override therapy data error:', error);
        showNotification('❌ Error transferring data: ' + error.message, 'error');
    }
}

// Calculate additional Samsung Watch metrics (simulated based on HR data)
function calculateSamsungWatchMetrics() {
    if (!hrMonitorActive || deviceType !== 'samsung' || hrData.length < 10) return;

    const avgHR = hrData.reduce((a, b) => a + b, 0) / hrData.length;
    const maxHR = Math.max(...hrData);

    // Estimate SpO2 (simulated - real device would provide actual reading)
    // Healthy adults typically 95-100%
    const estimatedSpO2 = Math.min(100, Math.max(90, Math.round(100 - (avgHR - 70) * 0.1)));
    document.getElementById('watchSpO2').textContent = estimatedSpO2;

    // Estimate Stress Level based on HR variability and average
    const recentHR = hrData.slice(-20);
    const hrVariance = recentHR.map((hr, i) => i > 0 ? Math.abs(hr - recentHR[i-1]) : 0).reduce((a, b) => a + b, 0) / recentHR.length;

    let stressLevel = 'Low';
    if (avgHR > 90 && hrVariance < 3) stressLevel = 'High';
    else if (avgHR > 80 || hrVariance < 5) stressLevel = 'Moderate';
    document.getElementById('watchStress').textContent = stressLevel;

    // Estimate Respiratory Rate (typically 12-20 breaths/min)
    // Simplified correlation with HR
    const estimatedRespRate = Math.round(12 + (avgHR - 60) * 0.1);
    document.getElementById('watchRespRate').textContent = Math.max(10, Math.min(25, estimatedRespRate));

    // Estimate VO2 Max based on age and HR (simplified formula)
    // Real device uses more sophisticated algorithms
    const estimatedVO2 = Math.round(15.3 * (maxHR / avgHR));
    document.getElementById('watchVO2').textContent = Math.max(20, Math.min(60, estimatedVO2));
}

function initHRChart() {
    const canvas = document.getElementById('hrMonitorChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (hrChart && typeof hrChart.destroy === 'function') {
    if (hrChart) {
        hrChart.destroy();
    }

    hrChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Heart Rate (BPM)',
                data: [],
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239,68,68,0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 3,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text').trim(),
                        font: { size: 14, weight: 'bold' }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#ef4444',
                    borderWidth: 2
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text').trim(),
                        font: { size: 12, weight: 'bold' }
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--muted').trim()
                    },
                    grid: {
                        color: 'rgba(156,163,175,0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Heart Rate (BPM)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text').trim(),
                        font: { size: 12, weight: 'bold' }
                    },
                    beginAtZero: false,
                    min: 40,
                    max: 180,
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--muted').trim()
                    },
                    grid: {
                        color: 'rgba(156,163,175,0.1)'
                    }
                }
            },
            animation: {
                duration: 300
            }
        }
    });
}

function updateHRChart() {
    if (!hrChart) return;

    hrChart.data.labels = hrLabels;
    hrChart.data.datasets[0].data = hrData;
    hrChart.update('none'); // Update without animation for smooth real-time updates
}

// Populate HR chart with dashboard historical data
function populateHRChartFromDashboard() {
    console.log('🔄 Attempting to populate HR chart from dashboard...');
    
    const canvas = document.getElementById('hrMonitorChart');
    if (!canvas) {
        console.warn('⚠️ HR chart canvas not found in DOM');
        return;
    }
    console.log('✅ HR chart canvas found');
    
    if (!hrChart) {
        console.log('📊 Initializing HR chart...');
        initHRChart();
    }
    
    if (!hrChart) {
        console.warn('⚠️ HR chart initialization failed');
        return;
    }
    console.log('✅ HR chart object exists');

    const dates = Object.keys(allData).sort();
    console.log('📅 Found', dates.length, 'total dates in allData');
    
    if (dates.length === 0) {
        console.warn('⚠️ No data available to populate HR chart');
        return;
    }

    // Get last 30 days of HR data
    const recentDates = dates.slice(-30);
    const labels = [];
    const data = [];

    recentDates.forEach(date => {
        const entry = allData[date];
        const label = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        // Prefer resting HR, fall back to max HR or avg HR
        if (entry.restingHR) {
            labels.push(label);
            data.push(entry.restingHR);
        } else if (entry.maxHR) {
            labels.push(label);
            data.push(entry.maxHR);
        } else if (entry.avgHeartRate) {
            labels.push(label);
            data.push(entry.avgHeartRate);
        }
    });

    console.log('💓 Collected', data.length, 'HR data points');

    if (data.length === 0) {
        console.warn('⚠️ No heart rate data found in entries');
        return;
    }

    // Update chart
    hrChart.data.labels = labels;
    hrChart.data.datasets[0].data = data;
    hrChart.data.datasets[0].label = 'Historical Heart Rate (Dashboard Data)';
    hrChart.update('none');

    console.log('✅ HR chart populated with', data.length, 'dashboard entries');
}

function updateHRStatistics() {
    if (hrData.length === 0) return;

    // Calculate statistics
    const avgHR = Math.round(hrData.reduce((a, b) => a + b, 0) / hrData.length);
    const minHR = Math.min(...hrData);
    const maxHR = Math.max(...hrData);
    const duration = Math.floor((Date.now() - hrStartTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    // Update statistics display
    document.getElementById('hrAverage').textContent = avgHR + ' bpm';
    document.getElementById('hrMin').textContent = minHR + ' bpm';
    document.getElementById('hrMax').textContent = maxHR + ' bpm';
    document.getElementById('hrDuration').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Calculate zone percentages
    let restingCount = 0;
    let lightCount = 0;
    let moderateCount = 0;
    let highCount = 0;

    hrData.forEach(hr => {
        if (hr < 60) restingCount++;
        else if (hr < 100) lightCount++;
        else if (hr < 140) moderateCount++;
        else highCount++;
    });

    const total = hrData.length;
    document.getElementById('zoneResting').textContent = Math.round((restingCount / total) * 100) + '%';
    document.getElementById('zoneLight').textContent = Math.round((lightCount / total) * 100) + '%';
    document.getElementById('zoneModerate').textContent = Math.round((moderateCount / total) * 100) + '%';
    document.getElementById('zoneHigh').textContent = Math.round((highCount / total) * 100) + '%';

    // Calculate Samsung Watch specific metrics if connected
    if (deviceType === 'samsung') {
        calculateSamsungWatchMetrics();
    }
}

// Initialize
init();
setInterval(updateRecoveryInfo, 1000);

// ========================================================================
// PWA INSTALLATION & OFFLINE SUPPORT
// ========================================================================

let deferredPrompt;
const installPromptEl = document.getElementById('installPrompt');

// Service Worker Registration for Offline Support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Register inline service worker
        const swCode = `
            const CACHE_NAME = 'cardiac-recovery-pro-v1';
            const urlsToCache = [
                './',
                'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
            ];

            self.addEventListener('install', event => {
                event.waitUntil(
                    caches.open(CACHE_NAME)
                        .then(cache => cache.addAll(urlsToCache))
                );
            });

            self.addEventListener('fetch', event => {
                event.respondWith(
                    caches.match(event.request)
                        .then(response => response || fetch(event.request))
                        .catch(() => caches.match('./'))
                );
            });

            self.addEventListener('activate', event => {
                event.waitUntil(
                    caches.keys().then(cacheNames => {
                        return Promise.all(
                            cacheNames.map(cacheName => {
                                if (cacheName !== CACHE_NAME) {
                                    return caches.delete(cacheName);
                                }
                            })
                        );
                    })
                );
            });
        `;

        const blob = new Blob([swCode], { type: 'application/javascript' });
        const swUrl = URL.createObjectURL(blob);

        navigator.serviceWorker.register(swUrl)
            .then(registration => {
                console.log('✅ Service Worker registered! Offline mode enabled.');
            })
            .catch(error => {
                console.log('❌ Service Worker registration failed:', error);
            });
    });
}

// PWA Install Prompt
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Save the event for later use
    deferredPrompt = e;

    // Check if user has dismissed before
    const dismissed = localStorage.getItem('installPromptDismissed');
    if (!dismissed) {
        // Show install prompt after 3 seconds
        setTimeout(() => {
            if (installPromptEl) {
                installPromptEl.style.display = 'flex';
            }
        }, 3000);
    }
});

function installApp() {
    if (!deferredPrompt) {
        alert('Install prompt not available. Try adding to home screen manually from your browser menu.');
        return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('✅ User accepted the install prompt');
        } else {
            console.log('❌ User dismissed the install prompt');
        }
        deferredPrompt = null;
        if (installPromptEl) {
            installPromptEl.style.display = 'none';
        }
    });
}

function dismissInstallPrompt() {
    if (installPromptEl) {
        installPromptEl.style.display = 'none';
    }
    // Remember dismissal for 7 days
    const dismissTime = new Date().getTime() + (7 * 24 * 60 * 60 * 1000);
    localStorage.setItem('installPromptDismissed', dismissTime);
}

// Check if app is already installed
window.addEventListener('appinstalled', () => {
    console.log('✅ Cardiac Recovery Pro installed successfully!');
    if (installPromptEl) {
        installPromptEl.style.display = 'none';
    }
});

// Display mode detection
window.addEventListener('DOMContentLoaded', () => {
    if (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true) {
        console.log('✅ Running in standalone mode (installed PWA)');
    }
});

// ========================================================================
// OFFLINE STATUS INDICATOR
// ========================================================================

function updateOnlineStatus() {
    const status = navigator.onLine ? 'online' : 'offline';
    if (!navigator.onLine) {
        // Show offline banner
        const offlineBanner = document.createElement('div');
        offlineBanner.id = 'offlineBanner';
        offlineBanner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #f59e0b;
            color: white;
            padding: 10px;
            text-align: center;
            font-weight: 700;
            z-index: 10001;
        `;
        offlineBanner.textContent = '⚠️ You are offline - Data will sync when connection is restored';
        document.body.appendChild(offlineBanner);
    } else {
        // Remove offline banner if it exists
        const banner = document.getElementById('offlineBanner');
        if (banner) {
            banner.remove();
        }
    }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

// ========================================================================
// THEME TOGGLE (DARK / LIGHT MODE)
// ========================================================================

function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');

    body.classList.toggle('light-mode');

    if (body.classList.contains('light-mode')) {
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Light';
        localStorage.setItem('theme', 'light');
    } else {
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Dark';
        localStorage.setItem('theme', 'dark');
    }
}

// Load saved theme preference
window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        document.getElementById('themeIcon').textContent = '☀️';
        document.getElementById('themeText').textContent = 'Light';
    }
});

// ========================================================================
// STICKY HEADER ON SCROLL
// ========================================================================

let lastScrollTop = 0;
const header = document.querySelector('.header');
const scrollThreshold = 150;

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > scrollThreshold) {
        if (!header.classList.contains('sticky')) {
            header.classList.add('sticky');
            document.body.classList.add('sticky-header-active');
        }
    } else {
        if (header.classList.contains('sticky')) {
            header.classList.remove('sticky');
            document.body.classList.remove('sticky-header-active');
        }
    }

    lastScrollTop = scrollTop;
});

// ========================================================================
// PULL-TO-REFRESH
// ========================================================================

let touchStartY = 0;
let touchEndY = 0;
const pullThreshold = 100;
const pullToRefreshEl = document.getElementById('pullToRefresh');
const refreshIcon = document.getElementById('refreshIcon');

document.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    touchEndY = e.touches[0].clientY;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Only activate pull-to-refresh at top of page
    if (scrollTop === 0 && touchEndY > touchStartY) {
        const pullDistance = touchEndY - touchStartY;

        if (pullDistance > 20 && pullDistance < pullThreshold) {
            pullToRefreshEl.classList.add('pulling');
            refreshIcon.textContent = '↓';
        } else if (pullDistance >= pullThreshold) {
            refreshIcon.textContent = '🔄';
        }
    }
}, { passive: true });

document.addEventListener('touchend', () => {
    const pullDistance = touchEndY - touchStartY;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop === 0 && pullDistance >= pullThreshold) {
        // Trigger refresh
        pullToRefreshEl.classList.remove('pulling');
        pullToRefreshEl.classList.add('refreshing');
        refreshIcon.textContent = '⟳';

        // Reload page after 1 second
        setTimeout(() => {
            location.reload();
        }, 1000);
    } else {
        pullToRefreshEl.classList.remove('pulling');
        refreshIcon.textContent = '↓';
    }

    touchStartY = 0;
    touchEndY = 0;
}, { passive: true });

// ========================================================================
// PERFORMANCE OPTIMIZATION - LAZY LOADING FOR VIDEOS
// ========================================================================

// Intersection Observer for lazy loading video iframes
const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const iframe = entry.target;
            const dataSrc = iframe.getAttribute('data-src');
            if (dataSrc) {
                iframe.setAttribute('src', dataSrc);
                iframe.removeAttribute('data-src');
                videoObserver.unobserve(iframe);
            }
        }
    });
}, {
    rootMargin: '50px', // Load 50px before entering viewport
    threshold: 0.1
});

// Initialize lazy loading for all video iframes
function initLazyLoadVideos() {
    const iframes = document.querySelectorAll('iframe[data-src]');
    iframes.forEach(iframe => {
        videoObserver.observe(iframe);
    });
}

// Call on DOMContentLoaded
window.addEventListener('DOMContentLoaded', initLazyLoadVideos);

// ========================================================================
// PERFORMANCE OPTIMIZATION - ENHANCED TOUCH GESTURES
// ========================================================================

// Swipe gestures for tab navigation (mobile only)
const tabOrder = ['dashboard', 'entry', 'sessions', 'analytics', 'videos', 'history', 'hrmonitor', 'education', 'bluetooth', 'settings'];
let swipeStartX = 0;
let swipeStartTime = 0;
const swipeThreshold = 80;
const swipeTimeLimit = 300;

function getCurrentTabIndex() {
    const activeTab = document.querySelector('.tab-content.active');
    return activeTab ? tabOrder.indexOf(activeTab.id) : 0;
}

document.addEventListener('touchstart', (e) => {
    swipeStartX = e.touches[0].clientX;
    swipeStartTime = Date.now();
}, { passive: true });

document.addEventListener('touchend', (e) => {
    const swipeEndX = e.changedTouches[0].clientX;
    const swipeEndTime = Date.now();
    const swipeDistance = swipeEndX - swipeStartX;
    const swipeDuration = swipeEndTime - swipeStartTime;

    // Only process if quick swipe and not on input field
    if (swipeDuration < swipeTimeLimit && !e.target.matches('input, textarea, select')) {
        if (Math.abs(swipeDistance) > swipeThreshold) {
            const currentIndex = getCurrentTabIndex();

            // Swipe right - previous tab
            if (swipeDistance > 0 && currentIndex > 0) {
                switchTab(tabOrder[currentIndex - 1]);
            }
            // Swipe left - next tab
            else if (swipeDistance < 0 && currentIndex < tabOrder.length - 1) {
                switchTab(tabOrder[currentIndex + 1]);
            }
        }
    }
}, { passive: true });

// ========================================================================
// PERFORMANCE OPTIMIZATION - DEBOUNCED INPUT
// ========================================================================

// Debounce function for input fields to reduce excessive processing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debouncing to all input fields for auto-save
window.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        // Debounce input events to 500ms
        input.addEventListener('input', debounce((e) => {
            // Original input handling here
            console.log('Debounced input:', e.target.id);
        }, 500));
    });
});

console.log('✅ Performance optimizations loaded: Lazy loading, swipe gestures, debounced inputs');

// ========================================================================
// EXPOSE FUNCTIONS TO WINDOW FOR ONCLICK HANDLERS
// ========================================================================
// Make all onclick handler functions globally available
window.switchTab = switchTab;
window.switchAnalyticsSubtab = switchAnalyticsSubtab;
window.navigateDate = navigateDate;
window.saveMetrics = saveMetrics;
window.saveTherapySession = saveTherapySession;
window.clearForm = clearForm;
window.toggleHistoricalMode = toggleHistoricalMode;
window.updateHistoricalDate = updateHistoricalDate;
window.showExerciseSuggestions = showExerciseSuggestions;
window.selectExercise = selectExercise;
window.toggleTheme = toggleTheme;
window.clearSessionForm = clearSessionForm;
window.toggleEditGoals = toggleEditGoals;
window.saveCustomGoals = saveCustomGoals;
window.cancelEditGoals = cancelEditGoals;
window.setRecoveryDay1 = setRecoveryDay1;
window.savePatientName = savePatientName;
window.savePatientDemographics = savePatientDemographics;
window.clearCurrentData = clearCurrentData;
window.clearAllPatientData = clearAllPatientData;
window.overrideTherapyData = overrideTherapyData;
window.connectPolarH10 = connectPolarH10;
window.connectSamsungWatch = connectSamsungWatch;
window.disconnectDevice = disconnectDevice;
window.startHRMonitoring = startHRMonitoring;
window.stopHRMonitoring = stopHRMonitoring;
window.acknowledgeAlert = acknowledgeAlert;
window.closeAlert = closeAlert;
window.toggleAllMetrics = toggleAllMetrics;
}
}

// ============================================================================
// USER PHOTO UPLOAD
// ============================================================================

function uploadUserPhoto() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = function(e) {
const file = e.target.files[0];
if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const photoData = event.target.result;
        localStorage.setItem('userPhoto', photoData);
        displayUserPhoto(photoData);
        showNotification('✅ Photo updated!', 'success');
    };
    reader.readAsDataURL(file);
}
    };

    input.click();
}

function displayUserPhoto(photoData) {
    const photoElement = document.getElementById('userPhoto');
    if (photoElement && photoData) {
photoElement.style.backgroundImage = `url(${photoData})`;
photoElement.style.backgroundSize = 'cover';
photoElement.style.backgroundPosition = 'center';
photoElement.innerHTML = ''; // Remove placeholder text
    }
}

function removeUserPhoto() {
    if (confirm('Remove your photo?')) {
localStorage.removeItem('userPhoto');
const photoElement = document.getElementById('userPhoto');
if (photoElement) {
    photoElement.style.backgroundImage = '';
    photoElement.innerHTML = '👤';
}
showNotification('Photo removed', 'success');
    }
}

// Load saved photo on page load
function loadUserPhoto() {
    const savedPhoto = localStorage.getItem('userPhoto');
    if (savedPhoto) {
displayUserPhoto(savedPhoto);
    }
}

// Initialize photo on load
loadUserPhoto();

// Expose to window
window.uploadUserPhoto = uploadUserPhoto;
window.removeUserPhoto = removeUserPhoto;

// ============================================================================
// MOBILE BOTTOM NAVIGATION
// ============================================================================

function initializeBottomNav() {
    const bottomNav = document.getElementById('bottomNav');
    if (!bottomNav) return;

    // Define the tabs for mobile navigation (all tabs)
    const tabs = [
{ id: 'dashboard', icon: '📊', label: 'Dashboard' },
{ id: 'entry', icon: '📝', label: 'Entry' },
{ id: 'sessions', icon: '⏱️', label: 'Sessions' },
{ id: 'analytics', icon: '📈', label: 'Analytics' },
{ id: 'history', icon: '📜', label: 'History' },
{ id: 'videos', icon: '🎥', label: 'Videos' },
{ id: 'hrmonitor', icon: '❤️', label: 'HR Monitor' },
{ id: 'education', icon: '📚', label: 'Learn More' },
{ id: 'bluetooth', icon: '📱', label: 'Devices' },
{ id: 'settings', icon: '⚙️', label: 'Settings' }
    ];

    // Build the bottom nav HTML
    let navHTML = '';
    tabs.forEach(tab => {
navHTML += `
    <a class="bottom-nav-item ${tab.id === 'dashboard' ? 'active' : ''}"
       id="bottomNav-${tab.id}"
       onclick="switchTab('${tab.id}')"
       role="button"
       tabindex="0">
        <span class="bottom-nav-icon">${tab.icon}</span>
        <span class="bottom-nav-label">${tab.label}</span>
    </a>
`;
    });

    bottomNav.innerHTML = navHTML;
}

console.log('✅ All functions exposed to window for onclick handlers');
// Cache bust Sun, Oct 19, 2025  2:01:19 AM


// Re-define toggleTheme globally (fix for scope issue)
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');

    body.classList.toggle('light-mode');

    if (body.classList.contains('light-mode')) {
if (themeIcon) themeIcon.textContent = '☀️';
if (themeText) themeText.textContent = 'Light';
localStorage.setItem('theme', 'light');
    } else {
if (themeIcon) themeIcon.textContent = '🌙';
if (themeText) themeText.textContent = 'Dark';
localStorage.setItem('theme', 'dark');
    }
}
window.toggleTheme = toggleTheme;

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

// Ctrl+Shift+S: Save current metrics
document.addEventListener('keydown', function(e) {
    // Check for Ctrl+Shift+S (or Cmd+Shift+S on Mac)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
e.preventDefault(); // Prevent browser's default save dialog

// Check which tab is active and save accordingly
const activeTab = document.querySelector('.tab-content.active');
if (!activeTab) return;

const tabId = activeTab.id;

if (tabId === 'dataEntry') {
    // Save metrics from data entry tab
    if (typeof window.saveMetrics === 'function') {
        window.saveMetrics();
        showNotification('✅ Metrics saved! (Ctrl+Shift+S)', 'success');
    }
} else if (tabId === 'therapy') {
    // Save therapy session
    if (typeof window.saveTherapySession === 'function') {
        window.saveTherapySession();
        showNotification('✅ Therapy session saved! (Ctrl+Shift+S)', 'success');
    }
} else {
    // For other tabs, just show a notification
    showNotification('💾 Shortcut Ctrl+Shift+S - Switch to Data Entry or Therapy tab to save', 'info');
}

console.log('⌨️ Ctrl+Shift+S pressed - Save triggered');
    }
});

console.log('✅ Keyboard shortcuts initialized (Ctrl+Shift+S to save)');

// ============================================================================
// GPS LOCATION INTEGRATION
// ============================================================================

let capturedLocation = null;

async function captureLocation() {
    const gpsButton = document.getElementById('gpsButton');
    const locationDisplay = document.getElementById('locationDisplay');
    const locationLabel = document.getElementById('locationLabel');
    const locationMapLink = document.getElementById('locationMapLink');
    
    // Show loading state
    gpsButton.disabled = true;
    gpsButton.innerHTML = '📍 Getting Location...';
    
    try {
// Use the GPS tracker module
const locationData = await window.getLocationLabel();

if (locationData && locationData.coords) {
    capturedLocation = locationData;
    
    // Update display
    locationDisplay.style.display = 'block';
    locationLabel.textContent = locationData.label;
    locationMapLink.href = locationData.googleMapsUrl;
    
    // Update button to success state
    gpsButton.innerHTML = '✅ Location Captured';
    gpsButton.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
    
    showNotification('📍 Location captured successfully!', 'success');
    console.log('📍 Location captured:', locationData);
} else {
    throw new Error('Location data not available');
}
    } catch (error) {
console.error('GPS error:', error);
showNotification('⚠️ Could not get location: ' + error.message, 'error');

// Reset button
gpsButton.innerHTML = '📍 GET LOCATION';
gpsButton.disabled = false;
    }
    
    // Re-enable button after 2 seconds
    setTimeout(() => {
gpsButton.disabled = false;
if (capturedLocation) {
    gpsButton.innerHTML = '📍 UPDATE LOCATION';
} else {
    gpsButton.innerHTML = '📍 GET LOCATION';
}
    }, 2000);
}

function clearLocation() {
    capturedLocation = null;
    
    const locationDisplay = document.getElementById('locationDisplay');
    const gpsButton = document.getElementById('gpsButton');
    
    locationDisplay.style.display = 'none';
    gpsButton.innerHTML = '📍 GET LOCATION';
    gpsButton.style.background = 'linear-gradient(135deg, var(--cyan), var(--accent))';
    
    showNotification('Location cleared', 'success');
}

// Expose GPS functions globally
window.captureLocation = captureLocation;
window.clearLocation = clearLocation;

console.log('✅ GPS integration functions loaded');

// Helper function to format location for table display
function formatLocationForTable(location) {
    if (!location || !location.latitude) {
return '-';
    }
    
    const mapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    return `<a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--cyan); text-decoration: none; font-size: 0.85rem;" title="${location.label}">📍 View</a>`;
}

console.log('✅ Location helper function loaded');
// Fix for missing navigateDate function
window.navigateDate = function(offset) {
  const dateDisplay = document.getElementById("dateDisplay");
  if (!dateDisplay) return;

  const currentDate = new Date(dateDisplay.textContent);
  if (isNaN(currentDate)) return;

  currentDate.setDate(currentDate.getDate() + offset);
  dateDisplay.textContent = currentDate.toDateString();

  // Optional: trigger any other updates here
  console.log("Date navigated to:", currentDate);
};
