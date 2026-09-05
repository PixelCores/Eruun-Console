import React from 'react';
import WidgetCard from './WidgetCard';
import { useResizeWidth } from '../../../hooks/useResizeWidth';

const SalesRevenueWidget: React.FC = () => {
    const [containerRef, width] = useResizeWidth<HTMLDivElement>();

    const count = width ? Math.max(7, Math.min(40, Math.floor((width + 8) / 28))) : 7;

    const heights = React.useMemo(() => {
        const result = [];
        for (let i = 0; i < count; i++) {
            // 使用正弦与余弦组合生成自然波动的柱状高度 (范围大约在 20% 到 95% 之间)
            const val = Math.sin(i * 0.5) * 25 + Math.cos(i * 0.2) * 15 + 55;
            result.push(Math.max(20, Math.min(95, Math.round(val))));
        }
        return result;
    }, [count]);

    const activeIndex = Math.floor(count / 2);

    return (
        <WidgetCard title="Sales Revenue">
            <div className="flex flex-col h-full">
                <div className="mb-6">
                    <div className="text-2xl font-bold text-gray-900">$1,631,241</div>
                    <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs font-medium text-red-500 bg-red-50 px-1 py-0.5 rounded">12.5% ↓</span>
                        <span className="text-xs text-gray-400">vs yesterday</span>
                    </div>
                </div>

                <div ref={containerRef} className="flex items-end justify-between h-32 gap-2 mt-auto">
                    {heights.map((height, i) => (
                        <div
                            key={i}
                            className={`w-full rounded-t-sm transition-all duration-300 ${i === activeIndex ? 'bg-orange-500' : 'bg-gray-100'}`}
                            style={{ height: `${height}%` }}
                        />
                    ))}
                </div>
            </div>
        </WidgetCard>
    );
};

export default SalesRevenueWidget;

