import { create } from 'zustand';
import {
    fetchSettings,
    createSetting,
    updateSetting,
    deleteSetting
} from '../api/settings';

export type Locale = 'zh-CN' | 'en';
export type RuntimeEnvironment = 'production' | 'test';
export type TimeZoneOffset = number;

export const DEFAULT_TIME_ZONE: TimeZoneOffset = 8;
export const TIME_ZONE_OPTIONS: TimeZoneOffset[] = Array.from(
    { length: 27 },
    (_, index) => index - 12,
);

export const formatTimeZoneOffset = (timeZone: TimeZoneOffset) => (
    timeZone === 0 ? 'UTC' : `UTC${timeZone > 0 ? '+' : ''}${timeZone}`
);

export const getIntlTimeZone = (timeZone: TimeZoneOffset) => (
    timeZone === 0 ? 'UTC' : `Etc/GMT${timeZone > 0 ? '-' : '+'}${Math.abs(timeZone)}`
);

interface Settings {
    projectName: string;
    namespace: string;
    cpuLimit: string;
    memoryLimit: string;
    apiBaseUrl: string;
    autoRefreshInterval: number;
    enableMockServer: boolean;
    locale: Locale;
    environment: RuntimeEnvironment;
    timeZone: TimeZoneOffset;
    hiddenDashboardMetrics: string[];
}

interface SettingsState extends Settings {
    serverSettings: Record<string, any>;
    serverSettingsLoaded: Record<string, boolean>;
    isLoading: boolean;
    error: string | null;
    updateSettings: (updates: Partial<Settings>) => void;
    fetchServerSettings: () => Promise<void>;
    saveServerSetting: (type: string, value: any) => Promise<void>;
    deleteServerSetting: (type: string) => Promise<void>;
}

const getDefaultLocale = (): Locale => {
    if (typeof navigator === 'undefined') return 'en';
    return navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
};

const DEFAULT_SETTINGS: Settings = {
    projectName: 'Eruun-Cli',
    namespace: 'default',
    cpuLimit: '1000m',
    memoryLimit: '1024Mi',
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
    autoRefreshInterval: 10,
    enableMockServer: true,
    locale: getDefaultLocale(),
    environment: 'production',
    timeZone: DEFAULT_TIME_ZONE,
    hiddenDashboardMetrics: [],
};

const STORAGE_KEY = 'eruun_settings';

const loadSettings = (): Settings => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
            const parsed = JSON.parse(saved) as Partial<Settings>;
            return {
                ...DEFAULT_SETTINGS,
                ...parsed,
                locale: parsed.locale === 'zh-CN' || parsed.locale === 'en'
                    ? parsed.locale
                    : DEFAULT_SETTINGS.locale,
                environment: parsed.environment === 'test' || parsed.environment === 'production'
                    ? parsed.environment
                    : DEFAULT_SETTINGS.environment,
                timeZone: typeof parsed.timeZone === 'number'
                    && Number.isInteger(parsed.timeZone)
                    && parsed.timeZone >= -12
                    && parsed.timeZone <= 14
                    ? parsed.timeZone
                    : DEFAULT_SETTINGS.timeZone,
                hiddenDashboardMetrics: Array.isArray(parsed.hiddenDashboardMetrics)
                    ? parsed.hiddenDashboardMetrics.filter((key): key is string => typeof key === 'string')
                    : DEFAULT_SETTINGS.hiddenDashboardMetrics,
            };
        }
    } catch (e) {
        console.error('Failed to load settings:', e);
    }
    return DEFAULT_SETTINGS;
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
    ...loadSettings(),
    serverSettings: {},
    serverSettingsLoaded: {},
    isLoading: false,
    error: null,
    updateSettings: (updates) => set((state) => {
        const newState = { ...state, ...updates };
        // Exclude helper functions and server state from localStorage saving
        const {
            updateSettings,
            fetchServerSettings,
            saveServerSetting,
            deleteServerSetting,
            serverSettings,
            serverSettingsLoaded,
            isLoading,
            error,
            ...dataToSave
        } = newState;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        return updates;
    }),
    fetchServerSettings: async () => {
        set({ isLoading: true, error: null });
        try {
            const settings = await fetchSettings();
            const serverSettings: Record<string, any> = {};
            const serverSettingsLoaded: Record<string, boolean> = {};
            settings.forEach((item) => {
                serverSettings[item.type] = item.value;
                serverSettingsLoaded[item.type] = true;
            });
            set({ serverSettings, serverSettingsLoaded, isLoading: false });
        } catch (err: any) {
            set({ error: err.message || 'Failed to fetch server settings', isLoading: false });
        }
    },
    saveServerSetting: async (type, value) => {
        set({ isLoading: true, error: null });
        try {
            const isLoaded = !!get().serverSettingsLoaded[type];
            if (isLoaded) {
                await updateSetting(type, value);
            } else {
                await createSetting(type, value);
            }
            set((state) => ({
                serverSettings: { ...state.serverSettings, [type]: value },
                serverSettingsLoaded: { ...state.serverSettingsLoaded, [type]: true },
                isLoading: false,
            }));
        } catch (err: any) {
            set({ error: err.message || 'Failed to save server setting', isLoading: false });
            throw err;
        }
    },
    deleteServerSetting: async (type) => {
        set({ isLoading: true, error: null });
        try {
            await deleteSetting(type);
            set((state) => {
                const nextSettings = { ...state.serverSettings };
                const nextLoaded = { ...state.serverSettingsLoaded };
                delete nextSettings[type];
                delete nextLoaded[type];
                return {
                    serverSettings: nextSettings,
                    serverSettingsLoaded: nextLoaded,
                    isLoading: false,
                };
            });
        } catch (err: any) {
            set({ error: err.message || 'Failed to delete server setting', isLoading: false });
            throw err;
        }
    },
}));
