import { create } from 'zustand';

interface UIState {
    isSearchOpen: boolean;
    setSearchOpen: (isOpen: boolean) => void;
    toggleSearch: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    isSearchOpen: false,
    setSearchOpen: (isOpen) => set({ isSearchOpen: isOpen }),
    toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
}));
