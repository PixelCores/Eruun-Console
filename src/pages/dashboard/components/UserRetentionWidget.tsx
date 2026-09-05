import React from 'react';
import WidgetCard from './WidgetCard';
import { useResizeWidth } from '../../../hooks/useResizeWidth';

const UserRetentionWidget: React.FC = () => {
    const [containerRef, width] = useResizeWidth<HTMLDivElement>();

    const cols = width ? Math.max(12, Math.min(40, Math.floor((width + 4) / 25))) : 12;
    const totalCells = cols * 4;

    const cells = React.useMemo(() => {
        const result = [];
        for (let i = 0; i < totalCells; i++) {
            const r = Math.floor(i / cols); // 行号 (0-3)
            const c = i % cols;             // 列号 (0-cols-1)

            let isFilled = false;
            if (r === 0) {
                isFilled = true; // 第一行全部填充
            } else if (r === 1) {
                isFilled = c < Math.round(cols * 0.67); // 第二行填充约 67%
            } else if (r === 2) {
                isFilled = c < Math.round(cols * 0.5);  // 第三行填充约 50%
            } else if (r === 3) {
                isFilled = c < Math.round(cols * 0.33); // 第四行填充约 33%
            }
            result.push(isFilled);
        }
        return result;
    }, [cols, totalCells]);

    return (
        <WidgetCard title="User Retention">
            <div className="flex flex-col h-full">
                <div className="mb-6">
                    <div className="text-2xl font-bold text-gray-900">24%</div>
                    <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs font-medium text-red-500 bg-red-50 px-1 py-0.5 rounded">12.5% ↓</span>
                        <span className="text-xs text-gray-400">vs last month</span>
                    </div>
                </div>

                <div
                    ref={containerRef}
                    className="grid gap-1 h-24 mt-auto transition-all duration-300"
                    style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                >
                    {cells.map((isFilled, i) => (
                        <div
                            key={i}
                            className={`rounded-sm transition-all duration-300 ${isFilled ? 'bg-cyan-400' : 'bg-cyan-100'}`}
                        />
                    ))}
                </div>
            </div>
        </WidgetCard>
    );
};

export default UserRetentionWidget;

