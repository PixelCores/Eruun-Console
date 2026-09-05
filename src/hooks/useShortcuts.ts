import { useEffect } from 'react';
import { useFlowStore } from '../stores/flowStore';
import { isEventTargetInputArea } from '../utils/keyboard';
import { useShortcutsStore, matchesShortcut } from '../stores/shortcutsStore';

export const useShortcuts = () => {
    const { deleteSelectedElements, copyNode, pasteNode, isPreviewMode } = useFlowStore();
    const { shortcuts, shortcutsEnabled } = useShortcutsStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Block all shortcuts if disabled globally or in preview mode
            if (!shortcutsEnabled || isPreviewMode) return;

            if (isEventTargetInputArea(e.target as HTMLElement)) {
                return;
            }

            // Find config for each shortcut
            const deleteShortcut = shortcuts.find(s => s.id === 'delete-element');
            if (deleteShortcut?.enabled && matchesShortcut(e, deleteShortcut.keys)) {
                e.preventDefault();
                deleteSelectedElements();
            }

            const copyShortcut = shortcuts.find(s => s.id === 'copy-node');
            if (copyShortcut?.enabled && matchesShortcut(e, copyShortcut.keys)) {
                e.preventDefault();
                copyNode();
            }

            const pasteShortcut = shortcuts.find(s => s.id === 'paste-node');
            if (pasteShortcut?.enabled && matchesShortcut(e, pasteShortcut.keys)) {
                e.preventDefault();
                pasteNode();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [deleteSelectedElements, copyNode, pasteNode, isPreviewMode, shortcuts, shortcutsEnabled]);
};

