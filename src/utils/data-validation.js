// ============================================================================
// ENHANCED DATA VALIDATION MODULE
// ============================================================================
// Prevents invalid data entry with real-time feedback
// Last Updated: Oct 20, 2025

console.log('🛡️ Data Validation Module Loading...');

// ============================================================================
// VALIDATION RULES
// ============================================================================

const VALIDATION_RULES = {
    heartRate: {
        min: 30,
        max: 220,
        unit: 'bpm',
        errorMsg: 'Heart rate must be between 30-220 bpm'
    },
    bloodPressureSystolic: {
        min: 70,
        max: 250,
        unit: 'mmHg',
        errorMsg: 'Systolic BP must be between 70-250 mmHg'
    },
    bloodPressureDiastolic: {
        min: 40,
        max: 150,
        unit: 'mmHg',
        errorMsg: 'Diastolic BP must be between 40-150 mmHg'
    },
    oxygenSaturation: {
        min: 70,
        max: 100,
        unit: '%',
        errorMsg: 'Oxygen saturation must be between 70-100%'
    },
    weight: {
        min: 50,
        max: 500,
        unit: 'lbs',
        errorMsg: 'Weight must be between 50-500 lbs'
    },
    height: {
        min: 48,
        max: 96,
        unit: 'inches',
        errorMsg: 'Height must be between 48-96 inches (4-8 feet)'
    },
    age: {
        min: 18,
        max: 120,
        unit: 'years',
        errorMsg: 'Age must be between 18-120 years'
    },
    distance: {
        min: 0,
        max: 100,
        unit: 'miles',
        errorMsg: 'Distance must be between 0-100 miles'
    },
    duration: {
        min: 0,
        max: 600,
        unit: 'minutes',
        errorMsg: 'Duration must be between 0-600 minutes (10 hours)'
    },
    mets: {
        min: 0,
        max: 20,
        unit: 'METs',
        errorMsg: 'METs must be between 0-20'
    },
    rpe: {
        min: 6,
        max: 20,
        unit: '',
        errorMsg: 'RPE (Rate of Perceived Exertion) must be between 6-20'
    },
    temperature: {
        min: 95,
        max: 106,
        unit: '°F',
        errorMsg: 'Temperature must be between 95-106°F'
    }
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

function validateValue(value, fieldName) {
    const rule = VALIDATION_RULES[fieldName];
    if (!rule) {
        console.warn(`No validation rule for field: ${fieldName}`);
        return { valid: true, value: parseFloat(value) };
    }

    const numValue = parseFloat(value);

    // Check if it's a valid number
    if (isNaN(numValue)) {
        return {
            valid: false,
            error: `Please enter a valid number for ${fieldName}`
        };
    }

    // Check range
    if (numValue < rule.min || numValue > rule.max) {
        return {
            valid: false,
            error: rule.errorMsg
        };
    }

    return {
        valid: true,
        value: numValue
    };
}

function validateBloodPressure(systolic, diastolic) {
    const sysResult = validateValue(systolic, 'bloodPressureSystolic');
    const diaResult = validateValue(diastolic, 'bloodPressureDiastolic');

    if (!sysResult.valid) return sysResult;
    if (!diaResult.valid) return diaResult;

    // Additional check: systolic should be higher than diastolic
    if (sysResult.value <= diaResult.value) {
        return {
            valid: false,
            error: 'Systolic BP must be higher than Diastolic BP'
        };
    }

    return { valid: true };
}

// ============================================================================
// INPUT FIELD ENHANCEMENT
// ============================================================================

function attachValidationToInput(inputElement, fieldName) {
    if (!inputElement) return;

    const rule = VALIDATION_RULES[fieldName];
    if (!rule) return;

    // Set input attributes
    inputElement.setAttribute('min', rule.min);
    inputElement.setAttribute('max', rule.max);
    inputElement.setAttribute('step', 'any');
    inputElement.setAttribute('type', 'number');

    // Create error message element
    let errorDiv = inputElement.parentElement.querySelector('.validation-error');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'validation-error';
        errorDiv.style.cssText = 'color: #ef4444; font-size: 0.85rem; margin-top: 4px; display: none;';
        inputElement.parentElement.appendChild(errorDiv);
    }

    // Add validation on blur (when user leaves field)
    inputElement.addEventListener('blur', function() {
        const result = validateValue(this.value, fieldName);

        if (!result.valid && this.value !== '') {
            errorDiv.textContent = result.error;
            errorDiv.style.display = 'block';
            this.style.borderColor = '#ef4444';
            this.style.backgroundColor = '#fee2e2';
        } else {
            errorDiv.style.display = 'none';
            this.style.borderColor = '';
            this.style.backgroundColor = '';
        }
    });

    // Add real-time feedback on input
    inputElement.addEventListener('input', function() {
        const numValue = parseFloat(this.value);
        if (isNaN(numValue)) return;

        // Visual feedback if out of range
        if (numValue < rule.min || numValue > rule.max) {
            this.style.borderColor = '#f59e0b'; // Orange warning
        } else {
            this.style.borderColor = '#10b981'; // Green good
        }
    });
}

