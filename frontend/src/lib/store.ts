import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: 'ADMIN' | 'SUPER_ADMIN' | 'INSPECTOR' | 'INDUSTRY_OWNER';
    token?: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    login: (user: User) => void;
    logout: () => void;
}

interface UIState {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    theme: 'light' | 'dark' | 'system';
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            login: (user) => {
                console.log("[AuthStore] Logging in user:", user);
                set({ user, isAuthenticated: true });
            },
            logout: () => {
                console.log("[AuthStore] Logging out");
                set({ user: null, isAuthenticated: false });
            },
        }),
        {
            name: 'auth-storage',
        }
    )
);

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            isSidebarOpen: true,
            toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
            theme: 'system',
            setTheme: (theme) => set({ theme }),
        }),
        {
            name: 'ui-storage',
        }
    )
);
