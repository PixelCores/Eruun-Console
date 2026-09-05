import React, { useState } from 'react';
import {
    useFloating,
    autoUpdate,
    offset,
    flip,
    shift,
    useDismiss,
    useRole,
    useClick,
    useInteractions,
    FloatingPortal,
    FloatingFocusManager,
    type Placement,
} from '@floating-ui/react';
import { ChevronDown } from 'lucide-react';
import { Button, type ButtonProps } from './Button';
import { cn } from '../../utils/cn';

export interface DropdownItem {
    key: string;
    label: React.ReactNode;
    icon?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
}

interface DropdownButtonProps extends Omit<ButtonProps, 'onChange' | 'onSelect'> {
    items: DropdownItem[];
    placement?: Placement;
    offsetVal?: number;
    onSelect?: (key: string) => void;
    renderItem?: (item: DropdownItem) => React.ReactNode;
}

const DropdownButton: React.FC<DropdownButtonProps> = ({
    items,
    placement = 'bottom-start',
    offsetVal = 4,
    onSelect,
    renderItem,
    children,
    className,
    ...props
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const { refs, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        placement,
        middleware: [
            offset(offsetVal),
            flip({ fallbackAxisSideDirection: 'end' }),
            shift(),
        ],
        whileElementsMounted: autoUpdate,
    });
    const { setReference, setFloating } = refs;

    const click = useClick(context);
    const dismiss = useDismiss(context);
    const role = useRole(context);

    const { getReferenceProps, getFloatingProps } = useInteractions([
        click,
        dismiss,
        role,
    ]);

    const handleSelect = (item: DropdownItem) => {
        if (item.disabled) return;
        item.onClick?.();
        onSelect?.(item.key);
        setIsOpen(false);
    };

    return (
        <>
            <Button
                ref={setReference}
                className={cn("justify-between", className)}
                {...getReferenceProps()}
                {...props}
            >
                {children}
                <ChevronDown className={cn("ml-2 h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
            </Button>
            {isOpen && (
                <FloatingPortal>
                    <FloatingFocusManager context={context} modal={false}>
                        <div
                            ref={setFloating}
                            style={floatingStyles}
                            className="z-50 min-w-[8rem] overflow-hidden rounded-md border border-components-panel-border bg-white p-1 shadow-md animate-in fade-in-0 zoom-in-95"
                            {...getFloatingProps()}
                        >
                            {items.map((item) => (
                                <button
                                    type="button"
                                    key={item.key}
                                    className={cn(
                                        "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-state-base-hover focus:bg-state-base-hover disabled:pointer-events-none disabled:opacity-50",
                                        item.className
                                    )}
                                    onClick={() => handleSelect(item)}
                                    disabled={item.disabled}
                                >
                                    {renderItem ? (
                                        renderItem(item)
                                    ) : (
                                        <>
                                            {item.icon && <span className="mr-2 h-4 w-4">{item.icon}</span>}
                                            <span>{item.label}</span>
                                        </>
                                    )}
                                </button>
                            ))}
                        </div>
                    </FloatingFocusManager>
                </FloatingPortal>
            )}
        </>
    );
};

export default DropdownButton;
