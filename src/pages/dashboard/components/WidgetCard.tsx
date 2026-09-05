import React from 'react';

interface WidgetCardProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}

const WidgetCard: React.FC<WidgetCardProps> = ({ title, description, children, className = '' }) => {
    return (
        <div className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col ${className}`}>
            <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500">{title}</h3>
                {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
            </div>
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
};

export default WidgetCard;
