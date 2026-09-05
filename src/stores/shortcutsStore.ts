import { create } from 'zustand';

export interface Shortcut {
    id: string;
    name: string;
    description: string;
    keys: string[]; // e.g. ['meta+k', '/']
    defaultKeys: string[];
    category: 'Global' | 'Flow Canvas';
    enabled: boolean;
}

interface ShortcutsState {
    shortcuts: Shortcut[];
    shortcutsEnabled: boolean;
    updateShortcutKeys: (id: string, newKeys: string[]) => void;
    toggleShortcut: (id: string) => void;
    resetAllShortcuts: () => void;
    setShortcutsEnabled: (enabled: boolean) => void;
}

const DEFAULT_SHORTCUTS: Omit<Shortcut, 'keys' | 'enabled'>[] = [
    {
        id: 'open-search',
        name: '打开搜索命令行',
        description: 'Open the search command palette anywhere in the console',
        defaultKeys: ['meta+k', 'ctrl+k', '/'],
        category: 'Global'
    },
    {
        id: 'save-flow',
        name: '保存流程图',
        description: 'Save the current workflow design scheme',
        defaultKeys: ['meta+s', 'ctrl+s'],
        category: 'Flow Canvas'
    },
    {
        id: 'delete-element',
        name: '删除画布节点',
        description: 'Delete selected nodes or connection edges in workflow canvas',
        defaultKeys: ['delete', 'backspace'],
        category: 'Flow Canvas'
    },
    {
        id: 'copy-node',
        name: '复制画布节点',
        description: 'Copy selected workflow canvas nodes',
        defaultKeys: ['meta+c', 'ctrl+c'],
        category: 'Flow Canvas'
    },
    {
        id: 'paste-node',
        name: '粘贴画布节点',
        description: 'Paste copied workflow canvas nodes',
        defaultKeys: ['meta+v', 'ctrl+v'],
        category: 'Flow Canvas'
    }
];

const loadShortcuts = (): Shortcut[] => {
    try {
        const saved = localStorage.getItem('eruun_shortcuts');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                return DEFAULT_SHORTCUTS.map(def => {
                    const existing = parsed.find((p: any) => p.id === def.id);
                    return {
                        ...def,
                        keys: existing && existing.keys ? existing.keys : [...def.defaultKeys],
                        enabled: existing ? existing.enabled !== false : true
                    };
                });
            }
        }
    } catch (e) {
        console.error('Failed to load shortcuts:', e);
    }
    return DEFAULT_SHORTCUTS.map(def => ({
        ...def,
        keys: [...def.defaultKeys],
        enabled: true
    }));
};

const loadGlobalEnabled = (): boolean => {
    try {
        const saved = localStorage.getItem('eruun_shortcuts_enabled');
        return saved === null ? true : saved === 'true';
    } catch {
        return true;
    }
};

export const useShortcutsStore = create<ShortcutsState>((set) => ({
    shortcuts: loadShortcuts(),
    shortcutsEnabled: loadGlobalEnabled(),

    updateShortcutKeys: (id, newKeys) => set((state) => {
        const updated = state.shortcuts.map(s => s.id === id ? { ...s, keys: newKeys } : s);
        localStorage.setItem('eruun_shortcuts', JSON.stringify(updated));
        return { shortcuts: updated };
    }),

    toggleShortcut: (id) => set((state) => {
        const updated = state.shortcuts.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s);
        localStorage.setItem('eruun_shortcuts', JSON.stringify(updated));
        return { shortcuts: updated };
    }),

    resetAllShortcuts: () => set(() => {
        const reset = DEFAULT_SHORTCUTS.map(def => ({
            ...def,
            keys: [...def.defaultKeys],
            enabled: true
        }));
        localStorage.setItem('eruun_shortcuts', JSON.stringify(reset));
        return { shortcuts: reset };
    }),

    setShortcutsEnabled: (enabled) => set(() => {
        localStorage.setItem('eruun_shortcuts_enabled', String(enabled));
        return { shortcutsEnabled: enabled };
    }),
}));

export const matchesShortcut = (e: KeyboardEvent, keysList: string[]): boolean => {
    const pressedKey = e.key.toLowerCase();
    const isMeta = e.metaKey;
    const isCtrl = e.ctrlKey;
    const isShift = e.shiftKey;
    const isAlt = e.altKey;

    for (const shortcutStr of keysList) {
        const parts = shortcutStr.toLowerCase().split('+');
        const mainKey = parts[parts.length - 1];

        // Check modifiers
        const needMeta = parts.includes('meta') || parts.includes('cmd') || parts.includes('command');
        const needCtrl = parts.includes('ctrl') || parts.includes('control');
        const needShift = parts.includes('shift');
        const needAlt = parts.includes('alt');

        const metaMatch = isMeta === needMeta;
        const ctrlMatch = isCtrl === needCtrl;
        const shiftMatch = isShift === needShift;
        const altMatch = isAlt === needAlt;

        let keyMatch = false;
        if (mainKey === 'delete') {
            keyMatch = pressedKey === 'delete';
        } else if (mainKey === 'backspace') {
            keyMatch = pressedKey === 'backspace';
        } else if (mainKey === 'esc' || mainKey === 'escape') {
            keyMatch = pressedKey === 'escape' || pressedKey === 'esc';
        } else if (mainKey === 'space') {
            keyMatch = pressedKey === ' ' || pressedKey === 'spacebar';
        } else {
            keyMatch = pressedKey === mainKey;
        }

        if (metaMatch && ctrlMatch && shiftMatch && altMatch && keyMatch) {
            return true;
        }
    }
    return false;
};

export const getShortcutDisplay = (shortcutStr: string): string[] => {
    const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent || navigator.platform || '');
    const parts = shortcutStr.split('+');
    return parts.map(part => {
        const p = part.toLowerCase();
        if (p === 'meta' || p === 'cmd' || p === 'command') return isMac ? '⌘' : 'Win';
        if (p === 'ctrl' || p === 'control') return isMac ? '⌃' : 'Ctrl';
        if (p === 'shift') return isMac ? '⇧' : 'Shift';
        if (p === 'alt') return isMac ? '⌥' : 'Alt';
        if (p === 'backspace') return '⌫';
        if (p === 'delete') return 'Del';
        if (p === 'escape' || p === 'esc') return 'Esc';
        return part.toUpperCase();
    });
};
