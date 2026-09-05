import React from 'react';
import Tooltip from './Tooltip';
import { getShortcutDisplay } from '../../stores/shortcutsStore';

export interface ShortcutTooltipProps {
    /** The text label to show in the tooltip */
    label: string;
    /** The shortcut key strings, e.g. ['meta+s', 'ctrl+s']. Only the first one is displayed. */
    shortcutKeys?: string[];
    /** Position of the tooltip */
    position?: 'top' | 'bottom' | 'left' | 'right';
    /** The wrapped element */
    children: React.ReactElement;
    /** Whether to disable the tooltip */
    disabled?: boolean;
    /** Delay before showing (ms) */
    delay?: number;
}

/**
 * Returns the best shortcut string to display based on the current platform.
 * On macOS: prefers 'meta+' shortcuts; on other platforms: prefers 'ctrl+' shortcuts.
 */
export const pickShortcutForPlatform = (keys: string[]): string | undefined => {
    if (!keys || keys.length === 0) return undefined;
    const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent || navigator.platform || '');

    const preferred = isMac
        ? keys.find(k => k.toLowerCase().includes('meta') || k.toLowerCase().includes('cmd'))
        : keys.find(k => k.toLowerCase().includes('ctrl'));

    return preferred || keys[0];
};

const ShortcutTooltip: React.FC<ShortcutTooltipProps> = ({
    label,
    shortcutKeys,
    position = 'bottom',
    children,
    disabled = false,
    delay = 400,
}) => {
    const shortcutStr = shortcutKeys ? pickShortcutForPlatform(shortcutKeys) : undefined;
    const displayParts = shortcutStr ? getShortcutDisplay(shortcutStr) : [];

    const tooltipContent = (
        <div className="flex items-center gap-2">
            <span className="text-gray-700 whitespace-nowrap">{label}</span>
            {displayParts.length > 0 && (
                <div className="flex items-center gap-0.5">
                    {displayParts.map((part, idx) => (
                        <kbd
                            key={idx}
                            className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded bg-gray-100 px-1 text-[10px] font-medium text-gray-500 border border-gray-200"
                        >
                            {part}
                        </kbd>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <Tooltip
            content={tooltipContent}
            position={position}
            disabled={disabled}
            delay={delay}
        >
            {children}
        </Tooltip>
    );
};

export default ShortcutTooltip;
