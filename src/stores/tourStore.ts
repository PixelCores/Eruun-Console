import { create } from 'zustand';

interface TourState {
    /** 引导是否正在进行 */
    isActive: boolean;
    /** 当前步骤索引 */
    currentStep: number;
    /** 用户是否已完成/跳过过引导 */
    hasCompleted: boolean;
    /** 启动引导 */
    startTour: () => void;
    /** 下一步 */
    nextStep: () => void;
    /** 上一步 */
    prevStep: () => void;
    /** 跳过引导 */
    skipTour: () => void;
    /** 完成引导 */
    completeTour: () => void;
    /** 重置引导（清除已完成标记） */
    resetTour: () => void;
}

const STORAGE_KEY = 'eruun_tour_completed';

const loadCompleted = (): boolean => {
    try {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
};

const persistCompleted = (completed: boolean) => {
    try {
        localStorage.setItem(STORAGE_KEY, String(completed));
    } catch {
        // Silently ignore storage errors
    }
};

export const useTourStore = create<TourState>((set) => ({
    isActive: false,
    currentStep: 0,
    hasCompleted: loadCompleted(),

    startTour: () => set({
        isActive: true,
        currentStep: 0,
    }),

    nextStep: () => set((state) => ({
        currentStep: state.currentStep + 1,
    })),

    prevStep: () => set((state) => ({
        currentStep: Math.max(0, state.currentStep - 1),
    })),

    skipTour: () => {
        persistCompleted(true);
        set({
            isActive: false,
            currentStep: 0,
            hasCompleted: true,
        });
    },

    completeTour: () => {
        persistCompleted(true);
        set({
            isActive: false,
            currentStep: 0,
            hasCompleted: true,
        });
    },

    resetTour: () => {
        persistCompleted(false);
        set({
            hasCompleted: false,
        });
    },
}));
