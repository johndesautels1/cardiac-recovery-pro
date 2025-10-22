// src/utils/date-utils.js

/**
 * Utility functions for date formatting and calculations.
 */

/**
 * Format a date to a readable string.
 * @param {Date} date - The date to format.
 * @returns {string} - Formatted date string.
 */
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * Get the current date formatted.
 * @returns {string} - Formatted current date string.
 */
function getCurrentDate() {
    return formatDate(new Date());
}

/**
 * Calculate the recovery timeline based on surgery date.
 * @param {Date} surgeryDate - The date of the surgery.
 * @returns {string} - Recovery timeline message.
 */
function calculateRecoveryTimeline(surgeryDate) {
    const recoveryDays = 30; // Example recovery period
    const recoveryDate = new Date(surgeryDate);
    recoveryDate.setDate(recoveryDate.getDate() + recoveryDays);
    return `Expected recovery date: ${formatDate(recoveryDate)}`;
}

// Exporting functions for external use
module.exports = {
    formatDate,
    getCurrentDate,
    calculateRecoveryTimeline,
};
