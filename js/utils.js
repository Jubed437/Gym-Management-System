/**
 * Logging Utility
 * Centralizes logging to console with timestamps and levels.
 */
const Logger = {
    info: (message, data = null) => {
        const timestamp = new Date().toISOString();
        console.log(`[INFO] [${timestamp}] ${message}`, data || '');
    },
    warn: (message, data = null) => {
        const timestamp = new Date().toISOString();
        console.warn(`[WARN] [${timestamp}] ${message}`, data || '');
    },
    error: (message, error = null) => {
        const timestamp = new Date().toISOString();
        console.error(`[ERROR] [${timestamp}] ${message}`, error || '');
    }
};

/**
 * Helper to show alerts (can be replaced with a custom UI modal later)
 */
function showAlert(message, type = 'info') {
    alert(message); // Simple alert for now
    Logger.info(`Alert shown: ${message} (${type})`);
}

/**
 * Get URL Parameters
 */
function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}
