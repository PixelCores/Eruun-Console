import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

interface FieldCollapseProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    className?: string;
}

const FieldCollapse: React.FC<FieldCollapseProps> = ({
    title,
    children,
    defaultOpen = true,
    className
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={cn("py-4 border-b border-components-panel-border last:border-0", className)}>
            <div
                className="flex items-center justify-between px-4 cursor-pointer group"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    {title}
                </div>
                <div className="text-text-tertiary transition-colors group-hover:text-text-secondary">
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
            </div>

            {isOpen && (
                <div className="px-4 mt-3">
                    {children}
                </div>
            )}
        </div>
    );
};

export default FieldCollapse;
