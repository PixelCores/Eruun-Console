import React, { useState, useRef, useCallback, useEffect } from 'react';

export interface TooltipProps {
    /** The content to display inside the tooltip */
    content: React.ReactNode;
    /** The element that triggers the tooltip */
    children: React.ReactElement;
    /** Tooltip position relative to the trigger */
    position?: 'top' | 'bottom' | 'left' | 'right';
    /** Delay before showing the tooltip (ms) */
    delay?: number;
    /** Additional className for the tooltip container */
    className?: string;
    /** Whether the tooltip is disabled */
    disabled?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    position = 'bottom',
    delay = 300,
    className = '',
    disabled = false,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const calculatePosition = useCallback(() => {
        if (!triggerRef.current || !tooltipRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const gap = 6;

        let top = 0;
        let left = 0;

        switch (position) {
            case 'top':
                top = triggerRect.top - tooltipRect.height - gap;
                left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
                break;
            case 'bottom':
                top = triggerRect.bottom + gap;
                left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
                break;
            case 'left':
                top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
                left = triggerRect.left - tooltipRect.width - gap;
                break;
            case 'right':
                top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
                left = triggerRect.right + gap;
                break;
        }

        // Keep tooltip within viewport bounds
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (left < 8) left = 8;
        if (left + tooltipRect.width > viewportWidth - 8) left = viewportWidth - tooltipRect.width - 8;
        if (top < 8) top = 8;
        if (top + tooltipRect.height > viewportHeight - 8) top = viewportHeight - tooltipRect.height - 8;

        setCoords({ top, left });
    }, [position]);

    const showTooltip = useCallback(() => {
        if (disabled) return;
        timerRef.current = setTimeout(() => {
            setIsVisible(true);
        }, delay);
    }, [delay, disabled]);

    const hideTooltip = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setIsVisible(false);
    }, []);

    useEffect(() => {
        if (isVisible) {
            calculatePosition();
        }
    }, [isVisible, calculatePosition]);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={showTooltip}
                onMouseLeave={hideTooltip}
                onFocus={showTooltip}
                onBlur={hideTooltip}
                className={`inline-flex h-full ${className}`}
            >
                {children}
            </div>
            {isVisible && (
                <div
                    ref={tooltipRef}
                    role="tooltip"
                    style={{
                        position: 'fixed',
                        top: `${coords.top}px`,
                        left: `${coords.left}px`,
                        zIndex: 9999,
                        animation: 'tooltip-fade-in 0.15s ease-out',
                    }}
                    className="pointer-events-none"
                >
                    <div className="rounded-lg bg-white px-2.5 py-1.5 text-xs text-gray-700 shadow-lg backdrop-blur-sm border border-gray-200">
                        {content}
                    </div>
                </div>
            )}
        </>
    );
};

export default Tooltip;
