/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/refs */
import {
    autoUpdate,
    flip,
    FloatingPortal,
    offset,
    shift,
    useDismiss,
    useFloating,
    useFocus,
    useHover,
    useInteractions,
    useRole,
    useClick,
    safePolygon,
} from "@floating-ui/react";
import type { Placement } from "@floating-ui/react";
import React, { cloneElement, createContext, useContext, useState } from "react";
import { cn } from "../../lib/utils";

type FloatingRefs = {
    setReference: (node: Element | null) => void;
    setFloating: (node: HTMLElement | null) => void;
};

interface PortalToFollowElemContextType {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    refs: FloatingRefs;
    floatingStyles: React.CSSProperties;
    getReferenceProps: (userProps?: React.HTMLProps<Element>) => Record<string, unknown>;
    getFloatingProps: (userProps?: React.HTMLProps<HTMLElement>) => Record<string, unknown>;
}

const PortalToFollowElemContext = createContext<PortalToFollowElemContextType | undefined>(
    undefined
);

export const usePortalToFollowElem = () => {
    const context = useContext(PortalToFollowElemContext);
    if (!context) {
        throw new Error(
            "usePortalToFollowElem must be used within a PortalToFollowElem component"
        );
    }
    return context;
};

interface PortalToFollowElemProps {
    children: React.ReactNode;
    placement?: Placement;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: "click" | "hover";
    offsetValue?: number;
}

export const PortalToFollowElem = ({
    children,
    placement = "bottom-start",
    open: controlledOpen,
    onOpenChange: setControlledOpen,
    trigger = "click",
    offsetValue = 4,
}: PortalToFollowElemProps) => {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

    const isOpen = controlledOpen ?? uncontrolledOpen;
    const setIsOpen = setControlledOpen ?? setUncontrolledOpen;

    const { refs, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        placement,
        whileElementsMounted: autoUpdate,
        middleware: [
            offset(offsetValue),
            flip({ fallbackAxisSideDirection: "end" }),
            shift(),
        ],
    });

    const hover = useHover(context, {
        enabled: trigger === "hover",
        handleClose: safePolygon(),
    });
    const click = useClick(context, {
        enabled: trigger === "click",
    });
    const focus = useFocus(context);
    const dismiss = useDismiss(context);
    const role = useRole(context);

    const { getReferenceProps, getFloatingProps } = useInteractions([
        hover,
        click,
        focus,
        dismiss,
        role,
    ]);

    return (
        <PortalToFollowElemContext.Provider
            value={{
                isOpen,
                setIsOpen,
                refs,
                floatingStyles,
                getReferenceProps,
                getFloatingProps,
            }}
        >
            {children}
        </PortalToFollowElemContext.Provider>
    );
};

export const PortalToFollowElemTrigger = ({
    children,
    asChild = false,
    className,
}: {
    children: React.ReactNode;
    asChild?: boolean;
    className?: string;
}) => {
    const { refs, getReferenceProps } = usePortalToFollowElem();
    const { setReference } = refs;

    if (asChild && React.isValidElement(children)) {
        const referenceProps = getReferenceProps(children.props as React.HTMLProps<Element>) as React.HTMLProps<Element>;
        return cloneElement(
            children,
            {
                ...referenceProps,
                ref: setReference,
                "data-state": "open", // Simplified state for demo
            } as React.HTMLProps<Element>
        );
    }

    return (
        <div
            ref={setReference}
            className={cn("inline-block", className)}
            {...getReferenceProps()}
        >
            {children}
        </div>
    );
};

export const PortalToFollowElemContent = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    const { isOpen, refs, floatingStyles, getFloatingProps } = usePortalToFollowElem();
    const { setFloating } = refs;

    if (!isOpen) return null;

    return (
        <FloatingPortal>
            <div
                ref={setFloating}
                style={floatingStyles}
                className={cn(
                    "z-50 min-w-[8rem] overflow-hidden rounded-md border border-components-panel-border bg-components-panel-bg p-1 text-text-primary shadow-md animate-in fade-in-0 zoom-in-95",
                    className
                )}
                {...getFloatingProps()}
            >
                {children}
            </div>
        </FloatingPortal>
    );
};