// ============================================================================
// INITIALIZE VALIDATION FOR ALL INPUTS
// ============================================================================

function initializeDataValidation() {
    console.log('🛡️ Initializing data validation...');

    // Map input IDs to validation rules
    const inputMappings = {
        'heartRate': 'heartRate',
        'restingHR': 'heartRate',
        'maxHR': 'heartRate',
        'avgHeartRate': 'heartRate',
        'systolic': 'bloodPressureSystolic',
        'diastolic': 'bloodPressureDiastolic',
        'oxygenSaturation': 'oxygenSaturation',
        'spo2': 'oxygenSaturation',
        'weight': 'weight',
        'height': 'height',
        'age': 'age',
        'distance': 'distance',
        'duration': 'duration',
        'mets': 'mets',
        'rpe': 'rpe',
        'bodyTemp': 'temperature'
    };

    // Attach validation to each input
    Object.entries(inputMappings).forEach(([inputId, ruleName]) => {
        const input = document.getElementById(inputId);
        if (input) {
            attachValidationToInput(input, ruleName);
        }
    });

    // Special handling for blood pressure (both systolic and diastolic together)
    const systolicInput = document.getElementById('systolic');
    const diastolicInput = document.getElementById('diastolic');

    if (systolicInput && diastolicInput) {
        const validateBP = () => {
            if (systolicInput.value && diastolicInput.value) {
                const result = validateBloodPressure(systolicInput.value, diastolicInput.value);

                const errorDiv = systolicInput.parentElement.querySelector('.validation-error') ||
                                diastolicInput.parentElement.querySelector('.validation-error');

                if (errorDiv && !result.valid) {
                    errorDiv.textContent = result.error;
                    errorDiv.style.display = 'block';
                }
            }
        };

        systolicInput.addEventListener('blur', validateBP);
        diastolicInput.addEventListener('blur', validateBP);
    }

    console.log('✅ Data validation initialized for', Object.keys(inputMappings).length, 'fields');
}

// ============================================================================
// FORM SUBMISSION VALIDATION
// ============================================================================

function validateFormBeforeSubmit() {
    const errors = [];

    // Get all inputs with validation rules
    const inputMappings = {
        'heartRate': 'heartRate',
        'restingHR': 'heartRate',
        'maxHR': 'heartRate',
        'systolic': 'bloodPressureSystolic',
        'diastolic': 'bloodPressureDiastolic',
        'oxygenSaturation': 'oxygenSaturation',
        'weight': 'weight',
        'distance': 'distance',
        'duration': 'duration'
    };

    Object.entries(inputMappings).forEach(([inputId, ruleName]) => {
        const input = document.getElementById(inputId);
        if (input && input.value) {
            const result = validateValue(input.value, ruleName);
            if (!result.valid) {
                errors.push(`${inputId}: ${result.error}`);
            }
        }
    });

    // Validate blood pressure pair
    const systolic = document.getElementById('systolic');
    const diastolic = document.getElementById('diastolic');
    if (systolic?.value && diastolic?.value) {
        const bpResult = validateBloodPressure(systolic.value, diastolic.value);
        if (!bpResult.valid) {
            errors.push(bpResult.error);
        }
    }

    if (errors.length > 0) {
        return {
            valid: false,
            errors: errors
        };
    }

    return { valid: true };
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

window.validateValue = validateValue;
window.validateBloodPressure = validateBloodPressure;
window.validateFormBeforeSubmit = validateFormBeforeSubmit;
window.initializeDataValidation = initializeDataValidation;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDataValidation);
} else {
    initializeDataValidation();
}

console.log('✅ Data Validation Module Loaded');
