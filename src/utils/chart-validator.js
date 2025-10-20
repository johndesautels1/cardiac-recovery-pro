// ============================================================================
// CHART VALIDATION & PLACEHOLDER HANDLER
// ============================================================================
// Ensures charts only render when data is available
// Shows helpful placeholders when data is missing
// Last Updated: Oct 20, 2025

console.log('📊 Chart Validator Module Loading...');

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

function hasPatientProfile() {
    const patientName = localStorage.getItem('patientName');
    const age = localStorage.getItem('patientAge');
    const sex = localStorage.getItem('patientSex');

    return !!(patientName && age && sex);
}

function hasSurgeryDate() {
    const surgeryDate = localStorage.getItem('surgeryDate');
    return !!surgeryDate;
}

function hasAnyData() {
    const allData = localStorage.getItem('cardiacRecoveryData');
    if (!allData) return false;

    try {
        const data = JSON.parse(allData);
        return Object.keys(data).length > 0;
    } catch (e) {
        return false;
    }
}

function hasMinimumDataForCharts() {
    return hasPatientProfile() && hasSurgeryDate() && hasAnyData();
}

// ============================================================================
// PLACEHOLDER DISPLAY
// ============================================================================

function showChartPlaceholder(canvasId, message = null) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !canvas.parentElement) return;

    // Hide the canvas
    canvas.style.display = 'none';

    // Check if placeholder already exists
    let placeholder = canvas.parentElement.querySelector('.chart-placeholder');
    if (placeholder) {
        placeholder.remove();
    }

    // Create placeholder
    placeholder = document.createElement('div');
    placeholder.className = 'chart-placeholder';
    placeholder.style.cssText = `
        padding: 60px 20px;
        text-align: center;
        background: linear-gradient(135deg, rgba(96,165,250,0.05) 0%, rgba(147,51,234,0.05) 100%);
        border: 2px dashed var(--muted);
        border-radius: 12px;
        margin: 20px 0;
        min-height: 250px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    `;

    // Determine what's missing
    let icon = '📊';
    let title = 'Chart Not Available';
    let description = message || 'Complete your profile to see this chart';
    let actionItems = [];

    if (!hasPatientProfile()) {
        icon = '👤';
        title = 'Complete Your Profile';
        description = 'Enter your basic information to see personalized charts';
        actionItems = ['Name', 'Age', 'Sex', 'Height', 'Weight'];
    } else if (!hasSurgeryDate()) {
        icon = '📅';
        title = 'Set Your Surgery Date';
        description = 'Enter your surgery date to track recovery progress over time';
        actionItems = ['Surgery Date'];
    } else if (!hasAnyData()) {
        icon = '📝';
        title = 'Log Your First Entry';
        description = 'Start tracking your vitals and activities to see charts';
        actionItems = ['Go to Data Entry tab', 'Enter your daily metrics'];
    }

    let html = `
        <div style="font-size: 4rem; margin-bottom: 15px; opacity: 0.7;">
            ${icon}
        </div>
        <div style="font-size: 1.3rem; font-weight: 700; color: var(--text); margin-bottom: 10px;">
            ${title}
        </div>
        <div style="font-size: 1rem; color: var(--muted); margin-bottom: 20px; max-width: 400px;">
            ${description}
        </div>
    `;

    if (actionItems.length > 0) {
        html += `
            <div style="background: var(--card); padding: 15px; border-radius: 8px; text-align: left; max-width: 300px;">
                <div style="font-weight: 600; margin-bottom: 8px; font-size: 0.9rem;">Missing:</div>
                <ul style="margin: 0; padding-left: 20px; font-size: 0.9rem;">
                    ${actionItems.map(item => `<li style="margin-bottom: 4px;">${item}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    placeholder.innerHTML = html;
    canvas.parentElement.appendChild(placeholder);

    console.log(`📊 Placeholder shown for ${canvasId}:`, title);
}

// ============================================================================
// VALIDATE BEFORE CHART RENDER
// ============================================================================

function validateChartData(canvasId, chartName, customMessage = null) {
    if (!hasMinimumDataForCharts()) {
        showChartPlaceholder(canvasId, customMessage);
        return false; // Don't render chart
    }

    // Remove any existing placeholder
    const canvas = document.getElementById(canvasId);
    if (canvas && canvas.parentElement) {
        const placeholder = canvas.parentElement.querySelector('.chart-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        canvas.style.display = 'block';
    }

    return true; // OK to render chart
}

// ============================================================================
// CHECK ALL CHARTS ON PAGE
// ============================================================================

function validateAllCharts() {
    const chartIds = [
        'progressChart',
        'metricsChart',
        'hrvChart',
        'radarChart',
        'riskChart',
        'recoveryProgressChart',
        'crpsTrendChart',
        'metsChart',
        'hrZoneChart',
        'hrChart'
    ];

    let validCharts = 0;
    let totalCharts = 0;

    chartIds.forEach(canvasId => {
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            totalCharts++;
            if (hasMinimumDataForCharts()) {
                validCharts++;
            } else {
                showChartPlaceholder(canvasId);
            }
        }
    });

    console.log(`📊 Chart validation: ${validCharts}/${totalCharts} charts have sufficient data`);

    return {
        valid: validCharts,
        total: totalCharts,
        hasData: hasMinimumDataForCharts()
    };
}

// ============================================================================
// SAFE CHART WRAPPER
// ============================================================================

function safeRenderChart(canvasId, chartName, renderFunction) {
    try {
        if (!validateChartData(canvasId, chartName)) {
            console.log(`⏭️ Skipping ${chartName}: insufficient data`);
            return null;
        }

        return renderFunction();
    } catch (error) {
        console.error(`❌ Error rendering ${chartName}:`, error);
        showChartPlaceholder(canvasId, `Error loading ${chartName}. Check console for details.`);
        return null;
    }
}

// ============================================================================
// INITIALIZE
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
    console.log('📊 Chart Validator: DOM ready');

    // Initial validation after short delay to let other modules load
    setTimeout(() => {
        const status = validateAllCharts();

        if (!status.hasData) {
            console.log('⚠️ Missing data for charts. Showing placeholders.');
        } else {
            console.log('✅ Sufficient data for charts');
        }
    }, 2000);
});

// Listen for data changes
window.addEventListener('storage', (e) => {
    if (e.key === 'cardiacRecoveryData' || e.key === 'surgeryDate' || e.key === 'patientName') {
        console.log('📊 Data changed, revalidating charts...');
        setTimeout(validateAllCharts, 500);
    }
});

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

window.hasPatientProfile = hasPatientProfile;
window.hasSurgeryDate = hasSurgeryDate;
window.hasAnyData = hasAnyData;
window.hasMinimumDataForCharts = hasMinimumDataForCharts;
window.validateChartData = validateChartData;
window.showChartPlaceholder = showChartPlaceholder;
window.validateAllCharts = validateAllCharts;
window.safeRenderChart = safeRenderChart;

console.log('✅ Chart Validator Module Loaded');
