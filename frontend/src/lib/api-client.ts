import axios from 'axios';
import { API_URL, ANALYSIS_API_URL } from './api-config';
import { useAuthStore } from './store';

// ============================================
// MAIN API CLIENT (Go Backend)
// ============================================
export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().user?.token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 (expired token) globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ============================================
// ANALYSIS API CLIENT (Python Service)
// ============================================
export const analysisApi = axios.create({
    baseURL: ANALYSIS_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ============================================
// AUTH API
// ============================================
// Assuming 'User' type is defined elsewhere or will be added.
// For now, we'll use a placeholder if not defined.
interface User {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    role: string;
    token?: string;
}

export interface LoginResponse {
    token?: string;
    user: User;
    otp_required?: boolean;
}

export interface LoginRequest {
    email?: string;
    phone?: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    email?: string;
    phone?: string;
    password: string;
    role: string;
}

export interface VerifyOTPRequest {
    email?: string;
    phone?: string;
    otp: string;
}

export const authAPI = {
    register: async (data: RegisterRequest): Promise<LoginResponse> => {
        const response = await api.post("/auth/register", data);
        return response.data;
    },
    login: async (data: LoginRequest): Promise<LoginResponse> => {
        const response = await api.post("/auth/login", data);
        return response.data;
    },
    verifyOTP: async (data: VerifyOTPRequest): Promise<LoginResponse> => {
        const response = await api.post("/auth/verify-otp", data);
        return response.data;
    },
};

// ============================================
// PLOTS API
// ============================================
export const plotsAPI = {
    getAll: () => api.get('/plots/'),

    create: (data: {
        location_name: string;
        district: string;
        geojson: string;
    }) => api.post('/plots/register', data),
};

// ============================================
// GIS API
// ============================================
export const gisAPI = {
    getPlotGeojson: () => api.get('/gis/plots'),

    getPlotById: (id: string) => api.get(`/gis/plots/${id}`),

    getPlotsByBounds: (bounds: { min_lat: number; min_lng: number; max_lat: number; max_lng: number }) =>
        api.get('/gis/plots/bounds', { params: bounds }),
};

// ============================================
// VIOLATIONS API
// ============================================
export interface Violation {
    id: string;
    plot_id: string;
    plot?: {
        location_name: string;
        district: string;
    };
    type: string;
    status: string;
    severity: string;
    description: string;
    confidence_score: number;
    image_before_url: string;
    image_after_url: string;
    comparison_image_url?: string;
    detected_at: string;
}

export const violationsAPI = {
    getAll: () => api.get<Violation[]>('/violations/'),

    getByPlot: (plotId: string) => api.get<Violation[]>(`/violations/plot/${plotId}`),

    create: (data: {
        plot_id: string;
        type: string;
        severity: string;
        description: string;
        confidence_score: number;
        image_before_url: string;
        image_after_url: string;
        comparison_image_url?: string;
    }) => api.post('/violations/', data),

    updateStatus: (id: string, status: string) =>
        api.patch(`/violations/${id}/status`, { status }),

    downloadReport: (id: string) =>
        api.get(`/reports/violation/${id}/pdf`, { responseType: 'blob' }),

    assignOfficer: (id: string, officerId: string) => api.post(`/violations/${id}/assign`, { officer_id: officerId }),
    generateNotice: (id: string) => api.post(`/violations/${id}/notice`),
    verify: (id: string) => api.post(`/violations/${id}/verify`),
    closeCase: (id: string) => api.post(`/violations/${id}/close`),
};

// ============================================
// NOTIFICATIONS API
// ============================================
export const notificationsAPI = {
    getMine: () => api.get('/notifications/'),

    markRead: (id: string) => api.patch(`/notifications/${id}/read`),
};

// ============================================
// ANALYSIS API (Python Service)
// ============================================
export const analysisAPI = {
    analyzeNDVI: (data: { red_band_url: string; nir_band_url: string; plot_id: string }) =>
        analysisApi.post('/analyze/ndvi', data),

    compareImages: (data: { reference_url: string; latest_url: string; plot_id: string }) =>
        analysisApi.post('/analyze/compare', data),

    fetchSentinel: (plotId: string, bbox: string) =>
        analysisApi.post(`/analyze/sentinel/fetch?plot_id=${plotId}&bbox=${bbox}`),
};

// ============================================
// ADMIN API
// ============================================
// ============================================
// ALLOTMENTS API
// ============================================
export const allotmentsAPI = {
    apply: (data: { plot_id: string; documents_json: string; applicant_details: string }) => api.post('/allotments/apply', data),
    getMy: () => api.get('/allotments/my'),
    getAll: () => api.get('/admin/allotments/'), // Admin
    updateStatus: (id: string, status: string, review_notes: string) => api.patch(`/admin/allotments/${id}/status`, { status, review_notes }),
};

// ============================================
// REPORTS API
// ============================================
export interface ComplianceStats {
    total_checks: number;
    compliant_units: number;
    near_deadline: number;
    overdue_checks: number;
    violation_by_type: Record<string, number>;
}

export interface ComplianceItem {
    plot_id: string;
    owner_name: string;
    risk_factor: string;
    compliance_score: number;
    deadline: string;
    days_left: number;
    status: string;
    last_inspected: string;
    violation_type?: string;
    violation_desc?: string;
    reported_by?: string;
}

export const reportsAPI = {
    getStats: () => api.get<ComplianceStats>('/reports/compliance/stats'),
    getChecklist: () => api.get<ComplianceItem[]>('/reports/compliance/checklist'),
};

// ============================================
// ADMIN API
// ============================================
export const adminAPI = {
    getStats: () => api.get('/admin/stats'),
    getAllUsers: () => api.get('/admin/users'),
};
