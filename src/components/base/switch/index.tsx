import React from 'react';
import { cn } from '../../../utils/cn';

export type SwitchSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    size?: SwitchSize;
    disabled?: boolean;
    className?: string;
}

const Switch: React.FC<SwitchProps> = ({
    checked,
    onChange,
    size = 'md',
    disabled = false,
    className,
}) => {
    const handleToggle = () => {
        if (!disabled) {
            onChange(!checked);
        }
    };

    // Size configurations
    const sizeClasses = {
        xs: {
            track: 'h-3 w-5',
            thumb: 'h-2 w-2',
            translate: 'translate-x-2',
        },
        sm: {
            track: 'h-3.5 w-6',
            thumb: 'h-2.5 w-2.5',
            translate: 'translate-x-2.5',
        },
        md: {
            track: 'h-4 w-7',
            thumb: 'h-3 w-3',
            translate: 'translate-x-3',
        },
        lg: {
            track: 'h-5 w-9',
            thumb: 'h-4 w-4',
            translate: 'translate-x-4',
        },
        xl: {
            track: 'h-6 w-11',
            thumb: 'h-5 w-5',
            translate: 'translate-x-5',
        },
    };

    const currentSize = sizeClasses[size];

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={handleToggle}
            className={cn(
                // Base styles
                'relative inline-flex shrink-0 cursor-pointer rounded-[5px] border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                // Size styles
                currentSize.track,
                // State colors
                checked ? 'bg-components-toggle-bg' : 'bg-components-toggle-bg-unchecked',
                // Disabled state
                disabled && 'cursor-not-allowed opacity-50',
                className
            )}
        >
            <span className="sr-only">Use setting</span>
            <span
                aria-hidden="true"
                className={cn(
                    // Base thumb styles
                    'pointer-events-none inline-block rounded-full bg-components-toggle-knob shadow ring-0 transition duration-200 ease-in-out',
                    // Size styles
                    currentSize.thumb,
                    // Translation
                    checked ? currentSize.translate : 'translate-x-0'
                )}
            />
        </button>
    );
};

export default Switch;
