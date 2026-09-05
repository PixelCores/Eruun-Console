import React from 'react';
import { cn } from '../utils/cn';

interface FlexRowProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

const FlexRow: React.FC<FlexRowProps> = ({ children, className, ...props }) => {
    return (
        <div
            className={cn("mb-1 flex w-full items-center", className)}
            {...props}
        >
            {children}
        </div>
    );
};

export default FlexRow;
