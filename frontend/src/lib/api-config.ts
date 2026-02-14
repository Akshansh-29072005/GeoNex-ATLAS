// ============================================
// GLOBAL API CONFIGURATION
// Change this URL when deploying to production
// ============================================

export const API_CONFIG = {
    // Backend API Base URL
    BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080',

    // Python Analysis Service URL
    ANALYSIS_URL: import.meta.env.VITE_ANALYSIS_URL || 'http://localhost:8000',

    // API Prefix
    API_PREFIX: '/api',
} as const;

// Computed full API URL
export const API_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}`;
export const ANALYSIS_API_URL = API_CONFIG.ANALYSIS_URL;
