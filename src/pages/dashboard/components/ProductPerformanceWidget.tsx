import React from 'react';
import WidgetCard from './WidgetCard';
import { useResizeWidth } from '../../../hooks/useResizeWidth';

const ProductPerformanceWidget: React.FC = () => {
    const [containerRef, width] = useResizeWidth<HTMLDivElement>();

    const count = width ? Math.max(5, Math.min(25, Math.floor((width + 8) / 44))) : 5;

    const heights = React.useMemo(() => {
        const result = [];
        for (let i = 0; i < count; i++) {
            // 使用余弦与正弦组合生成流畅波动的柱状高度
            const val = Math.cos(i * 0.6) * 20 + Math.sin(i * 0.3) * 10 + 55;
            result.push(Math.max(30, Math.min(90, Math.round(val))));
        }
        return result;
    }, [count]);

    return (
        <WidgetCard title="Product Performance">
            <div className="flex flex-col h-full">
                <div className="mb-6">
                    <div className="text-2xl font-bold text-gray-900">22.8%</div>
                    <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs font-medium text-red-500 bg-red-50 px-1 py-0.5 rounded">12.5% ↓</span>
                        <span className="text-xs text-gray-400">vs yesterday</span>
                    </div>
                </div>

                <div ref={containerRef} className="flex items-end justify-between h-32 gap-2 mt-auto">
                    {heights.map((height, i) => (
                        <div
                            key={i}
                            className="w-full rounded-t-lg bg-gradient-to-b from-orange-400 to-orange-600 transition-all duration-300"
                            style={{ height: `${height}%` }}
                        />
                    ))}
                </div>
            </div>
        </WidgetCard>
    );
};

export default ProductPerformanceWidget;

