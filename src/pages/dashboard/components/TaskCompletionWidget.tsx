import React from 'react';
import WidgetCard from './WidgetCard';
import { useResizeWidth } from '../../../hooks/useResizeWidth';

const TaskCompletionWidget: React.FC = () => {
    const [containerRef, width] = useResizeWidth<HTMLDivElement>();

    const count = width ? Math.max(20, Math.min(80, Math.floor((width + 4) / 8))) : 20;
    const filledCount = Math.round(count * 0.58);

    return (
        <WidgetCard title="Task Completion Rate">
            <div className="flex flex-col h-full">
                <div className="mb-6">
                    <div className="text-2xl font-bold text-gray-900">58%</div>
                    <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs font-medium text-red-500 bg-red-50 px-1 py-0.5 rounded">12.5% ↓</span>
                        <span className="text-xs text-gray-400">vs yesterday</span>
                    </div>
                </div>

                <div ref={containerRef} className="flex items-end gap-1 h-16 mt-auto">
                    {Array.from({ length: count }).map((_, i) => (
                        <div
                            key={i}
                            className={`w-full rounded-sm transition-all duration-300 ${i < filledCount ? 'bg-cyan-500' : 'bg-gray-100'}`}
                            style={{ height: '100%' }}
                        />
                    ))}
                </div>
            </div>
        </WidgetCard>
    );
};

export default TaskCompletionWidget;

