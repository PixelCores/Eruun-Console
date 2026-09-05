import { create } from 'zustand';
import { getPaaSApi } from '../api/paasAuth';
import { useAuthStore } from './authStore';

export interface Tenant {
    id: string;
    name: string;
    description?: string;
    ownerId: string;
    role: 'owner' | 'admin' | 'member';
    createdAt: number;
}

interface TenantListResponse {
    tenants: Tenant[];
}

interface TenantState {
    tenants: Tenant[];
    /** The tenant new resources are deployed into (personal workspace first). */
    currentTenantId: string | null;
    loaded: boolean;
    loading: boolean;
    loadTenants: () => Promise<void>;
    setCurrentTenant: (tenantId: string) => void;
}

export const useTenantStore = create<TenantState>((set, get) => ({
    tenants: [],
    currentTenantId: null,
    loaded: false,
    loading: false,
    loadTenants: async () => {
        const accessToken = useAuthStore.getState().session?.accessToken;
        if (!accessToken || get().loading) return;

        set({ loading: true });
        try {
            const response = await getPaaSApi<TenantListResponse>('/tenants', accessToken);
            const tenants = response.tenants ?? [];
            set((state) => {
                const stillValid = tenants.some((t) => t.id === state.currentTenantId);
                // Prefer the personal workspace (owned tenant) as the default.
                const preferred = tenants.find((t) => t.role === 'owner') ?? tenants[0];
                return {
                    tenants,
                    loaded: true,
                    loading: false,
                    currentTenantId: stillValid ? state.currentTenantId : preferred?.id ?? null,
                };
            });
        } catch (error) {
            console.error('Failed to load tenants:', error);
            set({ loading: false, loaded: true });
        }
    },
    setCurrentTenant: (tenantId) => set({ currentTenantId: tenantId }),
}));
